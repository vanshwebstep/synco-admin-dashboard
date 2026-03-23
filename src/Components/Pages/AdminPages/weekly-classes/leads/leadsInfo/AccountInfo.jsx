import React, { useEffect, useState, useCallback } from "react";
import ParentProfile from "./ParentProfile";
import StudentProfile from "./StudentProfile";
import ServiceHistory from "./ServiceHistory";
import Feedback from "./Feedback";
import Rewards from "./Rewards";
import Events from "./Events";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../../../contexts/Loader";
import { showError } from "../../../../../../utils/swalHelper";
import { useLeads } from "../../../contexts/LeadsContext";

const tabs = [
  { name: "Parent Profile", component: ParentProfile },
  { name: "Student Profile", component: StudentProfile },
  { name: "Service History", component: ServiceHistory },
  { name: "Feedback", component: Feedback },
  { name: "Rewards", component: Rewards },
  { name: "Events", component: Events },
];

const AccountInfo = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const location = useLocation();
  const navigate = useNavigate();

  // ---- Get lead ID from query ----
  const queryParams = new URLSearchParams(location.search);
  const leadId = queryParams.get("id");

  const leads = useLeads();
  const { fetchDataById } = leads;
  const [loading, setLoading] = useState(false);

  const [leadData, setLeadData] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    postalCode: "",
    childAge: "",
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ---- Fetch by ID ----
  const fetchLeadById = useCallback(
    async (leadId) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return null;

      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/lead/${leadId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch lead");
        }

        const result = await response.json();

        const mapped = {
          firstName: result?.data?.firstName || "",
          lastName: result?.data?.lastName || "",
          email: result?.data?.email || "",
          mobile: result?.data?.phone || "",
          postalCode: result?.data?.postcode || "",
          childAge: result?.data?.childAge || "",
        };

        setLeadData(result?.data);
        setFormData(mapped);

        setLoading(false);
        return result?.data || null;
      } catch (error) {
        console.error("Failed to fetch lead:", error);

        showError("Error", error.message || "Failed to fetch lead.");

        setLoading(false);
        return null;
      }
    },
    [API_BASE_URL]
  );

  // ---- Initial data load ----
  useEffect(() => {
    if (!leadId) return;

    (async () => {
      try {
        setLoading(true);
        await fetchDataById(leadId);
        await fetchLeadById(leadId);
      } catch (error) {
        console.error("Error loading lead data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchDataById, fetchLeadById, leadId]);

  if (loading) return <Loader />;
  if (!leads) return <div>Loading...</div>;

  // ---- Render correct active tab component ----
  const ActiveComponent = tabs.find((t) => t.name === activeTab)?.component;

  return (
    <div className="mt-8 relative">
      {/* TABS HEADER */}
      <div className="flex w-max items-center bg-white gap-1 rounded-2xl p-3">
        <h2
          onClick={() => navigate("/weekly-classes/central-leads")}
          className="cursor-pointer"
        >
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
            className={`w-max relative flex-1 whitespace-nowrap px-4 text-[16px] font-semibold py-3 rounded-xl transition-all ${activeTab === tab.name
                ? "bg-[#237FEA] shadow text-white"
                : "text-[#282829] hover:text-[#282829]"
              }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div className="mt-6">
        {ActiveComponent && (
          <ActiveComponent
            leadData={leadData}
            fetchedformData={formData}
            setFormData={setFormData}
          />
        )}
      </div>
    </div>
  );
};

export default AccountInfo;
