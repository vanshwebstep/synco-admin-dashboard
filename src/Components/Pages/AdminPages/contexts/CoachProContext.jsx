import { createContext, useContext, useState, useCallback } from "react";
import { showSuccess } from "../../../../utils/swalHelper";

const CoachProContext = createContext();

export const CoachProProvider = ({ children }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [coachProData, setCoachProData] = useState([]);
    const token = localStorage.getItem("adminToken");

    const [loading, setLoading] = useState(false);
    const [isEditFindClasses, setIsEditFindClasses] = useState(false);
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

    const fetchCoachPro = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/coach-profile/venue-allocate/list`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setCoachProData(result);
        } catch (error) {
            console.error("Failed to fetch coachProData:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    const createCoachPro = async (coachProData) => {
        setLoading(true);

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        if (token) {
            myHeaders.append("Authorization", `Bearer ${token}`);
        }

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(coachProData),
            redirect: "follow",
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/coach-profile/venue-allocate/create`, requestOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create coachProData");
            }

            const result = await response.json();
            await showSuccess('Success!', result.message || "FindClasses has been created successfully.");


            fetchCoachPro();
            return result;
        } catch (error) {
            console.error("Error creating coachProData:", error);
            await showError('Error', error.message || "Something went wrong while creating coachProData.");
               
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // UPDATE VENUE
    const updateCoachPro = async (coachid, payload) => {
        setLoading(true);

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        if (token) {
            myHeaders.append("Authorization", `Bearer ${token}`);
        }

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: JSON.stringify(payload),
            redirect: "follow",
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/coach-profile/venue-allocate/update/${coachid}`, requestOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update coachProData");
            }

            const result = await response.json();

            await showSuccess('Success!', result.message || "FindClasses has been updated successfully.");

            fetchCoachPro();
            return result;
        } catch (error) {
            console.error("Error updating coachProData:", error);
            await showError('Error', error.message || "Something went wrong while updating coachProData.");
            throw error;
        } finally {
            setLoading(false);
        }
    };
    const deleteVenueAllocation = useCallback(
        async (id) => {
            if (!token) throw new Error("Unauthorized");

            const res = await fetch(
                `${API_BASE_URL}/api/admin/coach-profile/venue-allocate/delete/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to delete venue allocation");
            }

            await fetchCoachPro(); // refresh list
            return data; // ✅ return dynamic message
        },
        [token, fetchCoachPro]
    );


    return (
        <CoachProContext.Provider
            value={{
                coachProData,
                createCoachPro,
                updateCoachPro,
                deleteVenueAllocation,
                formData,
                setFormData,
                isEditFindClasses,
                setIsEditFindClasses,
                setCoachProData,
                fetchCoachPro,
                loading
            }}
        >
            {children}
        </CoachProContext.Provider>
    );

};

export const useCoachPro = () => useContext(CoachProContext);
