import React, { useEffect, useRef, useState } from 'react';
import { FiSearch } from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Select, { components } from "react-select";
import { Check, Filter } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { useBookFreeTrial } from '../../contexts/BookAFreeTrialContext';
import { useNavigate } from "react-router-dom";
import Loader from '../../contexts/Loader';
import { showError } from '../../../../../utils/swalHelper';
const CheckboxOption = (props) => {
    return (
        <components.Option {...props}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                    type="checkbox"
                    checked={props.isSelected}
                    onChange={() => null}
                    style={{ marginRight: '10px' }}
                />
                {props.label}
            </div>
        </components.Option>
    );
};
const Capacity = () => {
    const navigate = useNavigate();
    const popupRef = useRef(null);

    const booked = 1654
    const total = 2040
    const percentage = Math.round((booked / total) * 100);
    const { fetchCapacity, capacityData, loading, setSelectedVenue, selectedVenue, fetchCapacitySearch, searchLoading } = useBookFreeTrial() || {};

    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [popupOpen, setPopupOpen] = useState(false);

    useEffect(() => {

        fetchCapacity(); // No filter

    }, [fetchCapacity]);
    const overview = capacityData?.overview || {};
    const { totalCapacity, totalBooked, occupancyRate } = overview;

    console.log('capacityData', capacityData)



    const data = [
        { name: "Booked", value: occupancyRate || 0 },
        { name: "Remaining", value: 100 - (occupancyRate || 0) },
    ];

    const COLORS = ["#237FEA", "rgba(255,255,255,0.3)"];
    const COLORS2 = ["#ffffff", "rgba(255,255,255,0.3)"];

    const legendItems = [
        { label: "Total Students", color: "#F9FAFB", borderColor: "#ccc" },
        { label: "Members", color: "#237FEA", borderColor: "#237FEA" },
        { label: "Free Trials", color: "#EEAA1F", borderColor: "#EEAA1F" },
        { label: "Spaces Available", color: "#34AE56", borderColor: "#34AE56", type: "capacity" },
        { label: "No Spaces", color: "#FE7058", borderColor: "#FE7058" },
    ];
    const handleVenueChange = (venues) => {
        console.log("Selected venues:", venues);
        setSelectedVenue(venues);

        // pass all selected venue names as array
        const selectedNames = venues?.map((v) => v.value) || [];
        fetchCapacitySearch(selectedNames);
    };
    const applyFilter = () => {
        let forOtherDate = "";
        // ✅ Check for partial date input
        if ((fromDate && !toDate) || (!fromDate && toDate)) {
            showError("Missing Date", "Please select both Start Date and End Date.");
            return; // Stop further execution
        }

        // ✅ Proceed if both dates are selected
        if (fromDate && toDate) {
            forOtherDate = [fromDate, toDate];
        }

        fetchCapacitySearch("", forOtherDate);
        setPopupOpen(false); // Close popup
    };
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

    const isInRange = (date) => {
        if (!fromDate || !toDate) return false;
        return date > fromDate && date < toDate;
    };

    const isSameDate = (d1, d2) => {
        if (!d1 || !d2) return false;
        const date1 = d1 instanceof Date ? d1 : new Date(d1);
        const date2 = d2 instanceof Date ? d2 : new Date(d2);
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };


    const handleDateClick = (date) => {
        if (!date) return;

        if (!fromDate) {
            setFromDate(date);
            setToDate(null); // reset second date
        } else if (!toDate) {
            // Ensure order (from <= to)
            if (date < fromDate) {
                setToDate(fromDate);
                setFromDate(date);
            } else {
                setToDate(date);
            }
        } else {
            // If both already selected, reset
            setFromDate(date);
            setToDate(null);
        }
    };


    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setPopupOpen(false); // Close popup
                setFromDate(null);
                setToDate(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const handleTogglePopup = () => {
        setPopupOpen(prev => !prev);
        setToDate(null);
        setFromDate(null);// toggles between true and false
    };
    if (loading) return <Loader />;
    console.log('capacityData', capacityData)
    return (
        <div>

            <div className="flex items-end justify-between">
                <div className="flex gap-5 py-5 items-center a ">
                    <div className="relative w-100">
                        <Select
                            options={
                                capacityData?.searchVenue?.map((venue) => ({
                                    value: venue.venueName,
                                    label: venue.venueName,
                                })) || []
                            }
                            placeholder="Choose Venue"
                            value={selectedVenue}
                            onChange={handleVenueChange}
                            isMulti
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={{
                                Option: CheckboxOption,
                                // Add DropdownIndicator and IndicatorSeparator to remove default icons
                                DropdownIndicator: null,
                                IndicatorSeparator: null
                            }}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    borderRadius: "1rem",
                                    borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
                                    boxShadow: "none",
                                    padding: "4px 8px",
                                    minHeight: "48px",
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    fontWeight: 600,
                                    marginLeft: '10px'
                                }),
                                // Adjust menu styling to match the card look
                                menu: (base) => ({
                                    ...base,
                                    borderRadius: '1rem', // Match the control's border radius
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow
                                    border: '1px solid #E5E7EB', // Border for the card
                                    marginTop: '8px', // Space between the control and the dropdown
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected ? '#e0f2fe' : 'white', // Light blue background for selected options
                                    color: 'black', // Ensure text color is black
                                    // Hover effect to match the image
                                    '&:hover': {
                                        backgroundColor: '#e5e7eb',
                                    },
                                }),
                                // Remove indicator and separator
                                dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                indicatorSeparator: () => ({ display: "none" }),
                            }}
                        />


                    </div>
                    <button onClick={handleTogglePopup} className="flex gap-2 items-center bg-[#237FEA] text-white px-3 py-3 rounded-lg text-sm text-[16px]">
                        <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                        Filters
                    </button>
                    {popupOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
                            style={{ backgroundColor: "rgba(0, 0, 0, 0.27)" }}

                        >

                            <div ref={popupRef}

                                className="rounded-3xl p-4 mt-6 text-center text-base w-full max-w-md mx-auto bg-white shadow-lg">
                                {/* Header */}
                                <div className="flex mb-10 justify-between ">
                                    <div className="text-[24px]">Filter</div>
                                    <button onClick={applyFilter} className="flex gap-2 items-center bg-[#237FEA] text-white px-3 py-3 rounded-2xl text-sm text-[16px]">
                                        <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                        Apply Filter
                                    </button>
                                </div>
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
                                    {["M", "T", "W", "T", "F", "S", "S"].map(day => (
                                        <div key={day} className="font-medium text-center">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Weeks */}
                                <div className="flex flex-col gap-1">
                                    {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                                        const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);

                                        return (
                                            <div key={weekIndex} className="grid grid-cols-7 text-[18px] h-12 py-1 rounded">
                                                {week.map((date, i) => {
                                                    const isStart = isSameDate(date, fromDate);
                                                    const isEnd = isSameDate(date, toDate);
                                                    const isStartOrEnd = isStart || isEnd;
                                                    const isInBetween = date && isInRange(date);
                                                    const isExcluded = !date;
                                                    console.log('isInBetween', isInBetween)
                                                    let className =
                                                        "w-full h-12 aspect-square flex items-center justify-center transition-all duration-200";

                                                    let innerDiv = null;

                                                    if (!date) {
                                                        className += "";
                                                    } else if (isExcluded) {
                                                        className += "bg-gray-300 text-white opacity-60 cursor-not-allowed";
                                                    } else if (isStartOrEnd) {
                                                        className += ` bg-sky-100 ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}`;
                                                        innerDiv = (
                                                            <div className="bg-blue-700 rounded-full text-white w-12 h-12 flex items-center justify-center font-bold">
                                                                {date.getDate()}
                                                            </div>
                                                        );
                                                    } else if (isInBetween) {
                                                        className += " bg-sky-100 text-gray-800"; // Sky color for in-between dates
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
                    )}

                </div>
                <div className="block justify-end flex-wrap items-center w-full mt-6">


                    {/* Total Box with Circular Progress */}
                    <div className="bg-[#237FEA] leftEnd w-full max-w-fit text-white rounded-3xl shadow-md px-6 py-4 flex items-center">
                        {/* Text Section */}
                        <div className="flex flex-col">
                            <span className="text-[16px] font-semibold">Total</span>
                            <span className="text-[14px] text-[#D8DEF5]">
                                {totalBooked} Booked of <br /> {totalCapacity} Spaces
                            </span>
                        </div>

                        {/* Pie Chart Section */}
                        <div className="ml-6 relative">
                            <PieChart width={80} height={80}>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={90}
                                    endAngle={-270}
                                    innerRadius={32}
                                    outerRadius={38}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS2[index]} />
                                    ))}
                                </Pie>
                            </PieChart>
                            <span className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold">
                                {occupancyRate || 0}%
                            </span>
                        </div>
                    </div>
                    {/* Legend Section */}
                    <div className="flex flex-wrap my-5  items-center gap-6 justify-end">
                        {legendItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">

                                <span className="text-[18px] font-semibold text-[#282829 ]">
                                    {item.label}
                                </span>
                                <span
                                    className={`w-6 h-6 rounded-md border  border-[${item.borderColor}]`}
                                    style={{ backgroundColor: item.color }
                                    }
                                ></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="transition-all duration-300 flex-1  space-y-6">
                {searchLoading ? (
                    <div className="text-center py-6 text-gray-500">Loading venues...</div>
                ) :
                    capacityData && capacityData.venues ? (
                        capacityData.venues.length > 0 ? (
                            capacityData.venues.map((venue) => {
                                const totalCapacity = venue.classes.reduce((sum, cls) => sum + cls.stats.totalCapacity, 0);
                                const totalBooked = venue.classes.reduce((sum, cls) => sum + cls.stats.totalBooked, 0);
                                const freeTrials = venue.classes.reduce((sum, cls) => sum + cls.stats.freeTrials, 0);
                                const availableSpaces = venue.classes.reduce((sum, cls) => sum + cls.stats.availableSpaces, 0);
                                const members = venue.classes.reduce((sum, cls) => sum + cls.stats.members, 0);
                                const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
                                return (
                                    <div
                                        key={venue.id}
                                        className="rounded-3xl relative p-2 border border-[#D9D9D9] shadow-sm bg-white"
                                    >
                                        {/* Header */}
                                        <div className="bg-[#2E2F3E] text-white p-4 rounded-2xl flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <img src="/images/icons/Location.png" alt="" />
                                                <span className="font-medium text-[20px]">
                                                    {venue.address || "Unnamed Address"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center flex-col lg:flex-row">
                                            <div className="px-4 w-full py-2 flex-1 space-y-6">
                                                <div className=" grid md:grid-cols-[0.5fr_3.5fr_1fr] gap-4 items-center">
                                                    {/* Venue Info */}
                                                    <div className=''>
                                                        <div className="font-semibold text-[16px] text-black">
                                                            {venue.name}
                                                        </div>
                                                        <div className="whitespace-nowrap text-[#717073] capitalize  font-semibold text-[14px]">
                                                            {new Date(venue.createdAt).toLocaleDateString("en-GB", {
                                                                weekday: "long",
                                                                // year: "numeric",
                                                                // month: "short",
                                                                // day: "2-digit",
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className='overflow-x-auto custom-scrollbar'>
                                                        <div className='flex row gap-4 justify-start items-center'>
                                                            {venue.classes && venue.classes.length > 0 ? (
                                                                venue.classes.map((cls, index) => {

                                                                    const statsItems = [
                                                                        { label: "Total Students", color: "#F9FAFB", borderColor: "#ccc", value: cls.stats.totalBooked, textColor: "#414141" },
                                                                        { label: "Members", color: "#237FEA", borderColor: "#237FEA", value: cls.stats.members, textColor: "#fff" },
                                                                        { label: "Free Trials", color: "#EEAA1F", borderColor: "#EEAA1F", value: cls.stats.freeTrials, textColor: "#fff" },
                                                                        {
                                                                            label: "Spaces Available",
                                                                            color: cls.stats.availableSpaces > 0 ? "#34AE56" : "#FE7058", // green if >0, red if 0
                                                                            borderColor: cls.stats.availableSpaces > 0 ? "#34AE56" : "#FE7058",
                                                                            value: cls.stats.availableSpaces,
                                                                            textColor: "#fff"
                                                                            , icon: '+'
                                                                        },
                                                                        { label: "No Spaces", color: "#FE7058", borderColor: "#FE7058", value: cls.stats.totalCapacity - cls.stats.totalBooked - cls.stats.availableSpaces, textColor: "#fff" },
                                                                    ];
                                                                    console.log('statsItems', statsItems)
                                                                    return (
                                                                        <div
                                                                            key={cls.id}
                                                                            className="block text-center pr-10 border-r border-[#ccc]"
                                                                        >
                                                                            <div className="whitespace-nowrap capitalize font-semibold text-[14px]">
                                                                                {`Class  ${index + 1} : ${cls.day}, ${cls.startTime} - ${cls.endTime}`}
                                                                            </div>
                                                                            <div className="text-[16px] py-4 font-semibold text-[#384455]">
                                                                                <div className="flex items-center gap-3">
                                                                                    {statsItems.map((item, idx) => {
                                                                                        // Skip "Spaces Available" if value is 0
                                                                                        if (item.label === "Spaces Available" && cls.stats.availableSpaces === 0) {
                                                                                            return null;
                                                                                        }

                                                                                        // Skip "No Spaces" unless availableSpaces is 0
                                                                                        if (item.label === "No Spaces" && cls.stats.availableSpaces > 0) {
                                                                                            return null;
                                                                                        }

                                                                                        // Determine display value
                                                                                        let displayValue = item.value;
                                                                                        if (item.label === "No Spaces") {
                                                                                            displayValue = "N/A";
                                                                                        }

                                                                                        return (
                                                                                            <div
                                                                                                key={idx}
                                                                                                className="w-10 h-10 rounded-md border flex items-center justify-center"
                                                                                                style={{
                                                                                                    backgroundColor: item.color,
                                                                                                    borderColor: item.borderColor,
                                                                                                    color: item.textColor,
                                                                                                    whiteSpace: "nowrap", // 🔹 Prevents wrapping
                                                                                                    overflow: "hidden", // Optional: hides overflow if too long
                                                                                                    textOverflow: "ellipsis", // Optional: adds "..." for long text
                                                                                                }}
                                                                                                title={`${item.label}: ${item.value}`}
                                                                                            >
                                                                                                <span className="text-[18px] font-semibold flex items-center justify-center gap-1">
                                                                                                    {item.icon}
                                                                                                    {displayValue}
                                                                                                </span>
                                                                                            </div>

                                                                                        );
                                                                                    })}


                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="text-gray-500 text-sm">
                                                                    No classes available
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                    <div className=' flex justify-end  '>
                                                        <div className=" bg-[#F2ECE6] max-w-[255px]  border border-[#ccc] text-black rounded-3xl shadow-md px-6 py-4 flex items-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-[16px] font-semibold">Total</span>
                                                                <span className="text-[14px] text-[#717073]">
                                                                    <span>{totalBooked} Booked </span>
                                                                    <br></br>
                                                                    <span>of {totalCapacity}  Spaces</span>
                                                                </span>
                                                            </div>

                                                            <div className="ml-6 relative">
                                                                <PieChart width={80} height={80}>
                                                                    <Pie
                                                                        data={[
                                                                            { value: totalBooked },
                                                                            {
                                                                                value:
                                                                                    totalCapacity -
                                                                                    totalBooked,
                                                                            },
                                                                        ]}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        startAngle={90}
                                                                        endAngle={-270}
                                                                        innerRadius={32}
                                                                        outerRadius={38}
                                                                        dataKey="value"
                                                                        stroke="none"
                                                                    >
                                                                        {[0, 1].map((i) => (
                                                                            <Cell key={i} fill={COLORS[i]} />
                                                                        ))}
                                                                    </Pie>
                                                                </PieChart>
                                                                <span className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold">
                                                                    {occupancyRate}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-6 text-gray-500">No data available</div>
                        )
                    ) : (
                        <div className="text-center py-6 text-gray-500">No data available</div>
                    )}
            </div>


        </div>
    );
};

export default Capacity;
