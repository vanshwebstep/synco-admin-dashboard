import { useState ,useMemo} from "react";
import { useClassSchedule } from "../../../contexts/ClassScheduleContent";
import Select from "react-select";
import { Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence, px } from "framer-motion";

const HistoryOfPayments = ({ stateData }) => {
      const { fetchFindClassID, singleClassSchedulesOnly, loading } = useClassSchedule() || {};
  
  const [showPopup, setShowPopup] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState(null);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOpenMembership, setIsOpenMembership] = useState(false);

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

  // ✅ PAYMENT PLANS

  const paymentPlanOptions = useMemo(() => {
    return (
      singleclassschedule?.venue?.paymentGroups?.[0]?.paymentPlans?.map(plan => ({
        label: `${plan.title} - ₹${plan.price}`,
        value: plan.id,
        all: plan,
      })) || []
    );
  }, [singleclassschedule]);

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

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsOpenMembership(true);
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
          <button   onClick={handleChangeClick}
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
                          className={`flex gap-2 items-center ${isFailed ? "cursor-pointer" : ""
                            }`}
                          onClick={() =>
                            isFailed &&
                            setShowPopup(showPopup === payment.id ? null : payment.id)
                          }
                        >
                          <div className={isFailed ? "text-red-500" : "text-green-500"}>●</div>
                          <span>{safeValue(payment.description, "Membership Fee")}</span>
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

                      <td className="text-left w-30">
                        {payment.paymentStatus === "failed" ? (
                          <button className="text-blue-500 text-sm font-medium hover:underline">
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
        <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm">
          {/* 👉 YOUR CALENDAR CODE SAME */}
        </div>
      )}{membershipPlan && (
              <div className="bg-white p-6 rounded-3xl shadow-sm">

                {/* HEADER */}
                <div className="flex justify-center items-center gap-5 mb-4">
                  <button onClick={goToPreviousMonth}>
                    <ChevronLeft />
                  </button>

                  <h2 className="text-xl font-semibold">
                    {currentDate.toLocaleString("default", { month: "long" })} {year}
                  </h2>

                  <button onClick={goToNextMonth}>
                    <ChevronRight />
                  </button>
                </div>

                {/* DAYS */}
                <div className="grid grid-cols-7 text-center text-gray-500 mb-2">
                  {["M","T","W","T","F","S","S"].map(d => <div key={d}>{d}</div>)}
                </div>

                {/* DATES */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, i) => {
                    if (!date) return <div key={i}></div>;

                    const formattedDate = formatLocalDate(date);

                    const isAvailable =
                      membershipPlan &&
                      sessionDatesSet.has(formattedDate) &&
                      !exclusionDatesSet.has(formattedDate);

                    const isSelected = isSameDate(date, selectedDate);

                    return (
                      <div
                        key={i}
                        onClick={() => isAvailable && handleDateClick(date)}
                        className={`p-2 text-center rounded-full cursor-pointer
                        ${isAvailable ? "bg-sky-200" : "opacity-30"}
                        ${isSelected ? "bg-blue-500 text-white" : ""}
                        `}
                      >
                        {date.getDate()}
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
              className="bg-white rounded-2xl shadow p-6 space-y-4"
            >
              {/* 👉 YOUR FULL PRICING CODE SAME */}
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
