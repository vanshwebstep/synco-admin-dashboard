import React, { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";
import { GripVertical, MoreVertical, Plus } from "lucide-react";
import { showError, showSuccess, showLoading } from "../../../../../utils/swalHelper";
import {
    DragDropContext,
    Droppable,
    Draggable,
} from "@hello-pangea/dnd";
import Select from "react-select";
import Loader from "../../contexts/Loader";
import { useNavigate } from "react-router-dom";
const steps = [
    "Title",
    "Modules",
    "Assessment",
    "Settings",
    "Certificate",
    "Complete",
];
const uid = () => String(Date.now()) + "-" + Math.floor(Math.random() * 10000);
export default function CourseCreateForm() {

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(null);
    const [errors, setErrors] = useState({});
    console.log('errors', errors)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        modules: [],
        assessment: [
            // initial example (optional)
            {
                id: uid(),
                question: "What are the roles we have at SSS?",
                options: [
                    { id: uid(), text: "Rules are not given", correct: false },
                    { id: uid(), text: "There are 4 rules", correct: true },
                    { id: uid(), text: "Only 10 rules are available", correct: false },
                ],
            },
        ],
        settings: {},
        certificate: "",
    });

    const validateStep = () => {
        const newErrors = {};

        /* STEP 1 */
        if (activeStep === 0) {
            if (!formData.title?.trim()) {
                newErrors.title = "Course title is required";
            }
            if (!formData.description?.trim()) {
                newErrors.description = "Course description is required";
            }
        }

        /* STEP 2 (MODULES) */
        if (activeStep === 1) {
            if (!Array.isArray(formData.modules) || formData.modules.length === 0) {
                newErrors.modules = "At least one module is required";
            } else {
                const firstModule = formData.modules[0];

                if (!firstModule.title?.trim()) {
                    newErrors.moduleTitle_0 = "Module title is required";
                }

                if (!Array.isArray(firstModule.media) || firstModule.media.length === 0) {
                    newErrors.moduleMedia_0 = "At least one media file is required";
                }
            }
        }

        if (activeStep === 3) {
            const s = formData.settings || {};

            if (!s.duration || Number(s.duration) <= 0) {
                newErrors.duration = "Duration must be greater than 0";
            }

            if (!s.durationType) {
                newErrors.durationType = "Select duration type";
            }

            if (!s.retake || Number(s.retake) < 0) {
                newErrors.retake = "Retake value must be 0 or greater";
            }

            if (!s.passValue || Number(s.passValue) < 1 || Number(s.passValue) > 100) {
                newErrors.passValue = "Passing value must be between 1 and 100";
            }

            if (typeof s.compulsory !== "boolean") {
                newErrors.compulsory = "Please select Yes or No";
            }

            if (!s.reminderValue || Number(s.reminderValue) <= 0) {
                newErrors.reminderValue = "Reminder value must be greater than 0";
            }

            if (!s.reminderType) {
                newErrors.reminderType = "Select reminder type";
            }
        }

        if (activeStep === 4) {
            if (!formData.certificate?.title?.trim()) {
                newErrors.certificateTitle = "Certificate title is required";
            }
            if (!formData.certificate?.disabled) {
                if (!formData.certificate?.file) {
                    newErrors.certificateFile = "Certificate file is required";
                }
            }

        }

        if (activeStep === 5) {
            if (!Array.isArray(selectedCoachIds) || selectedCoachIds.length === 0) {
                newErrors.notifiedUsers = "Please select at least one coach";
            }
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    const [selectedCoachIds, setSelectedCoachIds] = useState([]);
    const coachOptions = Array.isArray(coaches)
        ? coaches.map((coach) => ({
            label: `${coach?.firstName || ""} ${coach?.lastName || ""}`.trim() || "Unnamed Coach",
            value: String(coach?.id),
        }))
        : [];

    const inputClass =
        " px-4 py-3 border border-[#E2E1E5] rounded-xl focus:outline-none ";
    const handleNext = () => {
        const isValid = validateStep();
        if (!isValid) return;

        setActiveStep((p) => p + 1);
    };


    const handleBack = () => setActiveStep((p) => p - 1);
    const [collapsedMap, setCollapsedMap] = useState({});

    const addQuestion = () => {
        const q = {
            id: uid(),
            question: "",
            options: [
                { id: uid(), text: "", correct: false },
                { id: uid(), text: "", correct: false },
            ],
        };
        setFormData((p) => ({ ...p, assessment: [...p.assessment, q] }));
        setCollapsedMap((p) => ({ ...p, [q.id]: false }));
    };

    const addOption = (qIndex) => {
        const updated = [...formData.assessment];
        updated[qIndex].options.push({ id: uid(), text: "", correct: false });
        setFormData({ ...formData, assessment: updated });
    };

    const setCorrectOption = (qIndex, optId) => {
        const updated = [...formData.assessment];
        updated[qIndex].options = updated[qIndex].options.map((o) => ({
            ...o,
            correct: o.id === optId,
        }));
        setFormData({ ...formData, assessment: updated });
    };

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        if (source.droppableId === "questions" && destination.droppableId === "questions") {
            const items = Array.from(formData.assessment);
            const [moved] = items.splice(source.index, 1);
            items.splice(destination.index, 0, moved);
            setFormData({ ...formData, assessment: items });
            return;
        }


        if (source.droppableId.startsWith("options-") && destination.droppableId.startsWith("options-")) {
            const sourceQId = source.droppableId.replace("options-", "");
            const destQId = destination.droppableId.replace("options-", "");
            const updated = [...formData.assessment];

            const sourceIndex = updated.findIndex((q) => q.id === sourceQId);
            const destIndex = updated.findIndex((q) => q.id === destQId);
            if (sourceIndex === -1 || destIndex === -1) return;

            if (sourceQId === destQId) {
                const opts = Array.from(updated[sourceIndex].options);
                const [moved] = opts.splice(source.index, 1);
                opts.splice(destination.index, 0, moved);
                updated[sourceIndex].options = opts;
                setFormData({ ...formData, assessment: updated });
            }
            return;
        }
    };
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/coach-profile/venue-allocate/list`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const json = await res.json();

            // ❗ handle API error response
            if (!res.ok) {
                throw new Error(json?.message || "Failed to fetch coach list");
            }

            setCoaches(json?.data || []);
        } catch (err) {
            console.error("Fetch failed", err);

            showError("Error", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);


    const handleSubmit = async () => {
        const isValid = validateStep();
        if (!isValid) return;

        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Unauthorized", "Admin token missing");
            return;
        }

        try {
            showLoading("Creating course...", "Please wait");

            const fd = new FormData();

            fd.append("title", formData.title || "");
            fd.append("description", formData.description || "");

            const modulesPayload = formData.modules.map((mod) => ({
                title: mod.title || "",
                uploadFiles: [],
            }));
            fd.append("modules", JSON.stringify(modulesPayload));

            formData.modules.forEach((mod, index) => {
                mod.media?.forEach((file) => {
                    if (file instanceof File) {
                        fd.append(`uploadFilesModule_${index + 1}`, file);
                    }
                });
            });

            const questionsPayload = formData.assessment.map((q) => ({
                question: q.question || "",
                options: q.options.map((o) => o.text),
                answer: q.options.find((o) => o.correct)?.text || "",
            }));
            fd.append("questions", JSON.stringify(questionsPayload));

            fd.append(
                "duration",
                `${formData.settings.duration} ${formData.settings.durationType}`
            );
            fd.append("reTakeCourse", formData.settings.retake || "");
            fd.append("passingConditionValue", formData.settings.passValue || "");
            fd.append(
                "setReminderEvery",
                `${formData.settings.reminderValue} ${formData.settings.reminderType}`
            );
            fd.append("isCompulsory", formData.settings.compulsory);

            fd.append("certificateTitle", formData.certificate.title || "");
            if (formData.certificate.file instanceof File) {
                fd.append("uploadCertificate", formData.certificate.file);
            }

            fd.append(
                "notifiedUsers",
                JSON.stringify(selectedCoachIds.map(Number))
            );

            const res = await fetch(
                `${API_BASE_URL}/api/admin/course/create`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: fd,
                }
            );

            const result = await res.json();

            // ❗ API error handling
            if (!res.ok) {
                throw new Error(result?.message || "Course creation failed");
            }

            showSuccess("Course Created", result?.message || "Your course has been created successfully");

            navigate("/configuration/coach-pro/courses");

        } catch (error) {
            showError("Failed", error.message || "Something went wrong");

            console.error("ERROR:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    if (loading) {
        return (
            <Loader />
        )
    }


    return (
        <div className="p-8 bg-[#F7F8FA] ">

            <button onClick={() => navigate(`/configuration/coach-pro/courses`)} className="flex items-center gap-2 text-gray-700 mb-4">
                <ArrowLeft size={18} />
                <span className="font-semibold text-xl">Create a Course</span>
            </button>

            <div className="bg-white min-h-screen pb-5  border overflow-auto border-[#E2E1E5] rounded-4xl overflow-hidden ">

                <div className="flex p-8 border-b px-14 overflow-auto border-[#E2E1E5] justify-center items-center gap-5 text-[13px] font-medium bg-[#FAFAFA] text-[#8A8A8A]">
                    {steps.map((label, index) => (
                        <div key={index} className="flex flex-col w-full">

                            <div className="flex gap-2 items-center ">
                                {activeStep > index && (
                                    <>
                                        <img src="/reportsIcons/check.png" className="w-4" alt="" />
                                    </>
                                )}
                                <span
                                    className={`text-[18px] font-medium ${activeStep === index
                                        ? "text-black"
                                        : activeStep > index
                                            ? "text-[#282829]"
                                            : "text-[#717073]"
                                        }`}
                                >
                                    {label}
                                </span>
                            </div>
                            <div
                                className={`h-[8px]   transition-all  mt-2 
                ${activeStep === index
                                        ? "bg-[#237FEA]"
                                        : activeStep > index
                                            ? "bg-[#237FEA]"
                                            : "bg-[#DEDEDE]"
                                    }`}
                            ></div>
                        </div>
                    ))}
                </div>

                <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-8"
                >
                    {activeStep === 0 && (

                        <div className="space-y-6  w-1/2 mx-auto">

                            <div>
                                <label className="text-sm font-medium">Enter Course Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className={`${inputClass} w-full`}
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Enter Course Description
                                </label>
                                <textarea
                                    rows="5"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    className={`${inputClass} bg-gray-50 w-full`}
                                ></textarea>
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeStep === 1 && (
                        <div className="w-1/2 mx-auto space-y-6">


                            <div className="flex bg-[#FAFAFA] justify-between border border-[#E2E1E5] rounded-2xl p-3 items-center">
                                <h3 className="font-medium text-lg">
                                    Modules ({formData.modules.length})
                                </h3>
                                {errors.modules && (
                                    <p className="text-red-500 text-sm mt-2">
                                        {errors.modules}
                                    </p>
                                )}

                                <button
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            modules: [
                                                ...formData.modules,
                                                {
                                                    id: Date.now(),
                                                    title: "",
                                                    media: [],
                                                },
                                            ],
                                        });

                                        setErrors((p) => ({ ...p, modules: "" }));
                                    }}
                                    className="px-4 py-2 my-2 bg-[#237FEA] text-white rounded-lg text-sm"
                                >
                                    + Add Module
                                </button>

                            </div>


                            {formData.modules.map((module, index) => (
                                <div
                                    key={module.id}
                                    className="border border-gray-200 rounded-xl p-5 space-y-5 bg-white shadow-sm"
                                >

                                    <div>
                                        <label className="text-sm font-medium">Module Title</label>
                                        <input
                                            type="text"
                                            value={module.title}
                                            onChange={(e) => {
                                                const updated = [...formData.modules];
                                                updated[index].title = e.target.value;
                                                setFormData({ ...formData, modules: updated });

                                                if (index === 0) {
                                                    setErrors((p) => ({ ...p, moduleTitle_0: "" }));
                                                }
                                            }}
                                            className={`${inputClass} w-full mt-2 ${index === 0 && errors.moduleTitle_0 ? "border-red-500" : ""
                                                }`}
                                        />

                                        {index === 0 && errors.moduleTitle_0 && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.moduleTitle_0}
                                            </p>
                                        )}

                                    </div>


                                    <div>
                                        <input
                                            id={`mediaUpload_${module.id}`}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                const updated = [...formData.modules];

                                                updated[index].media = [
                                                    ...updated[index].media,
                                                    ...files,
                                                ];

                                                setFormData({ ...formData, modules: updated });

                                                if (index === 0) {
                                                    setErrors((p) => ({ ...p, moduleMedia_0: "" }));
                                                }
                                            }}

                                        />


                                        <div
                                            onClick={() =>
                                                document.getElementById(`mediaUpload_${module.id}`).click()
                                            }
                                            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex justify-center items-center cursor-pointer text-gray-500 text-sm bg-gray-50"
                                        >
                                            + Add Media
                                        </div>
                                        {index === 0 && errors.moduleMedia_0 && (
                                            <p className="text-red-500 text-sm mt-2">
                                                {errors.moduleMedia_0}
                                            </p>
                                        )}

                                        {module.media.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                {module.media.map((file, mediaIndex) => (
                                                    <div
                                                        key={mediaIndex}
                                                        className="relative border rounded-lg p-2 bg-white"
                                                    >

                                                        <button
                                                            onClick={() => {
                                                                const updated = [...formData.modules];
                                                                updated[index].media = updated[index].media.filter(
                                                                    (_, i) => i !== mediaIndex
                                                                );
                                                                setFormData({ ...formData, modules: updated });
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex justify-center items-center text-sm shadow"
                                                        >
                                                            ×
                                                        </button>

                                                        {file.type.startsWith("image/") ? (
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                className="w-full h-28 object-cover rounded-md"
                                                                alt="preview"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-700 truncate">
                                                                📄 {file.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}



                    {activeStep === 2 && (
                        <div className="space-y-6 ">
                            {/* Header */}
                            <div className="flex justify-between items-center border-b border-[#E2E1E5] pb-6 px-6">
                                <h3 className="font-semibold text-xl">Questions</h3>
                                <button
                                    onClick={addQuestion}
                                    className="px-4 py-2 bg-[#237FEA] text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                                >
                                    <Plus size={14} /> Add new question
                                </button>
                            </div>

                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="questions" type="QUESTION">
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4 px-6">
                                            {formData.assessment.map((q, qIndex) => (
                                                <Draggable key={q.id} draggableId={q.id} index={qIndex}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="bg-white rounded-2xl border border-gray-300 overflow-hidden"
                                                        >
                                                            {/* Compact header (always visible) */}
                                                            <div className="flex items-center justify-between p-4 pb-0  rounded-t-2xl">
                                                                <div className="block items-center gap-3 w-full  m-auto relative">
                                                                    <span {...provided.dragHandleProps} className="absolute w-full max-w-fit top-2 right-0 left-0  text-gray-400 flex justify-center  mx-auto cursor-grab">
                                                                        <GripVertical size={18} className="rotate-90" />
                                                                    </span>
                                                                    {collapsedMap[q.id] && (<div className="flex flex-col min-w-0">
                                                                        <div className="text-base font-semibold text-[#3E3E47] pb-5  truncate">
                                                                            {q.question?.trim() ? q.question : "Untitled question"}
                                                                        </div>

                                                                    </div>)}
                                                                </div>

                                                                <div onClick={() =>
                                                                    setCollapsedMap((p) => ({ ...p, [q.id]: !p[q.id] }))
                                                                } className="flex items-center gap-3">

                                                                    <MoreVertical size={18} className="text-gray-400" />
                                                                </div>
                                                            </div>

                                                            {/* Expanded editor */}
                                                            {!collapsedMap[q.id] && (
                                                                <>
                                                                    <div className="p-5 pt-0 space-y-4">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="What are the roles we have at SSS?"
                                                                            value={q.question}
                                                                            onChange={(e) => {
                                                                                const updated = [...formData.assessment];
                                                                                updated[qIndex].question = e.target.value;
                                                                                setFormData({ ...formData, assessment: updated });
                                                                            }}
                                                                            className="w-full text-base font-semibold text-[#3E3E47] px-0 pb-3 mb-0 text-base outline-none"
                                                                        />

                                                                        <div>
                                                                            <div className="text-sm text-gray-600 mb-2">
                                                                                Answers ({q.options.length})
                                                                            </div>

                                                                            <Droppable droppableId={`options-${q.id}`} type={`OPTION`}>
                                                                                {(provided) => (
                                                                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                                                        {q.options.map((opt, optIndex) => (
                                                                                            <Draggable key={opt.id} draggableId={opt.id} index={optIndex}>
                                                                                                {(prov) => (
                                                                                                    <div
                                                                                                        ref={prov.innerRef}
                                                                                                        {...prov.draggableProps}
                                                                                                        className="flex items-center gap-3  "
                                                                                                    >
                                                                                                        <span {...prov.dragHandleProps} className="text-gray-400 cursor-grab">
                                                                                                            <GripVertical size={16} />
                                                                                                        </span>

                                                                                                        <input
                                                                                                            type="radio"
                                                                                                            checked={opt.correct}
                                                                                                            onChange={() => setCorrectOption(qIndex, opt.id)}
                                                                                                        />

                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={opt.text}
                                                                                                            placeholder="Enter option"
                                                                                                            onChange={(e) => {
                                                                                                                const updated = [...formData.assessment];
                                                                                                                updated[qIndex].options[optIndex].text = e.target.value;
                                                                                                                setFormData({ ...formData, assessment: updated });
                                                                                                            }}
                                                                                                            className="w-1/2 border rounded-xl px-4 py-3 bg-[#FAFAFA] border-[#E2E1E5] text-sm outline-none"
                                                                                                        />
                                                                                                    </div>
                                                                                                )}
                                                                                            </Draggable>
                                                                                        ))}
                                                                                        {provided.placeholder}
                                                                                    </div>
                                                                                )}
                                                                            </Droppable>

                                                                            <button
                                                                                onClick={() => addOption(qIndex)}
                                                                                className="px-4 ml-14 mt-5 py-2 bg-[#237FEA] text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                                                                            >
                                                                                <Plus size={14} /> Add Option
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Footer actions */}
                                                                    <div className="flex justify-end p-4 border-t border-gray-300">
                                                                        <button
                                                                            onClick={() => setCollapsedMap((p) => ({ ...p, [q.id]: true }))}
                                                                            className="px-4 py-2 bg-[#237FEA] text-white rounded-lg text-sm"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}

                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    )}

                    {activeStep === 3 && (
                        <div className="space-y-3 ">

                            <div className="flex justify-between items-center border-b border-[#E2E1E5] pb-3 px-6">
                                <h2 className="text-xl font-semibold mb-4">General Settings</h2>

                            </div>
                            <div className="p-6">
                                {/* Duration */}
                                <div className="border-b border-[#E2E1E5]  pb-5">
                                    <div className="flex gap-10 w-1/2">
                                        <div className="min-w-[320px] max-w-[320px]">
                                            <label className="font-semibold text-base ">Duration</label>
                                        </div>
                                        <div>
                                            <div className="flex gap-4 mt-2 items-center">
                                                <input
                                                    type="number"
                                                    value={formData.settings.duration || ""}
                                                    onChange={(e) => {
                                                        setFormData({
                                                            ...formData,
                                                            settings: { ...formData.settings, duration: e.target.value },
                                                        });
                                                        setErrors((p) => ({ ...p, duration: "" }));
                                                    }}
                                                    className={`${inputClass} ${errors.duration ? "border-red-500" : ""}`}
                                                />


                                                <select
                                                    value={formData.settings.durationType}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            settings: { ...formData.settings, durationType: e.target.value },
                                                        })
                                                    }
                                                    className={`${inputClass}  ${errors.duration ? "border-red-500" : ""}`}
                                                >
                                                    <option value=''>Select Duration</option>
                                                    <option value='Minutes'>Minutes</option>
                                                    <option value='Hours'>Hours</option>
                                                    <option value='Days'>Days</option>
                                                </select>
                                                {errors.durationType && (
                                                    <p className="text-red-500 text-sm pt-1">{errors.durationType}</p>
                                                )}
                                            </div>

                                            <p className="text-gray-500 text-sm mt-2">
                                                The duration of the course.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Re-take Course */}
                                <div className="border-b border-[#E2E1E5] py-5">
                                    <div className="flex  gap-10 w-1/2">
                                        <div className="min-w-[320px] max-w-[320px]">
                                            <label className="font-semibold text-base ">Re-take Course</label>
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                value={formData.settings.retake || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        settings: { ...formData.settings, retake: e.target.value },
                                                    })
                                                }
                                                className={inputClass}
                                            />



                                            {errors.retake && (
                                                <p className="text-red-500 text-sm mt-1">{errors.retake}</p>
                                            )}
                                            <p className="text-gray-500 text-sm mt-2">
                                                How many times a user can re-take this course. Set to 0 to disable.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Passing Condition */}
                                <div className="border-b border-[#E2E1E5] py-5">
                                    <div className="flex  gap-10 w-1/2">
                                        <div className="min-w-[320px] max-w-[320px]">
                                            <label className="font-semibold text-base ">Passing Condition Value</label>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <input
                                                    type="number"
                                                    value={formData.settings.passValue || ""}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            settings: { ...formData.settings, passValue: e.target.value },
                                                        })
                                                    }
                                                    className={inputClass}
                                                />



                                                <span className="text-gray-600 text-lg">%</span>
                                            </div>
                                            {errors.passValue && (
                                                <p className="text-red-500 text-sm mt-1">{errors.passValue}</p>
                                            )}

                                            <p className="text-gray-500 text-sm mt-2">
                                                The passing percentage required.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Compulsory Course */}
                                <div className="border-b border-[#E2E1E5] py-5">
                                    <div className="flex  gap-10 w-1/2">
                                        <div className="min-w-[320px] max-w-[320px]">
                                            <label className="font-semibold text-base  block mb-3">
                                                Is this course compulsory?
                                            </label>
                                        </div>
                                        <div>
                                            <div className="space-y-2 text-sm">
                                                <label className="flex gap-3 items-center">
                                                    <input
                                                        type="radio"
                                                        checked={formData.settings.compulsory === true}
                                                        onChange={() =>
                                                            setFormData({
                                                                ...formData,
                                                                settings: { ...formData.settings, compulsory: true },
                                                            })
                                                        }
                                                    />
                                                    Yes
                                                </label>

                                                <label className="flex gap-3 items-center">
                                                    <input
                                                        type="radio"
                                                        checked={formData.settings.compulsory === false}
                                                        onChange={() =>
                                                            setFormData({
                                                                ...formData,
                                                                settings: { ...formData.settings, compulsory: false },
                                                            })
                                                        }
                                                    />
                                                    No
                                                </label>

                                                {errors.compulsory && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.compulsory}</p>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-5">
                                    <div className="flex  gap-10 w-1/2">
                                        <div className="min-w-[320px] max-w-[320px]">
                                            <label className="font-semibold text-base ">Set reminder Every</label>
                                        </div>
                                        <div>
                                            <div className="flex gap-4 mt-2 items-center">
                                                <input
                                                    type="number"
                                                    value={formData.settings.reminderValue || ""}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            settings: { ...formData.settings, reminderValue: e.target.value },
                                                        })
                                                    }
                                                    className={inputClass}
                                                />

                                                <select
                                                    value={formData.settings.reminderType}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            settings: { ...formData.settings, reminderType: e.target.value },
                                                        })
                                                    }
                                                    className={inputClass}
                                                >
                                                    <option value=''>Select Reminder type</option>
                                                    <option value='Minutes'>Minutes</option>
                                                    <option value='Hours'>Hours</option>
                                                    <option value='Days'>Days</option>
                                                </select>
                                                {errors.reminderType && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.reminderType}</p>
                                                )}
                                            </div>

                                            {errors.reminderType && (
                                                <p className="text-red-500 text-sm mt-1">{errors.reminderType}</p>
                                            )}
                                            <p className="text-gray-500 text-sm mt-2">
                                                Reminder will start once user has completed course.
                                            </p>
                                        </div></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStep === 4 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-6">

                            <div className="space-y-6">


                                <div>
                                    <label className="font-semibold text-base">Certificate Title</label>
                                    <input
                                        type="text"
                                        value={formData.certificate.title || ""}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                certificate: {
                                                    ...formData.certificate,
                                                    title: e.target.value,
                                                },
                                            });

                                            setErrors((p) => ({ ...p, certificateTitle: "" }));
                                        }}
                                        className={`${inputClass} w-10/12 block mt-2 ${errors.certificateTitle ? "border-red-500" : ""
                                            }`}
                                    />

                                    {errors.certificateTitle && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.certificateTitle}
                                        </p>
                                    )}

                                </div>

                                <div>
                                    <label className="font-semibold text-xl">Upload Certificate</label>
                                    <br />

                                    <input
                                        type="file"
                                        id="uploadDoc"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            setFormData({
                                                ...formData,
                                                certificate: {
                                                    ...formData.certificate,
                                                    file,
                                                },
                                            });
                                        }}
                                    />


                                    <button
                                        type="button"
                                        onClick={() => document.getElementById("uploadDoc").click()}
                                        className="mt-4 px-4 py-2 bg-[#237FEA] text-white rounded-lg text-sm font-semibold"
                                    >
                                        + Upload Document
                                    </button>
                                    {errors.certificateFile && (
                                        <p className="text-red-500 text-sm mt-2">
                                            {errors.certificateFile}
                                        </p>
                                    )}


                                </div>


                                <div className="mt-8">
                                    <label className="flex gap-3 items-center text-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.certificate.disabled || false}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    certificate: {
                                                        ...formData.certificate,
                                                        disabled: e.target.checked,
                                                    },
                                                })
                                            }
                                        />
                                        Disable Certificate
                                    </label>
                                </div>
                            </div>


                            <div>
                                <h3 className="font-semibold text-base mb-3">Certificate Preview</h3>

                                <div className="border border-[#E2E1E5] bg-[#FAFAFA] overflow-hidden bg-white p-4">
                                    <img
                                        src={
                                            formData?.certificate?.file &&
                                                formData.certificate.file.type.startsWith("image/")
                                                ? URL.createObjectURL(formData.certificate.file)
                                                : "/reportsIcons/img-certificate.png"
                                        }

                                        className="w-full rounded-lg"
                                        alt="certificate preview"
                                    />
                                </div>
                            </div>

                        </div>
                    )}


                    {activeStep === 5 && (
                        <div className="py-6 px-6 w-full md:w-1/2 font-bold">
                            <div>
                                <label className="font-semibold text-xl text-[#3E3E47]">
                                    Select who is notified about this course
                                </label>

                                <div className="flex relative">
                                    <Search className="absolute left-4 bottom-1 -translate-y-1/2 text-gray-500" />

                                    <Select
                                        isMulti
                                        options={coachOptions}
                                        placeholder="Select coaches"
                                        className={`mt-3 w-full ${errors.notifiedUsers ? "react-select-error" : ""
                                            }`}
                                        classNamePrefix="react-select"
                                        value={coachOptions.filter((opt) =>
                                            selectedCoachIds.includes(opt.value)
                                        )}
                                        onChange={(selected) => {
                                            const ids = Array.isArray(selected)
                                                ? selected.map((item) => item.value)
                                                : [];

                                            setSelectedCoachIds(ids);
                                            setErrors((p) => ({ ...p, notifiedUsers: "" }));
                                        }}
                                        isClearable
                                        isSearchable
                                        noOptionsMessage={() => "No coaches found"}
                                    />




                                </div>
                                {errors.notifiedUsers && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.notifiedUsers}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                </motion.div>


                <div
                    className={`flex gap-2 px-4 mx-auto mt-10 ${activeStep > 1
                        ? "w-full justify-start"
                        : activeStep === 3
                            ? "justify-end w-full"
                            : "w-1/2 justify-between"
                        }`}
                >
                    <button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        className={`px-6 py-3 border border-gray-300 rounded-lg ${activeStep === 0
                            ? "opacity-    cursor-not-allowed"
                            : "hover:bg-gray-100 hover:border-gray-600"
                            }`}
                    >
                        Back
                    </button>

                    {activeStep < steps.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="px-6 py-3 bg-[#237FEA] min-w-32 text-white rounded-lg hover:bg-blue-600"
                        >
                            Next
                        </button>
                    ) : (
                        <button onClick={handleSubmit} className="px-6 py-3 bg-[#237FEA] text-white rounded-lg ">
                            Finish
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
