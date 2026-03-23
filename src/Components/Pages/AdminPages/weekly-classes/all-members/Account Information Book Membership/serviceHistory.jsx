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
    students,
    venue,
    paymentPlan,
    paymentData,
    bookedByAdmin,
  } = serviceHistory;
   console.log('status', status)
  // pick first payment if exists
  const payment = paymentData;
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
            <span className="font-medium text-[20px]">Weekly Classes Membership</span>
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
              className={`flex gap-2 items-center p-2 rounded-xl flex-wrap ${status === "active"
                  ? "bg-green-500"
                  : status === "pending"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
            >
              <div className="block">
                <div className="whitespace-nowrap capitalize font-semibold text-white text-[16px]">
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
                  Membership Plan
                </div>
                <div className="font-semibold text-[16px] text-black">
                  {paymentPlan?.title}
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
                  {serviceHistory?.venue?.name || "-"}
                </div>
              </div>

              {/* Booking ID */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  {payment?.paymentType === "card"
                    ? "KGoCardless ID"
                    : payment?.paymentType === "rrn"
                      ? "Stripe Transaction Id"
                      : "Booking ID"}
                </div>
                <div className="text-[16px] font-semibold text-[#384455]">
                  {transactionId}
                </div>
              </div>

              {/* Date of Booking */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  Date of Booking
                </div>
                <div className="text-[16px] font-semibold text-[#384455]">
                  {formatDate(dateBooked, true)}
                </div>
              </div>

              {/* Date of Party */}
              <div className="block pr-3">
                <div className="whitespace-nowrap font-semibold text-[14px]">
                  Date of Party
                </div>
                <div className="text-[16px] font-semibold text-[#384455]">
                  {formatDate(trialDate)}
                </div>
              </div>

              {/* Coach */}
              <div className="block flex items-center">
                <div>
                  <div className="whitespace-nowrap font-semibold text-[14px]">
                    Coach
                  </div>
                  <div className="text-[16px] font-semibold text-[#384455]">
                    {bookedByAdmin?.firstName} {bookedByAdmin?.lastName}
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

              {/* Booking Source */}
              <div className="block flex items-center">
                <div>
                  <div className="whitespace-nowrap font-semibold text-[14px]">
                    Booking Source
                  </div>
                  <div className="text-[16px] font-semibold text-[#384455]">
                    {paymentData?.firstName} {paymentData?.lastName}
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
