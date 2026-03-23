import { useState } from "react";
import CandidateInfo from "./CandidateInfo";
import Events from "./Events";
import { useNavigate } from "react-router-dom";
// import Loader from "../contexts/Loader";


const tabs = [
    { name: "Candidate Profile", component: <CandidateInfo /> },
    { name: "Events", component: <Events /> },
];

const CandidateDetails = () => {
    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const navigate = useNavigate();


    return (
        <div className="mt-8 relative">

            <div className="flex items-center gap-5">
                <img onClick={() => navigate(`/recruitment/lead`)} src="/reportsIcons/arrowBack.png" className="cursor-pointer w-6" alt="" />
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
