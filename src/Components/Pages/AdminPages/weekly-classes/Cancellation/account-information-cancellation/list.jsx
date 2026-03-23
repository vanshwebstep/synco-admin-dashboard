import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

const tabs = [
  "Parent Profile",
  "Student Profile",
  "Service History",
  "Feedback",
  "Rewards",
  "Events",
];

import ParentProfile from "./ParentProfile";
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import ServiceHistory from "../../../Common/serviceHistory";
import StudentProfile from "./StudentProfile";
import Loader from "../../../contexts/Loader";
import Feedback from "./Feedback";

const AccountInfoCancellation = (from) => {
  const { ServiceHistoryRequestto, ServiceHistoryFulltto, ServiceHistoryAlltto, serviceHistory, loading } = useBookFreeTrial()
  const navigate = useNavigate();
  const location = useLocation();
  const [itemId, setItemId] = useState(null);

  const myCancelType = location.state?.cancelType;
  console.log('cancelType', location.state?.cancelType)
  useEffect(() => {
    if (location.state?.itemId) {
      setItemId(location.state.itemId);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      if (!itemId) return;

      try {
        if (myCancelType === "full") {
          await ServiceHistoryFulltto(itemId);
        } else if (myCancelType === "all") {
          await ServiceHistoryAlltto(itemId);
        } else {
          await ServiceHistoryRequestto(itemId);
        }
      } catch (error) {
        console.error("Error fetching service history:", error);
      }
    };

    fetchData();
  }, [itemId, myCancelType, ServiceHistoryFulltto, ServiceHistoryAlltto, ServiceHistoryRequestto]);

  const [activeTab, setActiveTab] = useState("Parent Profile");
  console.log('serviceHistory', serviceHistory)
  if (loading) return <Loader />;


  return (
    <>
      <div className="relative ">
        <div className=" flex items-end mb-5 gap-2 md:gap-3">
          <div className=" flex items-center gap-2 md:gap-3">
            <h2
              onClick={() => {
                let stateValue;

                if (myCancelType === "all") {
                  stateValue = "allCancellation";
                } else if (myCancelType === "full") {
                  stateValue = "fullCancellation";
                } else {
                  stateValue = "request";
                }

                navigate("/weekly-classes/cancellation", { state: stateValue });
              }}


              className="text-xl md:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-200"
            >
              <img
                src="/images/icons/arrow-left.png"
                alt="Back"
                className="w-5 h-5 md:w-6 md:h-6"
              />
            </h2>
            <div className="flex gap-0   p-1 rounded-xl flex-wrap bg-white">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-xl text-[16px] font-medium transition capitalize
            ${activeTab === tab
                      ? "bg-[#237FEA] text-white"
                      : " hover:text-[#237FEA]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "Service History" && (
            <div className=" flex items-start  gap-2 md:gap-3">
              {/* <div className="flex gap-2  items-center    p-2 rounded-xl flex-wrap bg-white">
            <img
              src="/images/points.png"
              alt="Back"
              className="md:w-11 md:h-11 w-6 h-6"
            />
            <div className="block  pr-3">
              <div className="whitespace-nowrap text-[#717073] font-semibold text-[14px]">Total points</div>
              <div className="text-[20px] font-semibold text-[#384455]">543</div>
            </div>
          </div> */}
              <div className="flex gap-2  items-center    p-2 rounded-xl flex-wrap bg-white">
                <img
                  src="/images/totalPoints.png"
                  alt="Back"
                  className="md:w-11 md:h-11 w-6 h-6"
                />
                <div className="block">
                  <div className="whitespace-nowrap font-semibold text-[#717073] text-[14px]">Total Payments</div>
                  <div className="text-[20px] font-semibold text-[#384455]">£0.00</div>
                </div>
              </div>

              <div className="flex gap-4  items-center    p-2 rounded-xl flex-wrap bg-white">
                <img
                  src="/images/filterGray.png"
                  alt="Back"
                  className=""
                />
                <div className="block  pr-3">
                  <div className="whitespace-nowrap font-semibold text-[#717073] text-[16px]">Filters</div>
                </div>
              </div>
              <button
                className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px]  font-semibold"
              >
                <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
                Add booking
              </button>
            </div>
          )}
        </div>
        {activeTab === "Service History" && (
          <ServiceHistory
            serviceHistory={serviceHistory}
            labels={{
              header: serviceHistory.serviceType,
              membershipPlan: "Membership Plan ",
              students: "Students",
              venue: "  Venue",
               bookingId: serviceHistory?.payments?.[0]?.paymentType == "accesspaysuite"
                ? "Accesspaysuite"
                : "KGoCardless ID",
              price: "Monthly Price",
              dateOfBooking: "Date of  Booking ",
              progress: "Progress",
              bookingSource: "Booking Source",
              buttons: ["See details", "Credits", "Attendance", "See Payments"],
            }}
            comesFrom={'cancellation'}
          />
        )}
        {activeTab === "Parent Profile" && <ParentProfile ParentProfile={serviceHistory} />}
        {activeTab === "Student Profile" && <StudentProfile StudentProfile={serviceHistory} />}
        {activeTab === "Feedback" && <Feedback profile={serviceHistory} />}
      </div>
    </>
  )
}

export default AccountInfoCancellation