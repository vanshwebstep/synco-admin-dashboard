import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Check, X } from 'lucide-react';
import { useLocation } from "react-router-dom";
import { useClassSchedule } from '../../../../../contexts/ClassScheduleContent';

const ViewSessions = () => {
  const tabs = ['Members', 'Trials', 'Coaches'];
  const location = useLocation();
  const { cancelClass, fetchCancelledClass, createClassSchedules, updateClassSchedules, fetchClassSchedulesID, singleClassSchedules, classSchedules, loading, deleteClassSchedule } = useClassSchedule()
  const [activeTab, setActiveTab] = useState('Members');
  const [rolesData, setRolesData] = useState({
    Members: { subject: "", emailBody: "", deliveryMethod: "Email", templateKey: "cancel_member" },
    Trials: { subject: "", emailBody: "", deliveryMethod: "Email", templateKey: "cancel_trialist" },
    Coaches: { subject: "", emailBody: "", deliveryMethod: "Email", templateKey: "cancel_coach" },
  });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [attendance, setAttendance] = useState([true, false, true]);
  const [reasonForCancelling, setReasonForCancelling] = useState('');
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [creditMembers, setcreditMembers] = useState(true);
  const [notifyTrialists, setnotifyTrialists] = useState(true);
  const [notifyCoaches, setNotifyCoaches] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const token = localStorage.getItem("adminToken");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [messageType, setMessageType] = useState('Email');
  const [subject, setSubject] = useState('Class cancellation');
  const [emailText, setEmailText] = useState('');

  const navigate = useNavigate();
  const { schedule, sessionId, classScheduleId, statusIs, cancelSession, sessionDate } = location.state || {};
  console.log('sessionId', sessionId)
  console.log("Filtered Schedules in cancessl:", cancelSession);

  useEffect(() => {
    if (cancelSession && Object.keys(cancelSession).length > 0) {
      // Prefill basic fields
      setReasonForCancelling(cancelSession.reasonForCancelling || "");
      setNotifyMembers(cancelSession.notifyMembers === "Yes");
      setcreditMembers(cancelSession.creditMembers === "Yes");
      setnotifyTrialists(cancelSession.notifyTrialists === "Yes");
      setNotifyCoaches(cancelSession.notifyCoaches === "Yes");

      // Parse notifications JSON
      const parsedNotifications = JSON.parse(cancelSession.notifications || "[]");

      const newRolesData = { ...rolesData };

      const roleMap = {
        Member: "Members",
        Trialist: "Trials",
        Coach: "Coaches"
      };

      parsedNotifications.forEach((n) => {
        const key = roleMap[n.role];
        if (key) {
          newRolesData[key] = {
            ...newRolesData[key],
            subject: n.subjectLine || "",
            emailBody: n.emailBody || "",
            deliveryMethod: n.deliveryMethod || "Email",
          };
        }
      });

      setRolesData(newRolesData);
    }
  }, [cancelSession]);

  console.log("Selected Category ID:", selectedCategoryId);


  function formatDate(isoDate) {
    const date = new Date(isoDate);

    // useEffect(() => {
    //   const fetchData = async () => {
    //     // await fetchClassSchedulesID(schedule.id);
    //   };

    //   fetchData();
    // }, [schedule.id]);
    // Day names
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[date.getUTCDay()];

    // Date with ordinal suffix
    const day = date.getUTCDate();
    const ordinal = (d) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const dayWithOrdinal = `${day}${ordinal(day)}`;

    // Month names
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = months[date.getUTCMonth()];

    const year = date.getUTCFullYear();

    return `${dayName} ${dayWithOrdinal} ${monthName} ${year}`;
  }

  const toggleAttendance = (index, status) => {
    const updated = [...attendance];
    updated[index] = status;
    setAttendance(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setSubmitLoading(true); // ✅ Start loading

    try {
      const roles = Object.entries(rolesData).map(([tab, data]) => {
        let notifyType = "Member";
        if (tab === "Trials") notifyType = "Trialist";
        if (tab === "Coaches") notifyType = "Coach";

        return {
          notifyType,
          subjectLine: data.subject,
          emailBody: data.emailBody,
          deliveryMethod: data.deliveryMethod,
          templateKey: data.templateKey,
        };
      });

      console.log("Final roles payload:", { roles });

      // Gather all data
      const payload = {
        templateCategoryId: selectedCategoryId,
        reasonForCancelling,
        notifyMembers: notifyMembers ? "Yes" : "No",
        creditMembers: creditMembers ? "Yes" : "No",
        notifyTrialists: notifyTrialists ? "Yes" : "No",
        notifyCoaches: notifyCoaches ? "Yes" : "No",
        roles,
      };

      console.log("Cancellation Payload:", schedule.id, schedule, sessionId, payload);

      await cancelClass(schedule.id, sessionId, payload, schedule.venueId); // ✅ await API call
    } catch (error) {
      console.error("Error cancelling class:", error);
    } finally {
      setSubmitLoading(false); // ✅ Stop loading regardless of success/failure
    }
  };
  console.log('cancelSession', cancelSession)
  const isCancel = cancelSession && Object.keys(cancelSession).length > 0;
  
const handleReasonChange = async (value) => {
  // ✅ state update
  setReasonForCancelling(value);

  // ✅ parent change → child reset
  setSelectedTemplate(null);
  setSelectedCategoryId(null);
  setTemplates([]);

  // ✅ subject + body bhi reset karo (important)
  setRolesData({
    ...rolesData,
    [activeTab]: {
      ...rolesData[activeTab],
      subject: "",
      emailBody: ""
    }
  });

  // ❌ agar empty select hai toh API call mat karo
  if (!value) return;

  // 🔥 mapping
  const categoryMap = {
    Weather: "weather",
    Illness: "illness",
    "Unavailable Venue": "venue",
    Other: "other",
  };

  const category = categoryMap[value];

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/holiday/custom-template/by-category?category=${category}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (result.status) {
      const type =
        rolesData[activeTab].deliveryMethod === "Email"
          ? "email"
          : "text";

      const templateList = result.data[type]?.[0]?.templates || [];

      setTemplates(templateList);
    }
  } catch (err) {
    console.error("API Error:", err);
  }
};
  console.log('isCancel', isCancel)
  const handleDeliveryChange = (type) => {
    setRolesData({
      ...rolesData,
      [activeTab]: {
        ...rolesData[activeTab],
        deliveryMethod: type
      }
    });

    // re-filter templates
    if (apiResponse) {
      const list = apiResponse.data[type.toLowerCase()]?.[0]?.templates || [];
      setTemplates(list);
    }
  };
  return (
    <div className="p-4 md:p-6 bg-gray-50 ">
      <div className="flex justify-between items-start md:items-center mb-6">
        <h2
          onClick={() => navigate(`/configuration/weekly-classes/venues/class-schedule?id=${schedule.venueId}`)}
          className="text-xl md:text-[28px] font-semibold flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img src="/images/icons/arrow-left.png" alt="Back" className="w-6 h-6" />
          <span>Cancel Class</span>
        </h2>
      </div>

      <div className="bg-white rounded-3xl shadow p-4 md:p-6 flex flex-col md:flex-row gap-6">
        {/* Left - Cancellation Summary */}
        <div
          className={`
                            w-full md:w-2/12  py-6 rounded-2xl text-center
                                ${statusIs === "cancelled" ? "bg-[#f8f8f8]" : ""}
                                ${statusIs === "complete" ? "bg-[#f8f8f8]" : ""}
                                ${statusIs !== "cancelled" && statusIs !== "complete" ? "bg-[#f8f8f8]" : ""}
                            `}
        >
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
            {statusIs === "cancelled" ? (
              <img src="/images/icons/cancelBig.png" alt="Cancelled" />
            ) : statusIs === "complete" ? (
              <img src="/images/icons/completeBig.png" alt="Complete" />
            ) : (
              <img src="/images/icons/pendingBig.png" alt="Pending" />
            )}
          </div>
          <p className="text-base font-semibold mb-4 border-b border-gray-300 pb-4 capitalize">{statusIs}</p>
          <div className="text-sm text-left px-6 text-gray-700 space-y-3">
            <p><strong>Venue</strong><br />{schedule?.venue?.name}</p>
            <p><strong>Class</strong><br />{schedule?.className}</p>
            <p><strong>Date</strong><br />{formatDate(sessionDate)}</p>
            <p><strong>Time</strong><br />{schedule?.startTime} - {schedule?.endTime}</p>
          </div>
        </div>

        {/* Right - Form Section */}
        <div className="w-full md:w-10/12 space-y-6 px-4 md:px-0">
          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Form Area */}
            <div className="space-y-4">
              <div>
                <label className="block text-[18px] font-semibold mb-2">
                  Reason for cancelling
                </label>

                <select
                  value={reasonForCancelling}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  disabled={isCancel}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select reason</option>
                  <option value="Weather">Weather</option>
                  <option value="Illness">Illness</option>
                  <option value="Unavailable Venue">Unavailable Venue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-[18px]">Would you like to notify members?</p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={notifyMembers} onChange={() => setNotifyMembers(true)} /> Yes</label>
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={!notifyMembers} onChange={() => setNotifyMembers(false)} /> No</label>
                </div>

                <p className="mt-3 font-semibold text-[18px]">Credit members 1 session?</p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={creditMembers} onChange={() => setcreditMembers(true)} /> Yes</label>
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={!creditMembers} onChange={() => setcreditMembers(false)} /> No</label>
                </div>

                <p className="mt-3 font-semibold text-[18px]">Would you like to notify trialists?</p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={notifyTrialists} onChange={() => setnotifyTrialists(true)} /> Yes</label>
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={!notifyTrialists} onChange={() => setnotifyTrialists(false)} /> No</label>
                </div>

                <p className="mt-3 font-semibold text-[18px]">Would you like to notify coaches?</p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={notifyCoaches} onChange={() => setNotifyCoaches(true)} /> Yes</label>
                  <label className='text-[18px]'><input type="radio" disabled={isCancel} checked={!notifyCoaches} onChange={() => setNotifyCoaches(false)} /> No</label>
                </div>
              </div>
            </div>

            {/* Right Email Content */}
            <div className="space-y-4">
              <div className="flex flex-wrap p-1 rounded-xl mb-4 w-fit">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 border-b text-sm md:text-base min-w-24 font-semibold text-[18px] transition ${activeTab === tab ? 'border-blue-500' : 'text-gray-500 border-b border-gray-200 hover:text-blue-500'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="block text-sm md:text-base font-semibold">Select cancellation template</label>
               <select
  className="w-full border border-gray-300 rounded-lg px-3 py-2"
  onChange={(e) => {
    const value = e.target.value;

    if (!value) {
      // ❌ deselect case (Select Template)
      setSelectedTemplate(null);
      setSelectedCategoryId(null);

      setRolesData({
        ...rolesData,
        [activeTab]: {
          ...rolesData[activeTab],
          subject: "",
          emailBody: ""
        }
      });

      return;
    }

    const selected = templates.find(t => t.id === Number(value));
    console.log("Selected Template:", selected);

    if (selected) {
      setSelectedTemplate(selected);

      const parsedId = selected.id;
      setSelectedCategoryId(parsedId);

      setRolesData({
        ...rolesData,
        [activeTab]: {
          ...rolesData[activeTab],
          subject: selected.content.subject || "",
          // emailBody: selected.content.htmlContent || ""
        }
      });
    }
  }}
>
                  <option value="">Select Template</option>

                  {templates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>

                <label className="block text-sm md:text-base font-semibold mt-2">Subject Line</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-3"
                  readOnly={isCancel}
                  value={rolesData[activeTab].subject}
                  onChange={(e) =>
                    setRolesData({
                      ...rolesData,
                      [activeTab]: { ...rolesData[activeTab], subject: e.target.value }
                    })
                  }
                />
                {rolesData[activeTab].deliveryMethod === 'Text' ? 'Text' : 'Email'}
                <textarea
                  readOnly={isCancel}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 h-60"
                  value={rolesData[activeTab].emailBody}
                  onChange={(e) =>
                    setRolesData({
                      ...rolesData,
                      [activeTab]: { ...rolesData[activeTab], emailBody: e.target.value }
                    })
                  }
                />

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                  <label>
                    <input
                      type="radio"
                      checked={rolesData[activeTab].deliveryMethod === "Email"}
                      onChange={() => handleDeliveryChange("Email")}
                    />Email
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={rolesData[activeTab].deliveryMethod === "Text"}
                      onChange={() => handleDeliveryChange("Text")}
                    />Text
                  </label>
                </div>

                <div className="text-end ">
                  <button
                    onClick={handleSubmit}
                    disabled={submitLoading || isCancel}  // 🚫 disable if loading OR already cancelled
                    className={`mt-4 w-full md:w-auto text-sm md:text-base px-6 py-3 md:px-20 rounded-lg 
    ${(submitLoading || isCancel)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 cursor-pointer text-white"}
  `}
                  >
                    {isCancel
                      ? "Already cancelled"
                      : submitLoading
                        ? "Sending..."
                        : "Send"}
                  </button>



                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ViewSessions;
