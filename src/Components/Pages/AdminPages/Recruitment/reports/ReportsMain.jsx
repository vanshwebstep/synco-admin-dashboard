import { useState } from "react";
// import Loader from "../contexts/Loader";

import CoachReport from "./CoachReport";
import VenueManagerReports from "./VenueManagerReports";
import FranchiseReport from "./FranchiseReport";

const tabs = [
  { name: "Coach Applicatiion", component: <CoachReport /> },
  { name: "Venue Manager", component: <VenueManagerReports /> },
  { name: "Franchise", component: <FranchiseReport /> },
];

const ReportsMain = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].name);



  //   if (loading) return <Loader />;

  return (
    <div className="mt-4 relative">

      <div className="flex items-center p-3 gap-1 rounded-2xl w-fit  p-1 space-x-2 overflow-auto">

        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`relative flex-1 text-[15px] md:text-base font-semibold py-3 px-4 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.name
              ? "bg-[#237FEA] shadow text-white"
              : "text-[#282829] bg-white border border-[#E2E1E5] hover:text-[#282829]"
              }`}
          >
            {tab.name}

          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.find((tab) => tab.name === activeTab)?.component}
      </div>
    </div>
  );
};

export default ReportsMain;
