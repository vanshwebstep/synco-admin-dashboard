import React, { useEffect, useState, useRef } from 'react';

import Loader from '../../../../contexts/Loader';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { usePermission } from '../../../../Common/permission';
import { useHolidayClassSchedule } from '../../../../contexts/HolidayClassScheduleContext';
import { useHolidayVenue } from '../../../../contexts/HolidayVenueContext';
import { showConfirm, showError, showSuccess } from '../../../../../../../utils/swalHelper';

const ClassSheduleList = () => {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const venueId = searchParams.get("id");
    const [sessionStates, setSessionStates] = useState({});
    ;

    const scrollTo8AM = () => {
        requestAnimationFrame(() => {
            const list = document.querySelector(".react-datepicker__time-list");
            if (!list) return;

            const target = Array.from(list.children).find((el) =>
                el.textContent?.trim().includes("8:00")
            );

            if (target) target.scrollIntoView({ block: "center" }); // no smooth
        });
    };

    // Scroll to the start time dynamically (instant)
    const scrollToStartTime = () => {
        if (!formData?.startTime) return;

        requestAnimationFrame(() => {
            const list = document.querySelector(".react-datepicker__time-list");
            if (!list) return;

            const normalizedTime = formData.startTime
                .replace(/^0+/, "")
                .replace(/\s?(AM|PM)$/i, "");

            const target = Array.from(list.children).find((el) =>
                el.textContent?.trim().includes(normalizedTime)
            );

            if (target) target.scrollIntoView({ block: "center" }); // instant jump
        });
    };


    const { fetchClassSchedules, createClassSchedules, updateClassSchedules, fetchClassSchedulesID, singleClassSchedules, classSchedules, loading, deleteClassSchedule } = useHolidayClassSchedule()

    useEffect(() => {
        const fetchData = async () => {
            await fetchClassSchedules();

            if (!venueId) {
                navigate(`/configuration/holiday-camp/venues`);
                return; // Prevent further execution if no venueId
            }

            await fetchClassSchedulesID(venueId);
        };

        fetchData();
    }, [fetchClassSchedules, venueId, navigate, fetchClassSchedulesID]);

    const filteredSchedules = classSchedules.filter(
        (item) => item.venueId == venueId
    );
    const allDays = Array.from(
        new Set(
            (singleClassSchedules?.termGroups || [])
                .flatMap(termGroup =>
                    (termGroup.terms || []).map(term => term.day?.toLowerCase().trim())
                )
        )
    );

    console.log('filteredSchedules', filteredSchedules)
    const formatDateToTimeString = (date) => {
        if (!date) return "";
        return format(date, "h:mm aa");
    };


    const handleEditClick = (classItem) => {
        setFormData(classItem);
        setIsEditing(true);
        setOpenForm(true);
    };
    const [openTerms, setOpenTerms] = useState(() => {
        const saved = localStorage.getItem("openTerms");
        return saved ? JSON.parse(saved) : {};
    });

    const toggleTerm = (termId) => {
        setOpenTerms((prev) => {
            const updated = { ...prev, [termId]: !prev[termId] };
            localStorage.setItem("openTerms", JSON.stringify(updated));
            return updated;
        });
    };

    // --- CLASS OPEN STATE ---
    const [openClassIndex, setOpenClassIndex] = useState(() => {
        const saved = localStorage.getItem("openClassIndex");
        return saved ? JSON.parse(saved) : null;
    });

    const toggleSessions = (index) => {
        setOpenClassIndex((prev) => {
            const newIndex = prev === index ? null : index;
            localStorage.setItem("openClassIndex", JSON.stringify(newIndex));
            return newIndex;
        });
    };



    // Reset for new form
    const handleAddNew = () => {
        setFormData({
            className: '',
            capacity: '',

            startTime: null,
            endTime: null,
        })
        setIsEditing(false);
        setOpenForm(true);
    };

    const [isEditing, setIsEditing] = useState(false);
    const { venues, fetchVenues } = useHolidayVenue()
    const [formData, setFormData] = useState({
        className: '',
        capacity: '',
        startTime: null,
        endTime: null,
    });
    console.log('venues', venues)

    const handleChange = (field, value) => {
        if (field === 'capacity') {
            const numericValue = Number(value);

            if (numericValue < 0) return; // block negative values
        }

        setFormData({ ...formData, [field]: value });
    };

    const parseTimeToMinutes = (timeStr) => {
        // timeStr example: "06:00 AM" or "01:15 PM"
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        return hours * 60 + minutes;
    };

    const handleSave = () => {
        const payload = {
            ...formData,
            venueId: venueId,
        };

        // --- Validation ---
        if (!formData.className?.trim()) {
            showError("Validation Error", "Class Name is required");
            return;
        }

        if (!formData.capacity || isNaN(formData.capacity) || Number(formData.capacity) <= 0) {
            showError("Validation Error", "Capacity must be a positive number");
            return;
        }



        if (!formData.startTime || !formData.endTime) {
            showError("Validation Error", "Please select both start and end times");
            return;
        }

        if (formData.startTime === formData.endTime) {
            showError("Validation Error", "Start and End time cannot be the same");
            return;
        }

        const startMinutes = parseTimeToMinutes(formData.startTime);
        const endMinutes = parseTimeToMinutes(formData.endTime);

        if (startMinutes === endMinutes) {
            showError("Validation Error", "Start and End time cannot be the same");
            return;
        }

        if (startMinutes > endMinutes) {
            showError("Validation Error", "End time must be after start time");
            return;
        }


        // --- Save ---
        createClassSchedules(payload);

        // reset fields (make sure default values match your form shape)
        setFormData({
            className: "",
            capacity: "",
            startTime: "",
            endTime: "",
        });

        setOpenForm(false);
    };

    const handleEdit = (id) => {
        const payload = {
            ...formData,
            venueId: venueId
        };
        updateClassSchedules(id, payload);
        setFormData({})

        setOpenForm(false);
    };


    const [openForm, setOpenForm] = useState(false);

    const handleDeleteClick = (item) => {
        showConfirm(`Are you sure you want to delete ${item.className}?`, "This action cannot be undone.").then((result) => {
        }).then((result) => {
            if (result.isConfirmed) {
                deleteClassSchedule(item); // only called after confirmation

            }
        });
    };


    const handleSessionMapChange = (sessionId, value, sessionMaps) => {
        const [date, groupName] = value.split('|||');
        const matched = sessionMaps.find(
            (s) => s.sessionDate === date && s.sessionPlan.groupName === groupName
        );

        setSessionStates((prev) => ({
            ...prev,
            [sessionId]: {
                selectedKey: value,
                selectedSessionMap: matched,
            },
        }));
    };


    const parseTimeStringToDate = (timeString) => {
        if (!timeString || typeof timeString !== "string") return null;

        const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;

        let [_, hoursStr, minutesStr, meridian] = match;
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (meridian.toUpperCase() === "PM" && hours !== 12) {
            hours += 12;
        }
        if (meridian.toUpperCase() === "AM" && hours === 12) {
            hours = 0;
        }

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };


    const { checkPermission } = usePermission();

    const canCreate =
        checkPermission({ module: 'class-schedule', action: 'create' });

    const canUpdate =
        checkPermission({ module: 'class-schedule', action: 'update' });

    const canDelete =
        checkPermission({ module: 'class-schedule', action: 'delete' });

    const cancelSession =
        checkPermission({ module: 'cancel-session', action: 'view-listing' });


    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }
    return (
        <div className="pt-1 bg-gray-50 min-h-screen">
            <div className={`md:flex pe-4 justify-between items-center mb-4 w-full`}>
                <h2 onClick={() => {
                    navigate('/configuration/holiday-camp/venues/');
                    localStorage.removeItem("openClassIndex"); // clear all stored states
                    localStorage.removeItem("openTerms"); // clear all stored states

                }} className="md:text-[28px] cursor-pointer hover:opacity-80 font-semibold mb-4 flex gap-2 items-center  p-5"><img src="/members/Arrow - Left.png" className="w-6" alt="" /> Edit Class Schedule</h2>
                {canCreate &&
                    <button
                        onClick={() => handleAddNew()}
                        className="bg-[#237FEA] flex items-center gap-2 cursor-pointer text-white px-4 py-[10px] rounded-xl hover:bg-blue-700 text-[16px] font-semibold"
                    >
                        <img src="/members/add.png" className='w-5' alt="" /> class
                    </button>
                }
            </div>

            <div className="md:md:flex gap-6">
                <div
                    className={`transition-all duration-300 w-full `}>
                    {
                        venues.length > 0 ? (

                            <div className="bg-white rounded-3xl p-6 shadow-xl">
                                <h2 className="font-semibold text-lg text-[18px]">{singleClassSchedules.name || null}</h2>
                                <p className="text-[14px]   mb-4 border-b pb-4 border-gray-200">{singleClassSchedules.address || null}</p>

                                {filteredSchedules.map((item, index) => (
                                    <>
                                        <div
                                            key={index}
                                            className={`flex flex-col md:flex-row justify-between items-center border ${item.highlight ? "border-red-400" : "border-gray-200"
                                                } rounded-xl px-4  pr-16 py-4 mb-3 hover:shadow transition`}
                                        >
                                            {/* Class info block */}
                                            <div className="grid grid-cols-2 md:grid-cols-8 gap-4 w-full text-sm">
                                                <div>
                                                    <p className="font-semibold text-[16px]">Class {index + 1}</p>
                                                    <p className="text-xs font-semibold text-[16px]">{item.className}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[#717073] font-semibold text-[16px]">Capacity</p>
                                                    <p className="font-semibold text-[#717073]  text-[16px]">{item.capacity}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[#717073] font-semibold text-[16px]">Days</p>
                                                    <p className="font-semibold text-[#717073] text-[16px]">
                                                        {singleClassSchedules?.holidayCamp?.[0]?.holidayCampDates?.[0]?.totalDays ?? 'null'}
                                                    </p>
                                                </div>

                                                <div className='text-[#717073] font-semibold text-[16px]'>
                                                    <p className="text-[#717073]">Start time</p>
                                                    <p className="font-semibold">{item.startTime}</p>
                                                </div>
                                                <div className='text-[#717073]  font-semibold text-[16px]'>
                                                    <p className="text-[#717073]">End time</p>
                                                    <p className="font-semibold">{item.endTime}</p>
                                                </div>

                                                <div className='text-[#717073] font-semibold  text-[16px]'>
                                                    <p className="text-[#717073]">Facility</p>
                                                    <p className="font-semibold">{singleClassSchedules.facility || 'null'}</p>
                                                </div>
                                            </div>

                                            {/* Icons + Button */}
                                            <div className="flex items-center mt-4 md:mt-0 gap-4">
                                                {canUpdate &&
                                                    <img
                                                        src="/images/icons/edit.png"
                                                        alt="Edit"
                                                        className="w-6 h-6 cursor-pointer"
                                                        onClick={() => handleEditClick(item)}
                                                    />
                                                }
                                                {canDelete &&

                                                    <img
                                                        className=" w-6 h-6 cursor-pointer"
                                                        onClick={() => handleDeleteClick(item.id)}
                                                        src="/images/icons/deleteIcon.png"
                                                        alt="Delete"
                                                    />
                                                }
                                                <button onClick={() => toggleSessions(index)} className="ml-4 flex font-semibold items-center gap-2 whitespace-nowrap px-4 pr-6 py-2 border rounded-xl text-[16px] font-medium text-[#237FEA] border-blue-500 hover:bg-blue-50">
                                                    {openClassIndex === index ? 'Hide sessions' : 'View sessions'}  <img src="/images/icons/bluearrowup.png" className={`${openClassIndex === index ? '' : 'rotate-180'} transition-transform`} alt="" />
                                                </button>
                                            </div>

                                        </div>
                                        <AnimatePresence>
                                            {openClassIndex === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden mt-4  rounded-xl"
                                                >
                                                    <div className="space-y-4">
                                                        {item?.venue?.holidayCamps && item.venue.holidayCamps.length > 0 && (
                                                            item.venue.holidayCamps[0]?.holidayCampDates?.length > 0 ? (
                                                                item.venue.holidayCamps[0].holidayCampDates.map((term) => (
                                                                    <div key={term.id}>
                                                                        <div
                                                                            onClick={() => toggleTerm(term.id)}
                                                                            className="mb-4 mt-2 border-b border-gray-300 flex justify-between items-center cursor-pointer"
                                                                        >
                                                                            <div className="flex mb-4 items-center gap-8 justify-start">
                                                                                <div>
                                                                                    <img
                                                                                        src="/images/icons/blackarrowup.png"
                                                                                        className={`${openTerms[term.id] ? "" : "rotate-180"} transition-transform`}
                                                                                        alt=""
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-semibold text-[16px]">
                                                                                        {item?.venue?.holidayCamps[0]?.name || "N/A"}
                                                                                    </p>
                                                                                    <p className="text-[14px]">
                                                                                        {item?.venue?.holidayCamps[0]?.createdAt
                                                                                            ? (() => {
                                                                                                const d = new Date(item.venue.holidayCamps[0].createdAt);
                                                                                                const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
                                                                                                const day = d.toLocaleDateString("en-GB", { day: "2-digit" });
                                                                                                const year = d.toLocaleDateString("en-GB", { year: "2-digit" });

                                                                                                return `${weekday} ${day}/${year}`;
                                                                                            })()
                                                                                            : "N/A"}
                                                                                    </p>                                                                            </div>
                                                                            </div>
                                                                        </div>

                                                                        <div
                                                                            className={`transition-all duration-300 overflow-hidden ${openTerms[term.id] ? "max-h-[1000px]" : "max-h-0"
                                                                                }`}
                                                                        >
                                                                            {(() => {
                                                                                let sessions = [];

                                                                                if (term.sessionsMap) {
                                                                                    if (typeof term.sessionsMap === "string") {
                                                                                        try {
                                                                                            sessions = JSON.parse(term.sessionsMap);
                                                                                        } catch (err) {
                                                                                            console.error("Invalid sessionsMap JSON:", err);
                                                                                            sessions = [];
                                                                                        }
                                                                                    } else if (Array.isArray(term.sessionsMap)) {
                                                                                        sessions = term.sessionsMap;
                                                                                    }
                                                                                }

                                                                                if (sessions.length === 0) {
                                                                                    return <p className="px-4 py-3 text-gray-500">No sessions available</p>;
                                                                                }

                                                                                return sessions.map((session) => {
                                                                                    const sessionMaps = session.sessionPlan || {};

                                                                                    return (
                                                                                        <div
                                                                                            key={session.id}
                                                                                            className="flex justify gap-4 items-start md:items-center border-b border-gray-300 mb-3 px-4 md:px-8 py-3"
                                                                                        >
                                                                                            {/* Title and Date */}
                                                                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-sm">
                                                                                                <span className="text-[15px] font-semibold truncate md:min-w-[250px]">
                                                                                                    {sessionMaps.groupName || "N/A"}
                                                                                                </span>
                                                                                                <span className="text-[15px] text-gray-600 truncate md:min-w-[200px]">
                                                                                                    {session.sessionDate
                                                                                                        ? new Date(session.sessionDate).toLocaleDateString("en-GB", {
                                                                                                            weekday: "long",
                                                                                                            day: "2-digit",
                                                                                                            month: "2-digit",
                                                                                                            year: "numeric",
                                                                                                        })
                                                                                                        : "N/A"}
                                                                                                </span>
                                                                                            </div>

                                                                                            {/* Status */}
                                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                                <span className="rounded-full flex items-center gap-2 font-medium capitalize text-[15px] md:min-w-[120px]">
                                                                                                    {sessionMaps.status === "pending" && (
                                                                                                        <>
                                                                                                            <img src="/images/icons/pending.png" className="w-4 h-4" alt="Pending" /> {sessionMaps.status}
                                                                                                        </>
                                                                                                    )}
                                                                                                    {sessionMaps.status === "completed" && (
                                                                                                        <>
                                                                                                            <img src="/images/icons/complete.png" className="w-4 h-4" alt="Complete" />

                                                                                                            {sessionMaps.status}
                                                                                                        </>
                                                                                                    )}
                                                                                                    {sessionMaps.status === "cancelled" && (
                                                                                                        <>
                                                                                                            <img src="/images/icons/cancel.png" className="w-4 h-4" alt="Cancelled" />
                                                                                                            {sessionMaps.status}
                                                                                                        </>
                                                                                                    )}
                                                                                                    {!sessionMaps.status && (
                                                                                                        <>
                                                                                                            <img src="/images/icons/pending.png" className="w-4 h-4 inline" alt="Pending" /> Pending
                                                                                                        </>
                                                                                                    )}
                                                                                                </span>
                                                                                            </div>

                                                                                            {/* Action Buttons */}
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                                                                                                {sessionMaps && (
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            navigate('/configuration/holiday-camp/venues/class-schedule/Sessions/viewSessions', {
                                                                                                                state: {
                                                                                                                    singleClassSchedules,
                                                                                                                    sessionMap: sessionMaps,
                                                                                                                    sessionId: session.sessionPlanId,
                                                                                                                    venueId,
                                                                                                                    sessionDate: session.sessionDate,
                                                                                                                    classname: item,
                                                                                                                    statusIs: sessionMaps.status,
                                                                                                                },
                                                                                                            })
                                                                                                        }
                                                                                                        className="px-4 py-3 bg-[#237FEA] text-white font-semibold rounded-xl shadow hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
                                                                                                    >
                                                                                                        View Session Plan
                                                                                                    </button>
                                                                                                )}

                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        navigate(`/configuration/holiday-camp/venues/class-schedule/Sessions/completed?id=${item.id}`, {
                                                                                                            state: {
                                                                                                                singleClassSchedules,
                                                                                                                sessionMap: sessionMaps,
                                                                                                                sessionId: session.sessionPlanId,
                                                                                                                venueId,
                                                                                                                sessionDate: session.sessionDate,
                                                                                                                classname: item,
                                                                                                                statusIs: sessionMaps.status,
                                                                                                            },
                                                                                                        })
                                                                                                    }
                                                                                                    className="hover:bg-blue-500 font-semibold bg-white text-blue-500 border-2 hover:border-transparent border-blue-500 text-[15px] hover:text-white px-3 py-2 rounded-xl transition"
                                                                                                >
                                                                                                    View Class Register
                                                                                                </button>

                                                                                                {cancelSession && (
                                                                                                    <button
                                                                                                        onClick={() => {
                                                                                                            navigate("/configuration/holiday-camp/venues/class-schedule/Sessions/cancel", {
                                                                                                                state: {
                                                                                                                    statusIs: sessionMaps.status,
                                                                                                                    classScheduleId: sessionMaps.classScheduleId,
                                                                                                                    cancelSession: sessionMaps.cancelSession,
                                                                                                                    sessionId: sessionMaps.mapId || session.sessionPlanId,
                                                                                                                    schedule: item,
                                                                                                                    cancelled: sessionMaps.status === "cancelled",
                                                                                                                },
                                                                                                            });
                                                                                                        }}
                                                                                                        className={`font-semibold text-[15px] px-3 py-2 rounded-xl transition ${sessionMaps.status === "cancelled"
                                                                                                            ? "bg-white w-fit text-[#FE7058] border-2 border-[#FE7058] hover:bg-[#FE7058] hover:text-white"
                                                                                                            : "bg-[#FE7058] text-white border-2 border-transparent hover:bg-white hover:text-[#FE7058] hover:border-[#FE7058]"
                                                                                                            }`}
                                                                                                    >
                                                                                                        {sessionMaps.status === "cancelled" ? "See details" : "Cancel Session"}
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="p-4 text-gray-500">No camp dates available</p>
                                                            )
                                                        )}

                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence >
                                    </>
                                ))}
                            </div>

                        ) : (
                            <p className='text-center  p-4 border-dotted border rounded-md'>No Data Found</p>
                        )
                    }
                </div>

            </div>


            {
                openForm && (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (isEditing) {
                            handleEdit(formData.id);
                        } else {
                            handleSave();
                        }
                    }}>
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white rounded-3xl w-[90%] md:w-[900px] p-6 relative shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-[24px] font-semibold">
                                        {isEditing ? 'Edit class' : 'Add a class'}
                                    </h2>
                                    <button
                                        onClick={() => setOpenForm(false)}
                                        className="text-gray-500 hover:text-gray-800 text-xl"
                                    >
                                        <img src="/images/icons/cross.png" alt="" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className='block md:w-1/2'>
                                            <label htmlFor="" className='text-base'>Class 1 Name </label>
                                            <input
                                                type="text"
                                                value={formData.className}

                                                onChange={(e) => handleChange('className', e.target.value)}
                                                className="w-full border border-[#E2E1E5] rounded-xl p-3 text-sm"
                                            />
                                        </div>
                                        <div className='block md:w-1/2'>
                                            <label htmlFor="">Capacity</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={formData.capacity}
                                                onChange={(e) => handleChange('capacity', e.target.value)}
                                                className="w-full border border-[#E2E1E5] rounded-xl p-3 text-sm"
                                            />

                                        </div>
                                    </div>
                                    <div className="flex gap-4">

                                        <div className='flex md:w-1/2 gap-4'>
                                            <div className="flex gap-4">
                                                <div className="w-1/2">
                                                    <label>Start Time</label>
                                                    <DatePicker
                                                        selected={parseTimeStringToDate(formData?.startTime)}
                                                        onChange={(date) => handleChange("startTime", formatDateToTimeString(date))}
                                                        showTimeSelect
                                                        showTimeSelectOnly
                                                        timeIntervals={15}
                                                        dateFormat="h:mm aa"
                                                        timeCaption="Time"
                                                        onCalendarOpen={scrollTo8AM}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                                                    />
                                                </div>

                                                <div className="w-1/2">
                                                    <label>End Time</label>
                                                    <DatePicker
                                                        selected={parseTimeStringToDate(formData?.endTime)}
                                                        onChange={(date) => handleChange("endTime", formatDateToTimeString(date))}
                                                        showTimeSelect
                                                        showTimeSelectOnly
                                                        timeIntervals={15}
                                                        dateFormat="h:mm aa"
                                                        timeCaption="Time"
                                                        onCalendarOpen={scrollToStartTime}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>


                                    </div>

                                </div>


                                <div className="flex justify-start gap-5 mt-6">
                                    <button
                                        type='button'
                                        onClick={() => setOpenForm(false)}
                                        className="px-20 py-4 bg-none hover:bg-gray-200 text-gray-500 border border-gray-300 rounded-lg mt-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"

                                        className="px-20 py-4 bg-[#237FEA] hover:bg-blue-700 text-white rounded-lg mt-2"
                                    >
                                        {isEditing ? 'Update' : 'Save'}
                                    </button>

                                </div>
                            </div>
                        </div>
                    </form>
                )
            }
        </div >
    );
};

export default ClassSheduleList;
