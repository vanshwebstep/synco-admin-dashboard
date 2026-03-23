import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BirthdayLeadsDashboard from "./BirthdayLeadsDashboard";
import SalesDashboard from "./SalesDashboard";
import AllDashboard from "./AllDashboard";


const tabs = [
  { name: "Leads", component: <BirthdayLeadsDashboard /> },
  { name: "Sales", component: <SalesDashboard /> },
  { name: "All", component: <AllDashboard /> },
];

const BirthdayLeads = () => {
    const [showFilter, setShowFilter] = useState(false);

  const [activeTab, setActiveTab] = useState(
    localStorage.getItem("activeTab") || tabs[0].name
  );

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

 const handleTabChange =(tab)=>{
    setActiveTab(tab);
     localStorage.setItem("activeTab", tab);
  }

  return (
    <div className="mt-3 relative">
      <div className="flex md:max-w-[300px] items-center p-3 gap-1 rounded-2xl space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={()=> handleTabChange(tab.name)}
            className={`relative flex-1 w-auto text-[18px] md:text-base font-semibold py-3 px-4 rounded-xl transition-all ${
              activeTab === tab.name
                ? "bg-[#237FEA] shadow text-white"
                : "text-[#282829] bg-white border border-[#E2E1E5] hover:text-[#282829]"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="mt-0">
        {tabs.find((tab) => tab.name === activeTab)?.component}
      </div>
    </div>
  );
};

export default BirthdayLeads;
