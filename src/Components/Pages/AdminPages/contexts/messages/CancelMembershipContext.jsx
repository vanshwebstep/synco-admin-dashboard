// CancelMembershipContext.jsx
import React, { createContext, useContext, useState } from "react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { addDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

const CancelMembershipContext = createContext();

const cancelTypeOptions = [
    { value: "immediate", label: "Cancel Immediately" },
    { value: "scheduled", label: "Request Cancel" },
];

const reasonOptions = [
    { value: "Family emergency - cannot attend", label: "Family emergency - cannot attend" },
    { value: "Health issue", label: "Health issue" },
    { value: "Schedule conflict", label: "Schedule conflict" },
    { value: "other", label: "Other reason" },
];

const CancelMembershipPopup = () => {
    const {
        showCancelPopup,
        cancelData,
        setCancelData,
        selectedStudents,
        studentsList,
        cancelLoading,
        closeCancelPopup,
        handleCancelSubmit,
        alreadyrequestToCancel
    } = useContext(CancelMembershipContext);
    const handleRadioChange = (value) => {
        setCancelData((prev) => ({ ...prev, cancellationType: value }));
    };

    const handleDateChange = (date) => {
        if (!date) {
            setCancelData((prev) => ({ ...prev, cancelDate: null }));
            return;
        }
        const formatted = date.toLocaleDateString("en-CA");
        setCancelData((prev) => ({ ...prev, cancelDate: formatted }));
    };

    const handleStudentToggle = (student) => {
        const exists = selectedStudents.find((s) => s.id === student.id);
        const updated = exists
            ? selectedStudents.filter((s) => s.id !== student.id)
            : [...selectedStudents, { id: student.id, studentFirstName: student.studentFirstName, studentLastName: student.studentLastName }];
        setCancelData((prev) => ({ ...prev, _selectedStudents: updated }));
    };

    if (!showCancelPopup) return null;

    return (
        <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                <button className="absolute top-4 left-4 p-2" onClick={closeCancelPopup}>
                    <img src="/images/icons/cross.png" alt="Close" />
                </button>

                <div className="text-center py-6 border-b border-gray-300">
                    <h2 className="font-semibold text-[24px]">
                        {alreadyrequestToCancel
                            ? "Cancel Membership"
                            : cancelData.cancellationType !== "immediate"
                                ? "Request to Cancel"
                                : "Cancel Membership"}
                    </h2>
                </div>

                <div className="space-y-4 px-6 pb-6 pt-4">
                    {/* Cancellation Type */}
                    <div>
                        <label className="block text-[16px] font-semibold">Cancellation Type</label>
                        {cancelTypeOptions.filter(option =>
                            alreadyrequestToCancel ? option.value === "immediate" : true
                        ).map((option) => (
                            <label key={option.value} className="flex mt-4 items-center mb-2 cursor-pointer">
                                <label className="flex items-center cursor-pointer space-x-2">
                                    <input
                                        type="radio"
                                        name="cancelType"
                                        value={option.value}
                                        checked={cancelData.cancellationType === option.value}
                                        onChange={() => handleRadioChange(option.value)}
                                        className="hidden peer"
                                    />
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 peer-checked:bg-blue-500 peer-checked:border-blue-500">
                                        <svg className="w-3 h-3 text-white peer-checked:block" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span className="text-gray-800 text-[16px]">{option.label}</span>
                                </label>
                            </label>
                        ))}
                    </div>

                    {/* Cancel Date (only if not immediate) */}
                    {cancelData.cancellationType !== "immediate" && (
                        <div>
                            <label className="block text-[16px] font-semibold">Cancellation Effective Date</label>
                            <DatePicker
                                minDate={addDays(new Date(), 1)}
                                dateFormat="EEEE, dd MMMM yyyy"
                                selected={cancelData.cancelDate ? new Date(cancelData.cancelDate) : null}
                                onChange={handleDateChange}
                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                withPortal
                            />
                        </div>
                    )}

                    {/* Students */}
                    <div>
                        <label className="block text-[16px] font-semibold">Select Students to Cancel</label>
                        <div className="mt-3 space-y-2">
                            {studentsList.map((student) => {
                                const isCancelled = student.studentStatus === "cancelled";
                                const isRequesttoCancelled = student.studentStatus === "request_to_cancel";
                                const isDisabled =
                                    isCancelled ||
                                    (cancelData.cancellationType !== "immediate" && isRequesttoCancelled);
                                return (
                                    <label
                                        key={student.id}
                                        className={`flex items-center space-x-3 ${isDisabled
                                            ? "cursor-not-allowed opacity-50"
                                            : "cursor-pointer"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            disabled={isDisabled}
                                            checked={selectedStudents.some((s) => s.id === student.id)}
                                            onChange={() => !isDisabled && handleStudentToggle(student)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-[15px]">
                                            {student.studentFirstName} {student.studentLastName}
                                            {isCancelled && " (Already Cancelled)"}
                                            {isRequesttoCancelled && cancelData.cancellationType !== "immediate" && " (Already Request to Cancel)"}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-[16px] font-semibold">Reason for Cancellation</label>
                        <Select
                            value={reasonOptions.find((opt) => opt.value === cancelData.cancelReason) || null}
                            onChange={(selected) => setCancelData((prev) => ({ ...prev, cancelReason: selected?.value || null }))}
                            options={reasonOptions}
                            placeholder=""
                            className="rounded-lg mt-2"
                            styles={{
                                control: (base) => ({ ...base, borderRadius: "0.7rem", boxShadow: "none", padding: "6px 8px", minHeight: "48px" }),
                                placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                indicatorSeparator: () => ({ display: "none" }),
                            }}
                        />
                        {cancelData.cancelReason === "other" && (
                            <input
                                type="text"
                                placeholder="Enter your reason"
                                value={cancelData.otherReason}
                                onChange={(e) => setCancelData((prev) => ({ ...prev, otherReason: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-3"
                            />
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-[16px] font-semibold">Additional Notes (Optional)</label>
                        <textarea
                            className="w-full bg-gray-100 mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                            rows={3}
                            name="additionalNote"
                            value={cancelData.additionalNote}
                            onChange={(e) => setCancelData((prev) => ({ ...prev, additionalNote: e.target.value }))}
                            placeholder=""
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            onClick={handleCancelSubmit}
                            disabled={cancelLoading}
                            className={`w-1/2 bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow ${cancelLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {cancelLoading
                                ? "Processing..."
                                : cancelData.cancellationType !== "immediate"
                                    ? "Request to Cancel"
                                    : "Cancel Membership"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CancelMembershipProvider = ({ children }) => {
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelData, setCancelData] = useState({
        bookingId: "",
        cancellationType: "immediate",
        cancelReason: "",
        cancelDate: null,
        additionalNote: "",
        otherReason: "",
        _selectedStudents: [],
    });
    const [alreadyrequestToCancel, setAlreadyrequestToCancel] = useState(false);

    const [studentsList, setStudentsList] = useState([]);
    const [callbacks, setCallbacks] = useState({ showError: null, showWarning: null, onSubmit: null });

    const selectedStudents = cancelData._selectedStudents || [];

    const openCancelPopup = (
        bookingId,
        students,
        { showError, showWarning, onSubmit, alreadyrequestToCancel }
    ) => {
        setCancelData({
            bookingId,
            cancellationType: alreadyrequestToCancel ? "immediate" : "immediate",
            cancelReason: "",
            cancelDate: null,
            additionalNote: "",
            otherReason: "",
            _selectedStudents: [],
        });

        setStudentsList(Array.isArray(students) ? students : []);
        setCallbacks({ showError, showWarning, onSubmit });

        setAlreadyrequestToCancel(!!alreadyrequestToCancel); // ✅ important
        setShowCancelPopup(true);
    };

    const closeCancelPopup = () => {
        setShowCancelPopup(false);
    };

    const handleCancelSubmit = () => {
        const { showError, showWarning, onSubmit } = callbacks;

        if (selectedStudents.length === 0)
            return showWarning("Validation Error", "Please select at least one student.");
        if (!cancelData.cancellationType)
            return showWarning("Validation Error", "Please select a cancellation type.");
        if (cancelData.cancellationType !== "immediate" && !cancelData.cancelDate)
            return showWarning("Validation Error", "Please select a cancellation effective date.");
        if (!cancelData.cancelReason)
            return showWarning("Validation Error", "Please select a reason for cancellation.");

        closeCancelPopup();
        onSubmit(cancelData, "allMembers", selectedStudents);
    };

    return (
        <CancelMembershipContext.Provider value={{
            showCancelPopup, cancelData, setCancelData,
            selectedStudents, studentsList,
            cancelLoading, openCancelPopup, closeCancelPopup, handleCancelSubmit, alreadyrequestToCancel
        }}>
            {children}
            <CancelMembershipPopup />
        </CancelMembershipContext.Provider>
    );
};

export const useCancelMembership = () => useContext(CancelMembershipContext);