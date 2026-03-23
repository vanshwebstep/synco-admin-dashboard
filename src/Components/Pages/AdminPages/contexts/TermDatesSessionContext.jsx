import { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError } from "../../../../utils/swalHelper";
import { useNavigate } from 'react-router-dom';

const TermDatesSessionContext = createContext();

export const TermDatesSessionProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const [termGroup, setTermGroup] = useState([]);
  const [termData, setTermData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedTermGroup, setSelectedTermGroup] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [myGroupData, setMyGroupData] = useState(null);


  // Fetch all termGroup
  const fetchTermGroup = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/term-group/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setTermGroup(result.data || []);
    } catch (err) {
      console.error("Failed to fetch termGroup:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTerm = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/term/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setTermData(result.data || []);
    } catch (err) {
      console.error("Failed to fetch termGroup:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createTermGroup = useCallback(
    async (formdata, shouldRedirect = false) => {
      if (!token) return;

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", `Bearer ${token}`);

      const raw = JSON.stringify(formdata);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      try {

        const response = await fetch(`${API_BASE_URL}/api/admin/term-group`, requestOptions);
        const data = await response.json();
        setMyGroupData(data.data);

        console.log("data", data.data);

        if (response.ok && data.status === true) {
          // await Swal.fire({
          //   icon: 'success',
          //   title: 'Success',
          //   text: data.message || 'Group created successfully.',
          //   confirmButtonColor: '#237FEA'
          // });


        } else {
          console.error("API Error:", data.message || "Unknown error");
        }
      } catch (err) {
        console.error("Failed to create session group:", err);
      } finally {
      }
    },
    [token, navigate]
  );



  const createTerms = useCallback(
    async (formdata, shouldRedirect = false) => {
      if (!token) return;

      try {
        setLoading(true);

        const fd = new FormData();

        for (const key in formdata) {
          if (key === "levels") continue;
          if (formdata[key] instanceof File || typeof formdata[key] === "string") {
            fd.append(key, formdata[key]);
          }
        }

        fd.append("levels", JSON.stringify(formdata.levels));

        const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-group/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        });

        const data = await response.json();

        if (response.ok && data.status === true) {
          // ✅ Only redirect on final submission
          if (shouldRedirect) {
            navigate('/configuration/weekly-classes/term-dates/list');
          }
        } else {
          console.error("API Error:", data.message || "Unknown error");
        }
      } catch (err) {
        console.error("Failed to create session group:", err);
      } finally {
        setLoading(false);
      }
    },
    [token, navigate]
  );


  const fetchExercises = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setExercises(result.data || []);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  const createSessionExercise = useCallback(async (data, file) => {
    if (!token) return;

    try {
      const formdata = new FormData();
      formdata.append("title", data.title);
      formdata.append("description", data.description);
      formdata.append("duration", data.duration);
      console.log('formdatahh', formdata)
      if (file) formdata.append("image", file);

      await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // No "Content-Type", browser sets it automatically with boundary
        },
        body: formdata,
      });
      console.log('doneeee')
      await fetchExercises(); // optional if refreshing UI
    } catch (err) {
      console.error("Failed to create exercise:", err);
    }
  }, [token, fetchExercises]);
  const fetchExerciseById = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setSelectedExercise(result.data || null);
    } catch (err) {
      console.error("Failed to fetch group:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  // Fetch single discount


  const fetchTermGroupById = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/term-group/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setSelectedTermGroup(result.data || null);
    } catch (err) {
      console.error("Failed to fetch discount:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  const fetchTermById = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/term/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setSelectedTerm(result.data || null);
    } catch (err) {
      console.error("Failed to fetch discount:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create discount
  const createDiscount = useCallback(async (data) => {
    if (!token) return;

    setLoading(true); // Start loading

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/discount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Something went wrong");
      }

      await fetchTermGroup();

      await showSuccess("Success!", result.message || "Discount created successfully.");

      navigate('/holiday-camps/termGroup/list');
    } catch (err) {
      showError("Failed to Create Discount", err.message || "An unexpected error occurred.");

      console.error("Failed to create discount:", err);
    } finally {
      setLoading(false); // Stop loading regardless of success or error
    }
  }, [token, fetchTermGroup, navigate]);


  const updateTermGroup = useCallback(
    async (id, data) => {
      if (!token) return;

      try {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${token}`);

        const response = await fetch(`${API_BASE_URL}/api/admin/term-group/${id}`, {
          method: "PUT",
          headers: myHeaders,
          body: JSON.stringify(data),
        });

        const result = await response.json();

        await fetchTermGroup();
      } catch (err) {
        console.error("Failed to update term group:", err);
      }
    },
    [token, fetchTermGroup, navigate]
  );


  // Delete discount
  const deleteTermGroup = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/admin/term-group/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTermGroup();
      await fetchTerm();
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }finally{
      setLoading(false);
    }
  }, [token, fetchTermGroup]);


  const deleteSessionlevel = useCallback(async (id, level) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/session-plan-group/${id}/level/${level}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },

      });
      await fetchTermGroup();
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }
  }, [token, fetchTermGroup]);


  return (
    <TermDatesSessionContext.Provider
      value={{
        // termGroup
        termGroup,
        setTermGroup,
        loading,
        createTermGroup,
        createSessionExercise,
        selectedTermGroup,
        selectedTerm,
        fetchTermGroup,
        fetchTermGroupById,
        fetchTermById,
        createDiscount,
        updateTermGroup,
        setSelectedTermGroup,
        setSelectedTerm,
        deleteTermGroup,

        selectedExercise,
        setSelectedExercise,
        exercises,
        myGroupData,
        setMyGroupData,
        fetchTerm,
        termData,
        setExercises,
        fetchExerciseById,
        deleteSessionlevel,
        fetchExercises,
      }}
    >
      {children}
    </TermDatesSessionContext.Provider>
  );
};

export const useTermContext = () => useContext(TermDatesSessionContext);
