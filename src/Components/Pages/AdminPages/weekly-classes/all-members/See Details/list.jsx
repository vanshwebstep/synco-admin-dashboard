import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

import FailedPayments from "./FailedPayments";
// import ServiceHistory from "./serviceHistory";
// import ParentProfile from "../ParentProfile";
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import HistoryOfPayments from "./HistoryOfPayments";
import Attendance from "./Attendance";
import FailedPayment from "./FailedPayments";
import General from "./General";
import Credits from "./Credits";
import { showError, showSuccess, showWarning } from "../../../../../../utils/swalHelper";

const SeeDetails = () => {
    const { serviceHistoryMembership, serviceHistory, serviceHistoryFetchById } = useBookFreeTrial()
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
    const [paymentData, setPaymentData] = useState({
        amount: "",
        description: "",
        cardNumber: "",
        expiryDate: "",
        cvc: "",
        cardholderName: "",
        paymentDate: ""
    });
    console.log('serviceHistory', serviceHistory);
    console.log("Location state:", location.state);

    useEffect(() => {
        if (location.state?.itemId) {
            setItemId(location.state.itemId);
        }

        if (location.state?.memberInfo) {
            setMemberInfo(location.state.memberInfo);
        }

        if (location.state?.defaultTab) {
            setActiveTab(location.state.defaultTab);
        }

        // Extract serviceType
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
    }, [itemId, memberInfo]); // ✅ correct dependency
    const [activeTab, setActiveTab] = useState("General");
    const tabs = [
        "General",
        "History of Payments",
        "Credits",
        "Attendance",
    ].filter(tab => {
        if (memberInfo === 'freeTrial' && tab === "History of Payments") {
            return false;
        }
        return true;
    });
    const navigateTo =
        memberInfo === "allMembers" || memberInfo === "freeTrial"
            ? {
                pathname: "/weekly-classes/trial/find-a-class/book-a-free-trial/account-info/list",
                state: { itemId: itemId, defaultTab: "Service History", memberInfo: memberInfo }
            }
            : memberInfo === "cancellation"
                ? {
                    pathname: "/weekly-classes/cancellation/account-info/list",
                    state: { itemId: itemId, defaultTab: "Service History", memberInfo: memberInfo }
                }
                : memberInfo === "waitingList"
                    ? {
                        pathname: "/weekly-classes/add-to-waiting-list/account-info",
                        state: { itemId: itemId, defaultTab: "Service History", memberInfo: memberInfo }
                    }
                    : {
                        pathname: "/weekly-classes/all-members/account-info",
                        state: { itemId: itemId, defaultTab: "Service History", memberInfo: memberInfo }
                    };

    const handleBack = () => {
        const backPath = location.state?.from || navigateTo.pathname;
        navigate(backPath, {
            state: {
                ...(location.state?.from ? { itemId, defaultTab: "Service History", memberInfo } : navigateTo.state)
            }
        });
    };
    const handlePaymentSubmit = async () => {
        if (!paymentData.amount || !paymentData.description) {
            alert("Please fill in amount and description");
            return;
        }

        const token = localStorage.getItem("adminToken");

        setIsSubmitting(true);

        // Stripe card validation
        if (paymentSource === "stripe") {
            const cleanCard = paymentData.cardNumber.replace(/\s/g, "");

            if (cleanCard.length !== 16) {
                alert("Please enter a valid 16-digit card number");
                setIsSubmitting(false);
                return;
            }

            if (!/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
                alert("Please enter expiry date in MM/YY format");
                setIsSubmitting(false);
                return;
            }

            if (paymentData.cvc.length < 3) {
                alert("Please enter a valid CVC");
                setIsSubmitting(false);
                return;
            }
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${token}`);

        const raw = JSON.stringify({
            description: paymentData.description,
            amount: Number(paymentData.amount),
            paymentMethod:
                paymentSource === "stripe" ? "card" : paymentSource,
            paymentTiming: paymentTiming,
            paymentDate:
                paymentTiming === "specific"
                    ? paymentData.paymentDate
                    : null,

            ...(paymentSource === "stripe" && {
                cardNumber: paymentData.cardNumber,
                expiryDate: paymentData.expiryDate,
                cvc: paymentData.cvc,
                cardholderName: paymentData.cardholderName,
            }),
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/book-membership/${itemId}/one-off-payment`,
                requestOptions
            );

            const result = await response.json();

            console.log("API Response:", result);

            // Success response
            if (response.ok && (result.success === true || result.status === true)) {
                showSuccess(result.message || "Payment processed successfully!");

                setShowPaymentModal(false);

                // Refresh data
                if (itemId) {
                    serviceHistoryMembership(itemId);
                }
            } else {
                // Error response from API
                showError(
                    result.message ||
                    result.error ||
                    "Failed to process payment."
                );
            }
        } catch (error) {
            console.error("Payment Error:", error);

            showError("Failed to process payment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    useEffect(() => {
        if (serviceHistory?.payments?.length) {
            const payments = serviceHistory.payments;

            const accessPay = payments.find(
                (p) =>
                    p.paymentType === "accesspaysuite" &&
                    p.paymentCategory === "recurring"
            );

            const goCardless = payments.find(
                (p) =>
                    p.paymentType === "bank" &&
                    p.paymentCategory === "recurring"
            );

            if (accessPay) {
                setPaymentSource("accesspaysuite");
            } else if (goCardless) {
                setPaymentSource("goacardless");
            } else {
                setPaymentSource("stripe");
            }
        }
    }, [serviceHistory]);

    return (
        <>
            <div className=" flex justify-between items-end mb-5 gap-2 md:gap-3">
                <div className=" flex items-center gap-2 md:gap-3">
                    <h2
                        onClick={handleBack}
                        className="text-xl md:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    >
                        <img
                            src="/images/icons/arrow-left.png"
                            alt="Back"
                            className="w-5 h-5 md:w-6 md:h-6"
                        />
                    </h2>
                    <div className="flex gap-0   p-1 rounded-xl flex-wrap bg-white">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 rounded-xl text-[16px] font-medium transition capitalize
        ${activeTab === tab ? "bg-[#237FEA] text-white" : "hover:text-[#237FEA]"}      `}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className=" flex items-start  gap-2 md:gap-3">
                    {memberInfo !== 'freeTrial' &&
                        <>
                            <button onClick={() => setActiveTab("Failed Payments")}
                                className=" border border-black flex items-center gap-2 text-black px-8 py-8 md:py-[12px] rounded-xl hover:bg-gray-200 text-[18px]  "
                            >
                                See Failed Payments
                            </button>
                            <button
                                className="border border-[#237FEA]  flex items-center gap-2 text-[#237FEA] px-8 py-8 md:py-[12px] rounded-xl hover:bg-[#237FEA] hover:text-white text-[18px]  "
                            >
                                Add a subscription
                            </button>

                        </>
                    }
                    {memberInfo === "membership" && (
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="bg-[#237FEA] flex items-center gap-2 text-white px-8 py-8 md:py-[12px] rounded-xl hover:bg-blue-700 text-[18px]  "
                        >
                            Create Payment
                        </button>
                    )}
                </div>
            </div >

            {/* Create Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-[#10101094] bg-opacity-40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
                        {/* Sticky Header */}
                        <div className="flex justify-between items-center p-8 pb-4 border-b border-gray-100">
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" className="w-4 h-4" />
                            </button>
                            <h3 className="text-2xl font-semibold text-center flex-1 pr-8">Create One-Off Payment</h3>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[16px] font-medium text-[#282829] mb-2">Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-medium">
                                            <span>£</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            className="w-full p-4 pl-10 bg-white border border-[#E5E7EB] rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#282829]"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[16px] font-medium text-[#282829] mb-2">Description</label>
                                    <textarea
                                        rows="4"
                                        value={paymentData.description}
                                        onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                                        className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-[#282829]"
                                        placeholder="Enter description..."
                                    ></textarea>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="radio"
                                                name="paymentTime"
                                                className="peer hidden"
                                                checked={paymentTiming === "now"}
                                                onChange={() => setPaymentTiming("now")}
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
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Select Date</label>
                                            <input
                                                type="date"
                                                min={(() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 5);
                                                    return d.toISOString().split('T')[0];
                                                })()}
                                                value={paymentData.paymentDate}
                                                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                                                className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#282829]"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[16px] font-medium text-[#282829] mb-4">Payment Source</label>
                                    <div className="flex flex-wrap gap-6">
                                        {[
                                            { id: 'accesspaysuite', label: 'Accesspaysuite' },
                                            { id: 'goacardless', label: 'Goacardless' },
                                            { id: 'stripe', label: 'Card via Stripe' }
                                        ].filter(source => {
                                            const hasAccessPay = serviceHistory?.payments?.some(p => p.paymentType === "accesspaysuite" && p.paymentCategory === "recurring");
                                            const hasGoCardless = serviceHistory?.payments?.some(p => p.paymentType === "bank" && p.paymentCategory === "recurring");

                                            if (source.id === 'accesspaysuite' && hasGoCardless && !hasAccessPay) return false;
                                            if (source.id === 'goacardless' && hasAccessPay) return false;
                                            return true;
                                        }).map((source) => (
                                            <label key={source.id} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name="paymentSource"
                                                        className="peer hidden"
                                                        checked={paymentSource === source.id}
                                                        onChange={() => setPaymentSource(source.id)}
                                                    />
                                                    <div className="w-6 h-6 border-2 border-[#E5E7EB] rounded-full peer-checked:border-[#237FEA] transition-all"></div>
                                                    <div className="absolute w-3 h-3 bg-[#237FEA] rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                                </div>
                                                <span className="text-[16px] font-medium text-[#282829]">{source.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {paymentSource === 'stripe' && (
                                    <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Cardholder Name</label>
                                            <input
                                                type="text"
                                                placeholder="John Smith"
                                                value={paymentData.cardholderName}
                                                onChange={(e) => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                                                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#282829]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Card Number</label>
                                            <input
                                                type="text"
                                                placeholder="4242 4242 4242 4242"
                                                maxLength="19"
                                                value={paymentData.cardNumber}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
                                                    setPaymentData({ ...paymentData, cardNumber: formatted.substring(0, 19) });
                                                }}
                                                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#282829]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Expiry Date</label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    maxLength="5"
                                                    value={paymentData.expiryDate}
                                                    onChange={(e) => {
                                                        let val = e.target.value.replace(/\D/g, '');
                                                        if (val.length > 2) {
                                                            val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                                        }
                                                        setPaymentData({ ...paymentData, expiryDate: val });
                                                    }}
                                                    className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#282829]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">CVC</label>
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    maxLength="4"
                                                    value={paymentData.cvc}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                                                        setPaymentData({ ...paymentData, cvc: val });
                                                    }}
                                                    className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#282829]"
                                                />
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
            {/* {/* {activeTab === "Service History" && (
        <ServiceHistory serviceHistory={serviceHistory} />
      )} */}
            {
                activeTab === "History of Payments" && (
                    <HistoryOfPayments stateData={serviceHistory} />
                )
            }
            {activeTab === "Failed Payments" && (
                <FailedPayments itemId={itemId} memberInfo={memberInfo} />
            )}
            {
                activeTab === "Attendance" && (
                    <Attendance stateData={serviceHistory} />
                )
            }

            {
                activeTab === "Credits" && (
                    <Credits itemId={itemId} stateData={serviceHistory} />
                )
            }
            {
                activeTab === "General" && (
                    <General stateData={serviceHistory} />
                )
            }
        </>
    )
}

export default SeeDetails