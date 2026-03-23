import  { useEffect, useState } from "react";
import ParentProfile from "./ParentProfile";
import StudentProfile from "./StudentProfile";
import ServiceHistory from "./ServiceHistory";
import Feedback from "./Feedback";
import Rewards from "../../Rewards";
import Events from "./Events";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccountsInfo } from "../../../contexts/AccountsInfoContext";
import Loader from "../../../contexts/Loader";

const tabs = [
  { name: "Parent Profile", component: <ParentProfile /> },
  { name: "Student Profile", component: <StudentProfile /> },
  { name: "Service History", component: <ServiceHistory /> },
  { name: "Feedback", component: <Feedback /> },
  { name: "Rewards", component: <Rewards /> },
  { name: "Events", component: <Events /> },
];

const AccountMain = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const navigate = useNavigate();
  const { loading, setMainId ,fetchOneToOneMembers } = useAccountsInfo();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id"); // <-- this will be "9"  console.log('id',id)

  useEffect(() => {
    fetchOneToOneMembers(id);
    if (id) {
      setMainId(id);
    }
  }, [])

  if (loading) return <Loader />;

  return (
    <div className="mt-8 relative">

      <div className="flex  items-center md:w-7/12 bg-white p-3 gap-1 rounded-2xl p-1 space-x-2 overflow-auto">
        <h2
          onClick={() => {
            navigate('/one-to-one');
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
            onClick={() => setActiveTab(tab.name)}
            className={`relative flex-1 text-[15px] md:text-base font-semibold py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.name
              ? "bg-[#237FEA] shadow text-white"
              : "text-[#282829] hover:text-[#282829]"
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

export default AccountMain;
