import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { motion, AnimatePresence, px } from "framer-motion";
import { showWarning, showConfirm, showError } from "../../../../../../utils/swalHelper";
import { format } from "date-fns";
import { evaluate } from "mathjs";
import PhoneInput from "react-phone-input-2";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { ChevronDown, ChevronUp, Info, CheckCircle2 } from "lucide-react";
import { getNames } from "country-list";

import PlanTabs from "../PlanTabs";
import Loader from "../../../contexts/Loader";
import { useVenue } from "../../../contexts/VenueContext";
import { usePayments } from "../../../contexts/PaymentPlanContext";
import { useClassSchedule } from "../../../contexts/ClassScheduleContent";
import { useBookFreeTrial } from "../../../contexts/BookAFreeTrialContext";

import "react-datepicker/dist/react-datepicker.css";
import "react-phone-input-2/lib/style.css";
import { useMembers } from "../../../contexts/MemberContext";
import { useNotification } from "../../../contexts/NotificationContext";
import Comments from "../../../Common/Comments";
import PhoneNumberInput from "../../../Common/PhoneNumberInput";

// ─────────────────────────────────────────────────────────────
//  Payment routing constants (Issue #47 / #48)
// ─────────────────────────────────────────────────────────────
const PAYMENT_TYPES = {
    ACCESS_PAY_SUITE: "accesspaysuite", // Super-admin monthly subscription → HQ
    GOCARDLESS: "gocardless",           // Franchisee monthly subscription → Franchisee account
    STRIPE: "stripe",                   // Starter pack → Head Office always
};

const PAYMENT_DESTINATIONS = {
    HQ: "HEAD_OFFICE",
    FRANCHISEE: "FRANCHISEE",
};

// Sandbox flag (Issue #50)
const IS_SANDBOX = import.meta.env.VITE_PAYMENT_ENV === "sandbox";

