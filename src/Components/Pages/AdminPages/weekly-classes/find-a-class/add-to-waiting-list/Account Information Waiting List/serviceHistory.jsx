// src/components/ServiceHistory.jsx
import React from "react";
import { useNavigate } from 'react-router-dom';

const formatDate = (dateString, withTime = false) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };
  if (withTime) {
    return (
      date.toLocaleDateString("en-US", options) +
      ", " +
      date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
  }
  return date.toLocaleDateString("en-US", options);
};

const ServiceHistory = ({ serviceHistory, itemId, labels = {}, comesFrom }) => {
  if (!serviceHistory || serviceHistory.length === 0) return null;
  const {
    bookingId,
    status,
    trialDate,
    dateBooked,
    createdAt,
    students,
    venue,
    startDate,
    paymentPlan,
    payments,
    bookedBy,
    source,
    bookedByAdmin,
  } = serviceHistory;
  console.log('status', status)
  // pick first payment if exists
  const payment = payments?.[0];
  const navigate = useNavigate();

  // Conditional ID based on payment type
  let transactionId = "-";
  if (payment?.paymentType === "card") {
    transactionId = payment?.gatewayResponse?.transaction?.transactionId || "-";
  } else if (payment?.paymentType === "rrn") {
    transactionId = payment?.gatewayResponse?.billing_requests?.id || "-";
  }
  return (
    <div className="transition-all duration-300 flex-1  bg-white space-y-6">
      <div className="rounded-3xl relative p-2 border border-[#D9D9D9] shadow-sm bg-white">
        {/* Header */}
        <div className="bg-[#3D444F] text-white p-4 rounded-[22px] flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <img src="/images/icons/crown.png" alt="" />
            <span className="font-medium text-[20px] capitalize">{serviceHistory.serviceType}</span>
          </div>
          <div className="flex relative items-center gap-4">
            {/* Student Count */}
            {/* <div className="flex gap-2 items-center text-black p-2 rounded-xl flex-wrap bg-white">
              <img src="/images/accountInfoCount.png" alt="Back" />
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[#717073] text-[16px]">
                  {students?.length || 0}
                </div>
              </div>
            </div> */}
            {/* Status */}
            <div
              className={`flex gap-2 items-center p-2 rounded-xl flex-wrap  ${status === "active"
                ? "bg-[#12B76A] text-white " : status === 'waiting list' ? "bg-gray-300 text-black"
                  : status === "pending"
                    ? "bg-yellow-500 text-white  "
                    : "bg-[#F04438] text-white  "
                }`}
            >
              <div className="block">
                <div className="whitespace-nowrap capitalize font-semibold text-[16px]">
                  {status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Venue Content */}
        <div className="flex items-center bg-[#FCF9F6] flex-col lg:flex-row mt-2.5 rounded-[22px]">
          <div className="px-4 w-full py-4 flex-1 space-y-6 rounded-[22px] ">
            <div className="md:flex gap-6 justify-between items-center  mt-2">


              {/* Students */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                  Students
                </div>
                <div className="font-semibold text-[16px]  text-[#282829]">
                  {students?.length || 0}
                </div>
              </div>

              {/* Venue */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                  Venue
                </div>
                <div className="font-semibold text-[16px]  text-[#282829]">
                  {venue?.name || "-"}
                </div>
              </div>

              {/* Booking ID */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                  ID
                </div>
                <div className="font-semibold text-[16px]  text-[#282829]">
                  {bookingId}
                </div>
              </div>

              {/* Date of Booking */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                  Date of Booking
                </div>
                <div className="font-semibold text-[16px]  text-[#282829]">
                  {formatDate(createdAt, true)}
                </div>
              </div>




              {/* Booking Source */}
              <div className="block flex items-center">
                <div>
                  <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                    Booking Source
                  </div>
                  <div className="font-semibold text-[16px]  text-[#282829]">
                 {
  source
    ? source
    : bookedBy?.firstName || bookedBy?.lastName
    ? `${bookedBy?.firstName ?? ''} ${bookedBy?.lastName ?? ''}`.trim()
    : '-'
}
                  </div>

                </div>
                <div>
                  <img
                    src="/images/icons/threeDot.png"
                    alt=""
                    className="pl-4"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col w-full space-y-4">
              <div className="flex gap-2 flex-wrap justify-start">
                <button onClick={() => navigate(`/weekly-classes/all-members/see-details?id=${itemId || serviceHistory.id || ""}`, {
                  state: { itemId: serviceHistory.id, memberInfo: "waitingList" },
                })}
                  className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-2 rounded-xl text-[15px] font-medium">
                  See Details
                </button>
                <button
                  onClick={() => navigate(`/weekly-classes/all-members/see-details?id=${itemId || serviceHistory?.id || ""}`, {
                    state: { itemId: itemId || serviceHistory?.id, memberInfo: "waitingList", defaultTab: "Attendance" },
                  })}
                  className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-2 rounded-xl text-[15px] font-medium">
                  Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceHistory;
