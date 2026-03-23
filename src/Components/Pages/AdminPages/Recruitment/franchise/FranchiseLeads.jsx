import React, { useEffect, useState, useMemo } from "react";
import { Check } from "lucide-react";
import { TiUserAdd } from "react-icons/ti";
import { Plus } from "lucide-react";
import {
    Search,
    Mail,
    MessageSquare,
    Download,
    ChevronLeft,
    ChevronRight, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecruitmentTemplate } from "../../contexts/RecruitmentContext";
import Loader from "../../contexts/Loader";
import * as XLSX from "xlsx";
import PhoneInput from "react-phone-input-2";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { showConfirm, showWarning } from "../../../../../utils/swalHelper";
const FranchiseLeads = () => {
    const [showFilter, setShowFilter] = useState(false);

    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { recruitment, fetchFranchiseRecruitment, statsRecruitment, createFranchiseRecruitment, sendFranchiseMail } = useRecruitmentTemplate() || {};
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchFranchiseRecruitment();
            setLoading(false);
        };
        loadData();
    }, [fetchFranchiseRecruitment]);
    const dbsOptions = [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
    ];

    const levelOptions = [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
    ];

    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "recruited", label: "Recruited" },
        { value: "rejected", label: "Rejected" },
    ];

    console.log(' recruitment', recruitment);
    const handleSelectChange = (field, selected) => {
        setFormData(prev => ({
            ...prev,
            [field]: selected.value,
        }));
    };

    const [filteredRecruitment, setFilteredRecruitment] = useState([]);

    const summaryCards = [
        {
            icon: "/reportsIcons/user-group.png",
            iconStyle: "text-[#3DAFDB] bg-[#E6F7FB]",
            title: "Total franchise leads",
            key: "totalFranchiseLeads"
        },
        {
            icon: "/reportsIcons/greenuser.png",
            iconStyle: "text-[#099699] bg-[#E0F7F7]",
            title: "New leads",
            key: "totalNewFranchiseLeads"
        },
        {
            icon: "/reportsIcons/login-icon-orange.png",
            iconStyle: "text-[#F38B4D] bg-[#FFF2E8]",
            title: "Quality Leads",
            key: "totalToAssessments"
        },
        {
            icon: "/reportsIcons/handshake.png",
            iconStyle: "text-[#6F65F1] bg-[#E9E8FF]",
            title: "Leads To Sales",
            key: "totalLeadsToSales"
        }
    ];

    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    // Add ID to each coach

    const handleSubmit = (e) => {
        e.preventDefault();

        // Required fields validation
        const requiredFields = [
            { key: "firstName", label: "First Name" },
            { key: "lastName", label: "Last Name" },
            { key: "gender", label: "Gender" },
            { key: "dob", label: "Date of Birth" },
            { key: "phoneNumber", label: "Phone Number" },
            { key: "email", label: "Email Address" },
            { key: "age", label: "Age" },
            { key: "postcode", label: "Postcode" },
            { key: "managementExperience", label: "Management Experience" },
        ];

        for (let field of requiredFields) {
            const value = formData[field.key];

            if (!value || String(value).trim() === "") {
                showWarning("Missing Field", `${field.label} is required.`);
                return;
            }
        }


        // Valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showError("Invalid Email", "Please enter a valid email address.");
            return;
        }

        // Phone number validation (optional)
        if (formData.phoneNumber.length < 8) {
            showError("Invalid Phone Number", "Phone number must be at least 8 digits.");
            return;
        }

        // Success

        console.log("New Lead Data:", formData);
        createFranchiseRecruitment(formData);
        setFormData({
            firstName: "",
            lastName: "",
            gender: "",
            dob: "",
            phoneNumber: "",
            email: "",
            age: "",
            postcode: "",
            managementExperience: "",

        });
        setIsOpen(false);
    };
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Checkbox state
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleCheckbox = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };


    // for fiters 
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
        '3+ Years Exp': false,
    });

    const handleInputChange = (e) => {
        setStudentName(e.target.value);
    };

    const handleVenueChange = (e) => {
        setVenueName(e.target.value);
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
    const handleFranchiseMail = async (selectedIds) => {
        const result = await showConfirm("Are you sure?", "Do you want to send the mail?");
        if (result.isConfirmed) {
            await sendFranchiseMail(selectedIds);
        }
    };
    const calculateAge = (dob) => {
        if (!dob) return "";
        const birthDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "",
        dob: "",
        age: "",
        phoneNumber: "",
        email: "",
        postcode: "",
        managementExperience: "",

    });
    const getExpYears = (value = "") => {
        const lower = value.toLowerCase().trim();

        if (lower.includes("more")) return 6; // treat "More than 5 years" as 6+
        const num = parseInt(lower);
        return isNaN(num) ? null : num;
    };


    const applyFilter = () => {
        let temp = Array.isArray(recruitment) ? [...recruitment] : [];

        setCurrentPage(1);
        // 1️⃣ Name filter
        if (studentName.trim()) {
            const q = studentName.trim().toLowerCase();
            temp = temp.filter(c =>
                `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(q)
            );
        }

        // 2️⃣ Status / Exp / FA filters
        const selected = Object.entries(checkedStatuses)
            .filter(([_, v]) => v)
            .map(([k]) => k);

        if (selected.length > 0) {
            temp = temp.filter((c) => {
                const status = (c.status ?? "").toLowerCase();
                const expYears = getExpYears(c.managementExperience);
                const faLevel1 = c.level === "yes";

                let match = true;

                // Status
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

                // FA Level


                return match;
            });
        }

        // 3️⃣ Date range
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


    useEffect(() => {
        setFilteredRecruitment(recruitment);
    }, [recruitment]);

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

    const genderOptions = [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
        { value: "Other", label: "Other" },
    ];

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


    const totalItems = filteredRecruitment.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const currentData = useMemo(
        () => filteredRecruitment.slice(startIndex, endIndex),
        [filteredRecruitment, startIndex, endIndex]
    );
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
                : "-"
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Franchise Leads");

        XLSX.writeFile(workbook, "franchise_leads.xlsx");
    };
    const inputClass =
        " px-4 py-3 border border-[#E2E1E5] rounded-xl focus:outline-none ";

    if (loading) return <Loader />;
    return (
        <div className="flex gap-5">
            <div className={`transition-all duration-300 ${showFilter ? "md:w-8/12" : "w-full"}`}>

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
                                        <p className="text-green-600 text-xs">{card.change}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coaches Table */}

                <div className="flex justify-between items-center p-4 mt-3">
                    <h2 className="font-semibold text-2xl">Franchise Recruitment Leads</h2>
                    <div className="flex gap-4 items-center">
                        <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                        </div>
                        <button className="bg-white border border-[#E2E1E5] rounded-full flex justify-center items-center h-10 w-10"><TiUserAdd className="text-xl" /></button>
                        <button onClick={() => setIsOpen(true)}
                            className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            <Plus size={16} />
                            Add new Franchise
                        </button>

                    </div>
                </div>
                <div className="mt-3 overflow-auto rounded-3xl bg-white ">
                    <table className="min-w-full text-sm">
                        <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                            <tr className="font-semibold text-[#717073]">
                                <th className="py-3 px-4 font-semibold">Name</th>
                                <th className="py-3 px-4 font-semibold">Age</th>
                                <th className="py-3 px-4 font-semibold">Location</th>
                                <th className="py-3 px-4 font-semibold">Telephone</th>
                                <th className="py-3 px-4 font-semibold">Email</th>
                                <th className="py-3 px-4 font-semibold">Experience</th>
                                <th className="py-3 px-4 font-semibold">Capital available</th>
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
                                const status = coach.status ? coach.status.toLowerCase() : "";

                                return (
                                    <tr onClick={() => navigate(`/recruitment/franchise-lead/see-details?id=${coach?.id}&comesfrom=franchise`)} key={coach.id} className="border-b cursor-pointer border-gray-200">
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
                                                        <Check size={16} strokeWidth={3} className="text-gray-500" />
                                                    )}
                                                </button>

                                                {fullName}
                                            </div>
                                        </td>

                                        <td className="p-4">{coach.age}</td>
                                        <td className="p-4">{coach?.candidateProfile?.location}</td>
                                        <td className="p-4">{coach.phoneNumber}</td>
                                        <td className="p-4">{coach.email}</td>
                                        <td className="p-4">{coach.managementExperience}</td>

                                        <td className="p-4">
                                            {coach?.candidateProfile?.capitalAvailable
                                                ? `£${Number(coach.candidateProfile.capitalAvailable).toLocaleString()}`
                                                : "-"}
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
                        <button onClick={() => handleFranchiseMail(selectedIds)} className="flex-1 flex items-center justify-center text-[#717073] gap-1 border border-[#717073] rounded-lg py-3 text-sm hover:bg-gray-50">
                            <Mail size={16} className="text-[#717073]" /> Send Email
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1 border text-[#717073] border-[#717073] rounded-lg py-3 text-sm hover:bg-gray-50">
                            <MessageSquare size={16} className="text-[#717073]" /> Send Text
                        </button>
                        <button onClick={exportToExcel} className="flex items-center justify-center gap-1 bg-[#237FEA] text-white text-sm py-3 rounded-lg hover:bg-blue-700 transition">
                            <Download size={16} /> Export Data
                        </button>

                    </div>
                    {isOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
                                {/* Modal Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Add New Franchise </h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="First Name"
                                            className="inputClass pl-3 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

                                        />

                                        <input
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="Last Name"
                                            className="inputClass pl-3 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

                                        />
                                    </div>

                                    {/* DOB with DatePicker */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <DatePicker
                                                selected={formData.dob ? new Date(formData.dob) : null}
                                                onChange={(date) => {
                                                    if (!date) return;

                                                    const formattedDate = `${date.getFullYear()}-${String(
                                                        date.getMonth() + 1
                                                    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

                                                    const age = calculateAge(formattedDate);

                                                    setFormData({
                                                        ...formData,
                                                        dob: formattedDate,
                                                        age,
                                                    });
                                                }}
                                                placeholderText="Date of Birth"
                                                className="w-full pl-3 pr-3 py-3 border border-[#E2E1E5] rounded-lg text-sm"
                                                dateFormat="yyyy-MM-dd"
                                                showYearDropdown           // ✅
                                                showMonthDropdown          // ✅
                                                dropdownMode="select"      // ✅ easier year selection
                                            />
                                        </div>
                                        <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 ">
                                            {/* Flag Dropdown */}
                                            <PhoneInput
                                                country="uk"
                                                value="+44"
                                                disableDropdown={true}
                                                disableCountryCode={true}
                                                countryCodeEditable={false}
                                                inputStyle={{
                                                    width: "0px",
                                                    maxWidth: '20px',
                                                    height: "0px",
                                                    opacity: 0,
                                                    pointerEvents: "none", // ✅ prevents blocking typing
                                                    position: "absolute",
                                                }}
                                                buttonClass="!bg-white !border-none !p-0"
                                            />
                                            <input
                                                name="phoneNumber"
                                                type="number"
                                                value={formData.phoneNumber}
                                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                placeholder="Phone Number"
                                                className="border-none w-full focus:outline-none"

                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Email Address"
                                            className="inputClass pl-3 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

                                        />

                                        <input
                                            name="postcode"
                                            value={formData.postcode}
                                            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                                            placeholder="Postcode"
                                            className="inputClass pl-3 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            name="managementExperience"
                                            value={formData.managementExperience}
                                            onChange={(e) =>
                                                setFormData({ ...formData, managementExperience: e.target.value })
                                            }
                                            className="inputClass pl-3 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option disabled value="">Select experience</option>
                                            <option value="1 year">1 year</option>
                                            <option value="2 years">2 years</option>
                                            <option value="3 years">3 years</option>
                                            <option value="4 years">4 years</option>
                                            <option value="5 years">5 years</option>
                                            <option value="More than 5 years">More than 5 years</option>
                                        </select>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={(e) =>
                                                setFormData({ ...formData, gender: e.target.value })
                                            }
                                            className="inputClass pl-3 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option disabled value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>

                                    </div>

                                    <div><label className="text-sm text-gray-600">Age</label>
                                        <input
                                            name="age"
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="Age"
                                            className="inputClass pl-3 pr-3 py-3 w-full border border-[#E2E1E5] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

                                        />
                                    </div>
                                    {/* Status */}


                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-lg bg-[#237FEA] text-white hover:bg-blue-700"
                                        >
                                            Save Lead
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default FranchiseLeads;
