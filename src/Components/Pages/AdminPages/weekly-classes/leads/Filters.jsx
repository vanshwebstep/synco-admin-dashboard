import React, { useState, useEffect } from "react";
import {
    Search,
    Mail,
    MessageSquare,
    Download,
    ChevronLeft,
    ChevronRight,
    Check
} from "lucide-react";
import { useLeads } from "../../contexts/LeadsContext";
import Select from "react-select";
import * as XLSX from "xlsx";
import { showWarning } from "../../../../../utils/swalHelper";

import { saveAs } from "file-saver";
function exportDataToExcel(data) {
    // Prepare flat data for excel rows
    const flattenedData = data.map((lead) => {
        return {
            Date: new Date(lead.createdAt).toLocaleDateString("en-GB"),
            "Parent Name": lead.firstName + " " + lead.lastName,
            Email: lead.email || "-",
            Phone: lead.phone || "-",
            Postcode: lead.postcode || "-",
            "Kid Range": lead.childAge || "-",
            "Assigned Agent":
                lead.assignedAgent?.firstName && lead.assignedAgent?.lastName
                    ? lead.assignedAgent.firstName + " " + lead.assignedAgent.lastName
                    : "-",
            Status: lead.status,
            // For nested nearestVenues, flatten to a string (comma separated names)
            "Nearest Venues":
                lead.nearestVenues && lead.nearestVenues.length > 0
                    ? lead.nearestVenues.map((v) => v.name).join(", ")
                    : "No nearest venues",
        };
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
    });

    // Save file using file-saver
    const dataBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(dataBlob, `Leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
const Filters = () => {

    const { fetchData, activeTabm, setActiveTab, data, setSelectedVenue, selectedVenue, selectedUserIds, sendleadsMail, setCurrentPage, setSearchTerm, searchTerm } = useLeads()

    const today = new Date();
    const [noLoaderShow, setNoLoaderShow] = useState(false);


    // 🔹 States
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [studentName, setStudentName] = useState("");
    const [venueName, setVenueName] = useState("");
    const [checkedStatuses, setCheckedStatuses] = useState({
        facebook: false,
        "referall": false,
    });
    const myVenues = data.map((lead) => {
        // If no bookingData → return blank venue label
        if (!Array.isArray(lead.bookingData) || lead.bookingData.length === 0) {
            return {
                id: lead.id,
                venuesLabel: "",
            };
        }

        // Extract venue names safely
        const venueNames = lead.bookingData
            .map(b => b?.venue?.name)
            .filter(Boolean);

        return {
            id: lead.id,
            venuesLabel: venueNames.join(", "),
        };
    });
    // useEffect(() => {
    //   if (!selectedVenue) return;

    //   setSelectedVenue(prev => (prev ? null : prev));
    // }, [selectedVenue]);

    const options = myVenues
        .filter(v => v.venuesLabel !== "") // remove empty ones
        .map(v => ({
            value: v.venuesLabel,
            label: v.venuesLabel,
            id: v.id,
        }));

    console.log(myVenues);
    console.log('venueNamesPerLead', myVenues);
    console.log('venueNaselectedUserIdsmesPerLessdad', selectedUserIds);


    // 🔹 Handle input changes
    const handleInputChange = (e) => {
        setStudentName(e.target.value);
    };

    const handleVenueChange = (e) => {
        setVenueName(e.target.value);
    };
    const handleChange = (selectedOption) => {
        setSelectedVenue(selectedOption);
        setCurrentPage(1);
        console.log('selectedOption', selectedOption);

        if (selectedOption === null) {
            // Reset fetchData when venue is cleared
            fetchData({ venueName: "" });  // or just fetchData() if that works for you
        } else {
            fetchData({ venueName: selectedOption.label });
        }
    };



    const handleCheckboxChange = (key) => {
        setCheckedStatuses((prev) => {
            // create all false
            const newState = Object.keys(prev).reduce((acc, k) => {
                acc[k] = false;
                return acc;
            }, {});

            // toggle the selected one
            newState[key] = !prev[key];

            // update active tab
            if (newState[key]) {

                // console.log('mykey', key)
                if (key === 'facebook') {
                    setActiveTab('Facebook')
                }
                else if (key === 'referall') {
                    setActiveTab('Referral')
                }
                // setActiveTab(key);
            } else {
                // console.log('mykey2', key)
                // setActiveTab(null);
                if (key === 'facebook') {
                    setActiveTab('Facebook')
                }
                else if (key === 'referall') {
                    setActiveTab('Referral')
                }
            }

            return newState;
        });
    };

    // 🔹 Calendar helpers
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const getDaysArray = () => {
        const startDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const offset = startDay === 0 ? 6 : startDay - 1;

        for (let i = 0; i < offset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
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



    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);

        if (value.length === 0) {
            setNoLoaderShow(true);
            fetchData({ studentName: "" }); // Reset search
            return;
        }

        // pass object correctly
        fetchData({ studentName: value });
    };

    const applyFilter = () => {
        setCurrentPage(1);
        const isValidDate = (d) => d instanceof Date && !isNaN(d.valueOf());
        const hasRange = isValidDate(fromDate) && isValidDate(toDate);

        const selectedFilters = Object.keys(checkedStatuses).filter(
            (key) => checkedStatuses[key]
        );

        if (fetchData) {
            fetchData({
                studentName: studentName.trim(),
                venueName: venueName.trim(),
                filterTypes: selectedFilters,
                fromDate: hasRange ? formatLocalDate(fromDate) : null,
                toDate: hasRange ? formatLocalDate(toDate) : null,
            });
        }
        setFromDate('');
        setToDate('');
    };
    const handleSendEmail = async () => {
        console.log("selectedUserIds:", selectedUserIds);

        if (!selectedUserIds || selectedUserIds.length === 0) {
            await showWarning(
                "No Users Selected",
                "Please select at least one user before sending email."
            );
            return;
        }

        // If selectedUserIds exists → call API
        await sendleadsMail(selectedUserIds);
    };

    return (
        <div className="md:w-[27%]  fullwidth20 flex-shrink-0 gap-5 md:ps-3">
            {/* Search */}
            <div className="mb-4 bg-white rounded-2xl p-4">
                <h3 className="font-semibold text-black text-[24px] mb-2">
                    Search now
                </h3>

                <label className="text-[16px] font-semibold text-[#282829]">Search Student</label>
                <div className="relative mt-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search by student name"
                        className="pl-9 pr-3 py-2 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <label className="text-[16px] font-semibold mt-2 block">Venue</label>
                <div className="relative mt-1">
                    <Select
                        value={selectedVenue}
                        onChange={handleChange}
                        options={options}
                        isClearable // shows the cross (clear) icon
                        placeholder="Choose Venue"
                        className="mt-1"
                        classNamePrefix="react-select"
                    />
                    {/* You can display selected venue info here for debug */}

                </div>
            </div>

            {/* Filter by Date */}
            <div className="bg-white p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-black text-[24px]">
                        Filter by date
                    </h3>
                    <button
                        onClick={applyFilter}
                        className="px-5 mt-4 bg-[#237FEA] hover:bg-blue-700 text-white flex gap-2 items-center text-sm py-2 rounded-lg transition"
                    >
                        <img
                            src="/DashboardIcons/filtericon.png"
                            className="w-2 h-2 sm:w-3 sm:h-3"
                            alt=""
                        />
                        Apply Filter
                    </button>
                </div>

                {/* Status Checkboxes */}
                <div className="p-4 bg-[#FAFAFA] rounded-lg mb-4">
                    <p className="text-[17px] font-semibold mb-2 text-black">Status</p>
                    <div className="flex flex-wrap gap-3">
                        {Object.keys(checkedStatuses).map((key) => {
                            const label = key; // in case you want to rename display later
                            return (
                                <label
                                    key={key}
                                    className="flex items-center w-full sm:w-[45%] text-[16px] font-semibold gap-3 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        className="peer hidden"
                                        checked={checkedStatuses[key]}
                                        onChange={() => handleCheckboxChange(key)}
                                    />
                                    <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                        <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                                    </span>
                                    <span>{label == "facebook" ? 'FaceBooked' : "Referral Leads"}</span>
                                </label>
                            );
                        })}
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

            {/* Actions */}
            <div className="grid blockButton md:grid-cols-3 gap-3 mt-4">
                <button
                    className="flex-1 flex items-center justify-center text-[#717073] gap-1 border border-[#717073] rounded-lg py-2 text-sm hover:bg-gray-50"
                    onClick={handleSendEmail}
                >
                    <Mail size={16} className="text-[#717073]" />
                    Send Email
                </button>

                <button className="flex-1 flex items-center justify-center gap-1 border text-[#717073] border-[#717073] rounded-lg py-2 text-sm hover:bg-gray-50">
                    <MessageSquare size={16} className="text-[#717073]" /> Send Text
                </button>
                <button onClick={() => exportDataToExcel(data)} className="flex items-center justify-center gap-1 bg-[#237FEA] text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition">
                    <Download size={16} /> Export Data
                </button>
            </div>
        </div>
    );
};

export default Filters;
