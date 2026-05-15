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
  if (!serviceHistory) return null;
  const navigate = useNavigate();

  const {
    bookingId,
    trialDate,
    bookedBy,
    status,
    createdAt,
    students,
    classSchedule,
  } = serviceHistory;

  return (
    <div className="transition-all duration-300 flex-1  bg-white">
      <div className="rounded-4xl w-full">
        <div className="space-y-5">
          <div className="rounded-3xl relative p-2 border border-[#D9D9D9] shadow-sm bg-white">
            {/* Header */}
            <div className="bg-[#3D444F] text-white p-4 rounded-[22px] flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <img src="/images/icons/crown.png" alt="" />
                <span className="font-medium text-[20px]">
                  Weekly Classes Trial
                </span>
              </div>
              <div className="flex relative items-center gap-4">
                {/* Student Count */}
                {/* <div className="flex gap-2 items-center text-black p-2 rounded-xl flex-wrap bg-white">
                  <img
                    src="/images/accountInfoCount.png"
                    alt="Back"
                  />
                  <div className="block pr-3">
                    <div className="whitespace-nowrap font-semibold text-[#717073] text-[16px]">
                      {students?.length || 0}
                    </div>
                  </div>
                </div> */}
                {/* Status */}
                <div
                  className={`flex gap-2 items-center p-2 rounded-xl flex-wrap ${status === "attended"
                    ? "bg-[#12B76A]"
                    : status === "pending"
                      ? "bg-yellow-500"
                      : "bg-[#F04438]"
                    }`}
                >
                  <div className="block">
                    <div className="whitespace-nowrap font-semibold text-white text-[16px]">
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
                  {/* Trial Date */}
                  <div>
                    <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                      Date of Trial
                    </div>
                    <div className="font-semibold text-[16px]  text-[#282829]">
                      {formatDate(trialDate)}
                    </div>
                  </div>

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
                      {classSchedule?.venue?.name || "-"}
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

                  {/* Trial Attempt (hardcoded to 1 for now) */}
                  <div className="block pr-3">
                    <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                      Trial Attempt
                    </div>
                    <div className="font-semibold text-[16px]  text-[#282829]">
                      1
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
                        {bookedBy?.firstName} {bookedBy?.lastName}
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
                    <button onClick={() => navigate('/weekly-classes/all-members/see-details')} className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-2 rounded-xl text-[15px] font-medium">
                      See Details
                    </button>
                    <button className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-2 rounded-xl text-[15px] font-medium">
                      Attendance
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* End Venue */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceHistory;
