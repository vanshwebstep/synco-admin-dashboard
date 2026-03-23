import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { showSuccess } from "../../../../utils/swalHelper";

const HolidaySessionPlanContext = createContext();

export const HolidaySessionPlanContextProvider = ({ children }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("adminToken");

    const [sessionGroup, setSessionGroup] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [exercises, setExercises] = useState([]);


    // Fetch all sessionGroup
    const fetchSessionGroup = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/list`, {
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

            console.log('formdata', formdata);

            try {
                setLoading(true);

                const fd = new FormData();

                // Append all keys except "levels"
                for (const key in formdata) {
                    if (key === "levels") continue;

                    const value = formdata[key];

                    if (value instanceof File || value instanceof Blob) {
                        // If it's a Blob or File, append directly
                        // Provide a filename if it's a Blob
                        const fileName = value instanceof File ? value.name : `${key}.mp4`;
                        fd.append(key, value, fileName);
                    } else if (typeof value === "string") {
                        fd.append(key, value);
                    } else if (value !== null && value !== undefined) {
                        // Convert other non-null values to string
                        fd.append(key, JSON.stringify(value));
                    }
                }

                // Append levels as JSON string
                fd.append("levels", JSON.stringify(formdata.levels));

                const response = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/create`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: fd,
                });

                const data = await response.json();

                if (response.ok && data.status) {
                    await showSuccess("Success", data.message || "Group created successfully.");

                    if (shouldRedirect) {
                        navigate('/configuration/holiday-camp/session-plan/list');
                    }
                } else {
                    await showError("Error", data.message || "Failed to create session group.");
                    console.error("API Error:", data.message || "Unknown error");
                }
            } catch (err) {
                console.error("Failed to create session group:", err);
                await showError("Error", "Something went wrong while creating the session group.");
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
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-exercise/list`, {
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

            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-exercise/create`, {
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
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-exercise/update/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formdata,
            });

            const result = await response.json();

            if (!response.ok) throw result;

            console.log("✅ Exercise updated");
            await fetchExercises();
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
            await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-exercise/${id}/duplicate`, {
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
            await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-exercise/delete/${id}`, {
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
            const res = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-exercise/${id}`, {
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


    const fetchGroupById = useCallback(async (id) => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/listBy/${id}`, {
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

            await showSuccess("Success", result.message || "Discount created successfully.");

            navigate('/weekly-classes/sessionGroup/list');
        } catch (err) {
            await showError("Error", err.message || "Failed to create discount.");

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

            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/update/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formdata,
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || "Failed to update");

            await showSuccess("Success", result.message || "Level updated successfully.");

            navigate("/configuration/holiday-camp/session-plan/list");
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
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/delete/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchSessionGroup();
        } catch (err) {
            console.error("Failed to delete discount:", err);
        }
    }, [token, fetchSessionGroup]);


    //duplicate  
    const duplicateSession = useCallback(async (id) => {
        if (!token) return;
        setLoading(true); // Start loading
        try {
            await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/${id}/duplicate`, {
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
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/${id}/level/${level}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },

            });
            await fetchSessionGroup();
        } catch (err) {
            console.error("Failed to delete discount:", err);
        }
    }, [token, fetchSessionGroup]);


    return (
        <HolidaySessionPlanContext.Provider
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

                selectedExercise,
                setSelectedExercise,
                exercises,
                deleteExercise,
                setExercises,
                fetchExerciseById,
                deleteSessionlevel,
                fetchExercises,
            }}
        >
            {children}
        </HolidaySessionPlanContext.Provider>
    );
};

export const useHolidaySessionPlan = () => useContext(HolidaySessionPlanContext);
