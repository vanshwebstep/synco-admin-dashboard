// src/components/WaitingListPopup.jsx

import React from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

export function WaitingListPopup({
  waitingListData,
  setWaitingListData,
  students,
  profile,
  newClassesForWaitingList,
  onClose,
  onSubmit,
  handleWaitingListStudentSelect,
  handleWaitingListConfigChange,
  handleDateChange,
  handleInputChange,
}) {
  return (
    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">

        {/* Close Button */}
        <button
          className="absolute top-4 left-4 p-2"
          onClick={onClose}
        >
          <img src="/images/icons/cross.png" alt="Close" />
        </button>

        {/* Header */}
        <div className="text-center py-6 border-b border-gray-300">
          <h2 className="font-semibold text-[24px]">Add to Waiting List Form</h2>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-4">

          {/* Select Student */}
          <div>
            <label className="block text-[16px] font-semibold">Select Student</label>
            <Select
              value={waitingListData.selectedStudents}
              onChange={handleWaitingListStudentSelect}
              options={
                students?.map((student) => ({
                  value: student.id,
                  label: student.studentFirstName + " " + student.studentLastName,
                  classSchedule: student.classSchedule,
                })) || []
              }
              placeholder="Select Student"
              isMulti
              className="rounded-lg mt-2"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "0.7rem",
                  boxShadow: "none",
                  padding: "4px 8px",
                  minHeight: "48px",
                }),
                placeholder: (base) => ({ ...base, fontWeight: 600 }),
                dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                indicatorSeparator: () => ({ display: "none" }),
              }}
            />
          </div>

          {/* Per-Student Configuration */}
          {waitingListData.selectedStudents.length > 0 && (
            <div className="space-y-6 border-t pt-4">
              {waitingListData.selectedStudents.map((studentOption) => {
                const studentId = studentOption.value;
                const config = waitingListData.studentConfigs?.[studentId] || {};
                const currentClass = studentOption.classSchedule?.className || "-";

                return (
                  <div
                    key={studentId}
                    className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200"
                  >
                    <h3 className="font-semibold capitalize text-lg text-gray-800 pb-2">
                      {studentOption.label}
                    </h3>

                    {/* Current Info */}
                    <div className="grid gap-4 text-sm text-gray-600">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Current Class</label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                          value={currentClass}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Venue</label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                          value={profile?.venue?.name || "-"}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Select New Class */}
                    <div>
                      <label className="block text-[16px] font-semibold">Select New Class</label>
                      <Select
                        value={
                          config.classScheduleId
                            ? newClassesForWaitingList?.find(
                                (cls) => cls.value === config.classScheduleId
                              ) || null
                            : null
                        }
                        onChange={(selected) =>
                          handleWaitingListConfigChange(studentId, "classScheduleId", selected?.value)
                        }
                        options={newClassesForWaitingList}
                        placeholder="Select Class"
                        className="rounded-lg mt-2"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: "0.7rem",
                            boxShadow: "none",
                            padding: "4px 8px",
                            minHeight: "48px",
                          }),
                          placeholder: (base) => ({ ...base, fontWeight: 600 }),
                          dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                          indicatorSeparator: () => ({ display: "none" }),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Preferred Start Date */}
          <div>
            <label className="block text-[16px] font-semibold">
              Preferred Start Date (Optional)
            </label>
            <DatePicker
              minDate={addDays(new Date(), 1)}
              selected={waitingListData.startDate ? new Date(waitingListData.startDate) : null}
              onChange={(date) => handleDateChange(date, "startDate", setWaitingListData)}
              dateFormat="EEEE, dd MMMM yyyy"
              className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
              withPortal
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[16px] font-semibold">Notes (Optional)</label>
            <textarea
              className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
              rows={6}
              name="notes"
              value={waitingListData.notes}
              onChange={(e) => handleInputChange(e, setWaitingListData)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 justify-end">
            <button
              className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={waitingListData.selectedStudents.length === 0}
              onClick={onSubmit}
            >
              Join Waiting List
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}