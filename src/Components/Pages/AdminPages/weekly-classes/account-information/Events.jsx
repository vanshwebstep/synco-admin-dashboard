import React, { useState } from "react";
import { CalendarDays, Download, Check } from "lucide-react"; // Lucide icon for calendar
import { ChevronLeft, ChevronRight } from "lucide-react";
const activities = [
  {
    id: 1,
    type: "system",
    title: "Lead Generated",
    description: "Lead has been generated through Facebook",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
  {
    id: 2,
    type: "system",
    title: "Book Free Trial",
    description: "Ashiq has booked a free trial through the website",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
  {
    id: 3,
    type: "system",
    title: "Cancel Membership",
    description: "Ashiq has cancelled the memberships",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
  {
    id: 4,
    type: "user",
    name: "Nilio Bagga",
    avatar: "https://i.pravatar.cc/40?img=3",
    description: "Nelio booked Ashiq for a free trial in Chelsea",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
  {
    id: 5,
    type: "user",
    name: "Nilio Bagga",
    avatar: "https://i.pravatar.cc/40?img=3",
    description: "Coach Nelio marked them in as attended",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
  {
    id: 6,
    type: "user",
    name: "Nilio Bagga",
    avatar: "https://i.pravatar.cc/40?img=3",
    description: "Nelio sold 12 month membership plan",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
  {
    id: 7,
    type: "user",
    name: "Nilio Bagga",
    avatar: "https://i.pravatar.cc/40?img=3",
    description: "Nelio cancelled 12 month membership plan",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
  {
    id: 8,
    type: "user",
    name: "Nilio Bagga",
    avatar: "https://i.pravatar.cc/40?img=3",
    description: "Coach Nilio had a telephone call with call agent Benton",
    date: "Monday 23rd June, 8:54am",
    tag: "Call",
    buttons: ["Hear Call", "Download Call", "Call"],
  },
  {
    id: 9,
    type: "user",
    name: "Nilio Bagga",
    avatar: "https://i.pravatar.cc/40?img=3",
    description: "Give a negative feedback",
    date: "Monday 23rd June, 8:54am",
    tag: "General",
  },
];

const Events = () => {

  const filterOptions = [
    { label: "All Time", key: "ALLTIME", apiParam: "period", apiValue: "thisyear" },
    { label: "All Events", key: "thismonth", apiParam: "period", apiValue: "thismonth" },
    { label: "Feedback", key: "thisweek", apiParam: "period", apiValue: "thisweek" },
    { label: "Calls", key: "lastyear", apiParam: "period", apiValue: "lastyear" },
    { label: "General", key: "lastmonth", apiParam: "period", apiValue: "lastmonth" },
    { label: "Communication", key: "lastweek", apiParam: "period", apiValue: "lastweek" },
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

  return (
    <div className="md:flex gap-8">
      <div className="bg-white shadow-sm rounded-2xl p-6 md:w-8/12">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex justify-between items-start py-4 border-b border-[#E2E1E5] last:border-0`}
          >
            <div className="flex items-start gap-3">
              {activity.type === "system" ? (
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-blue-500" />
                </div>
              ) : (
                <img
                  src={activity.avatar}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}

              <div>
                <h4 className="text-gray-900 font-semibold text-[16px]">
                  {activity.type === "user" ? activity.name : activity.title}
                </h4>
                <p className="text-[#717073] font-semibold text-[14px] mt-0.5">{activity.description}</p>

                {/* Optional Buttons for Call Activity */}

              </div>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="text-[#717073] font-semibold text-[14px]">{activity.date}</span>

              {activity.buttons ? (
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 text-sm rounded-md bg-[#237FEA]  text-white font-medium">
                    Hear Call
                  </button>
                  <button className="px-3 py-1 text-sm rounded-md bg-[#237FEA]  text-white font-medium">
                    Download Call
                  </button>
                  <button className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-600 font-medium">
                    Call
                  </button>
                </div>
              ) : (
                <span className="mt-1 text-[14px] font-semibols text-[#EDA600] bg-[#FDF6E5] px-3 py-2 rounded-xl">
                  {activity.tag}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="md:w-4/12 md:mt-0 mt-4">
        <div className="bg-white rounded-xl p-4 ">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-semibold text-[20px] sm:text-[24px]">Filter Event</h3>
            <button onClick={applyFilter} className="flex gap-2 items-center bg-blue-500 text-white px-3 py-2 rounded-lg text-sm text-[16px]">
              <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
              Apply fiter
            </button>
          </div>

          <div className="gap-2 text-sm bg-gray-100 p-4 my-6 rounded-md">
            <label className="font-semibold text-[16px] sm:text-[18px] block mb-3">Choose type</label>
            <div className="grid grid-cols-3 gap-3">

              {filterOptions.map(({ label, key }) => (
                <label key={key} className="flex items-center w-full text-[16px] font-semibold gap-3 cursor-pointer">
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
        <div className="flex justify-end w-full">
          <button className="mt-6 bg-[#237FEA] hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-3 px-5 py-2 rounded-lg shadow-sm">
            <Download size={16} />
            Export data
          </button>
        </div>
      </div>

    </div>
  );
};

export default Events;
