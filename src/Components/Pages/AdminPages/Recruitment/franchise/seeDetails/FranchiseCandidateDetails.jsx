import { useState } from "react";
import OverView from "./OverView";
import Answers from "./Answers";
import { useNavigate } from "react-router-dom";
// import Loader from "../contexts/Loader";


 
const FranchiseCandidateDetails = () => {
    const navigate = useNavigate();
const [steps, setSteps] = useState([
  {
    id: 1,
    title: "Qualify Lead",
    actionType: "buttons",
    status: "completed",
    isEnabled: true, // Always enabled
  },
  {
    id: 2,
    title: "Google Meet Call",
    buttonText: "Schedule a call",
    isOpen: false,
    status: "pending",
    isEnabled: false,
  },
  {
    id: 3,
    title: "Delivery Google Meet",
    buttonText: "Scorecard",
    status: "pending",
    isEnabled: false,
  },
  {
    id: 4,
    title: "Discovery day",
    status: "pending",
    isEnabled: false,
  },
  {
    id: 5,
    title: "Waiting for offer",
    resultPercent: "87%",
    resultStatus: "Passed",
    status: "pending",
    isEnabled: false,
  },
]);

const tabs = [
    { name: "OverView", component: <OverView steps={steps} setSteps={setSteps} /> },
    { name: "Answers", component: <Answers /> },
];
    const [activeTab, setActiveTab] = useState(tabs[0].name);

    return (
        <div className="mt-8 relative">

            <div className="flex items-center gap-5">
                <img onClick={() => navigate(`/recruitment/franchise-lead`) && setSteps([])} src="/reportsIcons/arrowBack.png" className="cursor-pointer w-6" alt="" />
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

export default FranchiseCandidateDetails;