const List = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createBookMembership, createBookMembershipByfreeTrial, submitAllComments, createBookMembershipbyCancellation, createBookMembershipByWaitingList, isBooked, setIsBooked } = useBookFreeTrial()
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [selectedClassId, setSelectedClassId] = useState(null);

    const [expression, setExpression] = useState('');
    const [studentRemoved, setStudentRemoved] = useState(false);
    const [numberOfStudents, setNumberOfStudents] = useState(1);
    const [nameOnCard, setCardHolderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvc, setCvc] = useState("");
    const [errors, setErrors] = useState({});
    const [proRataCode, setProRataCode] = useState("");
    const [proRataDiscountData, setProRataDiscountData] = useState(null);
    const [isProRataApplied, setIsProRataApplied] = useState(false);
    const [isProRataChecked, setIsProRataChecked] = useState(false);
    const [checkoutCountry, setCheckoutCountry] = useState("United States");
    const [zipCode, setZipCode] = useState("");
    const [step, setStep] = useState(1);
    const { keyInfoData, fetchKeyInfo } = useMembers();
    const token = localStorage.getItem("adminToken");
    const [isDiscountLoading, setIsDiscountLoading] = useState(false);
    const { adminInfo, setAdminInfo } = useNotification();
    const [country, setCountry] = useState("uk");
    const [isProRataLoading, setIsProRataLoading] = useState(false);
    const [dialCode, setDialCode] = useState("+44");
    const [dialCode2, setDialCode2] = useState("+44");
    const [country2, setCountry2] = useState("gb");
    const [isChecked, setIsChecked] = useState(false);
    const [calculatedAmount, setCalculatedAmount] = useState(0);
    const [remainingLessons, setRemainingLessons] = useState(0);
    const [loadingData, setLoadingData] = useState(false);
    const [pricingBreakdown, setPricingBreakdown] = useState({
        pricePerClassPerChild: 0,
        numberOfLessonsProRated: 0,
        costOfProRatedLessons: 0,
        starterPackPrice: 0,
        totalAmount: 0,
        isFullMonthCharge: 0,
        stripeAmount: 0,
    });

    // ── Payment transaction log state (Issue #49) ──────────────
    const [transactionLog, setTransactionLog] = useState([]);

    const [tempComments, setTempComments] = useState([]);

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
    ].sort((a, b) => b.dialCode.length - a.dialCode.length);

    const formatCardNumber = (val) => {
        const digits = val.replace(/\D/g, "").slice(0, 16);
        return digits.replace(/(.{4})/g, "$1 ").trim();
    };

    const formatExpiry = (val) => {
        const digits = val.replace(/\D/g, "").slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
        return digits;
    };

    const formatCvc = (val) => val.replace(/\D/g, "").slice(0, 4);
    const formatZip = (val) => val.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 10);

    const handleChange = (value, data) => {
        setDialCode("+" + data.dialCode);
    };

    const validateField = (field, value) => {
        switch (field) {
            case "nameOnCard":
                return value.trim() ? "" : "Name on card is required";
            case "cardNumber":
                return value.replace(/\s/g, "").length === 16 ? "" : "Enter a valid 16-digit card number";
            case "expiryDate": {
                if (!value || value.length < 5) return "Enter expiry as MM/YY";
                const [mm, yy] = value.split("/");
                const month = parseInt(mm, 10);
                const year = parseInt("20" + yy, 10);
                const now = new Date();
                const expDate = new Date(year, month - 1, 1);
                if (month < 1 || month > 12) return "Invalid month";
                if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) return "Card has expired";
                return "";
            }
            case "cvc":
                return value.length >= 3 ? "" : "Enter a valid CVC";
            case "country":
                return value.trim() ? "" : "Country is required";
            case "zipCode":
                return value.trim() ? "" : "Postal Code is required";
            default:
                return "";
        }
    };

    const isFormValid = !Object.keys(errors).length &&
        nameOnCard.trim() && cardNumber && expiryDate && cvc && checkoutCountry && zipCode;

    const validateAll = () => {
        const fields = { nameOnCard, cardNumber, expiryDate, cvc, checkoutCountry, zipCode };
        const newErrors = {};
        Object.entries(fields).forEach(([field, value]) => {
            const msg = validateField(field, value);
            if (msg) newErrors[field] = msg;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckoutChange = (field, rawValue) => {
        let value = rawValue;
        if (field === "cardNumber") value = formatCardNumber(rawValue);
        if (field === "expiryDate") value = formatExpiry(rawValue);
        if (field === "cvc") value = formatCvc(rawValue);
        if (field === "zipCode") value = formatZip(rawValue);

        const setters = { nameOnCard: setCardHolderName, cardNumber: setCardNumber, expiryDate: setExpiryDate, cvc: setCvc, checkoutCountry: setCheckoutCountry, zipCode: setZipCode };
        setters[field]?.(value);

        const msg = validateField(field, value);
        setErrors((prev) => {
            const copy = { ...prev };
            if (msg) copy[field] = msg;
            else delete copy[field];
            return copy;
        });
    };

    const handleDiscountChange = (e) => {
        setDiscountCode(e.target.value);
        setIsChecked(false);
        setIsApplied(false);
        setIsProRataChecked(false);
        setIsProRataApplied(false);
    };

    const handleCountryChange = (countryData) => {
        setCountry(countryData.countryCode);
        setDialCode2("+" + countryData.dialCode);
    };

    const handleCountryChange2 = (countryData) => {
        const newDialCode = "+" + countryData.dialCode;
        setDialCode2(newDialCode);
        setCountry2(countryData.countryCode);
        const updated = parents.map((p) => {
            const rawNumber = stripDialCode(p.parentPhoneNumber || "");
            return { ...p, parentPhoneNumber: `${newDialCode}${rawNumber}` };
        });
        setParents(updated);
    };

    const handleChange2 = (value, data) => {
        const newDialCode = "+" + data.dialCode;
        setDialCode2(newDialCode);
        setCountry2(data.countryCode);
    };

    const stripDialCode = (phoneNumber) => {
        if (!phoneNumber) return "";
        for (const { dialCode } of DIAL_CODES) {
            if (phoneNumber.startsWith(dialCode)) return phoneNumber.slice(dialCode.length).trim();
        }
        const match = phoneNumber.match(/^\+\d{1,4}/);
        if (match) return phoneNumber.slice(match[0].length).trim();
        return phoneNumber;
    };

    const matchDialCode = (phone) => {
        if (!phone) return null;
        for (const entry of DIAL_CODES) {
            if (phone.startsWith(entry.dialCode)) return entry;
        }
        return null;
    };

    const populateParentData = (fetchedParent) => {
        const phone = fetchedParent.parentPhoneNumber || "";
        if (phone) {
            const matched = matchDialCode(phone);
            if (matched) { setDialCode2(matched.dialCode); setCountry2(matched.countryCode); }
        }
        setParents([fetchedParent]);
    };

    const [isOpenMembership, setIsOpenMembership] = useState(false);
    const [commentsList, setCommentsList] = useState([]);
    const [loadingComment, setLoadingComment] = useState(false);
    const [comment, setComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 5;

    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
    const totalPages = Math.ceil(commentsList.length / commentsPerPage);

    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };

    const [result, setResult] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { classId, TrialData, comesFrom, from_lead, leadId, startmembership, mainBookingId } = location.state || {};
    const popup1Ref = useRef(null);
    const popup2Ref = useRef(null);
    const popup3Ref = useRef(null);
    const img3Ref = useRef(null);
    const img1Ref = useRef(null);
    const img2Ref = useRef(null);
    const [showPopup, setShowPopup] = useState(false);
    const [directDebitData, setDirectDebitData] = useState([]);

    console.log('comesFrom', comesFrom)

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

    const { fetchFindClassID, singleClassSchedulesOnly, loading, setLoading } = useClassSchedule() || {};

    // ── Issue #48: Reliable franchisee detection (check adminInfo role AND venue role) ──
    const isFranchisee =
        adminInfo?.role?.role === "Franchisee" ||
        singleClassSchedulesOnly?.venue?.admins?.role?.role === "Franchisee";

    // ── Issue #47: Determine subscription payment type based on role ──
    const subscriptionPaymentType = isFranchisee
        ? PAYMENT_TYPES.GOCARDLESS
        : PAYMENT_TYPES.ACCESS_PAY_SUITE;

    const subscriptionDestination = isFranchisee
        ? PAYMENT_DESTINATIONS.FRANCHISEE
        : PAYMENT_DESTINATIONS.HQ;

    const [students, setStudents] = useState([{
        studentFirstName: '', studentLastName: '', dateOfBirth: null, age: '',
        gender: '', medicalInformation: '', selectedClassId: null, selectedClassData: null, initialClassId: null
    }]);

    const [emergency, setEmergency] = useState({
        id: Date.now(), sameAsAbove: false, emergencyFirstName: "",
        emergencyLastName: "", emergencyPhoneNumber: "", emergencyRelation: "",
    });

    const [parents, setParents] = useState([{
        id: Date.now(), parentFirstName: '', parentLastName: '', parentEmail: '',
        parentPhoneNumber: '', interestReason: '', interestReasonOther: '',
        relationToChild: '', howDidYouHear: '', isCustomReason: false
    }]);
    const [payment, setPayment] = useState({
        paymentType: PAYMENT_TYPES.ACCESS_PAY_SUITE,
        firstName: "",
        lastName: "",
        email: parents[0].parentEmail || "",
        price: '',
        line1: "",
        city: "",
        postalCode: "",
        account_number: "",
        branch_code: "",
        account_holder_name: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const clearError = (name) => {
        setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    };
    const fieldClass = (key) =>
        `w-full mt-2 border rounded-xl px-4 py-3 text-base focus:outline-none ${fieldErrors[key] ? "border-red-500 bg-red-50" : "border-gray-300"
        }`;

    const ErrorMsg = ({ name }) =>
        fieldErrors[name] ? (
            <div className="text-red-500 text-sm mt-1 ml-1">{fieldErrors[name]}</div>
        ) : null;

    const studentRefs = useRef([]);
    const parentRefs = useRef([]);
    const emergencyRef = useRef(null);
    const infoRef = useRef(null);

    const finalClassId = selectedClassId || classId || TrialData?.classScheduleId || TrialData?.students?.[0]?.classSchedule?.id;

    const allPaymentPlans =
        singleClassSchedulesOnly?.venue?.paymentGroups[0]?.paymentPlans?.map((plan) => ({
            label: `${plan.title} (${plan.students} student${plan.students > 1 ? "s" : ""})`,
            value: plan.id,
            starterPackPrice: singleClassSchedulesOnly?.starterPack?.[0]?.price || 0,
            all: plan,
        })) || [];

    const paymentPlanOptions = numberOfStudents
        ? allPaymentPlans.filter((plan) => plan.all?.students === Number(numberOfStudents))
        : allPaymentPlans;

    const countryOptions = [
        { value: 'United Kingdom', label: 'United Kingdom' },

        ...getNames()
            .filter(country => country !== 'United Kingdom')
            .sort((a, b) => a.localeCompare(b))
            .map(country => ({
                value: country,
                label: country
            }))
    ];

    const customSelectStyles = {
        control: (base) => ({
            ...base, backgroundColor: "#ffffff", borderRadius: "4px", padding: "2px 8px",
            border: "none", boxShadow: "0 0 0 1px rgba(0,0,0,0.05)", minHeight: "40px", marginTop: "4px",
        }),
        placeholder: (base) => ({ ...base, color: "#494949", fontWeight: 500 }),
        valueContainer: (base) => ({ ...base, padding: "0 8px" }),
        indicatorSeparator: () => ({ display: "none" }),
        dropdownIndicator: (base) => ({ ...base, padding: "4px" }),
    };

    const classesWithCapacity = Array.isArray(singleClassSchedulesOnly?.venueClasses)
        ? singleClassSchedulesOnly.venueClasses.filter((cls) => cls.capacity > 0)
        : [];

    const allClasses = Array.isArray(singleClassSchedulesOnly?.venueClasses)
        ? singleClassSchedulesOnly.venueClasses
        : [];
    console.log('allClasses', allClasses)
    console.log('classesWithCapacity', classesWithCapacity)
    const handleStudentClassChange = (index, selectedOption) => {
        setStudents((prev) => {
            const updated = [...prev];

            if (!selectedOption) {
                updated[index] = {
                    ...updated[index],
                    selectedClassId: null,
                    selectedClassData: null,
                    error: null
                };
                return updated;
            }

            const selectedClass = allClasses.find(
                (cls) => cls.id === selectedOption.value
            );

            // 🚨 Capacity 0 case
            if (selectedClass?.capacity === 0 &&
                selectedOption.value !== updated[index].initialClassId &&
                selectedOption.value !== updated[index].selectedClassId) {

                showConfirm(
                    "Are you sure?",
                    "This class has no capacity. Do you want to join the waiting list instead?",
                    "Yes"
                ).then((result) => {
                    if (result.isConfirmed) {
                        navigate("/weekly-classes/find-a-class/add-to-waiting-list", {
                            state: {
                                itemId: selectedClass.id,
                                studentsData: prev,              // 👈 ALL students
                                parentsData: parents,            // 👈 parents
                                emergencyData: emergency,        // 👈 emergency
                                selectedClassData: selectedClass,
                                selectedStudentIndex: index,
                                comesFrom: 'membership',
                                mainBookingId: mainBookingId,
                            }
                        });
                    }
                });




                return prev; // don't update selection
            }

            // ✅ Normal case
            updated[index] = {
                ...updated[index],
                selectedClassId: selectedOption.value,
                selectedClassData: selectedClass,
                error: null
            };

            return updated;
        });
    };
    const handleNumberChange = (e) => {
        const val = e.target.value === "" ? "" : Number(e.target.value);
        if (val === "" || [1, 2, 3, 4].includes(val)) {
            setNumberOfStudents(val);
            setStudents((prevStudents) => {
                if (val === "") return [];
                if (val > prevStudents.length) {
                    const newStudents = Array.from({ length: val - prevStudents.length }, () => ({
                        studentFirstName: "", studentLastName: "", gender: "", age: "",
                        dateOfBirth: "", medicalInformation: "", selectedClassId: "", selectedClassData: null, initialClassId: null,
                    }));
                    return [...prevStudents, ...newStudents];
                }
                return prevStudents.slice(0, val);
            });
            if (membershipPlan && membershipPlan.all?.students !== val) {
                const matchedPlan = paymentPlanOptions.find((p) => p.all?.students === val);
                setMembershipPlan(matchedPlan || null);
            }
        }
    };

    const isEmpty =
        comesFrom === "" || comesFrom === null || comesFrom === undefined;

    const venueClassOptions = !isEmpty
        ? allClasses?.map((cls) => ({ value: cls.id, label: cls.className }))
        : classesWithCapacity?.map((cls) => ({ value: cls.id, label: cls.className }));



    const handlePlanChange = (plan) => {
        setMembershipPlan(plan);
        if (plan) {
            const val = Number(plan.all?.students);
            setNumberOfStudents(val);
            setStudents((prevStudents) => {
                if (val > prevStudents.length) {
                    const newStudents = Array.from({ length: val - prevStudents.length }, () => ({
                        studentFirstName: "", studentLastName: "", gender: "", age: "",
                        dateOfBirth: "", medicalInformation: "", selectedClassId: "", selectedClassData: null, initialClassId: null,
                    }));
                    return [...prevStudents, ...newStudents];
                }
                return prevStudents.slice(0, val);
            });
        }
    };

    useEffect(() => {
        setStudents((prevStudents) => {
            const n = Number(numberOfStudents) || 0;
            if (n > prevStudents.length) {
                const newStudents = Array.from({ length: n - prevStudents.length }).map(() => ({
                    studentFirstName: '', studentLastName: '', dateOfBirth: null, age: '',
                    gender: '', medicalInformation: '',
                    selectedClassId: singleClassSchedulesOnly?.id || null,
                    selectedClassData: singleClassSchedulesOnly || null,
                    initialClassId: singleClassSchedulesOnly?.id || null,
                }));
                return [...prevStudents, ...newStudents];
            }
            if (n < prevStudents.length) return prevStudents.slice(0, n);
            return prevStudents;
        });
    }, [numberOfStudents, singleClassSchedulesOnly]);
    useEffect(() => {
        if (singleClassSchedulesOnly?.venue) {
            setSelectedVenue(singleClassSchedulesOnly.venue);
        }
    }, [singleClassSchedulesOnly]);
    useEffect(() => {
        if (TrialData) {
            if (Array.isArray(TrialData.students) && TrialData.students.length > 0) {
                const formatDOB = (dob) => {
                    if (!dob) return "";
                    const [year, month, day] = dob.split("-");
                    return `${day}/${month}/${year}`;
                };
                const mappedStudents = TrialData.students.map((student) => ({
                    ...student,
                    dateOfBirth: formatDOB(student.dateOfBirth),

                    selectedClassId: student.selectedClassId || singleClassSchedulesOnly?.id || null,
                    selectedClassData: student.selectedClassData || singleClassSchedulesOnly || null,
                    initialClassId: student.selectedClassId || singleClassSchedulesOnly?.id || null,
                }));
                setStudents(mappedStudents);
                setNumberOfStudents(TrialData?.totalStudents);
            }
            if (Array.isArray(TrialData.parents) && TrialData.parents.length > 0) {
                const mappedParents = TrialData.parents.map((p, idx) => {
                    const isPredefined = interestReasonOptions.some((opt) => opt.value === p.interestReason);
                    return { id: idx + 1, ...p, isCustomReason: !isPredefined, interestReason: isPredefined ? p.interestReason : p.interestReason || "" };
                });
                setParents(mappedParents);
                const firstPhone = TrialData.parents[0]?.parentPhoneNumber;
                if (firstPhone) {
                    const matched = matchDialCode(firstPhone);
                    if (matched) { setDialCode2(matched.dialCode); setCountry2(matched.countryCode); }
                }
            }
            if (TrialData.emergency) {
                let emergencyData = Array.isArray(TrialData.emergency) ? TrialData.emergency[0] : TrialData.emergency;
                if (emergencyData) {
                    setEmergency({
                        sameAsAbove: false, id: emergencyData.id || "",
                        emergencyFirstName: emergencyData.emergencyFirstName || "",
                        emergencyLastName: emergencyData.emergencyLastName || "",
                        emergencyPhoneNumber: emergencyData.emergencyPhoneNumber || "",
                        emergencyRelation: emergencyData.emergencyRelation || "",
                    });
                }
            }
        }
    }, [TrialData]);

    useEffect(() => {
        if (!finalClassId) navigate("/weekly-classes/find-a-class", { replace: true });
    }, [finalClassId, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            if (finalClassId) {
                setIsBooked(false);
                await fetchFindClassID(finalClassId);
                await fetchKeyInfo();
                if (startmembership === "startmembership" || comesFrom == "cancellation") {
                    await fetchVenues();
                }
            }
        };
        fetchData();
    }, [finalClassId, fetchFindClassID, fetchKeyInfo]);

    const [activePopup, setActivePopup] = useState(null);

    useEffect(() => {
        if (!singleClassSchedulesOnly) return;
        setStudents((prev) => prev.map((student) => ({
            ...student, selectedClassId: singleClassSchedulesOnly.id, selectedClassData: singleClassSchedulesOnly,
        })));
    }, [singleClassSchedulesOnly]);

    const togglePopup = (id) => setActivePopup((prev) => (prev === id ? null : id));

    const [openForm, setOpenForm] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedPlans, setSelectedPlans] = useState([]);
    const [congestionNote, setCongestionNote] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [membershipPlan, setMembershipPlan] = useState(null);
    const [discountCode, setDiscountCode] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState('');
    const [isApplied, setIsApplied] = useState(false);
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 11));
    const [toDate, setToDate] = useState(null);
    const validationCheck = () => {
        const newErrors = {};
        if (!membershipPlan) newErrors["membershipPlan"] = "Membership Plan is required";
        if (!selectedDate) newErrors["selectedDate"] = "Start date is required";

        for (let i = 0; i < students.length; i++) {
            const s = students[i];
            if (!s.studentFirstName?.trim()) newErrors[`student_${i}_studentFirstName`] = "First name is required";
            if (!s.studentLastName?.trim()) newErrors[`student_${i}_studentLastName`] = "Last name is required";
            if (!s.dateOfBirth) newErrors[`student_${i}_dateOfBirth`] = "Date of Birth is required";
            if (!s.gender) newErrors[`student_${i}_gender`] = "Gender is required";
            if (!s.medicalInformation?.trim()) newErrors[`student_${i}_medicalInformation`] = "Medical info required (write 'None' if applicable)";
            if (i !== 0 && !comesFrom && !s.selectedClassId) newErrors[`student_${i}_selectedClassId`] = "Please select a class";
            if (s.selectedClassData && Number(s.selectedClassData.capacity) === 0) {
                newErrors[`student_${i}_selectedClassId`] = "Selected class has no available capacity";
            }
        }

        for (let i = 0; i < parents.length; i++) {
            const p = parents[i];
            if (!p.parentFirstName?.trim()) newErrors[`parent_${i}_parentFirstName`] = "First name is required";
            if (!p.parentLastName?.trim()) newErrors[`parent_${i}_parentLastName`] = "Last name is required";
            if (!p.parentEmail?.trim()) newErrors[`parent_${i}_parentEmail`] = "Email is required";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.parentEmail)) newErrors[`parent_${i}_parentEmail`] = "Enter a valid email address";
            if (!p.parentPhoneNumber?.trim()) newErrors[`parent_${i}_parentPhoneNumber`] = "Phone number is required";
            if (!p.interestReason) newErrors[`parent_${i}_interestReason`] = "Selection required";
            if (!p.relationToChild) newErrors[`parent_${i}_relationToChild`] = "Relation is required";
            if (!p.howDidYouHear) newErrors[`parent_${i}_howDidYouHear`] = "Please select how you heard about us";
        }

        if (!emergency.emergencyFirstName?.trim()) newErrors["emergency_emergencyFirstName"] = "First name is required";
        if (!emergency.emergencyLastName?.trim()) newErrors["emergency_emergencyLastName"] = "Last name is required";
        if (!emergency.emergencyPhoneNumber?.trim()) newErrors["emergency_emergencyPhoneNumber"] = "Phone number is required";
        if (!emergency.emergencyRelation) newErrors["emergency_emergencyRelation"] = "Relation is required";


        setFieldErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            // Scroll to first error
            const firstKey = Object.keys(newErrors)[0];
            const parts = firstKey.split("_");

            setTimeout(() => {
                if (newErrors.membershipPlan || newErrors.selectedDate) {
                    infoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                } else if (parts[0] === "student") {
                    const idx = Number(parts[1]);
                    studentRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
                } else if (parts[0] === "parent") {
                    const idx = Number(parts[1]);
                    parentRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
                } else if (parts[0] === "emergency") {
                    emergencyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);

            return false;
        }

        return true;
    };
    console.log('membershipPlan', membershipPlan, selectedDate)
    console.log('validationCheck', validationCheck)
    console.log('errros', errors, fieldErrors)
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const hasInitialized = useRef(false);

    const [clickedIcon, setClickedIcon] = useState(null);
    const [selectedKeyInfo, setSelectedKeyInfo] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const { venues, isEditVenue, setIsEditVenue, deleteVenue, fetchVenues } = useVenue() || {};
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const isAllSelected = venues.length > 0 && selectedUserIds.length === venues.length;

    const toggleSelectAll = () => {
        if (isAllSelected) setSelectedUserIds([]);
        else setSelectedUserIds(venues.map((user) => user.id));
    };

    const handleDelete = (id) => {
        showConfirm('Are you sure?', 'This action will permanently delete the venue.', 'Yes, delete it!').then((result) => {
            if (result.isConfirmed) deleteVenue(id);
        });
    };

    // ── Issue #48: Validate fields based on actual payment type ──
    const isCardInvalid =
        !isFranchisee && (
            !payment.account_holder_name || !payment.firstName ||
            !payment.line1 || !payment.city || !payment.postalCode ||
            !payment.account_number || !payment.branch_code
        );

    const isBankInvalid =
        isFranchisee && (
            !payment.account_holder_name || !payment.firstName ||
            !payment.account_number || !payment.branch_code
        );

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };


    console.log('errrors', errors)
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

    const isSameDate = (d1, d2) => {
        const date1 = typeof d1 === "string" ? new Date(d1) : d1;
        const date2 = typeof d2 === "string" ? new Date(d2) : d2;
        return date1 && date2 &&
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const handleCancel = () => {
        showConfirm("Are you sure?", "Your changes will not be saved!", "Yes, leave").then((result) => {
            if (result.isConfirmed) navigate("/weekly-classes/find-a-class");
        });
    };

    const handleDateClick = (date) => {
        const formattedDate = formatLocalDate(date);
        if (selectedDate === formattedDate) { setSelectedDate(null); calculateAmount(null); }
        else { setSelectedDate(formattedDate); calculateAmount(formattedDate); }
    };

    const modalRef = useRef(null);
    const PRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            const activeRef = clickedIcon === "group" ? modalRef : PRef;
            if (activeRef.current && !activeRef.current.contains(event.target)) setShowModal(false);
        }
        if (showModal) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showModal, clickedIcon, setShowModal]);

    const inputClass = (field) =>
        `w-full mt-1 mainShadow bg-white placeholder:text-[#494949] placeholder:font-medium rounded-[6px] px-4 py-2 outline-none${errors[field] ? " border border-red-500" : ""}`;

    const allTermRanges = Array.isArray(congestionNote)
        ? congestionNote.flatMap(group =>
            group.terms.map(term => ({
                start: new Date(term.startDate),
                end: new Date(term.endDate),
                exclusions: (Array.isArray(term.exclusionDates)
                    ? term.exclusionDates
                    : JSON.parse(term.exclusionDates || '[]')
                ).map(date => new Date(date)),
            }))
        )
        : [];

    const isInRange = (date) => allTermRanges.some(({ start, end }) => date >= start && date <= end);
    const isExcluded = (date) => allTermRanges.some(({ exclusions }) => exclusions.some(ex => ex.toDateString() === date?.toDateString()));

    const [dob, setDob] = useState('');
    const [age, setAge] = useState(null);
    const [time, setTime] = useState('');
    const [phone, setPhone] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [sameAsAbove, setSameAsAbove] = useState(false);

    const handleDOBChange = (index, value) => {
        let cleaned = value.replace(/[^\d]/g, "");
        if (cleaned.length > 2 && cleaned.length <= 4) cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        else if (cleaned.length > 4) cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;

        const updatedStudents = [...students];
        updatedStudents[index].dateOfBirth = cleaned;

        if (cleaned.length === 10) {
            const [day, month, year] = cleaned.split("/").map(Number);
            const date = new Date(year, month - 1, day);
            const isValid = date && date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
            if (isValid) {
                const today = new Date();
                let ageNow = today.getFullYear() - year;
                const m = today.getMonth() - (month - 1);
                if (m < 0 || (m === 0 && today.getDate() < day)) ageNow--;
                updatedStudents[index].age = ageNow >= 3 && ageNow <= 100 ? ageNow : "";
            } else {
                updatedStudents[index].age = "";
            }
        } else {
            updatedStudents[index].age = "";
        }
        setStudents(updatedStudents);
    };

    const handleInputChange = (index, field, value) => {
        const updatedStudents = [...students];
        updatedStudents[index][field] = value;
        setStudents(updatedStudents);
    };

    const handleAddParent = () => {
        setParents((prev) => [...prev, {
            id: Date.now(), parentFirstName: '', parentLastName: '', parentEmail: '',
            parentPhoneNumber: '', relationToChild: '', interestReason: '',
            interestReasonOther: '', howDidYouHear: '', isCustomReason: false
        }]);
    };

    const handleRemoveParent = (id) => setParents((prev) => prev.filter((p) => p.id !== id));

    const handleStudentChange = (index, field, value) => {
        const updated = [...students];
        updated[index][field] = value;
        if (field === "dateOfBirth") {
            const birth = new Date(value);
            const today = new Date();
            updated[index].age = today.getFullYear() - birth.getFullYear();
        }
        setStudents(updated);
    };

    const handleParentChange = (index, field, value) => {
        const updated = [...parents];
        updated[index][field] = value;
        setParents(updated);
    };

    const handleEmergencyChange = (studentIndex, field, value) => {
        const updated = [...students];
        updated[studentIndex].emergency[field] = value;
        setStudents(updated);
    };

    const handleSameAsAbove = (studentIndex) => {
        const updated = [...students];
        const primaryParent = updated[studentIndex].parents[0];
        if (primaryParent) {
            updated[studentIndex].emergency = {
                parentFirstName: primaryParent.parentFirstName,
                parentLastName: primaryParent.parentLastName,
                parentPhoneNumber: primaryParent.parentPhoneNumber,
                relationToChild: primaryParent.relationToChild?.label || "",
                interestReason: primaryParent.interestReason || '',
                interestReasonOther: primaryParent.interestReasonOther || '',
                sameAsAbove: true
            };
        }
        setStudents(updated);
    };

    const handlePhoneChange = (index, value) => {
        const updated = [...parents];
        updated[index].phone = value;
        setParents(updated);
    };

    useEffect(() => {
        if (emergency.sameAsAbove && parents.length > 0) {
            const firstParent = parents[0];
            setEmergency(prev => ({
                ...prev,
                emergencyFirstName: firstParent.parentFirstName || "",
                emergencyLastName: firstParent.parentLastName || "",
                emergencyPhoneNumber: firstParent.parentPhoneNumber || "",
                emergencyRelation: firstParent.relationToChild || "",
            }));
        }
    }, [emergency.sameAsAbove, parents]);

    const toDateOnly = (date) => {
        if (!date) return null;
        const [day, month, year] = date.split("/").map(Number);
        if (!day || !month || !year) return null;
        const d = new Date(year, month - 1, day);
        if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) return null;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  handleSubmit  –  Issues #47, #48, #49
    //  Payment is now split into TWO separate objects:
    //    1. `payment`         → GoCardless (franchisee) or AccessPaySuite (super-admin) — monthly subscription
    //    2. `starterPackPayment` → Stripe — starter pack charge always routed to HQ
    // ─────────────────────────────────────────────────────────────────────────

    const handleAfterBooking = async (result) => {
        console.log("Booking successful, now submitting comments if any...", result);
        const types = {
            commentType: "paid",
            serviceType: "weekly class"
        };
        try {
            console.log("Submitting comments tempComments:", tempComments);
            console.log("Submitting comments parentAdminId:", result?.data);
            if (tempComments.length > 0 && result?.data?.parentAdminId) {

                await submitAllComments(tempComments, result.data.parentAdminId, types);
                setTempComments([]);
            }
        } catch (err) {
            console.error("Comment submit failed:", err);
        }
    };
    const handleSubmit = async (finalpayload) => {
        console.log('finalpayload', finalpayload)
        const filteredPayment = Object.fromEntries(
            Object.entries(payment || {}).filter(
                ([, value]) => value !== null && value !== "" && value !== undefined
            )
        );

        // Transform payment fields
        const transformedPayment = { ...filteredPayment };

        // Handle expiry date
        if (transformedPayment.expiryDate || transformedPayment["expiry date"]) {
            const rawExpiry =
                transformedPayment.expiryDate || transformedPayment["expiry date"];
            transformedPayment.expiryDate = rawExpiry.replace("/", ""); // "12/12" -> "1212"
            delete transformedPayment["expiry date"]; // remove old key if exists
        }

        // Handle PAN
        if (transformedPayment.pan) {
            transformedPayment.pan = transformedPayment.pan.replace(/\s+/g, ""); // remove spaces
        }


        setIsSubmitting(true);
        const { totalToday, breakdown } = calculateAmount(selectedDate) || {};
        if (!breakdown) return;

        const proRataToSend = breakdown.isFullMonthCharge
            ? 0
            : breakdown.finalProRataCost;

        const paymentData =
            Object.keys(filteredPayment).length > 0
                ? isFranchisee
                    ? {
                        paymentType: "bank",
                        firstName: filteredPayment.firstName,
                        lastName: filteredPayment.lastName,
                        email: filteredPayment.email,
                        account_number: filteredPayment.account_number,
                        branch_code: filteredPayment.branch_code,
                        account_holder_name: filteredPayment.account_holder_name,
                        authorise: filteredPayment.authorise,
                        price: breakdown.nextMonthPayment,
                        proRataAmount: proRataToSend,
                    }
                    : {
                        paymentType: "accesspaysuite",
                        firstName: filteredPayment.firstName,
                        lastName: filteredPayment.lastName,
                        email: filteredPayment.email || parents[0].parentEmail,
                        line1: filteredPayment.line1,
                        city: filteredPayment.city,
                        postcode: filteredPayment.postalCode,
                        account_number: filteredPayment.account_number,
                        branch_code: filteredPayment.branch_code,
                        account_holder_name: filteredPayment.account_holder_name,
                        authorise: filteredPayment.authorise,
                        price: breakdown.nextMonthPayment,
                        calculateAmount: totalToday,
                        proRataAmount: proRataToSend,
                    }
                : null;
        const validStudentIds = students
            .map((s) => s.id)
            .filter(Boolean);

        const cleanedParents = parents.map((p) => ({
            ...p,
            studentIds: (p.studentIds || []).filter(id =>
                validStudentIds.includes(id)
            )
        }));
        const payload = {
            venueId: singleClassSchedulesOnly?.venue?.id,
            startDate: selectedDate,
            totalStudents: students.length,
            keyInformation: selectedKeyInfo,

            students: students.map((s, index) => {
                const { studentStatus, selectedClassData, ...rest } = s; // ❌ remove this field

                return {
                    ...rest,
                    dateOfBirth: toDateOnly(s.dateOfBirth),
                    classScheduleId: s.selectedClassId || s.selectedClassData?.id || singleClassSchedulesOnly?.id,
                };
            }),

            parents: parents.map(({ id, ...rest }) =>
                studentRemoved ? rest : { id, ...rest }  // ✅
            ),
            starterPack:
                singleClassSchedulesOnly?.venue?.starterPack &&
                    comesFrom !== "cancellation"
                    ? Number(membershipPlan?.starterPackPrice || 0)
                    : 0,
            discountId: appliedDiscount?.data?.discountId || null,
            emergency: studentRemoved
                ? (({ id, ...rest }) => rest)(emergency)
                : emergency,

            paymentPlanId: membershipPlan?.value ?? null,

            ...(paymentData && {
                payment: {
                    ...paymentData,
                    nameOnCard: finalpayload?.cardDetails?.nameOnCard?.trim(),
                    cardNumber: finalpayload?.cardDetails?.cardNumber?.replace(/\s+/g, ''), // ✅ FIX
                    expiryDate: finalpayload?.cardDetails?.expiryDate,
                    cvc: finalpayload?.cardDetails?.cvc,
                    country: finalpayload?.cardDetails?.country,
                    zipCode: finalpayload?.cardDetails?.zipCode
                }
            }),
        };

        // return;
        try {
            let res;

            if (comesFrom === "trials") {
                res = await createBookMembershipByfreeTrial(payload, TrialData.id);
            }
            else if (comesFrom === "waitingList") {
                res = await createBookMembershipByWaitingList(payload, TrialData.id);
            }
            else if (leadId) {
                res = await createBookMembership(payload, leadId);
            }
            else if (comesFrom === "cancellation") {
                const updatedPayload = {
                    ...payload,
                    oldBookingId: TrialData.id,
                };

                res = await createBookMembershipbyCancellation(updatedPayload);
            }
            else {
                res = await createBookMembership(payload);
            }

            // ✅ SINGLE POINT PE COMMENTS HIT
            console.log("Booking successful, now submitting comments if any...", res);
            await handleAfterBooking(res);
            navigate(`/weekly-classes/all-members/list`);
        }
        catch (error) {
            console.error("Booking submitted. Confirmation may be delayed due to network issues. Check your email shortly", error);
        } finally {
            setIsSubmitting(false);
            setStudentRemoved(false);
        }

        // console.log("Final Payload:", JSON.stringify(payload, null, 2));
        // send to API with fetch/axios
    };

    const handleClick = (val) => {
        if (val === 'AC') { setExpression(''); setResult(''); }
        else if (val === '⌫') { setExpression((prev) => prev.slice(0, -1)); }
        else if (val === '=') {
            try {
                const evalResult = evaluate(expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'));
                setResult(evalResult.toLocaleString());
            } catch { setResult('Error'); }
        } else if (val === '±') {
            if (result) {
                const toggled = parseFloat(result.replace(/,/g, '')) * -1;
                setExpression(toggled.toString()); setResult(toggled.toLocaleString());
            } else if (expression) {
                const match = expression.match(/(-?\d+\.?\d*)$/);
                if (match) {
                    const number = match[0];
                    const toggled = parseFloat(number) * -1;
                    setExpression((prev) => prev.replace(new RegExp(`${number}$`), toggled.toString()));
                }
            }
        } else { setExpression((prev) => prev + val); setResult(''); }
    };

    const renderExpression = () => {
        const tokens = expression.split(/([+\u2212×÷%])/g);
        return tokens.map((token, i) => {
            const isOperator = ['+', '−', '×', '÷', '%'].includes(token);
            return <span key={i} className={isOperator ? 'text-[#F94D5C]' : ''}>{token || 0}</span>;
        });
    };

    const handleClickOutside = (e) => {
        if (
            (activePopup === 1 && popup1Ref.current && !popup1Ref.current.contains(e.target) && img1Ref.current && !img1Ref.current.contains(e.target)) ||
            (activePopup === 2 && popup2Ref.current && !popup2Ref.current.contains(e.target) && img2Ref.current && !img2Ref.current.contains(e.target)) ||
            (activePopup === 3 && popup3Ref.current && !popup3Ref.current.contains(e.target) && img3Ref.current && !img3Ref.current.contains(e.target))
        ) { togglePopup(null); }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePopup]);

    useEffect(() => { console.log("Emergency STATE:", emergency); }, [emergency]);

    useEffect(() => {
        if (singleClassSchedulesOnly?.venue?.paymentGroups?.length > 0) {
            const cleanedPlans = singleClassSchedulesOnly.venue.paymentGroups[0].paymentPlans?.map(plan => ({
                id: plan.id, title: plan.title, price: plan.price, interval: plan.interval,
                students: plan.students, duration: plan.duration,
                starterPackPrice: singleClassSchedulesOnly?.starterPack?.[0]?.price || 0,
                holidayCampPackage: plan.HolidayCampPackage, termsAndCondition: plan.termsAndCondition,
            }));
            setSelectedPlans(cleanedPlans);
        }
    }, [singleClassSchedulesOnly]);

    const buttons = [
        ['AC', '±', '%', '÷'],
        ["7", "8", "9", "×"],
        ["4", "5", "6", "−"],
        ["1", "2", "3", "+"],
        ["", "0", ".", "="],
    ];

    const relationOptions = [
        { value: "Mother", label: "Mother" },
        { value: "Father", label: "Father" },
        { value: "Guardian", label: "Guardian" },
    ];

    const interestReasonOptions = [
        { value: "To build my child's confidence", label: "To build my child's confidence" },
        { value: "To improve their technical football skills", label: "To improve their technical football skills" },
        { value: "Because my child loves football", label: "Because my child loves football" },
        { value: "To help my child make friends and build social skills", label: "To help my child make friends and build social skills" },
        { value: "To keep my child active and healthy", label: "To keep my child active and healthy" },
        { value: "High-quality coaching in a fun, positive environment", label: "High-quality coaching in a fun, positive environment" },
        { value: "Other", label: "Other" },
    ];

    const hearOptions = [
        { value: "Google", label: "Google" },
        { value: "Facebook", label: "Facebook" },
        { value: "Instagram", label: "Instagram" },
        { value: "Friend", label: "Friend" },
        { value: "Flyer", label: "Flyer" },
    ];

    const fetchComments = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/list`, {
                method: "GET", headers: { Authorization: `Bearer ${token}` },
            });
            const resultRaw = await response.json();
            setCommentsList(resultRaw.data || []);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            showError(error.message || "Failed to fetch comments. Please try again later.");
        }
    }, []);

    const handleFinalSubmit = async () => {
        // setLoading(true);
        try {
            const finalPayload = {
                directDebit: directDebitData,
                cardDetails: {
                    nameOnCard,
                    cardNumber,
                    expiryDate,
                    cvc,
                    country: checkoutCountry,
                    zipCode,
                }
            };

            await handleSubmit(finalPayload);
        } finally {
            // setLoading(false);
        }
    };

    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        const newComment = {
            comment, createdAt: new Date().toISOString(),
            bookedByAdmin: {
                firstName: adminInfo?.firstName || "Admin",
                lastName: adminInfo?.lastName || "",
                profile: adminInfo?.profile || "/members/dummyuser.png"
            }
        };
        setTempComments((prev) => [newComment, ...prev]);
        setComment('');
    };

    function stripHtml(html) {
        if (!html) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || "";
    }

    function htmlToHtmlArray(html) {
        if (!html) return [];
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const liItems = Array.from(tempDiv.querySelectorAll("li")).map(li => li.innerHTML.trim()).filter(h => h !== "");
        if (liItems.length > 0) return liItems;
        const blockItems = Array.from(tempDiv.querySelectorAll("p, div")).map(p => p.innerHTML.trim()).filter(h => h !== "");
        if (blockItems.length > 0) return blockItems;
        const plainText = tempDiv.innerHTML.trim();
        if (plainText) return plainText.split(/\n+/).map(t => t.trim()).filter(t => t !== "");
        return [];
    }

    const membershipKeyInfo = Array.isArray(keyInfoData)
        ? keyInfoData.find(item => item.serviceType === 'membership')?.keyInformationRaw
        : keyInfoData?.keyInformationRaw;

    const keyInfoArray = htmlToHtmlArray(membershipKeyInfo);
    const keyInfoOptions = keyInfoArray.map((item) => ({ value: item, label: item }));

    const genderOptions = [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
    ];

    const sessionDates = singleClassSchedulesOnly?.venue?.termGroups?.flatMap(group =>
        group.terms.flatMap(term => term.sessionsMap.map(s => s.sessionDate))
    ) || [];

    const selectedLabel = keyInfoOptions.find((opt) => opt.value === selectedKeyInfo)?.label || "Key Information";
    const sessionDatesSet = new Set(sessionDates);

    useEffect(() => {
        if (selectedDate && membershipPlan) calculateAmount(selectedDate);
    }, [numberOfStudents, membershipPlan, selectedDate]);

    useEffect(() => {
        if (hasInitialized.current || !sessionDatesSet || sessionDatesSet.size === 0) return;
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const allDates = Array.from(sessionDatesSet).map(dateStr => new Date(dateStr))
            .filter(d => { const date = new Date(d); date.setHours(0, 0, 0, 0); return date >= todayDate; })
            .sort((a, b) => a - b);
        if (allDates.length === 0) return;
        const earliestDate = allDates[0];
        setCurrentDate(new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1));
        hasInitialized.current = true;
    }, [sessionDatesSet]);

    const calculateAmount = (startDate) => {
        if (!membershipPlan || !startDate) return;

        const monthlyPrice = Number(membershipPlan?.all?.price ?? 0);
        const starterPack = comesFrom !== "cancellation" && singleClassSchedulesOnly?.venue?.starterPack
            ? Number(membershipPlan?.starterPackPrice || 0)
            : 0;

        const parseLocalDate = (dateStr) => {
            const [y, m, d] = dateStr.split("-").map(Number);
            return new Date(y, m - 1, d);
        };

        const selected = parseLocalDate(startDate);
        selected.setHours(0, 0, 0, 0);

        const allSessions = Array.from(sessionDatesSet).map((d) => {
            const date = parseLocalDate(d);
            date.setHours(0, 0, 0, 0);
            return date;
        });

        const selectedMonth = selected.getMonth();
        const selectedYear = selected.getFullYear();

        const sessionsInStartMonth = allSessions
            .filter(d => d.getMonth() === selectedMonth && d.getFullYear() === selectedYear)
            .sort((a, b) => a - b);

        const firstSessionDate = sessionsInStartMonth[0];
        const isFirstSessionSelected = firstSessionDate && selected.getTime() === firstSessionDate.getTime();
        const remainingSessions = sessionsInStartMonth.filter(d => d.getTime() >= selected.getTime());
        const proRataLessons = remainingSessions.length;
        const pricePerLesson = membershipPlan?.all?.priceLesson || 0;
        const proRataCost = Number((proRataLessons * pricePerLesson).toFixed(2));
        const safeProRataCost = Math.min(proRataCost, monthlyPrice);
        const isFullMonth = (isFirstSessionSelected && proRataLessons >= 3) || safeProRataCost >= monthlyPrice;

        let finalProRata = safeProRataCost;
        if (!isFullMonth && proRataDiscountData?.finalProRata != null) finalProRata = proRataDiscountData.finalProRata;

        const isProRataApplicableForPreview = !isFirstSessionSelected && sessionsInStartMonth.length > 3;
        const effectiveLessonCharge = !pricingBreakdown.isFullMonthCharge ? finalProRata : monthlyPrice;

        let starterDiscountAmount = 0;
        if (isApplied && appliedDiscount?.data) {
            if (appliedDiscount.data.type === "percentage")
                starterDiscountAmount = (starterPack * Number(appliedDiscount.data.value)) / 100;
            else
                starterDiscountAmount = Number(appliedDiscount.data.discountAmount || 0);
        }

        const totalBeforeDiscount = effectiveLessonCharge + starterPack;
        const finalTotal = Math.max(totalBeforeDiscount - starterDiscountAmount, 0);
        const totalToday = Number(finalTotal.toFixed(2));
        const nextMonthPayment = Number(monthlyPrice.toFixed(2));

        const breakdown = {
            pricePerClassPerChild: pricePerLesson,
            numberOfLessonsProRated: proRataLessons,
            costOfProRatedLessons: safeProRataCost,
            finalProRataCost: finalProRata,
            starterPack,
            starterDiscount: starterDiscountAmount,
            totalBeforeDiscount,
            totalAmountToday: totalToday,
            nextMonthPayment,
            isFullMonthCharge: isFullMonth,
            isProRataApplicableForPreview,
            stripeAmount: Math.max(starterPack - starterDiscountAmount, 0),
            goCardlessAmount: Math.max(effectiveLessonCharge, 0),
        };

        setRemainingLessons(proRataLessons);
        setCalculatedAmount(totalToday);
        setPricingBreakdown(breakdown);

        return { totalToday, breakdown };
    };

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) { setIsChecked(true); setIsApplied(false); return; }
        setIsChecked(true); setIsDiscountLoading(true);
        const payload = { starterPack: singleClassSchedulesOnly?.starterPack?.[0]?.price || 0, code: discountCode };
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/apply-discount`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (response.ok && result?.status) { setAppliedDiscount(result); setIsApplied(true); }
            else { setAppliedDiscount(null); setIsApplied(false); }
        } catch (error) { console.error("Error:", error); setIsApplied(false); }
        finally { setIsDiscountLoading(false); }
    };

    const handleApplyProRataDiscount = async () => {
        const proRataCost = pricingBreakdown?.costOfProRatedLessons || 0;
        if (!proRataCode.trim()) { setIsProRataChecked(true); setIsProRataApplied(false); return; }
        setIsProRataLoading(true);
        const payload = { proRata: proRataCost, code: proRataCode };
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/apply-discount`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            setIsProRataChecked(true);
            if (response.ok && result?.status) {
                setProRataDiscountData({ ...result, finalProRata: result?.data?.finalPrice ?? proRataCost });
                setIsProRataApplied(true);
            } else { setProRataDiscountData(null); setIsProRataApplied(false); }
        } catch (error) { console.error("Error:", error); setIsProRataApplied(false); setIsProRataChecked(true); }
        finally { setIsProRataLoading(false); }
    };

    const handleRemoveStudent = (indexToRemove) => {
        setStudents((prevStudents) => {
            const updatedStudents = prevStudents.filter((_, i) => i !== indexToRemove);
            setNumberOfStudents(updatedStudents.length);
            return updatedStudents;
        });
        setStudentRemoved(true);
    };

    const handleResetDiscount = () => { setDiscountCode(""); setIsApplied(false); setAppliedDiscount(null); };
    const handleResetProRataDiscount = () => { setProRataCode(""); setIsProRataChecked(false); setIsProRataApplied(false); setProRataDiscountData(null); };

    const renderContent = (content) => (
        <div className="text-gray-800 prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    );

    useEffect(() => { if (selectedDate) calculateAmount(selectedDate); }, [selectedDate, isApplied, proRataDiscountData]);
    useEffect(() => { if (selectedDate && membershipPlan) calculateAmount(selectedDate); }, [isApplied, appliedDiscount]);

    const finalAmount = appliedDiscount?.data?.finalPrice ?? singleClassSchedulesOnly?.starterPack?.[0]?.price;

    if (loading) return <Loader />;

    // ── Issue #47: Payment routing badge helper ──────────────────
    const PaymentRoutingBadge = () => (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 mb-4">
            <p className="font-bold mb-1 text-[13px]">💳 Payment Routing</p>
            <div className="grid grid-cols-2 gap-1">
                <span className="text-gray-600">Monthly subscription:</span>
                <span className="font-semibold">
                    {isFranchisee ? "GoCardless → Franchisee" : "AccessPaySuite →  Head Office"}
                </span>
                <span className="text-gray-600">Starter pack:</span>
                <span className="font-semibold text-green-700">Stripe → Head Office</span>
                {!pricingBreakdown.isFullMonthCharge && (
                    <>
                        <span className="text-gray-600">Pro-rata payments:</span>
                        <span className="font-semibold text-green-700">
                            {isFranchisee ? "GoCardless → Franchisee" : "AccessPaySuite → Head Office"}
                        </span>
                    </>
                )}
                {IS_SANDBOX && (
                    <>
                        <span className="text-gray-600">Mode:</span>
                        <span className="font-semibold text-orange-600">🧪 Sandbox</span>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="pt-1 bg-gray-50 min-h-screen">
            <div className={`flex pe-4 justify-between items-center mb-4 ${openForm ? 'md:w-3/4' : 'w-full'}`}>
                <h2
                    onClick={() => {
                        if (comesFrom && comesFrom.toLowerCase() === "trials") navigate("/weekly-classes/trial/list");
                        else if (from_lead === "yes" || from_lead === "leadDatabase") navigate("/weekly-classes/central-leads");
                        else navigate("/weekly-classes/find-a-class");
                    }}
                    className="text-xl md:text-2xl font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                    <img src="/images/icons/arrow-left.png" alt="Back" className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="truncate">Book a Membership</span>
                </h2>

                <div className="flex gap-3 relative items-center">
                    <img ref={img1Ref} src="/members/booktrial1.png"
                        className={`rounded-full hover:bg-[#0DD180] transition cursor-pointer ${activePopup === 1 ? 'bg-[#0DD180]' : 'bg-[#34353B]'}`}
                        onClick={() => togglePopup(1)}
                    />
                    {activePopup === 1 && (
                        <div ref={popup1Ref} className="absolute min-w-[850px] bg-opacity-30 flex right-2 items-center top-15 justify-center z-50">
                            <div className="flex items-center justify-center w-full px-2 py-6 sm:px-2 md:py-2">
                                <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E1E5] pb-4 mb-4 gap-2">
                                        <h2 className="font-semibold text-[20px] sm:text-[24px]">Payment Plan Preview</h2>
                                        <button><img src="/images/icons/cross.png" onClick={() => togglePopup(null)} alt="close" className="w-5 h-5" /></button>
                                    </div>
                                    <PlanTabs selectedPlans={selectedPlans} />
                                </div>
                            </div>
                        </div>
                    )}

                    <img ref={img2Ref} onClick={() => togglePopup(2)} src="/members/booktrial2.png"
                        className={`rounded-full hover:bg-[#0DD180] transition cursor-pointer ${activePopup === 2 ? 'bg-[#0DD180]' : 'bg-[#34353B]'}`}
                        alt=""
                    />
                    {activePopup === 2 && (
                        <div ref={popup2Ref} className="absolute right-0 top-20 z-50 flex items-center justify-center min-w-[320px]">
                            <div className="bg-[#464C55] rounded-2xl p-4 w-[468px] shadow-2xl text-white">
                                <div className="text-right min-h-[80px] mb-4">
                                    <div className="text-[24px] text-gray-300 break-words">{renderExpression()}</div>
                                    <div className="text-[56px] font-bold text-white leading-snug">{result !== "" && result}</div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {buttons.flat().map((btn, i) => {
                                        const isOperator = ['÷', '±', '×', '−', '+', '%', '=', 'AC'].includes(btn);
                                        const iconMap = { '÷': '/calcIcons/divide.png', '%': '/calcIcons/percentage.png', '⌫': '/calcIcons/np.png', '×': '/calcIcons/multiply.png', '−': '/calcIcons/sub.png', '+': '/calcIcons/add.png', '=': '/calcIcons/equal.png', '±': '/calcIcons/NP.png' };
                                        const showRed = ['+', '−', '×', '÷', '%'].includes(btn) && expression.includes(btn);
                                        return (
                                            <button key={i} onClick={() => btn && handleClick(btn)}
                                                className={`py-4 rounded-2xl text-[36px] font-semibold flex items-center justify-center h-16 transition-all duration-150 ${isOperator ? 'bg-[#81858B] text-white' : 'bg-white text-black hover:bg-gray-100'} ${showRed ? 'text-[#F94D5C]' : ''} ${btn === '' ? 'opacity-0 pointer-events-none' : ''}`}
                                            >
                                                {iconMap[btn] ? <img src={iconMap[btn]} alt={btn} className="w-5 h-5 object-contain" /> : btn}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <img ref={img3Ref} src="/members/booktrial3.png" alt="" onClick={() => togglePopup(3)}
                        className={`rounded-full hover:bg-[#0DD180] transition cursor-pointer ${activePopup === 3 ? 'bg-[#0DD180]' : 'bg-[#34353B]'}`}
                    />
                    {activePopup === 3 && (
                        <div ref={popup3Ref} className="absolute top-full z-50 mt-2 right-0 w-[300px] p-4 bg-white rounded-2xl shadow-lg text-sm text-[#34353B]">
                            <div className="font-semibold mb-2 text-[18px]">Phone Script</div>
                            <textarea readOnly className="w-full min-h-[100px] resize-none text-[16px] leading-relaxed bg-transparent focus:outline-none"
                                defaultValue="In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface."
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="md:flex w-full gap-4">
                {/* ── LEFT COLUMN ── */}
                <div className="md:min-w-[508px] md:max-w-[508px] text-base space-y-5" ref={infoRef}>
                    <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm">
                        <h2 className="text-[24px] font-semibold">Information</h2>
                        <div>
                            <label className="text-base font-semibold">Venue</label>
                            <div className="relative mt-2">
                                {startmembership === "startmembership" || comesFrom == "cancellation" ? (
                                    <select
                                        value={selectedVenue?.id || ""}
                                        onChange={(e) => {
                                            const venue = venues.find(v => v.id === Number(e.target.value));

                                            setSelectedVenue(venue);

                                            // 👇 get classScheduleId from selected venue
                                            if (venue?.classSchedules?.length > 0) {
                                                setSelectedClassId(venue.classSchedules[0].id); // or based on your logic
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                                    >
                                        <option value="">Select venue</option>

                                        {venues.map((venue) => (
                                            <option key={venue.id} value={venue.id}>
                                                {venue.name} ({venue.area})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={singleClassSchedulesOnly?.venue?.name || ""}
                                        readOnly
                                        placeholder="Select venue"
                                        className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                                    />
                                )}
                                <FiSearch className="absolute left-3 top-4 text-[20px]" />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className="text-base font-semibold">Number of students</label>
                            <input type="number" value={numberOfStudents || ""} onChange={handleNumberChange} min={1} max={4}
                                placeholder="Choose number of students"
                                className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 mt-2 focus:outline-none"
                            />
                        </div>
                        <div className="mb-5">
                            <label className="text-base font-semibold">Membership Plan</label>
                            <Select options={paymentPlanOptions} value={membershipPlan}
                                onChange={(plan) => {
                                    handlePlanChange(plan);
                                    clearError("membershipPlan");
                                }}
                                placeholder="Choose Plan" className="mt-2" classNamePrefix="react-select" isClearable isDisabled={!numberOfStudents}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        borderColor: fieldErrors["membershipPlan"] ? "#ef4444" : base.borderColor,
                                        "&:hover": {
                                            borderColor: fieldErrors["membershipPlan"] ? "#ef4444" : base.borderColor,
                                        },
                                        boxShadow: state.isFocused && fieldErrors["membershipPlan"] ? "0 0 0 1px #ef4444" : base.boxShadow,
                                    }),
                                }}
                            />
                            <ErrorMsg name="membershipPlan" />
                        </div>
                        {singleClassSchedulesOnly?.venue?.starterPack && comesFrom !== 'cancellation' && (
                            <div className="mb-5">
                                <label className="text-base font-semibold poppins">Starter Pack</label>
                                <input type="text" placeholder="Starter Pack"
                                    value={finalAmount !== null && finalAmount !== undefined ? `£${finalAmount}` : ""}
                                    readOnly className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 mt-2 focus:outline-none"
                                />
                            </div>
                        )}
                        {singleClassSchedulesOnly?.venue?.starterPack && comesFrom !== 'cancellation' && (
                            <div className="mb-5">
                                <label className="text-base font-semibold">Discount Code</label>
                                <div className="relative">
                                    <input type="text" value={discountCode}
                                        onChange={(e) => { setDiscountCode(e.target.value); setIsApplied(false); setAppliedDiscount(null); }}
                                        placeholder="Enter Discount Code"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-3 pr-20"
                                    />
                                    {discountCode && (
                                        <button onClick={handleResetDiscount} className="absolute top-1/2 right-[90px] -translate-y-1/2 text-gray-400 hover:text-red-500">✕</button>
                                    )}
                                    <div className="absolute top-[4px] right-1">
                                        <button onClick={handleApplyDiscount} disabled={isDiscountLoading}
                                            className={`px-5 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm ${isDiscountLoading ? "bg-[#0098d9] text-white cursor-not-allowed" : "bg-[#003997] text-white hover:bg-gray-900 active:scale-95"}`}
                                        >
                                            {isDiscountLoading ? "Applying..." : "Apply"}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    {isDiscountLoading && <p className="text-blue-500 mt-3">Checking...</p>}
                                    {isChecked && isApplied && !isDiscountLoading && <p className="text-green-600 mt-2">✅ {appliedDiscount.message}</p>}
                                    {isChecked && !isApplied && !isDiscountLoading && <p className="text-red-600 mt-3">❌ Invalid Discount Code</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Calendar */}
                    <div className={`space-y-3 bg-white p-6 rounded-3xl shadow-sm ${fieldErrors["selectedDate"] ? "border-2 border-red-500 bg-red-50" : ""}`}>
                        <h2 className="text-[24px] font-semibold">Select start date</h2>
                        <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                            <div className="flex justify-center gap-5 items-center mb-3">
                                <div className="relative group">
                                    <button onClick={membershipPlan ? goToPreviousMonth : undefined}
                                        className={`w-8 h-8 rounded-full border border-black flex items-center justify-center ${!membershipPlan ? "bg-white text-black opacity-40 cursor-not-allowed" : "bg-white text-black hover:bg-black hover:text-white"}`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    {!membershipPlan && <span className="absolute hidden group-hover:block bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">Please select membership plan first</span>}
                                </div>
                                <p className="font-semibold text-[20px]">{currentDate.toLocaleString("default", { month: "long" })} {year}</p>
                                <div className="relative group">
                                    <button onClick={membershipPlan ? goToNextMonth : undefined}
                                        className={`w-8 h-8 rounded-full border border-black flex items-center justify-center ${!membershipPlan ? "bg-white text-black opacity-40 cursor-not-allowed" : "bg-white text-black hover:bg-black hover:text-white"}`}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    {!membershipPlan && <span className="absolute hidden group-hover:block bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">Please select membership plan first</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-7 text-xs gap-1 text-[18px] text-gray-500 mb-1">
                                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                                    <div key={i} className="font-medium text-center">{day}</div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1">
                                {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                                    const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);
                                    return (
                                        <div key={weekIndex} className="grid grid-cols-7 text-[18px] gap-1 py-1 rounded">
                                            {week.map((date, i) => {
                                                if (!date) return <div key={i} />;
                                                const formattedDate = formatLocalDate(date);
                                                const isAvailable = membershipPlan && sessionDatesSet.has(formattedDate);
                                                const isSelected = isSameDate(date, selectedDate);
                                                const todayDate = new Date();
                                                todayDate.setHours(0, 0, 0, 0);
                                                const current = new Date(date);
                                                current.setHours(0, 0, 0, 0);
                                                const isPastAvailable = isAvailable && current < todayDate;
                                                return (
                                                    <div key={i} className="relative group">
                                                        <div onClick={() => {
                                                            if (isAvailable) {
                                                                handleDateClick(date);
                                                                clearError("selectedDate");
                                                            }
                                                        }}
                                                            className={`w-8 h-8 flex text-[18px] items-center justify-center mx-auto text-base rounded-full ${!membershipPlan ? "cursor-not-allowed opacity-40 bg-white" : isPastAvailable ? "bg-red-200 text-red-700 cursor-not-allowed" : isAvailable ? "cursor-pointer bg-sky-200" : "cursor-not-allowed opacity-40 bg-white"} ${isSelected ? "selectedDate text-white font-bold" : ""}`}
                                                        >
                                                            {date.getDate()}
                                                        </div>
                                                        {!membershipPlan && <span className="absolute hidden group-hover:block bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">Please select membership plan first</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Plan Breakdown */}
                    <div className="w-full max-w-xl mx-auto">
                        <button type="button" disabled={!membershipPlan} onClick={() => setIsOpenMembership(!isOpenMembership)}
                            className={`bg-[#237FEA] text-white text-[18px] font-semibold border w-full border-[#237FEA] px-6 py-3 rounded-lg flex items-center justify-center ${membershipPlan ? "bg-[#237FEA] border border-[#237FEA]" : "bg-gray-400 border-gray-400 cursor-not-allowed"}`}
                        >
                            Membership Plan Breakdown
                            <img src={isOpenMembership ? "/members/dash.png" : "/members/add.png"} alt={isOpenMembership ? "Collapse" : "Expand"} className="ml-2 w-5 h-5 inline-block" />
                        </button>

                        {isOpenMembership && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                                className="bg-white mt-4 rounded-2xl shadow p-6 font-semibold space-y-4 text-[16px]"
                            >
                                <div className="flex justify-between text-[#333]">
                                    <span>Membership Plan</span>
                                    <span>{membershipPlan?.all?.duration} {membershipPlan?.all?.interval}{membershipPlan?.all?.duration > 1 ? "s" : ""}</span>
                                </div>
                                {membershipPlan?.all?.duration > 1 && (
                                    <div className="flex justify-between text-[#333]">
                                        <span>Monthly Payment</span>
                                        <span>£{pricingBreakdown?.nextMonthPayment?.toFixed(2)} p/m</span>
                                    </div>
                                )}
                                {singleClassSchedulesOnly?.venue?.starterPack && comesFrom !== 'cancellation' && (
                                    <div className="flex justify-between text-[#333]">
                                        <span>Starter Pack <span className="text-xs text-green-700 font-normal">(via Stripe →  Head Office)</span></span>
                                        <span className="text-right">
                                            {isApplied && appliedDiscount?.data ? (
                                                <>
                                                    <div className="line-through text-gray-400 text-sm">£{membershipPlan?.starterPackPrice?.toFixed(2)}</div>
                                                    <div className="text-green-600 font-semibold">£{appliedDiscount.data.finalPrice}</div>
                                                </>
                                            ) : `£${pricingBreakdown?.starterPack?.toFixed(2)}`}
                                        </span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <div className="flex justify-between text-[#333]">
                                        <span>Price Per Lesson</span>
                                        <span>£{pricingBreakdown.pricePerClassPerChild}</span>
                                    </div>
                                    {pricingBreakdown.isFullMonthCharge && (
                                        <div className="flex justify-between text-[#000]">
                                            <span>Full Monthly Charge</span>
                                            <span>£{pricingBreakdown.nextMonthPayment?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {!pricingBreakdown.isFullMonthCharge && (
                                        <>
                                            <div className="mb-5">
                                                <label className="text-base font-semibold">Pro-Rata Discount Code</label>
                                                <div className="relative mt-2">
                                                    <input type="text" placeholder="Enter Pro-Rata Code" value={proRataCode}
                                                        onChange={(e) => { setProRataCode(e.target.value); setIsProRataChecked(false); setIsProRataApplied(false); setProRataDiscountData(null); }}
                                                        className="w-full border border-gray-300 rounded-xl px-3 py-3 pr-20"
                                                    />
                                                    {proRataCode && <button onClick={handleResetProRataDiscount} className="absolute top-1/2 right-[90px] -translate-y-1/2 text-gray-400 hover:text-red-500">✕</button>}
                                                    <button onClick={handleApplyProRataDiscount} disabled={isProRataLoading}
                                                        className={`absolute top-1 right-1 px-4 py-2 rounded-xl text-white ${isProRataLoading ? "bg-green-400" : "bg-green-600"}`}
                                                    >
                                                        {isProRataLoading ? "Applying..." : "Apply"}
                                                    </button>
                                                </div>
                                                {isProRataChecked && isProRataApplied && <p className="text-green-600">✅ Applied</p>}
                                                {isProRataChecked && !isProRataApplied && <p className="text-red-600">❌ Invalid</p>}
                                            </div>
                                            <div className="flex justify-between text-[#333]">
                                                <span>Number of Pro-Rata Lessons</span>
                                                <span>{pricingBreakdown.numberOfLessonsProRated}</span>
                                            </div>
                                            <div className="flex justify-between text-[#000]">
                                                <span>Total Pro-Rata Cost</span>
                                                <span>£{pricingBreakdown.finalProRataCost?.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between text-[#000] text-[18px] font-bold">
                                        <span>Total Due Today</span>
                                        <span>£{pricingBreakdown.totalAmountToday?.toFixed(2)}</span>
                                    </div>
                                    {membershipPlan?.all?.duration > 1 && (
                                        <div className="flex justify-between text-[#666] text-[14px] mt-2 font-normal">
                                            <span>Then monthly</span>
                                            <span>£{pricingBreakdown.nextMonthPayment?.toFixed(2)} p/m</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="flex-1 bg-white transition-all duration-300">
                    <div className="max-w-full mx-auto bg-[#f9f9f9] px-6">
                        <div className="space-y-10">
                            {students.map((student, index) => (
                                <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}
                                    ref={(el) => (studentRefs.current[index] = el)}
                                    className="bg-white p-6 rounded-3xl shadow-sm space-y-6 relative"
                                >
                                    {students.length > 1 && (
                                        <button onClick={() => handleRemoveStudent(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl">✕</button>
                                    )}
                                    <h2 className="text-[20px] font-semibold">Student {index > 0 ? `${index + 1} ` : ''}Information</h2>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">First name</label>
                                            <input className={fieldClass(`student_${index}_studentFirstName`)} placeholder="Enter first name"
                                                value={student.studentFirstName}
                                                onChange={(e) => {
                                                    handleInputChange(index, 'studentFirstName', e.target.value);
                                                    clearError(`student_${index}_studentFirstName`);
                                                }}
                                            />
                                            <ErrorMsg name={`student_${index}_studentFirstName`} />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Last name</label>
                                            <input className={fieldClass(`student_${index}_studentLastName`)} placeholder="Enter last name"
                                                value={student.studentLastName}
                                                onChange={(e) => {
                                                    handleInputChange(index, 'studentLastName', e.target.value);
                                                    clearError(`student_${index}_studentLastName`);
                                                }}
                                            />
                                            <ErrorMsg name={`student_${index}_studentLastName`} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Date of Birth</label>
                                            <input type="text" value={student.dateOfBirth || ""} onChange={(e) => {
                                                handleDOBChange(index, e.target.value);
                                                clearError(`student_${index}_dateOfBirth`);
                                            }}
                                                placeholder="DD/MM/YYYY (e.g. 15/10/2026)" maxLength={10}
                                                className={fieldClass(`student_${index}_dateOfBirth`)}
                                            />
                                            <ErrorMsg name={`student_${index}_dateOfBirth`} />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Age</label>
                                            <input type="text" value={student.age || ""} readOnly
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base" placeholder="Automatic entry"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Gender</label>
                                            <Select
                                                className="w-full mt-2 text-base"
                                                classNamePrefix="react-select"
                                                placeholder="Select gender"
                                                value={genderOptions.find((option) => option.value === student.gender) || null}
                                                onChange={(selectedOption) => {
                                                    handleInputChange(index, "gender", selectedOption ? selectedOption.value : "");
                                                    clearError(`student_${index}_gender`);
                                                }}
                                                options={genderOptions}
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        borderColor: fieldErrors[`student_${index}_gender`] ? "#ef4444" : base.borderColor,
                                                        "&:hover": {
                                                            borderColor: fieldErrors[`student_${index}_gender`] ? "#ef4444" : base.borderColor,
                                                        },
                                                        boxShadow: state.isFocused && fieldErrors[`student_${index}_gender`] ? "0 0 0 1px #ef4444" : base.boxShadow,
                                                    }),
                                                }}
                                            />
                                            <ErrorMsg name={`student_${index}_gender`} />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Medical information</label>
                                            <input type="text" placeholder="Enter medical info" value={student.medicalInformation || ""}
                                                onChange={(e) => {
                                                    handleInputChange(index, "medicalInformation", e.target.value);
                                                    clearError(`student_${index}_medicalInformation`);
                                                }}
                                                className={fieldClass(`student_${index}_medicalInformation`)}
                                            />
                                            <ErrorMsg name={`student_${index}_medicalInformation`} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Class</label>
                                            <Select
                                                className="w-full mt-2 text-base"
                                                classNamePrefix="react-select"
                                                placeholder="Select class"
                                                options={venueClassOptions}
                                                value={venueClassOptions.find((opt) => opt.value === student.selectedClassId) || null}
                                                onChange={(option) => {
                                                    handleStudentClassChange(index, option);
                                                    clearError(`student_${index}_selectedClassId`);
                                                }}
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        borderColor: fieldErrors[`student_${index}_selectedClassId`] ? "#ef4444" : base.borderColor,
                                                        "&:hover": {
                                                            borderColor: fieldErrors[`student_${index}_selectedClassId`] ? "#ef4444" : base.borderColor,
                                                        },
                                                        boxShadow: state.isFocused && fieldErrors[`student_${index}_selectedClassId`] ? "0 0 0 1px #ef4444" : base.boxShadow,
                                                    }),
                                                }}
                                            />
                                            <ErrorMsg name={`student_${index}_selectedClassId`} />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Time</label>
                                            <input type="text" readOnly
                                                value={student.selectedClassData ? `${student.selectedClassData.startTime} - ${student.selectedClassData.endTime}` : ""}
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3" placeholder="Automatic entry"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Parents */}
                        <div className="space-y-6">
                            {parents.map((parent, index) => (
                                <motion.div key={parent.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}
                                    ref={(el) => (parentRefs.current[index] = el)}
                                    className={`bg-white mb-10 p-6 rounded-3xl shadow-sm space-y-6 relative ${students.length < 1 ? "" : "mt-10"}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-[20px] font-semibold">{index === 0 ? "Parent information" : `Parent ${index + 1} information`}</h2>
                                        <div className="flex items-center gap-2">
                                            {index === 0 && (
                                                <button onClick={handleAddParent} disabled={parents.length >= 3}
                                                    className="text-white text-[14px] px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                                >Add Parent</button>
                                            )}
                                            {index > 0 && (
                                                <button onClick={() => handleRemoveParent(parent.id)} className="text-gray-500 hover:text-red-600"><X className="w-5 h-5" /></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">First name</label>
                                            <input className={fieldClass(`parent_${index}_parentFirstName`)} placeholder="Enter first name"
                                                value={parent.parentFirstName}
                                                onChange={(e) => {
                                                    handleParentChange(index, "parentFirstName", e.target.value.replace(/[^A-Za-z\s]/g, ""));
                                                    clearError(`parent_${index}_parentFirstName`);
                                                }}
                                                onKeyPress={(e) => { if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault(); }}
                                            />
                                            <ErrorMsg name={`parent_${index}_parentFirstName`} />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Last name</label>
                                            <input className={fieldClass(`parent_${index}_parentLastName`)} placeholder="Enter last name"
                                                value={parent.parentLastName}
                                                onChange={(e) => {
                                                    handleParentChange(index, "parentLastName", e.target.value.replace(/[^A-Za-z\s]/g, ""));
                                                    clearError(`parent_${index}_parentLastName`);
                                                }}
                                                onKeyPress={(e) => { if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault(); }}
                                            />
                                            <ErrorMsg name={`parent_${index}_parentLastName`} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Email</label>
                                            <input type="email" className={fieldClass(`parent_${index}_parentEmail`)} placeholder="Enter email address"
                                                value={parent.parentEmail}
                                                onChange={(e) => {
                                                    handleParentChange(index, "parentEmail", e.target.value);
                                                    clearError(`parent_${index}_parentEmail`);
                                                }}
                                            />
                                            <ErrorMsg name={`parent_${index}_parentEmail`} />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Phone number</label>
                                            <div className={fieldErrors[`parent_${index}_parentPhoneNumber`] ? "border border-red-500 rounded-xl bg-red-50" : ""}>
                                                <PhoneNumberInput value={parent.parentPhoneNumber}
                                                    onChange={(fullNumber) => {
                                                        handleParentChange(index, "parentPhoneNumber", fullNumber);
                                                        clearError(`parent_${index}_parentPhoneNumber`);
                                                    }}
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                            <ErrorMsg name={`parent_${index}_parentPhoneNumber`} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="w-full">
                                            <label className="block text-[16px] font-semibold">What's the main reason you're interested in Samba Soccer Schools?</label>
                                            {parent.isCustomReason ? (
                                                <div className="relative">
                                                    <input type="text" placeholder="Please specify" value={parent.interestReason || ""}
                                                        onChange={(e) => {
                                                            handleParentChange(index, "interestReason", e.target.value);
                                                            clearError(`parent_${index}_interestReason`);
                                                        }}
                                                        className={fieldClass(`parent_${index}_interestReason`)}
                                                    />
                                                    <button type="button" onClick={() => { handleParentChange(index, "interestReason", ""); handleParentChange(index, "isCustomReason", false); }}
                                                        className="absolute right-3 top-3/5 -translate-y-1/2 text-sm text-blue-600 font-medium"
                                                    >Select</button>
                                                </div>
                                            ) : (
                                                <Select
                                                    options={interestReasonOptions}
                                                    placeholder="Select a reason"
                                                    className="mt-2"
                                                    classNamePrefix="react-select"
                                                    value={interestReasonOptions.find((o) => o.value === parent.interestReason)}
                                                    onChange={(selected) => {
                                                        clearError(`parent_${index}_interestReason`);
                                                        if (selected.value === "Other") { handleParentChange(index, "interestReason", ""); handleParentChange(index, "isCustomReason", true); }
                                                        else { handleParentChange(index, "interestReason", selected.value); handleParentChange(index, "isCustomReason", false); }
                                                    }}
                                                    styles={{
                                                        control: (base, state) => ({
                                                            ...base,
                                                            borderColor: fieldErrors[`parent_${index}_interestReason`] ? "#ef4444" : base.borderColor,
                                                            "&:hover": {
                                                                borderColor: fieldErrors[`parent_${index}_interestReason`] ? "#ef4444" : base.borderColor,
                                                            },
                                                            boxShadow: state.isFocused && fieldErrors[`parent_${index}_interestReason`] ? "0 0 0 1px #ef4444" : base.boxShadow,
                                                        }),
                                                    }}
                                                />
                                            )}
                                            <ErrorMsg name={`parent_${index}_interestReason`} />
                                        </div>
                                        <div className="w-full">
                                            <label className="block text-[16px] font-semibold">Tell us a bit more (optional)</label>
                                            <input type="text" placeholder="Anything else you'd like to share?" value={parent.interestReasonOther || ""}
                                                onChange={(e) => handleParentChange(index, "interestReasonOther", e.target.value)}
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Relation to child</label>
                                            <Select
                                                options={relationOptions}
                                                placeholder="Select Relation"
                                                className="mt-2"
                                                classNamePrefix="react-select"
                                                value={relationOptions.find((o) => o.value === parent.relationToChild)}
                                                onChange={(selected) => {
                                                    handleParentChange(index, "relationToChild", selected.value);
                                                    clearError(`parent_${index}_relationToChild`);
                                                }}
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        borderColor: fieldErrors[`parent_${index}_relationToChild`] ? "#ef4444" : base.borderColor,
                                                        "&:hover": {
                                                            borderColor: fieldErrors[`parent_${index}_relationToChild`] ? "#ef4444" : base.borderColor,
                                                        },
                                                        boxShadow: state.isFocused && fieldErrors[`parent_${index}_relationToChild`] ? "0 0 0 1px #ef4444" : base.boxShadow,
                                                    }),
                                                }}
                                            />
                                            <ErrorMsg name={`parent_${index}_relationToChild`} />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">How did you hear about us?</label>
                                            <Select
                                                options={hearOptions}
                                                placeholder="Select from drop down"
                                                className="mt-2"
                                                classNamePrefix="react-select"
                                                value={hearOptions.find((o) => o.value === parent.howDidYouHear)}
                                                onChange={(selected) => {
                                                    handleParentChange(index, "howDidYouHear", selected.value);
                                                    clearError(`parent_${index}_howDidYouHear`);
                                                }}
                                                styles={{
                                                    control: (base, state) => ({
                                                        ...base,
                                                        borderColor: fieldErrors[`parent_${index}_howDidYouHear`] ? "#ef4444" : base.borderColor,
                                                        "&:hover": {
                                                            borderColor: fieldErrors[`parent_${index}_howDidYouHear`] ? "#ef4444" : base.borderColor,
                                                        },
                                                        boxShadow: state.isFocused && fieldErrors[`parent_${index}_howDidYouHear`] ? "0 0 0 1px #ef4444" : base.boxShadow,
                                                    }),
                                                }}
                                            />
                                            <ErrorMsg name={`parent_${index}_howDidYouHear`} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-6" ref={emergencyRef}>
                            <h2 className="text-[20px] font-semibold">Emergency contact details</h2>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={emergency.sameAsAbove}
                                    onChange={() => setEmergency(prev => ({ ...prev, sameAsAbove: !prev.sameAsAbove }))}
                                />
                                <label className="text-base font-semibold text-[#34353B]">Fill same as above</label>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">First name</label>
                                    <input className={fieldClass("emergency_emergencyFirstName")} placeholder="Enter first name"
                                        value={emergency.emergencyFirstName}
                                        onChange={e => {
                                            setEmergency(prev => ({ ...prev, emergencyFirstName: e.target.value }));
                                            clearError("emergency_emergencyFirstName");
                                        }}
                                    />
                                    <ErrorMsg name="emergency_emergencyFirstName" />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Last name</label>
                                    <input className={fieldClass("emergency_emergencyLastName")} placeholder="Enter last name"
                                        value={emergency.emergencyLastName}
                                        onChange={e => {
                                            setEmergency(prev => ({ ...prev, emergencyLastName: e.target.value }));
                                            clearError("emergency_emergencyLastName");
                                        }}
                                    />
                                    <ErrorMsg name="emergency_emergencyLastName" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Phone number</label>
                                    <div className={fieldErrors["emergency_emergencyPhoneNumber"] ? "border border-red-500 rounded-xl bg-red-50" : ""}>
                                        <PhoneNumberInput value={emergency.emergencyPhoneNumber}
                                            onChange={(fullNumber) => {
                                                setEmergency(prev => ({ ...prev, emergencyPhoneNumber: fullNumber }));
                                                clearError("emergency_emergencyPhoneNumber");
                                            }}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <ErrorMsg name="emergency_emergencyPhoneNumber" />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Relation to child</label>
                                    <Select
                                        options={relationOptions}
                                        value={relationOptions.find(option => option.value === emergency.emergencyRelation)}
                                        onChange={selectedOption => {
                                            setEmergency(prev => ({ ...prev, emergencyRelation: selectedOption?.value || "" }));
                                            clearError("emergency_emergencyRelation");
                                        }}
                                        placeholder="Select Relation"
                                        className="mt-2"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                borderColor: fieldErrors["emergency_emergencyRelation"] ? "#ef4444" : base.borderColor,
                                                "&:hover": {
                                                    borderColor: fieldErrors["emergency_emergencyRelation"] ? "#ef4444" : base.borderColor,
                                                },
                                                boxShadow: state.isFocused && fieldErrors["emergency_emergencyRelation"] ? "0 0 0 1px #ef4444" : base.boxShadow,
                                            }),
                                        }}
                                    />
                                    <ErrorMsg name="emergency_emergencyRelation" />
                                </div>
                            </div>
                        </div>

                        {/* Key Information */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="w-full my-10 bg-white border border-blue-100 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
                        >
                            <button onClick={() => setIsOpen(!isOpen)}
                                className="w-full flex items-center justify-between p-8 hover:bg-blue-50/30 transition-colors duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                                <div className="flex items-center gap-3 relative text-left">
                                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200"><Info className="w-6 h-6 text-white" /></div>
                                    <h2 className="text-[24px] font-bold text-gray-900 leading-tight">Key Information</h2>
                                </div>
                                <div className="relative">
                                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                        <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                    </motion.div>
                                </div>
                            </button>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                                        <div className="p-8 pt-0 relative border-t border-gray-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative pt-6">
                                                {membershipKeyInfo ? (
                                                    <>
                                                        {renderContent(JSON.parse(membershipKeyInfo))}

                                                    </>
                                                ) : (
                                                    <div className="text-gray-500 italic py-4 col-span-2 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                        No key information available for this service.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <Comments adminInfo={adminInfo} comment={comment} setComment={setComment}
                            handleSubmitComment={handleSubmitComment} loadingComment={loadingComment}
                            commentsList={commentsList}
                            currentComments={[...tempComments, ...(currentComments || [])]}
                            formatTimeAgo={formatTimeAgo}
                        />

                        <div className="flex justify-end gap-4">
                            <button onClick={handleCancel} type="button"
                                className="flex items-center justify-center gap-1 border border-[#717073] text-[#717073] px-12 text-[18px] py-2 rounded-lg font-semibold bg-none"
                            >Cancel</button>
                            <button type="button"
                                onClick={() => {
                                    if (!validationCheck()) return;
                                    setShowPopup(true);
                                }}
                                className={`text-white font-semibold text-[18px] px-6 py-3 rounded-lg ${isBooked ? "bg-green-600 border-green-600 cursor-default" : "bg-[#237FEA] border border-[#237FEA]"}`}
                            >
                                {isBooked ? "Booked" : isSubmitting ? "Submitting..." : "Setup Direct Debit"}
                            </button>
                        </div>

                        {/* ── POPUP ── */}
                        {showPopup && (
                            <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                                <div className="flex gap-6 px-6 py-12 max-h-[90%] w-8/12 overflow-auto bg-[#FDFDFF]">
                                    {/* LEFT SUMMARY */}
                                    <div className="bg-[#F1F4FC] poppins rounded-xl w-[365px] text-sm text-gray-800 overflow-auto h-full">
                                        <div className="flex justify-center poppins rounded-t-2xl p-4 bg-[#003288]">
                                            <img className="w-[40px]" src="/images/sss-logo.png" alt="" />
                                        </div>
                                        <div className="p-6">
                                            <p className="text-[#042C89] poppins font-bold mb-4" style={{ fontSize: "20px" }}>Summary</p>
                                            <div className="mb-4 grid poppins gap-3">
                                                <p>
                                                    <span className="font-semibold poppins text-[#042C89]" style={{ fontSize: "16px" }}>
                                                        {membershipPlan?.all?.duration} {membershipPlan?.all?.interval} Plan
                                                    </span>
                                                    <span className="float-right text-right poppins font-semibold" style={{ fontSize: "18px" }}>
                                                        £{pricingBreakdown?.nextMonthPayment}<br />
                                                        <span className="text-[#34353B] float-right poppins" style={{ fontSize: "12px" }}>per month</span>
                                                    </span>
                                                </p>
                                                {/* <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
                                                    <span className="font-bold text-blue-900">
                                                        {isFranchisee ? "GoCardless (→ Franchisee account)" : "AccessPaySuite (→  Head Office)"}
                                                    </span>
                                                </div> */}
                                                <p className="mt-[-20px]">
                                                    <span className="font-medium poppins text-[#34353B]" style={{ fontSize: "14px" }}>
                                                        {membershipPlan?.all?.students} Student{membershipPlan?.all?.students === 1 ? "" : "s"}
                                                    </span>
                                                </p>
                                                <p><span className="font-medium poppins text-[#34353B]" style={{ fontSize: "14px" }}>Start Date:</span> {formatDate(selectedDate)}</p>
                                            </div>

                                            {singleClassSchedulesOnly?.venue?.starterPack && comesFrom !== 'cancellation' && <hr className="my-4 border-gray-300 poppins" />}

                                            {singleClassSchedulesOnly?.venue?.starterPack && comesFrom !== 'cancellation' && (
                                                <div className="mb-4">
                                                    <p><span className="font-semibold poppins text-[#042C89]" style={{ fontSize: "16px" }}>Samba Soccer School</span></p>

                                                    <p>
                                                        <span className="poppins" style={{ fontSize: "14px" }}>Starter Pack</span>
                                                        <span className="poppins float-right text-right">
                                                            {isApplied && appliedDiscount?.data ? (
                                                                <>
                                                                    <div className="line-through text-gray-400 text-sm">£{singleClassSchedulesOnly?.starterPack?.[0]?.price || 0}</div>
                                                                    <div className="text-green-600 font-semibold">£{appliedDiscount.data.finalPrice}</div>
                                                                </>
                                                            ) : `£${singleClassSchedulesOnly?.starterPack?.[0]?.price || 0}`}
                                                        </span>
                                                    </p>
                                                    {/* Issue #47: Show Stripe routing label */}
                                                    <p className="text-[11px] text-green-700 mt-1">Paid via Stripe → Head Office</p>
                                                </div>
                                            )}

                                            {!pricingBreakdown.isFullMonthCharge && <hr className="my-4 border-gray-300" />}
                                            {!pricingBreakdown.isFullMonthCharge && (
                                                <div className="mb-4 space-y-2">
                                                    <p className="font-semibold text-[#042C89] poppins" style={{ fontSize: "16px" }}>
                                                        Pro-rata lessons
                                                    </p>
                                                    <p className="poppins flex justify-between" style={{ fontSize: "14px" }}>
                                                        <span>Number of lessons</span>
                                                        <span>{pricingBreakdown.numberOfLessonsProRated}</span>
                                                    </p>
                                                    <p className="poppins flex justify-between" style={{ fontSize: "14px" }}>
                                                        <span>Fee</span>
                                                        <span>£{pricingBreakdown.finalProRataCost?.toFixed(2)}</span>
                                                    </p>
                                                </div>
                                            )}

                                            <hr className="my-4 border-gray-300" />
                                            <p className="font-bold text-[#042C89] poppins" style={{ fontSize: "16px" }}>
                                                Total to pay now
                                                <span className="float-right poppins font-bold" style={{ fontSize: "22px" }}>£{calculatedAmount}</span>
                                            </p>

                                            {/* Issue #47: Payment routing summary */}
                                            <div className="mt-4">
                                                <PaymentRoutingBadge />
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT FORM */}
                                    {step === 1 && (
                                        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
                                            <div className="flex justify-between items-center mb-3">
                                                <h2 className="text-2xl font-semibold poppins">Set up your direct debit</h2>
                                                <img src="/images/Directdebitlogo.png" alt="Direct Debit" className="h-10" />
                                            </div>
                                            <p className="text-[#797A88] text-[14px] mb-4 poppins">
                                                Your regular Direct Debit payments will be collected from this account starting from the 1st of next month.
                                            </p>

                                            {/* Issue #47: Visible payment method indicator */}


                                            <label className="block mb-4">
                                                <span className="block text-gray-700 text-[14px] mb-1 poppins">Email address</span>
                                                <input type="email" value={payment.email || parents[0].parentEmail} onChange={(e) => setPayment({ ...payment, email: e.target.value })}
                                                    className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                />
                                            </label>

                                            <p className="text-[14px] font-medium text-[#34353B] mb-3">
                                                Payment Method: <span className="font-semibold poppins">{isFranchisee ? "GoCardless" : "Access Pay Suite"}</span>
                                            </p>

                                            {/* GoCardless (Franchisee) */}
                                            {isFranchisee && (
                                                <div className="space-y-4">
                                                    <label className="block">
                                                        <span className="block poppins text-gray-700 text-[14px] mb-1">Account Holder Name</span>
                                                        <input type="text" value={payment.account_holder_name}
                                                            onChange={(e) => {
                                                                const fullName = e.target.value;
                                                                const parts = fullName.trim().split(" ");
                                                                setPayment({ ...payment, account_holder_name: fullName, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") });
                                                            }}
                                                            className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                        />
                                                    </label>
                                                    <div className="md:flex gap-4">
                                                        <label className="flex-1">
                                                            <span className="block poppins text-gray-700 text-[14px] mb-1">Sort Code</span>
                                                            <input type="text" value={payment.branch_code}
                                                                onChange={(e) => setPayment({ ...payment, branch_code: e.target.value.replace(/\D/g, "") })}
                                                                className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                            />
                                                        </label>
                                                        <label className="flex-1">
                                                            <span className="block poppins text-gray-700 text-[14px] mb-1">Account Number</span>
                                                            <input type="text" value={payment.account_number}
                                                                onChange={(e) => setPayment({ ...payment, account_number: e.target.value.replace(/\D/g, "") })}
                                                                className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AccessPaySuite (Super-admin) */}
                                            {!isFranchisee && (
                                                <div className="space-y-4 mt-4">
                                                    <label className="block">
                                                        <span className="block poppins text-gray-700 text-[14px] mb-1">Account Holder Name</span>
                                                        <input type="text" value={payment.account_holder_name}
                                                            onChange={(e) => {
                                                                const fullName = e.target.value;
                                                                const parts = fullName.trim().split(" ");
                                                                setPayment({ ...payment, account_holder_name: fullName, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") });
                                                            }}
                                                            className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="block poppins text-gray-700 text-[14px] mb-1">Address Line 1</span>
                                                        <input type="text" value={payment.line1}
                                                            onChange={(e) => setPayment({ ...payment, line1: e.target.value })}
                                                            className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                        />
                                                    </label>
                                                    <div className="md:flex gap-4">
                                                        <label className="flex-1">
                                                            <span className="block poppins text-gray-700 text-[14px] mb-1">City</span>
                                                            <input type="text" value={payment.city}
                                                                onChange={(e) => setPayment({ ...payment, city: e.target.value })}
                                                                className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                            />
                                                        </label>
                                                        <label className="flex-1">
                                                            <span className="block poppins text-gray-700 text-[14px] mb-1">Postal Code</span>
                                                            <input type="text" value={payment.postalCode}
                                                                onChange={(e) => setPayment({ ...payment, postalCode: e.target.value })}
                                                                className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                            />
                                                        </label>
                                                    </div>
                                                    <label className="block">
                                                        <span className="block poppins text-gray-700 text-[14px] mb-1">Account Number</span>
                                                        <input type="text" value={payment.account_number}
                                                            onChange={(e) => setPayment({ ...payment, account_number: e.target.value.replace(/\D/g, "") })}
                                                            className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="block poppins text-gray-700 text-[14px] mb-1">Sort Code</span>
                                                        <input type="text" value={payment.branch_code}
                                                            onChange={(e) => setPayment({ ...payment, branch_code: e.target.value.replace(/\D/g, "") })}
                                                            className="w-full mainShadow bg-white rounded-[6px] px-4 py-2"
                                                        />
                                                    </label>
                                                </div>
                                            )}

                                            <label className="flex items-center gap-2 mt-4 mb-6 text-sm text-gray-700">
                                                <input type="checkbox" checked={payment.authorise}
                                                    onChange={(e) => setPayment({ ...payment, authorise: e.target.checked })}
                                                />
                                                <span className="underline poppins">I can authorise Direct Debits on this account myself</span>
                                            </label>

                                            <div className="flex justify-end">
                                                <button onClick={() => setShowPopup(false)} type="button"
                                                    className="flex items-center justify-center cursor-pointer gap-1 border-2 border-[#717073] mr-6 text-[#717073] px-12 text-[18px] py-2 rounded-lg font-semibold bg-none"
                                                >Cancel</button>
                                                <button
                                                    disabled={isSubmitting || !payment.authorise || (isFranchisee ? isBankInvalid : isCardInvalid)}
                                                    onClick={() => {
                                                        const hasStarterPack = singleClassSchedulesOnly?.venue?.starterPack && comesFrom !== 'cancellation' && (pricingBreakdown?.stripeAmount || 0) > 0;
                                                        if (hasStarterPack) {
                                                            setDirectDebitData([...directDebitData, payment]);
                                                            setStep(2);
                                                        } else {
                                                            handleFinalSubmit();
                                                        }
                                                    }}
                                                    className={`bg-[#042C89] text-white rounded-[6px] px-6 py-2 font-semibold ${isSubmitting || !payment.authorise || (isFranchisee ? isBankInvalid : isCardInvalid) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-800"}`}
                                                >
                                                    {isSubmitting ? "Submitting..." : "Set up Direct Debit"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="flex-1 flex flex-col">
                                            <h2 className="text-2xl font-semibold poppins pb-4">Checkout</h2>
                                            <p className="text-gray-600 mb-4 poppins text-[14px]">
                                                Fill out your card details below to pay for the Starter Pack via Stripe. This payment goes directly to Head Office.
                                            </p>

                                            {/* Issue #47: Stripe destination badge */}
                                            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-800 font-medium">
                                                💳 Stripe → Head Office &nbsp;·&nbsp; Amount: <strong>£{pricingBreakdown?.stripeAmount?.toFixed(2)}</strong>
                                                {IS_SANDBOX && <span className="ml-2 text-orange-600">🧪 Sandbox</span>}
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-gray-700 poppins text-[14px] font-medium mb-1">Name on card<span className="text-red-500 ml-0.5">*</span></label>
                                                <input type="text" value={nameOnCard} onChange={(e) => handleCheckoutChange("nameOnCard", e.target.value)}
                                                    placeholder="Enter name on card" className={inputClass("nameOnCard")}
                                                />
                                                {errors.nameOnCard && <span className="text-red-500 text-[12px] mt-1 block">{errors.nameOnCard}</span>}
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-gray-700 poppins text-[14px] font-medium mb-1">Card number<span className="text-red-500 ml-0.5">*</span></label>
                                                <input type="text" value={cardNumber} onChange={(e) => handleCheckoutChange("cardNumber", e.target.value)}
                                                    placeholder="1234 1234 1234 1234" maxLength={19} inputMode="numeric" className={inputClass("cardNumber")}
                                                />
                                                {errors.cardNumber && <span className="text-red-500 text-[12px] mt-1 block">{errors.cardNumber}</span>}
                                            </div>

                                            <div className="flex gap-4 mb-4">
                                                <div className="flex-1">
                                                    <label className="block text-gray-700 poppins text-[14px] font-medium mb-1">Expiration date<span className="text-red-500 ml-0.5">*</span></label>
                                                    <input type="text" value={expiryDate} onChange={(e) => handleCheckoutChange("expiryDate", e.target.value)}
                                                        placeholder="MM/YY" maxLength={5} inputMode="numeric" className={inputClass("expiryDate")}
                                                    />
                                                    {errors.expiryDate && <span className="text-red-500 text-[12px] mt-1 block">{errors.expiryDate}</span>}
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-gray-700 poppins text-[14px] font-medium mb-1">CVC<span className="text-red-500 ml-0.5">*</span></label>
                                                    <input type="text" value={cvc} onChange={(e) => handleCheckoutChange("cvc", e.target.value)}
                                                        placeholder="CVC" maxLength={4} inputMode="numeric" className={inputClass("cvc")}
                                                    />
                                                    {errors.cvc && <span className="text-red-500 text-[12px] mt-1 block">{errors.cvc}</span>}
                                                </div>
                                            </div>

                                            <div className="flex gap-4 mb-6">
                                                <div className="flex-1">
                                                    <label className="block text-gray-700 poppins text-[14px] font-medium mb-1">Country or region<span className="text-red-500 ml-0.5">*</span></label>
                                                    <Select options={countryOptions} value={countryOptions.find(opt => opt.value === checkoutCountry)}
                                                        onChange={(selectedOption) => handleCheckoutChange("checkoutCountry", selectedOption?.value)}
                                                        styles={customSelectStyles} className="mt-2 mainShadow rounded-xl" classNamePrefix="react-select"
                                                    />
                                                    {errors.country && <span className="text-red-500 text-[12px] mt-1 block">{errors.country}</span>}
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-gray-700 poppins text-[14px] font-medium mb-1">Postal Code<span className="text-red-500 ml-0.5">*</span></label>
                                                    <input type="text" value={zipCode} onChange={(e) => handleCheckoutChange("zipCode", e.target.value)}
                                                        placeholder="Enter Postal Code" className={inputClass("zipCode")}
                                                    />
                                                    {errors.zipCode && <span className="text-red-500 text-[12px] mt-1 block">{errors.zipCode}</span>}
                                                </div>
                                            </div>

                                            <p className="font-semibold text-[#34353B] poppins text-md">
                                                Total to pay now <span className="float-right poppins text-blue-900" style={{ fontSize: "22px" }}>£{calculatedAmount?.toFixed(2)}</span>
                                            </p>

                                            <div className="flex justify-end">
                                                <button onClick={() => { setShowPopup(false); setStep(1); }} type="button"
                                                    className="mt-6 px-6 py-2 poppins rounded-[6px] bg-white-900 text-blue-900 mr-6 border-blue-900 border-2 font-semibold hover:bg-blue-800 hover:text-white"
                                                >Cancel</button>
                                                <button onClick={() => setStep(1)} type="button"
                                                    className="mt-6 px-6 py-2 poppins rounded-[6px] bg-white-900 text-blue-900 mr-6 border-blue-900 border-2 font-semibold hover:bg-blue-800 hover:text-white"
                                                >Back</button>
                                                <button disabled={!isFormValid || isSubmitting} onClick={handleFinalSubmit}
                                                    className={`mt-6 px-6 py-2 poppins rounded-[6px] bg-blue-900 text-white font-semibold ${!isFormValid || isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-800"}`}
                                                    type="button"
                                                >
                                                    {isSubmitting ? "Processing..." : "Complete Booking"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default List;
