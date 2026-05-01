import { useState, useMemo } from "react";
import { useClassSchedule } from "../../../contexts/ClassScheduleContent";
import Select from "react-select";
import { Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence, px } from "framer-motion";
import { useBookFreeTrial } from "../../../contexts/BookAFreeTrialContext";

const HistoryOfPayments = ({ stateData }) => {
  const { fetchFindClassID, singleClassSchedulesOnly, loading } = useClassSchedule() || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createBookMembership, updateBookMembership } = useBookFreeTrial() || {};

  const [showPopup, setShowPopup] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState(null);
  const [proRataCode, setProRataCode] = useState("");
  const [remainingLessons, setRemainingLessons] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [isProRataLoading, setIsProRataLoading] = useState(false);

  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [proRataDiscountData, setProRataDiscountData] = useState(null);
  const [isProRataApplied, setIsProRataApplied] = useState(false);
  const [isProRataChecked, setIsProRataChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOpenMembership, setIsOpenMembership] = useState(false);
  const [numberOfStudents, setNumberOfStudents] = useState(stateData.students?.length || 0);
  const [isApplied, setIsApplied] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState({
    pricePerClassPerChild: 0,
    numberOfLessonsProRated: 0,
    costOfProRatedLessons: 0,
    totalAmount: 0,
    isFullMonthCharge: 0 // ✅ NEW

  });
  const [currentDate, setCurrentDate] = useState(new Date());
  console.log("stateData", stateData);
  // ✅ Safe value helper

  // ✅ Date formatting helper









  const singleclassschedule = singleClassSchedulesOnly;
  console.log("singleclassschedule", singleclassschedule);
  // ✅ HELPERS
  const safeValue = (val, fallback = "-") =>
    val !== null && val !== undefined && val !== "" ? val : fallback;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString("en-GB");
  };

  const formatLocalDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const isSameDate = (d1, d2) =>
    d1 && d2 && formatLocalDate(d1) === formatLocalDate(d2);


  const allPaymentPlans =
    singleClassSchedulesOnly?.venue?.paymentGroups[0]?.paymentPlans?.map((plan) => ({
      label: `${plan.title} (${plan.students} student${plan.students > 1 ? "s" : ""})`,
      value: plan.id,
      all: plan,
    })) || [];

  const paymentPlanOptions = numberOfStudents
    ? allPaymentPlans.filter((plan) => plan.all?.students === Number(numberOfStudents))
    : allPaymentPlans;


  // ✅ SESSION DATES
  const sessionDates = useMemo(() => {
    return (
      singleclassschedule?.venue?.termGroups?.flatMap(group =>
        group.terms.flatMap(term =>
          term.sessionsMap.map(s => s.sessionDate)
        )
      ) || []
    );
  }, [singleclassschedule]);
  const sessionDatesSet = new Set(sessionDates);


  // ✅ EXCLUSION DATES
  const exclusionDates = useMemo(() => {
    return (
      singleclassschedule?.venue?.termGroups?.flatMap(group =>
        group.terms.flatMap(term => term.exclusionDates || [])
      ) || []
    );
  }, [singleclassschedule]);

  const exclusionDatesSet = new Set(exclusionDates);

  // 🔥 HANDLERS
  const handleChangeClick = async () => {
    const finalClassId = stateData?.students[0]?.classScheduleId;
    if (!finalClassId) return;

    await fetchFindClassID(finalClassId);

    setMembershipPlan(null);
    setSelectedDate(null);
    setIsOpenMembership(false);

    setIsPopupOpen(true);
  };

  const handlePlanChange = (selected) => {
    setMembershipPlan(selected);
    setSelectedPlanData(selected?.all || null);
    setSelectedDate(null);
    setIsOpenMembership(false);
  };
  const calculateAmount = (startDate) => {
    console.log("🚀 FUNCTION CALLED with startDate:", startDate);

    if (!membershipPlan || !startDate) {
      console.warn("❌ Missing membershipPlan or startDate");
      return;
    }

    const monthlyPrice = Number(membershipPlan?.all?.price ?? 0);
    console.log("💰 monthlyPrice:", monthlyPrice);



    // ✅ DATE PARSER
    const parseLocalDate = (dateStr) => {
      console.log("📅 Parsing date:", dateStr, "Type:", typeof dateStr);

      if (!dateStr) {
        console.warn("⚠️ dateStr empty");
        return null;
      }

      if (dateStr instanceof Date) {
        console.log("✅ Already Date object");
        return dateStr;
      }

      if (typeof dateStr === "string") {
        const parts = dateStr.split("-");
        console.log("🔍 Split parts:", parts);

        if (parts.length !== 3) {
          console.warn("❌ Invalid date format:", dateStr);
          return null;
        }

        const [y, m, d] = parts.map(Number);
        const parsed = new Date(y, m - 1, d);

        console.log("✅ Parsed Date:", parsed);
        return parsed;
      }

      console.error("❌ Invalid dateStr type:", dateStr);
      return null;
    };

    const selected = parseLocalDate(startDate);

    if (!selected) {
      console.error("❌ Selected date invalid");
      return;
    }

    selected.setHours(0, 0, 0, 0);
    console.log("📌 Selected normalized:", selected);

    // ── ALL SESSIONS ──
    const allSessions = Array.from(sessionDatesSet).map((d) => {
      const date = parseLocalDate(d);

      if (!date) {
        console.warn("⚠️ Invalid session date skipped:", d);
        return null;
      }

      date.setHours(0, 0, 0, 0);
      return date;
    }).filter(Boolean);

    console.log("📚 All Sessions:", allSessions);

    const selectedMonth = selected.getMonth();
    const selectedYear = selected.getFullYear();

    console.log("📆 Selected Month/Year:", selectedMonth, selectedYear);

    const sessionsInStartMonth = allSessions
      .filter(
        (d) =>
          d.getMonth() === selectedMonth &&
          d.getFullYear() === selectedYear
      )
      .sort((a, b) => a - b);

    console.log("📅 Sessions in Start Month:", sessionsInStartMonth);

    const firstSessionDate = sessionsInStartMonth[0];
    console.log("🥇 First Session Date:", firstSessionDate);

    const isFirstSessionSelected =
      firstSessionDate &&
      selected.getTime() === firstSessionDate.getTime();

    console.log("🎯 isFirstSessionSelected:", isFirstSessionSelected);

    const remainingSessions = sessionsInStartMonth.filter(
      (d) => d.getTime() >= selected.getTime()
    );

    console.log("📌 Remaining Sessions:", remainingSessions);

    const proRataLessons = remainingSessions.length;
    console.log("📊 proRataLessons:", proRataLessons);

    const pricePerLesson = membershipPlan?.all?.priceLesson || 0;
    console.log("💵 pricePerLesson:", pricePerLesson);

    // ── PRO-RATA COST ──
    const proRataCost = Number(
      (proRataLessons * pricePerLesson).toFixed(2)
    );

    console.log("💸 proRataCost:", proRataCost);

    const safeProRataCost = Math.min(proRataCost, monthlyPrice);
    console.log("🛡 safeProRataCost:", safeProRataCost);

    const isFullMonth =
      (isFirstSessionSelected && proRataLessons >= 3) ||
      safeProRataCost >= monthlyPrice;

    console.log("📦 isFullMonth:", isFullMonth);

    let finalProRata = safeProRataCost;

    if (!isFullMonth && proRataDiscountData?.finalProRata != null) {
      finalProRata = proRataDiscountData.finalProRata;
      console.log("🏷 Discounted finalProRata:", finalProRata);
    }

    const effectiveLessonCharge = isFullMonth
      ? monthlyPrice
      : finalProRata;

    console.log("💳 effectiveLessonCharge:", effectiveLessonCharge);

    // ── STARTER DISCOUNT ──


    const totalBeforeDiscount = effectiveLessonCharge;
    console.log("🧾 totalBeforeDiscount:", totalBeforeDiscount);

    const finalTotal = Math.max(
      totalBeforeDiscount,
      0
    );

    console.log("🏁 finalTotal:", finalTotal);

    const totalToday = Number(finalTotal.toFixed(2));
    const nextMonthPayment = Number(monthlyPrice.toFixed(2));

    console.log("📢 FINAL OUTPUT:", {
      totalToday,
      nextMonthPayment,
    });

    // ── STATE ──
    setRemainingLessons(proRataLessons);
    setCalculatedAmount(totalToday);

    setPricingBreakdown({
      pricePerClassPerChild: pricePerLesson,
      numberOfLessonsProRated: proRataLessons,
      costOfProRatedLessons: safeProRataCost,
      finalProRataCost: finalProRata,
      totalBeforeDiscount,
      totalAmountToday: totalToday,
      nextMonthPayment,
      isFullMonthCharge: isFullMonth,
    });

    return totalToday;
  };

  const handleDateClick = (date) => {
    const formattedDate = date;


    if (selectedDate === formattedDate) {
      setSelectedDate(null);
      calculateAmount(null);
      setIsOpenMembership(true);

    } else {
      setSelectedDate(formattedDate);
      calculateAmount(formattedDate);
      setIsOpenMembership(true);

    }
  };

  // ✅ CALENDAR LOGIC
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

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(year, month - 1));

  const goToNextMonth = () =>
    setCurrentDate(new Date(year, month + 1));
  0
  const handleSubmit = async () => {
    if (!selectedDate) {
      showWarning("Membership Date Required", "Please select a membership date before submitting.");
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
      price: pricingBreakdown.nextMonthPayment,
      proRataAmount: proRataToSend,

    };
    console.log('amountToSend', amountToSend);
    console.log('payload', payload);
    // setIsSubmitting(false);
    // return;
    try {

      await updateBookMembership(payload, stateData.id || stateData.bookingId);

      setIsBooked(true);

    } catch (error) {
      console.error("Booking submitted. Confirmation may be delayed due to network issues. Check your email shortly", error);
    } finally {
      setIsSubmitting(false);
    }

    // console.log("Final Payload:", JSON.stringify(payload, null, 2));
    // send to API with fetch/axios
  };

  return (
    <div className="p-6 space-y-6">
      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-[24px] font-semibold mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-y-4 text-[16px]">
          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Status</div>
          <div className="col-span-1 font-medium text-green-600 text-end border-b border-gray-200 pb-4 capitalize ">
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

          <div className="col-span-1 text-gray-500 border-b border-gray-200 pb-4">Address</div>
          <div className="col-span-1 text-end border-b border-gray-200 pb-4">
            {safeValue(
              stateData?.payments?.length
                ? stateData.payments[stateData.payments.length - 1]?.billingAddress
                : null
            )}
          </div>

          <div className="col-span-1 text-gray-500">Email</div>
          <div className="col-span-1 text-end">
            {safeValue(stateData?.payments?.[0]?.email)}
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center">
        <div>
          <h2 className="text-[24px] font-semibold">Subscription</h2>
          <span className="font-medium text-[16px]">
            {safeValue(stateData?.paymentPlan?.title)}
          </span>
        </div>
        <div className="flex items-center text-[16px] gap-4">
          <span className="font-semibold">
            {safeValue(stateData?.paymentPlan?.price)} GBP
          </span>
          <button onClick={handleChangeClick}
            className="text-blue-500 font-medium hover:underline">Change</button>
        </div>
      </div>

      {/* Payments */}
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
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 p-6">
            {stateData?.payments?.length > 0 ? (
              stateData.payments
                // 🔥 yaha filter
                .map((payment, index) => {
                  const isFailed = payment.paymentStatus !== "paid";
                  const isPending = payment.paymentStatus === "pending";
                  const isSuccess = payment.paymentStatus === "paid";

                  return (
                    <tr key={payment.id || index} className="relative">
                      {/* Description */}
                      <td className="py-3 px-6 font-medium relative">
                        <div
                          className={`flex gap-2 text-left w-40 bg-gray-100 px-2 py-1 rounded-xl shadow-sm whitespace-nowrap items-center ${isFailed ? "cursor-pointer" : ""
                            }`}
                          onClick={() =>
                            isFailed &&
                            setShowPopup(showPopup === payment.id ? null : payment.id)
                          }
                        >
                          <div className={isFailed ? "text-red-500" : "text-green-500"}>●</div>
                          {/* <span>{safeValue(payment.description, "Membership Fee")}</span> */}
                          <div className="">
                            {payment.paymentStatus === "failed" ? (
                              <button className="text-red-500 text-sm font-medium ">
                                Retry Payment
                              </button>
                            ) : payment.paymentStatus === "pending" ? (
                              <span className="text-yellow-500 text-sm font-semibold">
                                Payment Pending
                              </span>
                            ) :
                              payment.paymentStatus === "cancelled" ? (
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

                        {/* Popup */}
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
                      </td>                      <td>
                        {payment.paymentCategory === "starter_pack"
                          ? formatDate(payment.updatedAt)   // ✅ starter_pack → updatedAt
                          : formatDate(payment.dueDate)     // ✅ baaki → dueDate
                        }
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
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No payment records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[95%] max-w-4xl h-full overflow-y-auto p-6 rounded-2xl">

            {/* CLOSE BUTTON */}
            <div className="flex justify-end">
              <button onClick={() => setIsPopupOpen(false)}>✕</button>
            </div>

            {/* 🔥 STEP 1: Membership Plan */}
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

            {/* 🔥 STEP 2: Calendar */}
            {membershipPlan && (
              <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                {/* Header */}
                <div className="flex justify-center gap-5 items-center mb-3">

                  {/* Previous Month */}
                  <div className="relative group">
                    <button
                      onClick={membershipPlan ? goToPreviousMonth : undefined}
                      className={`w-8 h-8 rounded-full border border-black flex items-center justify-center
                  ${!membershipPlan
                          ? "bg-white text-black opacity-40 cursor-not-allowed"
                          : "bg-white text-black hover:bg-black hover:text-white"}
                  `}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {!membershipPlan && (
                      <span className="absolute hidden group-hover:block bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Please select membership plan first
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-[20px]">
                    {currentDate.toLocaleString("default", { month: "long" })} {year}
                  </p>

                  {/* Next Month */}
                  <div className="relative group">
                    <button
                      onClick={membershipPlan ? goToNextMonth : undefined}
                      className={`w-8 h-8 rounded-full border border-black flex items-center justify-center
                  ${!membershipPlan
                          ? "bg-white text-black opacity-40 cursor-not-allowed"
                          : "bg-white text-black hover:bg-black hover:text-white"}
                  `}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {!membershipPlan && (
                      <span className="absolute hidden group-hover:block bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Please select membership plan first
                      </span>
                    )}
                  </div>

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
                <div className="flex flex-col gap-1">
                  {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                    const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);

                    return (
                      <div
                        key={weekIndex}
                        className="grid grid-cols-7 text-[18px] gap-1 py-1 rounded"
                      >
                        {week.map((date, i) => {
                          if (!date) {
                            return <div key={i} />;
                          }

                          const formattedDate = formatLocalDate(date);
                          const isAvailable = membershipPlan && sessionDatesSet.has(formattedDate); // check if this date is valid session
                          // console.log('isAvailable', isAvailable)
                          const isSelected = isSameDate(date, selectedDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          const current = new Date(date);
                          current.setHours(0, 0, 0, 0);
                          const isPastAvailable = isAvailable && current < today;

                          return (
                            <div
                              key={i}
                              className="relative group"
                            >
                              <div
                                onClick={() => isAvailable && handleDateClick(date)}
                                className={`w-8 h-8 flex text-[18px] items-center justify-center mx-auto text-base rounded-full
                  ${!membershipPlan
                                    ? "cursor-not-allowed opacity-40 bg-white"
                                    : isPastAvailable
                                      ? "bg-red-200 text-red-700 cursor-not-allowed"
                                      : isAvailable
                                        ? "cursor-pointer bg-sky-200"
                                        : "cursor-not-allowed opacity-40 bg-white"
                                  }
                  ${isSelected ? "selectedDate text-white font-bold" : ""}`}
                              >
                                {date.getDate()}
                              </div>

                              {!membershipPlan && (
                                <span className="absolute hidden group-hover:block bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  Please select membership plan first
                                </span>
                              )}
                            </div>


                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* 🔥 STEP 3: Pricing Breakdown */}
            {membershipPlan && selectedDate && (
              <div className="mt-4">
                {isOpenMembership && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white mt-4 rounded-2xl shadow p-6 font-semibold space-y-4 text-[16px]"
                  >
                    {/* ── Membership Plan ── */}
                    <div className="flex justify-between text-[#333]">
                      <span>Membership Plan</span>
                      <span>
                        {membershipPlan?.all?.duration}{" "}
                        {membershipPlan?.all?.interval}
                        {membershipPlan?.all?.duration > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* ❌ REMOVED: Subscription Fee (client ne mana kiya) */}

                    {/* ── Monthly Fee ── */}
                    {membershipPlan?.all?.duration > 1 && (
                      <div className="flex justify-between text-[#333]">
                        <span>Monthly Payment</span>
                        <span>£{pricingBreakdown?.nextMonthPayment?.toFixed(2)} p/m</span>
                      </div>
                    )}


                    {/* 🔥 ALWAYS SHOW PRO-RATA */}
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

                          <div className="flex justify-between text-[#333]">
                            <span>Number of Pro-Rata Lessons</span>
                            <span>{pricingBreakdown.numberOfLessonsProRated}</span>
                          </div>

                          <div className="flex justify-between text-[#000]">
                            <span>Total Pro-Rata Cost</span>
                            <span>
                              £{pricingBreakdown.finalProRataCost?.toFixed(2)}</span>
                          </div>
                        </>
                      )}

                    </div>

                    {/* ── TOTAL ── */}
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
                    <div className="flex justify-center w-full">
                      <button onClick={handleSubmit} className={` flex justify-center w-full  bg-[#042C89] text-white rounded-[6px] px-6 py-2 font-semibold "hover:bg-blue-800" `}>
                        Submit
                      </button>

                    </div>
                  </motion.div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryOfPayments;
