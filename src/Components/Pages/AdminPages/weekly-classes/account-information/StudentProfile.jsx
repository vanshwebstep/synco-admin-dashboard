// src/components/profile.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { motion } from "framer-motion";
import { X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
import Comments from '../../Common/Comments';
import { useEmail } from '../../contexts/messages/SendEmailContext';
import { useCancelMembership } from '../../contexts/messages/CancelMembershipContext';
import { useTextPopup } from '../../contexts/messages/SendTextContext';
import { useLocation } from "react-router-dom";
import { useClassSchedule } from '../../contexts/ClassScheduleContent';
import { useAccountsInfo } from "../../contexts/AccountsInfoContext";
import { useRevertMembership } from '../../contexts/RevertMembershipContext';

const StudentProfile = ({ profile }) => {
  const { fetchMembers, sendBirthdayMail, fetchBirthdyPartiesMembers, fetchOneToOneMembers, sendOnetoOneMail } = useAccountsInfo()
  const { openRevertPopup } = useRevertMembership();
  const navigate = useNavigate();
  const { openCancelPopup } = useCancelMembership();
  const { openTextPopup } = useTextPopup();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { fetchFindClassID, singleClassSchedulesOnly } = useClassSchedule() || {};
  const serviceTypemain = queryParams.get("serviceType");
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);   // stores formatted "YYYY-MM-DD" string
  const serviceType = queryParams.get("serviceType");
  const isBirthdayParty = profile?.booking?.serviceType === "birthday party" || serviceType?.toLowerCase() === "birthdayparties" || serviceType?.toLowerCase() === "birthdayparty";
  const isOneToOne = profile?.booking?.serviceType === "one to one" || serviceType?.toLowerCase() === "onetoone" || serviceType?.toLowerCase() === "onetoones";

  const { serviceHistoryMembership } = useBookFreeTrial();
  const [textloading, setTextLoading] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { openEmailPopup } = useEmail();
  const [numberOfStudents, setNumberOfStudents] = useState(profile.students?.length || 0);
  const {
    loading,
    addtoWaitingListSubmit, cancelMembershipSubmit,
    sendBookMembershipMail, transferMembershipSubmit,
    freezerMembershipSubmit, reactivateDataSubmit, cancelWaitingListSpot, updateBookMembershipFamily, removeWaiting, setRemoveWaiting, addToWaitingList, setaddToWaitingList, showCancelTrial, setshowCancelTrial, setComment, comment, fetchComments, commentsList, handleSubmitComment, loadingComment,
    createBookMembershipByfreeTrial, createBookMembershipByWaitingList, createBookMembershipbyCancellation, createBookMembership, cancelHolidaySubmit
  } = useBookFreeTrial() || {};
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [remainingLessons, setRemainingLessons] = useState(0);

  // Card Payment States
  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [errors, setErrors] = useState({});
  const [checkoutCountry, setCheckoutCountry] = useState("United Kingdom");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [emailData, setEmailData] = useState({
    emails: [],
    subject: "",
    message: ""
  });
  const studentsList = profile?.students || [];
  const requestToCancelStudents = studentsList.filter(
    (s) => s.studentStatus === "request_to_cancel"
  );
  const cancelType = [
    { value: "immediate", label: "Cancel Immediately" },
    { value: "scheduled", label: "Request Cancel" },
  ];
  const firstPayment = Array.isArray(profile?.payments)
    ? profile.payments[0]
    : profile?.payments;
  const ID = profile?.bookingId || firstPayment?.pan;
  console.log('profile', profile)
  const PAYMENT_TYPES = {
    ACCESS_PAY_SUITE: "accesspaysuite",
    GOCARDLESS: "gocardless",
    STRIPE: "stripe",
  };

  const [payment, setPayment] = useState({
    paymentType: PAYMENT_TYPES.ACCESS_PAY_SUITE,
    firstName: "",
    lastName: "",
    email: "",
    price: "",
    line1: "",
    city: "",
    postalCode: "",
    account_number: "",
    branch_code: "",
    account_holder_name: "",
  });
  const [pricingBreakdown, setPricingBreakdown] = useState({
    pricePerClassPerChild: 0,
    numberOfLessonsProRated: 0,
    costOfProRatedLessons: 0,
    totalAmount: 0,
    isFullMonthCharge: false,
  });

  console.log('pricingBreakdown', pricingBreakdown)
  // cancelled wale
  const cancelledStudents = studentsList.filter(
    (s) => s.studentStatus === "cancelled"
  );
  const lifeCycle = profile?.lifeCycle || "";

  // active (agar chahiye ho)
  const activeStudents = studentsList.filter(
    (s) => s.studentStatus === "active"
  );
  const actualServiceType = profile?.serviceType?.toLowerCase() || profile?.booking?.serviceType?.toLowerCase() || serviceType?.toLowerCase() || "";
  const isTrials = actualServiceType === "weekly class trial" || actualServiceType === "trials";
  const isMembership = actualServiceType === "weekly class membership" || actualServiceType === "membership" || actualServiceType === "";
  const isHolidayCamp = actualServiceType === "holiday camp" || actualServiceType === "holidaycamp" || actualServiceType === "holidaycamps";
  const serviceLabel = isBirthdayParty ? "Birthday Party" : isOneToOne ? "One to One" : "Membership";

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
        {status === 'request_to_cancel' ? (
          <div className="border-t border-[#495362] py-5">
            <div className=" text-[20px] text-white">Membership Tenure </div>
            <div className="text-[16px]  mt-1 text-gray-400">{profile?.membershipTenure || ""}</div>
          </div>
        ) : (
          <>
            <div className="border-t border-[#495362] py-5">
              <div className="  text-[20px] text-white">Lifecycle</div>
              <div className="text-[16px] mt-1 text-gray-400">
                {profile?.lifeCycle || ""}
              </div>
            </div>
          </>
        )}
        <div className="border-t border-[#495362] pt-5">
          <div className="text-[20px] text-white">ID</div>
          <div className="text-[16px] mt-1 text-gray-400">{ID}</div>
        </div>
        {status !== 'cancelled' ? (
          <div className="border-t border-[#495362] py-5">
            <div className="text-[20px] text-white mb-3">Progress</div>
            <div className="flex items-center justify-between">
              <div className="w-[90%] bg-[#fff] h-3 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${profile?.progressBar?.totalBars > 0 ? Math.round((profile?.progressBar?.filledBars / profile?.progressBar?.totalBars) * 100) : 0}%` }}
                ></div>
              </div>
              <div className="text-white text-[16px] font-semibold">{profile?.progressBar?.filledBars}/{profile?.progressBar?.totalBars}</div>
            </div>
          </div>
        ) : null}
      </>
    );
  };
  console.log('isTrials', profile)

  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5; // Number of comments per page
  const [membershipPlan, setMembershipPlan] = useState(null);

  // Pagination calculations
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
  const [loadingData, setLoadingData] = useState(false);
  const [birthdayLoading, setBirthdayLoading] = useState(false);
  const classSchedule = profile?.classSchedule;
  const bookingId = profile?.id || profile?.bookingId;
  const id = profile?.id;
  const paymentPlans = profile?.paymentPlans;
  const parents = profile?.parents;
  const emergency = profile?.emergency;

  const [students, setStudents] = useState(profile?.students || profile?.booking?.students);
  const [editingIndex, setEditingIndex] = useState(null);
  const bookedBy = profile?.bookedByAdmin || profile?.bookedBy;


  const [transferVenue, setTransferVenue] = useState(false);
  const [reactivateMembership, setReactivateMembership] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [freezeMembership, setFreezeMembership] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    studentFirstName: "",
    studentLastName: "",
    age: "",
    dateOfBirth: "",
    medicalInformation: "",
    abilityLevel: "beginner",
    gender: "male"
  });
  const reasonOptions = [
    { value: "Family emergency - cannot attend", label: "Family emergency - cannot attend" },
    { value: "Health issue", label: "Health issue" },
    { value: "Schedule conflict", label: "Schedule conflict" },
    { value: "other", label: "Other reason" },
  ];

  // Derive sessionDatesSet from classSchedule or singleClassSchedulesOnly
  const sessionDates = React.useMemo(() => {
    const currentSchedule = singleClassSchedulesOnly || profile?.classSchedule;
    const scheduleDates = currentSchedule?.venue?.termGroups?.flatMap(group =>
      group.terms?.flatMap(term => term.sessionsMap?.map(s => s.sessionDate))
    ) || [];

    const profileVenueDates = profile?.venue?.termGroups?.flatMap(group =>
      group.terms?.flatMap(term => term.sessionsMap?.map(s => s.sessionDate))
    ) || [];

    const studentClassDates = profile?.students?.[0]?.classSchedule?.venue?.termGroups?.flatMap(group =>
      group.terms?.flatMap(term => term.sessionsMap?.map(s => s.sessionDate))
    ) || [];

    const allDates = [...new Set([...scheduleDates, ...profileVenueDates, ...studentClassDates])].filter(Boolean);
    console.log("📅 DERIVED SESSION DATES:", allDates);
    return allDates;
  }, [singleClassSchedulesOnly, profile]);

  const sessionDatesSet = React.useMemo(() => new Set(sessionDates), [sessionDates]);


  const openAddStudentModal = async () => {
    const classId = profile?.students?.[0]?.classSchedule?.id || profile?.classSchedule?.id;
    if (classId) {
      await fetchFindClassID(classId);
    }
    setShowAddStudent(true);
    setStep(0);
    if (membershipPlan) {
      calculateAmount();
    }
  };

  const formatLocalDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date) => {
    const formattedDate = formatLocalDate(date);

    if (selectedDate === formattedDate) {
      setSelectedDate(null);
      // calculateAmount will be called via useEffect or manually
    } else {
      setSelectedDate(formattedDate);
    }
  };

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  };

  useEffect(() => {
    if (membershipPlan && selectedDate) {
      calculateAmount();
    }
  }, [membershipPlan, selectedDate]);

  const validateCheckoutField = (field, value) => {
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
      case "zipCode":
        return value.trim() ? "" : "Postal Code is required";
      default:
        return "";
    }
  };

  const handleCheckoutChange = (field, rawValue) => {
    let value = rawValue;
    if (field === "cardNumber") {
      const digits = rawValue.replace(/\D/g, "").slice(0, 16);
      value = digits.replace(/(.{4})/g, "$1 ").trim();
    }
    if (field === "expiryDate") {
      const digits = rawValue.replace(/\D/g, "").slice(0, 4);
      value = digits.length >= 3 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
    }
    if (field === "cvc") value = rawValue.replace(/\D/g, "").slice(0, 4);
    if (field === "zipCode") value = rawValue.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 10);

    const setters = {
      nameOnCard: setNameOnCard,
      cardNumber: setCardNumber,
      expiryDate: setExpiryDate,
      cvc: setCvc,
      zipCode: setZipCode
    };
    setters[field]?.(value);

    const msg = validateCheckoutField(field, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[field] = msg;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      showError("Unauthorized", "Session expired. Please login again.");
      return;
    }

    const fields = { nameOnCard, cardNumber, expiryDate, cvc, zipCode };
    const newErrors = {};

    Object.entries(fields).forEach(([field, value]) => {
      const msg = validateCheckoutField(field, value);
      if (msg) newErrors[field] = msg;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showWarning("Invalid Payment Details", "Please correct the errors in the payment form.");
      return;
    }

    if (!newStudent.studentFirstName || !newStudent.studentLastName || !newStudent.age || !newStudent.dateOfBirth) {
      showWarning("Missing Information", "Please fill in all required student fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        newPaymentPlanId: membershipPlan?.value,
        student: {
          studentFirstName: newStudent.studentFirstName,
          studentLastName: newStudent.studentLastName,
          dateOfBirth: newStudent.dateOfBirth,
          age: parseInt(newStudent.age),
          gender: newStudent.gender,
          classScheduleId: profile?.students?.[0]?.classSchedule?.id || profile?.classSchedule?.id,
        },
        payment: {
          paymentType: "accesspaysuite",
          firstName: profile.parents?.[0]?.parentFirstName,
          lastName: profile.parents?.[0]?.parentLastName,
          email: profile.parents?.[0]?.parentEmail,
          line1: payment.line1,
          city: payment.city,
          postcode: payment.postalCode,
          account_number: payment.account_number,
          branch_code: payment.branch_code,
          account_holder_name: payment.account_holder_name,
          authorise: true,
          price: pricingBreakdown.nextMonthPayment,
          proRataAmount: pricingBreakdown.totalBeforeDiscount > pricingBreakdown.nextMonthPayment
            ? pricingBreakdown.nextMonthPayment
            : (pricingBreakdown.isFullMonthCharge ? 0 : pricingBreakdown.finalProRataCost),
          nameOnCard: nameOnCard.trim(),
          cardNumber: cardNumber.replace(/\s+/g, ''),
          expiryDate,
          cvc,
          country: checkoutCountry,
          zipCode
        }
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/book-membership/${bookingId}/add-student-upgrade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token.trim()}`, // ✅ ensure clean token
          },
          body: JSON.stringify(payload),
        }
      );

      // ✅ Handle 401 explicitly
      if (response.status === 401) {
        throw new Error("Unauthorized. Please login again.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add student and upgrade plan");
      }

      await showSuccess("Success!", result.message || "Student added and membership updated successfully.");

      setShowAddStudent(false);
      fetchMembers(bookingId, serviceType);

      // reset
      setNewStudent({
        studentFirstName: "",
        studentLastName: "",
        age: "",
        dateOfBirth: "",
        medicalInformation: "",
        abilityLevel: "beginner",
        gender: "male"
      });

      setStep(0);
      setNameOnCard("");
      setCardNumber("");
      setExpiryDate("");
      setCvc("");
      setZipCode("");

      if (serviceHistoryMembership) {
        await serviceHistoryMembership(bookingId);
      }

    } catch (error) {
      console.error("Error adding student:", error);
      showError("Error", error.message || "Something went wrong while adding the student.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const calculateAmount = () => {
    const startDate = selectedDate;
    console.log("🚀 FUNCTION CALLED with startDate:", startDate);

    if (!membershipPlan || !startDate) {
      console.warn("❌ Missing membershipPlan or startDate");
      return;
    }

    const monthlyPrice = Number(membershipPlan?.all?.price ?? 0);

    // ── DATE PARSER ──
    const parseLocalDate = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr;
      if (typeof dateStr === "string") {
        const parts = dateStr.split("-");
        if (parts.length !== 3) return null;
        const [y, m, d] = parts.map(Number);
        return new Date(y, m - 1, d);
      }
      return null;
    };

    // ✅ FIX 4: normalize startDate to a "YYYY-MM-DD" string first, then parse
    const startDateStr = typeof startDate === "string" ? startDate : formatLocalDate(startDate);
    const selected = parseLocalDate(startDateStr);

    if (!selected) {
      console.error("❌ Selected date invalid");
      return;
    }
    selected.setHours(0, 0, 0, 0);

    const allSessions = Array.from(sessionDatesSet)
      .map((d) => {
        const date = parseLocalDate(d);
        if (!date) return null;
        date.setHours(0, 0, 0, 0);
        return date;
      })
      .filter(Boolean);

    const selectedMonth = selected.getMonth();
    const selectedYear = selected.getFullYear();

    const sessionsInStartMonth = allSessions
      .filter((d) => d.getMonth() === selectedMonth && d.getFullYear() === selectedYear)
      .sort((a, b) => a - b);

    const firstSessionDate = sessionsInStartMonth[0];
    const isFirstSessionSelected =
      firstSessionDate && selected.getTime() === firstSessionDate.getTime();

    const remainingSessions = sessionsInStartMonth.filter(
      (d) => d.getTime() >= selected.getTime()
    );

    const proRataLessons = remainingSessions.length;
    const pricePerLesson = membershipPlan?.all?.priceLesson || 0;
    const proRataCost = Number((proRataLessons * pricePerLesson).toFixed(2));
    const safeProRataCost = Math.min(proRataCost, monthlyPrice);

    const isFullMonth =
      proRataLessons > 3 || (isFirstSessionSelected && proRataLessons >= 3) || safeProRataCost >= monthlyPrice;

    const proRataDiscountData = null; // Defined locally if needed
    let finalProRata = safeProRataCost;
    if (!isFullMonth && proRataDiscountData?.finalProRata != null) {
      finalProRata = proRataDiscountData.finalProRata;
    }

    const effectiveLessonCharge = isFullMonth ? monthlyPrice : finalProRata;
    const finalTotal = Math.max(effectiveLessonCharge, 0);
    const totalToday = Number(finalTotal.toFixed(2));
    const nextMonthPayment = Number(monthlyPrice.toFixed(2));

    setRemainingLessons(proRataLessons);
    setCalculatedAmount(totalToday);
    setPricingBreakdown({
      pricePerClassPerChild: pricePerLesson,
      numberOfLessonsProRated: proRataLessons,
      costOfProRatedLessons: safeProRataCost,
      finalProRataCost: finalProRata,
      totalBeforeDiscount: effectiveLessonCharge,
      totalAmountToday: totalToday,
      nextMonthPayment,
      isFullMonthCharge: isFullMonth,
    });

    return totalToday;
  };

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


  const commentData = {
    commentBy: profile?.parentAdminId,
    commentType:
      serviceTypemain === "membership"
        ? "paid"
        : serviceTypemain === "trials"
          ? "free"
          : serviceTypemain === "waitinglist"
            ? "waiting list"
            : serviceTypemain === "birthdayParty"
              ? "birthday party"
              : "",
    serviceType: "weekly class",
  }
  const payload = {
    comment: comment,
    commentType:
      serviceTypemain === "membership"
        ? "paid"
        : serviceTypemain === "trials"
          ? "free"
          : serviceTypemain === "waitinglist"
            ? "waiting list"
            : serviceTypemain === "birthdayParty"
              ? "birthday party"
              : "",
    serviceType: "weekly class",
    commentBy: profile?.parentAdminId, // ensure correct ID
  };
  useEffect(() => {
    fetchComments(commentData);
    // handleSubmitComment(commentData, payload,);
  }, []);
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
          fetchBirthdyPartiesMembers(id);
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
          fetchBirthdyPartiesMembers(id);
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

  // console.log('loading', loading)

  const { checkPermission } = usePermission();
  const failedPayments = profile.payments?.filter(
    (payment) => payment.paymentStatus !== "success"
  ) || [];

  const handleBookMembership = () => {
    showConfirm(
      "Are you sure?",
      "Do you want to book a membership?",
      "Yes, Book it!",
      "Cancel"
    ).then((result) => {
      if (result.isConfirmed) {
        // Navigate to your component/route
        navigate("/weekly-classes/find-a-class/book-a-membership", {
          state: { TrialData: profile, comesFrom: "waitingList" },
        });
      }
    });
  };
  const handleReinstateMembership = () => {
    showConfirm(
      "Reinstate Membership?",
      `Are you sure you want to reinstate this customer's membership?`,
      "Yes, Reinstate"
    ).then((result) => {
      if (result.isConfirmed) {
        // Navigate to your component/route
        navigate("/weekly-classes/find-a-class/book-a-membership", {
          state: { TrialData: profile, comesFrom: "cancellation" },
        });
      }
    });
  };
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

  const handleWaitingListVenueChange = (selected) => {
    setWaitingListData(prev => {
      const newConfigs = { ...prev.studentConfigs };
      // Reset class selections for all students when venue changes
      Object.keys(newConfigs).forEach(id => {
        newConfigs[id] = {
          ...newConfigs[id],
          classScheduleId: null
        };
      });
      return {
        ...prev,
        venueId: selected?.value || null,
        studentConfigs: newConfigs
      };
    });
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
    transferReasonClass: "",
    classScheduleId: null,
    selectedStudents: [],
    studentTransfers: {},
  });
  const venueClasses = profile?.venueClasses || [];
  const venueOptions = venueClasses.map(v => ({
    value: v.venueId,
    label: v.venueName,
    classes: v.classes
  }));
  const allPaymentPlans =
    singleClassSchedulesOnly?.venue?.paymentGroups?.[0]?.paymentPlans?.map((plan) => ({
      label: `${plan.title} (${plan.students} student${plan.students > 1 ? "s" : ""})`,
      value: plan.id,
      all: plan,
    })) || [];

  const paymentPlanOptions = allPaymentPlans.filter(
    (plan) => plan.all?.students === Number(students.length + (showAddStudent ? 1 : 0))
  );

  const handlePlanChange = (plan) => {
    setMembershipPlan(plan);
    setSelectedPlanData(plan?.all || null);
    if (plan) {
      calculateAmount(formatLocalDate(new Date()));
    }
  };
  const handleStudentSelectChange = (selectedOptions) => {
    setTransferData((prev) => {
      const newTransfers = { ...prev.studentTransfers };
      selectedOptions?.forEach(opt => { if (!newTransfers[opt.value]) newTransfers[opt.value] = { classScheduleId: null, transferReasonClass: "" }; });
      return { ...prev, selectedStudents: selectedOptions || [], studentTransfers: newTransfers };
    });
  };

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
  console.log('transferData', transferData)
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
  const handleStudentDataChange = (index, field, value) => {
    const updatedStudents = [...students];

    // Convert age to number
    if (field === "age") {
      value = value ? parseInt(value) : "";
    }

    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value,
    };
    setStudents(updatedStudents);
  };

  const saveStudentData = () => {
    const payload = students.map((student, sIndex) => ({
      id: student.id ?? sIndex + 1,
      studentFirstName: student.studentFirstName,
      studentLastName: student.studentLastName,
      dateOfBirth: student.dateOfBirth,
      age: student.age,
      gender: student.gender,
      medicalInformation: student.medicalInformation,
      abilityLevel: student.abilityLevel,
      parents: parents.map((p, pIndex) => ({
        id: p.id ?? pIndex + 1,
        ...p,
      })),
      emergencyContacts: emergency.map((e, eIndex) => ({
        id: e.id ?? eIndex + 1,
        ...e,
      })),
    }));

    updateBookMembershipFamily(profile.bookingId, payload);
    // console.log("📤 Payload sent:", payload);
  };

  const toggleEditStudent = (index) => {
    if (editingIndex === index) {

      const s = students[index];

      // Validation: required fields
      if (
        !s.studentFirstName?.trim() ||
        !s.studentLastName?.trim() ||
        !s.age?.toString().trim() ||
        !s.dateOfBirth?.trim()
      ) {
        showWarning("Missing fields", "Please fill all required student fields before saving.");
        return; // stop save
      }
      saveStudentData();
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "text-[#43BE4F]";
      case "attended": return "text-[#43BE4F]";
      case "frozen": return "text-[#509EF9]";
      case "cancelled": return "text-[#FC5D5D]";
      case "not attended": return "text-[#FC5D5D]";

      case "waiting list": return "text-[#A4A5A6]";
      case "request_to_cancel": return "text-[#FC5D5D]";
      case "pending": return "text-[#f1b400]";
      default: return "text-[#A4A5A6]";
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
  const noCapacityClass = profile?.noCapacityClass || profile?.noCapacityClasses || [];

  const venueOptionsnoCapacity = noCapacityClass.map(v => ({
    value: v.venueId,
    label: v.venueName,
    classes: v.classes
  }));

  // console.log('waitingListData', waitingListData)
  // console.log('transferData', transferData)
  // console.log('freezeData', freezeData)
  // console.log('cancelData', cancelData)
  // console.log('cancelWaitingList', cancelWaitingList)

  const newClasses = profile?.newClasses?.map((cls) => ({
    value: cls.id,
    label: `${cls.className} ${cls.level || cls.abilityLevel ? `(${cls.level || cls.abilityLevel})` : ""}`,
  }));
  const noCapacityClassesss = profile?.noCapacityClass || profile?.noCapacityClasses || [];

  const newClassesForWaitingList = noCapacityClassesss?.map((cls) => ({
    value: cls.id,
    label: `${cls.className} ${cls.level || cls.abilityLevel ? `(${cls.level || cls.abilityLevel})` : ""}`,
  }));

  const selectedClass = newClasses?.find(
    (cls) => cls.value === waitingListData?.classScheduleId
  );
  const selectedClassForWaitingList = newClassesForWaitingList?.find(
    (cls) => cls.value === waitingListData?.classScheduleId
  );
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
          <div className="flex justify-end mb-4">
            {
              (serviceType?.toLowerCase() == "trials" || serviceType?.toLowerCase() == "membership") && <button
                className="text-white bg-[#237FEA] px-4 py-2.5 rounded-xl"
                onClick={() => {
                  setShowAddStudent(true);
                  const finalClassId = profile?.students?.[0]?.classScheduleId;
                  if (!finalClassId) return;
                  fetchFindClassID(finalClassId);
                  setMembershipPlan(null);
                  setStep(0);
                  calculateAmount(formatLocalDate(new Date()));
                }}
              >
                Add Student
              </button>
            }
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
value={
  student?.abilityLevel?.toLowerCase?.() ||
  student?.classSchedule?.level?.toLowerCase?.() ||
  ""
}                      disabled={editingIndex !== index}
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
                          <option value="pro">Pro</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

          </div>


          <Comments
            adminInfo={adminInfo}
            comment={comment}
            setComment={setComment}
            handleSubmitComment={() => handleSubmitComment(payload, commentData)}
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
                className="m-2 px-6 rounded-3xl py-5 items-center justify-between bg-no-repeat bg-center"
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
                <div className="flex items-center justify-between gap-4">
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
                    const parentEmails = profile?.parents?.map(p => p.parentEmail).filter(Boolean) || [];
                    if (parentEmails.length > 0) {
                      openEmailPopup(parentEmails, "/api/admin/send-manual-email", { token, showError, showSuccess });
                    } else {
                      showWarning("No Email Found", "No parent email available to send email.");
                    }
                  }}
                  className="flex-1 border border-[#717073] rounded-xl py-3 text-[18px] flex items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md"
                >
                  Send Email
                </button>

                <button
                  onClick={() => {
                    const formattedParents = profile?.parents
                      ?.filter(p => p.parentPhoneNumber)
                      .map(p => ({
                        name: `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim(),
                        phone: p.parentPhoneNumber
                      })) || [];

                    if (formattedParents.length > 0) {
                      openTextPopup(
                        formattedParents,
                        "/api/admin/send-manual-text",
                        { token, showError, showSuccess }
                      );
                    } else {
                      showWarning(
                        "No Phone Numbers",
                        "No parent phone numbers available to send text."
                      );
                    }
                  }}
                  className="flex-1 border border-[#717073] rounded-xl py-3 text-[18px] flex items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md"
                >
                  Send Text
                </button>
              </div>

              {status !== "active" ? (
                <button
                  onClick={handleRenewBirthdayPackage}
                  className="w-full bg-green-50 border border-green-400 text-green-600 text-[18px] rounded-xl py-3 hover:bg-green-100 hover:shadow-md transition-all duration-300 font-medium"
                >
                  Renew Package
                </button>
              ) : (
                <button
                  onClick={handleCancelBirthdayPackage}
                  className="w-full bg-red-50 border border-red-400 text-red-600 text-[18px] rounded-xl py-3 hover:bg-red-100 hover:shadow-md transition-all duration-300 font-medium"
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
                  className="m-2 px-6 rounded-3xl py-5 items-center justify-between bg-no-repeat bg-center"
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
                  <div className='flex justify-between'>
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
                      const parentEmails = profile?.parents?.map(p => p.parentEmail).filter(Boolean) || [];
                      if (parentEmails.length > 0) {
                        openEmailPopup(parentEmails, "/api/admin/send-manual-email", { token, showError, showSuccess });
                      } else {
                        showWarning("No Email Found", "No parent email available to send email.");
                      }
                    }}
                    className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md transition-shadow duration-300"
                  >
                    Send Email
                  </button>

                  <button
                    onClick={() => {
                      const formattedParents = profile?.parents
                        ?.filter(p => p.parentPhoneNumber)
                        .map(p => ({
                          name: `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim(),
                          phone: p.parentPhoneNumber
                        })) || [];

                      if (formattedParents.length > 0) {
                        openTextPopup(
                          formattedParents,
                          "/api/admin/send-manual-text",
                          { token, showError, showSuccess }
                        );
                      } else {
                        showWarning(
                          "No Phone Numbers",
                          "No parent phone numbers available to send text."
                        );
                      }
                    }}
                    className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium"
                  >
                    Send Text
                  </button>
                </div>

                {status !== "active" ? (
                  <button
                    onClick={handleRenewPackage}
                    className="w-full bg-blue-50 border border-blue-400 text-blue-600 text-[18px] rounded-xl py-3 hover:bg-blue-100 hover:shadow-md transition-all duration-300 font-medium"
                  >
                    Renew Package
                  </button>
                ) : (
                  <button
                    onClick={handleCancelPackage}
                    className="w-full bg-red-50 border border-red-400 text-red-600 text-[18px] rounded-xl py-3 hover:bg-red-100 hover:shadow-md transition-all duration-300 font-medium"
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
                      className="m-2 px-6 rounded-3xl py-5 items-center justify-between bg-no-repeat bg-center"
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
                      <div className='flex justify-between'>
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
                          src={profile?.bookedByAdmin?.profile || "/members/user2.png"}

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
                          const parentEmails = profile?.parents?.map(p => p.parentEmail).filter(Boolean) || [];
                          if (parentEmails.length > 0) {
                            openEmailPopup(parentEmails, "/api/admin/send-manual-email", { token, showError, showSuccess });
                          } else {
                            showWarning("No Email Found", "No parent email available to send email.");
                          }
                        }}
                        className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 text-[#717073] font-medium hover:shadow-md transition-shadow duration-300"
                      >
                        Send Email
                      </button>

                      <button
                        onClick={() => {
                          const formattedParents = profile?.parents
                            ?.filter(p => p.parentPhoneNumber)
                            .map(p => ({
                              name: `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim(),
                              phone: p.parentPhoneNumber
                            })) || [];

                          if (formattedParents.length > 0) {
                            openTextPopup(
                              formattedParents,
                              "/api/admin/send-manual-text",
                              { token, showError, showSuccess }
                            );
                          } else {
                            showWarning(
                              "No Phone Numbers",
                              "No parent phone numbers available to send text."
                            );
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
                    {isTrials ? <div className=" m-2 px-6 rounded-3xl py-5 items-center justify-between bg-no-repeat bg-center"
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
                      <div className='flex justify-between'>
                        <div className="text-[20px] font-bold text-[#1F2937]">Account Status</div>
                        <div className="text-[16px] font-semibold text-[#1F2937]">Trials</div>
                      </div>
                      <div className="w-max bg-[#343A40] flex items-center gap-2  text-white text-[14px] px-3 py-2 rounded-xl">

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
                        className="m-2 px-6 rounded-3xl py-5 items-center justify-between bg-no-repeat bg-center"
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
                        <div className='flex justify-between '>
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
                          src={profile?.bookedByAdmin?.profile ? `${profile?.bookedByAdmin?.profile}` : "https://cdn-icons-png.flaticon.com/512/147/147144.png"}
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
                        {/* Venue — for membership and holiday camp */}
                        {(isMembership || isHolidayCamp) && (
                          <div className="mb-4">
                            <div className="text-[20px] font-bold tracking-wide">Venue</div>
                            <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md mt-1">
                              {isHolidayCamp ? profile?.holidayVenue?.name || "-" : venueName || "-"}
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
                        {!isTrials && (<>
                          {(isMembership || isBirthdayParty) && (
                            <div className="border-t border-[#495362] pt-5">
                              <div className="text-[20px] text-white">
                                {isBirthdayParty ? "Package" : "Membership Plan"}
                              </div>
                              <div className="text-[16px] mt-1 text-gray-400">
                                {MembershipPlan ? `${MembershipPlan} Plan` : "N/A"}
                              </div>
                            </div>
                          )}
                          {requestToCancelStudents?.length > 0 && (

                            <div className="border-t border-[#495362] pt-5">
                              <div className="text-[20px] text-white">
                                <div className=" text-[20px] text-white">Request to Cancel Date </div>

                              </div>
                              <div className="text-[16px] mt-1 text-gray-400">{formatISODate(profile?.cancelData?.cancelDate)}</div>
                            </div>
                          )}
                          {cancelledStudents?.length > 0 && (

                            <div className="border-t border-[#495362] pt-5">
                              <div className="text-[20px] text-white">
                                <div className=" text-[20px] text-white"> Cancelled Date </div>

                              </div>
                              <div className="text-[16px] mt-1 text-gray-400">{formatISODate(profile?.updatedAt)}</div>
                            </div>
                          )}

                          {(isMembership || isBirthdayParty || isOneToOne) && (
                            <div className="border-t border-[#495362] pt-5">
                              <div className="text-[20px] text-white">
                                {isBirthdayParty ? "Party Date" : isOneToOne ? "Session Date" : "Membership Start Date"}
                              </div>
                              <div className="text-[16px] mt-1 text-gray-400">{formatISODate(dateBooked)}</div>
                            </div>
                          )}

                          {/* Service-specific extra rows */}
                          {renderExtraInfoRows()}

                          {!isHolidayCamp && (
                            <div className="border-t border-[#495362] py-5">
                              <div className="text-[20px] text-white">Price</div>
                              <div className="text-[16px] mt-1 text-gray-400">
                                {MembershipPrice ? `£${MembershipPrice}` : "-"}
                              </div>
                            </div>
                          )}
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
                          onClick={() => {
                            const formattedParents = parents
                              .filter(p => p.parentPhoneNumber)
                              .map(p => ({
                                name: `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim(),
                                phone: p.parentPhoneNumber
                              }));

                            if (formattedParents.length > 0) {
                              openTextPopup(
                                formattedParents,
                                "/api/admin/send-manual-text",
                                { token, showError, showSuccess }
                              );
                            } else {
                              showWarning(
                                "No Phone Numbers",
                                "Selected parents do not have valid phone numbers."
                              );
                            }
                          }}
                          className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium"
                        >
                          <img src="/images/icons/sendText.png" alt="" />
                          {textloading ? <Loader2 className="animate-spin w-5 h-5 text-blue-500" /> : "Send Text"}
                        </button>
                      </div>

                      {/* Membership-only actions */}
                      {isMembership && (
                        <>
                          {
                            status === "active" &&
                            profile?.students?.every((s) => s?.studentStatus === "active") && (
                              <button
                                onClick={() => setaddToWaitingList(true)}
                                className={`w-full rounded-xl py-3 text-[18px] font-semibold transition-all duration-300 
            ${addToWaitingList
                                    ? "bg-[#12B76A] text-white shadow-md"
                                    : "bg-green-50 border border-[#12B76A] text-[#12B76A] hover:bg-green-100 hover:shadow-md"
                                  }`}
                              >
                                Add to the waiting list
                              </button>
                            )
                          }

                          {
                            status === "active" &&
                            profile?.students?.every((s) => s?.studentStatus === "active") && (
                              <button
                                onClick={() => setFreezeMembership(true)}
                                className="w-full bg-blue-50 border border-[#237FEA] text-[#237FEA] text-[18px] rounded-xl py-3 hover:bg-blue-100 hover:shadow-md transition-all duration-300 font-semibold"
                              >
                                Freeze Membership
                              </button>

                            )}


                          {
                            status == "frozen" && (

                              <button
                                onClick={() => setReactivateMembership(true)}
                                className="w-full bg-[#12B76A] text-white rounded-xl py-3 text-[18px] font-semibold hover:shadow-md transition-all duration-300"
                              >
                                Reactivate Membership
                              </button>

                            )}
                          {
                            status === "active" &&
                            profile?.students?.every((s) => s?.studentStatus === "active") && (
                              <button
                                onClick={() => setTransferVenue(true)}
                                className="w-full bg-blue-50 border border-[#237FEA] text-[#237FEA] text-[18px] rounded-xl py-3 hover:bg-blue-100 hover:shadow-md transition-all duration-300 font-semibold"
                              >
                                Transfer Class
                              </button>
                            )}

                          {status === 'waiting list' && canCancelTrial && (
                            <button
                              onClick={() => setRemoveWaiting(true)}
                              className="w-full bg-green-50 border border-green-400 text-green-600 text-[18px] rounded-xl py-3 hover:bg-green-100 hover:shadow-md transition-all duration-300 font-medium"
                            >
                              Remove Waiting List
                            </button>
                          )}

                          {(status === 'active' || status === 'frozen' || status === "request_to_cancel") && canCancelTrial && (
                            <>

                              <button
                                onClick={() => setshowCancelTrial(true)}
                                className={`w-full border text-[18px] rounded-xl py-3 font-semibold transition-all duration-300
                                                       ${showCancelTrial ? "bg-[#B42318] text-white shadow-md border-transparent" : "bg-red-50 border-[#B42318] text-[#B42318] hover:bg-red-100 hover:shadow-md"}`}
                              >
                                Cancel Memberships
                              </button>
                            </>
                          )}
                          {requestToCancelStudents?.length > 0 && canCancelTrial && (
                            <button
                              onClick={() => openRevertPopup(id, students)}
                              className="w-full bg-green-50 border border-green-400 text-green-600 text-[18px] rounded-xl py-3 hover:bg-green-100 hover:shadow-md transition-all duration-300 font-medium"
                            >
                              Revert Membership
                            </button>
                          )}

                          {!profile?.paymentPlan && profile?.classSchedule?.capacity !== 0 && status !== 'active' && status !== "request_to_cancel" && (
                            <button
                              onClick={handleBookMembership}
                              className="w-full bg-green-50 border border-green-400 text-green-600 text-[18px] rounded-xl py-3 hover:bg-green-100 hover:shadow-md transition-all duration-300 font-medium"
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
                          onClick={() => {
                            const formattedParents = parents
                              ?.filter(p => p.parentPhoneNumber)
                              .map(p => ({
                                name: `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim(),
                                phone: p.parentPhoneNumber
                              })) || [];

                            if (formattedParents.length > 0) {
                              openTextPopup(
                                formattedParents,
                                "/api/admin/send-manual-text",
                                { token, showError, showSuccess }
                              );
                            } else {
                              showWarning(
                                "No Phone Numbers",
                                "Selected parents do not have valid phone numbers."
                              );
                            }
                          }}
                          className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium"
                        >
                          <img src="/images/icons/sendText.png" alt="" />
                          {textloading ? <Loader2 className="animate-spin w-5 h-5 text-blue-500" /> : "Send Text"}
                        </button>
                      </div>

                      {isMembership && (
                        <>

                          {cancelledStudents?.length > 0 && canCancelTrial && (

                            <button
                              onClick={handleReinstateMembership}
                              className={`w-full rounded-xl py-3 text-[18px] font-medium transition-shadow duration-300 
                   ${addToWaitingList
                                  ? "bg-[#237FEA] text-white shadow-md"   // Active state
                                  : "bg-white  border border-gray-300  hover:bg-blue-700 text-[#717073] hover:text-white hover:shadow-md"
                                }`}
                            >
                              Reinstate Membership

                            </button>
                          )}

                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
        }
            {addToWaitingList && isMembership && (
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
                     
                                                     {/* Common Venue Selection */}
                                                     {waitingListData.selectedStudents.length > 0 && (
                                                         <div>
                                                             <label className="block text-[16px] font-semibold">Select New Venue</label>
                                                             <Select
                                                                 value={
                                                                     waitingListData.venueId
                                                                         ? venueOptionsnoCapacity.find(v => v.value === waitingListData.venueId)
                                                                         : null
                                                                 }
                                                                 onChange={(selected) => {
                                                                     const newVenueId = selected?.value;
                                                                     setWaitingListData(prev => {
                                                                         const updatedConfigs = { ...prev.studentConfigs };
                                                                         Object.keys(updatedConfigs).forEach(studentId => {
                                                                             updatedConfigs[studentId] = {
                                                                                 ...updatedConfigs[studentId],
                                                                                 classScheduleId: null
                                                                             };
                                                                         });
                                                                         return {
                                                                             ...prev,
                                                                             venueId: newVenueId,
                                                                             studentConfigs: updatedConfigs
                                                                         };
                                                                     });
                                                                 }}
                                                                 options={venueOptionsnoCapacity}
                                                                 placeholder="Select Venue"
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
                                                     )}
                     
                                                     {/* Per-Student Configuration */}
                                                     {waitingListData.selectedStudents.length > 0 && (
                                                         <div className="space-y-6 border-t pt-4 mt-6">
                                                             {waitingListData.selectedStudents.map((studentOption) => {
                                                                 const studentId = studentOption.value;
                                                                 const config = waitingListData.studentConfigs?.[studentId] || {};
                                                                 const currentClass = `${studentOption.classSchedule?.className || "-"} ${studentOption.classSchedule?.level || studentOption.abilityLevel ? `(${studentOption.classSchedule?.level || studentOption.abilityLevel})` : ""}`;
                                                                 const selectedVenue = venueOptionsnoCapacity.find(v => v.value === waitingListData.venueId);
                                                                 const classOptions = selectedVenue
                                                                     ? selectedVenue.classes.map(cls => ({
                                                                         value: cls.id,
                                                                         label: `${cls.className} ${cls.level || cls.abilityLevel ? `(${cls.level || cls.abilityLevel})` : ""}`,
                                                                     }))
                                                                     : [];
                     
                                                                 return (
                                                                     <div key={studentId} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                                                                         <h3 className="font-semibold capitalize text-lg text-gray-800 pb-2">
                                                                             {studentOption.label}
                                                                         </h3>
                     
                                                                         {/* Current Class only — venue is common above */}
                                                                         <div>
                                                                             <label className="block text-sm font-semibold mb-1">Current Class / Level</label>
                                                                             <input
                                                                                 type="text"
                                                                                 className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                                                                                 value={currentClass}
                                                                                 readOnly
                                                                             />
                                                                         </div>
                     
                                                                         {/* Select New Class / Level */}
                                                                         <div>
                                                                             <label className="block text-[16px] font-semibold">Select New Class / Level</label>
                                                                             <Select
                                                                                 value={config.classScheduleId ? classOptions.find(c => c.value === config.classScheduleId) : null}
                                                                                 onChange={(selected) =>
                                                                                     handleWaitingListConfigChange(studentId, "classScheduleId", selected?.value)
                                                                                 }
                                                                                 options={classOptions}
                                                                                 placeholder={waitingListData.venueId ? "Select Class" : "Select venue first"}
                                                                                 isDisabled={!waitingListData.venueId}
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
                     
                                                                         {/* Interest Level */}
                                                                         <div>
                                                                             <label className="block text-[16px] font-semibold mb-2">Interest Level</label>
                                                                             <div className="flex gap-6">
                                                                                 {["Low", "Medium", "High"].map((level) => (
                                                                                     <label key={level} className="flex items-center gap-2 cursor-pointer">
                                                                                         <input
                                                                                             type="radio"
                                                                                             name="interest"
                                                                                             value={level}
                                                                                             checked={waitingListData.interest === level}
                                                                                             onChange={(e) =>
                                                                                                 setWaitingListData((prev) => ({
                                                                                                     ...prev,
                                                                                                     interest: e.target.value
                                                                                                 }))
                                                                                             }
                                                                                         />
                                                                                         {level}
                                                                                     </label>
                                                                                 ))}
                                                                             </div>
                                                                         </div>
                                                                     </div>
                                                                 );
                                                             })}
                                                         </div>
                                                     )}
                     
                                                     {/* Preferred Start Date */}
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
                     
                                                     {/* Submit Button */}
                                                     <div className="justify-end flex gap-4 pt-4">
                                                         <button
                                                             className="w-1/2 bg-[#12B76A] text-white rounded-xl py-3 text-[18px] font-semibold hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                                             disabled={waitingListData.selectedStudents.length === 0}
                                                             onClick={() => {
                                                                 if (waitingListData.selectedStudents.length === 0) {
                                                                     showWarning("Missing Information", "Please select at least one student.");
                                                                     return;
                                                                 }
                                                                 if (!waitingListData.venueId) {
                                                                     showWarning("Missing Information", "Please select a venue.");
                                                                     return;
                                                                 }
                                                                 if (!waitingListData.interest) {
                                                                     showWarning("Missing Information", "Please select interest level.");
                                                                     return;
                                                                 }
                     
                                                                 const studentsPayload = waitingListData.selectedStudents.map(studentOption => {
                                                                     const config = waitingListData.studentConfigs?.[studentOption.value] || {};
                                                                     return {
                                                                         studentId: studentOption.value,
                                                                         classScheduleId: config.classScheduleId,
                                                                         venueId: waitingListData.venueId
                                                                     };
                                                                 });
                     
                                                                 const incomplete = studentsPayload.some(s => !s.classScheduleId || !s.venueId);
                                                                 if (incomplete) {
                                                                     showWarning("Missing Information", "Please select a new class for all selected students.");
                                                                     return;
                                                                 }
                     
                                                                 const selectedConfigs = waitingListData.selectedStudents.map((studentOption) => {
                                                                     const config = waitingListData.studentConfigs?.[studentOption.value] || {};
                                                                     const fullStudent = profile.students.find(s => s.id === studentOption.value);
                                                                     return {
                                                                         studentFirstName: fullStudent.studentFirstName,
                                                                         studentLastName: fullStudent.studentLastName,
                                                                         dateOfBirth: fullStudent.dateOfBirth,
                                                                         age: fullStudent.age,
                                                                         gender: fullStudent.gender,
                                                                         medicalInformation: fullStudent.medicalInformation,
                                                                         classScheduleId: config.classScheduleId,
                                                                         venueId: waitingListData.venueId
                                                                     };
                                                                 });
                     
                                                                 const payload = {
                                                                     existingBookingId: waitingListData.bookingId,
                                                                     interest: waitingListData.interest,
                                                                     venueId: waitingListData.venueId,
                                                                     totalStudents: selectedConfigs.length,
                                                                     preferredStartDate: waitingListData.startDate,
                                                                     additionalNote: waitingListData.notes,
                                                                     students: selectedConfigs,
                                                                     parents: profile.parents.map((p) => ({
                                                                         parentFirstName: p.parentFirstName,
                                                                         parentLastName: p.parentLastName,
                                                                         parentEmail: p.parentEmail,
                                                                         parentPhoneNumber: p.parentPhoneNumber,
                                                                         relationToChild: p.relationToChild,
                                                                         interestReason: p.interestReason,
                                                                         interestReasonOther: p.interestReasonOther,
                                                                         howDidYouHear: p.howDidYouHear,
                                                                         isCustomReason: false
                                                                     })),
                                                                     emergency: {
                                                                         sameAsAbove: true,
                                                                         emergencyFirstName: profile.emergency?.[0]?.emergencyFirstName,
                                                                         emergencyLastName: profile.emergency?.[0]?.emergencyLastName,
                                                                         emergencyPhoneNumber: profile.emergency?.[0]?.emergencyPhoneNumber,
                                                                         emergencyRelation: profile.emergency?.[0]?.emergencyRelation
                                                                     }
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
     

        {showAddStudent && (
          <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
              <button
                className="absolute top-4 left-4 p-2"
                onClick={() => setShowAddStudent(false)}
              >
                <img src="/images/icons/cross.png" alt="Close" />
              </button>

              <div className="text-center py-6 border-b border-gray-300">
                <h2 className="font-semibold text-[24px]">Add Student</h2>
              </div>

              <div className="space-y-4 px-6 pb-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[16px] font-semibold">First Name</label>
                    <input
                      type="text"
                      className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter first name"
                      value={newStudent.studentFirstName}
                      onChange={(e) => setNewStudent({ ...newStudent, studentFirstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[16px] font-semibold">Last Name</label>
                    <input
                      type="text"
                      className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter last name"
                      value={newStudent.studentLastName}
                      onChange={(e) => setNewStudent({ ...newStudent, studentLastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[16px] font-semibold">Date of Birth</label>
                    <input
                      type="text"
                      className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      placeholder="YYYY-MM-DD"
                      value={newStudent.dateOfBirth}
                      onChange={(e) => {
                        const dob = e.target.value;
                        setNewStudent({ ...newStudent, dateOfBirth: dob });

                        // Attempt to calculate age if the format seems valid (10 chars: YYYY-MM-DD)
                        if (dob.length === 10) {
                          const age = calculateAge(dob);
                          if (age !== "") {
                            setNewStudent(prev => ({ ...prev, dateOfBirth: dob, age: age }));
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[16px] font-semibold">Age</label>
                    <input
                      type="number"
                      className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter age"
                      value={newStudent.age}
                      onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[16px] font-semibold">Gender</label>
                  <select
                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[16px] font-semibold">Ability Level</label>
                  <select
                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={newStudent.abilityLevel}
                    onChange={(e) => setNewStudent({ ...newStudent, abilityLevel: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[16px] font-semibold">Medical Information</label>
                  <textarea
                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    rows={3}
                    placeholder="Enter medical information"
                    value={newStudent.medicalInformation}
                    onChange={(e) => setNewStudent({ ...newStudent, medicalInformation: e.target.value })}
                  />
                </div>


                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white mt-4 rounded-2xl shadow p-6 font-semibold space-y-4 text-[16px]"
                >

                  <div className="mb-5">
                    <label className="text-base font-semibold">Membership Plan</label>
                    <div className="relative mt-2">
                      <Select
                        options={paymentPlanOptions}
                        value={membershipPlan}
                        onChange={handlePlanChange}
                        placeholder="Choose Plan"
                        classNamePrefix="react-select"
                        isClearable
                      />
                    </div>
                  </div>
                  {/* Step 2 – Calendar */}
                  {membershipPlan && step === 0 && (
                    <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                      <div className="flex justify-center gap-5 items-center mb-3">
                        <button
                          type="button"
                          onClick={goToPreviousMonth}
                          className="w-8 h-8 rounded-full border border-black flex items-center justify-center bg-white text-black hover:bg-black hover:text-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <p className="font-semibold text-[18px]">
                          {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
                        </p>
                        <button
                          type="button"
                          onClick={goToNextMonth}
                          className="w-8 h-8 rounded-full border border-black flex items-center justify-center bg-white text-black hover:bg-black hover:text-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 text-xs gap-1 text-gray-500 mb-1">
                        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                          <div key={i} className="font-medium text-center">{day}</div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1">
                        {(() => {
                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const calendarDays = [];
                          for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calendarDays.push(null);
                          for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));

                          return Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                            const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);
                            return (
                              <div key={weekIndex} className="grid grid-cols-7 text-[16px] gap-1 py-1 rounded">
                                {week.map((date, i) => {
                                  if (!date) return <div key={i} />;
                                  const formattedDate = formatLocalDate(date);
                                  const isAvailable = sessionDatesSet.has(formattedDate);
                                  const isSelected = selectedDate === formattedDate;
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const current = new Date(date);
                                  current.setHours(0, 0, 0, 0);
                                  const isPastAvailable = isAvailable && current < today;

                                  return (
                                    <div key={i} className="relative group" title={isAvailable ? (isPastAvailable ? "Past Class" : "Available Class") : "No Class"}>
                                      <div
                                        onClick={() => isAvailable && !isPastAvailable && handleDateClick(date)}
                                        className={`w-8 h-8 flex items-center justify-center mx-auto rounded-full cursor-pointer transition-all
                                          ${isSelected ? "bg-blue-600 text-white font-bold" : isAvailable && !isPastAvailable ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "text-gray-300 cursor-not-allowed"}
                                          ${isPastAvailable ? "opacity-40" : ""}
                                        `}
                                      >
                                        {date.getDate()}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                  {/* ── Step 0: Pricing summary ── */}
                  {step === 0 && (
                    <>
                      <div className="flex justify-between text-[#333]">
                        <span>Membership Plan</span>
                        <span>
                          {membershipPlan?.all?.duration}{" "}
                          {membershipPlan?.all?.interval}
                          {membershipPlan?.all?.duration > 1 ? "s" : ""}
                        </span>
                      </div>

                      {membershipPlan?.all?.duration > 1 && (
                        <div className="flex justify-between text-[#333]">
                          <span>Monthly Payment</span>
                          <span>£{pricingBreakdown?.nextMonthPayment?.toFixed(2)} p/m</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4 space-y-2">
                        <div className="flex justify-between text-[#333]">
                          <span>Price Per Lesson</span>
                          <span>£{pricingBreakdown.pricePerClassPerChild}</span>
                        </div>
                        {pricingBreakdown.isFullMonthCharge ? (
                          <div className="flex justify-between text-[#000]">
                            <span>Full Monthly Charge</span>
                            <span>£{pricingBreakdown.nextMonthPayment?.toFixed(2)}</span>
                          </div>
                        ) : (
                          <>
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

                      <button
                        onClick={() => setStep(1)}
                        className="flex justify-center w-full bg-[#042C89] text-white rounded-[6px] px-6 py-2 font-semibold hover:bg-blue-800"
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {/* ── Step 1: Direct Debit ── */}
                  {step === 1 && (
                    <div className="max-w-xl mx-auto space-y-4">
                      <h2 className="text-xl font-semibold">Set up your direct debit</h2>

                      <label className="block">
                        <span className="block text-gray-700 text-[14px] mb-1">Email address</span>
                        <input
                          type="email"
                          placeholder="Email address"
                          value={payment.email}
                          onChange={(e) => setPayment({ ...payment, email: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                        />
                      </label>

                      <label className="block">
                        <span className="block text-gray-700 text-[14px] mb-1">Account Holder Name</span>
                        <input
                          type="text"
                          placeholder="Account Holder Name"
                          value={payment.account_holder_name}
                          onChange={(e) => {
                            const fullName = e.target.value;
                            const parts = fullName.trim().split(" ");
                            setPayment({ ...payment, account_holder_name: fullName, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") });
                          }}
                          className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
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
                      <div className="flex gap-3 w-full">
                        <label className="block w-full">
                          <span className="block text-gray-700 text-[14px] mb-1">Sort Code</span>
                          <input
                            type="text"
                            placeholder="Sort Code"
                            onChange={(e) =>
                              setPayment({ ...payment, branch_code: e.target.value.replace(/\D/g, "") })
                            }
                            className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                          />
                        </label>
                        <label className="block w-full">
                          <span className="block text-gray-700 text-[14px] mb-1">Account Number</span>
                          <input
                            type="text"
                            placeholder="Account Number"
                            onChange={(e) =>
                              setPayment({ ...payment, account_number: e.target.value.replace(/\D/g, "") })
                            }
                            className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                          />
                        </label>
                      </div>

                      <label className="flex gap-2 text-sm">
                        <input type="checkbox" />
                        <span className="underline text-gray-700">
                          I can authorise Direct Debits on this account myself
                        </span>
                      </label>

                      <div className="flex justify-between">
                        <button
                          onClick={() => setStep(0)}
                          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setStep(2)}
                          className="bg-[#042C89] text-white px-6 py-2 rounded-md"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Step 2: Checkout (Stripe) ── */}
                  {step === 2 && (
                    <div className="max-w-xl mx-auto space-y-4">
                      <h2 className="text-xl font-semibold">Checkout</h2>

                      <label className="block">
                        <span className="block text-gray-700 text-[14px] mb-1">Name on card</span>
                        <input
                          placeholder="Name on card"
                          value={nameOnCard}
                          onChange={(e) => handleCheckoutChange("nameOnCard", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                        />
                        {errors.nameOnCard && (
                          <p className="text-red-500 text-xs mt-1">{errors.nameOnCard}</p>
                        )}
                      </label>

                      {/* ✅ FIX 6: typo "Card numbser" → "Card number" */}
                      <label className="block">
                        <span className="block text-gray-700 text-[14px] mb-1">Card number</span>
                        <input
                          placeholder="Card number"
                          value={cardNumber}
                          onChange={(e) => handleCheckoutChange("cardNumber", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                        />
                        {errors.cardNumber && (
                          <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                        )}
                      </label>

                      <div className="flex gap-3 w-full">
                        <label className="block w-full">
                          <span className="block text-gray-700 text-[14px] mb-1">MM/YY</span>
                          <input
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => handleCheckoutChange("expiryDate", e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                          />
                          {errors.expiryDate && (
                            <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                          )}
                        </label>
                        <label className="block w-full">
                          <span className="block text-gray-700 text-[14px] mb-1">CVC</span>
                          <input
                            placeholder="CVC"
                            value={cvc}
                            onChange={(e) => handleCheckoutChange("cvc", e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                          />
                          {errors.cvc && (
                            <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>
                          )}
                        </label>

                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-700 poppins text-[14px] font-medium mb-1">Postal Code<span className="text-red-500 ml-0.5">*</span></label>
                        <input type="text" value={zipCode} onChange={(e) => handleCheckoutChange("zipCode", e.target.value)}
                          placeholder="Enter Postal Code" className="w-full bg-white border border-gray-200 rounded-[6px] px-4 py-2"
                        />
                        {errors.zipCode && <span className="text-red-500 text-[12px] mt-1 block">{errors.zipCode}</span>}
                      </div>

                      <p className="text-lg font-semibold">
                        Total: £{pricingBreakdown?.totalAmountToday?.toFixed(2)}
                      </p>

                      <div className="flex justify-between">
                        <button
                          onClick={() => setStep(1)}
                          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md"
                        >
                          Back
                        </button>
                        {/* ✅ FIX 7: button is disabled while submitting + shows spinner */}
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="bg-green-600 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing…
                            </>
                          ) : (
                            "Pay Now"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>


                {step === 0 && (
                  <div className="flex gap-4 pt-4 justify-between">
                    <button
                      type="button"
                      className="w-1/2 border border-gray-300 text-gray-700 rounded-xl py-3 text-[18px] font-medium hover:bg-gray-50 transition-all"
                      onClick={() => setShowAddStudent(false)}
                    >
                      Back
                    </button>
                    <button
                      className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                      onClick={() => {
                        if (!newStudent.studentFirstName || !newStudent.studentLastName || !newStudent.age || !newStudent.dateOfBirth) {
                          showWarning("Missing Information", "Please fill in all required fields.");
                          return;
                        }
                        if (!membershipPlan) {
                          showWarning("Missing Plan", "Please select a membership plan for the new student.");
                          return;
                        }
                        if (!selectedDate) {
                          showWarning("Missing Start Date", "Please select a start date from the calendar.");
                          return;
                        }
                        setStep(1);
                      }}
                    >
                      Continue
                    </button>
                  </div>
                )}
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
                <div className="flex gap-4 pt-4 justify-end">
                  <button
                    className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                    onClick={() => reactivateDataSubmit(reactivateData, 'allMembers')}

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
                      // Validation
                      if (!cancelData.cancellationType) {

                        showWarning("Missing Field", "Please select a cancellation type.");
                        return;
                      }

                      if (cancelData.cancellationType !== "immediate" && !cancelData.cancelDate) {
                        showWarning("Missing Field", "Please select a cancellation effective date.");
                        return;
                      }

                      if (!cancelData.cancelReason) {
                        showWarning("Missing Field", "Please select a reason for cancellation.");
                        return;
                      }

                      // If all validations pass → call submit function

                      setshowCancelTrial(false)
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
         {transferVenue && isMembership &&  (
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
                                                     {/* Current Class / Level */}
                                                     {/* Select Student */}
                                                     <div>
                                                         <label className="block text-[16px] font-semibold">Select Student</label>
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
                                                                 control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "4px 8px", minHeight: "48px" }),
                                                                 placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                                                 dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                                                 indicatorSeparator: () => ({ display: "none" }),
                                                             }}
                                                         />
                                                     </div>
                     
                                                     {/* ✅ COMMON Venue Selection — outside student loop */}
                                                     {/* ✅ COMMON Venue Selection */}
                                                     {transferData.selectedStudents.length > 0 && (
                                                         <div>
                                                             <label className="block text-[16px] font-semibold">Select Venue</label>
                                                             <Select
                                                                 value={transferData.selectedVenue}
                                                                 onChange={(selected) =>
                                                                     setTransferData(prev => ({
                                                                         ...prev,
                                                                         selectedVenue: selected,
                                                                         studentTransfers: Object.fromEntries(
                                                                             Object.entries(prev.studentTransfers).map(([k, v]) => [k, { ...v, classScheduleId: null }])
                                                                         )
                                                                     }))
                                                                 }
                                                                 options={venueOptions}
                                                                 placeholder="Select Venue"
                                                                 isSearchable
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
                                                     )}
                                                     {/* Per-Student Configuration */}
                                                     {transferData.selectedStudents.length > 0 && (
                                                         <div className="space-y-6  pt-4">
                                                             {transferData.selectedStudents.map((studentOption) => {
                                                                 const studentId = studentOption.value;
                                                                 const studentConfig = transferData.studentTransfers?.[studentId] || {};
                                                                 const currentClass = `${studentOption.classSchedule?.className || "-"} ${studentOption.classSchedule?.level || studentOption.abilityLevel ? `(${studentOption.classSchedule?.level || studentOption.abilityLevel})` : ""}`;
                     
                                                                 const filteredClasses = transferData.selectedVenue?.classes?.map(cls => ({
                                                                     value: cls.id,
                                                                     label: `${cls.className} ${cls.level || cls.abilityLevel ? `(${cls.level || cls.abilityLevel})` : ""}`,
                                                                 })) || [];
                     
                                                                 return (
                                                                     <div key={studentId} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                                                                         <h3 className="font-semibold capitalize text-lg text-gray-800 pb-2">
                                                                             {studentOption.label}
                                                                         </h3>
                     
                                                                         {/* Current Info */}
                                                                         <div className="grid gap-4 text-sm text-gray-600">
                                                                             <div>
                                                                                 <label className="block text-sm font-semibold mb-1">Current Venue</label>
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                                                                                     value={profile?.venue?.name || "-"}
                                                                                     readOnly
                                                                                 />
                                                                             </div>
                                                                             <div>
                                                                                 <label className="block text-sm font-semibold mb-1">Current Class / Level</label>
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                                                                                     value={currentClass}
                                                                                     readOnly
                                                                                 />
                                                                             </div>
                                                                         </div>
                     
                                                                         {/* ✅ NO venue dropdown here anymore */}
                     
                                                                         {/* New Class Select */}
                                                                         <div>
                                                                             <label className="block text-sm font-semibold mb-1">New Class / Level</label>
                                                                             <Select
                                                                                 value={studentConfig.classScheduleId ? filteredClasses.find(c => c.value === studentConfig.classScheduleId) : null}
                                                                                 onChange={(selected) => handleTransferConfigChange(studentId, "classScheduleId", selected?.value)}
                                                                                 options={filteredClasses}
                                                                                 placeholder={transferData.selectedVenue ? "Select New Class / Level" : "Select venue first"}
                                                                                 isDisabled={!transferData.selectedVenue}
                                                                                  styles={{
                                                                 control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "4px 8px", minHeight: "48px" }),
                                                                 placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                                                 dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                                                 indicatorSeparator: () => ({ display: "none" }),
                                                             }}
                                                                             />
                                                                         </div>
                     
                                                                         {/* Reason */}
                                                                         <div>
                                                                             <label className="block text-sm font-semibold mb-1">Reason for Transfer</label>
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
                                                             className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-semibold hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                                             disabled={transferData.selectedStudents.length === 0}
                                                             onClick={() => {
                                                                 if (!transferData.selectedStudents.length) {
                                                                     showWarning("Missing Information", "Please select at least one student.");
                                                                     return;
                                                                 }
                                                                 if (!transferData.selectedVenue) {
                                                                     showWarning("Missing Information", "Please select a venue.");
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
                                                             }
                                                             }
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
                        showWarning("Incomplete Form", "Please fill in all the required fields before submitting:");

                        return;
                      }

                      // ✅ Submit when all fields are filled
                      setFreezeMembership(false)
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

export default StudentProfile;
