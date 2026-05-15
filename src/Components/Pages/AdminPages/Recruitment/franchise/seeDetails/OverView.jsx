import { useState, useCallback, useEffect } from 'react'
import { useNotification } from '../../../contexts/NotificationContext';
import { Check, Mail, MessageSquare, Search, X, Loader2 } from "lucide-react";
import { IoIosArrowDown } from "react-icons/io";
import { motion } from "framer-motion";
import { IoMdCheckmarkCircle } from "react-icons/io";
import Select from "react-select";
import { useSearchParams } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { detectCountryFromPhone, stripDialCode } from '../../../../../../utils/phoneHelper';

import { useRecruitmentTemplate } from '../../../contexts/RecruitmentContext';
import { useVenue } from '../../../contexts/VenueContext';
import Loader from '../../../contexts/Loader';
import { showConfirm, showError, showSuccess, showWarning } from '../../../../../../utils/swalHelper';
import Comments from '../../../Common/Comments';
import { useEmail } from '../../../contexts/messages/SendEmailContext';
import { useTextPopup } from '../../../contexts/messages/SendTextContext';
const dateOptions = [
  { value: "2025-01-01", label: "Jan 01 2025" },
  { value: "2025-01-02", label: "Jan 02 2025" },
];
const regionalManagerOptions = [
  { value: "manager1", label: "Manager 1" },
  { value: "manager2", label: "Manager 2" },
  { value: "manager3", label: "Manager 3" },
];

const venueOptions = [
  { value: "venue1", label: "Venue 1" },
  { value: "venue2", label: "Venue 2" },
];


const classOptions = [
  { value: "class1", label: "Class 1" },
  { value: "class2", label: "Class 2" },
];

