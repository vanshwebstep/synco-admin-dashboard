// src/components/ServiceHistory.jsx
import React from "react";
import { useNavigate } from 'react-router-dom';

const formatDate = (dateString, withTime = false) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  const options = { month: "short", day: "2-digit", year: "numeric" };

  // "Oct 31 2025"
  const formattedDate = date
    .toLocaleDateString("en-US", options)
    .replace(/,/g, "");

  // ✅ check if time exists in original string
  const hasTime =
    typeof dateString === "string" &&
    (dateString.includes("T") || dateString.includes(":"));

  if (withTime && hasTime) {
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${formattedDate}, ${formattedTime}`;
  }

  return formattedDate;
};



const ServiceHistory = ({ serviceHistory, itemId, labels = {}, comesFrom }) => {
  if (!serviceHistory) return null;
  const navigate = useNavigate();
  console.log('dateBooked', serviceHistory)
  const {
    bookingId,
    bookedId,
    bookedBy,
    paymentData,
    status,
    createdAt,
    students,
    classSchedule,
    paymentPlan,
    attempt,
    payments,
    bookedByAdmin,
    startDate,
    dateBooked,
    title,   // header title
    icon,    // header icon
    progress // e.g. "6/12 months"
  } = serviceHistory;
  console.log('serviceHistory', serviceHistory)
  const statusStyles = {
    attended: "bg-green-500 text-white",
    active: "bg-green-500 text-white",
    rebooked: "bg-blue-500 text-white",
    waiting_list: "bg-gray-300 text-white",
    pending: "bg-yellow-500 text-white",
    cancelled: "bg-red-500 text-white",
    request_to_cancel: "bg-white text-red-500 ",
  };
  const recurringPayment = payments?.find(
    (p) => p.paymentCategory === "recurring"
  );
  return (
    <div className="transition-all duration-300 flex-1 bg-white">
      <div className="rounded-4xl w-full">
        <div className="space-y-5">
          <div className="rounded-3xl relative p-2 border border-[#D9D9D9] shadow-sm bg-white">

            {/* Header */}
            <div className="bg-[#3D444F] text-white p-4 rounded-[22px] flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {(comesFrom === "cancellation" || comesFrom === "freeTrial" || comesFrom === "membership") && (
                  <img src={icon || "/images/icons/crown.png"} alt="icon" />
                )}

                <span className="font-medium capitalize text-[20px]">
                  {title || labels.header || "Service History"}
                </span>
              </div>

              <div className="flex relative items-center gap-4">
                {/* Student Count */}
                {/* {(comesFrom === "cancellation" || comesFrom === "freeTrial" || comesFrom === "membership") && (
                  <div className="flex gap-2 items-center text-black p-2 rounded-xl flex-wrap bg-white">
                    <img
                      src="/images/accountInfoCount.png"
                      alt="student count"
                    />
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[#717073] text-[16px]">
                        {students?.length || 0}
                      </div>
                    </div>
                  </div>
                )} */}
                {/* Status */}
                {(comesFrom === "cancellation" || comesFrom === "freeTrial" || comesFrom === "membership") && (
                  <div
                    className={`flex gap-2 items-center p-2 rounded-xl flex-wrap shadow-sm ${statusStyles[status] || "bg-gray-300 text-black"
                      }`}
                  >
                    <div className="block">
                      <div className="whitespace-nowrap font-semibold capitalize text-[14px]">
                        {status ? status.replaceAll("_", " ") : "Unknown"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex items-center bg-[#FCF9F6] flex-col lg:flex-row mt-2.5 rounded-[22px]">
              <div className="px-4 w-full py-4 flex-1 space-y-6 rounded-[22px] ">
                <div className="md:flex gap-6 justify-between items-center  mt-2">

                  {/* Membership Plan */}
                  {(comesFrom === "cancellation" || comesFrom === "membership") && (
                    <div>
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.membershipPlan || "Membership Plan"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {paymentPlan?.title || "-"}
                      </div>
                    </div>
                  )}
                  {comesFrom === "freeTrial" && (
                    <div>
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.dateOfTrial || "Date of "}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {formatDate(serviceHistory?.trialDate) || "-"}
                      </div>
                    </div>
                  )}
                  {/* Students */}
                  {(comesFrom === "cancellation" || comesFrom === "freeTrial" || comesFrom === "membership") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.students || "Students"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {students?.length || 0}
                      </div>
                    </div>
                  )}



                  {/* Venue */}
                  {(comesFrom === "cancellation" || comesFrom === "freeTrial" || comesFrom === "membership") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.venue || "Venue"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {serviceHistory?.venue?.name || "-"}
                      </div>
                    </div>
                  )}
                  {(comesFrom === "cancellation") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.membershipStartDate || "Membership Start Date"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {serviceHistory?.startDate || "-"}
                      </div>
                    </div>
                  )}
                  {(comesFrom === "cancellation") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.cancellationReason || "Membership Start Date"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {serviceHistory?.cancelData?.cancelReason || serviceHistory?.cancelData?.reasonForCancelling || "-"}
                      </div>
                    </div>
                  )}
                  {(comesFrom === "cancellation") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.cancellationDate || "Membership Start Date"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {formatDate(serviceHistory?.cancelData?.cancelDate) || "-"}
                      </div>
                    </div>
                  )}


                  {/* Booking ID */}
                  {(comesFrom === "freeTrial" || comesFrom === "membership") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.bookingId || "Booking ID"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {bookedId || bookingId || "-"}
                      </div>
                    </div>
                  )}
                  {(comesFrom === "freeTrial") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.trialAttempt || "Trial Attempt"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {attempt || "-"}
                      </div>
                    </div>
                  )}

                  {(comesFrom === "membership") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.price || "Price"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {recurringPayment?.price ? (
                          <>£{recurringPayment.price}</>
                        ) : paymentPlan?.price ? (
                          <>£{paymentPlan.price}</>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  )}

                  {(comesFrom === "cancellation" || comesFrom === "freeTrial" || comesFrom === "membership") && (
                    <div className="block pr-3">
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.dateOfBooking || "Date of Booking"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {serviceHistory?.startDate
                          ? formatDate(serviceHistory.startDate, true)
                          : dateBooked
                            ? formatDate(dateBooked, true)
                            : createdAt
                              ? formatDate(createdAt, true)
                              : "—"}                      </div>
                    </div>
                  )}





                  {/* Date of Booking */}




                  {/* Progress */}

                  {/* {(comesFrom === "membership") && (
                    <div>
                      <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                        {labels.coach || "Coach"}
                      </div>
                      <div className="font-semibold text-[16px]  text-[#282829]">
                        {bookedByAdmin?.firstName} {bookedByAdmin?.lastName}
                      </div>
                    </div>
                  )} */}


                  {/* Booking Source */}
                  {(comesFrom === "cancellation" || comesFrom === "freeTrial" || comesFrom === "membership") && (
                    <div className="block flex items-center">
                      <div>
                        <div className="whitespace-nowrap font-semibold text-[14px] text-[#717073] mb-1">
                          {labels.bookingSource || "Booking Source"}
                        </div>
                        <div className="font-semibold text-[16px]  text-[#282829]">
                          {
                            bookedBy?.firstName
                              ? `${bookedBy.firstName} ${bookedBy?.lastName || ""}`
                              : bookedByAdmin?.firstName
                                ? `${bookedByAdmin.firstName} ${bookedByAdmin?.lastName || ""}`
                                : paymentData?.firstName
                                  ? `${paymentData.firstName} ${paymentData?.lastName || ""}`
                                  : ""
                          }

                        </div>

                      </div>
                      <div>
                        <img
                          src="/images/icons/threeDot.png"
                          alt="options"
                          className="pl-4"
                        />
                      </div>
                    </div>
                  )}


                </div>

                {/* Buttons */}
                <div className="flex flex-col w-full space-y-4">
                  <div className="flex gap-2 flex-wrap justify-start">
                    {(labels.buttons || [
                      "See Details",
                      "Credits",
                      "Attendance",
                      "See Payments",
                    ]).map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          let tab = "General";

                          if (btn === "Attendance") tab = "Attendance";
                          if (btn === "See Payments") tab = "History of Payments";
                          if (btn === "Credits") tab = "Credits";
                          if (btn === "See details") tab = "General";

                          navigate(`/weekly-classes/all-members/see-details?id=${itemId || serviceHistory.id || ""}`, {
                            state: {
                              itemId: comesFrom === "membership"
                                ? serviceHistory.bookingId
                                : serviceHistory.id || "",

                              memberInfo: comesFrom,
                              defaultTab: tab, // ✅ important
                            },
                          });
                        }}
                        className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-2 rounded-xl text-[15px] font-medium"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* End Content */}
          </div>
        </div>
      </div>
    </div>

  );
};

export default ServiceHistory;
