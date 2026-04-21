import React, { useEffect, useRef, useState } from 'react';
import { FiSearch } from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "react-select";
import { Check, Filter } from "lucide-react";
import { useBookFreeTrial } from '../../contexts/BookAFreeTrialContext';
import { useNavigate } from "react-router-dom";
import Loader from '../../contexts/Loader';
import { usePermission } from '../../Common/permission';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import StatsGrid from '../../Common/StatsGrid';
import DynamicTable from '../../Common/DynamicTable';
import { showWarning } from '../../../../../utils/swalHelper';

const WaitingLists = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    // const [selectedDate, setSelectedDate] = useState(null);
    const { fetchAddtoWaitingList, statsFreeTrial, bookFreeTrials, setSearchTerm, bookedByAdmin, searchTerm, loading, selectedVenue, setStatus, status, setSelectedVenue, myVenues, setMyVenues, sendWaitingListMail, setLoading } = useBookFreeTrial() || {};

    const [showFilter, setShowFilter] = useState(false);

    const navigate = useNavigate();

    console.log('bookedByAdmin', bookedByAdmin)
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (selectedVenue) {
                    await fetchAddtoWaitingList("", selectedVenue.label); // Using label as venueName
                } else if (status) {
                    await fetchAddtoWaitingList("", "", status); // Using status
                } else {
                    setLoading(true);
                    await fetchAddtoWaitingList();
                    setLoading(false);
                    // No filter
                }
            } catch (error) {
                console.error("Error fetching waiting list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedVenue, status, fetchAddtoWaitingList]);


    const formatLabel = (str) => {
        if (!str) return "-";

        return str
            .replace(/_/g, " ")                  // snake_case → snake case
            .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → camel Case
            .toLowerCase()                       // everything lowercase first
            .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
    };
    const [tempSelectedAgents, setTempSelectedAgents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const toggleSelect = (studentId) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId) // remove if already selected
                : [...prev, studentId] // add if not selected
        );
    };

    const getStatusBadge = (status) => {
        const s = status.toLowerCase();
        let styles =
            "bg-red-100 text-red-500"; // default fallback
        if (s === "attended" || s === "active")
            styles = "bg-green-100 text-green-600";
        else if (s === "pending") styles = "bg-yellow-100 text-yellow-600";
        else if (s === "frozen") styles = "bg-blue-100 text-blue-600";
        else if (s === "waiting list") styles = "bg-gray-200 text-gray-700";

        return (
            <div
                className={`flex text-center justify-center rounded-lg p-1 gap-2 ${styles} capitalize`}
            >
                {formatLabel(status)}
            </div>
        );
    };

    const exportWaitingList = () => {
        const dataToExport = [];

        bookFreeTrials?.forEach((item) => {
            if (selectedStudents.length > 0 && !selectedStudents.includes(item.id)) return;

            item.students.forEach((student) => {
                dataToExport.push({
                    Name: `${student.studentFirstName} ${student?.studentLastName || ""}`,
                    Age: student.age || "-",
                    Venue: item.venue?.name || "-",
                    "Date Added": new Date(item.createdAt).toLocaleDateString(),
                    "Added By": `${item.bookedByAdmin?.firstName || ""} ${item.bookedByAdmin?.lastName && item.bookedByAdmin?.lastName !== "null"
                        ? item.bookedByAdmin.lastName
                        : ""
                        }`.trim(),
                    "Days Waiting": item?.waitingDays ,
                    "Interest level": item.interest || "-",
                    Status: formatLabel(item.status) || "-",
                });
            });
        });

        if (!dataToExport.length) return alert("No data to export");

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "WaitingList");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "WaitingList.xlsx");
    };

    const [checkedStatuses, setCheckedStatuses] = useState({
        interest1Low: false,
        interest2Medium: false,
        interest3High: false,
        dateOfTrial: false,
    });

    const [selectedDates, setSelectedDates] = useState([]);
    const handleCheckboxChange = (label) => {
        setCheckedStatuses((prev) => {
            switch (label) {
                case "Interest 1 (Low)":
                    return { ...prev, interest1Low: !prev.interest1Low };
                case "Interest 2 Medium":
                    return { ...prev, interest2Medium: !prev.interest2Medium };
                case "Interest 3 High":
                    return { ...prev, interest3High: !prev.interest3High };
                case "Date of Trial":
                    return { ...prev, dateOfTrial: !prev.dateOfTrial };
                default:
                    return prev;
            }
        });
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
        setFromDate(null);
        setToDate(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setFromDate(null);
        setToDate(null);
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
            title: "Top Referrer",
            value: statsFreeTrial?.totalFreeTrials?.value || "0",
            icon: "/DashboardIcons/🏆.png", // Replace with actual SVG if needed
            change: statsFreeTrial?.totalFreeTrials?.change != null
                ? `${statsFreeTrial.totalFreeTrials.change}%`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F3FAF5]"
        },
        {
            title: "Total on Waiting List",
            value: statsFreeTrial?.freeTrialAttendanceRate?.value || "0",
            icon: "/DashboardIcons/📋.png",
            change: statsFreeTrial?.freeTrialAttendanceRate?.change != null
                ? `${statsFreeTrial.freeTrialAttendanceRate.change}%`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#FEF6FB]"
        },
        {
            title: "Avg. Interest Level",
            value: statsFreeTrial?.avgInterest,
            subValue: "",
            icon: "/DashboardIcons/📈.png",
            color: "text-green-500",
            bg: "bg-[#F3FAFD]"
        },

        {
            title: "Avg. Days Waiting",
            value: statsFreeTrial?.avgDaysWaiting?.value || "0",
            icon: "/DashboardIcons/⏱️.png",
            change: statsFreeTrial?.trialsToMembers?.change != null
                ? `${statsFreeTrial.trialsToMembers.change}%`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F0F9F9]"
        },
        {
            title: "Most Requested Venue",
            value: statsFreeTrial?.freeTrialAttendanceRate?.value || "0",
            icon: "/DashboardIcons/📍.png",
            change: statsFreeTrial?.freeTrialAttendanceRate?.change != null
                ? `${statsFreeTrial.freeTrialAttendanceRate.change}%`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#FEF6FB]"
        },
    ];
    const applyFilter = () => {
        const forAttend = checkedStatuses.interest1Low || "";
        const forNotAttend = checkedStatuses.interest2Medium || "";
        const forHigh = checkedStatuses.interest3High || "";

        let forDateOkBookingTrial = "";
        let forDateOfTrial = "";
        let forOtherDate = "";

        const bookedDatesChecked = checkedStatuses.interest3High;
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

        fetchAddtoWaitingList(
            "",
            selectedVenue ? selectedVenue.label : "",
            forAttend,
            forNotAttend,
            forHigh,
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
                (agent) => `${agent.firstName}`
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
        fetchAddtoWaitingList(value);
    };
    console.log('bookedByAdmin', bookedByAdmin)
    const { checkPermission } = usePermission();

    const canServicehistory =
        checkPermission({ module: 'service-history', action: 'view-listing' })

    const waitingListColumns = [
        { header: "Name", key: "name", selectable: true }, // ✅ checkbox + student name
        { header: "Age", render: (item, student) => student.age },
        { header: "Venue", render: (item) => item.venue?.name || "-" },

        {
            header: "Date Added",
            render: (item) => {
                const date = new Date(item.updatedAt);

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
            header: "Added By",
            render: (item) => {
                const source = item?.source?.trim();

                const adminName = item?.bookedByAdmin?.firstName
                    ? `${item.bookedByAdmin.firstName}${item.bookedByAdmin.lastName &&
                        item.bookedByAdmin.lastName !== "null"
                        ? ` ${item.bookedByAdmin.lastName}`
                        : ""
                    }`
                    : "";

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
            header: "Days Waiting",
            render: (item) => item.waitingDays || "N/A",
        },
        {
            header: "Interest level",
            render: (item) => item.interest || "-",
        },
        {
            header: "Status",
            render: (item) => (
                <div
                    className={`flex text-center justify-center rounded-lg p-1 gap-2 ${item.status.toLowerCase() === "attended" ||
                        item.status.toLowerCase() === "active"
                        ? "bg-green-100 text-green-600"
                        : item.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : item.status.toLowerCase() === "frozen"
                                ? "bg-blue-100 text-blue-600"
                                : item.status.toLowerCase() === "waiting list"
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-red-100 text-red-500"
                        } capitalize`}
                >
                    {item.status}
                </div>
            ),
        },
    ];
    if (loading) return <Loader />;
    return (
        <div className="pt-1 bg-gray-50 min-h-screen">

            <div className="md:flex w-full gap-4">
                <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>
                    <StatsGrid stats={stats} variant="A" />


                    <div className="flex justify-end items-center gap-2">
                        <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center"> <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                        </div>
                        <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <img
                                onClick={() => navigate("/holiday-camp/find-a-camp")}
                                src="/DashboardIcons/user-add-02.png" alt="" className="cursor-pointer" />
                        </div>
                    </div>

                    <DynamicTable
                        columns={waitingListColumns}
                        data={bookFreeTrials} // 👈 still the same data source
                        selectedIds={selectedStudents}
                        setSelectedStudents={setSelectedStudents}
                        from={'waitingList'}
                        onRowClick={
                            canServicehistory
                                ? (item) =>
                                    navigate(
                                        "/holiday-camp/waiting-list/account-information",
                                        { state: { itemId: item.id } }
                                    )
                                : undefined
                        }
                    />


                </div>

                {showFilter && (
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

                                        {["Interest 1 (Low)", "Interest 2 Medium", "Interest 3 High"].map((label, i) => (
                                            <label key={i} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="peer hidden"
                                                    checked={
                                                        label === "Interest 1 (Low)"
                                                            ? checkedStatuses.interest1Low
                                                            : label === "Interest 2 Medium"
                                                                ? checkedStatuses.interest2Medium
                                                                : label === "Interest 3 High"
                                                                    ? checkedStatuses.interest3High
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
                                                        fetchAddtoWaitingList();
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
                                            <span>Agent Name</span>
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
                                                                src={`${API_BASE_URL}${admin.profile}`}
                                                                alt={
                                                                    admin?.firstName || admin?.lastName
                                                                        ? `${admin?.firstName ?? ""} ${admin?.lastName && admin.lastName !== "null" ? admin.lastName : ""}`.trim()
                                                                        : "Unknown Admin"
                                                                }
                                                                className="w-8 h-8 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "/members/dummyuser.png";
                                                                }}
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
                        <div className="grid grid-cols-3 gap-2 mt-5  justify-between">
                            <button
                                onClick={() => {
                                    if (!selectedStudents || selectedStudents.length === 0) {
                                        showWarning("No students selected", "Please select at least one student before sending an email.");

                                        return;
                                    }

                                    sendWaitingListMail(selectedStudents);
                                }}
                                className="flex gap-2 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]"
                            >
                                <img
                                    src="/images/icons/mail.png"
                                    className="w-4 h-4 sm:w-5 sm:h-5"
                                    alt="mail"
                                />
                                Send Email
                            </button>


                            <button className="flex gap-2 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]">
                                <img src='/images/icons/sendText.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                Send Text
                            </button>
                            <button onClick={exportWaitingList} className="flex gap-2 items-center justify-center bg-[#237FEA] text-white px-2 py-2 rounded-xl  text-[16px]">
                                <img src='/images/icons/download.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                Export Data
                            </button>
                        </div>
                    </div>

                )}



            </div>

        </div>
    )
}

export default WaitingLists