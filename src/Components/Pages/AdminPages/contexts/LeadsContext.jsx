import React, { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError } from "../../../../utils/swalHelper";
// import Facebook from "../one-to-one/leads/Facebook";
import Facebook from "../weekly-classes/leads/Facebook";
const LeadsContext = createContext();

export const LeadsContextProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const tabs = [
    { name: "Facebook", component: <Facebook /> },
    { name: "Referral", component: <Facebook /> },
    { name: "All other leads", component: <Facebook /> },
    { name: "All", component: <Facebook /> },
  ];
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const [data, setData] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("adminToken");

  const fetchData = useCallback(
    async (params = {}) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      setLoading(true);

      const {
        studentName,
        venueName,
        filterTypes = [],
        fromDate,
        toDate,
      } = params;

      const searchParams = new URLSearchParams();

      if (studentName) searchParams.append("studentName", studentName);
      if (venueName) searchParams.append("venueName", venueName);

      filterTypes.forEach((ft) => searchParams.append("filterType", ft));

      if (fromDate) searchParams.append("fromDate", fromDate);
      if (toDate) searchParams.append("toDate", toDate);

      const query = searchParams.toString();

      const tabEndpoints = {
        Facebook: "facebook",
        Referral: "referall",
        "All other leads": "allOthers",
        All: "all",
      };

      const activeTabData = tabEndpoints[activeTab] || "all";

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/lead/${activeTabData}${query ? `?${query}` : ""
          }`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const resultRaw = await response.json();

        if (!response.ok || !resultRaw.status) {
          showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching lead data.");
          return;
        }

        setData(resultRaw.data || []);
        setAnalytics(resultRaw.analytics || []);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
        showError("Fetch Failed", error.message || "Something went wrong while fetching data.");
      } finally {
        setLoading(false);
      }
    },
    [API_BASE_URL, activeTab]
  );
  const sendleadsMail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/lead/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      // navigate(`/weekly-classes/all-members/list`);

      await fetchData();
      setLoading(false);
    }
  };
  const fetchDataById = useCallback(async (params = {}) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    const { studentName, venueName, filterTypes = [], fromDate, toDate } = params;

    // build query params
    const searchParams = new URLSearchParams();

    if (studentName) searchParams.append("studentName", studentName);
    if (venueName) searchParams.append("venueName", venueName);

    // support multiple filterTypes
    filterTypes.forEach((ft) => searchParams.append("filterType", ft));

    if (fromDate) searchParams.append("fromDate", fromDate);
    if (toDate) searchParams.append("toDate", toDate);

    const query = searchParams.toString();

    // ✅ Simplified mapping for active tab endpoint
    const tabEndpoints = {
      Facebook: "facebook",
      Referral: "referall",
      "All other leads": "allOthers",
      All: "all",
    };

    const activeTabData = tabEndpoints[activeTab] || "all";

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/lead/${activeTabData}${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resultRaw = await response.json();

      if (!response.ok || !resultRaw.status) {
        showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching lead data.");
        return;
      }

      setData(resultRaw.data || []);
      setAnalytics(resultRaw.analytics || []);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      showError("Fetch Failed", error.message || "Something went wrong while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, activeTab]);

  return (
    <LeadsContext.Provider
      value={{
        data,
        analytics,
        activeTab,
        setActiveTab,
        setAnalytics,
        setSelectedBookingIds,
        selectedBookingIds,
        fetchData,
        setData,
        loading,
        setLoading,
        selectedUserIds,
        setSelectedUserIds,
        tabs,
        currentPage,
        setCurrentPage,
        sendleadsMail,
        selectedVenue,
        setSearchTerm,
        searchTerm,
        setSelectedVenue,
        fetchDataById
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
};

// ✅ Custom hook for usage
export const useLeads = () => useContext(LeadsContext);
