import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import Select from "react-select";
import { Check, Plus } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccountsInfo } from "../../contexts/AccountsInfoContext";


const renderImage = (type) => {
  const images = {
    "Weekly Classes Membership": "/images/icons/crown.png",
    "birthday party": "/images/icons/birthday.png",
    "One to One Booking": "/images/icons/one-to-one.png",
    "holiday camp": "/images/icons/crown.png",
    "Merchandise": "/images/icons/crown.png",
  };
  return images[type] || "/images/icons/crown.png";
};

// Render field helper
const renderField = (label, value) => {
  return (
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="mt-1 font-semibold truncate ">{value}</p>
    </div>
  );
};

const BookingCard = ({ bookingInfo, booking }) => {
  const { data } = useAccountsInfo();
  console.log('data', data, bookingInfo, booking)

  const navigate = useNavigate();
  const statusColors = {
    active: "bg-green-500 text-white",
    expired: "bg-red-500 text-white",
    cancelled: "bg-red-500 text-white",
    cancel: "bg-red-500 text-white",
    pending: "bg-orange-500 text-white",
     "waiting list": "bg-gray-200 text-black",
  };

  return (
    <div className="bg-white rounded-2xl shadow p-3 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#3D444F] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <img
            src={renderImage(bookingInfo?.serviceType)}
            alt={bookingInfo?.serviceType}
            className="w-8 h-8 rounded-full"
          />
          <h3 className="text-white font-semibold capitalize">{bookingInfo?.serviceType} Booking</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 flex items-center gap-2 rounded-lg text-sm bg-white">
            <img
              src="/images/points.png"
              alt=""
              className="w-5 h-5 rounded-full"
            />{" "}
            396
          </button>
          <span
            className={`px-3 py-2 rounded-lg capitalize text-sm ${statusColors[data.status]}`}
          >
            {data.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-[#FCF9F6] rounded-2xl p-4 mt-4">
        <div className={`grid grid-cols-1 relative sm:grid-cols-2 lg:grid-cols-8 gap-8 mb-4`}>
          {/* {booking?.serviceType === "membership plan" && (
            <>
              {renderField("Membership Plan", booking?.paymentPlan?.title)}
              {renderField("Students", booking?.paymentPlan?.students)}
              {renderField("Venue", booking?.address)}
              {renderField("KGo/Cardless ID", booking?.id)}
              {renderField("Monthly Price", booking?.paymentPlan?.price)}
              {renderField("Date Of Booking",
                new Date(booking?.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,   // 24-hour format; set true for AM/PM format
                })
              )}
              {renderField("Date Of Party",
                new Date(booking?.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,   // 24-hour format; set true for AM/PM format
                })
              )}
              {renderField("Progress", booking?.progress)}
              {renderField("Booking Source", booking?.source)}
            </>
          )}

          {booking?.serviceType === "birthday party" && (
            <>
              {renderField("Package", booking?.paymentPlan?.title)}
              {renderField("Price Paid", `${'£' + booking?.paymentPlan?.price + '.00'}`)}
              {renderField("Stripe Transaction ID", booking?.payment?.stripeChargeDetails?.id)}
              {renderField(
                "Date of Booking",
                new Date(booking?.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Kolkata",
                })
              )}

              {renderField(
                "Date of Party",
                new Date(bookingInfo?.partyDate).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Kolkata",
                })
              )}

              {renderField("Coach", `${booking.coach.firstName} ${booking.coach.lastName}`
              )}
              {renderField("Booking Source", bookingInfo?.source)}
            </>
          )}

          {booking?.serviceType === "One to One Booking" && (
            <>
              {renderField("Package", data.packageInterest)}
              {renderField("Students", data.booking?.students.length)}
              {renderField("Price Paid", `${'£' + data.booking?.paymentPlan?.price + '.00'}`)}
              {renderField("Stripe Transaction ID", data.booking?.payment.stripePaymentIntentId)}
              {renderField("Date of Booking",
                new Date(data.booking?.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,   // 24-hour format; set true for AM/PM format
                })
              )}
              {renderField("Date Of Party",
                new Date(data.partyDate).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,   // 24-hour format; set true for AM/PM format
                })
              )}
              {renderField("Venue", data.booking?.address)}
              {renderField("Coach", `${data.booking?.coach.firstName} ${data.booking?.coach.lastName}`)}
              {renderField("Booking Source", data.source)}
            </>
          )} */}

          {data?.serviceType === "holiday camp" && (
            <>
              {renderField("Camp", data?.holidayCamp?.name)}
              {renderField("Students", data?.totalStudents)}
              {renderField("Price Paid", `${'£' + data?.payment?.amount + ''}`)}
              {renderField("Stripe Transaction ID", data?.payment?.gatewayResponse.fullResponse.balance_transaction.id)}
              {renderField("Date of Booking", new Date(data?.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,   // 24-hour format; set true for AM/PM format
              }))}

              {renderField("Venue", data?.holidayVenue?.name)}
              {renderField("Discount", data?.payment?.discount_amount)}
              {renderField("Booking Source", data?.bookedByAdmin?.firstName + " " + data?.bookedByAdmin?.lastName)}
            </>
          )}

          {/* {booking?.serviceType === "Merchandise" && (
            <>
              {renderField("Item", booking?.item)}
              {renderField("Quantity", booking?.quantity)}
              {renderField("Price Paid", `${'£' + booking?.pricePaid + '.00'}`)}
              {renderField("Transaction ID", booking?.transactionID)}
              {renderField("Date of Booking", new Date(booking?.bookingDate).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,   // 24-hour format; set true for AM/PM format
              }))}
              {renderField("Discount", booking?.discount)}
              {renderField("Fulfillment Status", booking?.fulfillment)}
              {renderField("Booking Source", booking?.source)}
            </>
          )} */}
          <button className="ml-auto absolute right-0 top-3 text-gray-500 hover:text-gray-800">
            <FaEllipsisV />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={() => navigate(`/holiday-camp/members/account-information/see-details?id=${data?.id}`)} className="px-4 py-2 border border-gray-800 rounded-xl text-sm hover:bg-gray-50">
            See details
          </button>
          {booking?.serviceType !== "Merchandise" && (
            <>
              <button className="px-4 py-2 border border-gray-800 rounded-xl text-sm hover:bg-gray-50">
                See payments
              </button>

            </>
          )}

        </div>
      </div>
    </div>
  );
};

const ServiceHistory = () => {
  const { data } = useAccountsInfo();


  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterModalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterModalRef.current &&
        !filterModalRef.current.contains(event.target)
      ) {
        setShowFilterModal(false);
      }
    };

    if (showFilterModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterModal]); const servicesTypes = [
    // { value: "Weekly Classes Membership", label: "Weekly Classes Membership" },
    // { value: "Birthday Party Booking", label: "Birthday Party Booking" },
    { value: "One to One Booking", label: "One to One Booking" },
    // { value: "Holiday Camp", label: "Holiday Camp" },
    // { value: "Merchandise", label: "Merchandise" },
  ];
  const filterOptions = [
    { label: "All Time", key: "thisyear", apiParam: "period", apiValue: "thisyear" },
    { label: "Weekly Classes", key: "thismonth", apiParam: "period", apiValue: "thismonth" },
    { label: "Club", key: "thisweek", apiParam: "period", apiValue: "thisweek" },
    { label: "One To One", key: "lastyear", apiParam: "period", apiValue: "lastyear" },
    { label: "Merchandise", key: "lastmonth", apiParam: "period", apiValue: "lastmonth" },
    { label: "All purchases", key: "lastweek", apiParam: "period", apiValue: "lastweek" },
    { label: "Birthday", key: "birthday", apiParam: "period", apiValue: "birthday" },
  ];
  const [checkedStatuses, setCheckedStatuses] = useState(
    filterOptions.reduce((acc, option) => ({ ...acc, [option.key]: false }), {})
  );
  const handleCheckboxChange = (key) => {
    setCheckedStatuses((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const getDaysArray = () => {
    const startDay = new Date(year, month, 1).getDay(); // Sunday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    const offset = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < offset; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const calendarDays = getDaysArray();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isSameDate = (d1, d2) =>
    d1 &&
    d2 &&
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const isInRange = (date) =>
    fromDate && toDate && date && date >= fromDate && date <= toDate;

  const handleDateClick = (date) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(date);
      setToDate(null);
    } else if (fromDate && !toDate) {
      if (date < fromDate) {
        setFromDate(date);
      } else {
        setToDate(date);
      }
    }
  };

  const applyFilter = () => {
    // console.log("▶️ applyFilter called");

    // validate custom date range
    const isValidDate = (d) => d instanceof Date && !isNaN(d.valueOf());
    const hasRange = isValidDate(fromDate) && isValidDate(toDate);
    const range = hasRange ? [fromDate, toDate] : [];

    // console.log("📅 final range:", range);
    setShowFilterModal(null)

    // collect selected filters (can be multiple)
    const selectedFilters = Object.keys(checkedStatuses).filter(
      (key) => checkedStatuses[key]
    );
    // console.log("🔎 selectedFilters:", selectedFilters);

    // call fetchDashboard with params
    fetchDashboard({
      studentName: "",
      venueName: "",
      filterTypes: selectedFilters,  // array
      fromDate: hasRange ? fromDate.toISOString().split("T")[0] : null,
      toDate: hasRange ? toDate.toISOString().split("T")[0] : null,
    });
  };
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleModalChange = (field, value) => {
    setSelectedBooking(value);
  };

  const handleAddStudent = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="absolute right-0 -top-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-2  items-center    p-2 rounded-xl flex-wrap bg-white">
            <img
              src="/images/points.png"
              alt="Back"
              className="md:w-10 md:h-10 w-6 h-6"
            />
            <div className="block">
              <div className="whitespace-nowrap font-semibold text-[#717073] text-[14px]">Total Points</div>
              <div className="text-[20px] font-semibold text-[#384455]">543</div>
            </div>
          </div>

          <div className="flex gap-2  items-center    p-2 rounded-xl flex-wrap bg-white">
            <img
              src="/images/totalPoints.png"
              alt="Back"
              className="md:w-11 md:h-11 w-6 h-6"
            />
            <div className="block">
              <div className="whitespace-nowrap font-semibold text-[#717073] text-[14px]">Total Payments</div>
              <div className="text-[20px] font-semibold text-[#384455]">£0.00</div>
            </div>
          </div>

          <div onClick={() => setShowFilterModal(true)} className="flex gap-4  items-center    p-2 rounded-xl flex-wrap bg-white">
            <img
              src="/images/filterGray.png"
              alt="Back"
              className=""
            />
            <div className="block  pr-3" >
              <div className="whitespace-nowrap font-semibold text-[#717073] text-[16px]">Filters</div>
            </div>
          </div>
          <button
            onClick={handleAddStudent}
            className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px]  font-semibold"
          >
            <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
            Add booking?
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-100 min-h-screen">

        <BookingCard bookingInfo={data} booking={data.booking} />



        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-[#10101094] bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[95%] max-w-lg shadow-lg relative">
              <div className="gap-7 relative border-b border-gray-300 pb-3 mb-5">
                <h3 className="text-xl font-semibold text-center text-[#282829]">Add Booking</h3>
                <button
                  className="p-2 border-none absolute left-3 top-0"
                  onClick={() => setShowModal(false)}
                >
                  <RxCross2 />
                </button>
              </div>

              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Please Select Service Type</label>
                <Select
                  className="mt-1"
                  classNamePrefix="react-select"
                  value={servicesTypes.find((o) => o.value === selectedBooking) || null}
                  onChange={(selected) => handleModalChange("booking?", selected ? selected.value : "")}
                  options={servicesTypes}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  className="px-6 py-3 bg-[#237FEA] text-white rounded-xl hover:bg-[#1e6fd2] transition"
                  onClick={handleAddStudent}
                >
                  Continue To Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {showFilterModal && (
          <div className="fixed inset-0  bg-[#10101094] bg-opacity-40 flex items-center justify-end z-50">

            <div ref={filterModalRef} className="bg-white rounded-xl p-4 mt-15 mr-5 md:max-w-[508px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="font-semibold text-[20px] sm:text-[24px]">Filter</h3>
                <button onClick={applyFilter} className="flex gap-2 items-center bg-blue-500 text-white px-3 py-2 rounded-lg text-sm text-[16px]">
                  <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                  Apply fiter
                </button>
              </div>

              <div className="gap-2 text-sm bg-gray-100 p-4 my-6 rounded">
                <label className="font-semibold text-[16px] sm:text-[18px] block mb-3">Choose type</label>
                <div className="grid md:grid-cols-3 gap-3">

                  {filterOptions.map(({ label, key }) => (
                    <label key={key} className="flex items-center  text-[16px] font-semibold gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="peer hidden"
                        checked={checkedStatuses[key]}
                        onChange={() => handleCheckboxChange(key)}
                      />
                      <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                        <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                      </span>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                {/* Header */}
                <div className="flex justify-center gap-5 items-center mb-3">
                  <button
                    onClick={goToPreviousMonth}
                    className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <p className="font-semibold text-[20px]">
                    {currentDate.toLocaleString("default", { month: "long" })} {year}
                  </p>
                  <button
                    onClick={goToNextMonth}
                    className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 text-xs gap-1 text-[18px] text-gray-500 mb-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, indx) => (
                    <div key={indx} className="font-medium text-center">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Weeks */}
                <div className="flex flex-col  gap-1">
                  {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                    const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);


                    return (
                      <div
                        key={weekIndex}
                        className="grid grid-cols-7 text-[18px] h-12 py-1  rounded"
                      >
                        {week.map((date, i) => {
                          const isStart = isSameDate(date, fromDate);
                          const isEnd = isSameDate(date, toDate);
                          const isStartOrEnd = isStart || isEnd;
                          const isInBetween = date && isInRange(date);
                          const isExcluded = !date; // replace with your own excluded logic

                          let className =
                            " w-full h-12 aspect-square flex items-center justify-center transition-all duration-200 ";
                          let innerDiv = null;

                          if (!date) {
                            className += "";
                          } else if (isExcluded) {
                            className +=
                              "bg-gray-300 text-white opacity-60 cursor-not-allowed";
                          } else if (isStartOrEnd) {
                            // Outer pill connector background
                            className += ` bg-sky-100 ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""
                              }`;
                            // Inner circle but with left/right rounding
                            innerDiv = (
                              <div
                                className={`bg-blue-700 rounded-full text-white w-12 h-12 flex items-center justify-center font-bold
                         
                         `}
                              >
                                {date.getDate()}
                              </div>
                            );
                          } else if (isInBetween) {
                            // Middle range connector
                            className += "bg-sky-100 text-gray-800";
                          } else {
                            className += "hover:bg-gray-100 text-gray-800";
                          }

                          return (
                            <div
                              key={i}
                              onClick={() => date && !isExcluded && handleDateClick(date)}
                              className={className}
                            >
                              {innerDiv || (date ? date.getDate() : "")}
                            </div>
                          );
                        })}
                      </div>

                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default ServiceHistory;
