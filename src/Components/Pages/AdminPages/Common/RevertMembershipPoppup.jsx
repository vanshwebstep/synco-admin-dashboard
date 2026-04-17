import React from "react";
import { useRevertMembership } from "../contexts/RevertMembershipContext";
import Select from "react-select";

const RevertMembershipPopup = ({ studentsList }) => {
  const {
    revertPopup,
    selectedStudents,
    setSelectedStudents,
    closeRevertPopup,
    handleSubmitRevert,
    loading,
  } = useRevertMembership();

  if (!revertPopup) return null;
    const token = localStorage.getItem("adminToken");

  const cancelRequestStudents = studentsList?.filter(
    (s) => s.studentStatus === "request_to_cancel"
  );
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  return (
    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[500px] max-h-[90%] overflow-y-auto relative">

        <button
          className="absolute top-4 left-4"
          onClick={closeRevertPopup}
        >
          ✕
        </button>

        <div className="text-center py-6 border-b">
          <h2 className="font-semibold text-[22px]">Revert Membership</h2>
        </div>

        <div className="p-6 space-y-4">

          <div>
            <label className="font-semibold">Select Students</label>
            <Select
              isMulti
              value={selectedStudents}
              onChange={setSelectedStudents}
              options={cancelRequestStudents?.map((student) => ({
                value: student.id,
                label: `${student.studentFirstName} ${student.studentLastName}`,
              }))}
              placeholder="Select students"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#22C55E] text-white rounded-xl py-3 font-medium disabled:opacity-50"
            onClick={() =>
              handleSubmitRevert({
                token: token,
                API_BASE_URL: API_BASE_URL,
                showSuccess: window.showSuccess,
                showError: window.showError,
              })
            }
          >
            {loading ? "Processing..." : "Confirm Revert"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevertMembershipPopup;
