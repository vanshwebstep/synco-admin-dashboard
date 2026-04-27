// src/components/profile.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { motion } from "framer-motion";
import { X, Loader2, Mail, MessageSquare } from "lucide-react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useBookFreeTrial } from '../../contexts/BookAFreeTrialContext';
import Loader from '../../contexts/Loader';
import { usePermission } from '../../Common/permission';
import { addDays } from "date-fns";
import { FaEdit, FaSave } from "react-icons/fa";
import { useNotification } from '../../contexts/NotificationContext';
import { showSuccess, showError, showConfirm, showWarning } from '../../../../../utils/swalHelper';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import Comments from '../../Common/Comments';
import { useEmail } from '../../contexts/messages/SendEmailContext';
import { useAccountsInfo } from '../../contexts/AccountsInfoContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Normalize profile data so the component works for all service types:
//   - membership  (original shape)
//   - birthday party
//   - one to one
// ─────────────────────────────────────────────────────────────────────────────
const normalizeProfile = (profile) => {
    const booking = profile?.booking || profile;
    const serviceType = booking?.serviceType || profile?.serviceType || "weekly class membership";

    // ── Parents ──────────────────────────────────────────────────────────────
    // Membership : profile.parents  → { parentFirstName, parentLastName, parentEmail, parentPhoneNumber, ... }
    // Birthday / One-to-one: booking.parents → { parentFirstName, parentLastName, parentEmail, phoneNumber, relationChild, howDidHear }
    let parents = [];
    if (profile?.parents?.length) {
        // Already in membership shape
        parents = profile.parents;
    } else if (booking?.parents?.length) {
        parents = booking.parents.map((p) => ({
            id: p.id,
            parentFirstName: p.parentFirstName,
            parentLastName: p.parentLastName,
            parentEmail: p.parentEmail,
            parentPhoneNumber: p.phoneNumber || p.parentPhoneNumber || "",
            relationToChild: p.relationChild || p.relationToChild || "",
            howDidYouHear: p.howDidHear || p.howDidYouHear || "",
            interestReason: p.interestReason || "",
            interestReasonOther: p.interestReasonOther || "",
        }));
    }

    // ── Students ─────────────────────────────────────────────────────────────
    // Membership : profile.students (with classSchedule per student)
    // Birthday / One-to-one: booking.students (no classSchedule)
    const students = profile?.students?.length
        ? profile.students
        : booking?.students?.length
            ? booking.students.map((s) => ({
                id: s.id,
                studentFirstName: s.studentFirstName,
                studentLastName: s.studentLastName,
                dateOfBirth: s.dateOfBirth,
                age: s.age,
                gender: s.gender,
                medicalInformation: s.medicalInfo || s.medicalInformation || "",
                classSchedule: null,
                studentStatus: s.attendance || "active",
            }))
            : [];

    // ── Emergency ────────────────────────────────────────────────────────────
    // Membership : profile.emergency  (array)
    // Birthday / One-to-one: booking.emergency (single object)
    let emergency = [];
    if (Array.isArray(profile?.emergency)) {
        emergency = profile.emergency;
    } else if (profile?.emergency) {
        emergency = [profile.emergency];
    } else if (booking?.emergency) {
        const e = booking.emergency;
        emergency = [{
            id: e.id,
            emergencyFirstName: e.emergencyFirstName,
            emergencyLastName: e.emergencyLastName,
            emergencyPhoneNumber: e.emergencyPhoneNumber,
            emergencyRelation: e.emergencyRelation,
        }];
    }

    // ── Payment Plan ─────────────────────────────────────────────────────────
    const paymentPlan = profile?.paymentPlan || booking?.paymentPlan || null;

    // ── Booking / venue info ─────────────────────────────────────────────────
    const bookingId = profile?.bookingId || booking?.id || null;
    const venue = profile?.venue || null;
    const classSchedule = profile?.classSchedule || null;
    const status = profile?.status || "active";

    // ── Booked by ────────────────────────────────────────────────────────────
    const bookedBy = profile?.bookedByAdmin || profile?.bookedBy || booking?.coach || null;

    // ── Service-specific extra fields ────────────────────────────────────────
    const extra = {};
    if (serviceType === "birthday party") {
        extra.partyDate = booking?.date;
        extra.address = booking?.address;
        extra.capacity = booking?.capacity;
        extra.time = booking?.time;
    } else if (serviceType === "one to one") {
        extra.sessionDate = booking?.date;
        extra.sessionTime = booking?.time;
        extra.address = booking?.address;
        extra.location = booking?.location;
        extra.areaWorkOn = booking?.areaWorkOn;
        extra.totalStudents = booking?.totalStudents;
    }

    return {
        ...profile,          // keep originals so contexts still work
        _serviceType: serviceType,
        _normalized: true,
        parents,
        students,
        emergency,
        paymentPlan,
        bookingId,
        venue,
        classSchedule,
        status,
        bookedBy,
        _extra: extra,
        // payment from booking if not at root
        payments: profile?.payments || (booking?.payment ? [{ ...booking.payment, paymentStatus: booking.payment.paymentStatus === "paid" ? "success" : booking.payment.paymentStatus }] : []),
    };
};

