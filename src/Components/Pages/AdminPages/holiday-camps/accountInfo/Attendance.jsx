import React, { useState } from "react";

export default function Attendance() {
  const [activeStudent, setActiveStudent] = useState("John Smith");

  const students = ["John Smith", "Michael Smith"];

  const attendanceData = [
    { venue: "Acton", date: "01/06/2023 11:00 - 12:00", status: "Attended" },
    { venue: "Acton", date: "01/06/2023 11:00 - 12:00", status: "Attended" },
    { venue: "Acton", date: "01/06/2023 11:00 - 12:00", status: "Absent" },
    { venue: "Acton", date: "01/06/2023 11:00 - 12:00", status: "Attended" },
    { venue: "Acton", date: "01/06/2023 11:00 - 12:00", status: "Attended" },
  ];

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm ">
      {/* Header */}
      <div className="p-5">
        <h2 className="text-[24px] font-semibold text-balck font-semibold mb-4">Attendance</h2>

        {/* Student Tabs */}
        <div className="flex gap-2 items-center ">
          {students.map((student) => (
            <button
              key={student}
              onClick={() => setActiveStudent(student)}
              className={`px-4 py-2 rounded-xl text-[16px] font-medium border transition-colors ${activeStudent === student
                  ? "bg-[#237FEA] text-white border-[#237FEA]"
                  : "bg-white text-black border-gray-300 hover:bg-gray-100"
                }`}
            >
              {student}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F5F5F5] text-[#717073] border-t border-b border-[#DBDBDB] text-sm font-semibold">
              <th className="p-3 text-left font-semibold">Class Venue</th>
              <th className="p-3 text-left font-semibold">Date</th>
              <th className="p-3 text-left font-semibold">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-[#EFEEF2] last:border-none hover:bg-gray-50 transition"
              >
                <td className="p-3 text-sm text-balck font-semibold">{item.venue}</td>
                <td className="p-3 text-sm text-balck font-semibold">{item.date}</td>
                <td className="p-3">
                  {item.status === "Attended" ? (
                    <button className="bg-green-50 text-green-600 text-sm md:w-[100px] font-medium px-3 py-1 rounded-md">
                      Attended
                    </button>
                  ) : (
                    <button className="bg-red-50 text-red-500 text-sm md:w-[100px] font-medium px-3 py-1 rounded-md">
                      Absent
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
