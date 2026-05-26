import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FiSearch } from "react-icons/fi";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Select from "react-select";
import { Check, Filter, Loader2, X } from "lucide-react";
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from '../../../contexts/Loader';
import { usePermission } from '../../../Common/permission';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { showConfirm, showError, showSuccess, showWarning } from '../../../../../../utils/swalHelper';
import toast from 'react-hot-toast';
import axios from 'axios';
import StatsGrid from '../../../Common/StatsGrid';
import DynamicTable from '../../../Common/DynamicTable';
import { useEmail } from '../../../contexts/messages/SendEmailContext';
import { useTextPopup } from '../../../contexts/messages/SendTextContext';

const WaitingList = () => {
    const [textloading, setTextLoading] = useState(null);
    const { openTextPopup } = useTextPopup();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const { openEmailPopup } = useEmail();

    // const [selectedDate, setSelectedDate] = useState(null);
    const { fetchAddtoWaitingList, statsFreeTrial, bookFreeTrials, setSearchTerm, bookedByAdmin, searchTerm, loading, selectedVenue, setStatus, status, setSelectedVenue, myVenues, setMyVenues, sendWaitingListMail, setLoading } = useBookFreeTrial() || {};
    const [isFilterApplied, setIsFilterApplied] = useState(false);
    const [showFilter, setShowFilter] = useState(false);


    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedFranchise, setSelectedFranchise] = useState(null);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);

    const storedFranchises = localStorage.getItem("franchisesInfo");
    const franchises = storedFranchises && storedFranchises !== "undefined" ? JSON.parse(storedFranchises) : [];
    const franchiseOptions = franchises.map(f => ({
        label: `${f.firstName} ${f.lastName || ""}`.trim() || f.email,
        value: f.id
    }));

    const ageGroupOptions = [
    { label: "1 Year", value: 1 },
    { label: "2 Years", value: 2 },
    { label: "3 Years", value: 3 },
    { label: "4 Years", value: 4 },
    { label: "5 Years", value: 5 },
    { label: "6 Years", value: 6 },
    { label: "7 Years", value: 7 },
    { label: "8 Years", value: 8 },
    { label: "9 Years", value: 9 },
    { label: "10 Years", value: 10 },
    { label: "11 Years", value: 11 },
    { label: "12 Years", value: 12 },
    { label: "13 Years", value: 13 },
    { label: "14 Years", value: 14 },
    { label: "15 Years", value: 15 },
    { label: "16 Years", value: 16 },
    { label: "17+ Years", value: 17 }
];

    const handleFranchiseChange = (franchise) => {
        setSelectedFranchise(franchise);
        setSelectedVenue(null);
        if (franchise) {
            searchParams.set("franchiseId", franchise.value);
            setSearchParams(searchParams);
        } else {
            searchParams.delete("franchiseId");
            setSearchParams(searchParams);
        }
    };

    const franchiseId = searchParams.get("franchiseId");
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
    }, [selectedVenue, status, franchiseId, fetchAddtoWaitingList]);

    const [showAgentPopup, setShowAgentPopup] = useState(null);
    const [agentsLoading, setAgentsLoading] = useState(null);
    const [agentsData, setAgentsData] = useState([]);
    const [selectedAdminId, setSelectedAdminId] = useState(null);

    const handleClick = () => {
        if (selectedStudents.length === 0) {
            showWarning('Please select at least 1 student');
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

    const token = localStorage.getItem("adminToken");
    const fetchAllAgents = useCallback(async () => {
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

            fetchAddtoWaitingList();
            setSelectedStudents([]);

        } catch (error) {
            console.error("Error assigning booking:", error);

            // ✅ show backend error message in Swal
            showError(error.message || "Something went wrong.");
        } finally {
            setAgentsLoading(false);
        }
    };
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
            "bg-red-100 text-[#F04438]"; // default fallback
        if (s === "attended" || s === "active")
            styles = "bg-green-100 text-[#027A48]";
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
                    "Days Waiting": item?.waitingDays,
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
        const startDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        const offset = startDay === 0 ? 6 : startDay - 1;

        for (let i = 0; i < offset; i++) days.push(null);
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
    console.log('statsFreeTrial', statsFreeTrial)
    const stats = [
        {
            title: "Top Referrer",
            value: statsFreeTrial?.topReferrer?.name || "0",
            icon: "/DashboardIcons/🏆.png", // Replace with actual SVG if needed
            change: statsFreeTrial?.topReferrer?.percentage != null
                ? `${statsFreeTrial.topReferrer?.percentage}`
                : "0%",
            color: "text-[#12B76A]",
            bg: "bg-[#F3FAF5]"
        },
        {
            title: "Total on Waiting List",
            value: statsFreeTrial?.totalOnWaitingList?.totalOnWaitingList || "0",
            icon: "/DashboardIcons/📋.png",
            change: statsFreeTrial?.totalOnWaitingList?.percentage != null
                ? `${statsFreeTrial.totalOnWaitingList?.percentage}`
                : "0%",
            color: "text-[#12B76A]",
            bg: "bg-[#FEF6FB]"
        },
        {
            title: "Avg. Interest Level",
            value: statsFreeTrial?.avgInterest?.avgInterest,
            change: statsFreeTrial?.avgInterest?.percentage != null
                ? `${statsFreeTrial.avgInterest?.percentage}`
                : "0%",
            icon: "/DashboardIcons/📈.png",
            color: "text-[#12B76A]",
            bg: "bg-[#F3FAFD]"
        },

        {
            title: "Avg. Days Waiting",
            value: statsFreeTrial?.avgDaysWaiting?.avgDaysWaiting || "0",
            icon: "/DashboardIcons/⏱️.png",
            change: statsFreeTrial?.avgDaysWaiting?.percentage != null
                ? `${statsFreeTrial.avgDaysWaiting?.percentage}`
                : "0%",
            color: "text-[#12B76A]",
            bg: "bg-[#F0F9F9]"
        },
        {
            title: "Most Requested Venue",
            value: statsFreeTrial?.mostRequestedVenue?.name || "0",
            icon: "/DashboardIcons/📍.png",
            change: statsFreeTrial?.mostRequestedVenue?.percentage != null
                ? `${statsFreeTrial.mostRequestedVenue.percentage}`
                : "0%",
            color: "text-[#12B76A]",
            bg: "bg-[#FEF6FB]"
        },
    ];


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
            await fetchAddtoWaitingList();
            setTextLoading(false);
        }
    };
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

        setIsFilterApplied(true);
        fetchAddtoWaitingList(
            "",
            "",
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
        fetchAddtoWaitingList(value);
    };
    console.log('bookedByAdmin', bookedByAdmin)
    const { checkPermission } = usePermission();

    const canServicehistory =
        checkPermission({ module: 'service-history', action: 'view-listing' })
    const handleDelete = useCallback(async () => {
        if (!token) return;

        if (!selectedStudents?.length) {
            showWarning("Please select at least 1 student");
            return;
        }

        const result = await showConfirm(
            "Are you sure?",
            "These members will be permanently deleted.",
            "warning"
        );

        if (!result.isConfirmed) return;

        try {
            await axios.delete(
                `${API_BASE_URL}/api/admin/delete`, // ✅ match your working fetch URL
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    data: {
                        bookingIds: selectedStudents, // ✅ body goes inside `data`
                    },
                }
            );

            showSuccess("Deleted!", "Members removed successfully.");
            fetchAddtoWaitingList();

        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to delete members");
        }
    }, [token, selectedStudents, fetchAddtoWaitingList]);

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
            render: (item) => item?.waitingDays,
        },
        {
            header: "Interest level",
            render: (item) => {
                const map = {
                    low: "1 (Low)",
                    medium: "2 (Medium)",
                    high: "3 (High)",
                };

                return map[item.interest] || "-";
            },
        }
        ,
        {
            header: "Status",
            render: (item) => (
                <div
                    className={`flex text-center justify-center rounded-lg p-1 gap-2 ${item.status.toLowerCase() === "attended" ||
                        item.status.toLowerCase() === "active"
                        ? "bg-green-100 text-[#027A48]"
                        : item.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : item.status.toLowerCase() === "frozen"
                                ? "bg-blue-100 text-blue-600"
                                : item.status.toLowerCase() === "waiting list"
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-red-100 text-[#F04438]"
                        } capitalize`}
                >
                    {item.status}
                </div>
            ),
        },
    ];

   const filteredWaitingList = (bookFreeTrials || []).filter(item => {

    // Venue Filter
    if (selectedVenue) {
        if (item?.venue?.id !== selectedVenue.value) return false;
    }

    // Age Filter
    if (selectedAgeGroup) {
        const hasStudentInAgeGroup = item.students?.some(student => {
            const age = Number(student.age);

            if (isNaN(age)) return false;

            if (selectedAgeGroup.value === 17) {
                return age >= 17;
            }

            return age === selectedAgeGroup.value;
        });

        if (!hasStudentInAgeGroup) return false;
    }

    return true;
});

    if (loading) return <Loader />;
    return (
        <div className="pt-1 bg-gray-50 min-h-screen">

            <div className="md:flex w-full gap-4">
                <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>
                    <StatsGrid stats={stats} variant="A" />

                    <div className="flex justify-end items-center gap-2">
                        <div className="bg-white min-w-[40px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <Trash2 size={18} className='cursor-pointer' onClick={handleDelete} />
                        </div>
                        <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center"> <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                        </div>
                        <div onClick={handleClick} className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <img

                                src="/DashboardIcons/user-add-02.png" alt="" className="cursor-pointer" />
                        </div>
                    </div>

                    <DynamicTable
                        columns={waitingListColumns}
                        data={filteredWaitingList} // 👈 still the same data source
                        selectedIds={selectedStudents}
                        setSelectedStudents={setSelectedStudents}
                        from={'waitingList'}
                        onRowClick={
                            canServicehistory
                                ? (item) =>
                                    navigate(
                                        "/weekly-classes/add-to-waiting-list/account-info",
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
                                {JSON.parse(localStorage.getItem("adminInfo"))?.role?.role === "Super Admin" && (
                                    <div className="mb-5">
                                        <label htmlFor="" className="text-base font-semibold">Organization / Franchise</label>
                                        <div className="relative mt-2 ">
                                            <Select
                                                options={franchiseOptions}
                                                value={selectedFranchise}
                                                onChange={handleFranchiseChange}
                                                placeholder="Choose organization/franchise"
                                                className="mt-2"
                                                classNamePrefix="react-select"
                                                isClearable={true}
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
                                )}
                                <div className="mb-5">
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
                                            options={myVenues
                                                .filter(venue => !selectedFranchise || venue?.adminId === selectedFranchise.value || venue?.admins?.id === selectedFranchise.value)
                                                .map((venue) => ({
                                                    label: venue?.name,
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

                                <div className="mb-5">
                                    <label htmlFor="" className="text-base font-semibold">Age Group</label>
                                    <div className="relative mt-2 ">
                                        <Select
                                            options={ageGroupOptions}
                                            value={selectedAgeGroup}
                                            onChange={(val) => setSelectedAgeGroup(val)}
                                            placeholder="Choose age group"
                                            className="mt-2"
                                            classNamePrefix="react-select"
                                            isClearable={true}
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
                                        if (bookFreeTrials && bookFreeTrials.length > 0) {

                                            // Step 1: Filter only selected bookings
                                            const filteredBookings = bookFreeTrials.filter(b =>
                                                selectedStudents.includes(b.id || b.bookingId)
                                            );
                                            console.log('selectedStudents', selectedStudents)
                                            console.log('bookFreeTrials', bookFreeTrials)
                                            console.log('filteredBookings', filteredBookings)
                                            // Step 2: Extract emails from filtered bookings
                                            const parentEmails = filteredBookings.flatMap(b =>
                                                (b.parents || [])
                                                    .map(p => p.parentEmail)
                                                    .filter(email => email)
                                            );

                                            if (parentEmails.length > 0) {
                                                openEmailPopup(
                                                    parentEmails,
                                                    "/api/admin/send-manual-email",
                                                    { token, showError, showSuccess }
                                                );
                                            } else {
                                                showWarning(
                                                    "No Emails Found",
                                                    "Selected parents do not have valid email addresses."
                                                );
                                            }

                                        } else {
                                            showWarning(
                                                "No Parents Found",
                                                "No parent data available to send email."
                                            );
                                        }
                                    }}
                                    className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl text-[16px]"
                                >
                                    <img
                                        src="/images/icons/mail.png"
                                        className="w-4 h-4 sm:w-5 sm:h-5"
                                        alt=""
                                    />
                                    Send Email
                                </button>

                                <button
                                    onClick={() => {
                                        if (bookFreeTrials && bookFreeTrials.length > 0) {

                                            const filteredBookings = bookFreeTrials.filter(b =>
                                                selectedStudents.includes(b.id || b.bookingId)
                                            );

                                            const parents = filteredBookings.flatMap(b =>
                                                (b.parents || [])
                                                    .filter(p => p.parentPhoneNumber)
                                                    .map(p => ({
                                                        name: `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim(),
                                                        phone: p.parentPhoneNumber
                                                    }))
                                            );

                                            if (parents.length > 0) {
                                                openTextPopup(
                                                    parents,
                                                    "/api/admin/send-manual-text",
                                                    { token, showError, showSuccess }
                                                );
                                            } else {
                                                showWarning(
                                                    "No Phone Numbers",
                                                    "Selected parents do not have valid phone numbers."
                                                );
                                            }

                                        } else {
                                            showWarning(
                                                "No Parents Found",
                                                "No parent data available to send text."
                                            );
                                        }
                                    }}
                                    className="flex gap-2 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]">
                                    <img src='/images/icons/sendText.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                    {textloading ? (
                                        <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
                                    ) : (
                                        <>
                                            Send Text
                                        </>
                                    )}
                                </button>
                                <button onClick={exportWaitingList} className="flex gap-2 items-center justify-center bg-[#237FEA] text-white px-2 py-2 rounded-xl  text-[16px]">
                                    <img src='/images/icons/download.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                    Export Data
                                </button>
                            </div>
                        </div>
                    )
                }



            </div>

            {showAgentPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99] p-4" onClick={() => setShowAgentPopup(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[28px] font-bold text-[#282829]">Select agent</h3>
                            <button
                                onClick={() => setShowAgentPopup(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {agentsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="text-[#237FEA] animate-spin" size={32} />
                                </div>
                            ) : agentsData.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 font-medium">No agents available.</p>
                            ) : (
                                agentsData.map((agent) => {
                                    const isSelected = selectedAdminId === agent.id;
                                    return (
                                        <div
                                            key={agent.id}
                                            className="flex items-center gap-4 py-2 cursor-pointer group"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedAdminId(null);
                                                } else {
                                                    setSelectedAdminId(agent.id);
                                                }
                                            }}
                                        >
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#237FEA] border-[#237FEA]' : 'border-gray-200 group-hover:border-[#237FEA]'
                                                }`}>
                                                {isSelected && <Check size={16} className="text-white" strokeWidth={4} />}
                                            </div>

                                            <div className="relative">
                                                <img
                                                    src={agent.profilePicture || agent.image || (agent.profile ? `${API_BASE_URL}${agent.profile}` : "/images/avatar-placeholder.png")}
                                                    alt=""
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-[#E6F7FB]"
                                                    onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + agent.firstName + "+" + agent.lastName + "&background=E6F7FB&color=237FEA"}
                                                />
                                                <div className="absolute inset-0 rounded-full border-2 border-yellow-400/30 pointer-events-none"></div>
                                            </div>

                                            <span className="text-[20px] font-medium text-[#282829]">
                                                {agent.firstName} {agent.lastName}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={() => handleAgentSubmit(selectedAdminId)}
                                disabled={agentsLoading || !selectedAdminId}
                                className="w-full py-4 bg-[#237FEA] text-white font-bold rounded-2xl hover:bg-[#1a6ed8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-100 text-lg"
                            >
                                {agentsLoading ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    'Assign'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default WaitingList
