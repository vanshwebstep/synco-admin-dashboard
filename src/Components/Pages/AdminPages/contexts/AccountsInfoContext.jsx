import React, { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError, showLoading } from "../../../../utils/swalHelper";
const AccountsInfoContext = createContext();

export const AccountsInfoProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [oneToOneData, setOneToOneData] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState([]);
  const [emergency, setEmergency] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);

  const [loading, setLoading] = useState(null);
  const [mailLoading, setMailLoading] = useState(null);

  const [mainId, setMainId] = useState('');
  const token = localStorage.getItem("adminToken");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [historyActiveTab, setHistoryActiveTab] = useState('General');

  const handleUpdate = async (title, mainData) => {
    if (!token) {
      return showError("Error", "Token not found. Please login again.");
    }

    try {
      

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      let raw = {};

      if (title === "students") {
        raw = { student: mainData };
      } else if (title === "parents") {
        raw = { parentDetails: mainData };
      } else if (title === "emergency") {
        raw = { emergencyDetails: mainData };
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/one-to-one/booking/update/${oneToOneData?.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(raw),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Something went wrong");
      }

      const result = await response.json();

      await showSuccess(
        "Updated!",
        `${result?.message || 'Student information has been successfully updated.'}`
      );

      fetchOneToOneMembers(oneToOneData?.id);

      return result;
    } catch (error) {
      await showError("Failed!", error.message || "Something went wrong while updating.");
    }
  };


  const handleUpdateAccountInfo = async (title, mainData) => {
    if (!token) return showError("Error", "Token not found. Please login again.");

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);
    let raw;
    if (title === "students") {
      raw = JSON.stringify({
        bookingTrialId: data.id,
        'students': mainData,
      });

    }
    if (title === "parents") {
      raw = JSON.stringify({
        bookingTrialId: data.id,

        'parents': mainData,
      });

    }
    if (title === "emergency") {
      raw = JSON.stringify({
        bookingTrialId: data.id,
        'emergency': mainData,
      });

    }


    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {

      const response = await fetch(`${API_BASE_URL}/api/admin/account-information/${mainId}`, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Something went wrong");
      }

      const result = await response.json();


      // Show success
      await showSuccess("Updated!", "Information has been successfully updated.");

      fetchMembers(mainId);
      console.log("Update Result:", result);
      return result;
    } catch (error) {
      await showError("Failed!", error.message || "Something went wrong while updating.");
    }
  };
  const handleUpdateBirthday = async (title, mainData) => {

    if (!token) return showError("Error", "Token not found. Please login again.");
    console.log('mainData', mainData)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);
    let raw;
    if (title === "students") {
      raw = JSON.stringify({
        'student': mainData,
      });

    }
    if (title === "parents") {
      raw = JSON.stringify({

        'parentDetails': mainData,
      });

    }
    if (title === "emergency") {
      raw = JSON.stringify({
        'emergencyDetails': mainData,
      });

    }


    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
     

      const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/booking/update/${data.id}`, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Something went wrong");
      }

      const result = await response.json();


      // Show success
      await showSuccess("Updated!", "Information has been successfully updated.");

      fetchBirthdyPartiesMembers(data.id);
      return result;
    } catch (error) {
      await showError("Failed!", error.message || "Something went wrong while updating.");
    }
  };
  const handleUpdateHoliday = async (title, mainData) => {

    if (!token) return showError("Error", "Token not found. Please login again.");
    console.log('mainData', mainData)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);
    let raw;
    if (title === "students") {
      raw = JSON.stringify({
        'students': mainData,
      });

    }
    if (title === "parents") {
      raw = JSON.stringify({

        'parents': mainData,
      });

    }
    if (title === "emergencyContacts") {
      raw = JSON.stringify({
        'emergencyContacts': mainData,
      });

    }


    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
    

      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/booking/update/${data.id}`, requestOptions);

      if (!response.ok) {
        let errorJson;
        try {
          errorJson = await response.json();
        } catch {
          throw new Error("Something went wrong");
        }
        throw new Error(errorJson.message || "Something went wrong");
      }


      const result = await response.json();


      // Show success
      await showSuccess("Updated!", "Information has been successfully updated.");

      fetchHolidayCamps(data.id);
      return result;
    } catch (error) {
      await showError("Failed!", error.message || "Something went wrong while updating.");
    }
  };
  const mapServiceType = (serviceType) => {
    if (!serviceType || serviceType === "membership") return null;

    const map = {
      birthdayParty: "birthday party",
      oneToOne: "one to one",
      holidayCamps: "holiday camp",
      trials: "trials",
    };

    return map[serviceType] || null;
  };
  const fetchMembers = useCallback(
    async (id, serviceType) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      setLoading(true);

      try {
        const mappedServiceType = mapServiceType(serviceType);

        // ✅ build body conditionally
        const body = mappedServiceType
          ? JSON.stringify({ serviceType: mappedServiceType })
          : null;

        const response = await fetch(
          `${API_BASE_URL}/api/admin/account-information/${id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              ...(mappedServiceType && {
                "Content-Type": "application/json",
              }),
            },
            body, // ✅ only sent if allowed & mapped
          }
        );

        const resultRaw = await response.json();

        if (!resultRaw.status) {
          await showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching account information.");
          return;
        }
        const isBookingBasedService = (serviceType) => {
          return ["oneToOne", "birthdayParty"].includes(serviceType);
        };
        const result = resultRaw || {};
        const studentsData = isBookingBasedService(serviceType)
          ? result.data?.booking?.students || []
          : result.data?.students || [];

        const parentformData = isBookingBasedService(serviceType)
          ? result.data?.booking?.parents || []
          : result.data?.parents || [];
        const emergencyData = isBookingBasedService(serviceType)
          ? result.data?.booking?.emergency?.[0] || []
          : result.data?.emergency?.[0] ||
          result.data?.emergencyContacts?.[0] ||
          [];
        const dataData = isBookingBasedService(serviceType)
          ? result.data || []
          : result.data || [];
        setData(dataData);
        setStudents(studentsData);
        setFormData(parentformData);
        setEmergency(emergencyData);
      } catch (error) {
        console.error("Failed to fetch members:", error);

        await showError("Fetch Failed", error.message || "Something went wrong while fetching account information.");
      } finally {
        setLoading(false);
      }
    },
    [API_BASE_URL]
  );
  const fetchOneToOneMembers = useCallback(async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/one-to-one/leads/list/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resultRaw = await response.json();

      // Check API response status
      if (!resultRaw.status) {
        await showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching account information.");
        return; // Stop further execution
      }

      const result = resultRaw.data || [];

      console.log('result', result)

      setOneToOneData(result || []);
      setStudents(result?.booking?.students || []);
      setFormData(result?.booking?.parents || []);
      setEmergency(result?.booking?.emergency || []);

    } catch (error) {
      console.error("Failed to fetch members:", error);

      await showError("Fetch Failed", error.message || "Something went wrong while fetching account information.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);
  const fetchBirthdyPartiesMembers = useCallback(async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/leads/list/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resultRaw = await response.json();

      // Check API response status
      if (!resultRaw.status) {
        await showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching account information.");
        return; // Stop further execution
      }

      const result = resultRaw.data || [];

      setData(result || []);

      setStudents(result?.booking?.students || []);
      setFormData(result?.booking?.parents || []);
      setEmergency(result?.booking?.emergency || []);

    } catch (error) {
      console.error("Failed to fetch members:", error);

      await showError("Fetch Failed", error.message || "Something went wrong while fetching account information.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);
  const fetchHolidayCamps = useCallback(async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/booking/listBy/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resultRaw = await response.json();

      // Check API response status
      if (!resultRaw?.status) {
        await showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching account information.");
        return; // Stop further execution
      }

      const result = resultRaw.data || [];
      setData(result || []);
      setStudents(result?.students || []);
      setFormData(result?.parents || []);
      setEmergency(result?.emergencyContacts[0] || []);

    } catch (error) {
      console.error("Failed to fetch members:", error);

      await showError("Fetch Failed", error.message || "Something went wrong while fetching account information.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);
  const sendOnetoOneMail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/one-to-one/leads/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          leadIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      await showSuccess("Success!", result.message || "Email has been sent successfully.");

      return result;

    } catch (error) {
      console.error("Error sending email:", error);
      await showError("Error", error.message || "Something went wrong while sending email.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const sendBirthdayMail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/leads/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          leadIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      await showSuccess("Success!", result.message || "Email has been sent successfully.");

      return result;

    } catch (error) {
      console.error("Error sending email:", error);
      await showError("Error", error.message || "Something went wrong while sending email.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const sendHolidayMail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/leads/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          leadIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      await showSuccess("Success!", result.message || "Email has been sent successfully.");

      return result;

    } catch (error) {
      console.error("Error sending email:", error);
      await showError("Error", error.message || "Something went wrong while sending email.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback/list`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resultRaw = await response.json();

      if (!resultRaw?.status) {
        await showError(
          "Fetch Failed",
          resultRaw.message || "Something went wrong while fetching Feedback."
        );
        return;
      }

      setFeedbackData(resultRaw.data || []);
    } catch (error) {
      await showError(
        "Fetch Failed",
        error.message || "Something went wrong while fetching feedback."
      );
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);



  return (
    <AccountsInfoContext.Provider value={{ data, sendHolidayMail, handleUpdateHoliday, fetchHolidayCamps, oneToOneData, historyActiveTab, setHistoryActiveTab, handleUpdateAccountInfo, sendOnetoOneMail, sendBirthdayMail, handleUpdateBirthday, fetchBirthdyPartiesMembers, fetchMembers, fetchOneToOneMembers, setData, students, setStudents, loading, setLoading, formData, setFormData, emergency, setEmergency, handleUpdate, mainId, setMainId, fetchFeedback, feedbackData, setFeedbackData }}>
      {children}
    </AccountsInfoContext.Provider>
  );
};

// Custom hook for easy usage
export const useAccountsInfo = () => useContext(AccountsInfoContext);
