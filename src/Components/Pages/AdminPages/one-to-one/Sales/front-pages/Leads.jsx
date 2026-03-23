import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LeadsDashboard from "./LeadsDashboard";
import SalesDashboard from "./SalesDashboard";
import AllDashboard from "./AllDashboard";

const tabs = [
  { name: "Leads", component: <LeadsDashboard /> },
  { name: "Sales", component: <SalesDashboard /> },
  { name: "All", component: <AllDashboard /> },
];

const Leads = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get the 'tab' parameter from URL or fallback to localStorage or default
  const urlTab = searchParams.get("tab");
  const defaultTab = urlTab || localStorage.getItem("activeTab") || tabs[0].name;

  const [activeTab, setActiveTab] = useState(defaultTab);

  // When activeTab changes → update localStorage + URL param
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // If user directly changes URL ?tab=Something → update state
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="mt-3 relative">
      <div className="flex md:max-w-[300px] items-center p-3 gap-1 rounded-2xl space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => handleTabChange(tab.name)}
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

export default Leads;
