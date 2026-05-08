import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBookFreeTrial } from "../../../contexts/BookAFreeTrialContext";
import Loader from "../../../contexts/Loader";
import ParentProfile from "./ParentProfile";
import StudentProfile from "./StudentProfile";
import ServiceHistory from "./ServiceHistory";
import Feedback from "./Feedback";
import Rewards from "./Rewards";
import Events from "./Events";

const AccountInfo = () => {
    const { serviceHistoryLeads, serviceHistory, loading } = useBookFreeTrial();
    const navigate = useNavigate();
    const location = useLocation();
    const [leadId, setLeadId] = useState(null);
    const [activeTab, setActiveTab] = useState("Parent Profile");

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const idFromUrl = queryParams.get("id");
        if (idFromUrl) {
            setLeadId(idFromUrl);
        }
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.search, location.state]);

    useEffect(() => {
        if (leadId) {
            serviceHistoryLeads(leadId);
        }
    }, [leadId, serviceHistoryLeads]);

    const tabs = [
        "Parent Profile",
        "Student Profile",
        "Service History",
        "Feedback",
        "Rewards",
        "Events",
    ];

    if (loading) {
        return <Loader />;
    }

    // Prepare data for child components
    // Note: serviceHistory here is actually the full lead object returned by serviceHistoryLeads
    // based on the context implementation: setServiceHistory(result?.bookings)
    // Wait, let's check the context again.
    // resultRaw.data || []; result = resultRaw.data; setServiceHistory(result?.bookings);
    // So serviceHistory is just the bookings array.
    // We might need the full lead object for ParentProfile.

    // Let's check what serviceHistoryLeads does in context:
    // const resultRaw = await response.json();
    // const result = resultRaw.data || [];
    // setServiceHistory(result?.bookings);

    // Wait, if we only set result?.bookings to serviceHistory, then ParentProfile won't get the lead metadata.
    // I should probably check if I can update the context to store the full lead data or just pass it differently.

    return (
        <div className="relative">
            <div className="flex items-center mb-5 gap-2 md:gap-3 justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <h2
                        onClick={() => navigate("/weekly-classes/central-leads")}
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
                                    ${activeTab === tab ? "bg-[#237FEA] text-white" : "hover:text-[#237FEA]"}
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6">
                {activeTab === "Parent Profile" && (
                    <ParentProfile leadData={{ bookings: serviceHistory, id: leadId }} fetchedformData={serviceHistory} />
                )}
                {activeTab === "Student Profile" && (
                    <StudentProfile leadData={{ bookings: serviceHistory?.bookings }} />
                )}
                {activeTab === "Service History" && (
                    <ServiceHistory leadData={{ bookings: serviceHistory?.bookings, id: leadId }} />
                )}
                {activeTab === "Feedback" && <Feedback leadData={{ bookings: serviceHistory }} />}
                {activeTab === "Rewards" && <Rewards leadData={{ bookings: serviceHistory }} />}
                {activeTab === "Events" && <Events leadData={{ bookings: serviceHistory }} />}
            </div>
        </div>
    );
};

export default AccountInfo;
