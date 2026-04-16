import React, { useEffect, useRef, useCallback, useState } from 'react';
import { FiSearch } from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "react-select";
import { Check, Filter, Loader2 } from "lucide-react";
import { useBookFreeTrial } from '../../contexts/BookAFreeTrialContext';
import { useNavigate } from "react-router-dom";
import Loader from '../../contexts/Loader';
import { usePermission } from '../../Common/permission';
import * as XLSX from "xlsx";
import { showError, showSuccess, showWarning } from '../../../../../utils/swalHelper';

import { saveAs } from "file-saver";
import StatsGrid from '../../Common/StatsGrid';
import DynamicTable from '../../Common/DynamicTable';
import { useBookFreeTrialLoader } from '../../contexts/BookAFreeTrialLoaderContext';
const trialLists = () => {
    const { fetchBookFreeTrials, fetchBookFreeTrialsLoading, statsFreeTrial, bookFreeTrials, setSearchTerm, bookedByAdmin, searchTerm, loading, selectedVenue, setStatus, status, setSelectedVenue, myVenues, setMyVenues, sendFreeTrialmail } = useBookFreeTrial() || {};

    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [tempSelectedAgents, setTempSelectedAgents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isFilterApplied, setIsFilterApplied] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [textloading, setTextLoading] = useState(null);
    const token = localStorage.getItem("adminToken");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const toggleSelect = (studentId) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId) // remove if already selected
                : [...prev, studentId] // add if not selected
        );
    };

    const [showAgentPopup, setShowAgentPopup] = useState(null);
    const [agentsLoading, setAgentsLoading] = useState(null);
    const [agentsData, setAgentsData] = useState([]);
    const [selectedAdminId, setSelectedAdminId] = useState(null);

    const handleClick = () => {
        if (selectedStudents.length === 0) {
            showWarning("Warning", 'Please select at least 1 student');
            return;
        }
        const matchedStudents = (bookFreeTrials || []).filter(
            trial =>
                selectedStudents?.includes(trial?.id) &&
                trial?.assignedAgentId != null // covers null & undefined
        );

        const hasAssignedStudents = matchedStudents.some(
            s => s?.status === "assigned"
        );

        if (hasAssignedStudents) {
            showWarning(
                "Warning",
                "One or more selected students are already assigned to an agent. Please deselect them to proceed."
            );
        }
        if (hasAssignedStudents || selectedStudents.length === 0) {
            return;
        }
        fetchAllAgents();
    };
    const isWebsiteSourceSelected = (bookFreeTrials || [])
        .filter(trial => selectedStudents?.includes(trial?.id))
        .every(s => s?.source?.trim()?.toLowerCase() === "website");
    const fetchAllAgents = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setAgentsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/get-agents`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || {};
            // Assuming the agents array is directly in data
            setAgentsData(result || []);
            setShowAgentPopup(true); // Show popup after fetching
        } catch (error) {
            console.error("Failed to fetch agents:", error);
            alert("Failed to fetch agents.");
        } finally {
            setAgentsLoading(false);
        }
    }, []);
    const sendText = async (id) => {
        setTextLoading(true);

        const headers = {
            "Content-Type": "application/json",
        };
        // console.log('bookingIds', bookingIds)
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book/free-trials/send-text`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    bookingId: id, // make sure bookingIds is an array like [96, 97]
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to send text");
            }

            await showSuccess("Success!", result.message || "Text has been sent successfully.");

            return result;

        } catch (error) {
            console.error("Error sending Text:", error);
            await showError("Error", error.message || "Something went wrong while sending text.");
            throw error;
        } finally {
            // navigate(`/weekly-classes/all-members/list`);
            await fetchBookFreeTrials();
            setTextLoading(false);
        }
    };


    console.log('selectedStudents', selectedStudents)
    const handleAgentSubmit = async (id) => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            return showError("Not authorized.");
        }
        if (!selectedStudents || selectedStudents.length === 0) {
            return showWarning("Please select at least one student.");
        }

        setAgentsLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/book/free-trials/assign-booking`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        bookingIds: selectedStudents,
                        agentId: id,
                    }),
                }
            );

            const result = await response.json(); // ✅ parse once

            if (!response.ok) {
                throw new Error(result?.message || "Failed to assign booking");
            }

            showSuccess("Booking assigned successfully!");

            fetchBookFreeTrials();
            setSelectedStudents([]);

        } catch (error) {
            console.error("Error assigning booking:", error);

            // ✅ show backend error message in Swal
            showError(error.message || "Something went wrong.");
        } finally {
            setAgentsLoading(false);
        }
    };

    const exportFreeTrials = () => {
        const dataToExport = [];

        bookFreeTrials?.forEach((item) => {
            if (selectedStudents.length > 0 && !selectedStudents.includes(item.id)) return;

            item.students.forEach((student) => {
                dataToExport.push({
                    Name: `${student.studentFirstName} ${student?.studentLastName}`,
                    Age: student.age,
                    Venue: item.venue?.name || "-",
                    'Date of Booking': new Date(item.createdAt || item.trialDate).toLocaleDateString(),
                    'Date of Trial': new Date(item.trialDate).toLocaleDateString(),
                    Source: item.parents?.[0]?.howDidYouHear || "-",
                    Attempts: item.attempt || 0,
                    Status: student.studentStatus,
                });
            });
        });

        if (!dataToExport.length) return alert('No data to export');

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'FreeTrials');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'FreeTrials.xlsx');
    };

    const [checkedStatuses, setCheckedStatuses] = useState({
        attended: false,
        notAttended: false,
        dateBooked: false,
        dateOfTrial: false,
    });
    const getStatusBadge = (status) => {
        const s = status.toLowerCase();

        let styles =
            "bg-red-100 text-red-500"; // default fallback
        if (s == "attended" || s == "active")
            styles = "bg-green-100 text-green-600";
        else if (s === "pending") styles = "bg-yellow-100 text-yellow-600";
        else if (s === "frozen") styles = "bg-blue-100 text-blue-600";
        else if (s === "waiting list") styles = "bg-gray-200 text-gray-700";
        else if (s === "Rebooked") styles = "bg-blue-100 text-blue-600";


        return (
            <div
                className={`flex text-center justify-center rounded-lg p-1 gap-2 ${styles} capitalize`}
            >
                {formatStatus(status)}
            </div>
        );
    };

    const [selectedDates, setSelectedDates] = useState([]);
    const handleCheckboxChange = (label) => {
        setCheckedStatuses((prev) => {
            switch (label) {
                case "Attended":
                    return { ...prev, attended: !prev.attended };
                case "Not Attended":
                    return { ...prev, notAttended: !prev.notAttended };
                case "Date Booked":
                    return { ...prev, dateBooked: !prev.dateBooked };
                case "Date of Trial":
                    return { ...prev, dateOfTrial: !prev.dateOfTrial };
                default:
                    return prev;
            }
        });
    };
    // const [selectedDate, setSelectedDate] = useState(null);



    const navigate = useNavigate();

    console.log('bookedByAdmin', bookedByAdmin)
    useEffect(() => {
        if (selectedVenue) {
            fetchBookFreeTrials("", selectedVenue.label); // Using label as venueName
        } else if (status) {
            fetchBookFreeTrials("", "", status); // Using label as venueName
        } else {
            fetchBookFreeTrialsLoading(); // No filter
        }
    }, [selectedVenue, fetchBookFreeTrials, fetchBookFreeTrialsLoading]);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const selectedAdmin = bookFreeTrials.filter(t => t.assignedAgentId === selectedAdminId)[0];

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
        if (!fromDate || !toDate || !date) return false;
        return date >= fromDate && date <= toDate;
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

    const modalRef = useRef(null);
    const PRef = useRef(null);
    const stats = [
        {
            title: "Total Free Trials",
            value: statsFreeTrial?.totalFreeTrials?.value || "0",
            icon: "/DashboardIcons/totalFreeTrials.png", // Replace with actual SVG if needed
            change: statsFreeTrial?.totalFreeTrials?.change != null
                ? `${statsFreeTrial.totalFreeTrials.change}%`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F3FAF5]"
        },
        {
            title: "Top performer",
            value:
                statsFreeTrial?.topPerformer?.firstName || statsFreeTrial?.topPerformer?.lastName
                    ? `${statsFreeTrial?.topPerformer?.firstName ?? ""} ${statsFreeTrial?.topPerformer?.lastName ?? ""}`.trim()
                    : "0",
            subValue: "",
            icon: "/DashboardIcons/topPerformer.png",
            color: "text-green-500",
            bg: "bg-[#F3FAFD]"
        },
        {
            title: "Free Trial Attendance Rate",
            value: statsFreeTrial?.freeTrialAttendanceRate?.value || "0",
            icon: "/DashboardIcons/freeTrialAttendanceRate.png",
            change: statsFreeTrial?.freeTrialAttendanceRate?.change != null
                ? `${statsFreeTrial.freeTrialAttendanceRate.change}%`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#FEF6FB]"
        },
        {
            title: "Trials to Members",
            value: statsFreeTrial?.trialsToMembers?.value || "0",
            icon: "/DashboardIcons/trialsToMembers.png",
            change: statsFreeTrial?.trialsToMembers?.change != null
                ? `${statsFreeTrial.trialsToMembers.change}%`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F0F9F9]"
        }
    ];
    const applyFilter = () => {
        const forAttend = checkedStatuses.attended || "";
        const forNotAttend = checkedStatuses.notAttended || "";

        let forDateOkBookingTrial = "";
        let forDateOfTrial = "";
        let forOtherDate = "";

        const bookedDatesChecked = checkedStatuses.dateBooked;
        const trialDatesChecked = checkedStatuses.dateOfTrial;

        if (fromDate && toDate) {
            if (bookedDatesChecked) {
                forDateOkBookingTrial = [fromDate, toDate];
            } else if (trialDatesChecked) {
                forDateOfTrial = [fromDate, toDate];
            } else {
                forOtherDate = [fromDate, toDate];
            }
        }

        const bookedByParams = savedAgent || [];
        setIsFilterApplied(true);
        fetchBookFreeTrials(
            "",
            "",
            forAttend,
            forNotAttend,
            forDateOkBookingTrial,
            forDateOfTrial,
            forOtherDate,
            bookedByParams
        );
    };


    const [showPopup, setShowPopup] = useState(false);
    const [tempSelectedAgent, setTempSelectedAgent] = useState(null);
    const [savedAgent, setSavedAgent] = useState([]);
    const popupRef = useRef(null);

    const agents = Array(6).fill({
        name: "Jaffar",
        avatar: "https://i.ibb.co/ZVPd9vJ/jaffar.png", // Replace with real image or asset
    });

    // Close popup if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
                setTempSelectedAgent(savedAgent); // Reset to saved
            }
        };

        if (showPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPopup, savedAgent]);

    const handleNext = () => {
        if (tempSelectedAgents.length > 0) {
            const selectedNames = tempSelectedAgents.map(
                (agent) => `${agent.id}`
            );
            setSavedAgent(selectedNames); // ✅ saves full names as strings
            console.log("selectedNames", tempSelectedAgents);
        } else {
            setSavedAgent([]); // nothing selected → clear
        }
        setShowPopup(false);
    };
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Fetch data with search value (debounce optional)
        fetchBookFreeTrials(value);
    };
    console.log('statsFreeTrial', statsFreeTrial)
    const { checkPermission } = usePermission();
    const formatStatus = (status) => {
        if (!status) return "-";
        return status
            .split("_")           // split by underscore
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize first letter
            .join(" ");           // join with space
    };
    useEffect(() => {
        if (isFilterApplied) {
            setIsFilterApplied(false)
        }
    })
    const canServicehistory =
        checkPermission({ module: 'service-history', action: 'view-listing' })
    const freeTrialColumns = [
        { header: "Name", key: "name", selectable: true }, // ✅ checkbox + student name
        { header: "Age", render: (item, student) => student.age },
        { header: "Venue", render: (item) => item.venue?.name || "-" },
        {
            header: "Date of Booking",
            render: (item) => {
                const date = new Date(item.createdAt);

                const day = date.getDate();
                const suffix =
                    day % 10 === 1 && day !== 11
                        ? "st"
                        : day % 10 === 2 && day !== 12
                            ? "nd"
                            : day % 10 === 3 && day !== 13
                                ? "rd"
                                : "th";

                const weekday = date.toLocaleDateString("en-GB", { weekday: "short" }); // Sat
                const month = date.toLocaleDateString("en-GB", { month: "short" });     // Sep
                const year = date.getFullYear();                                        // 2025

                return `${weekday} ${day}${suffix} ${month} ${year}`;
            },
        },
        {
            header: "Date of Trial",
            render: (item) => {
                const date = new Date(item.trialDate);

                const day = date.getDate();
                const suffix =
                    day % 10 === 1 && day !== 11
                        ? "st"
                        : day % 10 === 2 && day !== 12
                            ? "nd"
                            : day % 10 === 3 && day !== 13
                                ? "rd"
                                : "th";

                const weekday = date.toLocaleDateString("en-GB", { weekday: "short" }); // Sat
                const month = date.toLocaleDateString("en-GB", { month: "short" });     // Sep
                const year = date.getFullYear();                                        // 2025

                return `${weekday} ${day}${suffix} ${month} ${year}`;
            },
        },
        {
            header: "Source",
            render: (item) => {
                const source = item?.source?.trim();

                const adminName = item?.bookedByAdmin?.firstName
                    ? `${item.bookedByAdmin.firstName}${item.bookedByAdmin.lastName && item.bookedByAdmin.lastName !== "null"
                        ? ` ${item.bookedByAdmin.lastName}`
                        : ""
                    }`
                    : "";

                const agentName = item?.assignedAgent?.firstName
                    ? `${item.assignedAgent.firstName}${item.assignedAgent.lastName ? ` ${item.assignedAgent.lastName}` : ""
                    }`
                    : "";

                // agar source website hai aur status assigned hai to agent ka naam
                if (source === "website" && item?.status === "assigned" && agentName) {
                    return `${source} (${agentName})`;
                }

                if (source && adminName) {
                    return `${source} (${adminName})`;
                }

                if (source) {
                    return source;
                }

                return adminName || "-";
            },
        },
        {
            header: "Attempts",
            render: (item) => {
                const attempt = item?.attempt || "0";

                return attempt;
            } // replace with real attempts later if needed
        },
        {
            header: "Status",

            render: (item, student) => (
                <div
                    className={`flex text-center justify-center rounded-lg p-1 px-2 saa gap-2 ${student?.studentStatus?.toLowerCase() === "attended"
                        ? "bg-green-100 text-green-600"
                        : student?.studentStatus?.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : student?.studentStatus?.toLowerCase() === "active"
                                ? "bg-green-100 text-green-600"
                                : student?.studentStatus?.toLowerCase() === "rebooked"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-red-100 text-red-500"
                        } capitalize`}

                >
                    {formatStatus(student.studentStatus)}
                </div>
            ),
        },
    ];

    if (loading) return <Loader />;
    return (
        <div className="pt-1 bg-gray-50 min-h-screen">

            <div className="md:flex w-full gap-6">
                <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>
                    <StatsGrid stats={stats} variant="B" />

                    <div className="flex justify-end items-center gap-2">
                        <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center"> <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                        </div>
                        <div className="bg-white min-w-[38px] min-h-[38px] border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <img
                                onClick={isWebsiteSourceSelected ? handleClick : undefined}
                                src="/DashboardIcons/user-add-02.png"
                                alt=""
                                className={`${isWebsiteSourceSelected ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                                    }`}
                            />
                        </div>
                    </div>

                    <DynamicTable
                        columns={freeTrialColumns}
                        data={bookFreeTrials}
                        from={'freetrial'}
                        selectedIds={selectedStudents}
                        setSelectedStudents={setSelectedStudents}
                        onRowClick={
                            canServicehistory
                                ? (item) =>
                                    navigate(
                                        "/weekly-classes/trial/find-a-class/book-a-free-trial/account-info/list",
                                        { state: { itemId: item.id } }
                                    )
                                : undefined
                        }
                        isFilterApplied={isFilterApplied}
                    />


                </div>
                {
                    showFilter && (
                        <div className="md:w-4/12 md:mt-0 mt-4 text-base space-y-5">
                            <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm ">
                                <h2 className="text-[24px] font-semibold">Search Now </h2>
                                <div className="">
                                    <label htmlFor="" className="text-base font-semibold">Search Student</label>
                                    <div className="relative mt-2">
                                        <input
                                            type="text"
                                            placeholder="Search by student name"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                                        />
                                        <FiSearch className="absolute left-3 top-4 text-[20px]" />
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <label htmlFor="" className="text-base font-semibold">Venue</label>
                                    <div className="relative mt-2 ">
                                        <Select
                                            options={myVenues.map((venue) => ({
                                                label: venue?.name, // or `${venue.name} (${venue.area})`
                                                value: venue?.id,
                                            }))}
                                            value={selectedVenue}
                                            onChange={(venue) => setSelectedVenue(venue)}
                                            placeholder="Choose venue"
                                            className="mt-2"
                                            classNamePrefix="react-select"
                                            isClearable={true} // 👈 adds cross button
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    borderRadius: "1.5rem",
                                                    borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
                                                    boxShadow: "none",
                                                    padding: "4px 8px",
                                                    minHeight: "48px",
                                                }),
                                                placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                                dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                                indicatorSeparator: () => ({ display: "none" }),
                                            }}
                                        />




                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm ">
                                <div className="">
                                    <div className="flex justify-between items-center mb-5 ">
                                        <h2 className="text-[24px] font-semibold">Filter by date </h2>
                                        <button onClick={applyFilter} className="flex gap-2 items-center bg-[#237FEA] text-white px-3 py-2 rounded-lg text-sm text-[16px]">
                                            <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                            Apply Filter
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg w-full">
                                        <div className="font-semibold mb-2 text-[18px]">Choose type</div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-semibold text-[16px]">

                                            {["Attended", "Not Attended", "Date Booked", "Date of Trial"].map((label, i) => (
                                                <label key={i} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="peer hidden"
                                                        checked={
                                                            label === "Attended"
                                                                ? checkedStatuses.attended
                                                                : label === "Not Attended"
                                                                    ? checkedStatuses.notAttended
                                                                    : label === "Date Booked"
                                                                        ? checkedStatuses.dateBooked
                                                                        : checkedStatuses.dateOfTrial
                                                        }
                                                        onChange={() => handleCheckboxChange(label)}
                                                    />
                                                    <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                                        <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                                                    </span>
                                                    <span>{label}</span>
                                                </label>
                                            ))}

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={savedAgent?.length > 0} // checked if some agents are saved
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            fetchBookFreeTrials();
                                                            setShowPopup(true); // open popup
                                                        } else {
                                                            // Clear everything if unchecked
                                                            setSavedAgent([]);
                                                            setTempSelectedAgents([]);
                                                        }
                                                    }}
                                                    className="peer hidden"
                                                />
                                                <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                                    <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                                                </span>
                                                <span>Agent</span>
                                            </label>
                                        </div>
                                    </div>
                                    {showPopup && (
                                        <div
                                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                            onClick={() => {
                                                // click outside → reset everything
                                                setShowPopup(false);
                                                setSavedAgent([]);
                                                setTempSelectedAgents([]);
                                            }}
                                        >
                                            <div
                                                ref={popupRef}
                                                className="bg-white rounded-2xl p-6 w-[300px] space-y-4 shadow-lg"
                                                onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                                            >
                                                <h2 className="text-lg font-semibold">Select agent(s)</h2>
                                                <div className="space-y-3 max-h-72 overflow-y-auto">
                                                    {bookedByAdmin.map((admin, index) => {
                                                        const isSelected = tempSelectedAgents.some(
                                                            (a) => a.id === admin.id
                                                        );

                                                        return (
                                                            <label key={index} className="flex items-center gap-3 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        if (isSelected) {
                                                                            setTempSelectedAgents((prev) =>
                                                                                prev.filter((a) => a.id !== admin.id)
                                                                            );
                                                                        } else {
                                                                            setTempSelectedAgents((prev) => [
                                                                                ...prev,
                                                                                { id: admin.id, firstName: admin.firstName, lastName: admin.lastName },
                                                                            ]);
                                                                        }
                                                                    }}
                                                                    className="hidden peer"
                                                                />
                                                                <span className="w-4 h-4 border rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center">
                                                                    {isSelected && (
                                                                        <svg
                                                                            className="w-3 h-3 text-white"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth={2}
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </span>
                                                                <img
                                                                    src={admin.profile ? `${API_BASE_URL}${admin.profile}` : "/members/dummyuser.png"}
                                                                    alt={`${admin.firstName} ${admin.lastName && admin.lastName !== 'null' ? ` ${admin.lastName}` : ''}`}
                                                                    className="w-8 h-8 rounded-full"
                                                                />
                                                                <span>
                                                                    {admin?.firstName || admin?.lastName
                                                                        ? `${admin?.firstName ?? ""}${admin.lastName && admin.lastName !== 'null' ? ` ${admin.lastName}` : ''}`.trim()
                                                                        : "N/A"}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    className="w-full bg-blue-600 text-white rounded-md py-2 font-medium"
                                                    onClick={handleNext}
                                                    disabled={tempSelectedAgents.length === 0}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                                            {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                                                <div key={day} className="font-medium text-center">
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
                            <div className="grid md:grid-cols-3 gap-2 justify-between">
                                <button

                                    onClick={() => {
                                        if (!selectedStudents || selectedStudents.length === 0) {
                                            showWarning("No students selected", "Please select at least one student before sending an email.");
                                            return;
                                        }

                                        sendFreeTrialmail(selectedStudents);
                                    }}
                                    className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-3 py-2 rounded-xl  text-[16px]"
                                >
                                    <img
                                        src="/images/icons/mail.png"
                                        className="w-4 h-4 sm:w-5 sm:h-5"
                                        alt="mail"
                                    />
                                    Send Email
                                </button>

                                <button
                                    onClick={() => {
                                        if (!selectedStudents || selectedStudents.length === 0) {
                                            showWarning("No students selected", "Please select at least one student before sending an email.");
                                            return;
                                        }

                                        sendText(selectedStudents);
                                    }}
                                    className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-3 py-2 rounded-xl  text-[16px]">
                                    <img src='/images/icons/sendText.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                    {textloading ? (
                                        <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
                                    ) : (
                                        <>
                                            Send Text
                                        </>
                                    )}
                                </button>
                                <button onClick={exportFreeTrials} className="flex gap-1 items-center justify-center bg-[#237FEA] text-white px-3 py-2 rounded-xl  text-[16px]">
                                    <img src='/images/icons/download.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                    Export Data
                                </button>
                            </div>
                        </div>

                    )
                }



                {
                    showAgentPopup && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
                            onClick={() => setShowAgentPopup(false)}
                        >
                            <div
                                className="bg-white rounded-lg overflow-y-auto shadow-xl max-w-md w-full p-8 relative"
                                onClick={(e) => e.stopPropagation()}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="admin-list-title"
                            >
                                <h2
                                    id="admin-list-title"
                                    className="text-md font-extrabold mb-6 text-gray-800"
                                >
                                    Select any one admin for assign
                                </h2>

                                {agentsLoading ? (
                                    <p className="text-center text-gray-500 text-lg">Loading admins...</p>
                                ) : agentsData.length > 0 ? (
                                    <ul className="space-y-4 ">
                                        {agentsData.map((admin) => {
                                            const isSelected = selectedAdminId === admin.id;
                                            return (
                                                <li
                                                    key={admin.id}
                                                    tabIndex={0}
                                                    onClick={() => setSelectedAdminId(admin.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            setSelectedAdminId(admin.id);
                                                        }
                                                    }}
                                                    className={`
                  cursor-pointer select-none rounded-lg py-4 px-6 text-lg font-semibold
                  transition-all duration-300 ease-in-out
                  ${isSelected
                                                            ? "bg-[#0098d9] text-white shadow-lg shadow-blue-300/60"
                                                            : "bg-[#a3def7] text-black hover:bg-blue-200"
                                                        }
                `}
                                                    role="button"
                                                    aria-pressed={isSelected}
                                                >
                                                    {admin.firstName} {admin.lastName}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-500 text-lg">No admins found.</p>
                                )}

                                <div className="flex justify-end gap-4 mt-8">
                                    <button
                                        onClick={() => setShowAgentPopup(false) & setSelectedAdminId(null)}
                                        className="px-6 py-3 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold transition"
                                        type="button"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        disabled={!selectedAdminId && selectedAdmin?.status == "assigned"}
                                        onClick={() => {
                                            if (selectedAdminId) {
                                                handleAgentSubmit(selectedAdminId);
                                                setShowAgentPopup(false);
                                            } else {
                                                alert("Please select an admin before submitting.");
                                            }
                                        }}
                                        className="px-6 py-3 rounded-md bg-blue-500 hover:bg-[#0098d9] text-white font-semibold transition"
                                        type="button"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>

        </div>
    )
}

export default trialLists