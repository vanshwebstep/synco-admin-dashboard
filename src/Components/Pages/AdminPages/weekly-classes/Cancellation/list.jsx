import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FiSearch } from "react-icons/fi";
import { ChevronLeft, Loader2, ChevronRight } from "lucide-react";
import Select from "react-select";
import { Check, Filter } from "lucide-react";
import { useBookFreeTrial } from '../../contexts/BookAFreeTrialContext';
import { useNavigate } from "react-router-dom";
import Loader from '../../contexts/Loader';
import { usePermission } from '../../Common/permission';
import * as XLSX from "xlsx";
import { showError, showSuccess, showWarning } from '../../../../../utils/swalHelper';
import { useLocation } from "react-router-dom";

import { saveAs } from "file-saver";
import StatsGrid from '../../Common/StatsGrid';
import DynamicTable from '../../Common/DynamicTable';
import { useEmail } from '../../contexts/messages/SendEmailContext';
import { useTextPopup } from '../../contexts/messages/SendTextContext';
const CancellationList = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [tempSelectedAgents, setTempSelectedAgents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const location = useLocation();
    const [isFilterApplied, setIsFilterApplied] = useState(false);
    const [textloading, setTextLoading] = useState(null);
    const token = localStorage.getItem("adminToken");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const { openEmailPopup } = useEmail();
    const { openTextPopup } = useTextPopup();

    const [active, setActive] = useState("request"); // default selected
    const [showFilter, setShowFilter] = useState(false);
    const [showAgentPopup, setShowAgentPopup] = useState(null);
    const [agentsLoading, setAgentsLoading] = useState(null);
    const [agentsData, setAgentsData] = useState([]);
    const [selectedAdminId, setSelectedAdminId] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [savedAgent, setSavedAgent] = useState([]);
    const popupRef = useRef(null);

    const buttons = [
        { key: "request", label: "Request to Cancel" },
        { key: "full", label: "Full Cancellation" },
        { key: "all", label: "All" },
    ];
    useEffect(() => {
        if (location.state === "fullCancellation") {
            setActive("full");
        } else if (location.state === "allCancellation") {
            setActive("all");
        }
    }, [location.state]);

    const { fetchFullCancellations, fetchRequestToCancellations, fetchAllCancellations, statsFreeTrial, bookFreeTrials, setSearchTerm, bookedByAdmin, searchTerm, loading, selectedVenue, setSelectedVenue, myVenues } = useBookFreeTrial() || {};
    const isWebsiteSourceSelected = useMemo(() => {
        if (!selectedStudents || selectedStudents.length === 0) return true;
        return (bookFreeTrials || [])
            .filter(trial => selectedStudents?.includes(trial?.id))
            .every(s => s?.source?.trim()?.toLowerCase() === "website");
    }, [bookFreeTrials, selectedStudents]);
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

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.message || "Failed to assign booking");
            }

            showSuccess("Booking assigned successfully!");

            fetchRequestToCancellations();
            setSelectedStudents([]);

        } catch (error) {
            console.error("Error assigning booking:", error);
            showError(error.message || "Something went wrong.");
        } finally {
            setAgentsLoading(false);
        }
    };
    const handleClick = () => {
        if (selectedStudents.length === 0) {
            showWarning("Warning", 'Please select at least 1 student');
            return;
        }
        const matchedStudents = (bookFreeTrials || []).filter(
            trial =>
                selectedStudents?.includes(trial?.id) &&
                trial?.assignedAgentId != null
        );

        const hasAssignedStudents = matchedStudents.some(
            s => s?.status === "assigned"
        );

        if (hasAssignedStudents) {
            showWarning(
                "Warning",
                "One or more selected students are already assigned to an agent. Please deselect them to proceed."
            );
            return;
        }
        fetchAllAgents();
    };
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
            await fetchRequestToCancellations();
            setTextLoading(false);
        }
    };
    const exportFreeTrials = () => {
        const dataToExport = [];
        bookFreeTrials?.forEach((item) => {
            const bookingId = item.id || item.bookingId;
            if (selectedStudents.length > 0 && !selectedStudents.includes(bookingId)) return;

            (item.students || []).forEach((student) => {
                dataToExport.push({
                    Name: `${student.studentFirstName} ${student?.studentLastName || ""}`,
                    Age: student.age,
                    Venue: item.venue?.name || "-",
                    'Date of Booking': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
                    'Date of Trial': item.trialDate ? new Date(item.trialDate).toLocaleDateString() : "-",
                    Source: item.parents?.[0]?.howDidYouHear || "-",
                    Attempts: "0",
                    Status: item.status,
                });
            });
        });

        if (!dataToExport.length) return showWarning("No Data", 'No data to export');

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'FreeTrials');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'Cancellations.xlsx');
    };

    const [checkedStatuses, setCheckedStatuses] = useState({
        request_to_cancel: false,
        cancelled: false,
        dateBooked: false,
        dateOfTrial: false,
    });

    const [selectedDates, setSelectedDates] = useState([]);
    const handleCheckboxChange = (label) => {
        setCheckedStatuses((prev) => {
            switch (label) {
                case "Request to cancel":
                    return { ...prev, request_to_cancel: !prev.request_to_cancel };
                case "Cancelled":
                    return { ...prev, cancelled: !prev.cancelled };
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

    // console.log('bookedByAdmin', bookedByAdmin)

    useEffect(() => {
        const venueName = selectedVenue?.label || "";
        // console.log('venueName', venueName)
        if (active === "request") {
            fetchRequestToCancellations("", venueName);
            // console.log('1')
        } else if (active === "full") {
            fetchFullCancellations("", venueName);
            // console.log('2')

        } else if (active === "all") {

            // console.log('3')
            fetchAllCancellations("", venueName);
        } else {
            // console.log('4')
            // fallback
            fetchFullCancellations();
        }
    }, [selectedVenue, active]);

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

    const stats = useMemo(() => [
        {
            title: "Total Request",
            value: statsFreeTrial?.totalRequests?.value || "0",
            icon: "/DashboardIcons/🔢.png",
            change: statsFreeTrial?.totalRequests?.change != null
                ? `${statsFreeTrial.totalRequests.change}`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F3FAF5]"
        },
        {
            title: "Avg.Tenure",
            value: statsFreeTrial?.avgTenure?.value ? `${statsFreeTrial.avgTenure.value}`.trim() : "0",
            subValue: `${statsFreeTrial?.avgTenure?.change ?? ""}`,
            icon: "/DashboardIcons/📊.png",
            color: "text-green-500",
            bg: "bg-[#F3FAFD]"
        },
        {
            title: "Most Request venue",
            value: statsFreeTrial?.mostRequestedVenue?.value || "0",
            icon: "/DashboardIcons/📍.png",
            change: statsFreeTrial?.mostRequestedVenue?.change != null
                ? `${statsFreeTrial.mostRequestedVenue.change}`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F0F9F9]"
        },
        {
            title: "Common Reason",
            value: statsFreeTrial?.commonReason?.value || "0",
            icon: "/DashboardIcons/💬.png",
            subValue: statsFreeTrial?.commonReason?.change != null
                ? `${statsFreeTrial.commonReason.change}`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#FEF6FB]"
        },
        {
            title: "High Risk Age Group",
            value: statsFreeTrial?.highestRiskAgeGroup?.value ? `${statsFreeTrial.highestRiskAgeGroup.value}`.trim() : "0",
            subValue: statsFreeTrial?.highestRiskAgeGroup?.change != null
                ? `${statsFreeTrial.highestRiskAgeGroup.change}`
                : "0%",
            icon: "/DashboardIcons/🎯.png",
            color: "text-green-500",
            bg: "bg-[#F3FAFD]"
        },
    ], [statsFreeTrial]);
    const applyFilter = () => {
        const forAttend = checkedStatuses.request_to_cancel || "";
        const forNotAttend = checkedStatuses.cancelled || "";

        let forDateOkBookingTrial = "";
        let forDateOfTrial = "";
        let forOtherDate = "";

        const bookedDatesChecked = checkedStatuses.dateBooked;
        const trialDatesChecked = checkedStatuses.dateOfTrial;
        if ((fromDate && !toDate) || (!fromDate && toDate)) {
            showError("Missing Date", "Please select both Start Date and End Date.");
            return; // Stop further execution
        }
        if (fromDate && toDate) {
            if (bookedDatesChecked) {
                forDateOkBookingTrial = [fromDate, toDate];
            } else if (trialDatesChecked) {
                forDateOfTrial = [fromDate, toDate];
            } else {
                forOtherDate = [fromDate, toDate];
            }
        }
        setIsFilterApplied(true);
        const bookedByParams = savedAgent || [];
        if (active === "request") {
            fetchRequestToCancellations(
                "",
                "",
                forAttend,
                forNotAttend,
                forDateOkBookingTrial,
                forDateOfTrial,
                forOtherDate,
                bookedByParams
            );
        } else if (active === "full") {
            fetchFullCancellations(
                "",
                "",
                forAttend,
                forNotAttend,
                forDateOkBookingTrial,
                forDateOfTrial,
                forOtherDate,
                bookedByParams
            );
        } else if (active === "all") {
            fetchAllCancellations(
                "",
                "",
                forAttend,
                forNotAttend,
                forDateOkBookingTrial,
                forDateOfTrial,
                forOtherDate,
                bookedByParams
            );
        }
    };

    // Close popup if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
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
            // console.log("selectedNames", tempSelectedAgents);
        } else {
            setSavedAgent([]); // nothing selected → clear
        }
        setShowPopup(false);
    };
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Fetch data with search value (debounce optional)
        if (active === "request") {
            fetchRequestToCancellations(value);
        } else if (active === "full") {
            fetchFullCancellations(value);
        } else if (active === "all") {
            fetchAllCancellations(value);
        }
    };
    // console.log('statsFreeTrial', statsFreeTrial)
    const { checkPermission } = usePermission();

    useEffect(() => {
        if (isFilterApplied) {
            setIsFilterApplied(false)
        }
    }, [isFilterApplied]);
    const canServicehistory =
        checkPermission({ module: 'service-history', action: 'view-listing' })

    const commonColumns = [
        {
            header: "Parent Name",
            key: "name",
            selectable: true,
            render: (item) =>
                `${item.parents?.[0]?.parentFirstName || ""} ${item.parents?.[0]?.parentLastName || ""}`,
        },
        {
            header: "No. Of Students",
            render: (item) => item.totalStudents || item.students?.length || 0,
        },
        {
            header: "Venue",
            render: (item) => item.venue?.name || "-",
        },
        {
            header: "Membership Start Date",
            render: (item) =>
                item.startDate
                    ? new Date(item.startDate).toLocaleDateString()
                    : item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
        },
    ];

    const currentColumns = useMemo(() => {
        if (active === "full") {
            return [
                ...commonColumns,
                {
                    header: "Membership End Date",
                    render: (item) => item.endDate ? new Date(item.endDate).toLocaleDateString() : "-",
                },
                {
                    header: "Membership Plan",
                    render: (item) => item.paymentPlan?.title || "-",
                },
                {
                    header: "Life Cycle",
                    render: (item) => {
                        if (!item.paymentPlan) return "-";
                        const { duration, interval } = item.paymentPlan;
                        const intervalLabel = duration === 1 ? interval : `${interval}s`;
                        return `${duration} ${intervalLabel}`;
                    },
                },
                {
                    header: "Reason",
                    render: (item) => (
                        <div className="flex text-center justify-center rounded-lg p-1 gap-2 bg-yellow-100 text-yellow-600 capitalize">
                            {item.cancelReason || 'Other'}
                        </div>
                    ),
                },
            ];
        }

        const additionalCols = active === "request" || active === "all" ? [
            {
                header: "Request Date",
                render: (item) => item.cancelDate ? new Date(item.cancelDate).toLocaleDateString() : "-",
            },
            {
                header: "Membership Plan",
                render: (item) => item.paymentPlan?.title || "-",
            },
            {
                header: "Tenure",
                render: (item) => {
                    if (!item.paymentPlan) return "-";
                    const { duration, interval } = item.paymentPlan;
                    const intervalLabel = duration === 1 ? interval : `${interval}s`;
                    return `${duration} ${intervalLabel}`;
                },
            },
            {
                header: "Reason",
                render: (item) => (
                    <div className={`flex text-center justify-center rounded-lg p-1 gap-2 ${active === "request" ? "bg-[#eda6001f] text-[#EDA600]" : "bg-yellow-100 text-yellow-600"} capitalize`}>
                        {item.cancelReason || 'Other'}
                    </div>
                ),
            },
        ] : [];

        return [...commonColumns, ...additionalCols];
    }, [active]);

    let cancelType = "";

    if (active === "request") cancelType = "request to cancel";
    else if (active === "all") cancelType = "all cancel";
    else if (active === "full") cancelType = "full cancel";
    // console.log('myVenues',myVenues)

    return (
        <div className="pt-1 bg-gray-50 min-h-screen">

            <div className="md:flex w-full gap-4">
                <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>
                    <div className="flex flex-col md:flex-row py-6 pb-10 gap-4">
                        {buttons.map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => {
                                    setActive(btn.key);
                                    setSelectedStudents([]);
                                }}
                                className={`w-full md:w-auto flex gap-2 items-center px-3 py-2 rounded-xl text-sm text-[16px] transition ${active === btn.key
                                    ? "bg-[#237FEA] text-white" // active
                                    : "text-gray-700 font-semibold border border-gray-300" // inactive
                                    }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <Loader />
                    ) : (
                        <>
                            <StatsGrid stats={stats} variant="A" />
                            <div className="flex justify-between items-center ">
                                <h2 className='text-2xl font-semibold'>{active == "request" ? "Request to cancel" : "Full to cancel"}</h2>
                                <div className="flex justify-end items-center gap-2">
                                    <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center"> <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                                    </div>
                                    <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                                        <img
                                            onClick={isWebsiteSourceSelected ? handleClick : undefined}
                                            src="/DashboardIcons/user-add-02.png"
                                            alt=""
                                            className={`${isWebsiteSourceSelected ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DynamicTable
                                columns={currentColumns}
                                data={bookFreeTrials}
                                selectedIds={selectedStudents}
                                setSelectedStudents={setSelectedStudents}
                                from={cancelType}
                                onRowClick={
                                    canServicehistory
                                        ? (item) =>
                                            navigate("/weekly-classes/cancellation/account-info/list", {
                                                state: {
                                                    itemId: item.id || item.bookingId,
                                                    cancelType: active,
                                                },
                                            })
                                        : undefined
                                }
                                isFilterApplied={isFilterApplied}
                            />
                        </>
                    )}

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
                                        options={myVenues?.map((venue) => ({
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

                                        {["Request to cancel", "Cancelled"].map((label, i) => (
                                            <label key={i} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="peer hidden"
                                                    checked={
                                                        label === "Request to cancel"
                                                            ? checkedStatuses.request_to_cancel
                                                            : label === "Cancelled"
                                                                ? checkedStatuses.cancelled
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
                                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={savedAgent?.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setShowPopup(true);
                                                    } else {
                                                        setSavedAgent([]);
                                                        setTempSelectedAgents([]);
                                                    }
                                                }}
                                                className="hidden peer"
                                            />
                                            <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                                <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                                            </span>
                                            <span className="font-semibold text-[16px]">Booked By</span>
                                        </label>
                                    </div>
                                </div>
                                {showPopup && (
                                    <div
                                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]"
                                        onClick={() => {
                                            setShowPopup(false);
                                            setSavedAgent([]);
                                            setTempSelectedAgents([]);
                                        }}
                                    >
                                        <div
                                            ref={popupRef}
                                            className="bg-white rounded-[32px] p-8 w-[380px] shadow-2xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h2 className="text-[22px] font-bold mb-6 text-[#1A1A1A]">Select agent</h2>
                                            
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {bookedByAdmin.map((admin, index) => {
                                                    const isSelected = tempSelectedAgents.some(
                                                        (a) => a.id === admin.id
                                                    );

                                                    return (
                                                        <label key={index} className="flex items-center gap-4 cursor-pointer group">
                                                            <div className="relative flex items-center justify-center">
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
                                                                    className="peer hidden"
                                                                />
                                                                <div className="w-6 h-6 border-2 border-gray-200 rounded-md peer-checked:bg-[#237FEA] peer-checked:border-[#237FEA] transition-all flex items-center justify-center">
                                                                    <Check className={`w-4 h-4 text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full border-2 border-[#E8F3FF] overflow-hidden">
                                                                    <img
                                                                        src={admin.profile ? `${API_BASE_URL}${admin.profile}` : "/members/dummyuser.png"}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <span className="text-[17px] font-semibold text-[#333]">
                                                                    {admin?.firstName || admin?.lastName
                                                                        ? `${admin?.firstName ?? ""}${admin.lastName && admin.lastName !== 'null' ? ` ${admin.lastName}` : ''}`.trim()
                                                                        : "N/A"}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                className="w-full bg-[#237FEA] text-white rounded-2xl py-4 mt-8 font-bold text-lg hover:bg-blue-600 transition shadow-lg shadow-blue-200 disabled:opacity-50"
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
                        <div className="grid grid-cols-3 gap-2 mt-5 justify-between">
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

                            <button onClick={() => {
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
                            }} className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]">
                                <img src='/images/icons/sendText.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                {textloading ? (
                                    <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
                                ) : (
                                    <>
                                        Send Text
                                    </>
                                )}
                            </button>
                            <button onClick={exportFreeTrials} className="flex gap-1 items-center justify-center bg-[#237FEA] text-white px-2 py-2 rounded-xl  text-[16px]">
                                <img src='/images/icons/download.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                Export Data
                            </button>
                        </div>


                    </div>

                )}

            </div>
            {
                showAgentPopup && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]"
                        onClick={() => {
                            setShowAgentPopup(false);
                            setSelectedAdminId(null);
                        }}
                    >
                        <div
                            className="bg-white rounded-[32px] p-8 w-[380px] shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-list-title"
                        >
                            <h2
                                id="admin-list-title"
                                className="text-[22px] font-bold mb-6 text-[#1A1A1A]"
                            >
                                Select agent
                            </h2>

                            {agentsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#237FEA]" />
                                </div>
                            ) : agentsData.length > 0 ? (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {agentsData.map((admin) => {
                                        const isSelected = selectedAdminId === admin.id;
                                        return (
                                            <div
                                                key={admin.id}
                                                onClick={() => setSelectedAdminId(admin.id)}
                                                className={`flex items-center gap-4 p-2 rounded-2xl cursor-pointer transition-all group ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <div className={`w-6 h-6 border-2 rounded-full transition-all flex items-center justify-center ${isSelected ? 'bg-[#237FEA] border-[#237FEA]' : 'border-gray-200'}`}>
                                                        <div className={`w-2 h-2 bg-white rounded-full transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border-2 border-[#E8F3FF] overflow-hidden">
                                                        <img
                                                            src={admin.profile ? `${API_BASE_URL}${admin.profile}` : "/members/dummyuser.png"}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <span className={`text-[17px] font-semibold transition-colors ${isSelected ? 'text-[#237FEA]' : 'text-[#333]'}`}>
                                                        {admin.firstName} {admin.lastName}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-10">No agents found.</p>
                            )}

                            <div className="flex flex-col gap-3 mt-8">
                                <button
                                    disabled={!selectedAdminId}
                                    onClick={() => {
                                        if (selectedAdminId) {
                                            handleAgentSubmit(selectedAdminId);
                                            setShowAgentPopup(false);
                                        } else {
                                            showWarning("Please select an agent before submitting.");
                                        }
                                    }}
                                    className="w-full bg-[#237FEA] text-white rounded-2xl py-4 font-bold text-lg hover:bg-blue-600 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                                    type="button"
                                >
                                    Assign
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAgentPopup(false);
                                        setSelectedAdminId(null);
                                    }}
                                    className="w-full py-2 text-gray-500 font-semibold hover:text-gray-700 transition"
                                    type="button"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >


    )
}

export default CancellationList