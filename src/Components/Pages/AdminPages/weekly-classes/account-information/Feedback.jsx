import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";
import { useMembers } from '../../contexts/MemberContext';
import Loader from '../../contexts/Loader';
import { usePermission } from '../../Common/permission';
import { useAccountsInfo } from '../../contexts/AccountsInfoContext';
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import { showSuccess, showError, showWarning } from '../../../../../utils/swalHelper';

import { useMemo } from "react";
const Feedback = ({ profile }) => {
  const { checkPermission } = usePermission();
  const [openResolve, setOpenResolve] = useState(null);
  const [resolveData, setResolveData] = useState([]);
  const [agentAndClassesData, setAgentAndClassesData] = useState('');
  const token = localStorage.getItem("adminToken");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [errors, setErrors] = useState({});
  console.log('resolveData', resolveData)
  const [formData, setFormData] = useState({
    className: "",
    agentIds: [],
    classScheduleId: null,
    feedbackType: "",
    category: "",
    notes: "",
    agent: "",
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
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("serviceType");
  const bookingId = searchParams.get("id");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { fetchMembers, loading } = useMembers();
  const SERVICE_TYPE_MAP = {
    membership: "weekly class membership",
    trials: "weekly class trial",
    oneToOne: "one to one",
    birthdayParty: "birthday party",
    holidayCamps: "holiday camp",
  };
  const BOOKING_ID_KEY_MAP = {
    membership: "bookingId",
    trials: "bookingId",
    holidayCamps: "holidayBookingId",
    oneToOne: "oneToOneBookingId",
    birthdayParty: "birthdayPartyBookingId",
  };
  const CLASSSCHEDULE_ID_KEY_MAP = {
    membership: "classScheduleId",
    trials: "classScheduleId",
    holidayCamps: "holidayClassScheduleId",
    oneToOne: "classScheduleId",
    birthdayParty: "classScheduleId",
  };
  const serviceParam = searchParams.get("serviceType");
  const serviceKey = SERVICE_TYPE_MAP[serviceParam];

  const fetchFeedback = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback/parent/${profile?.parentAdminId || profile?.booking?.id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const resultRaw = await response.json();

      if (!resultRaw?.status) {
        showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching Feedback.");
        return;
      }



      // 👇 set only matched feedback array
      setFeedbackData(
        serviceKey ? resultRaw.data?.[serviceKey] || [] : []
      );

    } catch (error) {
      showError("Fetch Failed", error.message || "Something went wrong while fetching account information.");
    } finally {
    }
  }, [API_BASE_URL, profile, serviceKey]);

  const fetchAgentAndClasses = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      // 🔑 API SWITCH BASED ON serviceType
      const apiUrl =
        serviceType === "holidayCamps"
          ? `${API_BASE_URL}/api/admin/feedback/agent-holiday-classes/list`
          : `${API_BASE_URL}/api/admin/feedback/agent-classes/list`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resultRaw = await response.json();

      if (!resultRaw?.status) {
        showError("Fetch Failed", resultRaw.message || "Something went wrong while fetching Feedback.");
        return;
      }

      setAgentAndClassesData(resultRaw.data || []);
    } catch (error) {
      showError("Fetch Failed", error.message || "Something went wrong while fetching account information.");
    }
  }, [API_BASE_URL, serviceType]);
  // ✅ stable forever

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const toggleCheckbox = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };
  const isAllSelected = feedbackData.length > 0 && selectedUserIds.length === feedbackData.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      const allIds = feedbackData.map((user) => user.id);
      setSelectedUserIds(allIds);
    }
  };

  const displayServiceType = SERVICE_TYPE_MAP[serviceType] || "Unknown";


  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      await fetchMembers();
      await fetchFeedback();
      await fetchAgentAndClasses();
    };

    loadData();
  }, [fetchMembers, fetchFeedback, fetchAgentAndClasses]);

  const classOptions = useMemo(() => {
    const schedules =
      serviceType === "holidayCamps"
        ? agentAndClassesData?.holidayClassSchedules
        : agentAndClassesData?.classSchedules;

    const options = (schedules || []).map((cls) => {
      // 🔹 Holiday Camp label
      if (serviceType === "holidayCamps") {
        return {
          value: cls.id,
          label: `${cls.className} (${cls.startTime} - ${cls.endTime}) • ${cls.holidayVenue?.name}`,
          className: cls.className,
        };
      }

      // 🔹 Weekly / normal class label
      return {
        value: cls.id,
        label: `${cls.className} (${cls.day} • ${cls.startTime} - ${cls.endTime})`,
        className: cls.className,
      };
    });

    if (profile?.students) {
      profile.students.forEach((student) => {
        const clsId = student.classScheduleId || student.classSchedule?.id;
        const cls = student.classSchedule;
        if (clsId && !options.some((opt) => opt.value === clsId)) {
          options.push({
            value: clsId,
            label: cls
              ? `${cls.className} (${cls.startTime} - ${cls.endTime})`
              : `Class ID: ${clsId}`,
          });
        }
      });
    }

    const rootClsId = profile?.classScheduleId || profile?.classSchedule?.id;
    const rootCls = profile?.classSchedule;
    if (rootClsId && !options.some(opt => opt.value === rootClsId)) {
      options.push({
        value: rootClsId,
        label: rootCls
          ? `${rootCls.className} (${rootCls.startTime} - ${rootCls.endTime})`
          : `Class ID: ${rootClsId}`,
      });
    }

    return options;
  }, [agentAndClassesData, serviceType, profile]);

  const studentClassOptions = useMemo(() => {
    if (!profile?.students) return [];
    return profile.students.map((student) => {
      const clsId = student.classScheduleId || student.classSchedule?.id;
      const cls = student.classSchedule;
      return {
        studentId: student.id,
        studentName: `${student.studentFirstName} ${student.studentLastName}`,
        classScheduleId: clsId,
        label: cls
          ? `${cls.className} (${cls.startTime} - ${cls.endTime})`
          : `Class ID: ${clsId}`,
      };
    }).filter(s => s.classScheduleId);
  }, [profile]);

  useEffect(() => {
    if (openForm) {
      const ids = studentClassOptions.map((s) => s.classScheduleId).filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        classScheduleIds: [...new Set(ids)], // Use array for consistency
        classScheduleId: ids[0] || null,    // Keep for legacy if needed
      }));
    }
  }, [openForm, studentClassOptions]);


  const agentOptions = useMemo(() => {
    return (agentAndClassesData?.agents || []).map((agent) => ({
      value: agent.id,
      label: `${agent.firstName} ${agent.lastName}`,
      email: agent.email,
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
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async () => {
    const { classScheduleId, agentIds, feedbackType, category, notes } = formData;

    const isClassRequired = serviceParam !== "oneToOne" && serviceParam !== "birthdayParty";

    const newErrors = {};
    if (isClassRequired && !classScheduleId) {
      newErrors.classScheduleId = "Class is required";
    }
    if (!feedbackType) {
      newErrors.feedbackType = "Feedback type is required";
    }
    if (!category) {
      newErrors.category = "Category is required";
    }
    if (!notes?.trim()) {
      newErrors.notes = "Notes are required";
    }
    if (!agentIds || agentIds.length === 0) {
      newErrors.agentIds = "At least one agent must be assigned";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCreateLoading(true);

    const payload = {
      [BOOKING_ID_KEY_MAP[serviceParam]]: bookingId,
      [CLASSSCHEDULE_ID_KEY_MAP[serviceParam]]: formData.classScheduleId,
      serviceType: displayServiceType,
      classScheduleId: classScheduleId,
      feedbackType: formData.feedbackType,
      category: formData.category,
      parentAdminId: profile?.parentAdminId || profile?.booking?.id,
      notes: formData.notes,
      agentAssigned: agentIds,
    };
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Feedback");
      }

      await showSuccess("Success!", result.message || "Feedback has been created successfully.");
      setFormData({
        className: "",
        agentIds: [],
        classScheduleId: null,
        feedbackType: "",
        category: "",
        notes: "",
        agent: "",
      });
      setOpenForm(false);

      return result;

    } catch (error) {
      await showError("Error", error.message || "Something went wrong while creating feedback.");
      throw error;
    } finally {
      fetchFeedback();
      setCreateLoading(false);
    }
  };

  const handleSave = async (id, successCallback) => {
    if (!token) return showError("Error", "Token not found. Please login again.");
    if (selectedAgentIds.length === 0) {
      return showWarning(
        "Agent Required",
        "Please select at least one agent before saving."
      );
    }
    const myHeaders = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
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
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback/resolve/${id}`, requestOptions);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Something went wrong");
      }

      showSuccess("Updated!", result?.message || "Information updated successfully.");
      fetchFeedback();
      setShowAgentModal(false)
      setOpenResolve(false);
      setSelectedAgentIds([]);
      setResolveData('');
      if (typeof successCallback === "function") {
        successCallback(result);
      }

      return result;
    } catch (error) {
      showError("Failed!", error.message || "Something went wrong while updating.");
    }
  };


  useEffect(() => {
    if (openResolve && resolveData?.assignedAgent) {
      if (Array.isArray(resolveData.assignedAgent)) {
        setSelectedAgentIds(resolveData.assignedAgent.map(a => a.id));
      } else {
        setSelectedAgentIds([resolveData.assignedAgent.id]);
      }
    }
  }, [openResolve, resolveData]);
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
  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }

  return (
    <>
      <div className={`pt-1 bg-gray-50 min-h-screen md:px-4 ${openResolve ? 'hidden' : 'block'}`}>

        {checkPermission(
          { module: "member", action: "create" }) && (
            <button
              onClick={() => setOpenForm(true)}
              className="bg-[#237FEA] md:absolute right-50 top-3 flex items-center gap-2 cursor-pointer text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm md:text-base font-semibold"
            >
              <img src="/members/add.png" className="w-5" alt="" />
              Add Feedback
            </button>
          )}

        {checkPermission({ module: "account-information", action: "view-listing" }) ? (
          <div className="md:flex md:gap-6 md:mt-0 mt-5">

            <div className={`transition-all duration-300 w-full`}>

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
                              {isAllSelected && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                            </button>
                            Date Submmited
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
                          <tr key={idx} className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50">
                            <td className="p-4 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleCheckbox(user.id)}
                                  className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? 'border-gray-500' : 'border-gray-300'}`}
                                >
                                  {isChecked && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                                </button>

                                {formatDate(user.createdAt, false)}
                              </div>
                            </td>
                            <td className="p-4 capitalize" >{user?.feedbackType || '-'}</td>
                            <td className="p-4" > {serviceParam === "holidayCamps"
                              ? user?.holidayVenue?.name || "-"
                              : user?.venue?.name || "-"}</td>
                            <td className="p-4 capitalize" >{user?.category || '-'}</td>
                            <td className="p-4" >{user?.notes || '-'}
                            </td>
                            <td className="p-4" >
                              {Array.isArray(user?.assignedAgents) && user.assignedAgents.length > 0
                                ? user.assignedAgents.map(a => `${a.firstName} ${a.lastName}`).join(", ")
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
                                    ?.replace(/\b\w/g, (char) => char.toUpperCase())}
                                </button>

                                {user.status === "not_resolved" && (
                                  <button onClick={() => {
                                    setOpenResolve(true);
                                    setResolveData(user)
                                  }} className='bg-[#237FEA] rounded-xl p-2 px-5  text-white'>
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
                <p className="text-center p-4 border-dotted border rounded-md bg-white">No Data Found</p>
              )}
            </div>


          </div>
        ) : (
          <p className="text-center p-6 text-[#F04438] font-semibold">
            Not Authorized
          </p>
        )}

        {openForm && (
          <div className="fixed inset-0 bg-[#00000047] bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[95%] md:w-[420px] md:max-h-[90vh] overflow-auto shadow-lg relative">
              <div className="flex relative justify-center items-center border-b border-[#E2E1E5] px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">Add Feedback</h2>
                <button
                  onClick={() => setOpenForm(false)}
                  className="text-gray-500 absolute left-5 top-4  hover:text-gray-800 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Select Class */}
                {serviceParam !== "oneToOne" && serviceParam !== "birthdayParty" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Classes (prefilled from enrolled students)
                    </label>
                    {studentClassOptions.length > 0 ? (
                      <div className="space-y-2">
                        {studentClassOptions.map((sc, idx) => (
                          <div key={sc.studentId || idx}>
                            <p className="text-xs text-gray-500 mb-1">{sc.studentName}</p>
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
                      <>
                        <Select
                          options={classOptions}
                          placeholder="Select Class"
                          isSearchable
                          isClearable
                          value={classOptions.find(opt => opt.value === formData.classScheduleId) || null}
                          onChange={(selected) => {
                            setFormData(prev => ({ ...prev, classScheduleId: selected?.value || null }));
                            if (errors.classScheduleId) {
                              setErrors(prev => ({ ...prev, classScheduleId: null }));
                            }
                          }}
                          className="w-full"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: errors.classScheduleId ? '#ef4444' : base.borderColor,
                              '&:hover': {
                                borderColor: errors.classScheduleId ? '#ef4444' : base.borderColor,
                              }
                            })
                          }}
                        />
                        {errors.classScheduleId && (
                          <p className="text-[#F04438] text-xs mt-1">{errors.classScheduleId}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

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
                    onChange={(selected) => {
                      setFormData((prev) => ({
                        ...prev,
                        feedbackType: selected?.value || "",
                      }));
                      if (errors.feedbackType) {
                        setErrors(prev => ({ ...prev, feedbackType: null }));
                      }
                    }}
                    className="w-full"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: errors.feedbackType ? '#ef4444' : base.borderColor,
                        '&:hover': {
                          borderColor: errors.feedbackType ? '#ef4444' : base.borderColor,
                        }
                      })
                    }}
                  />
                  {errors.feedbackType && (
                    <p className="text-[#F04438] text-xs mt-1">{errors.feedbackType}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-[#282829] mb-1">
                    Category
                  </label>
                  {!isAddingCategory ? (
                    <>
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
                            if (errors.category) {
                              setErrors(prev => ({ ...prev, category: null }));
                            }
                          }
                        }}
                        className="w-full"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: errors.category ? '#ef4444' : base.borderColor,
                            '&:hover': {
                              borderColor: errors.category ? '#ef4444' : base.borderColor,
                            }
                          })
                        }}
                      />
                      {errors.category && (
                        <p className="text-[#F04438] text-xs mt-1">{errors.category}</p>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        className={`w-full border ${errors.category ? 'border-[#F04438]' : 'border-[#E2E1E5]'} rounded-xl p-2 px-3 text-sm h-[38px]`}
                        placeholder="Enter category"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          if (errors.category) {
                            setErrors(prev => ({ ...prev, category: null }));
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            const newOpt = { value: newCategoryName, label: newCategoryName };
                            setCategories(prev => [...prev, newOpt]);
                            setFormData(prev => ({ ...prev, category: newCategoryName }));
                            setNewCategoryName("");
                            setIsAddingCategory(false);
                            if (errors.category) {
                              setErrors(prev => ({ ...prev, category: null }));
                            }
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
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.notes) {
                        setErrors(prev => ({ ...prev, notes: null }));
                      }
                    }}
                    className={`w-full border ${errors.notes ? 'border-[#F04438]' : 'border-[#E2E1E5]'} rounded-xl p-3 h-24 resize-none`}
                    placeholder="Write your notes here..."
                  />
                  {errors.notes && (
                    <p className="text-[#F04438] text-xs mt-1">{errors.notes}</p>
                  )}
                </div>

                {/* Assign Agent */}
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
                    value={agentOptions.filter(opt => formData.agentIds.includes(opt.value))}
                    onChange={(selected) => {
                      setFormData((prev) => ({
                        ...prev,
                        agentIds: selected ? selected.map(s => s.value) : [],
                      }));
                      if (errors.agentIds) {
                        setErrors(prev => ({ ...prev, agentIds: null }));
                      }
                    }}
                    className="w-full"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: errors.agentIds ? '#ef4444' : base.borderColor,
                        '&:hover': {
                          borderColor: errors.agentIds ? '#ef4444' : base.borderColor,
                        }
                      })
                    }}
                  />
                  {errors.agentIds && (
                    <p className="text-[#F04438] text-xs mt-1">{errors.agentIds}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setFormData({
                        className: "",
                        agentIds: [],
                        classScheduleId: null,
                        feedbackType: "",
                        category: "",
                        notes: "",
                        agent: "",
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
      <div className={`min-h-screen bg-[#F9F9FB] flex flex-col  p-4 md:p-8 ${openResolve ? 'flex' : 'hidden'}`}>
        {/* Main Card */}
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-sm p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">


            <h2
              className='text-lg font-semibold text-gray-800 flex items-center gap-2 '
              onClick={() => {
                setOpenResolve(false);
                setResolveData('');
              }}>
              <img
                src="/images/icons/arrow-left.png"
                alt="Back"
                className="w-5 h-5 md:w-6 md:h-6"
              />
              Feedback
            </h2>
          </div>

          {/* Feedback Info Table */}
          <div className="divide-y divide-gray-200">
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Agent(s)</span>
              <span className="text-gray-800 font-semibold text-right max-w-[60%]">
                {Array.isArray(resolveData?.assignedAgents)
                  ? resolveData.assignedAgents.map(a => `${a.firstName} ${a.lastName}`).join(", ")
                  : resolveData?.assignedAgents
                    ? `${resolveData.assignedAgents.firstName} ${resolveData.assignedAgents.lastName}`
                    : "-"}
              </span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Date submitted</span>
              <span className="text-gray-800 font-semibold">{formatDate(resolveData?.createdAt, true)}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Venue</span>
              <span className="text-gray-800 font-semibold">{serviceParam === "holidayCamps"
                ? resolveData?.holidayVenue?.name || "-"
                : resolveData?.venue?.name || "-"}</span>
            </div>
            {serviceParam !== "oneToOne" && serviceParam !== "birthdayParty" && (
              <div className="flex justify-between py-3 text-sm md:text-base">
                <span className="text-gray-500">Class details</span>
                <span className="text-gray-800 font-semibold">
                  {serviceParam === "holidayCamps"
                    ? `${resolveData?.holidayClassSchedule?.className} (${resolveData?.holidayClassSchedule?.startTime} - ${resolveData?.holidayClassSchedule?.endTime})`
                    : `${resolveData?.classSchedule?.className} (${resolveData?.classSchedule?.day} • ${resolveData?.classSchedule?.startTime} - ${resolveData?.classSchedule?.endTime})`}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Feedback type</span>
              <span className="text-gray-800 font-semibold capitalize">{resolveData?.feedbackType}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-800 font-semibold capitalize">{resolveData?.category}</span>
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
              {Array.isArray(resolveData?.assignedAgents) && resolveData.assignedAgents.length > 0 ? (
                resolveData.assignedAgents.map((agent, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={agent?.profile || '/members/dummyuser.png'}
                      alt="Agent"
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="text-gray-800 font-semibold">{`${agent?.firstName} ${agent?.lastName}`}</span>
                  </div>
                ))
              ) : resolveData?.assignedAgents ? (
                <div className="flex items-center gap-3">
                  <img
                    src={resolveData.assignedAgents.profile || '/members/dummyuser.png'}
                    alt="Agent"
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-gray-800 font-semibold">{`${resolveData.assignedAgents.firstName} ${resolveData.assignedAgents.lastName}`}</span>
                </div>
              ) : (
                <span className="text-gray-500">-</span>
              )}
            </div>
          </div>
          <button onClick={() => setShowAgentModal(true)} className="text-[#237FEA] font-semibold mt-3 md:mt-0 hover:underline">
            Change
          </button>
        </div>
        {showAgentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-gray-800 font-semibold mb-4">Assign Agent</h3>
              <Select
                options={agentOptions}
                placeholder="Select Agent(s)"
                isClearable
                isSearchable
                isMulti
                value={agentOptions.filter(opt => selectedAgentIds.includes(opt.value))}
                onChange={(selected) => {
                  setSelectedAgentIds(selected ? selected.map(s => s.value) : []);
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
                  onClick={() => handleSave(resolveData.id)}                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Resolve Button */}
        <div className="w-full max-w-4xl flex justify-end mt-6">
          <button onClick={() => handleSave(resolveData.id)} className="bg-[#237FEA] hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-xl">
            Resolve
          </button>
        </div>
      </div>

    </>

  );
};

export default Feedback;
