import { useState } from "react";

const Attendance = ({ stateData }) => {
  const students = stateData?.students || [];

  // Date format (DOB → optional use)
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d) ? "-" : d.toLocaleDateString("en-GB");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      
      {/* Title */}
      <h2 className="text-lg font-semibold mb-4">Attendance</h2>

      {/* Student Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {students.map((student, index) => (
          <button
            key={student.id}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              index === 0
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {student.studentFirstName} {student.studentLastName}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          
          {/* Header */}
          <thead className="bg-gray-100 text-gray-500 text-left">
            <tr>
              <th className="py-3 px-4 font-medium">Class Venue</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Attendance</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y">
            {students.length > 0 ? (
              students.map((student) => {
                const isAttended =
                  student.attendance?.toLowerCase() === "attended";

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    
                    {/* Venue (static ya API se aayega) */}
                    <td className="py-3 px-4">
                      {student.classSchedule?.className || "Acton"}
                    </td>

                    {/* Date (time use kar rahe) */}
                    <td className="py-3 px-4">
                      {student.classSchedule?.startTime} -{" "}
                      {student.classSchedule?.endTime}
                    </td>

                    {/* Attendance */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 capitalize rounded-md text-xs font-medium ${
                          isAttended
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                       {student.attendance || "Not Recorded"}
                      </span>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  No attendance data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;