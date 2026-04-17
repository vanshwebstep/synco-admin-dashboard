import { useState } from "react";

const Attendance = ({ stateData }) => {
  const students = stateData?.students || [];
  const [activeIndex, setActiveIndex] = useState(0);
  // Date format (DOB → optional use)
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d) ? "-" : d.toLocaleDateString("en-GB");
  };
  const activeStudent = students[activeIndex];
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">

      {/* Title */}
      <h2 className="text-lg font-semibold mb-4">Attendance</h2>

      {/* Student Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {students.map((student, index) => (
          <button
            key={student.id}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeIndex === index
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
              }`}
            onClick={() => setActiveIndex(index)}
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
            {activeStudent ? (
              <tr className="hover:bg-gray-50">

                {/* Venue */}
                <td className="py-3 px-4">
                  {activeStudent.classSchedule?.className || "Acton"}
                </td>

                {/* Date */}
                <td className="py-3 px-4">
                  {activeStudent.classSchedule?.startTime} -{" "}
                  {activeStudent.classSchedule?.endTime}
                </td>

                {/* Attendance */}
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 capitalize rounded-md text-xs font-medium ${activeStudent.attendance?.toLowerCase() === "attended"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                      }`}
                  >
                    {activeStudent.attendance || "Not Recorded"}
                  </span>
                </td>

              </tr>
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