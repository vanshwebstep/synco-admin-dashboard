import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from "react-router-dom";
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";


import { useNotification } from '../../../contexts/NotificationContext';
import { Check, Mail, MessageSquare, Search, Loader2 } from "lucide-react";
import { IoIosArrowDown } from "react-icons/io";
import { motion } from "framer-motion";
import { IoMdCheckmarkCircle } from "react-icons/io";
import Select from "react-select";
import DatePicker from "react-datepicker";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { detectCountryFromPhone, stripDialCode } from '../../../../../../utils/phoneHelper';
import { useRecruitmentTemplate } from '../../../contexts/RecruitmentContext';
import { useVenue } from '../../../contexts/VenueContext';
import Loader from '../../../contexts/Loader';
import { showConfirm, showError, showWarning, showSuccess } from '../../../../../../utils/swalHelper';
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
const payRateOptions = [
  { value: "10", label: "₹10 / hr" },
  { value: "20", label: "₹20 / hr" },
  { value: "30", label: "₹30 / hr" },
];




pdfMake.vfs = vfsFonts.vfs;
const CandidateInfo = ({ steps, setSteps }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [classOptions, setClassOptions] = useState([]);

  const { openEmailPopup } = useEmail();
  const { openTextPopup } = useTextPopup();
  const [telephoneCallDelivery, setTelephoneCallDelivery] = useState({
    telePhoneCallDeliveryCommunicationSkill: null,
    telePhoneCallDeliveryPassionCoaching: null,
    telePhoneCallDeliveryExperience: null,
    telePhoneCallDeliveryKnowledgeOfSSS: null,
  });
  const [venueState, setVenueState] = useState("");

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [venueManager, setVenueManager] = useState(null);
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
  const scoreKeyMap = {
    "Communication skill": "telePhoneCallDeliveryCommunicationSkill",
    "Passion for coaching": "telePhoneCallDeliveryPassionCoaching",
    "Experience": "telePhoneCallDeliveryExperience",
    "Knowledge of SSS": "telePhoneCallDeliveryKnowledgeOfSSS",
  };
  const [rateOpen, setRateOpen] = useState(false);
  const [openCandidateStatusModal, setOpenCandidateStatusModal] = useState(false);
  const { fetchCoachRecruitmentById, fetchVenueManagerRecruitmentById, recuritmentDataById, fetchAllRecruitmentById, rejectCoach, sendCoachMail, createCoachRecruitmentById, createVenuManagerRecruitmentById } = useRecruitmentTemplate() || {};
  const { fetchVenueNames, venues, fetchAssignedVenueNames, assignedVenues } = useVenue() || {};

  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");   // 👉 this gives "7"
  const comesfrom = searchParams.get("comesfrom");   // 👉 this gives "7"


  const [openResultModal, setOpenResultModal] = useState(false);
  const [openOfferModal, setOpenOfferModal] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [comment, setComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5; // Number of comments per page
  const { adminInfo } = useNotification();

  const ageGroupOptions = ["5-7 Years", "4-5 years", "8-10 Years", "11-13 Years", "14-16 Years", "17+ Years"];

  const qualificationOptions = ["FA Level 1", "FA Level 2", "DBS (within the year)", "Futsal Level 1", "UEFA B", "First Aid (within 2 years)"];

  const experienceOptions = ["1 year", "2 years", "3 years", "4 years", "5 years", "More than 5 years"];

  const heardFromOptions = ["Indeed", "Facebook", "Google", "Referral", "Other"];

  // const [venues, setVenues] = useState([]);

  const getInitialForm = (data, parsedVenues = []) => {
    // ⛔ When API data is not ready
    if (!data) {
      return {
        firstName: "",
        surname: "",
        status: "",
        dob: "",
        age: "",
        email: "",
        phone: "",
        postcode: "",
        heardFrom: "Indeed",

        ageGroup: "",
        vehicle: "",
        qualification: [],
        experience: "",
        venues: [],
        coverNote: "",
      };
    }

    let parsedQualification = [];
    if (data.candidateProfile?.whichQualificationYouHave) {
      try {
        const qArr = JSON.parse(data.candidateProfile.whichQualificationYouHave);
        parsedQualification = Array.isArray(qArr) ? qArr : [qArr];
      } catch (e) {
        parsedQualification = [data.candidateProfile.whichQualificationYouHave];
      }
    }

    let parsedAgeGroup = [];
    if (data.candidateProfile?.ageGroupExperience) {
      try {
        const agArr = JSON.parse(data.candidateProfile.ageGroupExperience);
        parsedAgeGroup = Array.isArray(agArr) ? agArr : [agArr];
      } catch (e) {
        parsedAgeGroup = [data.candidateProfile.ageGroupExperience];
      }
    }

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
      postcode: data.postcode || "",
      heardFrom: data.candidateProfile?.howDidYouHear || "Indeed",

      ageGroup: parsedAgeGroup || [],
      vehicle:
        data.candidateProfile?.accessToOwnVehicle === true
          ? "Yes"
          : data.candidateProfile?.accessToOwnVehicle === false
            ? "No"
            : "",
      qualification: parsedQualification || [],
      experience: data.candidateProfile?.footballExperience || "",
      venues: parsedVenues || [],
      coverNote: data.candidateProfile?.coverNote || "",
    };
  };
  const [form, setForm] = useState(() => getInitialForm(recuritmentDataById));

  useEffect(() => {
    if (recuritmentDataById) {
      setForm(getInitialForm(recuritmentDataById));
    }
  }, [recuritmentDataById]);


  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const selectedVenueNames = venues
    .filter(v => form.venues.includes(v.id))
    .map(v => v.id);
  const handleVenueChange = (id) => {
    setForm((prev) => ({
      ...prev,
      venues: prev.venues.includes(id)
        ? prev.venues.filter((x) => x !== id)
        : [...prev.venues, id],
    }));
  };


  useEffect(() => {
    if (!venueState) {
      setClassOptions([]);
      setSelectedClass(null);
      return;
    }

    // Find the selected venue
    const selectedVenue = venues.find((v) => v.id === parseInt(venueState));

    // Map classSchedules to react-select options
    if (selectedVenue && selectedVenue.classSchedules) {
      const options = selectedVenue.classSchedules.map((cls) => ({
        value: cls.id,
        label: cls.className,
      }));
      setClassOptions(options);
      setSelectedClass(null);
      setSelectedClass(
        options.find(opt => opt.value === recuritmentDataById?.candidateProfile?.bookPracticalAssessment?.[0].classId) || null
      ); // Reset previous selection
    } else {
      setClassOptions([]);
      setSelectedClass(null);
    }
  }, [venueState, venues]);

  // Pagination calculations
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(commentsList.length / commentsPerPage);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.max(0, Math.floor((now - past) / 1000));
    // in seconds

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

  const [practicalLoading, setPracticalLoading] = useState(false);
  const [practicalErrors, setPracticalErrors] = useState({});

  const validatePracticalForm = () => {
    const errors = {};

    if (payload.qualifyLead === null || payload.qualifyLead === undefined) {
      errors.qualifyLead = "Please select qualify lead.";
    }

    if (!telephoneCall.date) errors.telephoneCallSetupDate = "Telephone call setup date is required.";
    if (!telephoneCall.time) errors.telephoneCallSetupTime = "Telephone call setup time is required.";
    if (!telephoneCall.email) errors.telephoneCallSetupEmail = "Telephone call setup email is required.";

    if (telephoneCallDelivery.telePhoneCallDeliveryCommunicationSkill === null || telephoneCallDelivery.telePhoneCallDeliveryCommunicationSkill === undefined) {
      errors.telePhoneCallDeliveryCommunicationSkill = "Communication rating is required.";
    }
    if (telephoneCallDelivery.telePhoneCallDeliveryPassionCoaching === null || telephoneCallDelivery.telePhoneCallDeliveryPassionCoaching === undefined) {
      errors.telePhoneCallDeliveryPassionCoaching = "Passion rating is required.";
    }
    if (telephoneCallDelivery.telePhoneCallDeliveryExperience === null || telephoneCallDelivery.telePhoneCallDeliveryExperience === undefined) {
      errors.telePhoneCallDeliveryExperience = "Experience rating is required.";
    }
    if (telephoneCallDelivery.telePhoneCallDeliveryKnowledgeOfSSS === null || telephoneCallDelivery.telePhoneCallDeliveryKnowledgeOfSSS === undefined) {
      errors.telePhoneCallDeliveryKnowledgeOfSSS = "Knowledge rating is required.";
    }

    if (!venueState) errors.venueState = "Venue is required.";
    if (!selectedClass?.value) errors.selectedClass = "Class is required.";
    if (!selectedDate) errors.selectedDate = "Assessment date is required.";
    if (!venueManager?.value) errors.venueManager = "Venue manager is required.";

    setPracticalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPracticalAssesment = async (e) => {
    e.preventDefault();

    if (!validatePracticalForm()) return;

    const result = await showConfirm(
      "Are you sure?",
      "Please confirm booking this practical assessment.",
      "Yes, Confirm Booking"
    );

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("adminToken");

    const body = {
      recruitmentLeadId: Number(id),
      qualifyLead: !!payload.qualifyLead,
      telephoneCallSetupDate: telephoneCall.date,
      telephoneCallSetupTime: telephoneCall.time,
      ...(comesfrom !== "venueManager" && { telephoneCallSetupEmail: telephoneCall.email }),
      telePhoneCallDeliveryCommunicationSkill: telephoneCallDelivery.telePhoneCallDeliveryCommunicationSkill,
      telePhoneCallDeliveryPassionCoaching: telephoneCallDelivery.telePhoneCallDeliveryPassionCoaching,
      telePhoneCallDeliveryExperience: telephoneCallDelivery.telePhoneCallDeliveryExperience,
      telePhoneCallDeliveryKnowledgeOfSSS: telephoneCallDelivery.telePhoneCallDeliveryKnowledgeOfSSS,
      bookPracticalAssessment: [
        {
          venueId: Number(venueState),
          classId: selectedClass.value,
          date: selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate,
          assignToVenueManagerId: venueManager.value,
        },
      ],
      telephoneCallSetupReminder: telephoneCall.reminder,
    };

    try {
      setPracticalLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/${comesfrom === "venueManager" ? "venue-manager" : "coach"}/candidate-profile/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const resultData = await response.json();

      if (!response.ok) {
        showError("Failed to update candidate profile", resultData?.message || "Something went wrong.");
        return;
      }

      showSuccess("Success", resultData?.message || "Candidate profile updated successfully.");
      setOpenCandidateStatusModal(false);
      // Optionally refresh data
      if (comesfrom === "venueManager") {
        fetchVenueManagerRecruitmentById(id);
      } else if (comesfrom === "coach") {
        fetchCoachRecruitmentById(id);
      } else {
        fetchAllRecruitmentById(id);
      }
    } catch (error) {
      showError("Network Error", error?.message || "Unable to submit practical assessment.");
    } finally {
      setPracticalLoading(false);
    }
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
      showError("Error", error.message || error.error || "Failed to fetch comments. Please try again later.");
    }
  }, [API_BASE_URL, id]);

  const submitScorecard = () => {
    setPayload(prev => ({ ...prev, ...telephoneCallDelivery }));


    toggleStep(3, "completed");
    setRateOpen(false);
    showSuccess("Step Completed", "Scorecard ratings have been saved.");
  };
  const handleSubmitComment = async (e) => {
    const token = localStorage.getItem("adminToken");
    e.preventDefault();

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
        showError("Failed to Add Comment", result.message || "Something went wrong.");
        return;
      }


      // showSuccess("Comment Created", result.message || " Comment has been  added successfully!");


      setComment('');
      fetchComments();
    } catch (error) {
      console.error("Error creating member:", error);
      showError("Network Error", error.message || "An error occurred while submitting the form.");
    } finally {
      setLoadingComment(false);
    }
  }
  const recruitedMode = form.status?.toLowerCase() === "recruited";


  // steps 

  const venueOptions = assignedVenues.map((v) => ({
    value: v.id,
    label: `${v.firstName} ${v.lastName}`.trim() || v.email, // fallback to email if no name
  }));

  const parseJSONSafe = (value, fallback = []) => {
    try {
      return Array.isArray(value)
        ? value
        : value
          ? JSON.parse(value)
          : fallback;
    } catch {
      return fallback;
    }
  };

  const getVenueOptions = (assignedVenues = []) =>
    assignedVenues.map(v => ({
      value: v.id,
      label: `${v.firstName} ${v.lastName}`.trim() || v.email,
    }));


  useEffect(() => {
    if (!id) return;

    const init = async () => {
      setLoading(true);

      const recruitmentPromise =
        comesfrom === "venueManager"
          ? fetchVenueManagerRecruitmentById(id)
          : comesfrom === "coach"
            ? fetchCoachRecruitmentById(id)
            : fetchAllRecruitmentById(id);

      await Promise.all([
        fetchAssignedVenueNames(),
        fetchVenueNames(),
        fetchComments(),
        recruitmentPromise,
      ]);

      setLoading(false);
    };

    init();
  }, [id, comesfrom]);


  useEffect(() => {
    if (!recuritmentDataById) {
      setForm(getInitialForm(null));
      setTelephoneCall({});
      setTelephoneCallDelivery({});
      setVenueState(null);
      setSelectedClass(null);
      setSelectedDate(null);
      setVenueManager(null);
      return;
    }

    const data = recuritmentDataById;
    const p = data.candidateProfile;

    const parsedVenues = parseJSONSafe(p?.availableVenueWork);
    const venueOptions = getVenueOptions(assignedVenues);

    setForm(getInitialForm(data, parsedVenues));

    setTelephoneCall({
      date: p?.telephoneCallSetupDate || "",
      time: p?.telephoneCallSetupTime || "",
      reminder: p?.telephoneCallSetupReminder || "",
      email: p?.telephoneCallSetupEmail || "",
      scores: {
        communication: p?.telePhoneCallDeliveryCommunicationSkill ?? null,
        passion: p?.telePhoneCallDeliveryPassionCoaching ?? null,
        experience: p?.telePhoneCallDeliveryExperience ?? null,
        knowledge: p?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
      },
    });

    setTelephoneCallDelivery({
      telePhoneCallDeliveryCommunicationSkill: p?.telePhoneCallDeliveryCommunicationSkill ?? null,
      telePhoneCallDeliveryPassionCoaching: p?.telePhoneCallDeliveryPassionCoaching ?? null,
      telePhoneCallDeliveryExperience: p?.telePhoneCallDeliveryExperience ?? null,
      telePhoneCallDeliveryKnowledgeOfSSS: p?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
    });

    const practical = p?.bookPracticalAssessment?.[0];

    setVenueState(practical?.venueId || null);
    setSelectedDate(practical?.date || null);
    setSelectedClass(
      classOptions.find(opt => opt.value === practical?.classId) || null
    );
    setVenueManager(
      venueOptions.find(opt => opt.value === practical?.assignToVenueManagerId) || null
    );

  }, [recuritmentDataById, assignedVenues]);


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
        const isStep2Done = !!p.telephoneCallSetupDate;
        const isStep3Done = !!p.telePhoneCallDeliveryCommunicationSkill;
        const isStep4Done = !!p.bookPracticalAssessment;
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
            return isStep5Done
              ? {
                ...step,
                status: "completed",
                resultPercent: recuritmentDataById.telephoneCallScorePercentage + "%",
                resultStatus: p.result === "passed" ? "Passed" : "Failed",
                isEnabled,
              }
              : { ...step, status: "pending", isEnabled };

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

  const enableNextStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id + 1 ? { ...step, isEnabled: true } : step
      )
    );
  };
  const toggleStep = (id, status) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id
          ? { ...step, status }
          : step
      )
    );

    // Clear relevant errors
    setPracticalErrors(prev => {
      const newErrors = { ...prev };
      if (id === 1) delete newErrors.qualifyLead;
      if (id === 2 && status === "skipped") {
        delete newErrors.telephoneCallSetupDate;
        delete newErrors.telephoneCallSetupTime;
        delete newErrors.telephoneCallSetupEmail;
      }
      if (id === 3 && status === "skipped") {
        delete newErrors.telePhoneCallDeliveryCommunicationSkill;
        delete newErrors.telePhoneCallDeliveryPassionCoaching;
        delete newErrors.telePhoneCallDeliveryExperience;
        delete newErrors.telePhoneCallDeliveryKnowledgeOfSSS;
      }
      return newErrors;
    });

    // ===== STEP-SPECIFIC DATA HANDLING =====

    // ✅ Qualify Lead
    if (id === 1) {
      setPayload(prev => ({
        ...prev,
        qualifyLead: status === "completed" ? true : null,
      }));
    }

    // ✅ Telephone Call Setup
    if (id === 2 && status === "skipped") {
      setPayload(prev => ({
        ...prev,
        telephoneCallSetupDate: null,
        telephoneCallSetupTime: null,
        telephoneCallSetupReminder: null,
        telephoneCallSetupEmail: null,
      }));
    }
    if (id === 3 && status === "skipped") {
      setPayload(prev => ({
        ...prev,
        telePhoneCallDeliveryCommunicationSkill: null,
        telePhoneCallDeliveryPassionCoaching: null,
        telePhoneCallDeliveryExperience: null,
        telePhoneCallDeliveryKnowledgeOfSSS: null,
      }));
    }

    // ✅ Enable next step when completed OR skipped
    if (status === "completed" || status === "skipped") {
      enableNextStep(id);
    }
  };

  const toggleOpenStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id ? { ...step, isOpen: !step.isOpen } : step
      )
    );
  };
  const confirmTelephoneCall = () => {
    const errors = {};
    if (!telephoneCall.date) errors.telephoneCallSetupDate = "Date is required.";
    if (!telephoneCall.time) errors.telephoneCallSetupTime = "Time is required.";
    if (!telephoneCall.email) errors.telephoneCallSetupEmail = "Email is required.";

    if (Object.keys(errors).length > 0) {
      setPracticalErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    setPayload(prev => ({
      ...prev,
      telephoneCallSetupDate: telephoneCall.date,
      telephoneCallSetupTime: telephoneCall.time,
      telephoneCallSetupReminder: telephoneCall.reminder,
      telephoneCallSetupEmail: telephoneCall.email,
    }));
    setPracticalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.telephoneCallSetupDate;
      delete newErrors.telephoneCallSetupTime;
      delete newErrors.telephoneCallSetupEmail;
      return newErrors;
    });
    toggleOpenStep(2);
    toggleStep(2, "completed");
    showSuccess("Step Completed", "Telephone call details have been saved.");
  };
  const handleRejectCandidate = async (id) => {
    const result = await showConfirm("Are you sure?", "Do you want to Reject this Candidate ?", "Yes, Reject");
    if (result.isConfirmed) {
      await rejectCoach(id);
    }
  };


  const handleSubmit = async () => { };
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

  const safe = (v) => v !== null && v !== undefined && v !== "";
  const handleDownload = () => {
    const fileUrl = recuritmentDataById?.candidateProfile?.uploadCv;

    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <button
        className={`p-3 capitalize font-bold px-10 absolute right-0 top-0 rounded-2xl ${getStatusStyles(form.status)}`}
      >
        {form.status}
      </button>

      {/* <button className="p-3 text-white font-bold bg-[#D95858] px-10 absolute right-0 top-0 rounded-2xl">
        Rejected
      </button> */}
      <div className='flex gap-8'>
        <div className="md:w-8/12">

          {/* Section: Candidate Information */}
          <div className="bg-white rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-[24px]">Candidate Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/** FIRST NAME */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">First Name</label>
                <input
                  type="text"
                  disabled
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3 bg-gray-100 cursor-not-allowed"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Tom"
                />
              </div>

              {/** SURNAME */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Surname</label>
                <input
                  type="text"
                  disabled
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3 bg-gray-100 cursor-not-allowed"
                  value={form.surname}
                  onChange={(e) => handleChange("surname", e.target.value)}
                  placeholder="John"
                />
              </div>

              {/** AGE */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Age</label>
                <input
                  type="number"
                  disabled
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3 bg-gray-100 cursor-not-allowed"
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  placeholder="25"
                />
              </div>

              {/** EMAIL */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Email</label>
                <input
                  type="email"
                  disabled
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3 bg-gray-100 cursor-not-allowed"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@gmail.com"
                />
              </div>

              {/** PHONE */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Phone number</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-100">
                  <PhoneInput
                    country={form.countryCode || "gb"}
                    value={form.dialCode}
                    disabled
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
                  <input
                    type="text"
                    disabled
                    className="border-none w-full focus:outline-none bg-transparent cursor-not-allowed"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91"
                  />
                </div>
              </div>

              {/** POSTCODE */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">London Postcode</label>
                <input
                  type="text"
                  disabled
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3 bg-gray-100 cursor-not-allowed"
                  value={form.postcode}
                  onChange={(e) => handleChange("postcode", e.target.value)}
                  placeholder="SW15 0AB"
                />
              </div>

              {/** HEARD FROM */}
              <div className="space-y-1 col-span-2">
                <label className="text-[16px] font-semibold block">How did you hear about us?</label>
                <select
                  disabled
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3 bg-gray-100 cursor-not-allowed"
                  value={form.heardFrom}
                  onChange={(e) => handleChange("heardFrom", e.target.value)}
                >
                  {heardFromOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Job Specifications */}
          <div className="bg-white rounded-2xl p-6 space-y-6 mt-6">
            <h2 className="font-semibold text-[24px]">Job Specifications</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


              {comesfrom == "venueManager" &&

                (

                  <>
                    <p className="font-semibold text-[18px] mb-2">Age groups experience</p>
                    <div className="space-y-2">
                      {ageGroupOptions.map((age) => (
                        <label key={age} className="flex items-center gap-3 cursor-not-allowed select-none opacity-60 pointer-events-none">

                          <input
                            type="checkbox"
                            disabled
                            value={age}
                            checked={form.ageGroup?.includes(age)}
                            onChange={(e) => {
                              handleChange("ageGroup", form.ageGroup?.includes(age)
                                ? form.ageGroup.filter(x => x !== age)
                                : [...(form.ageGroup || []), age]
                              );
                            }}
                            className="peer hidden"
                          />

                          <span className={`w-5 h-5 border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white rounded`}>
                            <Check className={`p-[2px] ${form.ageGroup?.includes(age) ? 'opacity-100' : 'opacity-0'}`} />
                          </span>

                          {age}
                        </label>
                      ))}
                    </div>
                  </>
                )}

              {/* VEHICLE */}
              <div>
                <p className="font-semibold text-[18px] mb-2">Access to your own vehicle?</p>
                <div className="space-y-2">
                  {["Yes", "No"].map((v) => (
                    <label key={v} className="flex items-center gap-3 cursor-not-allowed select-none opacity-60 pointer-events-none">

                      <input
                        type="radio"
                        disabled
                        value={v}
                        checked={form.vehicle === v}
                        onChange={(e) => handleChange("vehicle", e.target.value)}
                        className="peer hidden"
                      />

                      <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white">
                        <Check className="p-[2px]" />
                      </span>

                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* QUALIFICATIONS */}
              <div>
                <p className="font-semibold text-[18px] mb-2">Which qualifications do you have?</p>
                <div className="space-y-2">
                  {qualificationOptions.map((q) => (
                    <label key={q} className="flex items-center gap-3 cursor-not-allowed select-none opacity-60 pointer-events-none">

                      <input
                        type="checkbox"
                        disabled
                        value={q}
                        checked={form.qualification?.includes(q)}
                        onChange={(e) => {
                          handleChange("qualification", form.qualification?.includes(q)
                            ? form.qualification.filter(x => x !== q)
                            : [...(form.qualification || []), q]
                          );
                        }}
                        className="peer hidden"
                      />

                      <span className={`w-5 h-5 border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white rounded`}>
                        <Check className={`p-[2px] ${form.qualification?.includes(q) ? 'opacity-100' : 'opacity-0'}`} />
                      </span>

                      {q}
                    </label>
                  ))}
                </div>
              </div>

              {/* EXPERIENCE */}
              <div>
                <p className="font-semibold text-[18px] mb-2">
                  {comesfrom === "venueManager"
                    ? "How many years football coaching experience do you have?"
                    : "How many years football coaching experience?"}
                </p>
                <div className="space-y-2">
                  {experienceOptions.map((ex) => (
                    <label key={ex} className="flex items-center gap-3 cursor-not-allowed select-none opacity-60 pointer-events-none">

                      <input
                        type="radio"
                        disabled
                        value={ex}
                        checked={form.experience === ex}
                        onChange={(e) => handleChange("experience", e.target.value)}
                        className="peer hidden"
                      />

                      <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white">
                        <Check className="p-[2px]" />
                      </span>

                      {ex}
                    </label>
                  ))}
                </div>
              </div>

              {/* VENUES */}
              <div className="md:col-span-2">
                <p className="font-semibold text-[18px] mb-2">Which venues are you available for work?</p>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {venues.map((venue) => {
                      const checked = form.venues.includes(venue.id);

                      return (
                        <label
                          key={venue.id}
                          className="flex items-center gap-3 cursor-not-allowed opacity-60 pointer-events-none"
                        >
                          {/* Hidden native checkbox */}
                          <input
                            type="checkbox"
                            disabled
                            checked={checked}
                            onChange={() => handleVenueChange(venue.id)}
                            className="sr-only"
                          />

                          {/* Custom checkbox */}
                          <div
                            className={`min-w-4.5 min-h-4.5 flex items-center justify-center rounded border
              ${checked
                                ? "bg-[#2563EB] border-[#2563EB]"
                                : "bg-white border-gray-300"
                              }`}
                          >
                            {checked && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Venue name */}
                          <span>{venue.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Further Details */}
          <div className="bg-white mt-4 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[24px]">Further Details</h2>

            <button
              onClick={handleDownload}
              disabled={pdfLoading}
              className={`px-4 py-2.5 rounded-lg text-sm text-white
        ${pdfLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#237FEA]"}`}
            >
              {pdfLoading ? "Generating CV..." : "Download CV"}
            </button>

            <textarea
              disabled
              className="input border border-[#E2E1E5] bg-gray-100 rounded-xl w-full p-3 h-32 resize-none cursor-not-allowed"
              value={form.coverNote}
              onChange={(e) => handleChange("coverNote", e.target.value)}
              placeholder="Cover Note"
            ></textarea>
          </div>

          {/* SUBMIT BUTTON */}
          {form.status !== 'recruited' && (!recuritmentDataById.candidateProfile || Object.keys(recuritmentDataById.candidateProfile).length === 0) && (
            <button
              onClick={handleSubmit}
              className='bg-[#237FEA] mt-2 p-3 ml-6 rounded-xl text-white hover:bg-[#237FEA]'
            >
              Submit
            </button>
          )}


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

            <div className="relative pl-6 space-y-10">
              <div className="absolute left-[17px] top-1 bottom-6 border-l border-gray-300"></div>

              {steps.map(step => (
                <div
                  key={step.id}
                  className={`relative ps-[20px] ${recruitedMode
                    ? ""
                    : !step.isEnabled
                      ? "opacity-40 cursor-not-allowed pointer-events-none"
                      : ""
                    }`}
                >
                  {/* DOT */}
                  <div className="absolute -left-3 top-1 w-3 h-3 rounded-full bg-black"></div>

                  {/* HEADER */}
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{step.title}</p>

                    {step.status !== "completed" && (
                      <button
                        className="text-gray-400 text-sm"
                        onClick={() => toggleStep(step.id, "skipped")}
                      >
                        Skip
                      </button>
                    )}
                    {/* {step.status === "skipped" && step.isEnabled && (
                      <button
                        disabled={recruitedMode}
                        className="text-blue-600 text-sm mt-2"
                        onClick={() => toggleStep(step.id, "pending")}
                      >
                        Unskip
                      </button>
                    )} */}
                  </div>

                  {/* QUALIFY BUTTONS */}
                  {step.actionType === "buttons" && (
                    <>
                      <div className="flex gap-2 mt-3">
                        <button
                          className={`w-8 h-8 border rounded-lg ${step.status === "skipped"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-500"
                            }`}
                          onClick={() => toggleStep(step.id, "skipped")}
                        >
                          ✕
                        </button>
                        <button
                          className={`w-8 h-8 rounded-lg ${step.status === "completed"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                          onClick={() => toggleStep(step.id, "completed")}
                        >
                          ✓
                        </button>
                      </div>
                      {practicalErrors.qualifyLead && <p className="text-red-500 text-xs mt-1">{practicalErrors.qualifyLead}</p>}
                    </>
                  )}

                  {/* BUTTON */}
                  {step.buttonText && (
                    <button
                      className={`mt-3 flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl `}
                      onClick={() => {

                        if (step.id === 2) toggleOpenStep(step.id);
                        if (step.id === 3) setRateOpen(true);
                        if (step.id === 4) setOpenCandidateStatusModal(true);

                      }}
                    >
                      {step.buttonText}
                      {step.id === 2 && <IoIosArrowDown />}
                    </button>
                  )}



                  {/* TELEPHONE CALL FORM */}
                  {step.id === 2 && step.isOpen && (
                    <div className="bg-gray-50 rounded-xl p-4 mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="date"
                          value={telephoneCall.date}
                          className="border mr-4 w-full rounded-xl p-2"
                          onChange={(e) =>
                            setTelephoneCall({ ...telephoneCall, date: e.target.value })
                          }
                        />

                        <input
                          type="time"
                          value={telephoneCall.time}
                          className="border w-full rounded-xl p-2"

                          onChange={(e) =>
                            setTelephoneCall({ ...telephoneCall, time: e.target.value })
                          }
                        />
                      </div>

                      {comesfrom == "coach" && (
                        <input
                          type="email"
                          value={telephoneCall.email}
                          className="border rounded-xl p-2 w-full"
                          placeholder="Candidate email"

                          onChange={(e) =>
                            setTelephoneCall({ ...telephoneCall, email: e.target.value })
                          }
                        />
                      )}

                      <select
                        value={telephoneCall.reminder}
                        className="border border-[#E2E1E5] rounded-xl px-3 py-2.5 w-full text-gray-600"
                        onChange={(e) => setTelephoneCall({ ...telephoneCall, reminder: e.target.value })}
                      >
                        <option value="">When do you want to be reminded?</option>
                        <option value="10 minutes before">10 minutes before</option>
                        <option value="30 minutes before">30 minutes before</option>
                        <option value="1 hour before">1 hour before</option>
                        <option value="1 day before">1 day before</option>
                      </select>

                      {practicalErrors.telephoneCallSetupDate && <p className="text-red-500 text-xs mt-1">{practicalErrors.telephoneCallSetupDate}</p>}
                      {practicalErrors.telephoneCallSetupTime && <p className="text-red-500 text-xs mt-1">{practicalErrors.telephoneCallSetupTime}</p>}
                      {practicalErrors.telephoneCallSetupEmail && <p className="text-red-500 text-xs mt-1">{practicalErrors.telephoneCallSetupEmail}</p>}
                      {practicalErrors.telephoneCallSetupReminder && <p className="text-red-500 text-xs mt-1">{practicalErrors.telephoneCallSetupReminder}</p>}

                      <button
                        className="w-full bg-blue-600 text-white py-2 rounded-xl"
                        onClick={confirmTelephoneCall}
                      >
                        Confirm Call
                      </button>
                    </div>
                  )}

                  {/* RESULT */}
                  {step.resultPercent && (
                    <div className="mt-3 flex gap-3">
                      <span className="bg-blue-600 text-white px-3 py-2 rounded-xl">
                        {step.resultPercent}
                      </span>
                      <span className="text-green-600 mt-2">
                        ✓ {step.resultStatus}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>


          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-white p-6 rounded-2xl  space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSendEmail} className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <Mail size={18} /> <span>Send Email</span>
              </button>

              <button onClick={handleSendText} className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <MessageSquare size={18} /> <span>Send Text</span>
              </button>
            </div>

            <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Invite to CoachPro
            </button>
            {/* onClick={() => setOpenCandidateStatusModal(true)} */}
            <button onClick={() => handleRejectCandidate(id)} className="w-full bg-[#237FEA] text-white py-3 rounded-xl">
              Reject Candidate
            </button>
            <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Add to Pathway Course
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Withdraw employment
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Rebook for practical assessment
            </button>

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
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <p className='font-semibold text-[16px]'>Check they are free and in a quiet space for the call</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
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
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Process</p>
                          <span className="text-green-600">2 steps</span>
                          <ul className=" list-disc text-gray-600 mt-2">
                            <li className='list-none'>(A) Phone call</li>
                            <li className='list-none'>(B) Practical assessment - taking place next week and week after</li>
                          </ul>
                          <p className="text-black underline cursor-pointer mt-2">Any questions?</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Title Name</p>
                          <span className="text-green-600">2 steps</span>
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
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
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
                        <div className="flex gap-4 text-[#494949]">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <label key={num} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={label}
                                value={num}
                                checked={telephoneCallDelivery[scoreKeyMap[label]] === num}
                                onChange={() =>
                                  setTelephoneCallDelivery(prev => ({
                                    ...prev,
                                    [scoreKeyMap[label]]: num
                                  }))
                                }
                              />{" "}
                              {num}
                            </label>
                          ))}
                        </div>
                        {practicalErrors[scoreKeyMap[label]] && <p className="text-red-500 text-xs mt-1">{practicalErrors[scoreKeyMap[label]]}</p>}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => {
                    const errors = {};
                    if (telephoneCallDelivery.telePhoneCallDeliveryCommunicationSkill === null) errors.telePhoneCallDeliveryCommunicationSkill = "Required";
                    if (telephoneCallDelivery.telePhoneCallDeliveryPassionCoaching === null) errors.telePhoneCallDeliveryPassionCoaching = "Required";
                    if (telephoneCallDelivery.telePhoneCallDeliveryExperience === null) errors.telePhoneCallDeliveryExperience = "Required";
                    if (telephoneCallDelivery.telePhoneCallDeliveryKnowledgeOfSSS === null) errors.telePhoneCallDeliveryKnowledgeOfSSS = "Required";

                    if (Object.keys(errors).length > 0) {
                      setPracticalErrors(prev => ({ ...prev, ...errors }));
                      return;
                    }
                    setPracticalErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.telePhoneCallDeliveryCommunicationSkill;
                      delete newErrors.telePhoneCallDeliveryPassionCoaching;
                      delete newErrors.telePhoneCallDeliveryExperience;
                      delete newErrors.telePhoneCallDeliveryKnowledgeOfSSS;
                      return newErrors;
                    });
                    submitScorecard();
                  }}
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
              className="bg-white rounded-2xl max-h-[90vh] w-full max-w-xl shadow-xl  overflow-auto "
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
              <form onSubmit={handleSubmitPracticalAssesment} className="p-6">
                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Venue</label>
                  <select
                    className="border border-[#E2E1E5] w-full rounded-2xl p-3"
                    value={venueState}
                    onChange={(e) => setVenueState(e.target.value)}
                  >
                    <option value="">Select Venue</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>
                  {practicalErrors.venueState && <p className="text-red-500 text-xs mt-1">{practicalErrors.venueState}</p>}
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Class</label>
                  <Select
                    options={classOptions}
                    placeholder="Select Class"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    value={selectedClass}
                    onChange={setSelectedClass}
                  />
                  {practicalErrors.selectedClass && <p className="text-red-500 text-xs mt-1">{practicalErrors.selectedClass}</p>}
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Date</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholderText="Select Date"
                    className="border border-[#E2E1E5] w-full rounded-2xl p-3"
                    dateFormat="dd/MM/yyyy"
                  />
                  {practicalErrors.selectedDate && <p className="text-red-500 text-xs mt-1">{practicalErrors.selectedDate}</p>}
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Assign To Venue Manager</label>
                  <Select
                    options={venueOptions}
                    placeholder="Venue Manager"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    value={venueManager}
                    onChange={setVenueManager}
                  />
                  {practicalErrors.venueManager && <p className="text-red-500 text-xs mt-1">{practicalErrors.venueManager}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-12">
                  <button
                    type="button"
                    onClick={() => setOpenCandidateStatusModal(false)}
                    className="w-full p-3 border border-[#E2E1E5] text-[#717073] font-semibold rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={practicalLoading || recruitedMode}
                    className={`w-full p-3 border border-[#E2E1E5] ${recruitedMode ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#237FEA]'} text-white font-semibold rounded-2xl flex items-center justify-center gap-2`}
                  >
                    {practicalLoading ? <Loader2 className="animate-spin" size={20} /> : "Send Confirmation"}
                  </button>
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
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Send Offer of Employment</h2>
                <button
                  onClick={() => setOpenOfferModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form action="" className='p-6'>
                <div className="mb-3 relative">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Venue
                  </label>

                  {/* Search Icon */}
                  <span className="absolute left-4 top-11 text-gray-400">
                    <Search />
                  </span>

                  <input
                    type="text"
                    placeholder="Search"
                    className="border border-[#E2E1E5]  w-full rounded-2xl p-3 pl-12"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Pay rate per hour
                  </label>

                  <Select
                    options={payRateOptions}
                    placeholder="Select pay rate"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Start Date
                  </label>

                  <Select
                    options={dateOptions}
                    placeholder="Select Start Date"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className=" mt-8">
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Send Email Offer</button>
                </div>
              </form>


            </motion.div>
          </div >
        )}

      </div >
    </>
  )
}

export default CandidateInfo
