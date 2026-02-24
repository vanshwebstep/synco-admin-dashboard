import { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError, ThemeSwal } from "../../../../utils/swalHelper";

const VenueContext = createContext();

export const VenueProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [venues, setVenues] = useState([]);
  const token = localStorage.getItem("adminToken");
  const [assignedVenues, setAssignedVenues] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isEditVenue, setIsEditVenue] = useState(false);
  const [formData, setFormData] = useState({
    area: "",
    name: "",
    address: "",
    facility: "",
    termGroupId: [],
    parking: false,
    congestion: false,
    hasStarterPack: false,
    parkingNote: "",
    entryNote: "",
  });
  const [openForm, setOpenForm] = useState(false);

  const fetchVenues = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/venue`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setVenues(result);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchVenueNames = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/coach/recruitment/listing/venue`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setVenues(result);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchAssignedVenueNames = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/coach/recruitment/venue-manager`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setAssignedVenues(result);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const createVenues = async (venueData) => {
    setLoading(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    if (token) {
      myHeaders.append("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(venueData),
      redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/venue`, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();

        let errorMessage = '';

        if (errorData.error) {
          // Wrap each error in a <div> so each appears on a separate line
          const fieldErrors = Object.values(errorData.error)
            .map((msg, index) => `<div>${index + 1}. ${msg}</div>`)
            .join('');
          errorMessage = fieldErrors;
        } else if (errorData.message) {
          errorMessage = `<div>${errorData.message}</div>`;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      await fetchVenues();
      setOpenForm(null)
      setFormData({
        area: "", name: "", address: "", facility: "",
        hasParking: false, isCongested: false, hasStarterPack: false, parkingNote: "",
        howToEnterFacility: "", termGroupId: [], paymentGroupId: ""
      });
      await showSuccess("Success!", result.message || "Venue has been created successfully.");

      return result;
    } catch (error) {
      console.error("Error creating venue:", error);

      await ThemeSwal.fire({
        title: "Error",
        html: error.message, // use html to render <div> properly
        icon: "error",
        confirmButtonText: "OK",
      });

      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  // UPDATE VENUE
  const updateVenues = async (venueId, updatedVenueData) => {
    setLoading(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    if (token) {
      myHeaders.append("Authorization", `Bearer ${token}`);
    }

    console.log('updatedVenueData', updatedVenueData)
    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify(updatedVenueData),
      redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/venue/${venueId}`, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update venue");
      }

      const result = await response.json();

      setOpenForm(null)
      setIsEditVenue(null)
      await fetchVenues();
      await showSuccess("Success!", result.message || "Venue has been updated successfully.");

      return result;
    } catch (error) {
      console.error("Error updating venue:", error);
      await showError("Error", error.message || "Something went wrong while updating venue.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const deleteVenue = useCallback(async (id) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/venue/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete venue");
      }

      await showSuccess(data.message || "Venue deleted successfully");

      await fetchVenues(); // Refresh the list
      setIsEditVenue(null)
    } catch (err) {
      console.error("Failed to delete venue:", err);
      await showError("Error", err.message || "Something went wrong");
    }
  }, [token, fetchVenues]);


  return (
    <VenueContext.Provider
      value={{ venues, createVenues, updateVenues, deleteVenue, openForm, fetchVenueNames, setOpenForm, formData, setFormData, isEditVenue, setIsEditVenue, setVenues, fetchVenues, assignedVenues, fetchAssignedVenueNames, loading }}>
      {children}
    </VenueContext.Provider>
  );
};

export const useVenue = () => useContext(VenueContext);
