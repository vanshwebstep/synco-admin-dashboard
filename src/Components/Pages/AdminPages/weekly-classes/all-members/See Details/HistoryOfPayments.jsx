import { useState, useMemo, useEffect, useRef } from "react";
import { useClassSchedule } from "../../../contexts/ClassScheduleContent";
import { getNames } from "country-list";
import Select from "react-select";
import { Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBookFreeTrial } from "../../../contexts/BookAFreeTrialContext";
import { useNotification } from "../../../contexts/NotificationContext";

const IS_SANDBOX = import.meta.env.VITE_PAYMENT_ENV === "sandbox";

const HistoryOfPayments = ({ stateData }) => {
  const { fetchFindClassID, singleClassSchedulesOnly, loading } = useClassSchedule() || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createBookMembership, updateBookMembership } = useBookFreeTrial() || {};
  const hasInitialized = useRef(false);

  // ── Card / checkout state ──
  const [nameOnCard, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [checkoutCountry, setCheckoutCountry] = useState("United States");
  const [zipCode, setZipCode] = useState("");
  const [errors, setErrors] = useState({});           // ✅ FIX 1: was missing
  const [directDebitData, setDirectDebitData] = useState([]);

  // Refs for focusing on errors
  const emailRef = useRef(null);
  const accountHolderNameRef = useRef(null);
  const line1Ref = useRef(null);
  const cityRef = useRef(null);
  const postalCodeRef = useRef(null);
  const branchCodeRef = useRef(null);
  const accountNumberRef = useRef(null);
  const nameOnCardRef = useRef(null);
  const cardNumberRef = useRef(null);
  const expiryDateRef = useRef(null);
  const cvcRef = useRef(null);
  const zipCodeRef = useRef(null);

  // ── Popup / plan / calendar state ──
  const [showPopup, setShowPopup] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState(null);
  const [proRataCode, setProRataCode] = useState("");
  const [remainingLessons, setRemainingLessons] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [isProRataLoading, setIsProRataLoading] = useState(false);
  const [step, setStep] = useState(0);

  // ── Booking success ──
  const [isBooked, setIsBooked] = useState(false);    // ✅ FIX 2: was missing

  // ── Warning state ──
  const [warning, setWarning] = useState(null);       // ✅ FIX 3: was missing

  const PAYMENT_TYPES = {
    ACCESS_PAY_SUITE: "accesspaysuite",
    GOCARDLESS: "gocardless",
    STRIPE: "stripe",
  };

  const { adminInfo } = useNotification() || {};
  const isFranchisee =
    adminInfo?.role?.role === "Franchisee" ||
    singleClassSchedulesOnly?.venue?.admins?.role?.role === "Franchisee";

  const subscriptionPaymentType = isFranchisee
    ? PAYMENT_TYPES.GOCARDLESS
    : PAYMENT_TYPES.ACCESS_PAY_SUITE;

  const [payment, setPayment] = useState({
    paymentType: subscriptionPaymentType,
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

  useEffect(() => {
    if (subscriptionPaymentType) {
      setPayment(prev => ({ ...prev, paymentType: subscriptionPaymentType }));
    }
  }, [subscriptionPaymentType]);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [proRataDiscountData, setProRataDiscountData] = useState(null);
  const [isProRataApplied, setIsProRataApplied] = useState(false);
  const [isProRataChecked, setIsProRataChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);   // stores formatted "YYYY-MM-DD" string
  const [isOpenMembership, setIsOpenMembership] = useState(false);
  const [numberOfStudents, setNumberOfStudents] = useState(stateData.students?.length || 0);
  const [isApplied, setIsApplied] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [isDiscountLoading, setIsDiscountLoading] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState({
    pricePerClassPerChild: 0,
    numberOfLessonsProRated: 0,
    costOfProRatedLessons: 0,
    finalProRataCost: 0,
    starterPack: 0,
    starterDiscount: 0,
    totalBeforeDiscount: 0,
    totalAmountToday: 0,
    nextMonthPayment: 0,
    isFullMonthCharge: false,
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  console.log("stateData", stateData);

  const singleclassschedule = singleClassSchedulesOnly;
  console.log("singleclassschedule", singleclassschedule);

  // ── HELPERS ──
  const safeValue = (val, fallback = "-") =>
    val !== null && val !== undefined && val !== "" ? val : fallback;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
  };

  const formatLocalDate = (date) => {
    if (!date) return null;
    if (typeof date === "string") return date;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isSameDate = (d1, d2) => {
    if (!d1 || !d2) return false;
    return formatLocalDate(d1) === formatLocalDate(d2);
  };

  // ✅ FIX 3: showWarning helper
  const showWarning = (title, message) => {
    setWarning({ title, message });
    setTimeout(() => setWarning(null), 4000);
  };

  // ── PLAN OPTIONS ──
  const paymentPlanOptions = useMemo(() => {
    const all = singleClassSchedulesOnly?.venue?.paymentGroups?.[0]?.paymentPlans?.map((plan) => ({
      label: `${plan.title} (${plan.students} student${plan.students > 1 ? "s" : ""})`,
      value: plan.id,
      starterPackPrice: singleClassSchedulesOnly?.starterPack?.[0]?.price || 0,
      all: plan,
    })) || [];

    let filtered = numberOfStudents
      ? all.filter((plan) => plan.all?.students === Number(numberOfStudents))
      : all;

    // ✅ Don't show plans which are already used (current plan)
    if (stateData?.paymentPlan?.id) {
      filtered = filtered.filter(plan => plan.value !== stateData.paymentPlan.id);
    }

    return filtered;
  }, [singleClassSchedulesOnly, numberOfStudents, stateData]);

  const countryOptions = useMemo(() => {
    return getNames().map((name) => ({ label: name, value: name }));
  }, []);

  // ── SESSION & EXCLUSION DATES ──
  const sessionDates = singleClassSchedulesOnly?.venue?.termGroups?.flatMap(group =>
    group.terms.flatMap(term => term.sessionsMap.map(s => s.sessionDate))
  ) || [];


  const sessionDatesSet = new Set(sessionDates);

  useEffect(() => {
    if (hasInitialized.current || !sessionDatesSet || sessionDatesSet.size === 0) return;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const allDates = Array.from(sessionDatesSet).map(dateStr => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    })
      .filter(d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date >= todayDate;
      })
      .sort((a, b) => a - b);
    if (allDates.length === 0) return;
    const earliestDate = allDates[0];
    setCurrentDate(new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1));
    hasInitialized.current = true;
  }, [sessionDatesSet]);

  useEffect(() => {
    if (selectedDate && membershipPlan) calculateAmount(selectedDate);
  }, [numberOfStudents, membershipPlan, selectedDate, isApplied, appliedDiscount, proRataDiscountData]);



  // ── HANDLERS ──
  const handleChangeClick = async () => {
    const finalClassId = stateData?.students?.[0]?.classScheduleId;
    if (!finalClassId) return;
    await fetchFindClassID(finalClassId);
    setMembershipPlan(null);
    setSelectedDate(null);
    setIsOpenMembership(false);
    setStep(0);
    setIsBooked(false);
    setIsPopupOpen(true);
  };

  const handlePlanChange = (selected) => {
    setMembershipPlan(selected);
    setSelectedPlanData(selected?.all || null);
    setSelectedDate(null);
    setIsOpenMembership(false);
  };

  const calculateAmount = (startDate) => {
    if (!membershipPlan || !startDate) return;

    const monthlyPrice = Number(membershipPlan?.all?.price ?? 0);
    // In "Change Membership" we might not always charge starter pack, 
    // but aligning with "Book a Membership" logic:
    const starterPack = singleClassSchedulesOnly?.venue?.starterPack
      ? Number(membershipPlan?.starterPackPrice || 0)
      : 0;

    const parseLocalDate = (dateStr) => {
      if (!dateStr) return null;
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

    const effectiveLessonCharge = isFullMonth ? monthlyPrice : finalProRata;

    let starterDiscountAmount = 0;
    if (isApplied && appliedDiscount?.data) {
      if (appliedDiscount.data.type === "percentage")
        starterDiscountAmount = (starterPack * Number(appliedDiscount.data.value)) / 100;
      else
        starterDiscountAmount = Number(appliedDiscount.data.discountAmount || 0);
    }

    const totalBeforeDiscount = effectiveLessonCharge;
    const finalTotal = Math.max(totalBeforeDiscount - starterDiscountAmount, 0);
    const totalToday = Number(finalTotal.toFixed(2));
    const nextMonthPayment = Number(monthlyPrice.toFixed(2));

    setRemainingLessons(proRataLessons);
    setCalculatedAmount(totalToday);
    setPricingBreakdown({
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
    });

    return totalToday;
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setIsApplied(false);
      return;
    }
    setIsDiscountLoading(true);
    const token = localStorage.getItem("adminToken");
    const payload = {
      starterPack: singleClassSchedulesOnly?.starterPack?.[0]?.price || 0,
      code: discountCode
    };
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/book-membership/apply-discount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result?.status) {
        setAppliedDiscount(result);
        setIsApplied(true);
      } else {
        showWarning("Invalid Code", result?.message || "Discount code is invalid.");
        setIsApplied(false);
      }
    } catch (error) {
      console.error("Discount error:", error);
      showWarning("Error", "Failed to apply discount.");
    } finally {
      setIsDiscountLoading(false);
    }
  };

  // ✅ FIX 4: handleDateClick stores formatted string, not raw Date
  const handleDateClick = (date) => {
    const formattedDate = formatLocalDate(date);

    if (selectedDate === formattedDate) {
      setSelectedDate(null);
      calculateAmount(null);
      setIsOpenMembership(false);
    } else {
      setSelectedDate(formattedDate);
      calculateAmount(formattedDate);
      setIsOpenMembership(true);
    }
  };

  // ── CALENDAR LOGIC ──
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1));

  // ✅ FIX 5: validateField implementation
  const validateField = (field, value) => {
    switch (field) {
      case "email":
        return !value?.trim() ? "Email is required" : (!/\S+@\S+\.\S+/.test(value) ? "Invalid email address" : null);
      case "account_holder_name":
        return !value?.trim() ? "Account holder name is required" : null;
      case "line1":
        return !value?.trim() ? "Address line 1 is required" : null;
      case "city":
        return !value?.trim() ? "City is required" : null;
      case "postalCode":
        return !value?.trim() ? "Postal code is required" : null;
      case "branch_code":
        return !value || value.length !== 6 ? "Sort code must be 6 digits" : null;
      case "account_number":
        return !value || value.length !== 8 ? "Account number must be 8 digits" : null;
      case "nameOnCard":
        return !value?.trim() ? "Name on card is required" : null;
      case "cardNumber":
        return value.replace(/\s/g, "").length !== 16 ? "Card number must be 16 digits" : null;
      case "expiryDate":
        return !/^\d{2}\/\d{2}$/.test(value) ? "Enter expiry as MM/YY" : null;
      case "cvc":
        return value.length < 3 ? "CVC must be at least 3 digits" : null;
      case "zipCode":
        return !value?.trim() ? "Postal Code is required" : null;
      case "checkoutCountry":
        return !value?.trim() ? "Country is required" : null;
      default:
        return null;
    }
  };

  const handlePaymentChange = (field, value) => {
    setPayment(prev => ({ ...prev, [field]: value }));
    const msg = validateField(field, value);
    setErrors(prev => {
      const copy = { ...prev };
      if (msg) copy[field] = msg;
      else delete copy[field];
      return copy;
    });
  };

  const handleCheckoutChange = (field, rawValue) => {
    let value = rawValue;
    if (field === "cardNumber") value = rawValue.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    if (field === "expiryDate") {
      const digits = rawValue.replace(/\D/g, "").slice(0, 4);
      value = digits.length >= 3 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
    }
    if (field === "cvc") value = rawValue.replace(/\D/g, "").slice(0, 4);
    if (field === "zipCode") value = rawValue.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 10);

    const setters = {
      nameOnCard: setCardHolderName,
      cardNumber: setCardNumber,
      expiryDate: setExpiryDate,
      cvc: setCvc,
      checkoutCountry: setCheckoutCountry,
      zipCode: setZipCode,
    };
    setters[field]?.(value);

    const msg = validateField(field, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[field] = msg;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      showWarning("Membership Date Required", "Please select a membership date before submitting.");
      return;
    }

    const checkoutFields = ["nameOnCard", "cardNumber", "expiryDate", "cvc", "checkoutCountry", "zipCode"];
    const newErrors = {};
    let firstErrorField = null;

    checkoutFields.forEach(field => {
      let val = "";
      if (field === "nameOnCard") val = nameOnCard;
      else if (field === "cardNumber") val = cardNumber;
      else if (field === "expiryDate") val = expiryDate;
      else if (field === "cvc") val = cvc;
      else if (field === "zipCode") val = zipCode;
      else if (field === "checkoutCountry") val = checkoutCountry;

      const msg = validateField(field, val);
      if (msg) {
        newErrors[field] = msg;
        if (!firstErrorField) firstErrorField = field;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error
      const refs = {
        nameOnCard: nameOnCardRef,
        cardNumber: cardNumberRef,
        expiryDate: expiryDateRef,
        cvc: cvcRef,
        zipCode: zipCodeRef
      };
      refs[firstErrorField]?.current?.focus();
      return;
    }

    setIsSubmitting(true);
    const amountToSend = calculateAmount(selectedDate);
    const proRataToSend = pricingBreakdown.isFullMonthCharge
      ? 0
      : pricingBreakdown.finalProRataCost;

    const payload = {
      newPaymentPlanId: membershipPlan?.value ?? null,
      startDate: selectedDate,
      payment: {
        ...payment, // existing fields
        price: pricingBreakdown.nextMonthPayment,
        proRataAmount: proRataToSend,
        nameOnCard,
        cardNumber,
        expiryDate,
        cvc,
        country: checkoutCountry,
        zipCode,
      },

    };

    console.log("amountToSend", amountToSend);
    console.log("payload", payload);

    try {
      await updateBookMembership(payload, stateData.id || stateData.bookingId);
      setIsBooked(true);      // ✅ FIX 2: now defined
    } catch (error) {
      console.error("Booking error:", error);
      showWarning("Submission Error", "There was an issue submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToStep2 = () => {
    let step1Fields = ["email", "account_holder_name", "branch_code", "account_number"];

    if (!isFranchisee) {
      step1Fields = ["email", "account_holder_name", "line1", "city", "postalCode", "branch_code", "account_number"];
    }

    const newErrors = {};
    let firstErrorField = null;

    step1Fields.forEach(field => {
      const msg = validateField(field, payment[field]);
      if (msg) {
        newErrors[field] = msg;
        if (!firstErrorField) firstErrorField = field;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const refs = {
        email: emailRef,
        account_holder_name: accountHolderNameRef,
        line1: line1Ref,
        city: cityRef,
        postalCode: postalCodeRef,
        branch_code: branchCodeRef,
        account_number: accountNumberRef
      };
      refs[firstErrorField]?.current?.focus();
      return;
    }
    setStep(2);
  };

  // ── RENDER ──
  return (
    <div className="p-6 space-y-6">

      {/* Warning toast */}
      {warning && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg">
          <strong className="font-bold">{warning.title}: </strong>
          <span>{warning.message}</span>
        </div>
      )}

      {/* Success banner */}
      {isBooked && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-lg">
          Membership updated successfully!
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-[24px] font-semibold mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-y-4 text-[16px]">
          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Status</div>
          <div className="col-span-1 font-medium text-green-600 text-end border-b border-gray-200 pb-4 capitalize">
            {safeValue(stateData.status)}
          </div>

          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">ID</div>
          <div className="col-span-1 text-end border-b border-gray-200 pb-4">
            {safeValue(stateData.bookedId)}
          </div>

          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Created</div>
          <div className="col-span-1 text-end border-b border-gray-200 pb-4">
            {formatDate(stateData.dateBooked)}
          </div>
          {stateData.payments?.[stateData.payments.length - 1]?.billingAddress != null &&
            stateData.payments?.[stateData.payments.length - 1]?.billingAddress !== "" && (<>
              <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Address</div>
              <div className="col-span-1 text-end border-b border-gray-200 pb-4">
                {safeValue(
                  stateData?.payments?.length
                    ? stateData.payments[stateData.payments.length - 1]?.billingAddress
                    : null
                )}
              </div>
            </>
            )}

          <div className="col-span-1 text-gray-500">Email</div>
          <div className="col-span-1 text-end">{safeValue(stateData?.payments?.[0]?.email)}</div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center">
        <div>
          <h2 className="text-[24px] font-semibold">Subscription</h2>
          <span className="font-medium text-[16px]">{safeValue(stateData?.paymentPlan?.title)}</span>
        </div>
        <div className="flex items-center text-[16px] gap-4">
          <span className="font-semibold">{safeValue(stateData?.paymentPlan?.price)} GBP</span>
          <button onClick={handleChangeClick} className="text-blue-500 font-medium hover:underline">
            Change
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <h2 className="text-[24px] font-semibold mb-4 p-6">Payments</h2>
        <table className="w-full text-[16px]">
          <thead className="text-gray-500">
            <tr className="bg-gray-100">
              <th className="text-left py-2 px-6">Status</th>
              <th className="text-left py-2">Source</th>
              <th className="text-left py-2">Charge</th>
              <th className="text-left py-2">Paid out</th>
              <th className="text-left py-2 w-30">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {stateData?.payments?.filter(p => p.paymentStatus === "paid").length > 0 ? (
              stateData.payments
                .filter(payment => payment.paymentStatus === "paid")
                .map((payment, index) => {
                  console.log('stateData.payments', stateData.payments);
                  const isFailed =
                    payment.paymentStatus === "failed" || payment.paymentStatus === "cancelled";

                  return (
                    <tr key={payment.id || index} className="relative">
                      <td className="py-3 px-6 font-medium relative">
                        <div
                          className={`flex gap-2 text-left w-max bg-gray-100 px-2 py-1 rounded-xl shadow-sm whitespace-nowrap items-center ${isFailed ? "cursor-pointer" : ""}`}
                          onClick={() =>
                            isFailed &&
                            setShowPopup(showPopup === payment.id ? null : payment.id)
                          }
                        >
                          <div className={isFailed ? "text-red-500" : "text-green-500"}>●</div>
                          <div>
                            {payment.paymentStatus === "failed" ? (
                              <button className="text-red-500 text-sm font-medium">
                                Retry Payment
                              </button>
                            ) : payment.paymentStatus === "pending" ? (
                              <span className="text-yellow-500 text-sm font-semibold">
                                Payment Pending
                              </span>
                            ) : payment.paymentStatus === "cancelled" ? (
                              <span className="text-red-500 whitespace-nowrap text-sm font-semibold">
                                Payment Cancelled
                              </span>
                            ) : (
                              <span className="text-green-600 text-sm font-semibold">
                                Paid Successfully
                              </span>
                            )}
                          </div>
                        </div>

                        {showPopup === payment.id && isFailed && (
                          <div className="absolute right-[200px] top-[-30px] mt-2 w-72 bg-white shadow-lg rounded-xl p-4 z-10">
                            <div className="text-red-500 font-semibold mb-2">Payment Failed</div>
                            <div className="text-gray-700 mb-2">
                              Unsuccessful payment of {safeValue(payment.firstName)}{" "}
                              {safeValue(payment.lastName)}'s subscription for{" "}
                              {safeValue(payment.description, "this month")}.
                            </div>
                            <a href="/failed-payments" className="text-blue-600 hover:underline">
                              Go to the failed payments page
                            </a>
                          </div>
                        )}
                      </td>

                      <td className="capitalize">
                        {payment.paymentCategory === "starter_pack"
                          ? "Stripe"
                          : safeValue(payment.paymentType)}
                      </td>
                      <td>
                        {payment.paymentCategory === "starter_pack"
                          ? formatDate(payment.updatedAt)
                          : formatDate(payment.dueDate)}
                      </td>
                      <td className="capitalize">{safeValue(payment.paymentStatus)}</td>
                      <td>
                        {safeValue(payment.price)} {safeValue(payment.currency, "GBP")}
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No payment records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Change Membership Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[95%] max-w-4xl max-h-[90vh] min-h-[70vh] overflow-y-auto  p-6 rounded-2xl">

            <div className="flex justify-end">
              <button onClick={() => setIsPopupOpen(false)}>✕</button>
            </div>

            {/* Step 1 – Membership Plan */}
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
            {membershipPlan && (
              <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                <div className="flex justify-center gap-5 items-center mb-3">
                  <button
                    onClick={goToPreviousMonth}
                    className="w-8 h-8 rounded-full border border-black flex items-center justify-center bg-white text-black hover:bg-black hover:text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <p className="font-semibold text-[20px]">
                    {currentDate.toLocaleString("default", { month: "long" })} {year}
                  </p>
                  <button
                    onClick={goToNextMonth}
                    className="w-8 h-8 rounded-full border border-black flex items-center justify-center bg-white text-black hover:bg-black hover:text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 text-xs gap-1 text-gray-500 mb-1">
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
                          const isAvailable = sessionDatesSet.has(formattedDate);
                          // ✅ FIX 4: compare string-to-string
                          const isSelected = selectedDate === formattedDate;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const current = new Date(date);
                          current.setHours(0, 0, 0, 0);
                          const isPastAvailable = isAvailable && current < today;

                          return (
                            <div key={i} className="relative group">
                              <div
                                onClick={() => isAvailable && !isPastAvailable && handleDateClick(date)}
                                className={`w-8 h-8 flex text-[18px] items-center justify-center mx-auto text-base rounded-full
                                  ${isPastAvailable
                                    ? "bg-red-200 text-red-700 cursor-not-allowed"
                                    : isAvailable
                                      ? "cursor-pointer bg-sky-200"
                                      : "cursor-not-allowed opacity-40 bg-white"}
                                  ${isSelected ? "!bg-[#042C89] text-white font-bold" : ""}`}
                              >
                                {date.getDate()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3 – Pricing + Payment */}
            {membershipPlan && selectedDate && isOpenMembership && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white mt-4 rounded-2xl shadow p-6 font-semibold space-y-4 text-[16px]"
              >
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
                          {pricingBreakdown.numberOfLessonsProRated <= 3 && (
                            <>
                              <div className="flex justify-between text-[#333]">
                                <span>Number of Pro-Rata Lessons</span>
                                <span>{pricingBreakdown.numberOfLessonsProRated}</span>
                              </div>

                              <div className="flex justify-between text-[#000]">
                                <span>Total Pro-Rata Cost</span>
                                <span>
                                  £{pricingBreakdown.finalProRataCost?.toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* {pricingBreakdown.starterPack > 0 &&
                        pricingBreakdown.numberOfLessonsProRated <= 3 && (
                          <div className="flex justify-between text-[#333]">
                            <span>Starter Pack</span>

                            <span className={isApplied ? "line-through text-gray-400" : ""}>
                              £{pricingBreakdown.starterPack?.toFixed(2)}
                            </span>
                          </div>
                        )} */}



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
                        ref={emailRef}
                        type="email"
                        placeholder="Email address"
                        value={payment.email}
                        onChange={(e) => handlePaymentChange("email", e.target.value)}
                        className={`w-full bg-white border ${errors.email ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </label>

                    <p className="text-[14px] font-medium text-[#34353B]">
                      Payment Method: <span className="font-semibold">{isFranchisee ? "GoCardless" : "Access Pay Suite"}</span>
                    </p>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="block text-gray-700 text-[14px] mb-1">Account Holder Name</span>
                        <input
                          ref={accountHolderNameRef}
                          type="text"
                          placeholder="Account Holder Name"
                          value={payment.account_holder_name}
                          onChange={(e) => {
                            const fullName = e.target.value;
                            const parts = fullName.trim().split(" ");
                            setPayment({ ...payment, account_holder_name: fullName, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") });
                            const msg = validateField("account_holder_name", fullName);
                            setErrors(prev => {
                              const copy = { ...prev };
                              if (msg) copy.account_holder_name = msg;
                              else delete copy.account_holder_name;
                              return copy;
                            });
                          }}
                          className={`w-full bg-white border ${errors.account_holder_name ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                        />
                        {errors.account_holder_name && <p className="text-red-500 text-xs mt-1">{errors.account_holder_name}</p>}
                      </label>

                      {!isFranchisee && (
                        <>
                          <label className="block">
                            <span className="block poppins text-gray-700 text-[14px] mb-1">Address Line 1</span>
                            <input
                              ref={line1Ref}
                              type="text"
                              value={payment.line1}
                              onChange={(e) => handlePaymentChange("line1", e.target.value)}
                              className={`w-full bg-white border ${errors.line1 ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                            />
                            {errors.line1 && <p className="text-red-500 text-xs mt-1">{errors.line1}</p>}
                          </label>

                          <div className="md:flex gap-4">
                            <label className="flex-1">
                              <span className="block poppins text-gray-700 text-[14px] mb-1">City</span>
                              <input
                                ref={cityRef}
                                type="text"
                                value={payment.city}
                                onChange={(e) => handlePaymentChange("city", e.target.value)}
                                className={`w-full bg-white border ${errors.city ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                              />
                              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                            </label>
                            <label className="flex-1">
                              <span className="block poppins text-gray-700 text-[14px] mb-1">Postal Code</span>
                              <input
                                ref={postalCodeRef}
                                type="text"
                                value={payment.postalCode}
                                onChange={(e) => handlePaymentChange("postalCode", e.target.value)}
                                className={`w-full bg-white border ${errors.postalCode ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                              />
                              {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                            </label>
                          </div>
                        </>
                      )}

                      <div className="flex gap-3 w-full">
                        <label className="block w-full">
                          <span className="block text-gray-700 text-[14px] mb-1">Sort Code</span>
                          <input
                            ref={branchCodeRef}
                            type="text"
                            placeholder="Sort Code"
                            value={payment.branch_code}
                            onChange={(e) => handlePaymentChange("branch_code", e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className={`w-full bg-white border ${errors.branch_code ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                          />
                          {errors.branch_code && <p className="text-red-500 text-xs mt-1">{errors.branch_code}</p>}
                        </label>
                        <label className="block w-full">
                          <span className="block text-gray-700 text-[14px] mb-1">Account Number</span>
                          <input
                            ref={accountNumberRef}
                            type="text"
                            placeholder="Account Number"
                            value={payment.account_number}
                            onChange={(e) => handlePaymentChange("account_number", e.target.value.replace(/\D/g, "").slice(0, 8))}
                            className={`w-full bg-white border ${errors.account_number ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                          />
                          {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number}</p>}
                        </label>
                      </div>
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
                        onClick={handleContinueToStep2}
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
                    <h2 className="text-2xl font-semibold poppins pb-4">Checkout</h2>
                    <p className="text-gray-600 mb-4 poppins text-[14px]">
                      Fill out your card details below to pay for the Starter Pack
                      {pricingBreakdown?.numberOfLessonsProRated > 0 && " and Pro-Rata lessons"}
                      {" "}via Stripe. This payment goes directly to Head Office.
                    </p>

                    {/* Stripe destination badge */}
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-800 font-medium">
                      💳 Stripe → Head Office &nbsp;·&nbsp; Amount: <strong>£{pricingBreakdown.totalAmountToday?.toFixed(2)}</strong>
                      {IS_SANDBOX && <span className="ml-2 text-orange-600">🧪 Sandbox</span>}
                    </div>

                    <label className="block">
                      <span className="block text-gray-700 text-[14px] font-medium mb-1">Name on card<span className="text-red-500 ml-0.5">*</span></span>
                      <input
                        ref={nameOnCardRef}
                        placeholder="Enter name on card"
                        value={nameOnCard}
                        onChange={(e) => handleCheckoutChange("nameOnCard", e.target.value)}
                        className={`w-full bg-white border ${errors.nameOnCard ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                      />
                      {errors.nameOnCard && (
                        <p className="text-red-500 text-xs mt-1">{errors.nameOnCard}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="block text-gray-700 text-[14px] font-medium mb-1">Card number<span className="text-red-500 ml-0.5">*</span></span>
                      <input
                        ref={cardNumberRef}
                        placeholder="1234 1234 1234 1234"
                        value={cardNumber}
                        onChange={(e) => handleCheckoutChange("cardNumber", e.target.value)}
                        className={`w-full bg-white border ${errors.cardNumber ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                      )}
                    </label>

                    <div className="flex gap-4 w-full">
                      <label className="block flex-1">
                        <span className="block text-gray-700 text-[14px] font-medium mb-1">Expiration date<span className="text-red-500 ml-0.5">*</span></span>
                        <input
                          ref={expiryDateRef}
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => handleCheckoutChange("expiryDate", e.target.value)}
                          className={`w-full bg-white border ${errors.expiryDate ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                        />
                        {errors.expiryDate && (
                          <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                        )}
                      </label>
                      <label className="block flex-1">
                        <span className="block text-gray-700 text-[14px] font-medium mb-1">CVC<span className="text-red-500 ml-0.5">*</span></span>
                        <input
                          ref={cvcRef}
                          placeholder="CVC"
                          value={cvc}
                          onChange={(e) => handleCheckoutChange("cvc", e.target.value)}
                          className={`w-full bg-white border ${errors.cvc ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                        />
                        {errors.cvc && (
                          <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>
                        )}
                      </label>
                    </div>

                    <div className="flex gap-4 w-full">
                      <div className="flex-1">
                        <label className="block text-gray-700 text-[14px] font-medium mb-1">Country or region<span className="text-red-500 ml-0.5">*</span></label>
                        <Select
                          options={countryOptions}
                          value={countryOptions.find(opt => opt.value === checkoutCountry)}
                          onChange={(selectedOption) => handleCheckoutChange("checkoutCountry", selectedOption?.value)}
                          className="mt-1"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: errors.country ? "#ef4444" : "#e5e7eb",
                              borderRadius: "6px",
                              padding: "2px",
                              boxShadow: "none",
                              "&:hover": {
                                borderColor: errors.country ? "#ef4444" : "#3b82f6"
                              }
                            })
                          }}
                        />
                        {errors.country && <span className="text-red-500 text-xs mt-1 block">{errors.country}</span>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-700 text-[14px] font-medium mb-1">Postal Code<span className="text-red-500 ml-0.5">*</span></label>
                        <input
                          ref={zipCodeRef}
                          type="text"
                          value={zipCode}
                          onChange={(e) => handleCheckoutChange("zipCode", e.target.value)}
                          placeholder="Enter Postal Code"
                          className={`w-full bg-white border ${errors.zipCode ? "border-red-500" : "border-gray-200"} rounded-[6px] px-4 py-2 focus:outline-none focus:border-blue-500`}
                        />
                        {errors.zipCode && <span className="text-red-500 text-xs mt-1 block">{errors.zipCode}</span>}
                      </div>
                    </div>

                    <p className="font-semibold text-[#34353B] poppins text-md">
                      Total to pay now <span className="float-right poppins text-blue-900" style={{ fontSize: "22px" }}>£{pricingBreakdown?.totalAmountToday?.toFixed(2)}</span>
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
            )}

          </div>
        </div>
      )
      }
    </div >
  );
};

export default HistoryOfPayments;