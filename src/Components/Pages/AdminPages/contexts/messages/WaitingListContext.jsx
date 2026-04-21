// src/contexts/WaitingListContext.jsx

import React, { createContext, useContext, useState } from "react";
import { WaitingListPopup } from "../WaitingListPopup";
import { showWarning } from "../../../../../utils/swalHelper";

const WaitingListContext = createContext(null);

export function WaitingListProvider({ children, profile, students, newClassesForWaitingList, addtoWaitingListSubmit }) {

  const [addToWaitingList, setaddToWaitingList] = useState(false);

  const [waitingListData, setWaitingListData] = useState({
    bookingId: profile?.bookingId || null,
    venueId: profile?.classSchedule?.venue?.id || null,
    startDate: null,
    notes: "",
    selectedStudents: [],
    studentConfigs: {},
  });

  // Reset + open popup (optionally pass bookingId)
  const openWaitingList = (bookingId = null) => {
    setWaitingListData({
      bookingId: bookingId ?? profile?.bookingId ?? null,
      venueId: profile?.classSchedule?.venue?.id || null,
      startDate: null,
      notes: "",
      selectedStudents: [],
      studentConfigs: {},
    });
    setaddToWaitingList(true);
  };

  const closeWaitingList = () => setaddToWaitingList(false);

  // Handlers
  const handleWaitingListStudentSelect = (selectedOptions) => {
    setWaitingListData((prev) => {
      const newConfigs = { ...prev.studentConfigs };
      selectedOptions?.forEach((opt) => {
        if (!newConfigs[opt.value]) {
          newConfigs[opt.value] = { classScheduleId: null };
        }
      });
      return {
        ...prev,
        selectedStudents: selectedOptions || [],
        studentConfigs: newConfigs,
      };
    });
  };

  const handleWaitingListConfigChange = (studentId, field, value) => {
    setWaitingListData((prev) => ({
      ...prev,
      studentConfigs: {
        ...prev.studentConfigs,
        [studentId]: {
          ...prev.studentConfigs?.[studentId],
          [field]: value,
        },
      },
    }));
  };

  const handleDateChange = (date, field, stateSetter) => {
    if (!date) {
      stateSetter((prev) => ({ ...prev, [field]: null }));
      return;
    }
    const formatted = date.toLocaleDateString("en-CA");
    stateSetter((prev) => ({ ...prev, [field]: formatted }));
  };

  const handleInputChange = (e, stateSetter) => {
    const { name, value } = e.target;
    stateSetter((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (waitingListData.selectedStudents.length === 0) {
      showWarning("Missing Information", "Please select at least one student.");
      return;
    }

    const studentsPayload = waitingListData.selectedStudents.map((studentOption) => {
      const config = waitingListData.studentConfigs?.[studentOption.value] || {};
      return {
        studentId: studentOption.value,
        classScheduleId: config.classScheduleId,
      };
    });

    const incomplete = studentsPayload.some((s) => !s.classScheduleId);
    if (incomplete) {
      showWarning("Missing Information", "Please select a new class for all selected students.");
      return;
    }

    const payload = {
      bookingId: waitingListData.bookingId,
      additionalNote: waitingListData.notes,
      startDate: waitingListData.startDate,
      students: studentsPayload,
    };

    closeWaitingList();
    addtoWaitingListSubmit(payload, "allMembers");
  };

  return (
    <WaitingListContext.Provider value={{ openWaitingList, closeWaitingList, addToWaitingList }}>
      {children}

      {/* Popup globally mounted — sirf ek baar render hota hai */}
      {addToWaitingList && (
        <WaitingListPopup
          waitingListData={waitingListData}
          setWaitingListData={setWaitingListData}
          students={students}
          profile={profile}
          newClassesForWaitingList={newClassesForWaitingList}
          onClose={closeWaitingList}
          onSubmit={handleSubmit}
          handleWaitingListStudentSelect={handleWaitingListStudentSelect}
          handleWaitingListConfigChange={handleWaitingListConfigChange}
          handleDateChange={handleDateChange}
          handleInputChange={handleInputChange}
        />
      )}
    </WaitingListContext.Provider>
  );
}

// Custom hook — kisi bhi component mein use karo
export function useWaitingList() {
  return useContext(WaitingListContext);
}