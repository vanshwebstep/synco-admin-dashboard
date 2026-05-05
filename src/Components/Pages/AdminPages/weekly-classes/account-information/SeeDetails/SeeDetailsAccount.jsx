import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import HistoryOfPayments from "../../all-members/See Details/HistoryOfPayments";
import Attendance from "../../all-members/See Details/Attendance";
import FailedPayments from "../../all-members/See Details/FailedPayments";
import General from "../../all-members/See Details/General";
import Credits from "../../all-members/See Details/Credits";

const SeeDetailsAccount = () => {
    const { serviceHistoryMembership, serviceHistory } = useBookFreeTrial();
    const navigate = useNavigate();
    const location = useLocation();
    const [itemId, setItemId] = useState(null);
    const [activeTab, setActiveTab] = useState("General");
    const [memberInfo, setMemberInfo] = useState(null);

    useEffect(() => {
        if (location.state?.itemId) {
            setItemId(location.state.itemId);
        }
        if (location.state?.defaultTab) {
            setActiveTab(location.state.defaultTab);
        }
        if (location.state?.memberInfo) {
            setMemberInfo(location.state.memberInfo);
        }
    }, [location.state]);

    useEffect(() => {
        if (itemId) {
            serviceHistoryMembership(itemId);
        }
    }, [itemId, serviceHistoryMembership]);

    const tabs = ["General", "History of Payments", "Credits", "Attendance"];

    const handleBack = () => {
        const backPath = location.state?.from || "/weekly-classes/account-information";
        navigate(backPath, {
            state: { 
                itemId: itemId, 
                defaultTab: "Service History",
                memberInfo: memberInfo
            }
        });
    };

    return (
        <>
            <div className="flex justify-between items-end mb-5 gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3">
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
                    <div className="flex gap-0 p-1 rounded-xl flex-wrap bg-white">
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

                <div className="flex items-start gap-2 md:gap-3">
                    <button onClick={() => setActiveTab("Failed Payments")}
                        className="border border-black flex items-center gap-2 text-black px-8 py-2 md:py-[12px] rounded-xl hover:bg-gray-200 text-[18px]"
                    >
                        See Failed Payments
                    </button>
                    <button className="border border-[#237FEA] flex items-center gap-2 text-[#237FEA] px-8 py-2 md:py-[12px] rounded-xl hover:bg-[#237FEA] hover:text-white text-[18px]">
                        Add a subscription
                    </button>
                    <button className="bg-[#237FEA] flex items-center gap-2 text-white px-8 py-2 md:py-[12px] rounded-xl hover:bg-blue-700 text-[18px]">
                        Create Payment
                    </button>
                </div>
            </div>

            {activeTab === "General" && <General stateData={serviceHistory} />}
            {activeTab === "History of Payments" && <HistoryOfPayments stateData={serviceHistory} />}
            {activeTab === "Attendance" && <Attendance stateData={serviceHistory} />}
            {activeTab === "Credits" && <Credits itemId={itemId} />}
            {activeTab === "Failed Payments" && <FailedPayments itemId={itemId} memberInfo={memberInfo || "allMembers"} />}
        </>
    );
};

export default SeeDetailsAccount;
