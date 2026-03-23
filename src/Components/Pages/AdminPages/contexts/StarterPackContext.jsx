import { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError, ThemeSwal } from "../../../../utils/swalHelper";

const StarterPackContext = createContext();

export const StarterPackProvider = ({ children }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [starterPacks, setStarterPacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("adminToken");

    const fetchStarterPacks = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/starter-pack/list`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setStarterPacks(result);
        } catch (error) {
            console.error("Failed to fetch starter packs:", error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    const createStarterPack = async (packData) => {
        setLoading(true);
        const token = localStorage.getItem("adminToken");

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        if (token) {
            myHeaders.append("Authorization", `Bearer ${token}`);
        }

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(packData),
            redirect: "follow",
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/starter-pack/create`, requestOptions);

            if (!response.ok) {
                const errorData = await response.json();

                let errorMessage = '';
                if (errorData.error) {
                    const fieldErrors = Object.values(errorData.error)
                        .map((msg, index) => `<div>${index + 1}. ${msg}</div>`)
                        .join('');
                    errorMessage = fieldErrors;
                } else if (errorData.message) {
                    errorMessage = `<div>${errorData.message}</div>`;
                } else {
                    errorMessage = "<div>An unknown error occurred.</div>";
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            await fetchStarterPacks();
            await showSuccess("Success!", result.message || "Starter Pack has been created successfully.");
            return result;
        } catch (error) {
            console.error("Error creating starter pack:", error);
            await ThemeSwal.fire({
                title: "Error",
                html: error.message,
                icon: "error",
                confirmButtonText: "OK",
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateStarterPack = async (id, packData) => {
        setLoading(true);
        const token = localStorage.getItem("adminToken");

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        if (token) {
            myHeaders.append("Authorization", `Bearer ${token}`);
        }

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: JSON.stringify(packData),
            redirect: "follow",
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/starter-pack/update/${id}`, requestOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update starter pack");
            }

            const result = await response.json();
            await fetchStarterPacks();
            await showSuccess("Success!", result.message || "Starter Pack has been updated successfully.");
            return result;
        } catch (error) {
            console.error("Error updating starter pack:", error);
            await showError("Error", error.message || "Something went wrong while updating starter pack.");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteStarterPack = useCallback(async (id) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/starter-pack/delete/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to delete starter pack");
            }

            await showSuccess("Deleted!", result.message || "Starter Pack has been deleted successfully.");
            await fetchStarterPacks();
        } catch (error) {
            console.error("Error deleting starter pack:", error);
            await showError("Error", error.message || "Something went wrong while deleting starter pack.");
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, fetchStarterPacks]);

    return (
        <StarterPackContext.Provider value={{ starterPacks, fetchStarterPacks, createStarterPack, updateStarterPack, deleteStarterPack, loading }}>
            {children}
        </StarterPackContext.Provider>
    );
};

export const useStarterPack = () => useContext(StarterPackContext);
