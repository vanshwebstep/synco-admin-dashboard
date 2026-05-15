import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Check } from "lucide-react";
import { TiUserAdd } from "react-icons/ti";
import { Plus } from "lucide-react";
import {
    Search,
    Mail,
    MessageSquare,
    Download,
    ChevronLeft,
    ChevronRight, Filter, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecruitmentTemplate } from "../../contexts/RecruitmentContext";
import Loader from "../../contexts/Loader";
import * as XLSX from "xlsx";

import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { showConfirm, showError, showWarning, showSuccess } from "../../../../../utils/swalHelper";
import PhoneInput from "react-phone-input-2";
import { useGlobalSearch } from "../../contexts/GlobalSearchContext";
import { useEmail } from '../../contexts/messages/SendEmailContext';
import { useTextPopup } from '../../contexts/messages/SendTextContext';

const VenueManager = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const { searchQuery } = useGlobalSearch();
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { openEmailPopup } = useEmail();
    const { openTextPopup } = useTextPopup();

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);

    const [showFilter, setShowFilter] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [agentsData, setAgentsData] = useState([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [showAgentPopup, setShowAgentPopup] = useState(false);
    const [isAssigningAgent, setIsAssigningAgent] = useState(false);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [dialCode, setDialCode] = useState("+44");
    const { venueRecruitment, fetchvenuemanagerRecruitment, statsRecruitment, createVenueRecruitment, filteredRecruitment, setFilteredRecruitment, sendvenuemanagerMail } = useRecruitmentTemplate() || {};
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchvenuemanagerRecruitment();
            setLoading(false);
        };
        loadData();
    }, [fetchvenuemanagerRecruitment])
    const handleSelectChange = (field, selected) => {
        setFormData(prev => ({
            ...prev,
            [field]: selected.value,
        }));
    };


    const summaryCards = [
        {
            icon: "/reportsIcons/user-group.png",
            iconStyle: "text-[#3DAFDB] bg-[#E6F7FB]",
            title: "Total Applications",
            key: "totalApplications"
        },
        {
            icon: "/reportsIcons/greenuser.png",
            iconStyle: "text-[#099699] bg-[#E0F7F7]",
            title: "New Applications",
            key: "totalNewApplications"
        },
        {
            icon: "/reportsIcons/login-icon-orange.png",
            iconStyle: "text-[#F38B4D] bg-[#FFF2E8]",
            title: "Applications to assessments",
            key: "totalToAssessments"
        },
        {
            icon: "/reportsIcons/handshake.png",
            iconStyle: "text-[#6F65F1] bg-[#E9E8FF]",
            title: "Applications to recruitment",
            key: "totalToRecruitment"
        }
    ];
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const firstNameRef = useRef(null);
    const lastNameRef = useRef(null);
    const phoneNumberRef = useRef(null);
    const emailRef = useRef(null);
    const postcodeRef = useRef(null);
    const ageRef = useRef(null);
    const coverNoteRef = useRef(null);

    // Add ID to each coach
    const exportToExcel = (data, fileName) => {
        if (!data || data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };
    const handleVenueManagerExport = () => {
        const formattedData = currentData.map((coach) => ({
            Name: `${coach.firstName} ${coach.lastName}`,
            Age: coach.age,
            PostCode: coach.postcode,
            Telephone: coach.phoneNumber,
            Email: coach.email,
            "Management Experience": coach.managementExperience || "-",
            qualification: coach.qualification || [],
            Status: coach.status
                ? coach.status.charAt(0).toUpperCase() + coach.status.slice(1)
                : "-"
        }));

        exportToExcel(formattedData, "venue_managers");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        let formErrors = {};
        let focusRef = null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.firstName?.trim()) { formErrors.firstName = "First Name is required"; if (!focusRef) focusRef = firstNameRef; }
        if (!formData.lastName?.trim()) { formErrors.lastName = "Last Name is required"; if (!focusRef) focusRef = lastNameRef; }
        if (!formData.phoneNumber || formData.phoneNumber.toString().length < 8) { formErrors.phoneNumber = "Valid phone number is required (min 8 digits)"; if (!focusRef) focusRef = phoneNumberRef; }
        if (!formData.email?.trim() || !emailRegex.test(formData.email)) { formErrors.email = "Valid Email Address is required"; if (!focusRef) focusRef = emailRef; }
        if (!formData.postcode?.trim()) { formErrors.postcode = "Postcode is required"; if (!focusRef) focusRef = postcodeRef; }
        if (!formData.age?.toString().trim()) { formErrors.age = "Age is required"; if (!focusRef) focusRef = ageRef; }
        if (!formData.footballExperience?.trim()) { formErrors.footballExperience = "Football experience is required"; }
        if (!formData.managementExperience?.trim()) { formErrors.managementExperience = "Management experience is required"; }
        if (!formData.ageGroupExperience || formData.ageGroupExperience.length === 0) { formErrors.ageGroupExperience = "At least one age group must be selected"; }
        if (!formData.fullWeekendAvailablity?.trim()) { formErrors.fullWeekendAvailablity = "Please select weekend availability"; }
        if (!formData.uploadCv) { formErrors.uploadCv = "CV upload is required"; }
        if (!formData.coverNote?.trim()) { formErrors.coverNote = "Cover note is required"; if (!focusRef) focusRef = coverNoteRef; }
        if (!formData.howDidYouHear?.trim()) { formErrors.howDidYouHear = "Please select how you heard about us"; }

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            if (focusRef?.current) {
                if (typeof focusRef.current.focus === 'function') focusRef.current.focus();
            }
            return;
        }

        try {
            const payload = new FormData();
            payload.append("firstName", formData.firstName);
            payload.append("lastName", formData.lastName);
            payload.append("email", formData.email);
            payload.append("age", formData.age);
            payload.append("phoneNumber", `${dialCode}${formData.phoneNumber}`);
            payload.append("postcode", formData.postcode);
            payload.append("howDidYouHear", formData.howDidYouHear);
            payload.append("accessToOwnVehicle", formData.accessToOwnVehicle);
            payload.append("whichQualificationYouHave", JSON.stringify(formData.whichQualificationYouHave));
            payload.append("footballExperience", formData.footballExperience);
            payload.append("managementExperience", formData.managementExperience);
            payload.append("coverNote", formData.coverNote);
            payload.append("fullWeekEndAvailability", formData.fullWeekendAvailablity ? formData.fullWeekendAvailablity : "");
            if (formData.uploadCv) payload.append("uploadCv", formData.uploadCv);

            payload.append("ageGroupExperience", JSON.stringify(formData.ageGroupExperience)); // ✅ ADD

            await createVenueRecruitment(payload);

            // In payload building:

            // In reset after success:
            setFormData({
                firstName: "", lastName: "", age: "", phoneNumber: "",
                email: "", postcode: "", footballExperience: "",
                accessToOwnVehicle: "true", whichQualificationYouHave: [],
                ageGroupExperience: [],   // ✅ ADD
                uploadCv: null, coverNote: "", howDidYouHear: "",
                fullWeekendAvailablity: '', managementExperience: ''
            });
            setErrors({});
            setIsOpen(false);
            setDialCode("+44");
            setIsSubmitting(false);
        } catch (error) {
            console.error("Failed to add new lead:", error);
            setIsSubmitting(false);
        }
    };


    const [selectedIds, setSelectedIds] = useState([]);

    const toggleCheckbox = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };



    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [studentName, setStudentName] = useState("");
    const [venueName, setVenueName] = useState("");
    const [checkedStatuses, setCheckedStatuses] = useState({
        Pending: false,
        Recruited: false,
        "0-3 Years Exp": false,
        Rejected: false,
        'FA Level 1': false,
        '3+ Years Exp': false,
    });

    const handleInputChange = (e) => {
        setStudentName(e.target.value);
    };

    const handleVenueChange = (selectedOption) => {
        setSelectedVenue(selectedOption);
    };

    const handleCheckboxChange = (key) => {
        setCheckedStatuses((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
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
        setFromDate(null);
        setToDate(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setFromDate(null);
        setToDate(null);
    };

    const handleSendEmail = () => {
        if (selectedIds && selectedIds.length > 0) {
            const filteredManagers = currentData.filter(m => selectedIds.includes(m.id));
            const emails = filteredManagers.map(m => m.email).filter(Boolean);

            if (emails.length > 0) {
                const token = localStorage.getItem("adminToken");
                openEmailPopup(
                    emails,
                    "/api/admin/send-manual-email",
                    { token, showError, showSuccess: () => { } }
                );
            } else {
                showWarning("No Emails Found", "Selected candidates do not have valid email addresses.");
            }
        } else {
            showWarning("No Candidates Selected", "Please select at least one candidate to send an email.");
        }
    };

    const handleSendText = () => {
        if (selectedIds && selectedIds.length > 0) {
            const filteredManagers = currentData.filter(m => selectedIds.includes(m.id));
            const recipients = filteredManagers
                .filter(m => m.phoneNumber)
                .map(m => ({
                    name: `${m.firstName || ""} ${m.lastName || ""}`.trim(),
                    phone: m.phoneNumber
                }));

            if (recipients.length > 0) {
                const token = localStorage.getItem("adminToken");
                openTextPopup(
                    recipients,
                    "/api/admin/send-manual-text",
                    { token, showError, showSuccess: () => { } }
                );
            } else {
                showWarning("No Phone Numbers", "Selected candidates do not have valid phone numbers.");
            }
        } else {
            showWarning("No Candidates Selected", "Please select at least one candidate to send a text.");
        }
    };
    const handleClick = () => {
        if (!selectedIds || selectedIds.length === 0) {
            showWarning("Warning", "Please select at least 1 lead");
            return;
        }

        const selectedLeads = filteredRecruitment.filter((lead) =>
            selectedIds.includes(lead.id)
        );

        setSelectedLeads(selectedLeads);

        // Check already assigned leads
        const alreadyAssigned = selectedLeads.filter(
            (lead) => lead.assignedAgentId != null
        );

        // Check if any selected lead is NOT from website
        const hasNonWebsiteLead = selectedLeads.some(
            (lead) => lead.source !== "website"
        );

        if (alreadyAssigned.length > 0) {
            showWarning(
                "Warning",
                "One or more selected leads are already assigned to an agent."
            );
            return;
        }

        if (hasNonWebsiteLead) {
            showWarning(
                "Warning",
                "Only website leads can be assigned."
            );
            return;
        }

        fetchAllAgents();
    };

    const handleAssignAgent = async () => {
        if (!selectedAgents || selectedAgents.length === 0) {
            showWarning("Warning", "Please select an agent.");
            return;
        }
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setIsAssigningAgent(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/assign-recruitment/lead`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    leadIds: selectedLeads,
                    createdBy: selectedAgents[0]?.value, // Send single ID
                }),
            });

            const result = await response.json();

            if (response.ok) {
                showSuccess("Success", result.message || "Agent assigned successfully.");
                setShowAgentPopup(false);
                setSelectedLeads([]); // Clear selection
                setSelectedAgents([]); // Clear selected agents
                if (fetchvenuemanagerRecruitment) fetchvenuemanagerRecruitment(); // Refresh data
            } else {
                throw new Error(result.message || "Failed to assign agents.");
            }
        } catch (error) {
            console.error("Failed to assign agent:", error);
            showError("Error", error.message || "Failed to assign agent.");
        } finally {
            setIsAssigningAgent(false);
        }
    };
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
            const result = resultRaw.data || [];
            setAgentsData(result);
            setShowAgentPopup(true);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
            showError("Error", "Failed to fetch agents.");
        } finally {
            setAgentsLoading(false);
        }
    }, []);


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

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        age: "",
        phoneNumber: "",
        email: "",
        postcode: "",
        footballExperience: "",
        managementExperience: "",
        accessToOwnVehicle: "true",
        whichQualificationYouHave: [],
        ageGroupExperience: [],        // ✅ ADD THIS
        uploadCv: null,
        coverNote: "",
        howDidYouHear: "",
        fullWeekendAvailablity: '',
    });
    const venueOptions = useMemo(() => {
        const venuesMap = new Map();

        venueRecruitment.forEach((rec) => {
            rec.candidateProfile?.availableVenueWork?.venues?.forEach((venue) => {
                if (!venuesMap.has(venue.id)) {
                    venuesMap.set(venue.id, { value: venue.id, label: venue.name });
                }
            });
        });

        return Array.from(venuesMap.values());
    }, [venueRecruitment]);
    const getExpYears = (value = "") => {
        const lower = value.toLowerCase().trim();

        if (lower.includes("more")) return 6; // treat "More than 5 years" as 6+
        const num = parseInt(lower);
        return isNaN(num) ? null : num;
    };


    const applyFilter = () => {
        let temp = Array.isArray(venueRecruitment) ? [...venueRecruitment] : [];

        setCurrentPage(1);

        // 🔹 Apply name & venue filters first
        temp = filterByName(temp);
        temp = filterByVenue(temp);

        // 🔹 Status / Exp / FA filters
        const selected = Object.entries(checkedStatuses)
            .filter(([_, v]) => v)
            .map(([k]) => k);

        if (selected.length > 0) {
            temp = temp.filter((c) => {
                const status = (c.status ?? "").toLowerCase();
                const expYears = getExpYears(c.managementExperience);
                const faLevel1 = c.level === "yes";

                let match = true;

                const statusFilters = ["Pending", "Recruited", "Rejected"]
                    .filter(s => selected.includes(s))
                    .map(s => s.toLowerCase());

                if (statusFilters.length > 0) {
                    match = match && statusFilters.includes(status);
                }

                const expFiltersSelected =
                    selected.includes("0-3 Years Exp") ||
                    selected.includes("3+ Years Exp");

                if (expFiltersSelected) {
                    const expMatch =
                        (selected.includes("0-3 Years Exp") && expYears !== null && expYears <= 3) ||
                        (selected.includes("3+ Years Exp") && expYears !== null && expYears >= 3);

                    match = match && expMatch;
                }

                if (selected.includes("FA Level 1")) {
                    match = match && faLevel1;
                }

                return match;
            });
        }

        // 🔹 Date range filter
        if (fromDate && toDate) {
            const start = new Date(fromDate).setHours(0, 0, 0, 0);
            const end = new Date(toDate).setHours(23, 59, 59, 999);

            temp = temp.filter((c) => {
                const created = c.createdAt ? new Date(c.createdAt).getTime() : null;
                return created && created >= start && created <= end;
            });
        }

        setFilteredRecruitment(temp);
    };

    const filterByName = (data) => {
        if (!studentName.trim()) return data;
        setCurrentPage(1);
        const q = studentName.trim().toLowerCase();
        return data.filter(c =>
            `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(q)
        );
    };
    const filterByVenue = (data) => {
        setCurrentPage(1);
        if (!selectedVenue) return data;
        return data.filter((c) =>
            c.candidateProfile?.availableVenueWork?.venues?.some(
                (v) => v.id === selectedVenue.value
            )
        );
    };
    useEffect(() => {
        if (Array.isArray(venueRecruitment)) {
            setFilteredRecruitment(venueRecruitment);
        }
    }, [venueRecruitment]); // ✅ depend on the array itself, not .length

    const finalSummaryCards = summaryCards.map(card => {
        const matched = Array.isArray(statsRecruitment)
            ? statsRecruitment.find(item => item.name === card.key)
            : null;

        return {
            ...card,
            value: matched?.count ?? 0,
            change: matched?.percent ? `(${matched.percent})` : null
        };
    });



    const experienceOptions = [
        { value: "1 year", label: "1 year" },
        { value: "2 years", label: "2 years" },
        { value: "3 years", label: "3 years" },
        { value: "4 years", label: "4 years" },
        { value: "5 years", label: "5 years" },
        { value: "More than 5 years", label: "More than 5 years" },
    ];


    const handleVenueMail = async (selectedIds) => {
        const result = await showConfirm(
            "Are you sure?",
            "Do you want to send the mail?",
            "Yes, send it"
        );

        if (result.isConfirmed) {
            await sendvenuemanagerMail(selectedIds);

        }
    };
    const selectStyles = {
        control: (base) => ({
            ...base,
            borderRadius: "0.5rem",
            minHeight: "44px",
            borderColor: "#E2E1E5",
            boxShadow: "none",
            "&:hover": { borderColor: "#237FEA" },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 12px",
        }),
        input: (base) => ({
            ...base,
            margin: 0,
            padding: 0,
        }),
        indicatorSeparator: () => ({ display: "none" }),
    };

    const inputClass =
        " px-4 py-3 border border-[#E2E1E5] rounded-xl focus:outline-none ";



    const filterBySearchQuery = (data) => {
        if (!searchQuery.trim()) return data;

        const q = searchQuery.toLowerCase();

        return data.filter((coach) => {
            const values = [
                coach?.firstName,
                coach?.lastName,
                coach?.age,
                coach?.postcode,
                coach?.phoneNumber,
                coach?.email,
                coach?.managementExperience,
                coach?.level,
                coach?.dbs,
                coach?.status,
            ];

            return values.some((val) =>
                String(val || "").toLowerCase().includes(q)
            );
        });
    };


    const totalItems = filteredRecruitment.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const currentData = useMemo(
        () => filteredRecruitment.slice(startIndex, endIndex),
        [filteredRecruitment, startIndex, endIndex]
    );
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);
    useEffect(() => {
        if (!Array.isArray(venueRecruitment)) return;

        let data = [...venueRecruitment];

        data = filterByName(data);
        data = filterByVenue(data);
        data = filterBySearchQuery(data); // ✅ ADD THIS

        setFilteredRecruitment(data);
    }, [venueRecruitment, studentName, selectedVenue, searchQuery]);



    if (loading) return <Loader />;
    return (
        <div className="flex gap-5">
            <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {finalSummaryCards.map((card, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all duration-200"
                        >
                            <div className={`p-2 h-[50px] w-[50px] rounded-full ${card.iconStyle} bg-opacity-10 flex items-center justify-center`}>
                                <img src={card.icon} alt="" className="p-1" />
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">{card.title}</p>

                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-semibold">{card.value}</h3>
                                    {card.change && (
                                        <p className="text-[#027A48] text-xs">{card.change}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coaches Table */}

                <div className="flex justify-between items-center p-4 mt-3">
                    <h2 className="font-semibold text-2xl">Venue Manager Applications</h2>
                    <div className="flex gap-4 items-center">
                        <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                        </div>
                        <button onClick={handleClick}
                            className="bg-white border border-[#E2E1E5] rounded-full flex justify-center items-center h-10 w-10"><TiUserAdd className="text-xl" /></button>
                        <button onClick={() => setIsOpen(true)}
                            className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            <Plus size={16} />
                            Add new lead
                        </button>


                    </div>
                </div>
                <div className="mt-3 overflow-auto rounded-3xl bg-white ">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                            <tr className="font-semibold text-[#717073]">
                                <th className="py-3 px-4 font-semibold">Name</th>
                                <th className="py-3 px-4 font-semibold">Age</th>
                                <th className="py-3 px-4 font-semibold">PostCode</th>
                                <th className="py-3 px-4 font-semibold">Telephone</th>
                                <th className="py-3 px-4 font-semibold">Email</th>
                                <th className="py-3 px-4 font-semibold">Management Experience</th>
                                <th className="py-3 px-4 font-semibold">FA Level 1</th>
                                <th className="py-3 px-4 font-semibold">DBS</th>
                                <th className="py-3 px-4 font-semibold">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="p-6 text-center text-gray-500 font-medium"
                                    >
                                        No data found
                                    </td>
                                </tr>
                            ) : (currentData.map((coach) => {
                                const isChecked = selectedIds.includes(coach.id);

                                const fullName = `${coach.firstName} ${coach.lastName}`;
                                const experience = coach.managementExperience || "-";
                                const faLevel1 = coach.level === "yes";
                                const dbs = coach.dbs === "yes";
                                const status = coach.status ? coach.status.toLowerCase() : "";

                                return (
                                    <tr
                                        key={coach.id}
                                        onClick={() => {
                                            if (status == "recruited" || status == "pending" || status == "rejected") {
                                                navigate(`/recruitment/lead/coach/profile?id=${coach.id}&comesfrom=venueManager`);
                                            }
                                        }}
                                        className="border-b cursor-pointer border-gray-200"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCheckbox(coach.id);
                                                    }}
                                                    className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? "border-gray-500" : "border-gray-300"
                                                        }`}
                                                >
                                                    {isChecked && (
                                                        <Check size={16} strokeWidth={3} className="text-gray-500 w-5 h-5" />
                                                    )}
                                                </button>
                                                {fullName}
                                            </div>
                                        </td>

                                        <td className="p-4">{coach.age}</td>
                                        <td className="p-4">{coach.postcode}</td>
                                        <td className="p-4">{coach.phoneNumber}</td>
                                        <td className="p-4">{coach.email}</td>
                                        <td className="p-4">{experience}</td>

                                        <td className="p-4">
                                            {coach?.candidateProfile?.whichQualificationYouHave?.includes("FA Level 1") ? (
                                                <img src="/reportsIcons/greenCheck.png" className="w-6" />
                                            ) : (
                                                <img src="/reportsIcons/cross.png" className="w-6" />
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {coach?.candidateProfile?.whichQualificationYouHave?.includes("DBS (within the year") ? (
                                                <img src="/reportsIcons/greenCheck.png" className="w-6" />
                                            ) : (
                                                <img src="/reportsIcons/cross.png" className="w-6" />
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-md text-xs font-medium ${status === "pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : status === "recruited"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                            )}
                        </tbody>
                    </table>
                </div>
                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                        <div className="flex items-center gap-2 mb-3 sm:mb-0">
                            <span>Rows per page:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1); // reset page when rows per page changes
                                }}
                                className="border rounded-md px-2 py-1"
                            >
                                {[5, 10, 20, 50].map((num) => (
                                    <option key={num} value={num}>
                                        {num}
                                    </option>
                                ))}
                            </select>
                            <span className="ml-2">
                                {Math.min(startIndex + 1, totalItems)} -{" "}
                                {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md border ${currentPage === 1
                                    ? "text-gray-400 border-gray-200"
                                    : "hover:bg-gray-100 border-gray-300"
                                    }`}
                            >
                                Prev
                            </button>

                            {(() => {
                                const pageButtons = [];
                                const maxVisible = 5;
                                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                let endPage = startPage + maxVisible - 1;

                                if (endPage > totalPages) {
                                    endPage = totalPages;
                                    startPage = Math.max(1, endPage - maxVisible + 1);
                                }

                                if (startPage > 1) {
                                    pageButtons.push(
                                        <button
                                            key={1}
                                            onClick={() => setCurrentPage(1)}
                                            className={`px-3 py-1 rounded-md border ${currentPage === 1
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "hover:bg-gray-100 border-gray-300"
                                                }`}
                                        >
                                            1
                                        </button>
                                    );
                                    if (startPage > 2) pageButtons.push(<span key="start-ellipsis" className="px-2">...</span>);
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                    pageButtons.push(
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i)}
                                            className={`px-3 py-1 rounded-md border ${currentPage === i
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "hover:bg-gray-100 border-gray-300"
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }

                                if (endPage < totalPages) {
                                    if (endPage < totalPages - 1) pageButtons.push(<span key="end-ellipsis" className="px-2">...</span>);
                                    pageButtons.push(
                                        <button
                                            key={totalPages}
                                            onClick={() => setCurrentPage(totalPages)}
                                            className={`px-3 py-1 rounded-md border ${currentPage === totalPages
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "hover:bg-gray-100 border-gray-300"
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    );
                                }

                                return pageButtons;
                            })()}

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded-md border ${currentPage === totalPages
                                    ? "text-gray-400 border-gray-200"
                                    : "hover:bg-gray-100 border-gray-300"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showFilter && (
                <div className="md:w-4/12 md:mt-0 p-4  mt-4 text-base space-y-5">
                    {/* Search */}
                    <div className="mb-4 bg-white rounded-2xl p-4">
                        <h3 className="font-semibold text-black text-[24px] mb-4">
                            Search now
                        </h3>

                        <label className="text-[16px] font-semibold text-[#282829]">Search recruitment</label>
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={studentName}
                                onChange={handleInputChange}
                                placeholder="Search by recruitment name"
                                className="pl-9 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <label className="text-[16px] font-semibold mt-2 block">Nearest Pathway Venue</label>
                        <div className="relative mt-1">
                            <Select
                                options={venueOptions}
                                value={selectedVenue}
                                isClearable
                                onChange={handleVenueChange}
                                placeholder="Choose Venue"
                                className="text-sm"
                                classNamePrefix="react-select"
                            />
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
                                className="px-5 mt-4 bg-[#237FEA] hover:bg-blue-700 text-white flex gap-2 items-center text-[16px] py-3 rounded-2xl transition"
                            >
                                <img
                                    src="/reportsIcons/filter.png"
                                    className="w-4"
                                    alt=""
                                />
                                Apply Filter
                            </button>
                        </div>

                        {/* Status Checkboxes */}
                        <div className="p-4 bg-[#FAFAFA] rounded-xl mb-4 mt-4">
                            <p className="text-[17px] font-semibold mb-2 text-black">Choose Type</p>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.keys(checkedStatuses).map((key) => {
                                    const label = key; // in case you want to rename display later
                                    return (
                                        <label
                                            key={key}
                                            className="flex items-center w-full  text-[16px] font-semibold gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={checkedStatuses[key]}
                                                onChange={() => handleCheckboxChange(key)}
                                            />
                                            <span className="w-4 h-4 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                                <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                                            </span>
                                            <span className="text-[16px]">{key}</span>
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
                        <button onClick={handleSendEmail} className="flex-1 flex items-center justify-center text-[#717073] gap-1 border border-[#717073] rounded-lg py-3 text-sm hover:bg-gray-50">
                            <Mail size={16} className="text-[#717073]" /> Send Email
                        </button>
                        <button onClick={handleSendText} className="flex-1 flex items-center justify-center gap-1 border text-[#717073] border-[#717073] rounded-lg py-3 text-sm hover:bg-gray-50">
                            <MessageSquare size={16} className="text-[#717073]" /> Send Text
                        </button>
                        <button
                            onClick={handleVenueManagerExport}
                            className="flex items-center justify-center gap-1 bg-[#237FEA] text-white text-sm py-3 rounded-lg hover:bg-blue-700 transition"
                        >
                            <Download size={16} /> Export Data
                        </button>
                    </div>

                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 bg-[#0000008f]  bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Add New Lead</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">

                            {/* First Name & Last Name */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#282829] mb-1">First Name</label>
                                    <input
                                        ref={firstNameRef}
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); setErrors(p => ({ ...p, firstName: '' })); }}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${errors.firstName ? 'border-[#F04438]' : 'border-[#E2E1E5]'}`}
                                    />
                                    {errors.firstName && <p className="text-[#F04438] text-sm mt-1">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#282829] mb-1">Surname</label>
                                    <input
                                        ref={lastNameRef}
                                        placeholder="Surname"
                                        value={formData.lastName}
                                        onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); setErrors(p => ({ ...p, lastName: '' })); }}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${errors.lastName ? 'border-[#F04438]' : 'border-[#E2E1E5]'}`}
                                    />
                                    {errors.lastName && <p className="text-[#F04438] text-sm mt-1">{errors.lastName}</p>}
                                </div>
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-1">Email Address</label>
                                <input
                                    ref={emailRef}
                                    type="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors(p => ({ ...p, email: '' })); }}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${errors.email ? 'border-[#F04438]' : 'border-[#E2E1E5]'}`}
                                />
                                {errors.email && <p className="text-[#F04438] text-sm mt-1">{errors.email}</p>}
                            </div>

                            {/* Telephone Number */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-1">Telephone Number</label>
                                <div className={`flex items-center border rounded-xl px-3 py-3 ${errors.phoneNumber ? 'border-[#F04438]' : 'border-gray-300'}`}>
                                    <PhoneInput
                                        country="uk"
                                        value={dialCode}
                                        onChange={(val, data) => setDialCode(`+${data.dialCode}`)}
                                        disableCountryCode={true}
                                        countryCodeEditable={false}
                                        inputStyle={{ width: "0px", maxWidth: '20px', height: "0px", opacity: 0, pointerEvents: "none", position: "absolute" }}
                                        buttonClass="!bg-white !border-none !p-0"
                                    />
                                    <input
                                        ref={phoneNumberRef}
                                        type="number"
                                        placeholder="Telephone Number"
                                        value={formData.phoneNumber}
                                        onChange={(e) => { setFormData({ ...formData, phoneNumber: e.target.value }); setErrors(p => ({ ...p, phoneNumber: '' })); }}
                                        className="border-none w-full focus:outline-none"
                                    />
                                </div>
                                {errors.phoneNumber && <p className="text-[#F04438] text-sm mt-1">{errors.phoneNumber}</p>}
                            </div>

                            {/* Date of Birth & Age */}
                            <div className="grid  gap-3">

                                <div>
                                    <label className="block text-sm font-medium text-[#282829] mb-1">Age</label>
                                    <input
                                        ref={ageRef}
                                        placeholder="Age"
                                        value={formData.age}
                                        onChange={(e) => {
                                            setFormData({ ...formData, age: e.target.value })
                                            setErrors(p => ({ ...p, age: '' }));
                                        }}
                                        className={`w-full px-4 py-3 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.age ? 'border-[#F04438]' : 'border-[#E2E1E5]'}`}
                                    />
                                    {errors.age && <p className="text-[#F04438] text-sm mt-1">{errors.age}</p>}
                                </div>
                            </div>

                            {/* London Postcode */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-1">London Postcode</label>
                                <input
                                    ref={postcodeRef}
                                    placeholder="London Postcode"
                                    value={formData.postcode}
                                    onChange={(e) => { setFormData({ ...formData, postcode: e.target.value }); setErrors(p => ({ ...p, postcode: '' })); }}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${errors.postcode ? 'border-[#F04438]' : 'border-[#E2E1E5]'}`}
                                />
                                {errors.postcode && <p className="text-[#F04438] text-sm mt-1">{errors.postcode}</p>}
                            </div>

                            {/* Access to own vehicle */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-2">Do you have access to your own vehicle?</label>
                                <div className="flex gap-6">
                                    {["true", "false"].map((val) => (
                                        <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-[#282829]">
                                            <input
                                                type="radio"
                                                name="accessToOwnVehicle"
                                                value={val}
                                                checked={formData.accessToOwnVehicle === val}
                                                onChange={() => setFormData({ ...formData, accessToOwnVehicle: val })}
                                                className="accent-[#12B76A] w-4 h-4"
                                            />
                                            {val === "true" ? "Yes" : "No"}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Qualifications */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-2">Please select which qualifications you have</label>
                                <div className="flex flex-col gap-2">
                                    {["FA Level 1", "FA Level 2", "DBS (within the year)", "Futsal Level 1", "UEFA B", "First Aid (within 2 years)"].map((q) => (
                                        <label key={q} className="flex items-center gap-2 text-sm text-[#282829] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.whichQualificationYouHave.includes(q)}
                                                onChange={() => {
                                                    const current = formData.whichQualificationYouHave;
                                                    setFormData({
                                                        ...formData,
                                                        whichQualificationYouHave: current.includes(q)
                                                            ? current.filter(x => x !== q)
                                                            : [...current, q]
                                                    });
                                                }}
                                                className="accent-[#12B76A] w-4 h-4"
                                            />
                                            {q}
                                        </label>
                                    ))}
                                </div>
                            </div>


                            {/* Football Experience */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-1">How many years football coaching experience do you have?</label>
                                <Select
                                    options={experienceOptions}
                                    styles={selectStyles}
                                    placeholder="Select experience"
                                    value={experienceOptions.find(o => o.value === formData.footballExperience) || null}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, footballExperience: selected?.value || "" });
                                        setErrors(p => ({ ...p, footballExperience: '' }));
                                    }}
                                    className={errors.footballExperience ? 'border border-[#F04438] rounded-xl' : ''}
                                />
                                {errors.footballExperience && <p className="text-[#F04438] text-sm mt-1">{errors.footballExperience}</p>}
                            </div>

                            {/* Available Venues */}
                            {/* Age Group Experience */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-2">
                                    Which age groups do you have experience working with? Please select from the options
                                </label>
                                <div className="flex flex-col gap-2">
                                    {["5-7 Years", "4-5 years", "8-10 Years", "11-13 Years", "14-16 Years", "17+ Years"].map((q) => (
                                        <label key={q} className="flex items-center gap-2 text-sm text-[#282829] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.ageGroupExperience.includes(q)}  // ✅ correct field
                                                onChange={() => {
                                                    const current = formData.ageGroupExperience;
                                                    setFormData({
                                                        ...formData,
                                                        ageGroupExperience: current.includes(q)  // ✅ correct field
                                                            ? current.filter(x => x !== q)
                                                            : [...current, q]
                                                    });
                                                    setErrors(p => ({ ...p, ageGroupExperience: '' }));
                                                }}
                                                className="accent-[#12B76A] w-4 h-4"
                                            />
                                            {q}
                                        </label>
                                    ))}
                                </div>
                                {errors.ageGroupExperience && <p className="text-[#F04438] text-sm mt-1">{errors.ageGroupExperience}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-2">
                                    How many years of management experience do you have?
                                </label>
                                <Select
                                    options={experienceOptions}
                                    styles={selectStyles}
                                    placeholder="Select experience"
                                    value={experienceOptions.find(o => o.value === formData.managementExperience) || null}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, managementExperience: selected?.value || "" });
                                        setErrors(p => ({ ...p, managementExperience: '' }));
                                    }}
                                    className={errors.managementExperience ? 'border border-[#F04438] rounded-xl' : ''}
                                />
                                {errors.managementExperience && <p className="text-[#F04438] text-sm mt-1">{errors.managementExperience}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-2">Do you have full time weekend availability?</label>
                                <div className="flex flex-col gap-2">
                                    {["Yes", "No"].map((source) => (
                                        <label key={source} className="flex items-center gap-2 text-sm text-[#282829] cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fullWeekendAvailablity"
                                                value={source}
                                                checked={formData.fullWeekendAvailablity === source}
                                                onChange={() => {
                                                    setFormData({ ...formData, fullWeekendAvailablity: source });
                                                    setErrors(p => ({ ...p, fullWeekendAvailablity: '' }));
                                                }}
                                                className="accent-[#12B76A] w-4 h-4"
                                            />
                                            {source}
                                        </label>
                                    ))}
                                </div>
                                {errors.fullWeekendAvailablity && <p className="text-[#F04438] text-sm mt-1">{errors.fullWeekendAvailablity}</p>}
                            </div>

                            {/* Upload CV */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-1">Please upload your CV</label>
                                <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 cursor-pointer hover:border-blue-400 transition bg-white ${errors.uploadCv ? 'border-[#F04438]' : 'border-gray-300'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4" />
                                    </svg>
                                    <span className="text-sm">
                                        <span className="text-blue-500 font-medium">Click to upload</span>
                                        <span className="text-gray-500"> or drag and drop</span>
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 800×400px)</span>
                                    {formData.uploadCv && (
                                        <span className="text-xs text-[#027A48] mt-2 font-medium">{formData.uploadCv.name}</span>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".svg,.png,.jpg,.jpeg,.gif,.pdf,.doc,.docx"
                                        onChange={(e) => {
                                            setFormData({ ...formData, uploadCv: e.target.files[0] || null });
                                            setErrors(p => ({ ...p, uploadCv: '' }));
                                        }}
                                    />
                                </label>
                                {errors.uploadCv && <p className="text-[#F04438] text-sm mt-1">{errors.uploadCv}</p>}
                            </div>

                            {/* Cover Note */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-1">Please Add a short cover note (500 words max)</label>
                                <textarea
                                    ref={coverNoteRef}
                                    placeholder="Message"
                                    rows={4}
                                    maxLength={3000}
                                    value={formData.coverNote}
                                    onChange={(e) => {
                                        setFormData({ ...formData, coverNote: e.target.value });
                                        setErrors(p => ({ ...p, coverNote: '' }));
                                    }}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none text-sm ${errors.coverNote ? 'border-[#F04438]' : 'border-[#E2E1E5]'}`}
                                />
                                {errors.coverNote && <p className="text-[#F04438] text-sm mt-1">{errors.coverNote}</p>}
                            </div>

                            {/* How did you hear */}
                            <div>
                                <label className="block text-sm font-medium text-[#282829] mb-2">How did you hear about this opportunity?</label>
                                <div className="flex flex-col gap-2">
                                    {["Indeed", "Facebook", "Google", "Referral", "Other"].map((source) => (
                                        <label key={source} className="flex items-center gap-2 text-sm text-[#282829] cursor-pointer">
                                            <input
                                                type="radio"
                                                name="howDidYouHear"
                                                value={source}
                                                checked={formData.howDidYouHear === source}
                                                onChange={() => {
                                                    setFormData({ ...formData, howDidYouHear: source });
                                                    setErrors(p => ({ ...p, howDidYouHear: '' }));
                                                }}
                                                className="accent-[#12B76A] w-4 h-4"
                                            />
                                            {source}
                                        </label>
                                    ))}
                                </div>
                                {errors.howDidYouHear && <p className="text-[#F04438] text-sm mt-1">{errors.howDidYouHear}</p>}
                            </div>


                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); setErrors({}); }}
                                    className="px-4 py-2 rounded-lg bg-gray-200 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-lg bg-[#237FEA] text-white text-sm font-medium ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    {isSubmitting ? "Submitting..." : "Save Lead"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAgentPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[28px] font-bold text-[#282829]">Select agent</h3>
                            <button onClick={() => setShowAgentPopup(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {agentsLoading ? (
                                <div className="flex justify-center py-10">
                                    <span className="text-[#237FEA]">Loading...</span>
                                </div>
                            ) : agentsData.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 font-medium">No agents available.</p>
                            ) : (
                                agentsData.map((agent) => {
                                    const isSelected = selectedAgents.some((a) => a.value === agent.id);
                                    return (
                                        <div
                                            key={agent.id}
                                            className="flex items-center gap-4 py-2 cursor-pointer group"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedAgents([]);
                                                } else {
                                                    setSelectedAgents([{ value: agent.id, label: `${agent.firstName} ${agent.lastName}` }]);
                                                }
                                            }}
                                        >
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-[#237FEA] border-[#237FEA]" : "border-gray-200 group-hover:border-[#237FEA]"}`}>
                                                {isSelected && <Check size={16} className="text-white" strokeWidth={4} />}
                                            </div>
                                            <div className="relative">
                                                <img
                                                    src={agent.profilePicture || agent.image || "/images/avatar-placeholder.png"}
                                                    alt=""
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-[#E6F7FB]"
                                                    onError={(e) => (e.target.src = `https://ui-avatars.com/api/?name=${agent.firstName}+${agent.lastName}&background=E6F7FB&color=237FEA`)}
                                                />
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
                                onClick={handleAssignAgent}
                                disabled={isAssigningAgent || selectedAgents.length === 0}
                                className="w-full py-4 bg-[#237FEA] text-white font-bold rounded-2xl hover:bg-[#1a6ed8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-100 text-lg"
                            >
                                {isAssigningAgent ? "Assigning..." : "Assign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default VenueManager;