const ParentProfile = ({ profile: rawProfile }) => {
    // Normalize once
    const profile = React.useMemo(() => normalizeProfile(rawProfile), [rawProfile]);
    const { sendBirthdayMail, fetchBirthdyPartiesMembers, fetchOneToOneMembers } = useAccountsInfo();


    const navigate = useNavigate();
    const { serviceHistoryMembership } = useBookFreeTrial();
    const { openEmailPopup } = useEmail();
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [textloading, setTextLoading] = useState(null);


    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const {
        loading,
        addtoWaitingListSubmit, cancelMembershipSubmit,
        sendBookMembershipMail, transferMembershipSubmit,
        addToWaitingList, setaddToWaitingList,
        freezerMembershipSubmit, reactivateDataSubmit, cancelWaitingListSpot, updateBookMembershipFamily, removeWaiting, setRemoveWaiting, showCancelTrial, setshowCancelTrial
    } = useBookFreeTrial() || {};
    const [loadingData, setLoadingData] = useState(false);
    const [birthdayLoading, setBirthdayLoading] = useState(false);
    const classSchedule = profile?.classSchedule;
    const bookingId = profile?.bookingId;
    const id = profile?.id;
    const paymentPlans = profile?.paymentPlans;
    const serviceType = profile?.serviceType || "weekly class membership";
    const isMembership = serviceType === "weekly class membership";
    const isHolidayCamp = serviceType === "holiday camp";
    const isTrials = serviceType === "weekly class trial";
    const isBirthdayParty = profile?.booking?.serviceType === "birthday party";
    const isOneToOne = profile?.booking?.serviceType === "one to one";

    const [editingIndex, setEditingIndex] = useState(null);
    const [commentsList, setCommentsList] = useState([]);
    const [loadingComment, setLoadingComment] = useState(false);
    const [comment, setComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 5;

    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
    const totalPages = Math.ceil(commentsList.length / commentsPerPage);
    const { adminInfo, setAdminInfo } = useNotification();
    const token = localStorage.getItem("adminToken");

    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };

    const studentsList = profile?.students || [];
    const bookedBy = profile?.bookedBy;
    const [dialCode2, setDialCode2] = useState("+44");
    const [country2, setCountry2] = useState("gb");
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
        ? profile.payments[0]
        : profile?.payments;
    const ID = profile?.bookedId || firstPayment?.pan;

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
        return past.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };
    const stripDialCode = (phoneNumber) => {
        if (!phoneNumber) return "";

        // Longest match pehle try karo
        for (const { dialCode } of DIAL_CODES) {
            if (phoneNumber.startsWith(dialCode)) {
                return phoneNumber.slice(dialCode.length).trim();
            }
        }

        // Fallback: agar koi match nahi + ke baad digits hain
        const match = phoneNumber.match(/^\+\d{1,4}/);
        if (match) return phoneNumber.slice(match[0].length).trim();

        return phoneNumber;
    };
    const matchDialCode = (phone) => {
        if (!phone) return null;
        for (const entry of DIAL_CODES) {
            if (phone.startsWith(entry.dialCode)) {
                return entry;
            }
        }
        return null;
    };
    const fetchComments = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/list`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            const resultRaw = await response.json();
            setCommentsList(resultRaw.data || []);
        } catch (error) {
            showError("Error", error.message || "Failed to fetch comments.");
        }
    }, []);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${token}`);
        try {
            setLoadingComment(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/create`, {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify({ comment }),
                redirect: "follow",
            });
            const result = await response.json();
            if (!response.ok) { showError("Failed to Add Comment", result.message || "Something went wrong."); return; }
            setComment('');
            fetchComments();
        } catch (error) {
            showError("Network Error", error.message || "An error occurred.");
        } finally {
            setLoadingComment(false);
        }
    };
    const handleCancelBirthdayPackage = () => {
        showConfirm("Are you sure?", "This package will be cancelled. This action cannot be undone.", "warning").then((result) => {
            if (!result.isConfirmed) return;

            const token = localStorage.getItem("adminToken");
            if (!token) {
                showError("Admin token not found. Please login again.");
                return;
            }

            setBirthdayLoading(true);
            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);

            fetch(`${API_BASE_URL}/api/admin/birthday-party/cancel/${id}`, {
                method: "PUT",
                headers: myHeaders,
                redirect: "follow",
            })
                .then(async (response) => {
                    const result = await response.json();

                    if (!response.ok) {
                        showError(result.message || "Something went wrong.");
                        return;
                    }

                    showSuccess(result.message || "Package cancelled successfully!");
                    fetchPackageDetails();
                })
                .catch((error) => {
                    console.error("Error cancelling package:", error);
                    showError(error.message || "An error occurred while cancelling the package.");
                });
        });

    };
    const handleRenewBirthdayPackage = () => {
        showConfirm("Are you sure?", "This package will be renewed for the user.", "question").then((result) => {
            if (!result.isConfirmed) return;

            const token = localStorage.getItem("adminToken");
            if (!token) {
                showError("Admin token not found. Please login again.");
                return;
            }

            setBirthdayLoading(true);
            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);

            fetch(`${API_BASE_URL}/api/admin/birthday-party/renew/${id}`, {
                method: "PUT",
                headers: myHeaders,
                redirect: "follow",
            })
                .then(async (response) => {
                    const result = await response.json();

                    if (!response.ok) {
                        showError(result.message || "Something went wrong.");
                        return;
                    }

                    showSuccess(result.message || "Package renewed successfully!");
                    fetchPackageDetails();
                })
                .catch((error) => {
                    console.error("Error renewing package:", error);
                    showError(error.message || "An error occurred while renewing the package.");
                });
        });

    };
    const handleCancelPackage = async () => {
        const result = await showConfirm(
            "Cancel this package?",
            "This will cancel the selected package for the user."
        );

        if (!result?.isConfirmed) return;

        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Admin token not found. Please login again.");
            return;
        }

        try {
            setLoadingData(true);

            const response = await fetch(
                `${API_BASE_URL}/api/admin/one-to-one/cancel/${id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Something went wrong");
            }

            showSuccess(data?.message || "Package cancelled successfully.");

            // refresh data
            fetchOneToOneMembers(id);
            // router.refresh();

        } catch (error) {
            showError(error?.message || "Unable to cancel the package.");
        } finally {
            setLoadingData(false);
        }
    };

    const handleRenewPackage = () => {
        showConfirm("Renew this package?", "This will renew the selected package for the user.").then((result) => {

            if (!result.isConfirmed) return;

            const token = localStorage.getItem("adminToken");
            if (!token) {
                showError("Admin token not found. Please login again.");
                return;
            }

            setLoadingData(true);

            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);

            fetch(`${API_BASE_URL}/api/admin/one-to-one/renew/${id}`, {
                method: "PUT",
                headers: myHeaders,
                redirect: "follow",
            })
                .then(async (response) => {
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data?.message || "Something went wrong");
                    }

                    showSuccess(data?.message || "Package renewed successfully.");

                    // Optional refresh
                    fetchOneToOneMembers(id);
                })
                .catch((error) => {
                    showError(error.message || "Unable to renew the package.");
                });
        });
    };

    const [rebookFreeTrial, setRebookFreeTrial] = useState({
        bookingId: id || null, trialDate: "", reasonForNonAttendance: "", additionalNote: "",
    });
    const [formData, setFormData] = useState({ bookingId, cancelReason: "", additionalNote: "" });
    const [emergencyContacts, setEmergencyContacts] = useState(profile.emergency || []);
    const [editingEmergency, setEditingEmergency] = useState(null);

    const { checkPermission } = usePermission();
    const failedPayments = profile.payments?.filter((p) => p.paymentStatus !== "success") || [];
    const canCancelTrial = checkPermission({ module: 'cancel-free-trial', action: 'create' });
    const canRebooking = checkPermission({ module: 'rebooking', action: 'create' });

    const [waitingListData, setWaitingListData] = useState({
        bookingId,
        venueId: classSchedule?.venue?.id || null,
        startDate: null,
        notes: "",
        selectedStudents: [],
        studentConfigs: {},
    });

    const handleWaitingListConfigChange = (studentId, field, value) => {
        setWaitingListData(prev => ({
            ...prev,
            studentConfigs: { ...prev.studentConfigs, [studentId]: { ...prev.studentConfigs?.[studentId], [field]: value } }
        }));
    };

    const handleWaitingListStudentSelect = (selectedOptions) => {
        setWaitingListData((prev) => {
            const newConfigs = { ...prev.studentConfigs };
            selectedOptions?.forEach(opt => { if (!newConfigs[opt.value]) newConfigs[opt.value] = { classScheduleId: null }; });
            return { ...prev, selectedStudents: selectedOptions || [], studentConfigs: newConfigs };
        });
    };

    const [cancelData, setCancelData] = useState({
        bookingId, cancellationType: "immediate", cancelReason: "", cancelDate: null, additionalNote: "",
    });
    const [cancelWaitingList, setCancelWaitingList] = useState({ bookingId, removedReason: "", removedNotes: "" });
    const [transferData, setTransferData] = useState({
        bookingId: bookingId || null,
        venueId: classSchedule?.venue?.id || null,
        transferReasonClass: "",
        classScheduleId: null,
        selectedStudents: [],
        studentTransfers: {},
    });

    const handleTransferConfigChange = (studentId, field, value) => {
        setTransferData(prev => ({
            ...prev,
            studentTransfers: { ...prev.studentTransfers, [studentId]: { ...prev.studentTransfers[studentId], [field]: value } }
        }));
    };

    const [freezeData, setFreezeData] = useState({
        bookingId: bookingId || null, freezeStartDate: null, freezeDurationMonths: null, reactivateOn: null, reasonForFreezing: "",
    });
    const [reactivateData, setReactivateData] = useState({ bookingId: bookingId || null, reactivateOn: null, additionalNote: "" });

    const handleInputChange = (e, stateSetter) => {
        const { name, value } = e.target;
        stateSetter((prev) => ({ ...prev, [name]: value }));
    };
    const handleSelectChange = (selected, field, stateSetter) => {
        stateSetter((prev) => ({ ...prev, [field]: selected?.value || null }));
    };
    const [parents, setParents] = useState(profile?.parents || []);

    const handleDateChange = (date, field, stateSetter) => {
        if (!date) { stateSetter((prev) => ({ ...prev, [field]: null })); return; }
        const formatted = date.toLocaleDateString("en-CA");
        stateSetter((prev) => ({ ...prev, [field]: formatted }));
    };

    const handleRadioChange = (value, field, stateSetter) => {
        stateSetter((prev) => ({ ...prev, [field]: value }));
    };

    const handleStudentSelectChange = (selectedOptions) => {
        setTransferData((prev) => {
            const newTransfers = { ...prev.studentTransfers };
            selectedOptions?.forEach(opt => { if (!newTransfers[opt.value]) newTransfers[opt.value] = { classScheduleId: null, transferReasonClass: "" }; });
            return { ...prev, selectedStudents: selectedOptions || [], studentTransfers: newTransfers };
        });
    };

    const paymentPlan = profile?.paymentPlan;
    const venueName = profile?.venue?.name;
    const MembershipPlan = paymentPlan?.title;
    const MembershipPrice = paymentPlan?.price;
    const duration = paymentPlan?.duration ?? 0;
    let interval = paymentPlan?.interval ?? "";
    if (duration > 1 && interval) interval += "s";
    const MembershipTenure = profile?.membershipTenure || "";

    const dateBooked = profile?.startDate || profile?._extra?.partyDate || profile?._extra?.sessionDate || profile?.booking?.date;
    const status = profile?.status;

    function formatISODate(isoDateString) {
        if (!isoDateString) return "N/A";
        const date = new Date(isoDateString);
        if (isNaN(date.getTime())) return "N/A";
        const year = date.getFullYear();
        const month = date.toLocaleString("en-US", { month: "short" });
        const day = date.getDate().toString().padStart(2, "0");
        return `${month} ${day} ${year}`;
    }

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

    const totalBars = profile?.progressBar?.totalBars || 0;
    const filledBars = profile?.progressBar?.filledBars || 0;
    console.log('filledBars', filledBars)
    const progressPercent =
        totalBars > 0 ? Math.round((filledBars / totalBars) * 100) : 0;


    const buildFamilyPayload = () =>
        studentsList.map((student, sIndex) => ({
            id: student.id ?? sIndex + 1,
            studentFirstName: student.studentFirstName,
            studentLastName: student.studentLastName,
            dateOfBirth: student.dateOfBirth,
            age: student.age,
            gender: student.gender,
            medicalInformation: student.medicalInformation,
            parents: parents.map((p, pIndex) => ({ id: p.id ?? pIndex + 1, ...p })),
            emergencyContacts: emergencyContacts.map((e, eIndex) => ({ id: e.id ?? eIndex + 1, ...e })),
        }));

    const toggleEditParent = (index) => {
        if (editingIndex === index) {
            const p = parents[index];
            if (!p.parentFirstName?.trim() || !p.parentLastName?.trim() || !p.parentEmail?.trim() || !p.parentPhoneNumber?.trim()) {
                showWarning("Missing fields", "Please fill all required fields before saving.");
                return;
            }
            setEditingIndex(null);
            updateBookMembershipFamily(profile.bookingId, buildFamilyPayload());
        } else {
            setEditingIndex(index);
        }
    };

    const handleStudentSelect = (student) => {
        setSelectedStudents((prev) => {
            const exists = prev.find((s) => s.id === student.id);
            return exists ? prev.filter((s) => s.id !== student.id) : [...prev, student];
        });
    };

    const toggleEditEmergency = (index) => {
        if (editingEmergency === index) {
            setEditingEmergency(null);
            updateBookMembershipFamily(profile.bookingId, buildFamilyPayload());
        } else {
            setEditingEmergency(index);
        }
    };
    const DIAL_CODES = [
        { dialCode: "+1", countryCode: "us" },
        { dialCode: "+7", countryCode: "ru" },
        { dialCode: "+20", countryCode: "eg" },
        { dialCode: "+27", countryCode: "za" },
        { dialCode: "+30", countryCode: "gr" },
        { dialCode: "+31", countryCode: "nl" },
        { dialCode: "+32", countryCode: "be" },
        { dialCode: "+33", countryCode: "fr" },
        { dialCode: "+34", countryCode: "es" },
        { dialCode: "+36", countryCode: "hu" },
        { dialCode: "+39", countryCode: "it" },
        { dialCode: "+40", countryCode: "ro" },
        { dialCode: "+41", countryCode: "ch" },
        { dialCode: "+43", countryCode: "at" },
        { dialCode: "+44", countryCode: "gb" },
        { dialCode: "+45", countryCode: "dk" },
        { dialCode: "+46", countryCode: "se" },
        { dialCode: "+47", countryCode: "no" },
        { dialCode: "+48", countryCode: "pl" },
        { dialCode: "+49", countryCode: "de" },
        { dialCode: "+51", countryCode: "pe" },
        { dialCode: "+52", countryCode: "mx" },
        { dialCode: "+53", countryCode: "cu" },
        { dialCode: "+54", countryCode: "ar" },
        { dialCode: "+55", countryCode: "br" },
        { dialCode: "+56", countryCode: "cl" },
        { dialCode: "+57", countryCode: "co" },
        { dialCode: "+58", countryCode: "ve" },
        { dialCode: "+60", countryCode: "my" },
        { dialCode: "+61", countryCode: "au" },
        { dialCode: "+62", countryCode: "id" },
        { dialCode: "+63", countryCode: "ph" },
        { dialCode: "+64", countryCode: "nz" },
        { dialCode: "+65", countryCode: "sg" },
        { dialCode: "+66", countryCode: "th" },
        { dialCode: "+81", countryCode: "jp" },
        { dialCode: "+82", countryCode: "kr" },
        { dialCode: "+84", countryCode: "vn" },
        { dialCode: "+86", countryCode: "cn" },
        { dialCode: "+90", countryCode: "tr" },
        { dialCode: "+91", countryCode: "in" },
        { dialCode: "+92", countryCode: "pk" },
        { dialCode: "+93", countryCode: "af" },
        { dialCode: "+94", countryCode: "lk" },
        { dialCode: "+95", countryCode: "mm" },
        { dialCode: "+98", countryCode: "ir" },
        { dialCode: "+212", countryCode: "ma" },
        { dialCode: "+213", countryCode: "dz" },
        { dialCode: "+216", countryCode: "tn" },
        { dialCode: "+218", countryCode: "ly" },
        { dialCode: "+220", countryCode: "gm" },
        { dialCode: "+221", countryCode: "sn" },
        { dialCode: "+234", countryCode: "ng" },
        { dialCode: "+254", countryCode: "ke" },
        { dialCode: "+255", countryCode: "tz" },
        { dialCode: "+256", countryCode: "ug" },
        { dialCode: "+260", countryCode: "zm" },
        { dialCode: "+263", countryCode: "zw" },
        { dialCode: "+351", countryCode: "pt" },
        { dialCode: "+352", countryCode: "lu" },
        { dialCode: "+353", countryCode: "ie" },
        { dialCode: "+354", countryCode: "is" },
        { dialCode: "+355", countryCode: "al" },
        { dialCode: "+356", countryCode: "mt" },
        { dialCode: "+358", countryCode: "fi" },
        { dialCode: "+359", countryCode: "bg" },
        { dialCode: "+370", countryCode: "lt" },
        { dialCode: "+371", countryCode: "lv" },
        { dialCode: "+372", countryCode: "ee" },
        { dialCode: "+380", countryCode: "ua" },
        { dialCode: "+381", countryCode: "rs" },
        { dialCode: "+385", countryCode: "hr" },
        { dialCode: "+386", countryCode: "si" },
        { dialCode: "+420", countryCode: "cz" },
        { dialCode: "+421", countryCode: "sk" },
        { dialCode: "+880", countryCode: "bd" },
        { dialCode: "+960", countryCode: "mv" },
        { dialCode: "+961", countryCode: "lb" },
        { dialCode: "+962", countryCode: "jo" },
        { dialCode: "+963", countryCode: "sy" },
        { dialCode: "+964", countryCode: "iq" },
        { dialCode: "+966", countryCode: "sa" },
        { dialCode: "+967", countryCode: "ye" },
        { dialCode: "+968", countryCode: "om" },
        { dialCode: "+971", countryCode: "ae" },
        { dialCode: "+972", countryCode: "il" },
        { dialCode: "+973", countryCode: "bh" },
        { dialCode: "+974", countryCode: "qa" },
        { dialCode: "+975", countryCode: "bt" },
        { dialCode: "+976", countryCode: "mn" },
        { dialCode: "+977", countryCode: "np" },
        { dialCode: "+992", countryCode: "tj" },
        { dialCode: "+993", countryCode: "tm" },
        { dialCode: "+994", countryCode: "az" },
        { dialCode: "+995", countryCode: "ge" },
        { dialCode: "+996", countryCode: "kg" },
        { dialCode: "+998", countryCode: "uz" },
    ].sort((a, b) => b.dialCode.length - a.dialCode.length); // longest first ✅

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
        { value: 1, label: "1 Month" }, { value: 2, label: "2 Months" }, { value: 3, label: "3 Months" },
        { value: 4, label: "4 Months" }, { value: 5, label: "5 Months" }, { value: 6, label: "6 Months" },
        { value: 12, label: "12 Months" },
    ];

    const newClasses = profile?.newClasses?.map((cls) => ({
        value: cls.id,
        label: `${cls.className} - ${cls.day} (${cls.startTime} - ${cls.endTime})`,
    }));
    const newClassesForWaitingList = profile?.noCapacityClass?.map((cls) => ({
        value: cls.id,
        label: `${cls.className} - ${cls.day} (${cls.startTime} - ${cls.endTime})`,
    }));

    const handleBookMembership = () => {
        showConfirm("Are you sure?", "Do you want to book a membership?", "Yes, Book it!", "Cancel").then((result) => {
            if (result.isConfirmed) {
                navigate("/weekly-classes/find-a-class/book-a-membership", {
                    state: { TrialData: profile, comesFrom: "waitingList" },
                });
            }
        });
    };

    const sendText = async (bookingIds) => {
        setTextLoading(true);
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book/free-trials/send-text`, {
                method: "POST", headers, body: JSON.stringify({ bookingId: bookingIds }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to send text");
            await showSuccess("Success!", result.message || "Text has been sent successfully.");
            return result;
        } catch (error) {
            await showError("Error", error.message || "Something went wrong.");
            throw error;
        } finally {
            await serviceHistoryMembership(bookingId);
            setTextLoading(false);
        }
    };

    const hearOptions = [
        { value: "Google", label: "Google" }, { value: "Facebook", label: "Facebook" },
        { value: "Instagram", label: "Instagram" }, { value: "Friend", label: "Friend" }, { value: "Flyer", label: "Flyer" },
    ];
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
    if (loading) return <Loader />;

    const classInfo = (profile?.students || [])
        .map((student) => {
            const className = student?.classSchedule?.className || "-";
            const studentName = `${student?.studentFirstName || ""} ${student?.studentLastName || ""}`.trim();
            return `${className} (${studentName})`;
        })
        .join(", ");

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
                        <div className="text-white text-right mt-1 text-[14px]">
                            {progressPercent}%
                        </div> </div>
                </div>
            </>
        );
    };

    return (
        <>
            <div className="md:flex w-full gap-4">
                {/* ── Left Column ─────────────────────────────────────────────── */}
                <div className="transition-all md:w-8/12 duration-300 flex-1">
                    <div className="space-y-6">

                        {/* Parents Section */}
                        <div className="space-y-6">
                            {parents.map((parent, index) => (
                                <div key={index} className="bg-white p-6 mb-10 rounded-3xl shadow-sm space-y-6 relative">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-[20px] font-semibold">Parent information</h2>
                                        <button onClick={() => toggleEditParent(index)} className="text-gray-600 hover:text-blue-600">
                                            {editingIndex === index ? <FaSave /> : <FaEdit />}
                                        </button>
                                    </div>

                                    {/* First / Last Name */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">First name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.parentFirstName}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) => handleDataChange(index, "parentFirstName", e.target.value)}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Last name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.parentLastName}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) => handleDataChange(index, "parentLastName", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Email / Phone */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Email</label>
                                            <input
                                                type="email"
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.parentEmail}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) => handleDataChange(index, "parentEmail", e.target.value)}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Phone number</label>
                                            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2">
                                                <PhoneInput
                                                    country={country2}
                                                    value={dialCode2}
                                                    onChange={(value, data) => {
                                                        setDialCode2("+" + data.dialCode);
                                                        setCountry2(data.countryCode);
                                                    }}
                                                    disableDropdown={false}
                                                    disableCountryCode={true}
                                                    countryCodeEditable={false}
                                                    inputStyle={{
                                                        width: "0px",
                                                        height: "0px",
                                                        opacity: 0,
                                                        pointerEvents: "none",
                                                        position: "absolute",
                                                    }}
                                                    buttonClass="!bg-white !border-none !p-0"
                                                />

                                                {/* ✅ Dial code display */}
                                                <span className="text-gray-700 mr-2 text-sm font-medium select-none">
                                                    {dialCode2}
                                                </span>

                                                <input
                                                    type="text"                                      // ✅ number se text karo
                                                    inputMode="numeric"
                                                    className="border-none w-full focus:outline-none"
                                                    // ✅ strip karke sirf raw number dikhao
                                                    value={stripDialCode(parent.parentPhoneNumber || "")}
                                                    readOnly={editingIndex !== index}
                                                    onChange={(e) => {
                                                        const rawNumber = e.target.value.replace(/[^0-9]/g, "");
                                                        handleDataChange(
                                                            index,
                                                            "parentPhoneNumber",
                                                            rawNumber ? `${dialCode2}${rawNumber}` : ""  // ✅ full number save
                                                        );
                                                    }}
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interest reason — only for membership */}
                                    {isMembership && (
                                        <div className="flex gap-4">
                                            <div className="w-1/2">
                                                <label className="block text-[16px] font-semibold">
                                                    What's the main reason you're interested in Samba Soccer Schools?
                                                </label>
                                                <input
                                                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                    value={parent.interestReason || ""}
                                                    readOnly={editingIndex !== index}
                                                    onChange={(e) => handleDataChange(index, "interestReason", e.target.value)}
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-[16px] font-semibold mb-6">Tell us a bit more (optional)</label>
                                                <input
                                                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                    value={parent.interestReasonOther || ""}
                                                    readOnly={editingIndex !== index}
                                                    onChange={(e) => handleDataChange(index, "interestReasonOther", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Relation / How did you hear */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Relation to child</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.relationToChild || ""}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) => handleDataChange(index, "relationToChild", e.target.value)}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">How did you hear about us?</label>
                                            <select
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={parent.howDidYouHear || ""}
                                                disabled={editingIndex !== index}
                                                onChange={(e) => handleDataChange(index, "howDidYouHear", e.target.value)}
                                            >
                                                {hearOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Service-specific extra info card */}
                        {(isBirthdayParty || isOneToOne) && (
                            <div className="bg-white p-6 mb-10 rounded-3xl shadow-sm space-y-4">
                                <h2 className="text-[20px] font-semibold capitalize">{serviceLabel} Details</h2>
                                {isBirthdayParty && (
                                    <>
                                        <div className="flex gap-4">
                                            <div className="w-1/2">
                                                <label className="block text-[14px] text-gray-500 font-semibold">Party Date</label>
                                                <p className="mt-1 text-[15px]">{formatISODate(profile._extra?.partyDate)}</p>
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-[14px] text-gray-500 font-semibold">Time</label>
                                                <p className="mt-1 text-[15px]">{profile._extra?.time || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[14px] text-gray-500 font-semibold">Address</label>
                                            <p className="mt-1 text-[15px]">{profile._extra?.address || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="block text-[14px] text-gray-500 font-semibold">Capacity</label>
                                            <p className="mt-1 text-[15px]">{profile._extra?.capacity ?? "N/A"}</p>
                                        </div>
                                    </>
                                )}
                                {isOneToOne && (
                                    <>
                                        <div className="flex gap-4">
                                            <div className="w-1/2">
                                                <label className="block text-[14px] text-gray-500 font-semibold">Session Date</label>
                                                <p className="mt-1 text-[15px]">{formatISODate(profile._extra?.sessionDate)}</p>
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-[14px] text-gray-500 font-semibold">Time</label>
                                                <p className="mt-1 text-[15px]">{profile._extra?.sessionTime || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[14px] text-gray-500 font-semibold">Address</label>
                                            <p className="mt-1 text-[15px]">{profile._extra?.address || "N/A"}</p>
                                        </div>
                                        {profile._extra?.areaWorkOn && (
                                            <div>
                                                <label className="block text-[14px] text-gray-500 font-semibold">Area to Work On</label>
                                                <p className="mt-1 text-[15px]">{profile._extra.areaWorkOn}</p>
                                            </div>
                                        )}
                                        {profile._extra?.location && (
                                            <div>
                                                <label className="block text-[14px] text-gray-500 font-semibold">Location</label>
                                                <p className="mt-1 text-[15px]">{profile._extra.location}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
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

                {/* ── Right Column ─────────────────────────────────────────────── */}

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

                {/* ── Modals (unchanged — membership only, hidden for other types) ── */}
                {addToWaitingList && isMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button className="absolute top-4 left-4 p-2" onClick={() => setaddToWaitingList(false)}>
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>
                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Add to Waiting List Form</h2>
                            </div>
                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">Select Student</label>
                                    <Select
                                        value={waitingListData.selectedStudents}
                                        onChange={handleWaitingListStudentSelect}
                                        options={studentsList?.map((student) => ({
                                            value: student.id,
                                            label: student.studentFirstName + " " + student.studentLastName,
                                            classSchedule: student.classSchedule,
                                        })) || []}
                                        placeholder="Select Student"
                                        isMulti
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "4px 8px", minHeight: "48px" }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                </div>
                                {waitingListData.selectedStudents.length > 0 && (
                                    <div className="space-y-6 border-t pt-4">
                                        {waitingListData.selectedStudents.map((studentOption) => {
                                            const studentId = studentOption.value;
                                            const config = waitingListData.studentConfigs?.[studentId] || {};
                                            const currentClass = studentOption.classSchedule?.className || "-";
                                            return (
                                                <div key={studentId} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                                                    <h3 className="font-semibold capitalize text-lg text-gray-800 pb-2">{studentOption.label}</h3>
                                                    <div className="grid gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Current Class</label>
                                                            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" value={currentClass} readOnly />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Venue</label>
                                                            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" value={profile?.venue?.name || "-"} readOnly />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[16px] font-semibold">Select New Class</label>
                                                        <Select
                                                            value={config.classScheduleId ? newClassesForWaitingList?.find((cls) => cls.value === config.classScheduleId) || null : null}
                                                            onChange={(selected) => handleWaitingListConfigChange(studentId, "classScheduleId", selected?.value)}
                                                            options={newClassesForWaitingList}
                                                            placeholder="Select Class"
                                                            className="rounded-lg mt-2"
                                                            styles={{
                                                                control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "4px 8px", minHeight: "48px" }),
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
                                <div>
                                    <label className="block text-[16px] font-semibold">Preferred Start Date (Optional)</label>
                                    <DatePicker
                                        minDate={addDays(new Date(), 1)}
                                        selected={waitingListData.startDate ? new Date(waitingListData.startDate) : null}
                                        onChange={(date) => handleDateChange(date, "startDate", setWaitingListData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        withPortal
                                    />
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Notes (Optional)</label>
                                    <textarea className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" rows={6} name="notes" value={waitingListData.notes} onChange={(e) => handleInputChange(e, setWaitingListData)} />
                                </div>
                                <div className="justify-end flex gap-4 pt-4">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={waitingListData.selectedStudents.length === 0}
                                        onClick={() => {
                                            if (waitingListData.selectedStudents.length === 0) { showWarning("Missing Information", "Please select at least one student."); return; }
                                            const studentsPayload = waitingListData.selectedStudents.map(opt => ({ studentId: opt.value, classScheduleId: waitingListData.studentConfigs?.[opt.value]?.classScheduleId }));
                                            if (studentsPayload.some(s => !s.classScheduleId)) { showWarning("Missing Information", "Please select a new class for all selected students."); return; }
                                            const payload = { bookingId: waitingListData.bookingId, additionalNote: waitingListData.notes, startDate: waitingListData.startDate, students: studentsPayload };
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
                            <button className="absolute top-4 left-4 p-2" onClick={() => setReactivateMembership(false)}>
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>
                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Reactivate Membership</h2>
                            </div>
                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">Reactivate On</label>
                                    <DatePicker
                                        minDate={addDays(new Date(), 1)}
                                        selected={reactivateData?.reactivateOn ? new Date(reactivateData.reactivateOn) : null}
                                        onChange={(date) => handleDateChange(date, "reactivateOn", setReactivateData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        withPortal
                                    />
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Confirm Class</label>
                                    <input type="text" className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" value={classInfo || "-"} readOnly />
                                </div>
                                <div className="w-full max-w-xl mx-auto">
                                    <button
                                        type="button"
                                        disabled={!paymentPlan}
                                        onClick={() => setIsOpen(!isOpen)}
                                        className={`text-white text-[18px] font-semibold border w-full px-6 py-3 rounded-lg flex items-center justify-center ${paymentPlan ? "bg-[#237FEA] border-[#237FEA]" : "bg-gray-400 border-gray-400 cursor-not-allowed"}`}
                                    >
                                        Review Membership Plan
                                        <img src={isOpen ? "/images/icons/whiteArrowDown.png" : "/images/icons/whiteArrowUp.png"} alt={isOpen ? "Collapse" : "Expand"} className="ml-2 inline-block" />
                                    </button>
                                    {isOpen && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="bg-white mt-4 rounded-2xl shadow-lg p-6 font-semibold space-y-4 text-[16px]">
                                            <div className="flex justify-between text-[#333]">
                                                <span>Membership Plan</span>
                                                <span>{paymentPlan?.duration} {paymentPlan?.interval}{paymentPlan?.duration > 1 ? 's' : ''}</span>
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
                                <div>
                                    <label className="block text-[16px] font-semibold">Additional Notes (Optional)</label>
                                    <textarea name="additionalNote" className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" rows={6} value={reactivateData.additionalNote} onChange={(e) => handleInputChange(e, setReactivateData)} />
                                </div>
                                <div className="flex gap-4 pt-4 justify-end">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => {
                                            if (!reactivateData?.reactivateOn) { showWarning("Validation Error", "Please select a reactivation date first."); return; }
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
                            <button className="absolute top-4 left-4 p-2" onClick={() => setshowCancelTrial(false)}>
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>
                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">
                                    {isBirthdayParty || isOneToOne ? "Cancel Booking" : "Cancel Membership"}
                                </h2>
                            </div>
                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">Cancellation Type</label>
                                    {cancelType.map((option) => (
                                        <label key={option.value} className="flex mt-4 items-center mb-2 cursor-pointer">
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
                                                    <svg className="w-3 h-3 text-white peer-checked:block" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                                <span className="text-gray-800 text-[16px]">{option.label}</span>
                                            </label>
                                        </label>
                                    ))}
                                </div>

                                {cancelData.cancellationType !== 'immediate' && (
                                    <div>
                                        <label className="block text-[16px] font-semibold">Cancellation Effective Date</label>
                                        <DatePicker
                                            minDate={addDays(new Date(), 1)}
                                            dateFormat="EEEE, dd MMMM yyyy"
                                            selected={cancelData.cancelDate ? new Date(cancelData.cancelDate) : null}
                                            onChange={(date) => handleDateChange(date, "cancelDate", setCancelData)}
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            withPortal
                                        />
                                    </div>
                                )}

                                {/* Student selection — only for membership (birthday/1-1 typically single student) */}
                                {isMembership && (
                                    <div>
                                        <label className="block text-[16px] font-semibold">Select Students to Cancel</label>
                                        <div className="mt-3 space-y-2">
                                            {studentsList.map((student) => {
                                                const isCancelled = student.studentStatus === "cancelled";
                                                return (
                                                    <label key={student.id} className={`flex items-center space-x-3 ${isCancelled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                                                        <input
                                                            type="checkbox"
                                                            disabled={isCancelled}
                                                            checked={selectedStudents.some((s) => s.id === student.id)}
                                                            onChange={() => !isCancelled && handleStudentSelect({ id: student.id, studentFirstName: student.studentFirstName, studentLastName: student.studentLastName })}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-[15px]">
                                                            {student.studentFirstName} {student.studentLastName}
                                                            {isCancelled && " (Already Cancelled)"}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[16px] font-semibold">Reason for Cancellation</label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === cancelData.cancelReason)}
                                        onChange={(selected) => handleSelectChange(selected, "cancelReason", setCancelData)}
                                        options={reasonOptions}
                                        placeholder=""
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "6px 8px", minHeight: "48px" }),
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
                                            onChange={(e) => setCancelData((prev) => ({ ...prev, otherReason: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-3"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Additional Notes (Optional)</label>
                                    <textarea className="w-full bg-gray-100 mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" rows={3} name="additionalNote" value={cancelData.additionalNote} onChange={(e) => handleInputChange(e, setCancelData)} />
                                </div>
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            // For birthday/one-to-one: skip student selection requirement
                                            if (isMembership && selectedStudents.length === 0) { showWarning("Validation Error", "Please select at least one student."); return; }
                                            if (!cancelData.cancellationType) { showWarning("Validation Error", "Please select a cancellation type."); return; }
                                            if (cancelData.cancellationType !== "immediate" && !cancelData.cancelDate) { showWarning("Validation Error", "Please select a cancellation effective date."); return; }
                                            if (!cancelData.cancelReason) { showWarning("Validation Error", "Please select a reason for cancellation."); return; }
                                            setshowCancelTrial(false);
                                            cancelMembershipSubmit(cancelData, "allMembers", isMembership ? selectedStudents : studentsList.map(s => ({ id: s.id, studentFirstName: s.studentFirstName, studentLastName: s.studentLastName })));
                                        }}
                                        className="w-1/2 bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                    >
                                        {cancelData.cancellationType !== "immediate" ? "Request to Cancel" : isBirthdayParty || isOneToOne ? "Cancel Booking" : "Cancel Membership"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {removeWaiting && isMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button className="absolute top-4 left-4 p-2" onClick={() => setRemoveWaiting(false)}>
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>
                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Cancel Waiting List Spot</h2>
                            </div>
                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">Reason for Cancellation</label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === cancelWaitingList.cancelReason)}
                                        onChange={(selected) => handleSelectChange(selected, "removedReason", setCancelWaitingList)}
                                        options={reasonOptions}
                                        placeholder=""
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "6px 8px", minHeight: "48px" }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Additional Notes (Optional)</label>
                                    <textarea className="w-full bg-gray-100 mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" rows={6} name="removedNotes" value={cancelWaitingList.removedNotes} onChange={(e) => handleInputChange(e, setCancelWaitingList)} />
                                </div>
                                <div className="flex justify-end gap-4 pt-4">
                                    <button onClick={() => cancelWaitingListSpot(cancelWaitingList, 'allMembers')} className="w-1/2 bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow">
                                      Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {transferVenue && isMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button className="absolute top-4 left-4 p-2" onClick={() => setTransferVenue(false)}>
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>
                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Transfer Class Form</h2>
                            </div>
                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">Select Student</label>
                                    <Select
                                        value={transferData.selectedStudents}
                                        onChange={handleStudentSelectChange}
                                        options={studentsList?.map((student) => ({ value: student.id, label: student.studentFirstName + " " + student.studentLastName, classSchedule: student.classSchedule })) || []}
                                        placeholder="Select Student"
                                        isMulti
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "4px 8px", minHeight: "48px" }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                </div>
                                {transferData.selectedStudents.length > 0 && (
                                    <div className="space-y-6 border-t pt-4">
                                        {transferData.selectedStudents.map((studentOption) => {
                                            const studentId = studentOption.value;
                                            const studentConfig = transferData.studentTransfers?.[studentId] || {};
                                            const currentClass = studentOption.classSchedule?.className || "-";
                                            return (
                                                <div key={studentId} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                                                    <h3 className="font-semibold capitalize text-lg text-gray-800 pb-2">{studentOption.label}</h3>
                                                    <div className="grid gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Current Class</label>
                                                            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" value={currentClass} readOnly />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Venue</label>
                                                            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" value={profile?.venue?.name || "-"} readOnly />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-1">New Class</label>
                                                        <Select
                                                            value={studentConfig.classScheduleId ? newClasses?.find((cls) => cls.value === studentConfig.classScheduleId) || null : null}
                                                            onChange={(selected) => handleTransferConfigChange(studentId, "classScheduleId", selected?.value)}
                                                            options={newClasses}
                                                            placeholder="Select New Class"
                                                            className="rounded-lg"
                                                            styles={{ control: (base) => ({ ...base, borderRadius: "0.5rem", minHeight: "40px" }) }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-1">Reason (Optional)</label>
                                                        <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Reason for transfer" value={studentConfig.transferReasonClass || ""} onChange={(e) => handleTransferConfigChange(studentId, "transferReasonClass", e.target.value)} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="flex gap-4 pt-4 justify-end">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={transferData.selectedStudents.length === 0}
                                        onClick={() => {
                                            if (!transferData.selectedStudents.length) { showWarning("Missing Information", "Please select at least one student."); return; }
                                            const transfers = transferData.selectedStudents.map(opt => ({ studentId: opt.value, classScheduleId: transferData.studentTransfers?.[opt.value]?.classScheduleId, transferReasonClass: transferData.studentTransfers?.[opt.value]?.transferReasonClass }));
                                            if (transfers.some(t => !t.classScheduleId)) { showWarning("Missing Information", "Please select a new class for all selected students."); return; }
                                            transferMembershipSubmit({ bookingId: profile?.bookingId, transfers }, 'allMembers');
                                        }}
                                    >
                                        Submit Transfer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {freezeMembership && isMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button className="absolute top-4 left-4 p-2" onClick={() => setFreezeMembership(false)}>
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>
                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Freeze Membership Form</h2>
                            </div>
                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">Freeze Start Date</label>
                                    <DatePicker minDate={addDays(new Date(), 1)} selected={freezeData.freezeStartDate ? new Date(freezeData.freezeStartDate) : null} onChange={(date) => handleDateChange(date, "freezeStartDate", setFreezeData)} dateFormat="EEEE, dd MMMM yyyy" className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" withPortal />
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Freeze Duration (Months)</label>
                                    <Select value={monthOptions.find((opt) => opt.value === freezeData.freezeDurationMonths) || null} onChange={(selected) => handleSelectChange(selected, "freezeDurationMonths", setFreezeData)} options={monthOptions} placeholder="Select Duration" className="rounded-lg mt-2" styles={{ control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "4px 8px", minHeight: "48px" }), placeholder: (base) => ({ ...base, fontWeight: 600 }), dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }), indicatorSeparator: () => ({ display: "none" }) }} />
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Reactivate On</label>
                                    <DatePicker minDate={addDays(new Date(), 1)} selected={freezeData.reactivateOn ? new Date(freezeData.reactivateOn) : null} onChange={(date) => handleDateChange(date, "reactivateOn", setFreezeData)} dateFormat="EEEE, dd MMMM yyyy" className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" withPortal />
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Reason for Freezing (Optional)</label>
                                    <textarea name="reasonForFreezing" className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" rows={6} value={freezeData.reasonForFreezing} onChange={(e) => handleInputChange(e, setFreezeData)} />
                                </div>
                                <div className="flex w-full justify-end gap-4 pt-4">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => {
                                            if (!freezeData.freezeStartDate || !freezeData.freezeDurationMonths || !freezeData.reactivateOn) { showWarning("Incomplete Form", "Please fill in all the required fields before submitting."); return; }
                                            setFreezeMembership(false);
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
            </div>
        </>
    );
};

export default ParentProfile;