const stats = [
  { label: "Work ethic", value: 70 },
  { label: "Funds", value: 45 },
  { label: "Passion", value: 85 },
  { label: "Funds", value: 25 },
  { label: "Work ethic", value: 70 },
  { label: "Funds", value: 10 },
];
const OverView = ({ steps, setSteps }) => {
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [telephoneCall, setTelephoneCall] = useState({
    date: "",
    time: "",
    reminder: "",
    email: "",
    scores: {
      communication: null,
      passion: null,
      experience: null,
      knowledge: null,
    },
  });
  const [recruitmentData, setRecruitmentData] = useState({
    recruitmentLeadId: 13,
    howDidYouHear: "",
    coverNote: "",
    qualifyLead: false,

    telephoneCallSetupDate: "",
    telephoneCallSetupTime: "",
    telephoneCallSetupReminder: "",
    telephoneCallSetupEmail: "",

    telePhoneCallDeliveryCommunicationSkill: "",
    telePhoneCallDeliveryPassionCoaching: "",
    telePhoneCallDeliveryExperience: "",
    telePhoneCallDeliveryKnowledgeOfSSS: "",

    location: "",
    capitalAvailable: "",
    discoveryDay: [],
  });
  const [errors, setErrors] = useState({});


  const { fetchCoachRecruitmentById, fetchFranchiseRecruitmentById, recuritmentDataById, sendOfferMail, sendFranchiseMail, rejectFranchise, createFranchiseRecruitmentById } = useRecruitmentTemplate() || {};
  const { fetchVenueNames, venues } = useVenue() || {};
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const comesfrom = searchParams.get("comesfrom");

  const [openCandidateStatusModal, setOpenCandidateStatusModal] = useState(false);
  const [openResultModal, setOpenResultModal] = useState(false);
  const [openOfferModal, setOpenOfferModal] = useState(false);
  const [openDiscoverDayModal, setOpenDiscoverDayModal] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [comment, setComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5; // Number of comments per page
  const { adminInfo } = useNotification();
  const { openEmailPopup } = useEmail();
  const { openTextPopup } = useTextPopup();
  const discoveryDayRaw = recuritmentDataById?.candidateProfile?.discoveryDay;

  // Convert string → array
  const getInitialForm = (data) => {
    if (!data) return {
      firstName: "",
      surname: "",
      status: "",
      dob: "",
      age: "",
      email: "",
      phone: "",
      discoveryDayDate: "",
      discoveryDayTime: "",
      postcode: "",
      howDidYouHear: "Indeed",
      location: "",
      capitalAvailable: "",
      ageGroup: "",
      vehicle: "",
      qualification: "",
      experience: "",
      venues: [],
      coverNote: "",
    };

    const discoveryDayRaw = data.candidateProfile?.discoveryDay;
    let discoveryDayArray = [];
    if (typeof discoveryDayRaw === "string") {
      try { discoveryDayArray = JSON.parse(discoveryDayRaw); } catch { discoveryDayArray = []; }
    } else if (Array.isArray(discoveryDayRaw)) {
      discoveryDayArray = discoveryDayRaw;
    }

    const venueWorkRaw = data.candidateProfile?.availableVenueWork;
    let parsedVenues = [];
    try {
      parsedVenues = Array.isArray(venueWorkRaw)
        ? venueWorkRaw
        : venueWorkRaw
          ? JSON.parse(venueWorkRaw)
          : [];
    } catch { parsedVenues = []; }

    let dialCode = "+44";
    let countryCode = "gb";
    let phone = data.phoneNumber || "";

    const detected = detectCountryFromPhone(phone);
    if (detected) {
      dialCode = detected.dialCode;
      countryCode = detected.countryCode;
      phone = stripDialCode(phone);
    }

    return {
      firstName: data.firstName || "",
      surname: data.lastName || "",
      status: data.status || "",
      dob: data.dob || "",
      age: data.age || "",
      email: data.email || "",
      dialCode,
      phone,
      countryCode,
      discoveryDayDate: discoveryDayArray?.[0]?.date || "",
      discoveryDayTime: discoveryDayArray?.[0]?.time || "",
      postcode: data.postcode || "",
      howDidYouHear: data.candidateProfile?.howDidYouHear || "Indeed",
      location: data.desiredFranchiseLocation || "",
      capitalAvailable: data.liquidCapital || "",
      coverNote: data.message || "",
      venues: [],
    };
  };

  // Initialize
  const [form, setForm] = useState(getInitialForm(recuritmentDataById));
  console.log(form, 'form');

  // Update whenever candidate changes
  useEffect(() => {
    if (!recuritmentDataById) return;

    setForm(getInitialForm(recuritmentDataById));

    const p = recuritmentDataById.candidateProfile;
    setTelephoneCall({
      date: p?.telephoneCallSetupDate || "",
      time: p?.telephoneCallSetupTime || "",
      reminder: p?.telephoneCallSetupReminder || "",
      email: p?.telephoneCallSetupEmail || "",
      scores: {
        telePhoneCallDeliveryCommunicationSkill: p?.telePhoneCallDeliveryCommunicationSkill ?? null,
        telePhoneCallDeliveryPassionCoaching: p?.telePhoneCallDeliveryPassionCoaching ?? null,
        telePhoneCallDeliveryExperience: p?.telePhoneCallDeliveryExperience ?? null,
        telePhoneCallDeliveryKnowledgeOfSSS: p?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
      },
    });
    setRecruitmentData({
      telephoneCallSetupDate: p?.telephoneCallSetupDate || "",
      telephoneCallSetupTime: p?.telephoneCallSetupTime || "",
      telephoneCallSetupReminder: p?.telephoneCallSetupReminder || "",
      telephoneCallSetupEmail: p?.telephoneCallSetupEmail || "",
    });
    setTelephoneCallDelivery({
      telePhoneCallDeliveryCommunicationSkill: p?.telePhoneCallDeliveryCommunicationSkill ?? null,
      telePhoneCallDeliveryPassionCoaching: p?.telePhoneCallDeliveryPassionCoaching ?? null,
      telePhoneCallDeliveryExperience: p?.telePhoneCallDeliveryExperience ?? null,
      telePhoneCallDeliveryKnowledgeOfSSS: p?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
    });
  }, [recuritmentDataById]);


  const recruitedMode = form.status?.toLowerCase() === "recruited";


  // Pagination calculations
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(commentsList.length / commentsPerPage);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.floor((now - past) / 1000); // in seconds

    if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;

    // fallback: return exact date if older than 7 days
    return past.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const goToPage = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  const fetchComments = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/comment/list?commentType=recruitment&serviceType=recruitment&commentByRecruitmentLead=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setCommentsList(result);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      showError("Error", "Failed to fetch comments. Please try again later.");
    }
  }, [API_BASE_URL, id]);

  const handleSubmitComment = async (e) => {
    const token = localStorage.getItem("adminToken");
    e.preventDefault();

    if (!comment.trim() || !id) return;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);

    const raw = JSON.stringify({
      "comment": comment,
      "commentType": "recruitment",
      "serviceType": "recruitment",
      "commentByRecruitmentLead": Number(id)
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      setLoadingComment(true);

      const response = await fetch(`${API_BASE_URL}/api/admin/comment/create`, requestOptions);

      const result = await response.json();

      if (!response.ok) {
        showError("Error", "Failed to Add Comment");
        return;
      }

      setComment('');
      fetchComments();
    } catch (error) {
      console.error("Error creating comment:", error);
      showError("Error", "Network Error");
    } finally {
      setLoadingComment(false);
    }
  }

  const handleSendEmail = () => {
    if (form.email) {
      const token = localStorage.getItem("adminToken");
      openEmailPopup(
        [form.email],
        "/api/admin/send-manual-email",
        { token, showError, showSuccess }
      );
    } else {
      showWarning("No Email Found", "This candidate does not have a valid email address.");
    }
  };

  const handleSendText = () => {
    if (form.phone) {
      const recipient = {
        name: `${form.firstName || ""} ${form.surname || ""}`.trim(),
        phone: recuritmentDataById.phoneNumber
      };
      const token = localStorage.getItem("adminToken");
      openTextPopup(
        [recipient],
        "/api/admin/send-manual-text",
        { token, showError, showSuccess }
      );
    } else {
      showWarning("No Phone Number", "This candidate does not have a valid phone number.");
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleDateChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedVenueNames = (venues || [])
    .filter(v => form.venues?.includes(v.id))
    .map(v => v.name);
  const handleVenueChange = (id) => {
    setForm((prev) => ({
      ...prev,
      venues: prev.venues.includes(id)
        ? prev.venues.filter((x) => x !== id)
        : [...prev.venues, id],
    }));
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "recruited":
        return "text-[#34AE56] bg-[#E5F2EA]";
      case "pending":
        return "text-[#B38F00] bg-[#FFF7CC]";   // yellow tone
      case "rejected":
        return "text-[#D11A2A] bg-[#FFE5E8]";   // red tone
      default:
        return "text-gray-600 bg-gray-200";
    }
  };

  // steps 



  const enableNextStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id + 1
          ? { ...step, isEnabled: true }
          : step
      )
    );
  };

  const updateStepStatus = (id, status) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.id === id) {
          return {
            ...step,
            status,
            isOpen: false,
          };
        }
        return step;
      })
    );

    enableNextStep(id);
  };


  useEffect(() => {
    setSteps(prev =>
      prev.map(step => {
        // 1️⃣ Edit mode OFF → everything disabled
        if (!editMode) {
          // console.log(`🔒 Step ${step.id} disabled → editMode is OFF`);
          return { ...step, isEnabled: false };
        }

        // 2️⃣ Step 1 is always enabled in edit mode
        if (step.id === 1) {
          // console.log(`✅ Step 1 enabled → base step in editMode`);
          return { ...step, isEnabled: true };
        }

        // 3️⃣ Completed or skipped steps remain enabled
        if (step.status === "completed" || step.status === "skipped") {
          // console.log(
          //   `✅ Step ${step.id} enabled → status is ${step.status}`
          // );
          return { ...step, isEnabled: true };
        }

        // 4️⃣ All other steps disabled
        // console.log(
        //   `⛔ Step ${step.id} disabled → not completed/skipped`,
        //   { status: step.status }
        // );

        return { ...step, isEnabled: false };
      })
    );
  }, [editMode]);



  const [telephoneCallDelivery, setTelephoneCallDelivery] = useState({
    telePhoneCallDeliveryCommunicationSkill: null,
    telePhoneCallDeliveryPassionCoaching: null,
    telePhoneCallDeliveryExperience: null,
    telePhoneCallDeliveryKnowledgeOfSSS: null,
  });
  const scoreKeyMap = {
    "Communication skill": "telePhoneCallDeliveryCommunicationSkill",
    "Passion for coaching": "telePhoneCallDeliveryPassionCoaching",
    "Experience": "telePhoneCallDeliveryExperience",
    "Knowledge of SSS": "telePhoneCallDeliveryKnowledgeOfSSS",
  };
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // await fetchComments();
      await fetchFranchiseRecruitmentById(id);
      await fetchVenueNames();
      setLoading(false);
    };


    if (id) init();
  }, [id, fetchFranchiseRecruitmentById, fetchComments, fetchVenueNames]);
  const [payload, setPayload] = useState({
    qualifyLead: null,

    telephoneCallSetupDate: null,
    telephoneCallSetupTime: null,
    telephoneCallSetupReminder: null,
    telephoneCallSetupEmail: null,

    telePhoneCallDeliveryCommunicationSkill: null,
    telePhoneCallDeliveryPassionCoaching: null,
    telePhoneCallDeliveryExperience: null,
    telePhoneCallDeliveryKnowledgeOfSSS: null,
  });


  // ✅ will re-run if data changes
  useEffect(() => {
    const p = recuritmentDataById?.candidateProfile;

    if (!p) {
      setSteps(prev =>
        prev.map(step => ({
          ...step,
          status: "pending",
          isEnabled: step.id === 1,
          resultPercent: undefined,
          resultStatus: undefined,
        }))
      );
      return;
    }

    setSteps(prev =>
      prev.map(step => {
        const isStep1Done = !!p.qualifyLead;
        const isStep2Done = !!p.telephoneCallSetupDate?.trim();
        const isStep3Done = !!p.telePhoneCallDeliveryCommunicationSkill;
        const isStep4Done = (p.discoveryDay && JSON.parse(p.discoveryDay || "[]").length > 0);
        const isStep5Done = !!p.result;

        let isEnabled = false;
        switch (step.id) {
          case 1:
            isEnabled = true;
            break;
          case 2:
            isEnabled = isStep1Done;
            break;
          case 3:
            isEnabled = isStep2Done;
            break;
          case 4:
            isEnabled = isStep3Done;
            break;
          case 5:
            isEnabled = isStep4Done;
            break;
          default:
            isEnabled = false;
        }

        switch (step.id) {
          case 1:
            return { ...step, status: isStep1Done ? "completed" : "pending", isEnabled };
          case 2:
            return {
              ...step,
              status: isStep2Done ? "completed" : "pending",
              isEnabled
            };
          case 3:
            return {
              ...step,
              status: isStep3Done ? "completed" : "pending",
              isEnabled
            };
          case 4:
            return {
              ...step,
              status: isStep4Done ? "completed" : "pending",
              isEnabled
            };
          case 5:
            if (isStep5Done) {
              return {
                ...step,
                status: "completed",
                resultPercent: recuritmentDataById.telephoneCallScorePercentage + "%",
                resultStatus: p.result === "passed" ? "Passed" : "Failed",
                isEnabled,
              };
            } else {
              return { ...step, status: "pending", isEnabled };
            }
          default:
            return step;
        }
      })
    );

    // Sync other states
    setTelephoneCall({
      date: p.telephoneCallSetupDate || "",
      time: p.telephoneCallSetupTime || "",
      reminder: p.telephoneCallSetupReminder || "",
      email: p.telephoneCallSetupEmail || "",
      scores: {
        communication: p.telePhoneCallDeliveryCommunicationSkill,
        passion: p.telePhoneCallDeliveryPassionCoaching,
        experience: p.telePhoneCallDeliveryExperience,
        knowledge: p.telePhoneCallDeliveryKnowledgeOfSSS,
      },
    });

    setTelephoneCallDelivery({
      telePhoneCallDeliveryCommunicationSkill: p.telePhoneCallDeliveryCommunicationSkill,
      telePhoneCallDeliveryPassionCoaching: p.telePhoneCallDeliveryPassionCoaching,
      telePhoneCallDeliveryExperience: p.telePhoneCallDeliveryExperience,
      telePhoneCallDeliveryKnowledgeOfSSS: p.telePhoneCallDeliveryKnowledgeOfSSS,
    });

    setPayload({
      qualifyLead: p.qualifyLead,
      telephoneCallSetupDate: p.telephoneCallSetupDate,
      telephoneCallSetupTime: p.telephoneCallSetupTime,
      telephoneCallSetupReminder: p.telephoneCallSetupReminder,
      telephoneCallSetupEmail: p.telephoneCallSetupEmail,
      telePhoneCallDeliveryCommunicationSkill: p.telePhoneCallDeliveryCommunicationSkill,
      telePhoneCallDeliveryPassionCoaching: p.telePhoneCallDeliveryPassionCoaching,
      telePhoneCallDeliveryExperience: p.telePhoneCallDeliveryExperience,
      telePhoneCallDeliveryKnowledgeOfSSS: p.telePhoneCallDeliveryKnowledgeOfSSS,
    });
  }, [recuritmentDataById]);


  const handleSendOfferMail = async (id) => {
    await sendOfferMail(id);
    setOpenOfferModal(false);
  };
  const handleSendFranchiseMail = async (id) => {
    const result = await showConfirm("Are you sure?", "Do you want to send the franchise mail?");
    if (result.isConfirmed) {
      await sendFranchiseMail(id);
    }

  };
  const handleRejectFranchise = async (id) => {
    const result = await showConfirm("Are you sure?", "Do you want to Reject this Candidate ?");

    if (result.isConfirmed) {
      await rejectFranchise(id);

    }
  };
  const submitScorecard = () => {
    const {
      telePhoneCallDeliveryCommunicationSkill,
      telePhoneCallDeliveryPassionCoaching,
      telePhoneCallDeliveryExperience,
      telePhoneCallDeliveryKnowledgeOfSSS
    } = telephoneCallDelivery;

    const newErrors = {};
    if (telePhoneCallDeliveryCommunicationSkill === null) newErrors.communication = "Rating required";
    if (telePhoneCallDeliveryPassionCoaching === null) newErrors.passion = "Rating required";
    if (telePhoneCallDeliveryExperience === null) newErrors.experience = "Rating required";
    if (telePhoneCallDeliveryKnowledgeOfSSS === null) newErrors.knowledge = "Rating required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setPayload(prev => ({ ...prev, ...telephoneCallDelivery }));

    updateStepStatus(3, "completed");
    toggleStep(3, "completed");
    setRateOpen(false);
  };
  const updateRecruitment = (key, value) => {
    setRecruitmentData(prev => ({ ...prev, [key]: value }));
  };

  // Toggle completion on click
  const toggleStep = (id, newStatus) => {
    setSteps((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((s) => s.id === id);

      updated[index].status = newStatus;

      // enable next step only when current is completed
      if (newStatus === "completed" && updated[index + 1]) {
        updated[index + 1].isEnabled = true;
      }

      // if skipped — block next step
      if (newStatus === "skipped" && updated[index + 1]) {
        updated[index + 1].isEnabled = false;
      }

      // if unskip, go back to pending
      if (newStatus === "pending") {
        if (index > 0) {
          updated[index].isEnabled = updated[index - 1].status === "completed";
        }
      }
      if (id === 1) {
        setPayload(prev => ({
          ...prev,
          qualifyLead: newStatus === "completed" ? true : null,
        }));
      }
      return updated;
    });
  };

  //steps
  const toggleOpenStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id
          ? { ...step, isOpen: !step.isOpen }
          : step
      )
    );
  };
  const confirmTelephoneCall = () => {
    const newErrors = {};
    if (!telephoneCall.date) newErrors.date = "Date is required";
    if (!telephoneCall.time) newErrors.time = "Time is required";
    if (!telephoneCall.reminder) newErrors.reminder = "Reminder is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setPayload(prev => ({
      ...prev,
      telephoneCallSetupDate: telephoneCall.date,
      telephoneCallSetupTime: telephoneCall.time,
      telephoneCallSetupReminder: telephoneCall.reminder,
      telephoneCallSetupEmail: telephoneCall.email,
    }));
    toggleOpenStep(2);
    toggleStep(2, "completed");
  };
  const handleSubmit = async () => {
    if (isSubmitting) return;

    const result = await showConfirm(
      "Are you sure?",
      "Please confirm updating this recruitment lead.",
      "Yes, Update Lead"
    );

    if (!result.isConfirmed) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("adminToken");
      const payloadMain = {
        recruitmentLeadId: Number(id),
        qualifyLead: !!payload.qualifyLead,

        telephoneCallSetupDate: telephoneCall.date,
        telephoneCallSetupTime: telephoneCall.time,
        telephoneCallSetupReminder: telephoneCall.reminder,

        telePhoneCallDeliveryCommunicationSkill: telephoneCallDelivery.telePhoneCallDeliveryCommunicationSkill,
        telePhoneCallDeliveryPassionCoaching: telephoneCallDelivery.telePhoneCallDeliveryPassionCoaching,
        telePhoneCallDeliveryExperience: telephoneCallDelivery.telePhoneCallDeliveryExperience,
        telePhoneCallDeliveryKnowledgeOfSSS: telephoneCallDelivery.telePhoneCallDeliveryKnowledgeOfSSS,

        discoveryDay: [
          {
            date: form.discoveryDayDate,
            time: form.discoveryDayTime,
          },
        ],
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/franchise/candidate-profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadMain),
      });

      const resultData = await response.json();

      if (!response.ok) {
        showError("Error", resultData.message || "Failed to update profile");
        return;
      }

      showSuccess("Success", "Recruitment profile updated successfully");
      fetchFranchiseRecruitmentById(id);
    } catch (error) {
      console.error("Submit failed:", error);
      showError("Error", "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log("form data steps", steps);
  if (loading) return <Loader />;

  return (
    <>
      <button
        className={`p-3 capitalize font-bold px-10 absolute right-0 top-0 rounded-2xl ${getStatusStyles(form.status)}`}
      >
        {form.status}
      </button>
      <div className='flex gap-8'>
        <div className="md:w-8/12">

          {/* Section: Candidate Information */}
          <div className="bg-white  rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-[24px]">Candidate Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">First Name</label>
                <input type="text"
                  disabled={!!form.firstName}
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="Tom" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Surname</label>
                <input type="text"
                  disabled={!!form.surname}
                  value={form.surname}
                  onChange={(e) => handleChange("surname", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="John" />
              </div>

              {/* <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Date of Birth</label>
                <input type="date"
                  disabled={!!form.dob}
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Age</label>
                <input type="number"
                  disabled={!!form.age}
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="25" />
              </div> */}

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Email</label>
                <input type="email"
                  disabled={!!form.email}
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="email@gmail.com" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Phone number</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3">
                  <PhoneInput
                    country={form.countryCode || "gb"}
                    value={form.dialCode}
                    disableDropdown={true}
                    disableCountryCode={false}
                    countryCodeEditable={false}
                    inputStyle={{
                      width: "0px",
                      maxWidth: '20px',
                      height: "0px",
                      opacity: 0,
                      pointerEvents: "none", // ✅ prevents blocking typing
                      position: "absolute",
                    }}
                    buttonClass="!bg-white !border-none !p-0"
                  />
                  <input type="text"
                    disabled={!!form.phone}
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="border-none w-full focus:outline-none" placeholder="+91" />
                </div>
              </div>

              {/* <div className="space-y-1">
                <label className="text-[16px] font-semibold block">London Postcode</label>
                <input type="text"
                  disabled={!!form.postcode}
                  value={form.postcode}
                  onChange={(e) => handleChange("postcode", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="SW15 0AB" />
              </div> */}

              <div className="space-y-1 col-span-2">
                <label className="text-[16px] font-semibold block">How did you hear about us?</label>
                <select value={form.howDidYouHear}
                  disabled={!!form.howDidYouHear}
                  onChange={(e) => handleChange("howDidYouHear", e.target.value)}
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3">
                  <option value="Google">Google</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Friend">Friend</option>
                  <option value="Flyer">Flyer</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section: Job Specifications */}

          <div className="bg-white my-5 rounded-2xl p-6 ">

            <h2 className="font-semibold text-[24px] pb-3">Franchise specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Location</label>
                <input type="text"
                  value={form.location}
                  disabled
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="input border border-[#E2E1E5] bg-gray-100 cursor-not-allowed rounded-xl w-full p-3" placeholder="Chelesa" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Capital available</label>
                <textarea
                  disabled
                  value={form.capitalAvailable}
                  onChange={(e) => handleChange("capitalAvailable", e.target.value)}
                  className="input border border-[#E2E1E5] bg-gray-100 cursor-not-allowed rounded-xl w-full p-3 h-24 resize-none"
                  placeholder="Capital available"
                />
              </div>

            </div>
          </div>


          {/* Section: Further Details */}
          <div className="bg-white  rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[24px]">Details</h2>

            <label className="font-semibold text-sm">
              Cover Note
            </label>

            <textarea
              name="coverNote" value={form.coverNote}
              disabled
              onChange={(e) => handleChange("coverNote", e.target.value)} className="input mt-1 border border-[#E2E1E5] bg-gray-100 cursor-not-allowed rounded-xl w-full p-3 h-32 resize-none"
              placeholder="Cover Note"
            ></textarea>
          </div>



          {/* comments */}

          <Comments
            adminInfo={adminInfo}
            comment={comment}
            setComment={setComment}
            handleSubmitComment={handleSubmitComment}
            loadingComment={loadingComment}
            commentsList={commentsList}
            currentComments={currentComments}
            formatTimeAgo={formatTimeAgo}
          />
        </div>

        <div className="md:w-4/12  space-y-6">

          {/* MAIN CARD */}
          <div className="bg-white p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-semibold">Recruitment status</h2>

            {/* TIMELINE */}
            <div className="relative pl-6 space-y-10">
              <div className="absolute left-[17px] top-1 bottom-6 border-l border-gray-300" />

              {steps.map((step) => {
                const disabled =
                  !recruitedMode && !step.isEnabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "";

                return (
                  <div key={step.id} className={`relative ps-[20px] ${disabled}`}>
                    {/* DOT */}
                    <div
                      className={`absolute -left-3 top-1 w-3 h-3 rounded-full ${step.status === "completed" ? "bg-black" : "bg-gray-300"
                        }`}
                    />

                    {/* HEADER */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        {step.id === 4 && form.discoveryDayDate && (
                          <p className="text-gray-400 text-sm">{form.discoveryDayDate}</p>
                        )}
                      </div>

                      {step.status !== "completed" && (
                        <button
                          disabled={recruitedMode}
                          className="text-gray-400 text-sm"
                          onClick={() => toggleStep(step.id, "skipped")}
                        >
                          Skip
                        </button>
                      )}

                      {step.status === "skipped" && step.isEnabled && (
                        <button
                          disabled={recruitedMode}
                          className="text-blue-600 text-sm"
                          onClick={() => toggleStep(step.id, "pending")}
                        >
                          Unskip
                        </button>
                      )}
                    </div>

                    {/* ACTION BUTTONS (QUALIFY STEP) */}
                    {step.actionType === "buttons" && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          disabled={recruitedMode}
                          className={`w-8 h-8 border rounded-lg ${step.status === "skipped"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-500"
                            }`}
                          onClick={() => toggleStep(step.id, "skipped")}
                        >
                          ✕
                        </button>

                        <button
                          disabled={recruitedMode}
                          className={`w-8 h-8 rounded-lg ${step.status === "completed"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                          onClick={() => toggleStep(step.id, "completed")}
                        >
                          ✓
                        </button>
                      </div>
                    )}

                    {/* PRIMARY STEP BUTTON */}
                    {step.buttonText && (
                      <button
                        className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm"
                        onClick={() => {
                          if (step.id === 2) toggleOpenStep(step.id);
                          if (step.id === 3) setRateOpen(true);
                          if (step.id === 4) setOpenDiscoverDayModal(true);
                        }}
                      >
                        {step.buttonText}
                        {step.id === 2 && <IoIosArrowDown />}
                      </button>
                    )}

                    {/* STEP 2 — TELEPHONE CALL */}
                    {step.id === 2 && step.isOpen && step.isEnabled && (
                      <div className="bg-gray-50 rounded-xl p-4 mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col">
                            <input
                              type="date"
                              disabled={recruitedMode}
                              value={telephoneCall.date}
                              className={`border rounded-xl p-2 ${errors.date ? "border-[#F04438]" : ""}`}
                              onChange={(e) => {
                                setTelephoneCall({ ...telephoneCall, date: e.target.value });
                                setErrors(prev => ({ ...prev, date: "" }));
                              }}
                            />
                            {errors.date && <span className="text-[#F04438] text-xs mt-1">{errors.date}</span>}
                          </div>

                          <div className="flex flex-col">
                            <input
                              type="time"
                              disabled={recruitedMode}
                              value={telephoneCall.time}
                              className={`border rounded-xl p-2 ${errors.time ? "border-[#F04438]" : ""}`}
                              onChange={(e) => {
                                setTelephoneCall({ ...telephoneCall, time: e.target.value });
                                setErrors(prev => ({ ...prev, time: "" }));
                              }}
                            />
                            {errors.time && <span className="text-[#F04438] text-xs mt-1">{errors.time}</span>}
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <select
                            disabled={recruitedMode}
                            value={telephoneCall.reminder}
                            className={`border rounded-xl p-2 w-full bg-white ${errors.reminder ? "border-[#F04438]" : ""}`}
                            onChange={(e) => {
                              setTelephoneCall({ ...telephoneCall, reminder: e.target.value });
                              setErrors(prev => ({ ...prev, reminder: "" }));
                            }}
                          >
                            <option value="">When do you want to be reminded?</option>
                            <option value="10 min before">10 min before</option>
                            <option value="30 min before">30 min before</option>
                            <option value="1 hour before">1 hour before</option>
                            <option value="1 day before">1 day before</option>
                          </select>
                          {errors.reminder && <span className="text-[#F04438] text-xs mt-1">{errors.reminder}</span>}
                        </div>

                        <button
                          disabled={recruitedMode}
                          className="w-full bg-blue-600 text-white py-2 rounded-xl"
                          onClick={confirmTelephoneCall}
                        >
                          Confirm Call
                        </button>
                      </div>
                    )}

                    {/* RESULTS */}
                    {step.resultPercent && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm">
                          {step.resultPercent}
                        </span>

                        <span className="text-[#027A48] font-semibold text-sm">
                          ✓ {step.resultStatus}
                        </span>

                        <button
                          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm"
                          onClick={() => setOpenResultModal(true)}
                        >
                          See Results
                        </button>

                        <button
                          className="bg-[#027A48] text-white px-3 py-2 rounded-xl text-sm"
                          onClick={() => setOpenOfferModal(true)}
                        >
                          Send Offer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>


          </div>

          <div className="bg-white p-6 rounded-2xl ">
            <h2 className="font-semibold mb-4 text-[22px] text-gray-800">
              Recruitment status
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {stats.map((item, index) => (
                <Circle key={index} label={item.label} value={item.value} />
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl  space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSendEmail} className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <Mail size={18} /> <span>Send Email</span>
              </button>

              <button onClick={handleSendText} className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <MessageSquare size={18} /> <span>Send Text</span>
              </button>
            </div>

            {/* <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Invite to CoachPro
            </button> */}
            {/* onClick={() => setOpenCandidateStatusModal(true)} */}
            {form.status !== "rejected" && (
              <button
                onClick={() => handleRejectFranchise(id)}
                className="w-full bg-[#237FEA] text-white py-3 rounded-xl"
              >
                Reject Candidate
              </button>
            )}

            {/* <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Add to Pathway Course
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Withdraw employment
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Rebook for practical assessment
            </button> */}

          </div>
        </div>


        {/* call rate modal */}
        {rateOpen && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-4xl shadow-xl  overflow-hidden "
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Interview Questions & Call Scorecard</h2>
                <button
                  onClick={() => setRateOpen(false)}
                  className="absolute top-0 right-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              {/* Left Section */}
              <div className='flex items-center justify-center'>
                <div className="md:w-8/12 h-[80vh] overflow-y-auto p-6 border-r border-gray-200">

                  {/* Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-[#E2E1E5]  pb-4">
                      <span className="text-[#237FEA]"><img src="/reportsIcons/rate.png" className='w-7' alt="" /></span> Title Name
                    </h3>
                    <ul className="mt-4 space-y-4">
                      <li className="flex items-start gap-2">
                        <span className="text-[#027A48] text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <p className='font-semibold text-[16px]'>Check they are free and in a quiet space for the call</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#027A48] text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Give them break down for the call</p>
                          <ul className=" list-disc text-gray-600 mt-2">
                            <li className='list-none'>(A) Explain 2 steps recruitment process</li>
                            <li className='list-none'>(B) Housekeeping</li>
                            <li className='list-none'>(C) Interview Q</li>
                            <li className='list-none'>(D) Address any question they have</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#027A48] text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Process</p>
                          <span className="text-[#027A48]">2 steps</span>
                          <ul className=" list-disc text-gray-600 mt-2">
                            <li className='list-none'>(A) Phone call</li>
                            <li className='list-none'>(B) Practical assessment - taking place next week and week after</li>
                          </ul>
                          <p className="text-black underline cursor-pointer mt-2">Any questions?</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#027A48] text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Title Name</p>
                          <span className="text-[#027A48]">2 steps</span>
                          <ul className=" list-disc text-gray-600 mt-2">
                            <li className='list-none'>(A) Phone call</li>
                            <li className='list-none'>(B) Practical assessment - taking place next week and week after</li>
                          </ul>
                          <p className="text-black underline cursor-pointer mt-2">Any questions?</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Section 2 */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-[#E2E1E5]  pb-4">
                      <span className="text-[#237FEA]"><img src="/reportsIcons/rate.png" className='w-7' alt="" /></span> Title Name
                    </h3>
                    <div className="mt-4">
                      <div className="flex items-start gap-2">
                        <span className="text-[#027A48] text-xl"><IoMdCheckmarkCircle />
                        </span>

                        <div>
                          <span>Housekeeping</span>
                          <ul className=" list-disc p-0 text-gray-600 mt-2">
                            <li className='list-none'>(A) Check all info on their form is correct</li>
                            <li className='list-none'>(B) Go through venues and ask if they are available for any more if chosen are not available</li>
                          </ul>
                          <div className="mt-6">
                            <p className="font-semibold">Questions</p>
                            <p className="text-[#494949] mt-1">What do you know about SSS?</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Section - Scorecard */}
                <div className="w-4/12 h-[80vh] overflow-y-auto p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Call Scorecard</h3>

                    {["Communication skill", "Passion for coaching", "Experience", "Knowledge of SSS"].map((label) => (
                      <div key={label} className="mb-6">
                        <p className="font-semibold mb-2 text-[#494949]">{label}</p>
                        <div className="flex gap-4 text-[#494949] flex-wrap">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <label key={num} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={label}
                                value={num}
                                checked={telephoneCallDelivery[scoreKeyMap[label]] === num}
                                onChange={() => {
                                  setTelephoneCallDelivery(prev => ({
                                    ...prev,
                                    [scoreKeyMap[label]]: num
                                  }));
                                  setErrors(prev => ({ ...prev, [label.split(' ')[0].toLowerCase()]: "" }));
                                }}
                              />{" "}
                              {num}
                            </label>
                          ))}
                        </div>
                        {errors[label.split(' ')[0].toLowerCase()] && <p className="text-[#F04438] text-xs mt-1">{errors[label.split(' ')[0].toLowerCase()]}</p>}
                      </div>
                    ))}
                  </div>

                  <button disabled={form.status == 'recruited'} onClick={submitScorecard}
                    className="bg-[#237FEA] text-white py-3 rounded-xl w-full font-semibold hover:bg-blue-700 transition-all">
                    Submit
                  </button>
                </div>
              </div>
              {/* Close Button */}

            </motion.div>
          </div >
        )}

        {/* reject/accept modal */}
        {openCandidateStatusModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-xl shadow-xl  overflow-hidden "
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Book Practical Assessment</h2>
                <button
                  onClick={() => setOpenCandidateStatusModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form action="" className='p-6'>
                <div className='mb-3'>
                  <label htmlFor="" className='text-black font-semibold text-[16px] mb-2 block'>Venue</label>
                  <input type="text" className='border border-[#E2E1E5]  w-full rounded-2xl p-3' />
                </div>
                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Class
                  </label>
                  <Select
                    options={classOptions}
                    placeholder="Select Class"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Date
                  </label>
                  <Select
                    options={dateOptions}
                    placeholder="Select Date"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className='mb-3'>
                  <label htmlFor="" className='text-black font-semibold text-[16px] mb-2 block'>Assign To Venue Manager</label>
                  <Select
                    options={venueOptions}
                    placeholder="Venue Manager"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-12">
                  <button type='button' className='w-full p-3 border border-[#E2E1E5]  text-[#717073] font-semibold rounded-2xl'>Cancel</button>
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Send Confirmation</button>
                </div>
              </form>


            </motion.div>
          </div >
        )}

        {/* result modal */}
        {openResultModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Result</h2>
                <button
                  onClick={() => setOpenResultModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form action="" className='p-6'>
                <div className='mb-3'>
                  <label htmlFor="" className='text-black font-semibold text-[16px] mb-2 block'>Venue</label>
                  <input type="text" className='border border-[#E2E1E5]  w-full rounded-2xl p-3' />
                </div>



                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Class
                  </label>
                  <Select
                    options={classOptions}
                    placeholder="Select Class"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Date
                  </label>
                  <Select
                    options={dateOptions}
                    placeholder="Select Date"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Regional Manager
                  </label>

                  <Select
                    options={regionalManagerOptions}
                    placeholder="Select Regional Manager"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-6">Call Scorecard</h3>

                  {[
                    "Punctuality of the coach",
                    "Status of the campus",
                    "Punctuality of the coach"
                  ].map((label) => (
                    <div key={label} className="mb-6">
                      <p className="font-semibold mb-2 text-[#494949]">{label}</p>
                      <div className="flex gap-4 text-[#494949]">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <label key={num} className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name={label} value={num} /> {num}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Watch Video</button>
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Play Audio Summary</button>
                </div>
              </form>


            </motion.div>
          </div >
        )}
        {/* tick offer modal */}
        {openOfferModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full p-5 max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Send Franchise Provisional Offer</h2>
                <button
                  onClick={() => setOpenOfferModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <h5 className="text-center py-5 font-semibold">Send a provision offer to prospect lead.</h5>


              <button type='submit' onClick={() => handleSendOfferMail(id)}
                className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Send Email Offer</button>




            </motion.div>
          </div >
        )}
        {openDiscoverDayModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Discovery day</h2>

                <button
                  onClick={() => setOpenDiscoverDayModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const newErrors = {};
                  if (!form.discoveryDayDate) newErrors.discoveryDate = "Date is required";
                  if (!form.discoveryDayTime) newErrors.discoveryTime = "Time is required";

                  if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    return;
                  }

                  setErrors({});
                  updateStepStatus(4, "completed");
                  setOpenDiscoverDayModal(false);
                }}
                className="p-6"
              >
                <fieldset disabled={form.status === "recruited"}>
                  <div className="mb-3 relative">
                    <label className="text-black font-semibold text-[16px] mb-2 block">
                      Date
                    </label>
                    <input
                      type="date"
                      name="discoveryDayDate"          // 👈 add this
                      value={form.discoveryDayDate}
                      onChange={(e) => {
                        handleDateChange("discoveryDayDate", e.target.value);
                        setErrors(prev => ({ ...prev, discoveryDate: "" }));
                      }}
                      className={`border ${errors.discoveryDate ? "border-[#F04438]" : "#E2E1E5"} w-full rounded-2xl p-3`}
                    />
                    {errors.discoveryDate && <p className="text-[#F04438] text-xs mt-1">{errors.discoveryDate}</p>}
                  </div>

                  <div className="mb-3">
                    <label className="text-black font-semibold text-[16px] mb-2 block">
                      Time
                    </label>
                    <input
                      type="time"
                      name="discoveryDayTime"          // 👈 add this
                      value={form.discoveryDayTime}
                      onChange={(e) => {
                        handleDateChange("discoveryDayTime", e.target.value);
                        setErrors(prev => ({ ...prev, discoveryTime: "" }));
                      }}

                      className={`border ${errors.discoveryTime ? "border-[#F04438]" : "#E2E1E5"} w-full rounded-2xl p-3`}
                    />
                    {errors.discoveryTime && <p className="text-[#F04438] text-xs mt-1">{errors.discoveryTime}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => setOpenDiscoverDayModal(false)}
                      className="w-full p-3 border border-[#E2E1E5] text-[#717073] font-semibold rounded-2xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={form.status == 'recruited'}
                      type="submit"
                      className={`w-full p-3 border border-[#E2E1E5] ${form.status == 'recruited' ? "opacity-60 cursor-not-allowed" : ""} bg-[#237FEA] text-white font-semibold rounded-2xl`}
                    >
                      {isSubmitting ? "Submitting..." : "Book"}
                    </button>
                  </div>
                </fieldset>
              </form>



            </motion.div>
          </div >
        )}

      </div >
    </>
  )
}

export default OverView
const Circle = ({ label, value }) => {
  return (
    <div className="flex flex-col items-center my-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#1A73E8 ${value * 3.6}deg, #E5E7EB 0deg)`
        }}
      >
        <div className="w-14 h-14 bg-white rounded-full"></div>
      </div>

      <p className="mt-2 text-gray-600 text-sm">{label}</p>
      <p className="text-lg font-semibold">{value}%</p>
    </div>
  );
};
