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
import PhoneInput from "react-phone-input-2";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { showConfirm, showWarning, showError, showSuccess } from "../../../../../utils/swalHelper";
import { useGlobalSearch } from "../../contexts/GlobalSearchContext";
import { useEmail } from '../../contexts/messages/SendEmailContext';
import { useTextPopup } from '../../contexts/messages/SendTextContext';

// ─── helper: return "-" for any falsy / blank value ───────────────────────────
const display = (val) =>
    val !== undefined && val !== null && String(val).trim() !== "" ? val : "-";

// ─── reusable field wrapper ────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
    <div className="flex flex-col gap-1">
        {label && <label className="text-sm text-gray-500">{label}</label>}
        {children}
        {error && (
            <p className="text-[#F04438] text-xs mt-0.5 flex items-center gap-1">
                <span>⚠</span> {error}
            </p>
        )}
    </div>
);

// ─── shared input class builder ────────────────────────────────────────────────
const inputCls = (hasError) =>
    `px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm transition-colors ${hasError ? "border-[#F04438] bg-red-50 focus:ring-red-100" : "border-[#E2E1E5]"
    }`;

const FranchiseLeads = () => {
    const [showFilter, setShowFilter] = useState(false);
    const { searchQuery } = useGlobalSearch();

    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [errors, setErrors] = useState({});

    const [agentsData, setAgentsData] = useState([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [showAgentPopup, setShowAgentPopup] = useState(false);
    const [isAssigningAgent, setIsAssigningAgent] = useState(false);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);

    const { openEmailPopup } = useEmail();
    const { openTextPopup } = useTextPopup();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Refs for validation + scroll-to-first-error
    const firstNameRef = useRef(null);
    const lastNameRef = useRef(null);
    const emailRef = useRef(null);
    const phoneNumberRef = useRef(null);
    const locationRef = useRef(null);
    const capitalRef = useRef(null);
    const hearRef = useRef(null);
    const messageRef = useRef(null);
    const [dialCode, setDialCode] = useState("+44");

    const { recruitment, fetchFranchiseRecruitment, statsRecruitment, createFranchiseRecruitment, sendFranchiseMail } = useRecruitmentTemplate() || {};

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchFranchiseRecruitment();
            setLoading(false);
        };
        loadData();
    }, [fetchFranchiseRecruitment]);

    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "recruited", label: "Recruited" },
        { value: "rejected", label: "Rejected" },
    ];

    const [filteredRecruitment, setFilteredRecruitment] = useState([]);

    const summaryCards = [
        { icon: "/reportsIcons/user-group.png", iconStyle: "text-[#3DAFDB] bg-[#E6F7FB]", title: "Total franchise leads", key: "totalFranchiseLeads" },
        { icon: "/reportsIcons/greenuser.png", iconStyle: "text-[#099699] bg-[#E0F7F7]", title: "New leads", key: "totalNewFranchiseLeads" },
        { icon: "/reportsIcons/login-icon-orange.png", iconStyle: "text-[#F38B4D] bg-[#FFF2E8]", title: "Quality Leads", key: "totalToAssessments" },
        { icon: "/reportsIcons/handshake.png", iconStyle: "text-[#6F65F1] bg-[#E9E8FF]", title: "Leads To Sales", key: "totalLeadsToSales" },
    ];

    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const emptyForm = {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        desiredFranchiseLocation: "",
        liquidCapital: "",
        howDidYouHear: "",
        message: "",
    };

    const [formData, setFormData] = useState(emptyForm);

    // ── clear a single field error while typing ──────────────────────────────
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    // ── validation rules ─────────────────────────────────────────────────────
    const requiredFields = [
        { key: "firstName", label: "First Name", ref: firstNameRef },
        { key: "lastName", label: "Surname", ref: lastNameRef },
        { key: "email", label: "Email Address", ref: emailRef },
        { key: "phoneNumber", label: "Phone Number", ref: phoneNumberRef },
        { key: "desiredFranchiseLocation", label: "Desired location", ref: locationRef },
        { key: "liquidCapital", label: "Liquid capital", ref: capitalRef },
        { key: "howDidYouHear", label: "How did you hear about the franchise opportunity", ref: hearRef },
        { key: "message", label: "Message", ref: messageRef },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        let firstErrorRef = null;

        // 1. Required-field check
        for (const field of requiredFields) {
            const value = formData[field.key];
            if (!value || String(value).trim() === "") {
                newErrors[field.key] = `${field.label} is required.`;
                if (!firstErrorRef) firstErrorRef = field.ref;
            }
        }

        // 2. Email format (only if not already flagged as empty)
        if (!newErrors.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = "Please enter a valid email address.";
                if (!firstErrorRef) firstErrorRef = emailRef;
            }
        }

        // 3. Phone length (only if not already flagged as empty)
        if (!newErrors.phoneNumber) {
            const digits = formData.phoneNumber.replace(/\D/g, "");
            if (digits.length < 8) {
                newErrors.phoneNumber = "Phone number must be at least 8 digits.";
                if (!firstErrorRef) firstErrorRef = phoneNumberRef;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll + focus the first broken field
            if (firstErrorRef?.current) {
                firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                firstErrorRef.current.focus();
            }
            return;
        }

        const payload = {
            ...formData,
            phoneNumber: `${dialCode}${formData.phoneNumber}`
        };

        createFranchiseRecruitment(payload);
        setFormData(emptyForm);
        setErrors({});
        setIsOpen(false);
        setDialCode("+44");
    };

    const [selectedIds, setSelectedIds] = useState([]);
    const toggleCheckbox = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [studentName, setStudentName] = useState("");
    const [checkedStatuses, setCheckedStatuses] = useState({
        Pending: false,
        Recruited: false,
        "0-3 Years Exp": false,
        Rejected: false,
        "3+ Years Exp": false,
    });

    const handleCheckboxChange = (key) =>
        setCheckedStatuses((prev) => ({ ...prev, [key]: !prev[key] }));

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

    const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const isSameDate = (d1, d2) =>
        d1 && d2 &&
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
            if (date < fromDate) setFromDate(date);
            else setToDate(date);
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
    }, [API_BASE_URL]);

    const handleAssignmentClick = () => {
        if (!selectedIds || selectedIds.length === 0) {
            showWarning("Warning", "Please select at least 1 lead");
            return;
        }

        const leads = filteredRecruitment.filter((lead) =>
            selectedIds.includes(lead.id)
        );

        setSelectedLeads(selectedIds); // We only need IDs for the API

        // Check already assigned leads
        const alreadyAssigned = leads.filter(
            (lead) => lead.assignedAgentId != null
        );

        // Check if any selected lead is NOT from website
        const hasNonWebsiteLead = leads.some(
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
                setSelectedIds([]);   // Clear checkboxes
                setSelectedAgents([]); // Clear selected agents
                if (fetchFranchiseRecruitment) fetchFranchiseRecruitment(); // Refresh data
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

    const handleSendEmail = () => {
        if (selectedIds && selectedIds.length > 0) {
            const filteredLeads = currentData.filter((c) => selectedIds.includes(c.id));
            const emails = filteredLeads.map((c) => c.email).filter(Boolean);

            if (emails.length > 0) {
                const token = localStorage.getItem("adminToken");
                openEmailPopup(emails, "/api/admin/send-manual-email", {
                    token,
                    showError,
                    showSuccess: () => { },
                });
            } else {
                showWarning("No Emails Found", "Selected candidates do not have valid email addresses.");
            }
        } else {
            showWarning("No Candidates Selected", "Please select at least one candidate to send an email.");
        }
    };

    const handleSendText = () => {
        if (selectedIds && selectedIds.length > 0) {
            const filteredLeads = currentData.filter((c) => selectedIds.includes(c.id));
            const recipients = filteredLeads
                .filter((c) => c.phoneNumber)
                .map((c) => ({
                    name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
                    phone: c.phoneNumber,
                }));

            if (recipients.length > 0) {
                const token = localStorage.getItem("adminToken");
                openTextPopup(recipients, "/api/admin/send-manual-text", {
                    token,
                    showError,
                    showSuccess: () => { },
                });
            } else {
                showWarning("No Phone Numbers", "Selected candidates do not have valid phone numbers.");
            }
        } else {
            showWarning("No Candidates Selected", "Please select at least one candidate to send a text.");
        }
    };

    const getExpYears = (value = "") => {
        const lower = value.toLowerCase().trim();
        if (lower.includes("more")) return 6;
        const num = parseInt(lower);
        return isNaN(num) ? null : num;
    };

    const applyFilter = () => {
        let temp = Array.isArray(recruitment) ? [...recruitment] : [];
        setCurrentPage(1);

        if (studentName.trim()) {
            const q = studentName.trim().toLowerCase();
            temp = temp.filter((c) =>
                `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(q)
            );
        }

        const selected = Object.entries(checkedStatuses)
            .filter(([, v]) => v)
            .map(([k]) => k);

        if (selected.length > 0) {
            temp = temp.filter((c) => {
                const status = (c.status ?? "").toLowerCase();
                const expYears = getExpYears(c.managementExperience);
                let match = true;

                const statusFilters = ["Pending", "Recruited", "Rejected"]
                    .filter((s) => selected.includes(s))
                    .map((s) => s.toLowerCase());

                if (statusFilters.length > 0) match = match && statusFilters.includes(status);

                const expFiltersSelected =
                    selected.includes("0-3 Years Exp") || selected.includes("3+ Years Exp");

                if (expFiltersSelected) {
                    const expMatch =
                        (selected.includes("0-3 Years Exp") && expYears !== null && expYears <= 3) ||
                        (selected.includes("3+ Years Exp") && expYears !== null && expYears >= 3);
                    match = match && expMatch;
                }
                return match;
            });
        }

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

    useEffect(() => { setFilteredRecruitment(recruitment); }, [recruitment]);

    const finalSummaryCards = summaryCards.map((card) => {
        const matched = Array.isArray(statsRecruitment)
            ? statsRecruitment.find((item) => item.name === card.key)
            : null;
        return {
            ...card,
            value: matched?.count ?? 0,
            change: matched?.percent ? `(${matched.percent})` : null,
        };
    });

    const filterBySearchQuery = (data) => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter((coach) =>
            [coach?.firstName, coach?.lastName, coach?.phoneNumber,
            coach?.email, coach?.managementExperience, coach?.status]
                .some((val) => String(val || "").toLowerCase().includes(q))
        );
    };

    const totalItems = filteredRecruitment.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const currentData = useMemo(
        () => filteredRecruitment.slice(startIndex, endIndex),
        [filteredRecruitment, startIndex, endIndex]
    );

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const filterByName = (data) => {
        if (!studentName.trim()) return data;
        setCurrentPage(1);
        const q = studentName.trim().toLowerCase();
        return data.filter((c) =>
            `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(q)
        );
    };

    useEffect(() => {
        if (!Array.isArray(recruitment)) return;
        let data = [...recruitment];
        data = filterByName(data);
        data = filterBySearchQuery(data);
        setFilteredRecruitment(data);
    }, [recruitment, studentName, searchQuery]);

    const exportToExcel = () => {
        if (!currentData || currentData.length === 0) return;
        const formattedData = currentData.map((coach) => ({
            Name: `${coach.firstName} ${coach.lastName}`,
            Age: coach.age || "-",
            Location: coach?.candidateProfile?.location || "-",
            Telephone: coach.phoneNumber || "-",
            Email: coach.email || "-",
            Experience: coach.managementExperience || "-",
            "Capital Available": coach?.candidateProfile?.capitalAvailable
                ? `£${Number(coach.candidateProfile.capitalAvailable).toLocaleString()}`
                : "-",
            Status: coach.status
                ? coach.status.charAt(0).toUpperCase() + coach.status.slice(1)
                : "-",
        }));
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Franchise Leads");
        XLSX.writeFile(workbook, "franchise_leads.xlsx");
    };

    if (loading) return <Loader />;

    return (
        <div className="flex gap-5">
            {/* ── Main Content ─────────────────────────────────────────────── */}
            <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {finalSummaryCards.map((card, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all duration-200">
                            <div className={`p-2 h-[50px] w-[50px] rounded-full ${card.iconStyle} bg-opacity-10 flex items-center justify-center`}>
                                <img src={card.icon} alt="" className="p-1" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{card.title}</p>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-semibold">{card.value}</h3>
                                    {card.change && <p className="text-[#027A48] text-xs">{card.change}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Header row */}
                <div className="flex justify-between items-center p-4 mt-3">
                    <h2 className="font-semibold text-2xl">Franchise Recruitment Leads</h2>
                    <div className="flex gap-4 items-center">
                        <div className="bg-white min-w-[38px] min-h-[38px] border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <Filter size={16} className="cursor-pointer" onClick={() => setShowFilter(!showFilter)} />
                        </div>
                        <button
                            onClick={handleAssignmentClick}
                            className="bg-white border border-[#E2E1E5] rounded-full flex justify-center items-center h-10 w-10"
                        >
                            <TiUserAdd className="text-xl" />
                        </button>
                        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            <Plus size={16} /> Add new Franchise
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-3 overflow-auto rounded-3xl bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                            <tr className="font-semibold text-[#717073]">
                                <th className="py-3 px-4 font-semibold">Name</th>
                                <th className="py-3 px-4 font-semibold">Location</th>
                                <th className="py-3 px-4 font-semibold">Telephone</th>
                                <th className="py-3 px-4 font-semibold">Email</th>
                                <th className="py-3 px-4 font-semibold">Capital available</th>
                                <th className="py-3 px-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-6 text-center text-gray-500 font-medium">No data found</td>
                                </tr>
                            ) : (
                                currentData.map((coach) => {
                                    const isChecked = selectedIds.includes(coach.id);
                                    const fullName = `${coach.firstName} ${coach.lastName}`;
                                    const status = coach.status ? coach.status.toLowerCase() : "";

                                    // Capital formatted or "-"
                                    const capital = coach?.liquidCapital;

                                    return (
                                        <tr
                                            onClick={() => navigate(`/recruitment/franchise-lead/see-details?id=${coach?.id}&comesfrom=franchise`)}
                                            key={coach.id}
                                            className="border-b cursor-pointer border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleCheckbox(coach.id); }}
                                                        className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? "border-gray-500" : "border-gray-300"}`}
                                                    >
                                                        {isChecked && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                                                    </button>
                                                    {display(fullName.trim())}
                                                </div>
                                            </td>
                                            <td className="p-4">{display(coach?.desiredFranchiseLocation)}</td>
                                            <td className="p-4">{display(coach.phoneNumber)}</td>
                                            <td className="p-4">{display(coach.email)}</td>
                                            <td className="p-4">{capital || '-'}</td>
                                            <td className="p-4">
                                                {status ? (
                                                    <span className={`px-3 py-1 rounded-md text-xs font-medium ${status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                        status === "recruited" ? "bg-green-100 text-green-700" :
                                                            "bg-red-100 text-red-700"
                                                        }`}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                        <div className="flex items-center gap-2 mb-3 sm:mb-0">
                            <span>Rows per page:</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border rounded-md px-2 py-1">
                                {[5, 10, 20, 50].map((num) => <option key={num} value={num}>{num}</option>)}
                            </select>
                            <span className="ml-2">{Math.min(startIndex + 1, totalItems)} - {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className={`px-3 py-1 rounded-md border ${currentPage === 1 ? "text-gray-400 border-gray-200" : "hover:bg-gray-100 border-gray-300"}`}>Prev</button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded-md border ${currentPage === i + 1 ? "bg-blue-500 text-white border-blue-500" : "hover:bg-gray-100 border-gray-300"}`}>{i + 1}</button>
                            ))}
                            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? "text-gray-400 border-gray-200" : "hover:bg-gray-100 border-gray-300"}`}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Filter Panel ─────────────────────────────────────────────── */}
            {showFilter && (
                <div className="md:w-4/12 md:mt-0 p-4 mt-4 text-base space-y-5">
                    <div className="bg-white p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-black text-[24px]">Filter by date</h3>
                            <button onClick={applyFilter} className="px-5 mt-4 bg-[#237FEA] hover:bg-blue-700 text-white flex gap-2 items-center text-[16px] py-3 rounded-2xl transition">
                                <img src="/reportsIcons/filter.png" className="w-4" alt="" /> Apply Filter
                            </button>
                        </div>
                        <div className="p-4 bg-[#FAFAFA] rounded-xl mb-4 mt-4">
                            <p className="text-[17px] font-semibold mb-2 text-black">Choose Type</p>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.keys(checkedStatuses).map((key) => (
                                    <label key={key} className="flex items-center w-full text-[16px] font-semibold gap-2 cursor-pointer">
                                        <input type="checkbox" className="peer hidden" checked={checkedStatuses[key]} onChange={() => handleCheckboxChange(key)} />
                                        <span className="w-4 h-4 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                            <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                                        </span>
                                        <span className="text-[16px]">{key}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                            <div className="flex justify-center gap-5 items-center mb-3">
                                <button onClick={goToPreviousMonth} className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
                                <p className="font-semibold text-[20px]">{currentDate.toLocaleString("default", { month: "long" })} {year}</p>
                                <button onClick={goToNextMonth} className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                            <div className="grid grid-cols-7 text-xs gap-1 text-[18px] text-gray-500 mb-1">
                                {["M", "T", "W", "T", "F", "S", "S"].map((day, indx) => <div key={indx} className="font-medium text-center">{day}</div>)}
                            </div>
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
                                                let className = "w-full h-12 aspect-square flex items-center justify-center transition-all duration-200 ";
                                                let innerDiv = null;
                                                if (isStartOrEnd) {
                                                    className += `bg-sky-100 ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}`;
                                                    innerDiv = <div className="bg-blue-700 rounded-full text-white w-12 h-12 flex items-center justify-center font-bold">{date.getDate()}</div>;
                                                } else if (isInBetween) {
                                                    className += "bg-sky-100 text-gray-800";
                                                } else {
                                                    className += "hover:bg-gray-100 text-gray-800";
                                                }
                                                return (
                                                    <div key={i} onClick={() => date && handleDateClick(date)} className={className}>
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

                    <div className="grid blockButton md:grid-cols-3 gap-3 mt-4">
                        <button onClick={handleSendEmail} className="flex-1 flex items-center justify-center text-[#717073] gap-1 border border-[#717073] rounded-lg py-3 text-sm hover:bg-gray-50"><Mail size={16} /> Send Email</button>
                        <button onClick={handleSendText} className="flex-1 flex items-center justify-center gap-1 border text-[#717073] border-[#717073] rounded-lg py-3 text-sm hover:bg-gray-50"><MessageSquare size={16} /> Send Text</button>
                        <button onClick={exportToExcel} className="flex items-center justify-center gap-1 bg-[#237FEA] text-white text-sm py-3 rounded-lg hover:bg-blue-700 transition"><Download size={16} /> Export Data</button>
                    </div>
                </div>
            )}

            {/* ── Add New Franchise Modal ───────────────────────────────────── */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Add New Franchise</h2>
                            <button onClick={() => { setIsOpen(false); setErrors({}); setFormData(emptyForm); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">

                            {/* First + Last Name */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First Name" error={errors.firstName}>
                                    <input
                                        ref={firstNameRef}
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={(e) => handleChange("firstName", e.target.value)}
                                        className={inputCls(!!errors.firstName)}
                                    />
                                </Field>
                                <Field label="Surname" error={errors.lastName}>
                                    <input
                                        ref={lastNameRef}
                                        placeholder="Surname"
                                        value={formData.lastName}
                                        onChange={(e) => handleChange("lastName", e.target.value)}
                                        className={inputCls(!!errors.lastName)}
                                    />
                                </Field>
                            </div>

                            {/* Email */}
                            <Field label="Email" error={errors.email}>
                                <input
                                    ref={emailRef}
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    className={inputCls(!!errors.email)}
                                />
                            </Field>

                            {/* Phone */}
                            <Field label="Telephone Number" error={errors.phoneNumber}>
                                <div className={`flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 ${errors.phoneNumber ? "border-[#F04438] bg-red-50" : "border-[#E2E1E5]"}`}>
                                    <PhoneInput
                                        country="uk"
                                        value={dialCode}
                                        onChange={(val, data) => setDialCode(`+${data.dialCode}`)}
                                        disableCountryCode={true}
                                        countryCodeEditable={false}
                                        inputStyle={{
                                            width: "0px",
                                            maxWidth: "20px",
                                            height: "0px",
                                            opacity: 0,
                                            pointerEvents: "none",
                                            position: "absolute"
                                        }}
                                        buttonClass="!bg-white !border-none !p-0"
                                    />
                                    <input
                                        ref={phoneNumberRef}
                                        type="number"
                                        placeholder="Telephone Number"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleChange("phoneNumber", e.target.value)}
                                        className="border-none w-full focus:outline-none bg-transparent text-sm"
                                    />
                                </div>
                            </Field>

                            {/* Location */}
                            <Field label="Desired location of the franchise" error={errors.desiredFranchiseLocation}>
                                <input
                                    ref={locationRef}
                                    placeholder="Desired location of the franchise"
                                    value={formData.desiredFranchiseLocation}
                                    onChange={(e) => handleChange("desiredFranchiseLocation", e.target.value)}
                                    className={inputCls(!!errors.desiredFranchiseLocation)}
                                />
                            </Field>

                            {/* Capital */}
                            <Field label="How much liquid capital do you have available?" error={errors.liquidCapital}>
                                <input
                                    ref={capitalRef}
                                    placeholder="How much liquid capital do you have available?"
                                    value={formData.liquidCapital}
                                    onChange={(e) => handleChange("liquidCapital", e.target.value)}
                                    className={inputCls(!!errors.liquidCapital)}
                                />
                            </Field>

                            {/* How did you hear */}
                            <Field label="How did you hear about our franchise opportunity?" error={errors.howDidYouHear}>

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


                            </Field>

                            {/* Message */}
                            <Field label="Message" error={errors.message}>
                                <textarea
                                    ref={messageRef}
                                    placeholder="Message"
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => handleChange("message", e.target.value)}
                                    className={`${inputCls(!!errors.message)} resize-none`}
                                />
                            </Field>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2 pb-1">
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); setErrors({}); setFormData(emptyForm); }}
                                    className="px-5 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#237FEA] text-white text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    Save Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ── Agent Popup ──────────────────────────────────────────────── */}
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

export default FranchiseLeads;
