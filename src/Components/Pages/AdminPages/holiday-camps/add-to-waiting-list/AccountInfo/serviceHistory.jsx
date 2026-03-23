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

const ServiceHistory = ({ serviceHistory }) => {
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
        <div className="bg-[#2E2F3E] text-white p-4 rounded-2xl flex items-center justify-between text-sm">
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
                ? "bg-green-500 text-white " :  status === 'waiting list' ? "bg-gray-300 text-black"
                : status === "pending"
                  ? "bg-yellow-500 text-white  "
                  : "bg-red-500 text-white  "
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
        <div className="flex items-center bg-[#FCF9F6] flex-col lg:flex-row">
          <div className="px-4 w-full py-2 flex-1 space-y-6">
            <div className="md:flex gap-6 justify-between items-center ">
              {/* Membership Plan */}
              <div>
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  Date Of Trial
                </div>
                <div className="font-semibold text-[16px] text-black">
                  {startDate || '-'}
                </div>
              </div>

              {/* Students */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  Students
                </div>
                <div className="text-[16px] font-semibold text-[#384455]">
                  {students?.length || 0}
                </div>
              </div>

              {/* Venue */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  Venue
                </div>
                <div className="text-[16px] font-semibold text-[#384455]">
                  {venue?.name || "-"}
                </div>
              </div>

              {/* Booking ID */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  ID
                </div>
                <div className="text-[16px] font-semibold text-[#384455]">
                  {bookingId}
                </div>
              </div>

              {/* Date of Booking */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  Date of Booking
                </div>
                <div className="text-[16px] font-semibold text-[#384455]">
                  {formatDate(createdAt, true)}
                </div>
              </div>




              {/* Booking Source */}
              <div className="block flex items-center">
                <div>
                  <div className="whitespace-nowrap font-semibold text-[14px]">
                    Booking Source
                  </div>
                  <div className="text-[16px] font-semibold text-[#384455]">
                    {(bookedBy?.firstName || bookedBy?.lastName)
                      ? `${bookedBy?.firstName ?? ''} ${bookedBy?.lastName ?? ''}`
                      : '-'}
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
                <button onClick={() => navigate('/weekly-classes/all-members/see-details')}
                  className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-2 rounded-xl text-[15px] font-medium">
                  See Details
                </button>
                <button className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-2 rounded-xl text-[15px] font-medium">
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
