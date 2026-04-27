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
import { useBookFreeTrial } from '../../../../contexts/BookAFreeTrialContext';
import ServiceHistory from "../../../../Common/serviceHistory";
import StudentProfile from "./StudentProfile";
import Loader from "../../../../contexts/Loader";
import Feedback from "./Feedback";
import axios from "axios";
import { showConfirm, showSuccess, showError } from "../../../../../../../utils/swalHelper";
import { Trash2 } from "lucide-react";

const list = () => {
  const { serviceHistoryFetchById, serviceHistory, loading } = useBookFreeTrial();

  console.log('serviceHistory', serviceHistory)

  const navigate = useNavigate();
  const location = useLocation();
  const [itemId, setItemId] = useState(null);
  useEffect(() => {
    if (location.state?.itemId) {
      setItemId(location.state.itemId);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      if (itemId) {
        await serviceHistoryFetchById(itemId);
      }
    };
    fetchData();
  }, [itemId, serviceHistoryFetchById]);
  const [activeTab, setActiveTab] = useState("Parent Profile");
  console.log('serviceHistory', serviceHistory)

  const handleDelete = async () => {
    const result = await showConfirm(
      "Are you sure?",
      "Are you sure you want to remove this account from Synco?",
      "Yes"
    );

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("adminToken");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/delete`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: {
            bookingIds: [itemId],
          },
        }
      );

      showSuccess("Deleted!", "Account removed successfully.");
      navigate('/weekly-classes/trial/list');
    } catch (err) {
      console.error(err);
      showError("Error", err?.response?.data?.message || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }

  return (
    <>
      <div className="relative ">

        <div className="flex justify-between items-center mb-5 w-full">
          <div className=" flex items-center gap-2 md:gap-3">
            <h2 onClick={() => {
              navigate('/weekly-classes/trial/list');
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
          
          <div className="flex items-center gap-2 md:gap-3">
          {activeTab === "Service History" && (
            <>
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
                onClick={() => {
                  navigate('/weekly-classes/find-a-class');
                }}
                className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px]  font-semibold"
              >
                <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
                Add booking
              </button>
            </>
          )}

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-semibold"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
          </div>
        </div>
        {activeTab === "Service History" && <ServiceHistory
          serviceHistory={serviceHistory}
          labels={{
            header: `${serviceHistory.serviceType}`,
            dateOfTrial: "Date of Trial ",
            students: "Students",
            venue: "  Venue",
            bookingId: "ID",
            price: "Monthly Price",
            dateOfBooking: "Date of  Booking ",
            progress: "Progress",
            trialAttempt: "Trial Attempt",
            bookingSource: "Booking Source",
            buttons: ["See details", "Attendance"],
          }}
          comesFrom={'freeTrial'}
        />}
        {activeTab === "Student Profile" && <StudentProfile StudentProfile={serviceHistory} />}
        {activeTab === "Parent Profile" && <ParentProfile ParentProfile={serviceHistory} />}
        {activeTab === "Feedback" && (
          <Feedback profile={serviceHistory} />
        )}
      </div>
    </>
  )
}

export default list