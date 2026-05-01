import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";
import { useMembers } from '../../../contexts/MemberContext';
import Loader from '../../../contexts/Loader';
import { usePermission } from '../../../Common/permission';
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import { showSuccess, showError, showWarning } from '../../../../../../utils/swalHelper';

const Feedback = ({ profile }) => {
  const { checkPermission } = usePermission();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔒 FIXED SERVICE TYPE
  const SERVICE_TYPE = "birthdayParty";
  const DISPLAY_SERVICE_TYPE = "weekly class membership";

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const bookingId = profile?.id || profile?.bookingId;

  // ✅ Pull parentAdminId from profile
  const parentAdminId = profile?.parentAdminId || null;

  const { fetchMembers, loading } = useMembers();
  const formatDate = (dateString, withTime = false) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
    };
    if (withTime) {
      return (
        date.toLocaleDateString("en-US", options) +
        ", " +
        date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }
    return date.toLocaleDateString("en-US", options);
  };

  console.log('profile', profile);

  // ---------------- STATES ----------------
  const [feedbackData, setFeedbackData] = useState([]);
  const [agentAndClassesData, setAgentAndClassesData] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [resolveData, setResolveData] = useState('');
  console.log('resolveData', resolveData);
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [openResolve, setOpenResolve] = useState(false);

  const [formData, setFormData] = useState({
    // ✅ classScheduleId removed — now handled per-student (array of ids)
    classScheduleIds: [],
    agentIds: [],
    feedbackType: "",
    category: "",
    notes: "",
  });

  const [categories, setCategories] = useState([
    { value: "Behavior", label: "Behavior" },
    { value: "Attendance", label: "Attendance" },
  ]);

  const categoryOptions = useMemo(() => [
    ...categories,
    { value: "add_new", label: "+ Add Category" }
  ], [categories]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // ---------------- FETCH FEEDBACK ----------------
  const fetchFeedback = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/feedback/parent/${parentAdminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!result?.status) {
        showError("Error", result.message);
        return;
      }

      setFeedbackData(result.data?.[DISPLAY_SERVICE_TYPE] || []);
    } catch (err) {
      showError("Error", err.message);
    }
  }, []);

  // ---------------- FETCH AGENTS & CLASSES ----------------
  const fetchAgentAndClasses = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/feedback/agent-classes/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!result?.status) {
        showError("Error", result.message);
        return;
      }

      setAgentAndClassesData(result.data || {});
    } catch (err) {
      showError("Error", err.message);
    }
  }, []);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    const load = async () => {
      await fetchMembers();
      await fetchFeedback();
      await fetchAgentAndClasses();
    };
    load();
  }, [fetchMembers, fetchFeedback, fetchAgentAndClasses]);

  // ✅ Build per-student class options (disabled, prefilled from profile.students)
  const studentClassOptions = useMemo(() => {
    if (!profile?.students?.length) return [];

    return profile.students.map((student) => {
      const cls = student.classSchedule;
      const clsId = student.classScheduleId || cls?.id;
      return {
        studentId: student.id,
        studentName: `${student.studentFirstName} ${student.studentLastName}`,
        classScheduleId: clsId,
        label: cls
          ? `${cls.className} (${cls.startTime} - ${cls.endTime})`
          : clsId
            ? `Class ID: ${clsId}`
            : "No class assigned",
      };
    });
  }, [profile]);

  // ✅ On form open, prefill classScheduleIds from ALL students
  useEffect(() => {
    if (openForm) {
      const ids = studentClassOptions
        .map((s) => s.classScheduleId)
        .filter(Boolean);
      setFormData((prev) => ({ ...prev, classScheduleIds: ids }));
    }
  }, [openForm, studentClassOptions]);

  const agentOptions = useMemo(() => {
    return (agentAndClassesData?.agents || []).map((agent) => ({
      value: agent.id,
      label: `${agent.firstName} ${agent.lastName}`,
    }));
  }, [agentAndClassesData]);

  const feedbackTypeOptions = [
    { value: "Positive", label: "Positive" },
    { value: "Negative", label: "Negative" },
  ];

  useEffect(() => {
    if (!openForm) {
      setIsAddingCategory(false);
      setNewCategoryName("");
    }
  }, [openForm]);

  // ---------------- HANDLERS ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCheckbox = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const isAllSelected =
    feedbackData.length > 0 && selectedUserIds.length === feedbackData.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      const allIds = feedbackData.map((user) => user.id);
      setSelectedUserIds(allIds);
    }
  };

  // ---------------- CREATE FEEDBACK ----------------
  const handleSubmit = async () => {
    const { classScheduleIds, agentIds, feedbackType, category, notes } = formData;

    if (
      !classScheduleIds?.length ||
      !agentIds ||
      agentIds.length === 0 ||
      !feedbackType ||
      !category ||
      !notes
    ) {
      return showError("Error", "All fields are required");
    }

    // ✅ Use first classScheduleId for payload (or send all if API supports array)
    const classScheduleId = classScheduleIds[0];

    const payload = {
      bookingId,
      parentAdminId: profile?.parentAdminId,           // ✅ parentAdminId from profile.parents[0].id
      classScheduleId,
      serviceType: DISPLAY_SERVICE_TYPE,
      feedbackType,
      category,
      notes,
      agentAssigned: agentIds,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/feedback/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      showSuccess("Success", result.message);
      setOpenForm(false);
      setFormData({
        classScheduleIds: [],
        agentIds: [],
        feedbackType: "",
        category: "",
        notes: "",
      });

      fetchFeedback();
    } catch (err) {
      showError("Error", err.message);
    }
  };

  const handleSave = async (id, successCallback) => {
    if (!token)
      return showError("Error", "Token not found. Please login again.");
    if (selectedAgentIds.length === 0) {
      return showWarning(
        "Agent Required",
        "Please select at least one agent before saving."
      );
    }
    const myHeaders = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });

    const payload = {
      agentAssigned: selectedAgentIds,
    };

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/feedback/resolve/${id}`,
        requestOptions
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Something went wrong");
      }

      showSuccess(
        "Updated!",
        result?.message || "Information updated successfully."
      );
      fetchFeedback();
      setShowAgentModal(false);
      setOpenResolve(false);
      setSelectedAgentIds([]);
      setResolveData('');

      if (typeof successCallback === "function") {
        successCallback(result);
      }

      return result;
    } catch (error) {
      console.error(error);
      showError(
        "Failed!",
        error.message || "Something went wrong while updating."
      );
    }
  };

  useEffect(() => {
    if (openResolve && resolveData?.assignedAgents) {
      // ✅ Use assignedAgents array from API response
      if (Array.isArray(resolveData.assignedAgents)) {
        setSelectedAgentIds(resolveData.assignedAgents.map((a) => a.id));
      } else if (resolveData.assignedAgent) {
        // fallback for single agent
        if (Array.isArray(resolveData.assignedAgent)) {
          setSelectedAgentIds(resolveData.assignedAgent.map((a) => a.id));
        } else {
          setSelectedAgentIds([resolveData.assignedAgent.id]);
        }
      }
    }
  }, [openResolve, resolveData]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div
        className={`pt-1 bg-gray-50 min-h-screen md:px-4 ${openResolve ? 'hidden' : 'block'
          }`}
      >
        <button
          onClick={() => setOpenForm(true)}
          className="bg-[#237FEA] md:absolute right-50 top-2 flex items-center gap-2 cursor-pointer text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm md:text-base font-semibold"
        >
          <img src="/members/add.png" className="w-5" alt="" />
          Add Feedback
        </button>

        {checkPermission({
          module: "account-information",
          action: "view-listing",
        }) ? (
          <div className="md:flex md:gap-6 md:mt-0 mt-5">
            <div className="transition-all duration-300 w-full">
              {feedbackData.length > 0 ? (
                <div className="overflow-auto rounded-2xl bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                      <tr className="font-semibold text-[#717073]">
                        <th className="p-4">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={toggleSelectAll}
                              className="w-5 h-5 flex items-center justify-center rounded-md border-2 border-gray-500"
                            >
                              {isAllSelected && (
                                <Check
                                  size={16}
                                  strokeWidth={3}
                                  className="text-gray-500"
                                />
                              )}
                            </button>
                            Date Submitted
                          </div>
                        </th>
                        <th className="p-4">Type of Feedback</th>
                        <th className="p-4">Venue</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Reason</th>
                        <th className="p-4">Agent Assigned</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {feedbackData.map((user, idx) => {
                        const isChecked = selectedUserIds.includes(user.id);
                        return (
                          <tr
                            key={idx}
                            className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50"
                          >
                            <td className="p-4 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleCheckbox(user.id)}
                                  className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked
                                    ? 'border-gray-500'
                                    : 'border-gray-300'
                                    }`}
                                >
                                  {isChecked && (
                                    <Check
                                      size={16}
                                      strokeWidth={3}
                                      className="text-gray-500"
                                    />
                                  )}
                                </button>
                                {formatDate(user.createdAt, false)}
                              </div>
                            </td>
                            <td className="p-4 capitalize">
                              {user?.feedbackType || '-'}
                            </td>
                            <td className="p-4">{user?.venue?.name || '-'}</td>
                            <td className="p-4 capitalize">
                              {user?.category || '-'}
                            </td>
                            <td className="p-4">{user?.notes || '-'}</td>
                            <td className="p-4">
                              {/* ✅ Read from assignedAgents array */}
                              {Array.isArray(user?.assignedAgents) &&
                                user.assignedAgents.length > 0
                                ? user.assignedAgents
                                  .map(
                                    (a) => `${a.firstName} ${a.lastName}`
                                  )
                                  .join(", ")
                                : Array.isArray(user?.assignedAgent) &&
                                  user.assignedAgent.length > 0
                                  ? user.assignedAgent
                                    .map(
                                      (a) => `${a.firstName} ${a.lastName}`
                                    )
                                    .join(", ")
                                  : user?.assignedAgent
                                    ? `${user.assignedAgent.firstName} ${user.assignedAgent.lastName}`
                                    : "-"}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <button className="text-[#EDA600] bg-[#FDF6E5] px-5 rounded-xl p-2">
                                  {user.status
                                    ?.replace(/_/g, " ")
                                    ?.toLowerCase()
                                    ?.replace(/\b\w/g, (char) =>
                                      char.toUpperCase()
                                    )}
                                </button>

                                {/* ✅ Only show Resolve button when status is "not_resolved" */}
                                {user.status === "not_resolved" && (
                                  <button
                                    onClick={() => {
                                      setOpenResolve(true);
                                      setResolveData(user);
                                    }}
                                    className="bg-[#237FEA] rounded-xl p-2 px-5 text-white"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center p-4 border-dotted border rounded-md bg-white">
                  No Data Found
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center p-6 text-red-500 font-semibold">
            Not Authorized
          </p>
        )}

        {openForm && (
          <div className="fixed inset-0 bg-[#00000047] bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[95%] md:w-[420px] md:max-h-[90vh] overflow-auto shadow-lg relative">
              <div className="flex relative justify-center items-center border-b border-[#E2E1E5] px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Add Feedback
                </h2>
                <button
                  onClick={() => setOpenForm(false)}
                  className="text-gray-500 absolute left-5 top-4 hover:text-gray-800 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* ✅ Show ALL students' classes — each prefilled and disabled */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Classes (prefilled from enrolled students)
                  </label>
                  {studentClassOptions.length > 0 ? (
                    <div className="space-y-2">
                      {studentClassOptions.map((sc, idx) => (
                        <div key={sc.studentId || idx}>
                          <p className="text-xs text-gray-500 mb-1">
                            {sc.studentName}
                          </p>
                          <Select
                            options={[{ value: sc.classScheduleId, label: sc.label }]}
                            value={{ value: sc.classScheduleId, label: sc.label }}
                            isDisabled={true}
                            className="w-full"
                            classNamePrefix="react-select"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No students found on this booking.
                    </p>
                  )}
                </div>

                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Feedback type
                  </label>
                  <Select
                    name="feedbackType"
                    options={feedbackTypeOptions}
                    placeholder="Select Type"
                    isClearable
                    isSearchable
                    value={
                      feedbackTypeOptions.find(
                        (opt) => opt.value === formData.feedbackType
                      ) || null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        feedbackType: selected?.value || "",
                      }))
                    }
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-[#282829] mb-1">
                    Category
                  </label>
                  {!isAddingCategory ? (
                    <Select
                      name="category"
                      options={categoryOptions}
                      placeholder="Select Category"
                      isClearable
                      isSearchable
                      value={
                        categoryOptions.find(
                          (opt) => opt.value === formData.category
                        ) || null
                      }
                      onChange={(selected) => {
                        if (selected?.value === "add_new") {
                          setIsAddingCategory(true);
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            category: selected?.value || "",
                          }));
                        }
                      }}
                      className="w-full"
                      classNamePrefix="react-select"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        className="w-full border border-[#E2E1E5] rounded-xl p-2 px-3 text-sm h-[38px]"
                        placeholder="Enter category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            const newOpt = {
                              value: newCategoryName,
                              label: newCategoryName,
                            };
                            setCategories((prev) => [...prev, newOpt]);
                            setFormData((prev) => ({
                              ...prev,
                              category: newCategoryName,
                            }));
                            setNewCategoryName("");
                            setIsAddingCategory(false);
                          }
                        }}
                        className="bg-[#237FEA] text-white px-3 rounded-xl text-xs font-semibold"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategoryName("");
                        }}
                        className="bg-gray-100 px-3 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-[#282829] mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full border border-[#E2E1E5] rounded-xl p-3 h-24 resize-none"
                    placeholder="Write your notes here..."
                  />
                </div>

                {/* Assign Agent — multi-select */}
                <div>
                  <label className="block text-sm font-semibold text-[#282829] mb-1">
                    Assign agent
                  </label>
                  <Select
                    name="agent"
                    options={agentOptions}
                    placeholder="Select Agent(s)"
                    isClearable
                    isSearchable
                    isMulti
                    value={agentOptions.filter((opt) =>
                      formData.agentIds.includes(opt.value)
                    )}
                    onChange={(selected) => {
                      setFormData((prev) => ({
                        ...prev,
                        agentIds: selected ? selected.map((s) => s.value) : [],
                      }));
                    }}
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setFormData({
                        classScheduleIds: [],
                        agentIds: [],
                        feedbackType: "",
                        category: "",
                        notes: "",
                      });
                      setOpenForm(false);
                    }}
                    className="px-5 py-2 rounded-xl border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-[#237FEA] text-white rounded-xl"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Detail View */}
      <div
        className={`min-h-screen bg-[#F9F9FB] flex flex-col p-4 md:p-8 ${openResolve ? 'flex' : 'hidden'
          }`}
      >
        {/* Main Card */}
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <h2
              className="text-lg font-semibold text-gray-800 flex items-center gap-2 cursor-pointer"
              onClick={() => {
                setOpenResolve(false);
                setResolveData('');
              }}
            >
              <img
                src="/images/icons/arrow-left.png"
                alt="Back"
                className="w-5 h-5 md:w-6 md:h-6"
              />
              Feedback
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Agent(s)</span>
              <span className="text-gray-800 font-semibold text-right max-w-[60%]">
                {Array.isArray(resolveData?.assignedAgents) &&
                  resolveData.assignedAgents.length > 0
                  ? resolveData.assignedAgents
                    .map((a) => `${a.firstName} ${a.lastName}`)
                    .join(", ")
                  : Array.isArray(resolveData?.assignedAgent) &&
                    resolveData.assignedAgent.length > 0
                    ? resolveData.assignedAgent
                      .map((a) => `${a.firstName} ${a.lastName}`)
                      .join(", ")
                    : resolveData?.assignedAgent
                      ? `${resolveData.assignedAgent.firstName || '-'} ${resolveData.assignedAgent.lastName || '-'
                      }`
                      : "-"}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Date submitted</span>
              <span className="text-gray-800 font-semibold">
                {formatDate(resolveData?.createdAt, true)}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Venue</span>
              <span className="text-gray-800 font-semibold">
                {resolveData?.venue?.name}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Class details</span>
              <span className="text-gray-800 font-semibold">{`${resolveData?.classSchedule?.className} (${resolveData?.classSchedule?.day} • ${resolveData?.classSchedule?.startTime} - ${resolveData?.classSchedule?.endTime})`}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Feedback type</span>
              <span className="text-gray-800 font-semibold capitalize">
                {resolveData?.feedbackType}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-800 font-semibold capitalize">
                {resolveData?.category}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Notes</span>
              <span className="text-gray-800 font-semibold max-w-[60%] text-right">
                {resolveData?.notes}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned To Card */}
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-sm mt-6 p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-gray-800 font-semibold mb-3">Assigned to</h3>
            <div className="flex flex-wrap gap-4">
              {/* ✅ Support both assignedAgents array and legacy assignedAgent */}
              {(() => {
                const agents = Array.isArray(resolveData?.assignedAgents) &&
                  resolveData.assignedAgents.length > 0
                  ? resolveData.assignedAgents
                  : Array.isArray(resolveData?.assignedAgent) &&
                    resolveData.assignedAgent.length > 0
                    ? resolveData.assignedAgent
                    : resolveData?.assignedAgent
                      ? [resolveData.assignedAgent]
                      : [];

                return agents.length > 0 ? (
                  agents.map((agent, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img
                        src={agent?.profile || '/members/dummyuser.png'}
                        alt="Agent"
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="text-gray-800 font-semibold">{`${agent?.firstName} ${agent?.lastName}`}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">-</span>
                );
              })()}
            </div>
          </div>
          <button
            onClick={() => setShowAgentModal(true)}
            className="text-[#237FEA] font-semibold mt-3 md:mt-0 hover:underline"
          >
            Change
          </button>
        </div>

        {showAgentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-gray-800 font-semibold mb-4">
                Assign Agent
              </h3>
              <Select
                options={agentOptions}
                placeholder="Select Agent(s)"
                isClearable
                isSearchable
                isMulti
                value={agentOptions.filter((opt) =>
                  selectedAgentIds.includes(opt.value)
                )}
                onChange={(selected) => {
                  setSelectedAgentIds(
                    selected ? selected.map((s) => s.value) : []
                  );
                }}
                className="w-full"
                classNamePrefix="react-select"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowAgentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => handleSave(resolveData.id)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Resolve button always visible in detail view (status already filtered in list) */}
        <div className="w-full max-w-4xl flex justify-end mt-6">
          <button
            onClick={() => handleSave(resolveData.id)}
            className="bg-[#237FEA] hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-xl"
          >
            Resolve
          </button>
        </div>
      </div>
    </>
  );
};

export default Feedback;