import Select from "react-select";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import Loader from '../../../contexts/Loader';
import { Editor } from '@tinymce/tinymce-react';
import { showError, showSuccess, showWarning } from '../../../../../../utils/swalHelper';

import { usePayments } from '../../../contexts/PaymentPlanContext';
import PlanTabs from "../../../weekly-classes/find-a-class/PlanTabs";
import { usePermission } from "../../../Common/permission";

const AddPaymentPlanGroup = () => {
    const [isSavePlan, setIsSavePlan] = useState(false);
    const MultiValue = () => null; // Hides the default selected boxes

    const [submitloading, setSubmitLoading] = useState(false);

    const [groupName, setGroupName] = useState('');
    const [previewShowModal, setPreviewShowModal] = useState(false);
    const { fetchPackages, groups, createPackage, fetchGroupById, loading, createGroup, selectedGroup, packages, updateGroup, setPackages } = usePayments();
    const [selectedPlans, setSelectedPlans] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, [])
    useEffect(() => {
        if (id) {
            console.log('id foud');
            setIsEditMode(true);
            fetchGroupById(id);
        } else {
            // setIsLoading(false);
        }
    }, [id]);

    const [description, setDescription] = useState('');
    const [packageDetails, setPackageDetails] = useState('');
    const [terms, setTerms] = useState('');
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        priceLesson: '',
        interval: '',
        duration: '',
        students: '',
        termsAndCondition: '',
        HolidayCampPackage: '',

    });

    const [formIsDirty, setFormIsDirty] = useState(false);

    const formatStudentLabel = (plan) => {
        if (plan.students > 0) {
            return `${plan.title}: ${plan.students} ${plan.students === 1 ? 'Student' : 'Students'}`;
        }
        return `${plan.title}`;
    };

    const planOptions = packages.map((plan) => ({
        value: plan.id,
        label: formatStudentLabel(plan),
        data: plan,
    }));

    const selectedOptions = selectedPlans.map((plan) => ({
        value: plan.id,
        label: formatStudentLabel(plan),
        data: plan,
    }));


    const handleSelectChange = (selected) => {
        setSelectedPlans(selected ? selected.map((item) => item.data) : []);
    };
    useEffect(() => {
        const getPackages = async () => {
            try {
                const response = await fetchPackages();
                console.log("Fetched packages:", response);

                if (response?.status && Array.isArray(response.data)) {
                    setPlans(response.data); // Set the dynamic plans from backend
                }

            } catch (error) {
                console.error("Error fetching packages:", error);
            }
        };

        getPackages();
    }, [fetchPackages]);
    const previewPlans = [
        { students: '1 Student', price: '£99.99' },
        { students: '2 Student', price: '£99.99' },
        { students: '3 Student', price: '£99.99' },
    ];

    const [openForm, setOpenForm] = useState(false);
    const navigate = useNavigate();

    const handleAddPlan = () => {
        setOpenForm(true);
    };
    const handleTogglePlan = (plan) => {
        const isSelected = selectedPlans.some((p) => p.id === plan.id);
        if (isSelected) {
            setSelectedPlans(selectedPlans.filter((p) => p.id !== plan.id));
        } else {
            setSelectedPlans([...selectedPlans, plan]);
        }
    };

    const handleRemovePlan = (index) => {
        const updated = [...selectedPlans];
        updated.splice(index, 1);
        setSelectedPlans(updated);
    };

    const filteredPlans = useMemo(() => {
        return packages.filter((plan) =>
            plan.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);
    const handleCreateGroup = async () => {
        setSubmitLoading(true); // start loader
        const ids = selectedPlans.map(plan => plan.id).join(',');
        const payload = {
            name: groupName,
            description: description,
            plans: ids
        };

        try {
            await createGroup(payload);
        } catch (err) {
            console.error("Error creating group:", err);
        } finally {
            setSubmitLoading(false); // stop loader
        }
    };

    const handleUpdateGroup = async () => {
        setSubmitLoading(true); // start loader
        const ids = selectedPlans.map(plan => plan.id).join(',');
        const payload = {
            name: groupName,
            description: description,
            plans: ids
        };

        try {
            await updateGroup(id, payload);
        } catch (err) {
            console.error("Error updating group:", err);
        } finally {
            setSubmitLoading(false); // stop loader
        }
    };
    const priceFields = ["price", "priceLesson"];

    const handleSavePlan = async () => {


        const { title, price, priceLesson, interval, duration, students } = formData;

        // ✅ Validation

        if (!title || !price || !interval || !priceLesson || !duration || !students) {
            showWarning("Missing Fields", "Please fill in all required fields: Title, Price, Interval, Duration, and Number of Students.");
            return;
        }

        const newPlan = {
            title,
            price,
            priceLesson,
            interval,
            duration,
            students,
            termsAndCondition: formData.termsAndCondition,
            HolidayCampPackage: formData.HolidayCampPackage
        };

        setIsSavePlan(true);

        try {
            await createPackage(newPlan);

            // Success
            showSuccess("Saved", "Plan saved successfully!");

            // Clear form
            setFormData({
                title: '',
                price: '',
                interval: '',
                duration: '',
                students: '',
                termsAndCondition: '',
                HolidayCampPackage: ''
            });

            setPackageDetails('');
            setTerms('');
            setOpenForm(false);
        } catch (err) {
            console.error('Error saving plan:', err);
            console.error('Error saving plan:', err);
            showError("Save Failed", "There was an error saving the plan. Please try again.");
        } finally {
            setIsSavePlan(false);
        }
    };

    useEffect(() => {
        if (id && selectedGroup) {
            setGroupName(selectedGroup.name || "");
            setDescription(selectedGroup.description || "");
            setSelectedPlans(selectedGroup.paymentPlans || []);
        }
    }, [selectedGroup]);
    const sortedOptions = planOptions.sort((a, b) => {
        const aSelected = selectedOptions.some(o => o.value === a.value);
        const bSelected = selectedOptions.some(o => o.value === b.value);

        // If a is selected and b is not, a goes after b
        if (aSelected && !bSelected) return 1;
        if (!aSelected && bSelected) return -1;
        return 0; // keep original order if both selected or both unselected
    });
    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }
    const { checkPermission } = usePermission();

    const canCreate =
        checkPermission({ module: 'payment-plan', action: 'create' });

    console.log('formData.HolidayCampPackage', formData.HolidayCampPackage)
    return (
        <div className=" md:p-6 bg-gray-50 min-h-screen">

            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2`}>
                <h2
                    onClick={() => {
                        if (previewShowModal) {
                            setPreviewShowModal(false);
                        } else {
                            navigate('/configuration/weekly-classes/subscription-planManager');
                        }
                    }}
                    className="text-xl md:text-2xl font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                    <img
                        src="/images/icons/arrow-left.png"
                        alt="Back"
                        className="w-5 h-5 md:w-6 md:h-6"
                    />
                    <span className="truncate">
                        {previewShowModal ? `${selectedGroup?.name} ` : 'Add Membership Plan Group'}
                    </span>
                </h2>


            </div>

            <div className={`flex flex-col md:flex-row bg-white rounded-3xl ${previewShowModal ? ' m-auto  md:p-10' : 'w-full  md:p-12 p-4'}`}>
                {previewShowModal && (
                    <div className="flex items-center rounded-3xl max-w-fit justify-left bg-white md:w-full px-4 py-6 sm:px-6 md:py-10">
                        <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl">

                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E1E5] pb-4 mb-4 gap-2">
                                <h2 className="font-semibold text-[20px] sm:text-[24px]">Subscription Plan</h2>
                                <button
                                    onClick={() => setPreviewShowModal(false)}
                                    className="text-gray-400 hover:text-black text-xl font-bold"
                                >
                                    <img src="/images/icons/cross.png" alt="close" className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Plans Grid */}
                            <PlanTabs selectedPlans={selectedPlans} />


                        </div>
                    </div>

                ) ||
                    <>
                        <div className={`transition-all duration-300 md:w-1/2`}>
                            <div className="rounded-2xl w-full md:p-12 ">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();

                                        // --- VALIDATION USING swalHelper ONLY ---
                                        if (!groupName.trim()) {
                                            showWarning("Group Name Missing", "Please enter a Payment Plan Group Name.");
                                            return;
                                        }

                                        if (!description.trim()) {
                                            showWarning("Description Missing", "Please enter a description.");
                                            return;
                                        }

                                        if (selectedPlans.length === 0) {
                                            showWarning("No Plans Selected", "Please select at least one Membership Plan.");
                                            return;
                                        }

                                        // --- SUBMIT ACTION ---
                                        if (id && selectedGroup) {
                                            handleUpdateGroup();
                                        } else {
                                            handleCreateGroup();
                                        }
                                    }}
                                    className="mx-auto space-y-6"
                                >
                                    {/* Group Name */}
                                    <div>
                                        <label className="block text-[18px]  font-semibold text-[#282829] mb-2">
                                            Membership Plan Group Name
                                        </label>
                                        <input
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            type="text"

                                            placeholder="Enter Group Name"
                                            className="w-full px-4  text-[#282829] font-semibold py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-[18px]  font-semibold text-[#282829] mb-2">
                                            Description
                                        </label>
                                        <input

                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            type="text"

                                            placeholder="Add Internal reference"
                                            className="w-full  text-[#282829] px-4 font-semibold py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Payment Plans */}
                                    <div className="w-full space-y-3">
                                        <label className="block text-[18px] font-semibold text-[#282829]">
                                            Membership Plan
                                        </label>

                                        {/* Selected summary */}
                                        <div className="w-full mb-5 px-4 font-semibold py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {selectedPlans.length > 0 ? (
                                                selectedPlans.map((plan, idx) => (
                                                    <div
                                                        key={plan.id || idx}
                                                        className="flex items-center justify-between font-semibold"
                                                    >
                                                        <span>
                                                            {plan.students > 0
                                                                ? `${plan.title}: ${plan.students} ${plan.students === 1 ? 'Student' : 'Students'}`
                                                                : ''}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePlan(idx)}
                                                            className="text-gray-500 hover:text-red-500"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-[#717073]">
                                                    No plans selected
                                                </div>
                                            )}
                                        </div>

                                        {/* Select (always visible) */}
                                        <Select
                                            options={sortedOptions}
                                            value={selectedOptions}
                                            onChange={handleSelectChange}
                                            isMulti
                                            placeholder="Select Membership plans..."
                                            closeMenuOnSelect={false}
                                            hideSelectedOptions={false}
                                            isClearable
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            classNamePrefix="react-select"
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    minHeight: "52px",
                                                    borderRadius: "12px",
                                                    borderColor: state.isFocused ? "#3B82F6" : "#E5E7EB",
                                                    boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.4)" : "none",
                                                    padding: "0 6px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    "&:hover": {
                                                        borderColor: "#3B82F6",
                                                    },
                                                }),

                                                valueContainer: (base) => ({
                                                    ...base,
                                                    padding: "0 8px",
                                                }),

                                                input: (base) => ({
                                                    ...base,
                                                    margin: 0,
                                                    padding: 0,
                                                }),

                                                multiValue: (base) => ({
                                                    ...base,
                                                    backgroundColor: "#EFF6FF",
                                                    borderRadius: "8px",
                                                    padding: "2px 4px",
                                                }),

                                                multiValueLabel: (base) => ({
                                                    ...base,
                                                    color: "#1E40AF",
                                                    fontWeight: 600,
                                                }),

                                                multiValueRemove: (base) => ({
                                                    ...base,
                                                    color: "#1E40AF",
                                                    cursor: "pointer",
                                                    ":hover": {
                                                        backgroundColor: "#DBEAFE",
                                                        color: "#1E3A8A",
                                                    },
                                                }),

                                                menu: (base) => ({
                                                    ...base,
                                                    borderRadius: "12px",
                                                    zIndex: 9999,
                                                }),

                                                option: (base, state) => ({
                                                    ...base,
                                                    backgroundColor: state.isSelected
                                                        ? "#3B82F6"
                                                        : state.isFocused
                                                            ? "#EFF6FF"
                                                            : "#fff",
                                                    color: state.isSelected ? "#fff" : "#111827",
                                                    cursor: "pointer",
                                                }),
                                            }}
                                        />

                                    </div>


                                    {canCreate &&
                                        <button
                                            type="button"
                                            onClick={handleAddPlan}
                                            className="w-full bg-[#237FEA] mb-8 text-white text-[16px] font-normal py-3 rounded-xl hover:bg-blue-700"
                                        >
                                            Add Membership Plan
                                        </button>
                                    }
                                    {/* Footer Buttons */}
                                    <div className="flex flex-wrap flex-col-reverse gap-4 md:flex-row md:items-center md:justify-end md:gap-4">

                                        {selectedPlans.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewShowModal(true)}
                                                className="flex items-center justify-center gap-1 border-3 border-[#3F8FED] text-[#3F8FED] px-4 py-2 rounded-xl font-medium hover:bg-blue-50 w-full md:w-auto"
                                            >
                                                Preview Membership Plans
                                                <Eye size={19} />
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submitloading}
                                            className={`bg-[#3F8FED] text-white min-w-50 border-3 border-[#3F8FED] font-medium px-6 py-2 rounded-xl w-full md:w-auto ${submitloading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
                                                }`}
                                        >
                                            {loading
                                                ? (id && selectedGroup ? "Updating..." : "Creating...")
                                                : (id && selectedGroup ? "Save Group" : "Create Group")}
                                        </button>

                                    </div>

                                </form>
                            </div>
                        </div>

                        <AnimatePresence>
                            {openForm && (
                                <motion.div
                                    initial={{ x: '100%', opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: '100%', opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full md:w-1/2 bg-white rounded-3xl p-6 shadow-2xl relative"
                                >
                                    <button
                                        onClick={() => setOpenForm(false)}
                                        className="absolute top-2 right-3  hover:text-[#282829] text-5xl"
                                        title="Close"
                                    >
                                        &times;
                                    </button>
                                    {/* Add your form content here */}
                                    <div className="text-[24px] font-semibold mb-4">Membership Plan</div>
                                    {[
                                        { label: "Title", name: "title", type: "text" },
                                        { label: "Price (£)", name: "price", type: "number" },
                                        { label: "Price per lesson(£)", name: "priceLesson", type: "number" },
                                        {
                                            label: "Interval",
                                            name: "interval",
                                            type: "dropdown",
                                            options: ["Month", "Quarter", "Year"]
                                        },
                                        { label: "Duration", name: "duration", type: "number" },
                                        { label: "Number of Students", name: "students", type: "number" },
                                    ].map((field) => {
                                        // Duration options for dropdown
                                        let durationOptions = [];
                                        if (field.name === "duration") {
                                            if (formData.interval === "Month") {
                                                durationOptions = Array.from({ length: 12 }, (_, i) => ({
                                                    label: `${i + 1} month${i + 1 > 1 ? "s" : ""}`,
                                                    value: i + 1
                                                }));
                                            } else if (formData.interval === "Year") {
                                                durationOptions = Array.from({ length: 20 }, (_, i) => ({
                                                    label: `${i + 1} year${i + 1 > 1 ? "s" : ""}`,
                                                    value: i + 1
                                                }));
                                            } else if (formData.interval === "Quarter") {
                                                durationOptions = Array.from({ length: 8 }, (_, i) => ({
                                                    label: `${i + 1} quarter${i + 1 > 1 ? "s" : ""}`,
                                                    value: i + 1
                                                }));
                                            }
                                        }

                                        return (
                                            <div key={field.name} className="mb-4">
                                                <label className="block text-[18px] font-semibold text-[#282829] mb-2">
                                                    {field.label}
                                                </label>

                                                {field.name === "interval" ? (
                                                    <Select
                                                        options={field.options.map((opt) => ({ label: opt, value: opt }))}
                                                        value={
                                                            formData.interval
                                                                ? { label: formData.interval, value: formData.interval }
                                                                : null
                                                        }
                                                        onChange={(selected) =>
                                                            setFormData({ ...formData, interval: selected.value })
                                                        }
                                                        className="text-[18px] font-semibold"
                                                        classNamePrefix="react-select"
                                                        styles={{
                                                            control: (provided) => ({
                                                                ...provided,
                                                                borderRadius: "0.5rem",
                                                                padding: "4px",
                                                                borderColor: "#E5E7EB", // gray-200
                                                                boxShadow: "none",
                                                                "&:hover": { borderColor: "#3B82F6" } // blue-500
                                                            }),
                                                            dropdownIndicator: (provided) => ({
                                                                ...provided,
                                                                display: "none" // hides arrow icon
                                                            }),
                                                            indicatorSeparator: () => ({ display: "none" })
                                                        }}
                                                        placeholder=""
                                                    />
                                                ) : field.name === "duration" && formData.interval ? (
                                                    <select
                                                        value={formData.duration}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, duration: e.target.value })
                                                        }
                                                        className="w-full px-4 py-3 font-semibold text-[18px] text-[#282829]  border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-transparent"
                                                    >
                                                        <option value="" disabled>
                                                            Select Duration
                                                        </option>
                                                        {durationOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : field.type === "number" ? (
                                                    <input
                                                        type="text"
                                                        value={formData[field.name]}
                                                        onChange={(e) => {
                                                            const value = e.target.value;

                                                            // Allow only valid price format for price fields
                                                            if (priceFields.includes(field.name)) {
                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                    setFormData({ ...formData, [field.name]: value });
                                                                }
                                                                return;
                                                            }

                                                            // Normal text fields
                                                            setFormData({ ...formData, [field.name]: value });
                                                        }}
                                                        onPaste={(e) => {
                                                            const paste = e.clipboardData.getData("text");

                                                            if (
                                                                priceFields.includes(field.name) &&
                                                                !/^\d*\.?\d{0,2}$/.test(paste)
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3 font-semibold text-[18px] text-[#282829]
               border border-gray-200 rounded-lg focus:outline-none
               focus:ring-2 focus:ring-blue-500 appearance-none bg-transparent"
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={formData[field.name]}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, [field.name]: e.target.value })
                                                        }
                                                        className="w-full  text-[#282829] px-4 py-3 font-semibold text-[18px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-transparent"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}




                                    <div className="mb-4 relative">
                                        <label className="block text-[18px] font-semibold text-[#282829] mb-2">
                                            Membership Package Details
                                        </label>
                                        <div className="rounded-md border border-gray-300 bg-gray-100 p-1">
                                            <Editor
                                                apiKey="sqe5er2lyngzjf0armhqaw1u7ffh0xgjyzmb7unv5irietwa"
                                                value={formData.HolidayCampPackage}
                                                onEditorChange={(content) =>
                                                    setFormData({ ...formData, HolidayCampPackage: content })
                                                }
                                                init={{
                                                    menubar: false,
                                                    plugins: 'lists advlist',
                                                    toolbar: 'fontsizeselect capitalize bold italic underline alignleft aligncenter alignjustify',
                                                    height: 200,
                                                    branding: false,
                                                    content_style: `
  body {
    background-color: #f3f4f6;
 font-family: "Poppins", sans-serif !important;
    font-size: 1rem;
    padding: 0px; /* reduced padding */
    color: #111827;
  }

  * {
    font-family:"Poppins", sans-serif !important;
  }
`,
                                                    setup: (editor) => {
                                                        // Custom capitalize button
                                                        editor.ui.registry.addIcon(
                                                            'capitalize-icon',
                                                            '<img src="/images/icons/smallcaps.png" style="width:16px;height:16px;" />'
                                                        );
                                                        editor.ui.registry.addButton('capitalize', {
                                                            icon: 'capitalize-icon',
                                                            tooltip: 'Capitalize Text',
                                                            onAction: () => {
                                                                editor.formatter.register('capitalize', {
                                                                    inline: 'span',
                                                                    styles: { textTransform: 'capitalize' },
                                                                });
                                                                editor.formatter.toggle('capitalize');
                                                            },
                                                        });

                                                        // Remove className from content on init
                                                        editor.on('BeforeSetContent', (e) => {
                                                            if (e.content) {
                                                                e.content = e.content.replace(/\sclass="[^"]*"/g, '');
                                                            }
                                                        });

                                                        // Also clean pasted content
                                                        editor.on('PastePostProcess', (e) => {
                                                            e.node.innerHTML = e.node.innerHTML.replace(/\sclass="[^"]*"/g, '');
                                                        });
                                                    },
                                                }}
                                            />


                                        </div>
                                    </div>

                                    <div className="mb-4 relative">
                                        <label className="block text-[18px] font-semibold text-[#282829] mb-2">
                                            Terms & Conditions
                                        </label>
                                        <div className="rounded-md border border-gray-300 bg-gray-100 p-1">
                                            <Editor
                                                apiKey="sqe5er2lyngzjf0armhqaw1u7ffh0xgjyzmb7unv5irietwa"

                                                value={formData.termsAndCondition}
                                                onEditorChange={(content) =>
                                                    setFormData({ ...formData, termsAndCondition: content })
                                                }
                                                init={{
                                                    menubar: false,
                                                    plugins: 'lists advlist',
                                                    toolbar:
                                                        'fontsizeselect capitalize bold italic underline alignleft aligncenter alignjustify',
                                                    height: 200,
                                                    branding: false,
                                                    content_style: `
  body {
    background-color: #f3f4f6;
 font-family: "Poppins", sans-serif !important;
    font-size: 1rem;
    padding: 0px; /* reduced padding */
    color: #111827;
  }

  * {
    font-family:"Poppins", sans-serif !important;
  }
`,
                                                    setup: (editor) => {
                                                        // Register custom icon
                                                        editor.ui.registry.addIcon(
                                                            'capitalize-icon',
                                                            '<img src="/images/icons/smallcaps.png" style="width:16px;height:16px;" />'
                                                        );

                                                        // Register and add button
                                                        editor.ui.registry.addButton('capitalize', {
                                                            icon: 'capitalize-icon',
                                                            tooltip: 'Capitalize Text',
                                                            onAction: () => {
                                                                editor.formatter.register('capitalize', {
                                                                    inline: 'span',
                                                                    styles: { textTransform: 'capitalize' },
                                                                });

                                                                editor.formatter.toggle('capitalize');
                                                            },
                                                        });
                                                    },
                                                }}
                                                onInit={(evt, editor) => {
                                                    console.log('Editor initialized', editor);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <button
                                            onClick={handleSavePlan}
                                            disabled={isSavePlan}
                                            className={`bg-[#237FEA] text-white mt-5 min-w-50 font-semibold px-6 py-2 rounded-lg 
        ${isSavePlan ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                                        >
                                            {isSavePlan ? 'Saving...' : 'Save Plan'}
                                        </button>

                                    </div>



                                </motion.div>
                            )}
                        </AnimatePresence>

                    </>}
            </div>


        </div>
    );

}
export default AddPaymentPlanGroup;
