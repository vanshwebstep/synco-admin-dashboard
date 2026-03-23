import { useState } from "react";
import CandidateInfo from "./CandidateInfo";
import Events from "./Events";
import { useNavigate } from "react-router-dom";
// import Loader from "../contexts/Loader";



const CandidateDetails = () => {
    const navigate = useNavigate();
    const [steps, setSteps] = useState([
        {
            id: 1,
            title: "Qualify Lead",
            actionType: "buttons", // show ✓ × buttons
            status: "pending",
            isEnabled: true, // ONLY first step enabled // completed | pending | skipped
        },

        {
            id: 2,
            title: "Telephone Call Setup",
            buttonText: "Schedule a call",
            isOpen: false,
            status: "pending",
            isEnabled: false,
        },


        {
            id: 3,
            title: "Delivery Telephone Interview",
            buttonText: "Scorecard",
            isOpen: false,
            status: "pending",
            isEnabled: false,
        },
        {
            id: 4,
            title: "Practical assessment",
            buttonText: "Scorecard2",
            date: "23 April, 2023",
            isOpen: false,
            status: "pending",
            isEnabled: false,
        },
        {
            id: 5,
            title: "Waiting results",
            resultPercent: "87%",
            resultStatus: "Passed",
            isOpen: false,
            status: "pending",
            isEnabled: false,
        },
    ]);
    const tabs = [
        { name: "Candidate Profile", component: <CandidateInfo steps={steps} setSteps={setSteps} /> },
        { name: "Events", component: <Events /> },
    ];
    const [activeTab, setActiveTab] = useState(tabs[0].name);

    return (
        <div className="mt-8 relative">

            <div className="flex items-center gap-5">
                <img onClick={() => navigate(`/recruitment/lead`) && setSteps([])} src="/reportsIcons/arrowBack.png" className="cursor-pointer w-6" alt="" />
                <div className="flex items-center p-3 gap-1 rounded-2xl w-fit bg-white  p-1 space-x-2 overflow-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`relative flex-1 text-[15px] md:text-base font-semibold py-3 px-4 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.name
                                ? "bg-[#237FEA] shadow text-white"
                                : "text-[#282829] hover:text-[#282829]"
                                }`}
                        >
                            {tab.name}

                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                {tabs.find((tab) => tab.name === activeTab)?.component}
            </div>
        </div>
    );
};

export default CandidateDetails;
