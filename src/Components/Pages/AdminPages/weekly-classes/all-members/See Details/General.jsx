// src/components/profile.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import Loader from '../../../contexts/Loader';
import { usePermission } from '../../../Common/permission';
import { addDays } from "date-fns";
import { FaEdit, FaSave } from "react-icons/fa";
import { useNotification } from '../../../contexts/NotificationContext';
import { showSuccess, showError, showConfirm, showWarning } from '../../../../../../utils/swalHelper';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import Comments from '../../../Common/Comments';
import { useEmail } from '../../../contexts/messages/SendEmailContext';
import { useCancelMembership } from '../../../contexts/messages/CancelMembershipContext';
import PhoneNumberInput from '../../../Common/PhoneNumberInput';

const ParentProfile = (stateData) => {
    const profile = stateData?.stateData || {};
    console.log('profileprofile', profile)
    const navigate = useNavigate();
    const { serviceHistoryMembership } = useBookFreeTrial();
    const [textloading, setTextLoading] = useState(null);
    const { openEmailPopup } = useEmail();
    const { openCancelPopup } = useCancelMembership();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const {
        loading,
        addtoWaitingListSubmit, cancelMembershipSubmit,
        sendBookMembershipMail, transferMembershipSubmit,
        addToWaitingList, setaddToWaitingList,
        freezerMembershipSubmit, reactivateDataSubmit, cancelWaitingListSpot, updateBookMembershipFamily, removeWaiting, setRemoveWaiting, showCancelTrial, setshowCancelTrial
    } = useBookFreeTrial() || {};
    const classSchedule = profile?.classSchedule;
    const bookingId = profile?.bookingId;
    const id = profile?.id;
    console.log('profile', profile)
    const paymentPlans = profile?.paymentPlans;
    const [editingIndex, setEditingIndex] = useState(null);
    const [commentsList, setCommentsList] = useState([]);
    const [loadingComment, setLoadingComment] = useState(false);
    const [comment, setComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 5; // Number of comments per page

    // Pagination calculations
    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
    const totalPages = Math.ceil(commentsList.length / commentsPerPage);
    const { adminInfo, setAdminInfo } = useNotification();
    const token = localStorage.getItem("adminToken");
    const serviceType = profile?.serviceType || "weekly class membership";
    const isMembership = serviceType === "weekly class membership";
    const isHolidayCamp = serviceType === "holiday camp";
    const isTrials = serviceType === "weekly class trial";
    const isBirthdayParty = profile?.booking?.serviceType === "birthday party";
    const isOneToOne = profile?.booking?.serviceType === "one to one";

    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };
    const formatDate = (dateString, withTime = false) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const options = {
            year: "numeric",
            month: "short",
            day: "2-digit",
        };
        if (withTime) {
            return (
                date.toLocaleDateString("en-US", options) +
                ", " +
                date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            );
        }
        return date.toLocaleDateString("en-US", options);
    };
    // ── Service-type label for the right panel ────────────────────────────────
    const serviceLabel = isBirthdayParty ? "Birthday Party" : isOneToOne ? "One to One" : "Membership";
    const getBg = () => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "/frames/Pending.png";
            case "active":
                return "/frames/Active.png";
            case "completed":
                return "/frames/Completed.png";
            case "cancelled":
                return "/frames/Cancelled.png";
            default:
                return "/frames/Default.png"; // fallback if needed
        }
    };
    // ── Extra info rows for the right panel (service-specific) ───────────────
    const renderExtraInfoRows = () => {
        if (isBirthdayParty) {
            return (
                <>
                    <div className="border-t border-[#495362] pt-5">
                        <div className="text-[20px] text-white">Party Address</div>
                        <div className="text-[16px] mt-1 text-gray-400">{profile._extra?.address || "N/A"}</div>
                    </div>
                    <div className="border-t border-[#495362] pt-5">
                        <div className="text-[20px] text-white">Party Time</div>
                        <div className="text-[16px] mt-1 text-gray-400">{profile._extra?.time || "N/A"}</div>
                    </div>
                    <div className="border-t border-[#495362] pt-5">
                        <div className="text-[20px] text-white">Capacity</div>
                        <div className="text-[16px] mt-1 text-gray-400">{profile._extra?.capacity ?? "N/A"}</div>
                    </div>
                </>
            );
        }
        if (isOneToOne) {
            return (
                <>
                    <div className="border-t border-[#495362] pt-5">
                        <div className="text-[20px] text-white">Session Address</div>
                        <div className="text-[16px] mt-1 text-gray-400">{profile._extra?.address || "N/A"}</div>
                    </div>
                    <div className="border-t border-[#495362] pt-5">
                        <div className="text-[20px] text-white">Session Time</div>
                        <div className="text-[16px] mt-1 text-gray-400">{profile._extra?.sessionTime || "N/A"}</div>
                    </div>
                    {profile._extra?.areaWorkOn && (
                        <div className="border-t border-[#495362] pt-5">
                            <div className="text-[20px] text-white">Area to Work On</div>
                            <div className="text-[16px] mt-1 text-gray-400">{profile._extra.areaWorkOn}</div>
                        </div>
                    )}
                </>
            );
        }
        // Membership — existing fields
        return (
            <>
                <div className="border-t border-[#495362] pt-5">
                    <div className="text-[20px] text-white">Membership Tenure</div>
                    <div className="text-[16px] mt-1 text-gray-400">{MembershipTenure || "N/A"}</div>
                </div>
                <div className="border-t border-[#495362] pt-5">
                    <div className="text-[20px] text-white">ID</div>
                    <div className="text-[16px] mt-1 text-gray-400">{ID}</div>
                </div>
                <div className="border-t border-[#495362] py-5">
                    <div className="text-[20px] text-white mb-3">Progress</div>
                    <div className="flex items-center justify-between">
                        <div className="w-[90%] bg-[#fff] h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-green-500 h-4 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="text-white text-right mt-1 text-[14px]"> {progressPercent}%</div>
                    </div>
                </div>
            </>
        );
    };
    const studentsList = profile?.students || [];
    const bookedBy = profile?.bookedByAdmin || profile?.bookedBy;
    const [transferVenue, setTransferVenue] = useState(false);
    const [reactivateMembership, setReactivateMembership] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [freezeMembership, setFreezeMembership] = useState(false);
    const reasonOptions = [
        { value: "Family emergency - cannot attend", label: "Family emergency - cannot attend" },
        { value: "Health issue", label: "Health issue" },
        { value: "Schedule conflict", label: "Schedule conflict" },
        { value: "other", label: "Other reason" },

    ];
    const cancelType = [
        { value: "immediate", label: "Cancel Immediately" },
        { value: "scheduled", label: "Request Cancel" },
    ];
    const firstPayment = Array.isArray(profile?.payments)
        ? profile?.payments[0]
        : profile?.payments;
    const ID = profile?.bookedId || firstPayment?.pan;
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000); // in seconds

        if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;

        // fallback: return exact date if older than 7 days
        return past.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    const fetchComments = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/list`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setCommentsList(result);
        } catch (error) {
            console.error("Failed to fetch comments:", error);

            showError("Error", error.message || error.error || "Failed to fetch comments. Please try again later.");
        }
    }, []);

    // useEffect(() => {
    //     fetchComments();
    // }, [])
    const handleSubmitComment = async (e) => {

        e.preventDefault();

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${token}`);

        const raw = JSON.stringify({
            "comment": comment
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        try {
            // Loader skipped
            setLoadingComment(true)

            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/create`, requestOptions);

            const result = await response.json();

            if (!response.ok) {
                showError("Failed to Add Comment", result.message || "Something went wrong.");
                return;
            }


            // showSuccess("Comment Created", result.message || " Comment has been  added successfully!");


            setComment('');
            fetchComments();
        } catch (error) {
            console.error("Error creating member:", error);
            setLoadingComment(false)
            showError("Network Error", error.message || "An error occurred while submitting the form.");
        } finally {
            setLoadingComment(false)
        }
    }
    // console.log('profile', profile)
    const [rebookFreeTrial, setRebookFreeTrial] = useState({
        bookingId: id || null,
        trialDate: "",
        reasonForNonAttendance: "",
        additionalNote: "",
    });
    const [formData, setFormData] = useState({
        bookingId: bookingId,
        cancelReason: "",
        additionalNote: "",
    });
    const [emergencyContacts, setEmergencyContacts] = useState(profile?.emergency || []);
    const [editingEmergency, setEditingEmergency] = useState(null);
    // console.log('loading', loading)


    const { checkPermission } = usePermission();
    const failedPayments = profile?.payments?.filter(
        (payment) => payment.paymentStatus !== "success"
    ) || [];

    const canCancelTrial =
        checkPermission({ module: 'cancel-free-trial', action: 'create' })
    const canRebooking =
        checkPermission({ module: 'rebooking', action: 'create' })

    const [waitingListData, setWaitingListData] = useState({
        bookingId: bookingId,
        venueId: classSchedule?.venue?.id || null,
        startDate: null,
        notes: "",
        selectedStudents: [],
        studentConfigs: {},
    });

    const handleWaitingListConfigChange = (studentId, field, value) => {
        setWaitingListData(prev => ({
            ...prev,
            studentConfigs: {
                ...prev.studentConfigs,
                [studentId]: {
                    ...prev.studentConfigs?.[studentId],
                    [field]: value
                }
            }
        }));
    };

    const handleWaitingListStudentSelect = (selectedOptions) => {
        setWaitingListData((prev) => {
            const newConfigs = { ...prev.studentConfigs };
            // Initialize config for new selections if not exists
            selectedOptions?.forEach(opt => {
                if (!newConfigs[opt.value]) {
                    newConfigs[opt.value] = {
                        classScheduleId: null
                    };
                }
            });
            return {
                ...prev,
                selectedStudents: selectedOptions || [],
                studentConfigs: newConfigs
            };
        });
    };
    const [cancelData, setCancelData] = useState({
        bookingId: bookingId,
        cancellationType: "immediate",      // corresponds to selected radio
        cancelReason: "",          // corresponds to Select value
        cancelDate: null,          // corresponds to DatePicker
        additionalNote: "",        // textarea
    });
    const [cancelWaitingList, setCancelWaitingList] = useState({
        bookingId: bookingId,
        removedReason: "",           // corresponds to DatePicker
        removedNotes: "",        // textarea
    });
    const [transferData, setTransferData] = useState({
        bookingId: bookingId || null,
        venueId: classSchedule?.venue?.id || null,
        transferReasonClass: "", // optional notes
        classScheduleId: null,
        selectedStudents: [],
        studentTransfers: {},
    });
    const handleTransferConfigChange = (studentId, field, value) => {
        setTransferData(prev => ({
            ...prev,
            studentTransfers: {
                ...prev.studentTransfers,
                [studentId]: {
                    ...prev.studentTransfers[studentId],
                    [field]: value
                }
            }
        }));
    };
    const [freezeData, setFreezeData] = useState({
        bookingId: bookingId || null,
        freezeStartDate: null,
        freezeDurationMonths: null,
        reactivateOn: null, // optional if you want to capture explicitly
        reasonForFreezing: "",
    });
    const [reactivateData, setReactivateData] = useState({
        bookingId: bookingId || null,
        reactivateOn: null,
        additionalNote: "",
    });
    const handleInputChange = (e, stateSetter) => {
        const { name, value } = e.target;
        stateSetter((prev) => ({ ...prev, [name]: value }));
    };
    const handleSelectChange = (selected, field, stateSetter) => {
        stateSetter((prev) => ({ ...prev, [field]: selected?.value || null }));
    };
    const [parents, setParents] = useState(profile?.parents || []);
    const [students, setStudents] = useState(profile?.students || []);

    // Unified handler for DatePicker
    const handleDateChange = (date, field, stateSetter) => {
        if (!date) {
            stateSetter((prev) => ({ ...prev, [field]: null }));
            return;
        }
        const formatted = date.toLocaleDateString("en-CA"); // gives YYYY-MM-DD without timezone shift
        stateSetter((prev) => ({ ...prev, [field]: formatted }));
    };


    // Unified handler for radio buttons
    const handleRadioChange = (value, field, stateSetter) => {
        stateSetter((prev) => ({ ...prev, [field]: value }));
    };

    const handleStudentSelectChange = (selectedOptions) => {
        setTransferData((prev) => {
            const newTransfers = { ...prev.studentTransfers };
            // Initialize config for new selections if not exists
            selectedOptions?.forEach(opt => {
                if (!newTransfers[opt.value]) {
                    newTransfers[opt.value] = {
                        classScheduleId: null,
                        transferReasonClass: ""
                    };
                }
            });
            // Optional: clean up removed students? Keeping them is safer for now or we can delete.
            // Let's keep it simple.
            return {
                ...prev,
                selectedStudents: selectedOptions || [],
                studentTransfers: newTransfers
            };
        });
    };


    const paymentPlan = profile?.paymentPlan;
    // Access the first booking's venue name
    const venueName = profile?.venue?.name;
    const MembershipPlan = paymentPlan?.title;
    const MembershipPrice = paymentPlan?.price;
    const duration = paymentPlan?.duration ?? 0;
    let interval = paymentPlan?.interval ?? "";
    if (duration > 1 && interval) {
        interval += "s";
    }
    const MembershipTenure = profile?.membershipTenure || "";
    const totalBars = profile?.progressBar?.totalBars || 0;
    const filledBars = profile?.progressBar?.filledBars || 0;
    console.log('filledBars', filledBars)
    const progressPercent =
        totalBars > 0 ? Math.round((filledBars / totalBars) * 100) : 0;


    const dateBooked = profile?.startDate;
    const status = profile?.status;
    console.log('profile', profile)
    // console.log('Venue Name:', profile.dateBooked);

    function formatISODate(isoDateString, toTimezone = null) {
        if (!isoDateString) return "N/A"; // ✅ Handles null, undefined, or empty string

        const date = new Date(isoDateString);
        if (isNaN(date.getTime())) return "N/A"; // ✅ Handles invalid date formats

        let year, month, day, hours, minutes;

        if (toTimezone) {
            // Convert to target timezone using Intl.DateTimeFormat
            const options = {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: toTimezone,
            };
            const formatter = new Intl.DateTimeFormat("en-US", options);
            const parts = formatter.formatToParts(date);

            // Extract formatted parts
            month = parts.find(p => p.type === "month").value;
            day = parts.find(p => p.type === "day").value;
            year = parts.find(p => p.type === "year").value;
            hours = parts.find(p => p.type === "hour").value;
            minutes = parts.find(p => p.type === "minute").value;
        } else {
            // Use local time
            year = date.getFullYear();
            month = date.toLocaleString("en-US", { month: "short" });
            day = date.getDate().toString().padStart(2, "0");
            hours = date.getHours().toString().padStart(2, "0");
            minutes = date.getMinutes().toString().padStart(2, "0");
        }

        return `${month} ${day} ${year}`;
    }

    console.log('status', status)
    console.log('canCancelTrial', canCancelTrial)

    const handleDataChange = (index, field, value) => {
        const updatedParents = [...parents];
        updatedParents[index][field] = value;
        setParents(updatedParents);
    };
    const handleEmergencyChange = (index, field, value) => {
        const updated = [...emergencyContacts];
        updated[index][field] = value;
        setEmergencyContacts(updated);
    };
    // console.log('profile',profile)
    // ✅ Parent edit/save toggle
    const toggleEditParent = (index) => {
        if (editingIndex === index) {
            // 🔹 Save Mode
            const p = parents[index];
            if (
                !p.parentFirstName?.trim() ||
                !p.parentLastName?.trim() ||
                !p.parentEmail?.trim() ||
                !p.parentPhoneNumber?.trim() ||
                !p.relationToChild?.trim() ||
                !p.howDidYouHear?.trim()
            ) {
                showWarning("Missing fields", "Please fill all fields before saving.");
                return; // ❌ stop saving
            }
            setEditingIndex(null);
            const payload = studentsList.map((student, sIndex) => ({
                id: student.id ?? sIndex + 1,
                studentFirstName: student.studentFirstName,
                studentLastName: student.studentLastName,
                dateOfBirth: student.dateOfBirth,
                age: student.age,
                gender: student.gender,
                medicalInformation: student.medicalInformation,
                parents: parents.map((p, pIndex) => ({
                    id: p.id ?? pIndex + 1,
                    ...p,
                })),
                emergencyContacts: emergencyContacts.map((e, eIndex) => ({
                    id: e.id ?? eIndex + 1,
                    ...e,
                })),
            }));

            updateBookMembershipFamily(profile?.bookingId, payload);
            // console.log("Parent Payload to send:", payload);
        } else {
            // 🔹 Edit Mode
            setEditingIndex(index);
        }
    };

    // ✅ Emergency edit/save toggle
    const toggleEditEmergency = (index) => {
        if (editingEmergency === index) {
            // 🔹 Save Mode
            setEditingEmergency(null);

            const payload = studentsList.map((student, sIndex) => ({
                id: student.id ?? sIndex + 1,
                studentFirstName: student.studentFirstName,
                studentLastName: student.studentLastName,
                dateOfBirth: student.dateOfBirth,
                age: student.age,
                gender: student.gender,
                medicalInformation: student.medicalInformation,
                parents: parents.map((p, pIndex) => ({
                    id: p.id ?? pIndex + 1,
                    ...p,
                })),
                emergencyContacts: emergencyContacts.map((e, eIndex) => ({
                    id: e.id ?? eIndex + 1,
                    ...e,
                })),
            }));

            updateBookMembershipFamily(profile?.bookingId, payload);
            // console.log("Emergency Payload to send:", payload);
        } else {
            // 🔹 Edit Mode
            setEditingEmergency(index);
        }
    };

    const getStatusBgColor = (status) => {
        switch (status) {
            case "active": return "bg-[#43BE4F]";
            case "frozen": return "bg-[#509EF9]";
            case "cancelled": return "bg-[#FC5D5D]";
            case "waiting list": return "bg-[#A4A5A6]";
            default: return "bg-[#A4A5A6]";
        }
    };

    const monthOptions = [
        { value: 1, label: "1 Month" },
        { value: 2, label: "2 Months" },
        { value: 3, label: "3 Months" },
        { value: 4, label: "4 Months" },
        { value: 5, label: "5 Months" },
        { value: 6, label: "6 Months" },
        { value: 12, label: "12 Months" },
    ];

    // console.log('waitingListData', waitingListData)
    // console.log('transferData', transferData)
    // console.log('freezeData', freezeData)
    // console.log('cancelData', cancelData)
    // console.log('emergencyContacts', emergencyContacts)

    const newClasses = profile?.newClasses?.map((cls) => ({
        value: cls.id,
        label: `${cls.className} - ${cls.day} (${cls.startTime} - ${cls.endTime})`,
    }));
    const newClassesForWaitingList = profile?.noCapacityClass?.map((cls) => ({
        value: cls.id,
        label: `${cls.className} - ${cls.day} (${cls.startTime} - ${cls.endTime})`,
    }));

    const selectedClass = newClasses?.find(
        (cls) => cls.value === waitingListData?.classScheduleId
    );
    const selectedClassForWaitingList = newClassesForWaitingList?.find(
        (cls) => cls.value === waitingListData?.classScheduleId
    );
    const handleBookMembership = () => {
        showConfirm(
            "Are you sure?",
            "Do you want to book a membership?",
            "Yes, Book it!",
            "Cancel"
        ).then((result) => {
            if (result.isConfirmed) {
                // console.log('profile',profile)
                // Navigate to your component/route
                navigate("/weekly-classes/find-a-class/book-a-membership", {
                    state: { TrialData: profile, comesFrom: "waitingList" },
                });
            }
        });
    };
    const sendText = async (bookingIds) => {
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
                    bookingId: bookingIds, // make sure bookingIds is an array like [96, 97]
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
            await serviceHistoryMembership(bookingId);
            setTextLoading(false);
        }
    };

    const hearOptions = [
        { value: "Google", label: "Google" },
        { value: "Facebook", label: "Facebook" },
        { value: "Instagram", label: "Instagram" },
        { value: "Friend", label: "Friend" },
        { value: "Flyer", label: "Flyer" },
    ];
    if (loading) return <Loader />;

    const classInfo = (profile?.students || [])
        .map((student) => {
            const className = student?.classSchedule?.className || "-";
            const studentName = `${student?.studentFirstName || ""} ${student?.studentLastName || ""}`.trim();
            return `${className} (${studentName})`;
        })
        .join(", ");
    return (
        <>
            <div className="md:flex w-full gap-4">
                <div className="transition-all md:w-8/12 duration-300 flex-1 ">

                    <div className="space-y-6">

                        <div className="space-y-6">
                            {parents.map((parent, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-6 mb-10 rounded-3xl shadow-sm space-y-6 relative"
                                >
                                    {/* Header + Pencil/Save */}
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-[20px] font-semibold">Parent information</h2>
                                        <button
                                            onClick={() => toggleEditParent(index)}
                                            className="text-gray-600 hover:text-blue-600"
                                        >
                                            {editingIndex === index ? <FaSave /> : <FaEdit />}
                                        </button>
                                    </div>

                                    {/* First/Last Name */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">First name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.parentFirstName}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleDataChange(index, "parentFirstName", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Last name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.parentLastName}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleDataChange(index, "parentLastName", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Email + Phone */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Email</label>
                                            <input
                                                type="email"
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.parentEmail}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleDataChange(index, "parentEmail", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Phone number</label>


                                            <PhoneNumberInput
                                                value={parent.parentPhoneNumber}
                                                onChange={(fullNumber) =>
                                                    handleDataChange(index, "parentPhoneNumber", fullNumber)
                                                }
                                                readOnly={editingIndex !== index}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </div>

                                    {/* Relation + How Did You Hear */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Relation to child</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.relationToChild}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleDataChange(index, "relationToChild", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">
                                                How did you hear about us?
                                            </label>
                                            <select
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.howDidYouHear}
                                                readOnly={editingIndex !== index}
                                                disabled={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleDataChange(index, "howDidYouHear", e.target.value)
                                                }
                                            >


                                                {hearOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            {students?.map((student, index) => (
                                <div
                                    key={student.id || index}
                                    className="bg-white p-6 mb-10 rounded-3xl shadow-sm space-y-6 relative"
                                >
                                    {/* Top Header */}
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-[20px] font-semibold">Student Information</h2>
                                        <button
                                            onClick={() => toggleEditStudent(index)}
                                            className="text-gray-600 hover:text-blue-600"
                                        >
                                            {editingIndex === index ? <FaSave /> : <FaEdit />}
                                        </button>
                                    </div>

                                    {/* Row 1 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">First name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter first name"
                                                value={student.studentFirstName || ""}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleStudentDataChange(index, "studentFirstName", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Last name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter last name"
                                                value={student.studentLastName || ""}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleStudentDataChange(index, "studentLastName", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Age</label>
                                            <input
                                                type="number"
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter age"
                                                value={student.age || ""}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleStudentDataChange(index, "age", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Date of Birth</label>
                                            <input
                                                type="date"
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={student.dateOfBirth || ""}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleStudentDataChange(index, "dateOfBirth", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Medical information</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={student.medicalInformation || ""}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleStudentDataChange(index, "medicalInformation", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Ability level</label>
                                            <select
                                                name="abilityLevel"
                                                id="abilityLevel"
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={student.abilityLevel || ""}
                                                disabled={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleStudentDataChange(index, "abilityLevel", e.target.value)
                                                }
                                            >
                                                <option value="" disabled>
                                                    Select Ability level
                                                </option>
                                                <option value="beginner">Beginner</option>
                                                <option value="intermediate">Intermediate</option>
                                                <option value="advanced">Advanced</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>

                    </div>

                    <Comments
                        adminInfo={adminInfo}
                        comment={comment}
                        setComment={setComment}
                        handleSubmitComment={handleSubmitComment}
                        loadingComment={loadingComment}
                        commentsList={commentsList}
                        currentComments={currentComments}
                        formatTimeAgo={formatTimeAgo}
                    />
                </div>
                {isBirthdayParty ?
                    <div className="md:w-4/12 max-h-fit rounded-full text-base space-y-5">
                        <div className="rounded-3xl bg-[#363E49] overflow-hidden shadow-md border border-gray-200">

                            {/* 🔷 STATUS HEADER (SAME STYLE) */}
                            <div
                                className="m-2 px-6 rounded-3xl py-3 flex items-center justify-between bg-no-repeat bg-center"
                                style={{
                                    backgroundImage:
                                        status === "cancelled"
                                            ? "url('/frames/Cancelled.png')"
                                            : status === "frozen"
                                                ? "url('/frames/Frozen.png')"
                                                : status === "active"
                                                    ? "url('/frames/Active.png')"
                                                    : "url('/frames/Pending.png')",
                                    backgroundSize: "cover",
                                }}
                            >
                                <div>
                                    <div className="text-[20px] font-bold text-[#1F2937]">
                                        Account Status
                                    </div>
                                    <div className="text-[16px] font-semibold capitalize text-[#1F2937]">
                                        {status || "Unknown"}
                                    </div>
                                </div>
                            </div>

                            {/* 🔷 DARK CONTENT AREA (EXACT SAME STYLE) */}
                            <div className="bg-[#363E49] text-white px-6 py-6 space-y-6">

                                {/* Avatar + Coach */}
                                <div className="flex items-center gap-4">
                                    <img
                                        src="/members/user2.png"
                                        alt="Coach"
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className="text-[22px] font-semibold">Coach</div>
                                        <div className="text-[16px] text-gray-300">
                                            {profile?.booking?.coach
                                                ? `${profile.booking.coach.firstName} ${profile.booking.coach.lastName}`
                                                : "N/A"}
                                        </div>
                                    </div>
                                </div>

                                {/* Venue */}
                                <div>
                                    <div className="text-[20px] font-bold">Venue</div>
                                    <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md mt-1">
                                        {profile?.booking?.address || "N/A"}
                                    </div>
                                </div>

                                {/* Parent */}
                                <div className="border-t border-[#495362] pt-5">
                                    <div className="text-[20px]">Parent Name</div>
                                    <div className="text-[16px] text-gray-400 mt-1">
                                        {profile?.booking?.parents?.[0]
                                            ? `${profile.booking.parents[0].parentFirstName} ${profile.booking.parents[0].parentLastName}`
                                            : profile?.parentName || "N/A"}
                                    </div>
                                </div>

                                {/* Age */}
                                <div className="border-t border-[#495362] pt-5">
                                    <div className="text-[20px]">Child Age</div>
                                    <div className="text-[16px] text-gray-400 mt-1">
                                        {profile?.age || "N/A"}
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="border-t border-[#495362] pt-5">
                                    <div className="text-[20px]">Date of Party</div>
                                    <div className="text-[16px] text-gray-400 mt-1">
                                        {profile?.booking?.date
                                            ? new Date(profile.booking.date).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : "N/A"}
                                    </div>
                                </div>

                                {/* Package */}
                                <div className="border-t border-[#495362] pt-5">
                                    <div className="text-[20px]">Package</div>
                                    <div className="text-[16px] text-gray-400 mt-1">
                                        {profile?.booking?.paymentPlan?.title ||
                                            profile?.packageInterest ||
                                            "N/A"}
                                    </div>
                                </div>

                                {/* Source */}
                                <div className="border-t border-[#495362] pt-5">
                                    <div className="text-[20px]">Source</div>
                                    <div className="text-[16px] text-gray-400 mt-1">
                                        {profile?.source ||
                                            profile?.booking?.parents?.[0]?.howDidHear ||
                                            "N/A"}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="border-t border-[#495362] pt-5">
                                    <div className="text-[20px]">Price</div>
                                    <div className="text-[16px] text-gray-400 mt-1">
                                        £
                                        {profile?.booking?.payment?.amount
                                            ? parseFloat(profile.booking.payment.amount).toFixed(2)
                                            : "0.00"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🔷 ACTIONS (EXACT SAME WHITE BOX STYLE) */}
                        <div className="bg-white rounded-3xl p-6 space-y-4">

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        if (bookingId) {
                                            sendBirthdayMail(bookingId);
                                        } else {
                                            showWarning(
                                                "No Students Selected",
                                                "Please select at least one Lead before sending an email."
                                            );
                                        }
                                    }}
                                    className="flex-1 border border-[#717073] rounded-xl py-3 text-[18px] flex items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md"
                                >
                                    Send Email
                                </button>

                                <button className="flex-1 border border-[#717073] rounded-xl py-3 text-[18px] flex items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md">
                                    Send Text
                                </button>
                            </div>

                            {status !== "active" ? (
                                <button
                                    onClick={handleRenewBirthdayPackage}
                                    className="w-full bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:bg-blue-700"
                                >
                                    Renew Package
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancelBirthdayPackage}
                                    className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 font-medium hover:bg-[#FF6C6C] hover:text-white"
                                >
                                    Cancel Package
                                </button>
                            )}
                        </div>
                    </div>
                    : isOneToOne ? <>
                        <div className="md:w-[34%]">
                            <div className="md:max-w-[510px] rounded-3xl bg-[#363E49] overflow-hidden shadow-md border border-gray-200">

                                {/* 🔷 STATUS HEADER (EXACT SAME) */}
                                <div
                                    className="m-2 px-6 rounded-3xl py-3 flex items-center justify-between bg-no-repeat bg-center"
                                    style={{
                                        backgroundImage:
                                            status === "cancelled"
                                                ? "url('/frames/Cancelled.png')"
                                                : status === "frozen"
                                                    ? "url('/frames/Frozen.png')"
                                                    : status === "active"
                                                        ? "url('/frames/Active.png')"
                                                        : status === "request_to_cancel"
                                                            ? "url('/frames/reqCancel.png')"
                                                            : "url('/frames/Pending.png')",
                                        backgroundSize: "cover",
                                    }}
                                >
                                    <div>
                                        <div className="text-[20px] font-bold text-[#1F2937]">
                                            Account Status
                                        </div>
                                        <div className="text-[16px] font-semibold capitalize text-[#1F2937]">
                                            {status ? status.replaceAll("_", " ") : "Unknown"}
                                        </div>
                                    </div>
                                </div>

                                {/* 🔷 DARK CONTENT AREA (IDENTICAL STRUCTURE) */}
                                <div className="bg-[#363E49] text-white px-6 py-6 space-y-6">

                                    {/* Avatar + Coach */}
                                    <div className="flex items-center gap-4">
                                        <img
                                            src="/members/user2.png"
                                            alt="Coach"
                                            className="w-18 h-18 rounded-full"
                                        />
                                        <div>
                                            <div className="text-[24px] font-semibold leading-tight">
                                                Coach
                                            </div>
                                            <div className="text-[16px] text-gray-300">
                                                {profile?.booking?.coach
                                                    ? `${profile.booking.coach.firstName} ${profile.booking.coach.lastName}`
                                                    : "N/A"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DETAILS BLOCK (same grouping style) */}
                                    <div className="space-y">

                                        {/* Venue */}
                                        <div className="mb-4">
                                            <div className="text-[20px] font-bold tracking-wide">Venue</div>
                                            <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md mt-1">
                                                {profile?.booking?.location || "-"}
                                            </div>
                                        </div>

                                        {/* Parent */}
                                        <div className="border-t border-[#495362] py-5">
                                            <div className="text-[20px] text-white">Parent Name</div>
                                            <div className="text-[16px] mt-1 text-gray-400">
                                                {profile?.booking?.parents?.[0]
                                                    ? `${profile.booking.parents[0].parentFirstName} ${profile.booking.parents[0].parentLastName}`
                                                    : profile?.parentName || "N/A"}
                                            </div>
                                        </div>

                                        {/* Booking Date */}
                                        <div className="border-t border-[#495362] py-5">
                                            <div className="text-[20px] text-white">Date of Class</div>
                                            <div className="text-[16px] mt-1 text-gray-400">
                                                {profile?.booking?.date
                                                    ? new Date(profile.booking.date).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : "-"}
                                            </div>
                                        </div>

                                        {/* Package */}
                                        <div className="border-t border-[#495362] pt-5">
                                            <div className="text-[20px] text-white">Package</div>
                                            <div className="text-[16px] mt-1 text-gray-400">
                                                {profile?.booking?.paymentPlan?.title ||
                                                    profile?.packageInterest ||
                                                    "-"}
                                            </div>
                                        </div>

                                        {/* Source */}
                                        <div className="border-t border-[#495362] py-5">
                                            <div className="text-[20px] text-white">Source</div>
                                            <div className="text-[16px] mt-1 text-gray-400">
                                                {profile?.source ||
                                                    profile?.booking?.parents?.[0]?.howDidHear ||
                                                    "-"}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="border-t border-[#495362] py-5">
                                            <div className="text-[20px] text-white">Price</div>
                                            <div className="text-[16px] mt-1 text-gray-400">
                                                £
                                                {profile?.booking?.payment?.amount
                                                    ? parseFloat(profile.booking.payment.amount).toFixed(2)
                                                    : "0.00"}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* 🔷 ACTIONS (EXACT SAME BOX BELOW) */}
                            <div className="bg-white rounded-3xl p-6 space-y-4 mt-4">

                                <div className="flex gap-7">
                                    <button
                                        onClick={() => {
                                            if (bookingId) {
                                                sendOnetoOneMail(bookingId);
                                            } else {
                                                showWarning("Booking ID not found. Cannot send email.");
                                            }
                                        }}
                                        className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md transition-shadow duration-300"
                                    >
                                        Send Email
                                    </button>

                                    <button
                                        className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium"
                                    >
                                        Send Text
                                    </button>
                                </div>

                                {status !== "active" ? (
                                    <button
                                        onClick={handleRenewPackage}
                                        className="w-full bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:bg-blue-700 hover:shadow-md transition-shadow duration-300"
                                    >
                                        Renew Package
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCancelPackage}
                                        className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 font-medium hover:bg-[#FF6C6C] hover:text-white hover:shadow-md transition-shadow duration-300"
                                    >
                                        Cancel Package
                                    </button>
                                )}
                            </div>
                        </div></> :
                        isHolidayCamp ? <>
                            <div className="md:w-[34%]">
                                <div className="md:max-w-[510px]">

                                    {/* 🔷 MAIN CARD */}
                                    <div className="rounded-3xl bg-[#363E49] overflow-hidden shadow-md border border-gray-200">

                                        {/* 🔷 STATUS HEADER (MATCHED) */}
                                        <div
                                            className="m-2 px-6 rounded-3xl py-3 flex items-center justify-between bg-no-repeat bg-center"
                                            style={{
                                                backgroundImage:
                                                    status === "cancelled"
                                                        ? "url('/frames/Cancelled.png')"
                                                        : status === "active"
                                                            ? "url('/frames/Active.png')"
                                                            : status === "request_to_cancel"
                                                                ? "url('/frames/reqCancel.png')"
                                                                : "url('/frames/Pending.png')",
                                                backgroundSize: "cover",
                                            }}
                                        >
                                            <div>
                                                <div className="text-[20px] font-bold text-[#1F2937]">
                                                    Account Status
                                                </div>
                                                <div className="text-[16px] font-semibold capitalize text-[#1F2937]">
                                                    {profile?.status ||
                                                        profile?.booking?.payment?.paymentStatus ||
                                                        "N/A"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 🔷 DARK CONTENT */}
                                        <div className="bg-[#363E49] text-white px-6 py-6 space-y-6">

                                            {/* Booked By */}
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src="/members/user2.png"
                                                    alt="Coach"
                                                    className="w-18 h-18 rounded-full object-cover"
                                                />
                                                <div>
                                                    <div className="text-[24px] font-semibold leading-tight">
                                                        Booked In By
                                                    </div>
                                                    <div className="text-[16px] text-gray-300">
                                                        {profile?.bookedByAdmin
                                                            ? `${profile.bookedByAdmin.firstName} ${profile.bookedByAdmin.lastName}`
                                                            : "N/A"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DETAILS GROUP */}
                                            <div className="space-y">

                                                {/* Venue */}
                                                <div className="mb-4">
                                                    <div className="text-[20px] font-bold tracking-wide">Venue</div>
                                                    <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md mt-1">
                                                        {profile?.holidayVenue?.name || "-"}
                                                    </div>
                                                </div>

                                                {/* Students */}
                                                <div className="border-t border-[#495362] py-5">
                                                    <div className="text-[20px] text-white">No. Of Students</div>
                                                    <div className="text-[16px] mt-1 text-gray-400">
                                                        {profile?.totalStudents || "-"}
                                                    </div>
                                                </div>

                                                {/* Days */}
                                                <div className="border-t border-[#495362] py-5">
                                                    <div className="text-[20px] text-white">Days</div>
                                                    <div className="text-[16px] mt-1 text-gray-400">
                                                        {profile?.holidayCamp?.holidayCampDates?.[0]?.totalDays || "-"}
                                                    </div>
                                                </div>

                                                {/* Discount */}
                                                <div className="border-t border-[#495362] py-5">
                                                    <div className="text-[20px] text-white">Discounts</div>
                                                    <div className="text-[16px] mt-1 text-gray-400">
                                                        {profile?.payment?.discount_amount || "-"}
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="border-t border-[#495362] py-5">
                                                    <div className="text-[20px] text-white">Price</div>
                                                    <div className="text-[16px] mt-1 text-gray-400">
                                                        £{profile?.payment?.amount || "0.00"}
                                                    </div>
                                                </div>

                                                {/* Source */}
                                                <div className="border-t border-[#495362] py-5">
                                                    <div className="text-[20px] text-white">Source</div>
                                                    <div className="text-[16px] mt-1 text-gray-400">
                                                        {profile?.marketingChannel || "-"}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    {/* 🔷 ACTIONS (MATCHED WHITE BOX) */}
                                    <div className="bg-white rounded-3xl p-6 space-y-4 mt-4">

                                        <div className="flex gap-7">
                                            <button
                                                onClick={() => {
                                                    if (bookingId) {
                                                        sendEmail();
                                                    } else {
                                                        showWarning("No Booking ID", "No booking ID found to send email.");
                                                    }
                                                }}
                                                className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md transition-shadow duration-300"
                                            >
                                                Send Email
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (bookingId) {
                                                        sendText();
                                                    } else {
                                                        showWarning("No Booking ID", "No booking ID found to send email.");
                                                    }
                                                }}
                                                className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium"
                                            >
                                                {textloading ? (
                                                    <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
                                                ) : (
                                                    "Send Text"
                                                )}
                                            </button>
                                        </div>

                                        {status !== "cancelled" && (
                                            <button
                                                onClick={() => setshowCancelTrial(true)}
                                                className={`w-full border text-[18px] rounded-xl py-3 font-medium transition-shadow duration-300
                          ${showCancelTrial
                                                        ? "bg-[#FF6C6C] text-white shadow-md border-transparent"
                                                        : "border-gray-300 text-[#717073] hover:bg-[#FF6C6C] hover:text-white hover:shadow-md"
                                                    }`}
                                            >
                                                Cancel Membership
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 🔷 MODAL (UNCHANGED — already correct) */}
                                {showCancelTrial && (
                                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">

                                            <button
                                                className="absolute top-4 left-4 p-2"
                                                onClick={() => setshowCancelTrial(false)}
                                            >
                                                <img src="/images/icons/cross.png" alt="Close" />
                                            </button>

                                            <div className="text-center py-6 border-b border-gray-300">
                                                <h2 className="font-semibold text-[24px]">Cancel Membership</h2>
                                            </div>

                                            <div className="space-y-4 px-6 pb-6 pt-4">

                                                <div>
                                                    <label className="block text-[16px] font-semibold">
                                                        Reason for Cancellation
                                                    </label>
                                                    <Select
                                                        value={reasonOptions.find(
                                                            (opt) => opt.value === cancelData.cancelReason
                                                        )}
                                                        onChange={(selected) =>
                                                            handleSelectChange(selected, "cancelReason", setCancelData)
                                                        }
                                                        options={reasonOptions}
                                                        className="rounded-lg mt-2"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[16px] font-semibold">
                                                        Additional Notes (Optional)
                                                    </label>
                                                    <textarea
                                                        className="w-full bg-gray-100 mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        rows={3}
                                                        name="additionalNote"
                                                        value={cancelData.additionalNote}
                                                        onChange={(e) => handleInputChange(e, setCancelData)}
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-4 pt-4">
                                                    <button
                                                        onClick={() => {
                                                            if (!cancelData.cancelReason) {
                                                                showWarning("Missing Field", "Please select a reason.");
                                                                return;
                                                            }
                                                            setshowCancelTrial(false);
                                                            cancelHolidaySubmit(cancelData, "allMembers");
                                                        }}
                                                        className="w-full bg-[#FF6C6C] text-white text-[18px] py-3 rounded-xl font-medium hover:bg-red-600"
                                                    >
                                                        Cancel Camp
                                                    </button>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </> :
                            <>
                                <div className="md:w-4/12 max-h-fit rounded-full text-base space-y-5">
                                    <div className="rounded-3xl bg-[#363E49] overflow-hidden shadow-md border border-gray-200">
                                        {/* Status header */}
                                        {isTrials ? <div className=" m-2 px-6 rounded-3xl py-3 flex items-center justify-between bg-no-repeat bg-center"
                                            style={{
                                                backgroundImage: status === "cancelled"
                                                    ? "url('/frames/Cancelled.png')"
                                                    : status === "frozen"
                                                        ? "url('/frames/Frozen.png')"
                                                        : status === "active"
                                                            ? "url('/frames/Active.png')"
                                                            : status === "waiting list"
                                                                ? "url('/frames/Waiting.png')"
                                                                : "url('/frames/Pending.png')",


                                                backgroundSize: "cover",
                                            }}>
                                            <div>
                                                <div className="text-[20px] font-bold text-[#1F2937]">Account Status</div>
                                                <div className="text-[16px] font-semibold text-[#1F2937]">Trials</div>
                                            </div>
                                            <div className="bg-[#343A40] flex items-center gap-2  text-white text-[14px] px-3 py-2 rounded-xl">

                                                <div className="flex items-center gap-2">
                                                    {status === 'pending' && (
                                                        <img src="/images/icons/loadingWhite.png" alt="Pending" />
                                                    )}
                                                    {status === 'not attend' && (
                                                        <img src="/images/icons/x-circle-contained.png" alt="Not Attended" />
                                                    )}
                                                    {status === 'attended' && (
                                                        <img src="/images/icons/attendedicon.png" alt="Attended" />
                                                    )}
                                                    {status === 'cancelled' && (
                                                        <img src="/images/icons/x-circle-contained.png" alt="Cancelled" />
                                                    )}

                                                    {/* Fallback for any other or undefined status */}
                                                    {!status && (
                                                        <>
                                                            <img src="/images/icons/x-circle-contained.png" alt="Not Attended" />
                                                            Not Attended
                                                        </>
                                                    )}

                                                    {/* Status text */}
                                                    <span className="capitalize">
                                                        {status ? status.replaceAll("_", " ") : "Unknown"}
                                                    </span>
                                                </div>

                                            </div>
                                        </div> :
                                            <div
                                                className="m-2 px-6 rounded-3xl py-3 flex items-center justify-between bg-no-repeat bg-center"
                                                style={{
                                                    backgroundImage: status === "cancelled"
                                                        ? "url('/frames/Cancelled.png')"
                                                        : status === "frozen"
                                                            ? "url('/frames/Frozen.png')"
                                                            : status === "active"
                                                                ? "url('/frames/Active.png')"
                                                                : status === "request_to_cancel"
                                                                    ? "url('/frames/reqCancel.png')"
                                                                    : status === "waiting list"
                                                                        ? "url('/frames/Waiting.png')"
                                                                        : "url('/frames/Pending.png')",
                                                    backgroundSize: "cover",
                                                }}
                                            >
                                                <div>
                                                    <div className="text-[20px] font-bold text-[#1F2937]">Account Status</div>
                                                    <div className="text-[16px] font-semibold capitalize text-[#1F2937]">
                                                        {status ? status.replaceAll("_", " ") : "Unknown"}
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        <div className="bg-[#363E49] text-white px-6 py-6 space-y-6">
                                            {/* Avatar & Booked By */}
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={bookedBy?.profile ? `${API_BASE_URL}/${bookedBy.profile}` : "https://cdn-icons-png.flaticon.com/512/147/147144.png"}
                                                    alt="avatar"
                                                    className="w-18 h-18 rounded-full"
                                                    onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/147/147144.png"; }}
                                                />
                                                <div>
                                                    <div className="text-[24px] font-semibold leading-tight">
                                                        {isBirthdayParty || isOneToOne ? "Coach" : "Booked By"}
                                                    </div>
                                                    <div className="text-[16px] text-gray-300">
                                                        {bookedBy?.firstName} {bookedBy?.lastName}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Common details */}
                                            <div className="space-y">
                                                {/* Venue — only for membership */}
                                                {isMembership && (
                                                    <div className="mb-4">
                                                        <div className="text-[20px] font-bold tracking-wide">Venue</div>
                                                        <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md mt-1">
                                                            {venueName || "-"}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Service type badge */}
                                                {(isBirthdayParty || isOneToOne) && (
                                                    <div className="mb-4">
                                                        <div className="text-[20px] font-bold tracking-wide">Service Type</div>
                                                        <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md mt-1 capitalize">
                                                            {serviceLabel}
                                                        </div>
                                                    </div>
                                                )}
                                                {isTrials && (
                                                    <>
                                                        <div className="space-y">
                                                            <div>
                                                                <div className="text-[20px] font-bold tracking-wide">Venue</div>
                                                                <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md my-2">
                                                                    {profile?.venue?.name || "-"}
                                                                </div>
                                                            </div>

                                                            <div className="border-t border-[#495362] py-5">

                                                                <>
                                                                    <div className="text-[20px] text-white">Students</div>
                                                                    <div className="text-[16px] mt-1 text-gray-400">{profile?.students?.length || 0}</div>
                                                                </>


                                                            </div>

                                                            <div className="border-t border-[#495362] py-5">
                                                                {status === 'pending' || status === 'attended' ? (
                                                                    <>
                                                                        <div className=" text-[20px] text-white">Booking Date</div>
                                                                        <div className="text-[16px]  mt-1 text-gray-400"> {formatDate(profile?.createdAt, true)}</div>

                                                                    </>
                                                                ) : (
                                                                    <>

                                                                        <div className=" text-[20px] text-white">Date of Booking</div>
                                                                        <div className="text-[16px]  mt-1 text-gray-400"> {formatDate(profile?.createdAt, true)}</div>
                                                                    </>
                                                                )}

                                                            </div>

                                                            <div className="border-t border-[#495362] py-5">
                                                                <div className=" text-[20px] text-white">Date of Trial</div>
                                                                <div className="text-[16px]  mt-1 text-gray-400">{formatDate(profile?.trialDate)}</div>
                                                            </div>

                                                            <>
                                                                <div className="border-t border-[#495362] py-5">
                                                                    <div className=" text-[20px] text-white">Booking Source</div>
                                                                    <div className="text-[16px]  mt-1 text-gray-400"> {bookedBy?.firstName} {bookedBy?.lastName}</div>
                                                                </div>
                                                            </>

                                                        </div></>
                                                )}
                                                {isMembership && (<>
                                                    <div className="border-t border-[#495362] pt-5">
                                                        <div className="text-[20px] text-white">
                                                            {isBirthdayParty ? "Package" : "Membership Plan"}
                                                        </div>
                                                        <div className="text-[16px] mt-1 text-gray-400">
                                                            {MembershipPlan ? `${MembershipPlan} Plan` : "N/A"}
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-[#495362] pt-5">
                                                        <div className="text-[20px] text-white">
                                                            {isBirthdayParty ? "Party Date" : isOneToOne ? "Session Date" : "Membership Start Date"}
                                                        </div>
                                                        <div className="text-[16px] mt-1 text-gray-400">{formatISODate(dateBooked)}</div>
                                                    </div>

                                                    {/* Service-specific extra rows */}
                                                    {renderExtraInfoRows()}

                                                    <div className="border-t border-[#495362] py-5">
                                                        <div className="text-[20px] text-white">Price</div>
                                                        <div className="text-[16px] mt-1 text-gray-400">
                                                            {MembershipPrice ? `£${MembershipPrice}` : "-"}
                                                        </div>
                                                    </div>
                                                </>)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Action Buttons ─────────────────────────────────────── */}
                                    {status !== 'cancelled' && (
                                        <div className="bg-white rounded-3xl p-6 space-y-4 mt-4">
                                            <div className="flex gap-7">
                                                <button
                                                    className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center hover:shadow-md transition-shadow duration-300 gap-2 text-[#717073] font-medium"
                                                    onClick={() => {
                                                        const parentEmails = parents.map(p => p.parentEmail).filter(Boolean);
                                                        openEmailPopup(parentEmails, "/api/admin/send-manual-email", { token, showError, showSuccess });
                                                    }}
                                                >
                                                    Send Email
                                                </button>
                                                <button
                                                    disabled={textloading}
                                                    onClick={() => sendText([bookingId])}
                                                    className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium"
                                                >
                                                    <img src="/images/icons/sendText.png" alt="" />
                                                    {textloading ? <Loader2 className="animate-spin w-5 h-5 text-blue-500" /> : "Send Text"}
                                                </button>
                                            </div>

                                            {/* Membership-only actions */}
                                            {isMembership && (
                                                <>
                                                    {(status === "active" || status === "frozen" || status === "cancelled" || status === "request_to_cancel") && (
                                                        <button
                                                            onClick={() => setaddToWaitingList(true)}
                                                            className={`w-full rounded-xl py-3 text-[18px] font-medium transition-shadow duration-300 
                                                                ${addToWaitingList ? "bg-[#237FEA] text-white shadow-md" : "bg-white border border-gray-300 hover:bg-blue-700 text-[#717073] hover:text-white hover:shadow-md"}`}
                                                        >
                                                            Add to the waiting list
                                                        </button>
                                                    )}

                                                    {(!profile.freezeBooking && (status === "active" || (status === "request_to_cancel" && canCancelTrial)) && !(profile?.paymentPlan?.duration === 1 && profile?.paymentPlan?.interval === "Month")) ? (
                                                        <button
                                                            onClick={() => setFreezeMembership(true)}
                                                            className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                                        >
                                                            Freeze Membership
                                                        </button>
                                                    ) : profile.freezeBooking ? (
                                                        <button
                                                            onClick={() => setReactivateMembership(true)}
                                                            className="w-full bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:bg-blue-700 hover:shadow-md transition-shadow duration-300"
                                                        >
                                                            Reactivate Membership
                                                        </button>
                                                    ) : null}

                                                    {(status === "active" || (status === "request_to_cancel" && canCancelTrial)) && (
                                                        <button
                                                            onClick={() => setTransferVenue(true)}
                                                            className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                                        >
                                                            Transfer Class
                                                        </button>
                                                    )}

                                                    {status === 'waiting list' && canCancelTrial && (
                                                        <button
                                                            onClick={() => setRemoveWaiting(true)}
                                                            className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                                        >
                                                            Remove Waiting List
                                                        </button>
                                                    )}

                                                    {(status === 'active' || status === 'frozen' || status === "request_to_cancel") && canCancelTrial && (
                                                        <button
                                                            onClick={() => setshowCancelTrial(true)}
                                                            className={`w-full border text-[18px] rounded-xl py-3 font-medium transition-shadow duration-300
                                                                ${showCancelTrial ? "bg-[#FF6C6C] text-white shadow-md border-transparent" : "border-gray-300 text-[#717073] hover:bg-[#FF6C6C] hover:text-white hover:shadow-md"}`}
                                                        >
                                                            Cancel Membership
                                                        </button>
                                                    )}

                                                    {!profile?.paymentPlan && profile?.classSchedule?.capacity !== 0 && status !== 'active' && status !== "request_to_cancel" && (
                                                        <button
                                                            onClick={handleBookMembership}
                                                            className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                                        >
                                                            Book a Membership
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {/* Birthday party / one-to-one — simple cancel only */}
                                            {(isBirthdayParty || isOneToOne) && canCancelTrial && (
                                                <button
                                                    onClick={() => setshowCancelTrial(true)}
                                                    className={`w-full border text-[18px] rounded-xl py-3 font-medium transition-shadow duration-300
                                                        ${showCancelTrial ? "bg-[#FF6C6C] text-white shadow-md border-transparent" : "border-gray-300 text-[#717073] hover:bg-[#FF6C6C] hover:text-white hover:shadow-md"}`}
                                                >
                                                    Cancel Booking
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {status === 'cancelled' && (
                                        <div className="bg-white rounded-3xl p-6 space-y-4 mt-4">
                                            <div className="flex gap-7">
                                                <button
                                                    className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center hover:shadow-md transition-shadow duration-300 gap-2 text-[#717073] font-medium"
                                                    onClick={() => {
                                                        const parentEmails = parents.map(p => p.parentEmail).filter(Boolean);
                                                        openEmailPopup(parentEmails, "/api/admin/send-manual-email", { token, showError, showSuccess });
                                                    }}
                                                >
                                                    Send Email
                                                </button>
                                                <button
                                                    disabled={textloading}
                                                    onClick={() => sendText([bookingId])}
                                                    className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium"
                                                >
                                                    <img src="/images/icons/sendText.png" alt="" />
                                                    {textloading ? <Loader2 className="animate-spin w-5 h-5 text-blue-500" /> : "Send Text"}
                                                </button>
                                            </div>

                                            {isMembership && (
                                                <>
                                                    {classSchedule?.capacity > 0 && canRebooking && (
                                                        <button
                                                            onClick={() => setReactivateMembership(true)}
                                                            className="w-full bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:bg-blue-700 hover:shadow-md transition-shadow duration-300"
                                                        >
                                                            Reactivate Membership
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setaddToWaitingList(true)}
                                                        className={`w-full rounded-xl py-3 text-[18px] font-medium transition-shadow duration-300 
                                                            ${addToWaitingList ? "bg-[#237FEA] text-white shadow-md" : "bg-white border border-gray-300 hover:bg-blue-700 text-[#717073] hover:text-white hover:shadow-md"}`}
                                                    >
                                                        Add to the waiting list
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                }
                {addToWaitingList && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setaddToWaitingList(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Add to Waiting List Form</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Select Student */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Select Student</label>
                                    <Select
                                        value={waitingListData.selectedStudents}
                                        onChange={handleWaitingListStudentSelect}
                                        options={studentsList?.map((student) => ({
                                            value: student.id,
                                            label: student.studentFirstName + " " + student.studentLastName,
                                            classSchedule: student.classSchedule
                                        })) || []}
                                        placeholder="Select Student"
                                        isMulti
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
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

                                {/* Per-Student Configuration */}
                                {waitingListData.selectedStudents.length > 0 && (
                                    <div className="space-y-6 border-t pt-4">
                                        {waitingListData.selectedStudents.map((studentOption) => {
                                            const studentId = studentOption.value;
                                            const config = waitingListData.studentConfigs?.[studentId] || {};
                                            const currentClass = studentOption.classSchedule?.className || "-";
                                            const currentVenue = studentOption.classSchedule?.venue?.name || "-";

                                            return (
                                                <div key={studentId} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                                                    <h3 className="font-semibold capitalize text-lg text-gray-800 pb-2">
                                                        {studentOption.label}
                                                    </h3>

                                                    {/* Current Info */}
                                                    <div className="grid gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Current Class</label>
                                                            <input
                                                                type="text"
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                                                                value={currentClass}
                                                                readOnly
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Venue</label>
                                                            <input
                                                                type="text"
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                                                                value={profile?.venue?.name}
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Select New Class */}
                                                    <div>
                                                        <label className="block text-[16px] font-semibold">Select New Class</label>
                                                        <Select
                                                            value={
                                                                config.classScheduleId
                                                                    ? newClassesForWaitingList.find((cls) => cls.value === config.classScheduleId) || null
                                                                    : null
                                                            }
                                                            onChange={(selected) => handleWaitingListConfigChange(studentId, "classScheduleId", selected?.value)}
                                                            options={newClassesForWaitingList}
                                                            placeholder="Select Class"
                                                            className="rounded-lg mt-2"
                                                            styles={{
                                                                control: (base) => ({
                                                                    ...base,
                                                                    borderRadius: "0.7rem",
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
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Preferred Date */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Preferred Start Date (Optional)</label>
                                    <DatePicker
                                        minDate={addDays(new Date(), 1)} // disables today and all past dates
                                        selected={waitingListData.startDate ? new Date(waitingListData.startDate) : null}
                                        onChange={(date) => handleDateChange(date, "startDate", setWaitingListData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        withPortal
                                    />

                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Notes (Optional)</label>
                                    <textarea
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        name="notes"

                                        value={waitingListData.notes}
                                        onChange={(e) => handleInputChange(e, setWaitingListData)}
                                    />

                                </div>

                                {/* Button */}
                                <div className="justify-end flex gap-4 pt-4">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={waitingListData.selectedStudents.length === 0}
                                        onClick={() => {
                                            // Validation: at least one student
                                            if (waitingListData.selectedStudents.length === 0) {
                                                showWarning("Missing Information", "Please select at least one student.");
                                                return;
                                            }

                                            // Construct Payload
                                            const studentsPayload = waitingListData.selectedStudents.map(studentOption => {
                                                const config = waitingListData.studentConfigs?.[studentOption.value] || {};
                                                return {
                                                    studentId: studentOption.value,
                                                    classScheduleId: config.classScheduleId
                                                };
                                            });

                                            // Validation: all students must have a class
                                            const incomplete = studentsPayload.some(s => !s.classScheduleId);
                                            if (incomplete) {
                                                showWarning("Missing Information", "Please select a new class for all selected students.");
                                                return;
                                            }

                                            const payload = {
                                                bookingId: waitingListData.bookingId,
                                                additionalNote: waitingListData.notes,
                                                startDate: waitingListData.startDate,
                                                students: studentsPayload
                                            };

                                            setaddToWaitingList(false);
                                            addtoWaitingListSubmit(payload, "allMembers");
                                        }}
                                    >
                                        Join Waiting List
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )}
                {reactivateMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setReactivateMembership(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Reactivate Membership</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Reactivate On */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Reactivate On</label>
                                    <DatePicker
                                        minDate={addDays(new Date(), 1)} // disable today & past dates
                                        selected={
                                            reactivateData?.reactivateOn
                                                ? new Date(reactivateData.reactivateOn)
                                                : null
                                        }
                                        onChange={(date) => handleDateChange(date, "reactivateOn", setReactivateData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        withPortal
                                    />
                                </div>

                                {/* Confirm Class */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Confirm Class</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={classInfo || "-"}
                                        readOnly
                                    />
                                </div>

                                <div className="w-full max-w-xl mx-auto">
                                    <button
                                        type="button"
                                        disabled={!paymentPlan}
                                        onClick={() => setIsOpen(!isOpen)}
                                        className={`bg-[#237FEA] text-white text-[18px]  font-semibold border w-full border-[#237FEA] px-6 py-3 rounded-lg flex items-center justify-center  ${paymentPlan
                                            ? "bg-[#237FEA] border border-[#237FEA]"
                                            : "bg-gray-400 border-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        Review Membership Plan

                                        <img
                                            src={isOpen ? "/images/icons/whiteArrowDown.png" : "/images/icons/whiteArrowUp.png"}
                                            alt={isOpen ? "Collapse" : "Expand"}
                                            className="ml-2 inline-block"
                                        />

                                    </button>

                                    {isOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-white mt-4 rounded-2xl shadow-lg p-6   font-semibold  space-y-4 text-[16px]"
                                        >
                                            <div className="flex justify-between text-[#333]">
                                                <span>Membership Plan</span>
                                                <span>
                                                    {paymentPlan?.duration} {paymentPlan?.interval}
                                                    {paymentPlan?.duration > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[#333]">
                                                <span>Monthly Subscription Fee</span>
                                                <span>£{paymentPlan?.price} p/m</span>
                                            </div>
                                            <div className="flex justify-between text-[#333]">
                                                <span>Price per class per child</span>
                                                <span>£{paymentPlan?.price}</span>
                                            </div>

                                        </motion.div>
                                    )}
                                </div>
                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Additional Notes (Optional)</label>
                                    <textarea
                                        name="additionalNote"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        value={reactivateData.additionalNote}
                                        onChange={(e) => handleInputChange(e, setReactivateData)}
                                    />
                                </div>

                                {/* Button */}
                                <div className="flex gap-4 pt-4 justify-end ">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => {
                                            if (!reactivateData?.reactivateOn) {
                                                showWarning("Validation Error", "Please select a reactivation date first.");
                                                return;
                                            }

                                            // ✅ Proceed if valid
                                            reactivateDataSubmit(reactivateData, "allMembers");
                                        }}
                                    >
                                        Reactivate Membership
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {showCancelTrial && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setshowCancelTrial(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Cancel Membership </h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Cancellation Type
                                    </label>

                                    {cancelType.map((option) => (
                                        <label key={option.value} className="flex mt-4  items-center mb-2 cursor-pointer">
                                            <label className="flex items-center cursor-pointer space-x-2">
                                                <input
                                                    type="radio"
                                                    name="cancelType"
                                                    value={option.value}
                                                    checked={cancelData.cancellationType === option.value}
                                                    onChange={() => handleRadioChange(option.value, "cancellationType", setCancelData)}
                                                    className="hidden peer"
                                                />
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 peer-checked:bg-blue-500 peer-checked:border-blue-500">
                                                    {/* Tick icon */}
                                                    <svg
                                                        className=" w-3 h-3 text-white peer-checked:block"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                                <span className="text-gray-800 text-[16px]">{option.label}</span>
                                            </label>

                                        </label>
                                    ))}

                                </div>
                                {cancelData.cancellationType !== 'immediate' && (
                                    <>
                                        <div>

                                            <label className="block text-[16px] font-semibold">Cancellation Effective Date</label>
                                            <DatePicker
                                                minDate={addDays(new Date(), 1)} // disables today and all past dates
                                                dateFormat="EEEE, dd MMMM yyyy"
                                                selected={cancelData.cancelDate ? new Date(cancelData.cancelDate) : null}
                                                onChange={(date) => handleDateChange(date, "cancelDate", setCancelData)}
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                withPortal
                                            />

                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Cancellation
                                    </label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === cancelData.cancelReason)}
                                        onChange={(selected) => handleSelectChange(selected, "cancelReason", setCancelData)}
                                        options={reasonOptions}
                                        placeholder=""
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
                                                boxShadow: "none",
                                                padding: "6px 8px",
                                                minHeight: "48px",
                                            }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                    {cancelData.cancelReason === "other" && (
                                        <input
                                            type="text"
                                            placeholder="Enter your reason"
                                            value={cancelData.otherReason}
                                            onChange={(e) =>
                                                setCancelData((prev) => ({
                                                    ...prev,
                                                    otherReason: e.target.value,
                                                }))
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-3"
                                        />
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-100  mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={3}
                                        name="additionalNote"    // <-- MUST match state key
                                        value={cancelData.additionalNote}
                                        onChange={(e) => handleInputChange(e, setCancelData)}
                                        placeholder=""
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            // Validation: cancellation type
                                            if (!cancelData.cancellationType) {
                                                showWarning("Validation Error", "Please select a cancellation type.");

                                                return;
                                            }

                                            // Validation: cancel date (only if not immediate)
                                            if (cancelData.cancellationType !== "immediate" && !cancelData.cancelDate) {
                                                showWarning("Validation Error", "Please select a cancellation effective date.");

                                                return;
                                            }

                                            // Validation: reason
                                            if (!cancelData.cancelReason) {
                                                showWarning("Validation Error", "Please select a reason for cancellation.");

                                                return;
                                            }

                                            // ✅ All validations passed → close modal immediately

                                            setshowCancelTrial(false)
                                            // 🔥 Then call API (don’t wait for response)
                                            cancelMembershipSubmit(cancelData, "allMembers");
                                        }}
                                        className="w-1/2 bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                    >
                                        {cancelData.cancellationType !== "immediate"
                                            ? "Request to Cancel"
                                            : "Cancel Membership"}
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>

                )}
                {removeWaiting && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setRemoveWaiting(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Cancel Waiting List Spot </h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Cancellation
                                    </label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === cancelWaitingList.cancelReason)}
                                        onChange={(selected) => handleSelectChange(selected, "removedReason", setCancelWaitingList)}
                                        options={reasonOptions}
                                        placeholder=""
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
                                                boxShadow: "none",
                                                padding: "6px 8px",
                                                minHeight: "48px",
                                            }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-100  mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        name="removedNotes"    // <-- MUST match state key
                                        value={cancelWaitingList.removedNotes}
                                        onChange={(e) => handleInputChange(e, setCancelWaitingList)}
                                        placeholder=""
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={() => cancelWaitingListSpot(cancelWaitingList, 'allMembers')}

                                        className="w-1/2  bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )}
                {transferVenue && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setTransferVenue(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Transfer Class Form</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Current Class */}

                                <div>


                                    <label className="block text-[16px] font-semibold">
                                        Select Student
                                    </label>

                                    <Select
                                        value={transferData.selectedStudents}
                                        onChange={handleStudentSelectChange}
                                        options={studentsList?.map((student) => ({
                                            value: student.id,
                                            label: student.studentFirstName + " " + student.studentLastName,
                                            classSchedule: student.classSchedule
                                        })) || []}
                                        placeholder="Select Student"
                                        isMulti
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
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
                                {/* Per-Student Configuration */}
                                {transferData.selectedStudents.length > 0 && (
                                    <div className="space-y-6 border-t pt-4">
                                        {transferData.selectedStudents.map((studentOption) => {
                                            const studentId = studentOption.value;
                                            const studentConfig = transferData.studentTransfers?.[studentId] || {};
                                            const currentClass = studentOption.classSchedule?.className || "-";
                                            const currentVenue = studentOption.classSchedule?.venue?.name || "-";

                                            return (
                                                <div key={studentId} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                                                    <h3 className="font-semibold capitalize text-lg text-gray-800  pb-2">
                                                        {studentOption.label}
                                                    </h3>

                                                    {/* Current Info */}
                                                    {/* Current Info */}
                                                    <div className="grid gap-4 text-sm text-gray-600">

                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Venue</label>
                                                            <input
                                                                type="text"
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                                                                value={profile?.venue?.name}
                                                                readOnly
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Current Class</label>
                                                            <input
                                                                type="text"
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                                                                value={currentClass}
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* New Class Select */}
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-1">New Class</label>
                                                        <Select
                                                            value={
                                                                studentConfig.classScheduleId
                                                                    ? newClasses.find((cls) => cls.value === studentConfig.classScheduleId) || null
                                                                    : null
                                                            }
                                                            onChange={(selected) =>
                                                                handleTransferConfigChange(studentId, "classScheduleId", selected?.value)
                                                            }
                                                            options={newClasses}
                                                            placeholder="Select New Class"
                                                            className="rounded-lg"
                                                            styles={{
                                                                control: (base) => ({
                                                                    ...base,
                                                                    borderRadius: "0.5rem",
                                                                    minHeight: "40px",
                                                                }),
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Reason */}
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-1">Reason (Optional)</label>
                                                        <textarea
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                            rows={2}
                                                            placeholder="Reason for transfer"
                                                            value={studentConfig.transferReasonClass || ""}
                                                            onChange={(e) => handleTransferConfigChange(studentId, "transferReasonClass", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}



                                {/* Buttons */}
                                <div className="flex gap-4 pt-4 justify-end">


                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={transferData.selectedStudents.length === 0}
                                        onClick={() => {
                                            if (!transferData.selectedStudents.length) {
                                                showWarning("Missing Information", "Please select at least one student.");
                                                return;
                                            }


                                            // Construct Payload
                                            const transfers = transferData.selectedStudents.map(studentOption => {
                                                const config = transferData.studentTransfers?.[studentOption.value] || {};
                                                return {
                                                    studentId: studentOption.value,
                                                    classScheduleId: config.classScheduleId,
                                                    transferReasonClass: config.transferReasonClass
                                                };
                                            });

                                            // Validation: Check if any student is missing a class selection
                                            const incomplete = transfers.some(t => !t.classScheduleId);
                                            if (incomplete) {
                                                showWarning("Missing Information", "Please select a new class for all selected students.");
                                                return;
                                            }

                                            const payload = {
                                                bookingId: profile?.bookingId,
                                                transfers: transfers
                                            };

                                            transferMembershipSubmit(payload, 'allMembers');
                                        }}
                                    >
                                        Submit Transfer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {freezeMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setFreezeMembership(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Freeze Membership Form</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Freeze Start Date */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Freeze Start Date</label>
                                    <DatePicker
                                        minDate={addDays(new Date(), 1)} // disables today and all past dates
                                        selected={freezeData.freezeStartDate ? new Date(freezeData.freezeStartDate) : null}
                                        onChange={(date) => handleDateChange(date, "freezeStartDate", setFreezeData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        withPortal
                                    />
                                </div>

                                <div>
                                    <label className="block text-[16px] font-semibold">Freeze Duration (Months)</label>
                                    <Select
                                        value={monthOptions.find((opt) => opt.value === freezeData.freezeDurationMonths) || null}
                                        onChange={(selected) => handleSelectChange(selected, "freezeDurationMonths", setFreezeData)}
                                        options={monthOptions}
                                        placeholder="Select Duration"
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
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

                                {/* Reactivate On */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Reactivate On</label>
                                    <DatePicker
                                        minDate={addDays(new Date(), 1)} // disables today and all past dates
                                        selected={freezeData.reactivateOn ? new Date(freezeData.reactivateOn) : null}
                                        onChange={(date) => handleDateChange(date, "reactivateOn", setFreezeData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        withPortal
                                    />
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Freezing (Optional)
                                    </label>
                                    <textarea
                                        name="reasonForFreezing"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        value={freezeData.reasonForFreezing}
                                        onChange={(e) => handleInputChange(e, setFreezeData)}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex w-full justify-end gap-4 pt-4">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => {
                                            if (!freezeData.freezeStartDate || !freezeData.freezeDurationMonths || !freezeData.reactivateOn) {
                                                showWarning("Incomplete Form", "Please fill in all the required fields before submitting.");
                                                return;
                                            }
                                            setFreezeMembership(false)
                                            // ✅ Submit when all fields are filled
                                            freezerMembershipSubmit(freezeData, "allMembers");
                                        }}

                                    >
                                        Freeze Membership
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </div >
        </>
    );
};

export default ParentProfile;



//    {emergencyContacts.map((emergency, index) => (
//                         <div key={index} className="bg-white p-6 rounded-3xl shadow-sm space-y-6">
//                                 <div className="flex justify-between items-start">
//                                     <h2 className="text-[20px] font-semibold">Emergency contact details</h2>
//                                     <button
//                                         onClick={() => toggleEditEmergency(index)}
//                                         className="text-gray-600 hover:text-blue-600"
//                                     >
//                                         {editingEmergency === index ? <FaSave /> : <FaEdit />}
//                                     </button>
//                                 </div>

//                                 <div className="flex items-center gap-2">
//                                     <input type="checkbox" checked={emergency.sameAsAbove} readOnly disabled />
//                                     <label className="text-base font-semibold text-gray-700">
//                                         Fill same as above
//                                     </label>
//                                 </div>

//                                 {/* First / Last Name */}
//                                 <div className="flex gap-4">
//                                     <div className="w-1/2">
//                                         <label className="block text-[16px] font-semibold">First name</label>
//                                         <input
//                                             className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
//                                             value={emergency.emergencyFirstName}
//                                             readOnly={editingEmergency !== index}
//                                             onChange={(e) =>
//                                                 handleEmergencyChange(index, "emergencyFirstName", e.target.value)
//                                             }
//                                         />
//                                     </div>
//                                     <div className="w-1/2">
//                                         <label className="block text-[16px] font-semibold">Last name</label>
//                                         <input
//                                             className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
//                                             value={emergency.emergencyLastName}
//                                             readOnly={editingEmergency !== index}
//                                             onChange={(e) =>
//                                                 handleEmergencyChange(index, "emergencyLastName", e.target.value)
//                                             }
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Phone / Relation */}
//                                 <div className="flex gap-4">
//                                     <div className="w-1/2">
//                                         <label className="block text-[16px] font-semibold">Phone number</label>
//                                         <input
//                                             className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
//                                             value={emergency.emergencyPhoneNumber}
//                                             readOnly={editingEmergency !== index}
//                                             onChange={(e) =>
//                                                 handleEmergencyChange(index, "emergencyPhoneNumber", e.target.value)
//                                             }
//                                         />
//                                     </div>
//                                     <div className="w-1/2">
//                                         <label className="block text-[16px] font-semibold">Relation to child</label>
//                                         <input
//                                             className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
//                                             value={emergency.emergencyRelation}
//                                             readOnly={editingEmergency !== index}
//                                             onChange={(e) =>
//                                                 handleEmergencyChange(index, "emergencyRelation", e.target.value)
//                                             }
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}