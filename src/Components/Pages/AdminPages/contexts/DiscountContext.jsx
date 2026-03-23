import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from "../../../../utils/swalHelper";
const DiscountContext = createContext();

export const DiscountContextProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");

  const [discounts, setDiscounts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all discounts
  const fetchDiscounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/discount`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setDiscounts(result.data || []);
    } catch (err) {
      console.error("Failed to fetch discounts:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  const fetchHolidayDiscounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/booking/discount/holiday-camp`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setDiscounts(result.data || []);
    } catch (err) {
      console.error("Failed to fetch discounts:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  // Fetch single discount
  const fetchDiscountById = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-plan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setSelectedDiscount(result.data || null);
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

      await fetchDiscounts();

      await showSuccess("Success!", result.message || 'Discount created successfully.');

      navigate('/holiday-camps/discounts/list');
    } catch (err) {
      await showError("Error", err.message || 'An unexpected error occurred.');

      console.error("Failed to create discount:", err);
    } finally {
      setLoading(false); // Stop loading regardless of success or error
    }
  }, [token, fetchDiscounts, navigate]);


  // Update discount
  const updateDiscount = useCallback(async (id, data) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/payment-plan/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      await fetchDiscounts();
    } catch (err) {
      console.error("Failed to update discount:", err);
    }
  }, [token, fetchDiscounts]);

  // Delete discount
  const deleteDiscount = useCallback(async (id) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/payment-plan/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDiscounts();
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }
  }, [token, fetchDiscounts]);



  return (
    <DiscountContext.Provider
      value={{
        // Discounts
        discounts,
        setDiscounts,
        loading,
        selectedDiscount,
        fetchHolidayDiscounts,
         fetchDiscounts,
        fetchDiscountById,
        createDiscount,
        updateDiscount,
        deleteDiscount,
      }}
    >
      {children}
    </DiscountContext.Provider>
  );
};

export const useDiscounts = () => useContext(DiscountContext);
