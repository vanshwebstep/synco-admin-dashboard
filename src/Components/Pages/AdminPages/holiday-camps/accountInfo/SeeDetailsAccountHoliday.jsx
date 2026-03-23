import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccountsInfo } from "../../contexts/AccountsInfoContext";
import Loader from "../../contexts/Loader";
import General from "./General";
import Attendance from "./Attendance";
import PaymentHistory from "./PaymentHistory";

const tabs = [

  { name: "General", component: <General /> },
  { name: "History Of Payments", component: <PaymentHistory /> },
  { name: "Attendance", component: <Attendance /> },
];

const SeeDetailsAccountHoliday = () => {
  const navigate = useNavigate();
  const { loading, data, setMainId, fetchHolidayCamps, historyActiveTab, setHistoryActiveTab } = useAccountsInfo();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id"); // 

  useEffect(() => {
    fetchHolidayCamps(id);
    if (id) {
      setMainId(id);
    }
  }, [])

  if (loading) return <Loader />;

  return (
    <div className="mt-8 relative">

      <div className="flex  items-center w-[max-content] bg-white p-3 gap-1 rounded-2xl p-1 space-x-2">
        <h2 className="cursor-pointer"
          onClick={() => {
            navigate(`/holiday-camp/members/account-information?id=${data?.id}`);
            setHistoryActiveTab('General');
          }}>
          <img
            src="/images/icons/arrow-left.png"
            alt="Back"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </h2>
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setHistoryActiveTab(tab.name)}
            className={`relative flex-1 text-[15px] whitespace-nowrap w-auto px-2 md:text-base font-semibold py-3 rounded-xl transition-all ${historyActiveTab === tab.name
              ? "bg-[#237FEA] shadow text-white"
              : "text-[#282829] hover:text-[#282829]"
              }`}
          >
            {tab.name}

          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.find((tab) => tab.name === historyActiveTab)?.component}
      </div>
    </div>
  );
};

export default SeeDetailsAccountHoliday;
