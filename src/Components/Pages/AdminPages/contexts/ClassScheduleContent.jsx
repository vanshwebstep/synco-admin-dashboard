import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { showSuccess,showError,showConfirm } from "../../../../utils/swalHelper";

const ClassScheduleContext = createContext();

export const ClassScheduleProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [classSchedules, setClassSchedules] = useState([]);
  const token = localStorage.getItem("adminToken");

  const [loading, setLoading] = useState(false);
  const [isEditClassSchedule, setIsEditClassSchedule] = useState(false);
  const [singleClassSchedules, setSingleClassSchedules] = useState([]);
  const [singleClassSchedulesOnly, setSingleClassSchedulesOnly] = useState([]);
  const [cancelledClassData, setCancelledClassData] = useState([]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    area: "",
    name: "",
    address: "",
    facility: "",
    parking: false,
    congestion: false,
    parkingNote: "",
    entryNote: "",
  });

  const fetchClassSchedules = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/class-schedule`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setClassSchedules(result);
    } catch (error) {
      console.error("Failed to fetch classSchedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassSchedulesID = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/venue/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setSingleClassSchedules(result);
    } catch (error) {
      console.error("Failed to fetch classSchedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchHolidayClassesbyId = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/find-class/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setSingleClassSchedulesOnly(result);
    } catch (error) {
      console.error("Failed to fetch classSchedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassSchedulesByID = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/class-schedule/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setSingleClassSchedulesOnly(result);
    } catch (error) {
      console.error("Failed to fetch classSchedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchFindClassID = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/find-class/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setSingleClassSchedulesOnly(result);
    } catch (error) {
      console.error("Failed to fetch classSchedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const createClassSchedules = async (classScheduleData) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/class-schedule`, {
        method: "POST",
        headers,
        body: JSON.stringify(classScheduleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create class schedule");
      }
      await fetchClassSchedules();
      await showSuccess('Success!', result.message || 'Class schedule has been created successfully.');


      return result;
    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError('Error', error.message || "Something went wrong while creating class schedule.");
      setLoading(false);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // UPDATE VENUE
const updateClassSchedules = async (classScheduleId, updatedClassScheduleData) => {
  setLoading(true);

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  if (token) {
    myHeaders.append("Authorization", `Bearer ${token}`);
  }

  const requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: JSON.stringify(updatedClassScheduleData),
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/class-schedule/${classScheduleId}`,
      requestOptions
    );

    // Safely parse response (JSON or text)
    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    // ❌ If response not ok → show error
    if (!response.ok) {
      const errorMessage =
        data?.message ||
        (typeof data === "string" ? data : null) ||
        "Failed to update class schedule";

      await showError("Error", errorMessage);
      throw new Error(errorMessage);
    }

    // ✅ Success
    await fetchClassSchedules();
    await showSuccess(
      "Success!",
      data?.message || "Class schedule has been updated successfully."
    );

    return data;

  } catch (error) {
    console.error("Error updating classSchedule:", error);

    await showError(
      "Error",
      error.message || error.error || "Something went wrong while updating class schedule."
    );

    throw error;
  } finally {
    setLoading(false);
  }
};



  const deleteClassSchedule = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/class-schedule/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete classSchedule");
      }

      await fetchClassSchedules(); // Refresh the list
      await showSuccess('Success!', data.message || "Class Schedule deleted successfully");


    } catch (err) {
      console.error("Failed to delete classSchedule:", err);
      await showError('Error', err.message || "Something went wrong while deleting classSchedule");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [token, fetchClassSchedules]);
  const cancelClass = async (classScheduleId, sessionId, updatedClassScheduleData, venueId) => {
    console.log('classScheduleId, sessionId,updatedClassScheduleData', classScheduleId, sessionId, updatedClassScheduleData)
    setLoading(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    if (token) {
      myHeaders.append("Authorization", `Bearer ${token}`);
    }


    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(updatedClassScheduleData),
      redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancel-session/${classScheduleId}/cancel?mapId=${sessionId}`, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update classSchedule");
      }

      const result = await response.json();
      await showSuccess('Success!', result.message || 'ClassSchedule has been cancelled successfully.');


      return result;
    } catch (error) {
      console.error("Error updating classSchedule:", error);
      await showError('Error', error.message || "Something went wrong while updating classSchedule?.");

      throw error;
    } finally {
      await fetchClassSchedules();
      navigate(`/configuration/weekly-classes/venues/class-schedule?id=${venueId}`)
      setLoading(false);
    }
  };

  const fetchCancelledClass = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancel-session/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setCancelledClassData(result);
    } catch (error) {
      console.error("Failed to fetch classSchedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ClassScheduleContext.Provider
      value={{
        classSchedules,
        createClassSchedules,
        updateClassSchedules,
        deleteClassSchedule,
        fetchClassSchedulesID,
        fetchHolidayClassesbyId,
        fetchCancelledClass,
        fetchClassSchedulesByID,
        fetchFindClassID,
        singleClassSchedules,
        formData,
        singleClassSchedulesOnly,
        setFormData,
        isEditClassSchedule,
        setIsEditClassSchedule,
        setClassSchedules,
        fetchClassSchedules,
        loading,
        cancelClass,
      }}>
      {children}
    </ClassScheduleContext.Provider>
  );
};

export const useClassSchedule = () => useContext(ClassScheduleContext);
