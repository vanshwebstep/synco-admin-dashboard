import React from 'react'
import { useState } from 'react';
import { Search, Bell, ChevronUp } from 'lucide-react';
import { CalendarDays, Check, Users, ShoppingCart, LineChart, Star, AlertCircle, BarChart, Smile, Briefcase, Calendar, Plus } from "lucide-react";
import { Circle, MoreHorizontal } from 'lucide-react';
import { Sliders } from 'lucide-react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AlertOctagon } from 'lucide-react';



const userDashboard = () => {
  const metrics = [
    { icon: <img src="/DashboardIcons/user-group.png" alt="Total Students" className="w-6 h-6" />, title: "Total Students", value: 2504, bg: "bg-gray-100" },
    { icon: <img src="/DashboardIcons/calendar-03.png" alt="Trials Booked" className="w-6 h-6" />, title: "Trials Booked", value: 1892, bg: "bg-pink-100" },
    { icon: <img src="/DashboardIcons/cancel-02.png" alt="Cancellations" className="w-6 h-6" />, title: "Cancellations", value: 453, bg: "bg-red-100", showIcons: true },
    { icon: <img src="/DashboardIcons/dollar-circle.png" alt="Revenue" className="w-6 h-6" />, title: "Revenue", value: "£98,283", bg: "bg-rose-100" },
    { icon: <img src="/DashboardIcons/chart.png" alt="Capacity" className="w-6 h-6" />, title: "Capacity", value: 345, bg: "bg-yellow-100" },
    { icon: <img src="/DashboardIcons/user-add--01.png" alt="Growth" className="w-6 h-6" />, title: "Growth", value: 343, bg: "bg-orange-100", showIcons: true },
    { icon: <img src="/DashboardIcons/customer-support.png" alt="Customer Satisfaction" className="w-6 h-6" />, title: "Customer Satisfaction", value: 4.3, bg: "bg-green-100" },
    { icon: <img src="/DashboardIcons/shopping-cart.png" alt="Merchandise Sales" className="w-6 h-6" />, title: "Merchandise Sales", value: "£37,812", bg: "bg-cyan-100" },
  ];



  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 11));
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

  return (
    <>
      <div className="bg-gray-100 min-h-screen p-6 font-sans">

        <div className="flex flex-col lg:flex-row mt-6 gap-6">
          {/* Main Content */}
          <div className="w-full lg:w-8/12">
            {/* Welcome Banner */}
            <div
              className="bg-yellow-300 rounded-3xl p-6 py-12 pb-5 flex justify-between items-center text-white relative overflow-hidden"
              style={{

                backgroundImage: `url(/images/welcomeToDashboard.png)`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left',
                backgroundSize: 'contain',

              }}
            >
              <div className="md:text-end w-full">
                <h2 className="md:text-[24px] font-semibold text-black z-10">Monday 3rd June 2025</h2>
                <h5 className="md:text-[28px] font-bold z-10 text-black">Welcome to your dashboard, Nilio</h5>
              </div>
              <div className="absolute inset-0 opacity-80 rounded-xl" />
            </div>


            {/* Scorecard Header */}
            <div className="flex justify-between items-center my-6 flex-wrap gap-2">
              <h2 className="text-[28px] font-bold Gilroy">Weekly Classes Scorecards</h2>
              <button className="text-sm p-2 rounded-lg text-white font-semibold  bg-blue">
                Reorder Your Widgets
              </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex mb-5 justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`text-3xl p-3 rounded-full ${metric.bg}`}>{metric.icon}</div>
                      <div>
                        <h3 className="text-[16px] text-gray-700">{metric.title}</h3>
                        <p className="text-[28px] font-semibold text-gray-900">{metric.value}</p>
                      </div>
                    </div>

                    {(metric.title === "Cancellations" || metric.title === "Growth") && (
                      <div className="flex justify-end gap-2 items-start">
                        <img className="w-6 h-6" src='DashboardIcons/Show.png' alt="" />
                        <img className="w-5 h-5" src='DashboardIcons/button.png' alt="" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-start gap-5 items-end">
                    <div className="text-xs text-gray-400 mt-2 block">
                      <span className="font-semibold  text-black flex items-center gap-2"> <img src='/DashboardIcons/orangedot.png' alt="" /> Last Month</span>
                      <br />
                      <span className="text-red-500  font-semibold bg-red-100 p-1 rounded-lg flex justify-center mt-2">
                        -0.56% <img src='/images/ArrowFall.png' alt="" />
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 block">
                      <span className="font-semibold text-black flex items-center gap-2"><img src='/DashboardIcons/greendot.png' alt="" />  This Week</span>
                      <br />
                      <span className="text-green-500 font-semibold bg-gray-100 p-1 rounded-lg flex justify-center mt-2">
                        +5.27% <img src='/images/Arrowtop.png' alt="" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-bold mt-8">Other Services Scorecards</h2>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-4/12 space-y-6">
            {/* Filter Panel */}
            <div className="bg-white rounded-xl p-4 ">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-[24px]">Filter by date</h3>
                <button className="flex gap-2 items-center bg-blue-500 text-white p-2 rounded-lg text-[16px]">
                  <img src='DashboardIcons/filtericon.png' className='w-5 h-5' alt="" />  Apply Filter
                </button>
              </div>


              <div className="gap-2 text-sm bg-gray-100 p-4 my-6 rounded">
                <label className="font-semibold text-[18px] Gilroy block mb-3">Choose type</label>
                <div className="flex flex-wrap gap-3">
                  {["This Year", "This Month", "This Week", "Last Year", "Last Month", "Last Week"].map((label, i) => (
                    <label
                      key={i}
                      className="flex items-center w-[45%] text-[16px] font-semibold gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="peer hidden"
                        id={`checkbox-${i}`}
                      />
                      <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-gray-400 rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                        <Check
                          className="w-4 h-4   transition-all"
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-sm text-gray-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>


              <div className="rounded p-4 text-center text-sm w-full max-w-md mx-auto">
                {/* Header */}
                <div className="flex justify-center gap-5 items-center mb-3">
                  <button
                    onClick={goToPreviousMonth}
                    className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <p className="font-semibold text-2xl">
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
                <div className="grid grid-cols-7 text-xs gap-1 text-gray-500 mb-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                    <div key={day} className="font-medium text-center">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Weeks */}
                <div className="flex flex-col gap-1">
                  {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                    const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);

                    // Check if any date in this week is in range
                    const highlightRow = week.some((date) => isInRange(date));

                    return (
                      <div
                        key={weekIndex}
                        className={`grid grid-cols-7 gap-1 py-1 rounded ${highlightRow ? "bg-sky-100" : ""
                          }`}
                      >
                        {week.map((date, i) => {
                          const isFrom = isSameDate(date, fromDate);
                          const isTo = isSameDate(date, toDate);

                          return (
                            <div
                              key={i}
                              onClick={() => date && handleDateClick(date)}
                              className={`w-8 h-8 flex items-center justify-center mx-auto text-sm rounded-full cursor-pointer
                      ${isFrom || isTo
                                  ? "bg-blue-600 text-white font-bold"
                                  : "text-gray-800"
                                }
                    `}
                            >
                              {date ? date.getDate() : ""}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>


            </div>

            {/* Task List */}
            <div className="bg-white rounded-xl p-4 ">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-[24px]">My Tasks</h3>
                <button className="bg-blue-600 text-white px-2 py-2 rounded-lg font-semibold  text-[16px] flex items-center space-x-1">
                  <Plus size={14} /> <span>Add  New Task</span>
                </button>
              </div>
              <ul className="text-sm text-gray-600">
                {[
                  { label: "Meeting", date: "30 Nov 2021", alert: true },
                  { label: "Weekly meeting", date: "24 Nov 2022" },
                  {
                    label: (
                      <span>
                        Add new services
                      </span>
                    ),
                    date: "24 Nov 2022",
                  },].map((task, i) => (
                    <li key={i} className="flex justify-between items-center text-[18px] font-semibold border-t py-4">
                      <div className="block items-center gap-2">
                        <p className="flex items-center gap-2">
                          {task.label}
                          {task.alert && (
                            <div className="w-4 h-4 bg-red-500 clip-hexagon flex items-center justify-center text-white font-bold text-xs shrink-0">
                              !
                            </div>
                          )}
                        </p>
                        <p className="text-[14px] text-gray-400">{task.date}</p>
                      </div>
                      <span className="text-[14px] bg-gray-100 p-2 rounded-lg font-semibold">6:15 PM</span>
                    </li>
                  ))}
              </ul>

              <button className="mt-2 text-[16px] font-semibold text-blue-600 flex items-center">
                View All <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>

      </div>


    </>
  )
}
export default userDashboard