import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

import FailedPayments from "./FailedPayments";
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import HistoryOfPayments from "./HistoryOfPayments";
import Attendance from "./Attendance";
import FailedPayment from "./FailedPayments";
import General from "./General";
import Credits from "./Credits";
import { showError, showSuccess, showWarning } from "../../../../../../utils/swalHelper";

// ─── Field order for focus-on-error ──────────────────────────────────────────
const FIELD_ORDER = ["amount", "description", "paymentDate", "cardholderName", "cardNumber", "expiryDate", "cvc"];

const SeeDetails = () => {
    const { serviceHistoryMembership, serviceHistory, serviceHistoryFetchById } = useBookFreeTrial();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const navigate = useNavigate();
    const location = useLocation();

    const [itemId, setItemId] = useState(null);
    const [memberInfo, setMemberInfo] = useState(null);
    const [serviceType, setServiceType] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentSource, setPaymentSource] = useState("accesspaysuite");
    const [paymentTiming, setPaymentTiming] = useState("now");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("General");

    const [paymentData, setPaymentData] = useState({
        amount: "",
        description: "",
        cardNumber: "",
        expiryDate: "",
        cvc: "",
        cardholderName: "",
        paymentDate: ""
    });

    // ─── Validation state ─────────────────────────────────────────────────────
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // ─── Refs for focus-on-error ──────────────────────────────────────────────
    const fieldRefs = {
        amount: useRef(null),
        description: useRef(null),
        paymentDate: useRef(null),
        cardholderName: useRef(null),
        cardNumber: useRef(null),
        expiryDate: useRef(null),
        cvc: useRef(null),
    };

    console.log('serviceHistory', serviceHistory);
    console.log("Location state:", location.state);

    useEffect(() => {
        if (location.state?.itemId) setItemId(location.state.itemId);
        if (location.state?.memberInfo) setMemberInfo(location.state.memberInfo);
        if (location.state?.defaultTab) setActiveTab(location.state.defaultTab);

        const queryParams = new URLSearchParams(location.search);
        const typeFromUrl = queryParams.get('serviceType');
        if (location.state?.serviceType || typeFromUrl) {
            setServiceType(location.state?.serviceType || typeFromUrl);
        }
    }, [location.state, location.search]);

    useEffect(() => {
        if (!itemId || !memberInfo) return;
        const fetchData = async () => {
            if (memberInfo === 'freeTrial') {
                await serviceHistoryFetchById(itemId);
            } else {
                await serviceHistoryMembership(itemId);
            }
        };
        fetchData();
    }, [itemId, memberInfo]);

    useEffect(() => {
        if (serviceHistory?.payments?.length) {
            const payments = serviceHistory.payments;
            const accessPay = payments.find(p => p.paymentType === "accesspaysuite" && p.paymentCategory === "recurring");
            const goCardless = payments.find(p => p.paymentType === "bank" && p.paymentCategory === "recurring");
            if (accessPay) setPaymentSource("accesspaysuite");
            else if (goCardless) setPaymentSource("gocardless");
            else setPaymentSource("stripe");
        }
    }, [serviceHistory]);

    const tabs = ["General", "History of Payments", "Credits", "Attendance"].filter(tab => {
        if (memberInfo === 'freeTrial' && tab === "History of Payments") return false;
        return true;
    });

    const navigateTo =
        memberInfo === "allMembers" || memberInfo === "freeTrial"
            ? {
                pathname: "/weekly-classes/trial/find-a-class/book-a-free-trial/account-info/list",
                state: { itemId, defaultTab: "Service History", memberInfo }
            }
            : memberInfo === "cancellation"
                ? {
                    pathname: "/weekly-classes/cancellation/account-info/list",
                    state: { itemId, defaultTab: "Service History", memberInfo }
                }
                : memberInfo === "waitingList"
                    ? {
                        pathname: "/weekly-classes/add-to-waiting-list/account-info",
                        state: { itemId, defaultTab: "Service History", memberInfo }
                    }
                    : {
                        pathname: "/weekly-classes/all-members/account-info",
                        state: { itemId, defaultTab: "Service History", memberInfo }
                    };

    const handleBack = () => {
        const backPath = location.state?.from || navigateTo.pathname;
        navigate(backPath, {
            state: {
                ...(location.state?.from
                    ? { itemId, defaultTab: "Service History", memberInfo }
                    : navigateTo.state)
            }
        });
    };

    // ─── Validation logic ─────────────────────────────────────────────────────
    const validateField = (name, value) => {
        switch (name) {
            case "amount": {
                if (!value && value !== 0) return "Amount is required";
                if (isNaN(value) || Number(value) <= 0) return "Enter a valid amount greater than 0";
                return "";
            }
            case "description": {
                if (!value?.trim()) return "Description is required";
                if (value.trim().length < 5) return "Description must be at least 5 characters";
                return "";
            }
            case "paymentDate": {
                if (paymentTiming === "specific") {
                    if (!value) return "Please select a payment date";
                    const minDate = new Date();
                    minDate.setDate(minDate.getDate() + 5);
                    if (new Date(value) < minDate) return "Date must be at least 5 days from today";
                }
                return "";
            }
            case "cardholderName": {
                if (paymentSource === "stripe") {
                    if (!value?.trim()) return "Cardholder name is required";
                    if (value.trim().length < 2) return "Enter a valid name";
                }
                return "";
            }
            case "cardNumber": {
                if (paymentSource === "stripe") {
                    const clean = value?.replace(/\s/g, "") || "";
                    if (!clean) return "Card number is required";
                    if (clean.length !== 16) return "Card number must be 16 digits";
                }
                return "";
            }
            case "expiryDate": {
                if (paymentSource === "stripe") {
                    if (!value) return "Expiry date is required";
                    if (!/^\d{2}\/\d{2}$/.test(value)) return "Use MM/YY format";
                    const [mm, yy] = value.split("/").map(Number);
                    if (mm < 1 || mm > 12) return "Invalid month";
                    const now = new Date();
                    const expiry = new Date(2000 + yy, mm - 1);
                    if (expiry < now) return "Card has expired";
                }
                return "";
            }
            case "cvc": {
                if (paymentSource === "stripe") {
                    if (!value) return "CVC is required";
                    if (value.length < 3) return "CVC must be at least 3 digits";
                }
                return "";
            }
            default:
                return "";
        }
    };

    const getActiveFields = () => {
        const fields = ["amount", "description"];
        if (paymentTiming === "specific") fields.push("paymentDate");
        if (paymentSource === "stripe") fields.push("cardholderName", "cardNumber", "expiryDate", "cvc");
        return fields;
    };

    const validateAll = () => {
        const activeFields = getActiveFields();
        const newErrors = {};
        activeFields.forEach(field => {
            const err = validateField(field, paymentData[field]);
            if (err) newErrors[field] = err;
        });
        return newErrors;
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const err = validateField(field, paymentData[field]);
        setErrors(prev => ({ ...prev, [field]: err }));
    };

    const handleChange = (field, value) => {
        setPaymentData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            const err = validateField(field, value);
            setErrors(prev => ({ ...prev, [field]: err }));
        }
    };

    const focusFirstError = (errs) => {
        for (const field of FIELD_ORDER) {
            if (errs[field] && fieldRefs[field]?.current) {
                fieldRefs[field].current.focus();
                fieldRefs[field].current.scrollIntoView({ behavior: "smooth", block: "center" });
                break;
            }
        }
    };

    // ─── Shared class helpers ─────────────────────────────────────────────────
    const inputClass = (field) =>
        `w-full p-4 bg-white border rounded-2xl appearance-none focus:outline-none focus:ring-2 transition-colors text-[#282829] ${touched[field] && errors[field]
            ? "border-red-400 focus:ring-red-300"
            : "border-[#E5E7EB] focus:ring-blue-500"
        }`;

    const smallInputClass = (field) =>
        `w-full p-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-colors text-[#282829] ${touched[field] && errors[field]
            ? "border-red-400 focus:ring-red-300"
            : "border-[#E5E7EB] focus:ring-blue-500"
        }`;

    const ErrorMsg = ({ field }) =>
        touched[field] && errors[field]
            ? <p className="mt-1 text-sm text-[#F04438] flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors[field]}
            </p>
            : null;

    const resetModal = () => {
        setPaymentData({ amount: "", description: "", cardNumber: "", expiryDate: "", cvc: "", cardholderName: "", paymentDate: "" });
        setErrors({});
        setTouched({});
        setPaymentTiming("now");
    };

    const handleCloseModal = () => {
        setShowPaymentModal(false);
        resetModal();
    };

    const handlePaymentSubmit = async () => {
        // Mark all active fields as touched
        const activeFields = getActiveFields();
        const allTouched = {};
        activeFields.forEach(f => allTouched[f] = true);
        setTouched(prev => ({ ...prev, ...allTouched }));

        const newErrors = validateAll();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            focusFirstError(newErrors);
            return;
        }

        const token = localStorage.getItem("adminToken");
        setIsSubmitting(true);

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${token}`);

        const raw = JSON.stringify({
            description: paymentData.description,
            amount: Number(paymentData.amount),
            paymentMethod:
  paymentSource === "stripe"
    ? "card"
    : paymentSource === "gocardless"
    ? "bank"
    : paymentSource,
            paymentTiming,
            paymentDate: paymentTiming === "specific" ? paymentData.paymentDate : null,
            ...(paymentSource === "stripe" && {
                cardNumber: paymentData.cardNumber,
                expiryDate: paymentData.expiryDate,
                cvc: paymentData.cvc,
                cardholderName: paymentData.cardholderName,
            }),
        });

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/book-membership/${itemId}/one-off-payment`,
                { method: "POST", headers: myHeaders, body: raw, redirect: "follow" }
            );
            const result = await response.json();
            console.log("API Response:", result);

            if (response.ok && (result.success === true || result.status === true)) {
                showSuccess(result.message || "Payment processed successfully!");
                setShowPaymentModal(false);
                resetModal();
                if (itemId) serviceHistoryMembership(itemId);
            } else {
                showError(result.message || result.error || "Failed to process payment.");
            }
        } catch (error) {
            console.error("Payment Error:", error);
            showError("Failed to process payment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex justify-between items-end mb-5 gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                    <h2
                        onClick={handleBack}
                        className="text-xl md:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    >
                        <img src="/images/icons/arrow-left.png" alt="Back" className="w-5 h-5 md:w-6 md:h-6" />
                    </h2>
                    <div className="flex gap-0 p-1 rounded-xl flex-wrap bg-white">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 rounded-xl text-[16px] font-medium transition capitalize
                                ${activeTab === tab ? "bg-[#237FEA] text-white" : "hover:text-[#237FEA]"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-2 md:gap-3">
                    {memberInfo !== 'freeTrial' && (
                        <>
                            <button
                                onClick={() => setActiveTab("Failed Payments")}
                                className="border border-black flex items-center gap-2 text-black px-8 py-8 md:py-[12px] rounded-xl hover:bg-gray-200 text-[18px]"
                            >
                                See Failed Payments
                            </button>
                            <button className="border border-[#237FEA] flex items-center gap-2 text-[#237FEA] px-8 py-8 md:py-[12px] rounded-xl hover:bg-[#237FEA] hover:text-white text-[18px]">
                                Add a subscription
                            </button>
                        </>
                    )}
                    {memberInfo === "membership" && (
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="bg-[#237FEA] flex items-center gap-2 text-white px-8 py-8 md:py-[12px] rounded-xl hover:bg-blue-700 text-[18px]"
                        >
                            Create Payment
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Create Payment Modal ─────────────────────────────────────────── */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-[#10101094] bg-opacity-40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">

                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-8 pb-4 border-b border-gray-100">
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                onClick={handleCloseModal}
                            >
                                <img src="/images/icons/cross.png" alt="Close" className="w-4 h-4" />
                            </button>
                            <h3 className="text-2xl font-semibold text-center flex-1 pr-8">Create One-Off Payment</h3>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                            <div className="space-y-6">

                                {/* Amount */}
                                <div>
                                    <label className="block text-[16px] font-medium text-[#282829] mb-2">
                                        Amount <span className="text-[#F04438]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-medium">
                                            <span>£</span>
                                        </div>
                                        <input
                                            ref={fieldRefs.amount}
                                            type="number"
                                            value={paymentData.amount}
                                            onChange={(e) => handleChange("amount", e.target.value)}
                                            onBlur={() => handleBlur("amount")}
                                            className={`${inputClass("amount")} pl-10`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <ErrorMsg field="amount" />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[16px] font-medium text-[#282829] mb-2">
                                        Description <span className="text-[#F04438]">*</span>
                                    </label>
                                    <textarea
                                        ref={fieldRefs.description}
                                        rows="4"
                                        value={paymentData.description}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        onBlur={() => handleBlur("description")}
                                        className={`w-full p-4 bg-white border rounded-2xl focus:outline-none focus:ring-2 resize-none transition-colors text-[#282829] ${touched.description && errors.description
                                            ? "border-red-400 focus:ring-red-300"
                                            : "border-[#E5E7EB] focus:ring-blue-500"
                                            }`}
                                        placeholder="Enter description..."
                                    />
                                    <ErrorMsg field="description" />
                                </div>

                                {/* Payment Timing */}
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="radio"
                                                name="paymentTime"
                                                className="peer hidden"
                                                checked={paymentTiming === "now"}
                                                onChange={() => {
                                                    setPaymentTiming("now");
                                                    setErrors(prev => ({ ...prev, paymentDate: "" }));
                                                }}
                                            />
                                            <div className="w-6 h-6 border-2 border-[#E5E7EB] rounded-full peer-checked:border-[#237FEA] transition-all"></div>
                                            <div className="absolute w-3 h-3 bg-[#237FEA] rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[16px] font-medium text-[#282829]">Make the payment now</span>
                                            {paymentTiming === "now" && (
                                                <span className="text-sm text-gray-500 mt-1">
                                                    Estimated charge date: {(() => {
                                                        const d = new Date();
                                                        d.setDate(d.getDate() + 5);
                                                        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                                                    })()}
                                                </span>
                                            )}
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="radio"
                                                name="paymentTime"
                                                className="peer hidden"
                                                checked={paymentTiming === "specific"}
                                                onChange={() => setPaymentTiming("specific")}
                                            />
                                            <div className="w-6 h-6 border-2 border-[#E5E7EB] rounded-full peer-checked:border-[#237FEA] transition-all"></div>
                                            <div className="absolute w-3 h-3 bg-[#237FEA] rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                        </div>
                                        <span className="text-[16px] font-medium text-[#282829]">Make payment on a specific date</span>
                                    </label>

                                    {paymentTiming === "specific" && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Select Date <span className="text-[#F04438]">*</span>
                                            </label>
                                            <input
                                                ref={fieldRefs.paymentDate}
                                                type="date"
                                                min={(() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 5);
                                                    return d.toISOString().split('T')[0];
                                                })()}
                                                value={paymentData.paymentDate}
                                                onChange={(e) => handleChange("paymentDate", e.target.value)}
                                                onBlur={() => handleBlur("paymentDate")}
                                                className={`w-full p-4 border rounded-2xl focus:outline-none focus:ring-2 transition-colors text-[#282829] ${touched.paymentDate && errors.paymentDate
                                                    ? "border-red-400 focus:ring-red-300 bg-red-50"
                                                    : "border-[#E5E7EB] focus:ring-blue-500 bg-white"
                                                    }`}
                                            />
                                            <ErrorMsg field="paymentDate" />
                                        </div>
                                    )}
                                </div>

                                {/* Payment Source */}
                                <div>
                                    <label className="block text-[16px] font-medium text-[#282829] mb-4">Payment Source</label>
                                    <div className="flex flex-wrap gap-6">
                                        {[
                                            { id: 'accesspaysuite', label: 'Accesspaysuite' },
                                            { id: 'gocardless', label: 'gocardless' },
                                            { id: 'stripe', label: 'Card via Stripe' }
                                        ].filter(source => {
                                            const hasAccessPay = serviceHistory?.payments?.some(p => p.paymentType === "accesspaysuite" && p.paymentCategory === "recurring");
                                            const hasGoCardless = serviceHistory?.payments?.some(p => p.paymentType === "bank" && p.paymentCategory === "recurring");
                                            if (source.id === 'accesspaysuite' && hasGoCardless && !hasAccessPay) return false;
                                            if (source.id === 'gocardless' && hasAccessPay) return false;
                                            return true;
                                        }).map((source) => (
                                            <label key={source.id} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name="paymentSource"
                                                        className="peer hidden"
                                                        checked={paymentSource === source.id}
                                                        onChange={() => {
                                                            setPaymentSource(source.id);
                                                            if (source.id !== "stripe") {
                                                                setErrors(prev => {
                                                                    const next = { ...prev };
                                                                    ["cardholderName", "cardNumber", "expiryDate", "cvc"].forEach(f => delete next[f]);
                                                                    return next;
                                                                });
                                                                setTouched(prev => {
                                                                    const next = { ...prev };
                                                                    ["cardholderName", "cardNumber", "expiryDate", "cvc"].forEach(f => delete next[f]);
                                                                    return next;
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-6 h-6 border-2 border-[#E5E7EB] rounded-full peer-checked:border-[#237FEA] transition-all"></div>
                                                    <div className="absolute w-3 h-3 bg-[#237FEA] rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                                </div>
                                                <span className="text-[16px] font-medium text-[#282829]">{source.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Stripe card fields */}
                                {paymentSource === 'stripe' && (
                                    <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">

                                        {/* Cardholder Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Cardholder Name <span className="text-[#F04438]">*</span>
                                            </label>
                                            <input
                                                ref={fieldRefs.cardholderName}
                                                type="text"
                                                placeholder="John Smith"
                                                value={paymentData.cardholderName}
                                                onChange={(e) => handleChange("cardholderName", e.target.value)}
                                                onBlur={() => handleBlur("cardholderName")}
                                                className={smallInputClass("cardholderName")}
                                            />
                                            <ErrorMsg field="cardholderName" />
                                        </div>

                                        {/* Card Number */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Card Number <span className="text-[#F04438]">*</span>
                                            </label>
                                            <input
                                                ref={fieldRefs.cardNumber}
                                                type="text"
                                                placeholder="4242 4242 4242 4242"
                                                maxLength="19"
                                                value={paymentData.cardNumber}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
                                                    handleChange("cardNumber", formatted.substring(0, 19));
                                                }}
                                                onBlur={() => handleBlur("cardNumber")}
                                                className={smallInputClass("cardNumber")}
                                            />
                                            <ErrorMsg field="cardNumber" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Expiry Date */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Expiry Date <span className="text-[#F04438]">*</span>
                                                </label>
                                                <input
                                                    ref={fieldRefs.expiryDate}
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    maxLength="5"
                                                    value={paymentData.expiryDate}
                                                    onChange={(e) => {
                                                        let val = e.target.value.replace(/\D/g, '');
                                                        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                                        handleChange("expiryDate", val);
                                                    }}
                                                    onBlur={() => handleBlur("expiryDate")}
                                                    className={smallInputClass("expiryDate")}
                                                />
                                                <ErrorMsg field="expiryDate" />
                                            </div>

                                            {/* CVC */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    CVC <span className="text-[#F04438]">*</span>
                                                </label>
                                                <input
                                                    ref={fieldRefs.cvc}
                                                    type="text"
                                                    placeholder="123"
                                                    maxLength="4"
                                                    value={paymentData.cvc}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                                                        handleChange("cvc", val);
                                                    }}
                                                    onBlur={() => handleBlur("cvc")}
                                                    className={smallInputClass("cvc")}
                                                />
                                                <ErrorMsg field="cvc" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-8 pt-4 border-t border-gray-100">
                            <button
                                disabled={isSubmitting}
                                className={`w-full bg-[#237FEA] text-white py-4 rounded-2xl font-semibold text-[18px] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                onClick={handlePaymentSubmit}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : 'Create Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "History of Payments" && <HistoryOfPayments stateData={serviceHistory} />}
            {activeTab === "Failed Payments" && <FailedPayments itemId={itemId} memberInfo={memberInfo} />}
            {activeTab === "Attendance" && <Attendance stateData={serviceHistory} />}
            {activeTab === "Credits" && <Credits itemId={itemId} stateData={serviceHistory} />}
            {activeTab === "General" && <General stateData={serviceHistory} />}
        </>
    );
};

export default SeeDetails;
