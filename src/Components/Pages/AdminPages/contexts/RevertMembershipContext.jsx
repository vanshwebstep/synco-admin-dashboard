// RevertMembershipContext.jsx
import React, { createContext, useContext, useState } from "react";

const RevertMembershipContext = createContext();
import { showSuccess, showError, showWarning, showConfirm } from '../../../../utils/swalHelper';
import { useNavigate } from 'react-router-dom';

export const useRevertMembership = () => useContext(RevertMembershipContext);

export const RevertMembershipProvider = ({ children }) => {
    const [revertPopup, setRevertPopup] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [studentsList, setStudentsList] = useState([]);
    const [currentBookingId, setCurrentBookingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const openRevertPopup = (bookingId, students) => {
        console.log("Opening revert popup for booking ID:", bookingId);
        console.log("Context openRevertPopup called with students:", students);
        setCurrentBookingId(bookingId);
        setStudentsList(students || []);
        setSelectedStudents([]); // Reset selection
        setRevertPopup(true);
    };

    const closeRevertPopup = () => {
        setRevertPopup(false);
        setSelectedStudents([]);
        setStudentsList([]);
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
            // navigate('/weekly-classes/cancellation');
            window.location.reload();
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
                studentsList,
                openRevertPopup,
                closeRevertPopup,
                handleSubmitRevert,
                loading,
            }}
        >
            {children}
            <RevertMembershipPopup />
        </RevertMembershipContext.Provider>
    );
};

const RevertMembershipPopup = () => {
    const {
        revertPopup,
        closeRevertPopup,
        selectedStudents,
        setSelectedStudents,
        handleSubmitRevert,
        studentsList,
        loading
    } = useRevertMembership();

    if (!revertPopup) return null;
    console.log("RevertMembershipPopup Render:", { revertPopup, studentsList });

    const token = localStorage.getItem("adminToken");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const handleStudentToggle = (student) => {
        const exists = selectedStudents.find((s) => s.value === student.id);
        if (exists) {
            setSelectedStudents(selectedStudents.filter((s) => s.value !== student.id));
        } else {
            setSelectedStudents([...selectedStudents, {
                value: student.id,
                label: `${student.studentFirstName} ${student.studentLastName}`
            }]);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                {/* Close Button */}
                <button
                    className="absolute top-4 left-4 p-2"
                    onClick={closeRevertPopup}
                >
                    <img src="/images/icons/cross.png" alt="Close" />
                </button>

                {/* Header */}
                <div className="text-center py-6 border-b border-gray-300">
                    <h2 className="font-semibold text-[24px]">Revert Membership</h2>
                </div>

                <div className="space-y-4 px-6 pb-6 pt-4">
                    {/* Select Students */}
                    <div>
                        <label className="block text-[16px] font-semibold">Select Students to Revert</label>
                        <div className="mt-3 space-y-2">
                            {studentsList.filter(s => s.studentStatus === "request_to_cancel").map((student) => (
                                <label
                                    key={student.id}
                                    className="flex items-center space-x-3 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.some((s) => s.value === student.id)}
                                        onChange={() => handleStudentToggle(student)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-[15px] text-gray-700 font-medium">
                                        {student.studentFirstName} {student.studentLastName}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            onClick={() => handleSubmitRevert({ token, API_BASE_URL })}
                            disabled={loading || selectedStudents.length === 0}
                            className={`w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow ${(loading || selectedStudents.length === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {loading ? "Processing..." : "Revert Membership"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

