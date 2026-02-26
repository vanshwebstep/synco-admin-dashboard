import { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError } from "../../../../utils/swalHelper";
import { useNavigate } from 'react-router-dom';

const SessionPlanContext = createContext();

export const SessionPlanContextProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const [uploadProgress, setUploadProgress] = useState(0);
  const resetProgress = () => setUploadProgress(0);

  const [sessionGroup, setSessionGroup] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);

  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);


  // Fetch all sessionGroup
  const fetchSessionGroup = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-group`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      console.log('result', result)
      setSessionGroup(result.data || []);
    } catch (err) {
      console.error("Failed to fetch sessionGroup:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  const createSessionGroup = useCallback(
    async (formdata, shouldRedirect = false) => {
      if (!token) return;
      setProgressLoading(true);

      // setLoading(true);
      setUploadProgress(0);

      try {
        const fd = new FormData();

        // Append all keys except "levels"
        for (const key in formdata) {
          if (key === "levels") continue;

          const value = formdata[key];

          if (value instanceof File || value instanceof Blob) {
            const fileName = value instanceof File ? value.name : `${key}.mp4`;
            fd.append(key, value, fileName);
          } else if (typeof value === "string") {
            fd.append(key, value);
          }
        }

        fd.append("levels", JSON.stringify(formdata.levels));

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.open("POST", `${API_BASE_URL}/api/admin/session-plan-group`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);

          // 🔵 Upload progress
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
            }
          };

          xhr.onload = () => {
            const res = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && res.status) {
              resolve(res);
            } else {
              reject(res);
            }
          };

          xhr.onerror = () => reject("Upload failed");

          xhr.send(fd);
        });

        await showSuccess("Success!", "Group created successfully.");

        if (shouldRedirect) {
          navigate("/configuration/weekly-classes/session-plan-list");
        }

      } catch (err) {
        console.error(err);
        await showError("Error", err.message || "Upload failed");
      } finally {
        setProgressLoading(false);
        resetProgress();
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

  const createSessionExercise = useCallback(async (data) => {
    if (!token) return;

    try {
      const formdata = new FormData();
      formdata.append("title", data.title);
      formdata.append("description", data.description);
      formdata.append("duration", data.duration);

      if (Array.isArray(data.images)) {
        data.images.forEach((file) => {
          formdata.append("images", file); // backend expects "images"
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formdata,
      });

      // Check for HTTP errors
      const result = await response.json();

      if (!response.ok) {
        // Throw object for frontend to catch
        throw result;
      }

      console.log("✅ Exercise created");
      await fetchExercises();

      return result; // return response if needed
    } catch (err) {
      console.error("❌ Failed to create exercise:", err);
      throw err; // re-throw so caller can show dynamic alert
    }
  }, [token, fetchExercises]);
  const updateSessionExercise = useCallback(async (id, data) => {
    if (!token) return;

    try {
      const formdata = new FormData();
      formdata.append("title", data.title);
      formdata.append("description", data.description);
      formdata.append("duration", data.duration);


      // ✅ send new uploaded files
      if (Array.isArray(data.newImages) && data.newImages.length > 0) {
        data.newImages.forEach((file) => {
          if (file instanceof File) {
            formdata.append("images", file);
          }
        });
      }
      if (Array.isArray(data.removedImages) && data.removedImages.length > 0) {
        formdata.append("removedImages", JSON.stringify(data.removedImages));
      }
      const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formdata,
      });

      const result = await response.json();

      if (!response.ok) throw result;

      console.log("✅ Exercise updated");

      return result;
    } catch (err) {
      console.error("❌ Failed to update exercise:", err);
      throw err;
    }
  }, [token, fetchExercises]);

  const duplicatePlan = useCallback(async (id) => {
    if (!token) return;
    setLoading(true); // Start loading
    try {
      await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchExercises();
    } catch (err) {
      setLoading(false); // Start loading
      console.error("Failed :", err);
    }
  }, [token, fetchExercises]);

  const deleteExercise = useCallback(async (id) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchExercises();
    } catch (err) {
      console.error("Failed to delete Exercise:", err);
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
      const data = result.data || null;

      setSelectedExercise(result.data || null);
      return data;
    } catch (err) {
      console.error("Failed to fetch group:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  // Fetch single discount


  const fetchGroupById = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-group/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setSelectedGroup(result.data || null);
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

      await fetchSessionGroup();

      await showSuccess("Success!", result.message || "Discount created successfully.");

      navigate('/weekly-classes/sessionGroup/list');
    } catch (err) {
      showError("Failed to Create Discount", err.message || "An unexpected error occurred.");

      console.error("Failed to create discount:", err);
    } finally {
      setLoading(false); // Stop loading regardless of success or error
    }
  }, [token, fetchSessionGroup, navigate]);


  // Update discount
  const updateDiscount = useCallback(async (id, data) => {
    if (!token) return;

    setLoading(true); // 🔵 Start loading

    try {
      const formdata = new FormData();

      const appendMedia = (key, file) => {
        if (file && typeof file !== "string") {
          const fileName =
            file instanceof File
              ? file.name
              : `${key}.${file.type === "audio/webm" ? "webm" : "mp3"}`;
          formdata.append(key, file, fileName);
        }
      };

      // Append media files
      appendMedia("banner", data.banner);
      appendMedia("banner_file", data.banner_file);
      appendMedia("video_file", data.video_file);
      appendMedia("video", data.video);

      appendMedia("beginner_video", data.beginner_video);
      appendMedia("beginner_banner", data.beginner_banner);

      appendMedia("intermediate_video", data.intermediate_video);
      appendMedia("intermediate_banner", data.intermediate_banner);

      appendMedia("advanced_video", data.advanced_video);
      appendMedia("advanced_banner", data.advanced_banner);
      appendMedia("pro_video", data.pro_video);
      appendMedia("pro_banner", data.pro_banner);

      // 🔊 Append audio files dynamically (beginner_recording, intermediate_recording, etc.)
      Object.keys(data).forEach((key) => {
        if (key.endsWith("_upload")) {
          appendMedia(key, data[key]);
        }
      });

      // Append levels JSON
      if (data.levels) {
        formdata.append("levels", JSON.stringify(data.levels));
      }

      if (data.groupName) {
        formdata.append("groupName", data.groupName);
      }

      if (data.player) {
        formdata.append("player", data.player);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-group/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formdata,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to update");

      await showSuccess("Success!", result.message || "Level updated successfully.");

      navigate("/configuration/weekly-classes/session-plan-list");
      await fetchSessionGroup();
    } catch (err) {
      console.error("Failed to update discount:", err);
      await showError("Error", err.message || "Something went wrong.");
    } finally {
      setLoading(false); // 🔵 End loading
    }
  }, [token, fetchSessionGroup, navigate, setLoading]);



  // Delete discount
 const deleteSessionGroup = useCallback(async (id) => {
   if (!token) {
     showError("Authentication token missing.");
     return;
   }
 setLoading(true);
   try {
 
     const response = await fetch(
       `${API_BASE_URL}/api/admin/session-plan-group/${id}`,
       {
         method: "DELETE",
         headers: {
           Authorization: `Bearer ${token}`,
         },
       }
     );
 
     const data = await response.json();
 
     if (!response.ok) {
       throw new Error(data?.message || "Failed to delete session group.");
     }
 
     // Refresh list
     showSuccess(data?.message || "Session group deleted successfully.")
     await fetchSessionGroup();
 
   } catch (err) {
     console.error("Failed to delete session group:", err);
     showError(err.message || "Something went wrong.");
   }finally{
    setLoading(false)
   }
 }, [token, fetchSessionGroup]);
 
  //duplicate  
  const duplicateSession = useCallback(async (id) => {
    if (!token) return;
    setLoading(true); // Start loading
    try {
      await fetch(`${API_BASE_URL}/api/admin/session-plan-group/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSessionGroup();
    } catch (err) {
      setLoading(false); // Start loading
      console.error("Failed to delete discount:", err);
    }
  }, [token, fetchSessionGroup]);



 const deleteSessionlevel = useCallback(async (id, level) => {
  if (!token) {
    showError("Authentication token missing.");
    return;
  }

  try {
    setLoading(true);
  
    const response = await fetch(
      `${API_BASE_URL}/api/admin/session-plan-group/${id}/level/${level}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to delete session level.");
    }

    showSuccess(data?.message || "Session level deleted successfully.");

    await fetchSessionGroup();

  } catch (err) {
    console.error("Delete error:", err);
    showError(err.message || "Something went wrong.");
  } finally {
    setLoading(false); // ✅ Always stop loading
  }
}, [token, fetchSessionGroup]);
  return (
    <SessionPlanContext.Provider
      value={{
        // sessionGroup
        sessionGroup,
        setSessionGroup,
        loading,
        setLoading,
        createSessionGroup,
        createSessionExercise,
        updateSessionExercise,
        duplicatePlan,
        selectedGroup,
        fetchSessionGroup,
        fetchGroupById,
        createDiscount,
        updateDiscount,
        deleteSessionGroup,
        duplicateSession,
        uploadProgress,
        setUploadProgress,
        selectedExercise,
        setSelectedExercise,
        exercises,
        deleteExercise,
        setExercises,
        progressLoading,
        fetchExerciseById,
        deleteSessionlevel,
        fetchExercises,
      }}
    >
      {children}
    </SessionPlanContext.Provider>
  );
};

export const useSessionPlan = () => useContext(SessionPlanContext);
