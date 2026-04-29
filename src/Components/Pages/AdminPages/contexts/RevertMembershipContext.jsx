// RevertMembershipContext.jsx
import React, { createContext, useContext, useState } from "react";

const RevertMembershipContext = createContext();
import { showSuccess, showError, showWarning, showConfirm } from '../../../../utils/swalHelper';
import { useNavigate } from 'react-router-dom';

export const useRevertMembership = () => useContext(RevertMembershipContext);

export const RevertMembershipProvider = ({ children }) => {
    const [revertPopup, setRevertPopup] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [currentBookingId, setCurrentBookingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const openRevertPopup = (bookingId) => {
        console.log("Opening revert popup for booking ID:", bookingId);
        setCurrentBookingId(bookingId);
        setRevertPopup(true);
    };

    const closeRevertPopup = () => {
        setRevertPopup(false);
        setSelectedStudents([]);
        setCurrentBookingId(null);
    };

    const handleSubmitRevert = async ({ token, API_BASE_URL }) => {
        if (!selectedStudents.length) {
            showError("Error", "Please select at least one student");
            return;
        }

        setLoading(true);

        const headers = {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/cancel-membership/revert-membership`,
                {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({
                        bookingId: currentBookingId,
                        studentIds: selectedStudents.map((s) => s.value),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed");
            }

            showSuccess("Success!", result.message);
            closeRevertPopup();
            navigate('/weekly-classes/cancellation');
        } catch (error) {
            console.error(error);
            showError("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <RevertMembershipContext.Provider
            value={{
                revertPopup,
                selectedStudents,
                setSelectedStudents,
                openRevertPopup,
                closeRevertPopup,
                handleSubmitRevert,
                loading,
            }}
        >
            {children}
        </RevertMembershipContext.Provider>
    );
};


// RevertMembershipPopup.jsx


// USAGE:
// Wrap your app:
// <RevertMembershipProvider>
//    <App />
// </RevertMembershipProvider>

// Use button anywhere:
// const { openRevertPopup } = useRevertMembership();
// onClick={() => openRevertPopup(bookingId)}

// Render popup once at root:
// <RevertMembershipPopup studentsList={studentsList} />
