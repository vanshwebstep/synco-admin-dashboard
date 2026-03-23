import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { FaPlus, FaSave, FaEdit } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";

import "react-datepicker/dist/react-datepicker.css";

import { useAccountsInfo } from "../../../contexts/AccountsInfoContext";
import { useBookFreeTrial } from "../../../contexts/BookAFreeTrialContext";
import Loader from "../../../contexts/Loader";

const StudentProfile = (fetchedData) => {
  const [editStudent, setEditStudent] = useState({});
  const [currentEditId, setCurrentEditId] = useState(null);
  const [bookingType, setBookingType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { updateBookMembershipFamily, updateBookFreeTrialsFamily, updateWaitingListFamily } =
    useBookFreeTrial();

  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  /** -------------------------------
   *       UPDATE STUDENT API
   --------------------------------*/
  const handleUpdate = async (key, dataArray) => {
    try {
      setStudentLoading(true); // <-- START LOADING

      const filtered = dataArray
        .filter((s) => s.bookingTrialId === currentEditId)
        .map((s) => ({
          id: s.id,
          studentFirstName: s.studentFirstName,
          studentLastName: s.studentLastName,
          dateOfBirth: s.dateOfBirth,
          age: s.age,
          gender: s.gender,
          medicalInformation: s.medicalInformation,
        }));

      if (bookingType === "free") {
        await updateBookFreeTrialsFamily(currentEditId, filtered ,'leadsbooking');
      } else if (bookingType === "waiting list") {
        await updateWaitingListFamily(currentEditId, filtered,'leadsbooking');
      } else if (bookingType === "membership") {
        await updateBookMembershipFamily(currentEditId, filtered ,'leadsbooking');
      } else {
        await updateBookFreeTrialsFamily(currentEditId, filtered,'leadsbooking');
      }

      // Optional: close edit mode
      setEditStudent({});
      setCurrentEditId(null);

    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setStudentLoading(false); // <-- END LOADING
    }
  };


  /** -------------------------------
   *   MODAL: Add New Student Data
   --------------------------------*/
  const [newStudent, setNewStudent] = useState({
    studentFirstName: "",
    studentLastName: "",
    dateOfBirth: null,
    age: "",
    gender: "",
    medicalInformation: "",
  });

  const handleModalChange = (field, value) => {
    setNewStudent((prev) => ({ ...prev, [field]: value }));
  };

  const handleDOBChange = (index, date, isModal = false) => {
    const today = new Date();
    let age = "";

    if (date) {
      const diff = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      age =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? diff - 1
          : diff;
    }

    if (isModal) {
      setNewStudent((prev) => ({ ...prev, dateOfBirth: date, age }));
    } else {
      const updated = [...students];
      updated[index] = { ...updated[index], dateOfBirth: date, age };
      setStudents(updated);
    }
  };

  const handleAddStudent = () => {
    if (!newStudent.studentFirstName && !newStudent.studentLastName) {
      return alert("Please enter at least first or last name.");
    }

    const updatedStudents = [...students, { ...newStudent }];
    setStudents(updatedStudents);

    handleUpdate("students", updatedStudents);

    setShowModal(false);
    setNewStudent({
      studentFirstName: "",
      studentLastName: "",
      dateOfBirth: null,
      age: "",
      gender: "",
      medicalInformation: "",
    });
  };

  /** -------------------------------
   *           INPUT CHANGE
   --------------------------------*/
  const handleInputChange = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  const handleEditStudents = () => {
    handleUpdate("students", students);
    setEditStudent({});
  };

  /** -------------------------------
   *          LOAD DATA
   --------------------------------*/
  useEffect(() => {
    const bookings = fetchedData?.leadData?.bookings;

    if (Array.isArray(bookings)) {
      const allStudents = bookings.flatMap((b) =>
        (b?.students || []).map((student) => ({
          ...student,
          bookingType: b?.bookingType || "unknown",
          bookingVenue: b?.venue?.name || "Venue",
          bookingId: b?.bookingId,
          bookingScheduleId: b?.classScheduleId,
          bookingTrialId: student.bookingTrialId, // IMPORTANT FIX
        }))
      );

      setStudents(allStudents);
    }
  }, [fetchedData]);
  console.log('bookings', fetchedData)


  if (studentLoading) {
    return (
      <>
        <Loader />
      </>
    )
  }
  return (
    <div className="space-y-10 p-6">
      {/* Add Student */}
      <div className="flex justify-end mb-6">
        {students.length < 3 && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-[#237FEA] md:absolute right-0 -top-0 text-sm px-4 py-3 rounded-xl text-white hover:bg-[#1E6FD2] flex items-center gap-2 transition"
          >
            Add Student <FaPlus />
          </button>
        )}
      </div>

      {students.length === 0 && (
        <p className="text-gray-500 italic text-sm">No student added yet.</p>
      )}

      {students.map((student, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="bg-white mb-10 p-6 rounded-3xl shadow-sm space-y-6"
        >
          <h2
            onClick={() => {
              setEditStudent((prev) => ({ ...prev, [index]: !prev[index] }));
              setBookingType(student.bookingType);
              setCurrentEditId(student.bookingTrialId);
            }}
            className="text-xl font-bold text-[#282829] flex gap-2 items-center cursor-pointer"
          >
            {editStudent?.[index]
              ? "Editing Student"
              : `Student ${index + 1} Information (${student.bookingType === "free"
                ? "Trials ="
                : student.bookingType === "waiting list"
                  ? "Waiting List ="
                  : "Membership ="
              } ${student.bookingVenue})`}
            {editStudent?.[index] ? (
              <FaSave onClick={handleEditStudents} />
            ) : (
              <FaEdit />
            )}
          </h2>

          {/* Names */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-[16px] font-semibold">First name</label>
              <input
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Enter first name"
                value={student.studentFirstName}
                onChange={(e) =>
                  handleInputChange(index, "studentFirstName", e.target.value)
                }
                readOnly={!editStudent?.[index]}
              />
            </div>

            <div className="w-1/2">
              <label className="block text-[16px] font-semibold">Last name</label>
              <input
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Enter last name"
                value={student.studentLastName}
                onChange={(e) =>
                  handleInputChange(index, "studentLastName", e.target.value)
                }
                readOnly={!editStudent?.[index]}
              />
            </div>
          </div>

          {/* DOB + Age */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-[16px] font-semibold">Date of birth</label>
              <DatePicker
                withPortal
                selected={student.dateOfBirth}
                onChange={(date) => handleDOBChange(index, date)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                dateFormat="dd/MM/yyyy"
                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 3))}
                minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                placeholderText="Select date of birth"
                isClearable
                disabled={!editStudent?.[index]}
              />
            </div>

            <div className="w-1/2">
              <label className="block text-[16px] font-semibold">Age</label>
              <input
                type="text"
                value={student.age}
                readOnly
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-50"
              />
            </div>
          </div>

          {/* Gender + Medical */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-[16px] font-semibold">Gender</label>
              <Select
                className="w-full mt-2 text-base"
                classNamePrefix="react-select"
                placeholder="Select gender"
                value={genderOptions.find((option) => option.value === student.gender)}
                onChange={(selectedOption) =>
                  handleInputChange(index, "gender", selectedOption?.value || "")
                }
                options={genderOptions}
                isDisabled={!editStudent?.[index]}
              />
            </div>

            <div className="w-1/2">
              <label className="block text-[16px] font-semibold">Medical information</label>
              <input
                type="text"
                placeholder="Enter medical info"
                value={student.medicalInformation || ""}
                onChange={(e) =>
                  handleInputChange(index, "medicalInformation", e.target.value)
                }
                readOnly={!editStudent?.[index]}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl text-base"
              />
            </div>
          </div>
        </motion.div>
      ))}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0202025c] bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-lg relative max-h-[90vh] md:w-3/12 overflow-auto">
            <div className="border-b border-gray-300 pb-3 relative">
              <h3 className="text-xl font-semibold text-center text-[#282829]">
                Add Student
              </h3>
              <button
                className="absolute left-3 top-0 p-2"
                onClick={() => setShowModal(false)}
              >
                <RxCross2 />
              </button>
            </div>

            {/* First & Last Name */}
            <div className="mb-4 mt-3">
              <label className="block text-[15px] mb-1 font-semibold">First name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
                value={newStudent.studentFirstName}
                onChange={(e) => handleModalChange("studentFirstName", e.target.value)}
              />

              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Surname</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
                  value={newStudent.studentLastName}
                  onChange={(e) => handleModalChange("studentLastName", e.target.value)}
                />
              </div>
            </div>

            {/* DOB + Age */}
            <div className="mb-4">
              <div>
                <label className="block text-[15px] mb-1 font-semibold">
                  Date of birth
                </label>
                <DatePicker
                  withPortal
                  selected={newStudent.dateOfBirth}
                  onChange={(date) => handleDOBChange(null, date, true)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 3))}
                  minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                  isClearable
                />
              </div>

              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Age</label>
                <input
                  type="text"
                  value={newStudent.age}
                  readOnly
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base bg-gray-50"
                />
              </div>
            </div>

            {/* Gender + Medical */}
            <div className="mb-6">
              <label className="block text-[15px] mb-1 font-semibold">Gender</label>
              <Select
                className="mt-1"
                classNamePrefix="react-select"
                value={genderOptions.find((o) => o.value === newStudent.gender)}
                onChange={(selected) =>
                  handleModalChange("gender", selected ? selected.value : "")
                }
                options={genderOptions}
              />

              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">
                  Medical Info
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
                  value={newStudent.medicalInformation}
                  onChange={(e) =>
                    handleModalChange("medicalInformation", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-3 bg-[#237FEA] text-white rounded-xl hover:bg-[#1e6fd2] transition"
                onClick={handleAddStudent}
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
