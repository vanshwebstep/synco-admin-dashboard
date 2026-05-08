import Select from "react-select";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import Loader from '../../../contexts/Loader';
import { Editor } from '@tinymce/tinymce-react';
import { showError, showSuccess } from "../../../../../../utils/swalHelper";
import PlanTabs from "../../../weekly-classes/find-a-class/PlanTabs";
import { usePermission } from "../../../Common/permission";
import { useHolidayPayments } from "../../../contexts/HolidayPaymentContext";

const HolidayAddPaymentPlanGroup = () => {
    const [isSavePlan, setIsSavePlan] = useState(false);
    const MultiValue = () => null; // Hides the default selected boxes

    const [submitloading, setSubmitLoading] = useState(false);

    const [groupName, setGroupName] = useState('');
    const [errors, setErrors] = useState({});
    const [planErrors, setPlanErrors] = useState({});
    const [previewShowModal, setPreviewShowModal] = useState(false);
    const { fetchPackages, groups, createPackage, fetchGroupById, loading, createGroup, selectedGroup, packages, updateGroup } = useHolidayPayments();
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
            setIsEditMode(true);
            fetchGroupById(id);
        } else {
            // setIsLoading(false);
        }
    }, [id]);

    console.log('selectedGroup', selectedGroup)

    const [description, setDescription] = useState('');
    const [packageDetails, setPackageDetails] = useState('');
    const [terms, setTerms] = useState('');
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        interval: '',
        duration: '',
        students: '',
        joiningFee: '',
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

                if (response?.status && Array.isArray(response.data)) {
                    setPlans(response.data); // Set the dynamic plans from backend
                }

            } catch (error) {
                console.error("Error fetching packages:", error);
            }
        };

        getPackages();
    }, [fetchPackages]);


    const [openForm, setOpenForm] = useState(false);
    const navigate = useNavigate();

    const handleAddPlan = () => {
        setOpenForm(true);
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
    const validateMainForm = () => {
        const newErrors = {};
        if (!groupName.trim()) newErrors.groupName = "Group name is required.";
        if (!description.trim()) newErrors.description = "Description is required.";
        if (selectedPlans.length === 0) newErrors.selectedPlans = "Please select at least one payment plan.";

        setErrors(newErrors);
        return newErrors;
    };

    const handleCreateGroup = async () => {
        const validationErrors = validateMainForm();
        if (Object.keys(validationErrors).length > 0) {
            const firstErrorField = Object.keys(validationErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus();
            }
            return;
        }

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
        const validationErrors = validateMainForm();
        if (Object.keys(validationErrors).length > 0) {
            const firstErrorField = Object.keys(validationErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus();
            }
            return;
        }

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

    const handleSavePlan = async () => {
        const { title, price, interval, duration, joiningFee, students } = formData;
        const newPlanErrors = {};

        if (!title) newPlanErrors.title = "Title is required.";
        if (!price) newPlanErrors.price = "Price is required.";
        if (!interval) newPlanErrors.interval = "Interval is required.";
        if (!duration) newPlanErrors.duration = "Duration is required.";
        if (!students) newPlanErrors.students = "Number of students is required.";
        if (!joiningFee) newPlanErrors.joiningFee = "Joining fee is required.";

        setPlanErrors(newPlanErrors);

        if (Object.keys(newPlanErrors).length > 0) {
            const firstErrorField = Object.keys(newPlanErrors)[0];
            const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus();
            }
            return;
        }

        const newPlan = {
            title,
            price,
            interval,
            duration,
            joiningFee,
            students,
            termsAndCondition: formData.termsAndCondition,
            HolidayCampPackage: formData.HolidayCampPackage
        };

        setIsSavePlan(true);

        try {
            await createPackage(newPlan);
            showSuccess("Success", "Plan saved successfully!");

            // Clear form
            setFormData({
                title: '',
                price: '',
                interval: '',
                duration: '',
                students: '',
                joiningFee: '',
                termsAndCondition: '',
                HolidayCampPackage: ''
            });
            setPlanErrors({});
            setPackageDetails('');
            setTerms('');
            setOpenForm(false);
        } catch (err) {
            console.error('Error saving plan:', err);
            showError("Error", "There was an error saving the plan. Please try again.");
        } finally {
            setIsSavePlan(false);
        }
    };
    useEffect(() => {
        if (id && selectedGroup) {
            setGroupName(selectedGroup.name || "");
            setDescription(selectedGroup.description || "");
            setSelectedPlans(selectedGroup.holidayPaymentPlans || []);
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
    const priceFields = ["price", "joiningFee"];

    const { checkPermission } = usePermission();

    const canCreate =
        checkPermission({ module: 'payment-plan', action: 'create' });

    return (
        <div className=" md:p-6 bg-gray-50 min-h-screen">

            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2`}>
                <h2
                    onClick={() => {
                        if (previewShowModal) {
                            setPreviewShowModal(false);
                        } else {
                            navigate('/configuration/holiday-camp/subscription-plan-group');
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
                        {previewShowModal ? `${selectedGroup?.name || groupName} ` : id ? 'Update Payment Plan Group' : 'Add Payment Plan Group'}
                    </span>
                </h2>


            </div>

            <div className={`flex flex-col md:flex-row bg-white rounded-3xl ${previewShowModal ? ' m-auto  md:p-10' : 'w-full  md:p-12 p-4'}`}>
                {previewShowModal && (
                    <div className="flex items-center rounded-3xl  justify-left bg-white md:w-full px-4 py-6 sm:px-6 md:py-10">
                        <div className="bg-white rounded-3xl p-4 sm:p-6 w-full shadow-2xl">

                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E1E5] pb-4 mb-4 gap-2">
                                <h2 className="font-semibold text-[20px] sm:text-[24px]">Payment Plan Preview</h2>
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
                                        if (id && selectedGroup) {
                                            handleUpdateGroup();
                                        } else {
                                            handleCreateGroup();
                                        }
                                    }}
                                    className="mx-auto space-y-4"
                                >
                                    <div>
                                        <label className="block text-base  font-semibold text-gray-700 mb-2">
                                            Payment Plan Group Name
                                        </label>
                                        <input
                                            name="groupName"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            type="text"
                                            placeholder="Enter Group Name"
                                            className={`w-full px-4 font-semibold text-base py-3 border ${errors.groupName ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 ${errors.groupName ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                        />
                                        {errors.groupName && (
                                            <p className="text-sm text-red-500 mt-1">{errors.groupName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-base  font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <input
                                            name="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            type="text"
                                            placeholder="Add Internal  reference"
                                            className={`w-full px-4 font-semibold py-3 border ${errors.description ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 ${errors.description ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                                        )}
                                    </div>

                                    <div className="w-full">
                                        <div
                                            className="flex items-center justify-between cursor-pointer mb-2"
                                            onClick={() => setIsOpen(!isOpen)}
                                        >
                                            <label className="block text-base font-semibold text-gray-700">
                                                Payment Plans
                                            </label>

                                        </div>

                                        <div
                                            id="selectedPlans"
                                            onClick={() => setIsOpen(!isOpen)}
                                            className={`mt-4 space-y-2 border ${errors.selectedPlans ? 'border-red-500' : 'border-gray-200'} px-4 py-3 rounded-lg cursor-pointer`}
                                        >
                                            {selectedPlans.length > 0 ? (
                                                selectedPlans.map((plan, idx) => (
                                                    <div
                                                        key={plan.id || idx}
                                                        className="flex items-center font-semibold justify-between"
                                                    >
                                                        <span>
                                                            {plan.students > 0
                                                                ? `${plan.title}: ${plan.students} ${plan.students === 1 ? 'Student' : 'Students'}`
                                                                : ''}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemovePlan(idx);
                                                            }}
                                                            className="text-gray-500 hover:text-red-500"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-400 italic">No plans selected</div>
                                            )}
                                        </div>
                                        {errors.selectedPlans && (
                                            <p className="text-sm text-red-500 mt-1">{errors.selectedPlans}</p>
                                        )}

                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="transition-all"
                                                >
                                                    <div className="w-full my-4">
                                                        <Select
                                                            options={sortedOptions}
                                                            value={selectedOptions}
                                                            onChange={handleSelectChange}
                                                            isMulti
                                                            components={{ MultiValue }}
                                                            placeholder="Select Payment Plans ..."
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={document.body}
                                                            styles={{
                                                                control: (base, state) => ({
                                                                    ...base,
                                                                    borderRadius: "14px",
                                                                    border: "1px solid",
                                                                    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                                                                    boxShadow: state.isFocused
                                                                        ? "0 0 0 3px rgba(59, 130, 246, 0.2)"
                                                                        : "0 1px 2px rgba(0,0,0,0.05)",
                                                                    transition: "all 0.2s ease",
                                                                    padding: "4px 8px",
                                                                    backgroundColor: "#fff",
                                                                    fontSize: "15px",
                                                                    fontWeight: 500,
                                                                }),
                                                                valueContainer: (base) => ({
                                                                    ...base,
                                                                    gap: "6px",
                                                                    padding: "2px 4px",
                                                                }),
                                                                placeholder: (base) => ({
                                                                    ...base,
                                                                    color: "#9ca3af",
                                                                    fontSize: "15px",
                                                                    fontWeight: 400,
                                                                }),
                                                                option: (base, state) => ({
                                                                    ...base,
                                                                    backgroundColor: state.isSelected
                                                                        ? "#2563eb"
                                                                        : state.isFocused
                                                                            ? "#f3f4f6"
                                                                            : "transparent",
                                                                    color: state.isSelected ? "white" : "#111827",
                                                                    fontSize: "15px",
                                                                    fontWeight: state.isSelected ? 600 : 400,
                                                                    padding: "12px 16px",
                                                                    cursor: "pointer",
                                                                    transition: "all 0.15s ease",
                                                                }),
                                                                multiValue: (base) => ({
                                                                    ...base,
                                                                    borderRadius: "10px",
                                                                    backgroundColor: "#eff6ff",
                                                                    padding: "2px 8px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                }),
                                                                multiValueLabel: (base) => ({
                                                                    ...base,
                                                                    color: "#1d4ed8",
                                                                    fontWeight: 500,
                                                                    fontSize: "14px",
                                                                }),
                                                                multiValueRemove: (base) => ({
                                                                    ...base,
                                                                    color: "#2563eb",
                                                                    borderRadius: "6px",
                                                                    ":hover": {
                                                                        backgroundColor: "#2563eb",
                                                                        color: "white",
                                                                    },
                                                                }),
                                                                dropdownIndicator: (base, state) => ({
                                                                    ...base,
                                                                    color: state.isFocused ? "#2563eb" : "#9ca3af",
                                                                    transition: "transform 0.2s ease",
                                                                    transform: state.selectProps.menuIsOpen
                                                                        ? "rotate(180deg)"
                                                                        : "rotate(0deg)",
                                                                }),
                                                                indicatorSeparator: () => ({ display: "none" }),
                                                                menuPortal: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999,
                                                                }),
                                                                menu: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999,
                                                                    borderRadius: "14px",
                                                                    marginTop: "6px",
                                                                    padding: "6px 0",
                                                                    backgroundColor: "white",
                                                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 4px 6px rgba(0,0,0,0.08)",
                                                                }),
                                                            }}
                                                            menuPlacement="auto"
                                                            closeMenuOnSelect={false}
                                                            hideSelectedOptions={false}
                                                            isClearable
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {canCreate &&
                                        <button
                                            type="button"
                                            onClick={handleAddPlan}
                                            className="w-full bg-[#237FEA] mb-8 text-white text-[16px] font-semibold py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            Add Payment Plans
                                        </button>
                                    }
                                    <div className="flex flex-wrap flex-col-reverse gap-4 md:flex-row md:items-center md:justify-end md:gap-4">

                                        {selectedPlans.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewShowModal(true)}
                                                className="flex items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 w-full md:w-auto"
                                            >
                                                Preview Payment Plans
                                                <Eye size={16} />
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submitloading}
                                            className={`bg-[#237FEA] text-white min-w-50 font-semibold px-6 py-2 rounded-lg w-full md:w-auto ${submitloading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
                                                }`}
                                        >
                                            {loading
                                                ? (id && selectedGroup ? "Updating..." : "Creating...")
                                                : (id && selectedGroup ? "Edit Group" : "Create Group")}
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
                                        className="absolute top-2 right-3  hover:text-gray-700 text-5xl"
                                        title="Close"
                                    >
                                        &times;
                                    </button>
                                    <div className="text-[24px] font-semibold mb-4">Payment Plans</div>
                                    {[
                                        { label: "Title", name: "title", type: "text" },
                                        { label: "Price (£)", name: "price", type: "number" },
                                        {
                                            label: "Interval",
                                            name: "interval",
                                            type: "dropdown",
                                            options: ["Month", "Quarter", "Year"]
                                        },
                                        { label: "Duration", name: "duration", type: "number" },
                                        { label: "Number of Students", name: "students", type: "number" },
                                        { label: "Joining Fee (£)", name: "joiningFee", type: "number" }
                                    ].map((field) => {
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
                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                    {field.label}
                                                </label>

                                                {field.name === "interval" ? (
                                                    <div id="interval">
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
                                                            className="text-base font-semibold"
                                                            classNamePrefix="react-select"
                                                            styles={{
                                                                control: (provided) => ({
                                                                    ...provided,
                                                                    borderRadius: "0.5rem",
                                                                    padding: "4px",
                                                                    borderColor: planErrors.interval ? 'red' : "#E5E7EB",
                                                                    boxShadow: "none",
                                                                    "&:hover": { borderColor: planErrors.interval ? 'red' : "#3B82F6" }
                                                                }),
                                                                dropdownIndicator: (provided) => ({
                                                                    ...provided,
                                                                    display: "none"
                                                                }),
                                                                indicatorSeparator: () => ({ display: "none" })
                                                            }}
                                                            placeholder=""
                                                        />
                                                        {planErrors.interval && (
                                                            <p className="text-sm text-red-500 mt-1">{planErrors.interval}</p>
                                                        )}
                                                    </div>
                                                ) : field.name === "duration" && formData.interval ? (
                                                    <div>
                                                        <select
                                                            name="duration"
                                                            value={formData.duration}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, duration: e.target.value })
                                                            }
                                                            className={`w-full px-4 py-3 font-semibold text-base border ${planErrors.duration ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 ${planErrors.duration ? 'focus:ring-red-500' : 'focus:ring-blue-500'} appearance-none bg-transparent`}
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
                                                        {planErrors.duration && (
                                                            <p className="text-sm text-red-500 mt-1">{planErrors.duration}</p>
                                                        )}
                                                    </div>
                                                ) : field.type === "number" ? (
                                                    <div>
                                                        <input
                                                            type="text"
                                                            name={field.name}
                                                            value={formData[field.name]}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (priceFields.includes(field.name)) {
                                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                        setFormData({ ...formData, [field.name]: value });
                                                                    }
                                                                    return;
                                                                }
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
                                                            className={`w-full px-4 py-3 font-semibold text-[18px] text-[#282829] border ${planErrors[field.name] ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 ${planErrors[field.name] ? 'focus:ring-red-500' : 'focus:ring-blue-500'} appearance-none bg-transparent`}
                                                        />
                                                        {planErrors[field.name] && (
                                                            <p className="text-sm text-red-500 mt-1">{planErrors[field.name]}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <input
                                                            type="text"
                                                            name={field.name}
                                                            value={formData[field.name]}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, [field.name]: e.target.value })
                                                            }
                                                            className={`w-full px-4 py-3 font-semibold text-base border ${planErrors[field.name] ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 ${planErrors[field.name] ? 'focus:ring-red-500' : 'focus:ring-blue-500'} appearance-none bg-transparent`}
                                                        />
                                                        {planErrors[field.name] && (
                                                            <p className="text-sm text-red-500 mt-1">{planErrors[field.name]}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="mb-4 relative">
                                        <label className="block text-base font-semibold text-gray-700 mb-2">
                                            Holiday Camps Package Details
                                        </label>
                                        <div className={`rounded-md border p-1 ${planErrors.HolidayCampPackage ? 'border-red-500' : 'border-gray-300'}`}>
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
                                                    content_style: `body { background-color: #f3f4f6; font-family: "Poppins", sans-serif !important; font-size: 1rem; padding: 0px; color: #111827; } * { font-family:"Poppins", sans-serif !important; }`,
                                                    setup: (editor) => {
                                                        editor.ui.registry.addIcon('capitalize-icon', '<img src="/images/icons/smallcaps.png" style="width:16px;height:16px;" />');
                                                        editor.ui.registry.addButton('capitalize', {
                                                            icon: 'capitalize-icon',
                                                            tooltip: 'Capitalize Text',
                                                            onAction: () => {
                                                                editor.formatter.register('capitalize', { inline: 'span', styles: { textTransform: 'capitalize' } });
                                                                editor.formatter.toggle('capitalize');
                                                            },
                                                        });
                                                    },
                                                }}
                                            />
                                        </div>
                                        {planErrors.HolidayCampPackage && <p className="text-sm text-red-500 mt-1">{planErrors.HolidayCampPackage}</p>}
                                    </div>

                                    <div className="mb-4 relative">
                                        <label className="block text-base font-semibold text-gray-700 mb-2">
                                            Terms & Conditions
                                        </label>
                                        <div className={`rounded-md border p-1 ${planErrors.termsAndCondition ? 'border-red-500' : 'border-gray-300'}`}>
                                            <Editor
                                                apiKey="sqe5er2lyngzjf0armhqaw1u7ffh0xgjyzmb7unv5irietwa"
                                                value={formData.termsAndCondition}
                                                onEditorChange={(content) =>
                                                    setFormData({ ...formData, termsAndCondition: content })
                                                }
                                                init={{
                                                    menubar: false,
                                                    plugins: 'lists advlist',
                                                    toolbar: 'fontsizeselect capitalize bold italic underline alignleft aligncenter alignjustify',
                                                    height: 200,
                                                    branding: false,
                                                    content_style: `body { background-color: #f3f4f6; font-family: "Poppins", sans-serif !important; font-size: 1rem; padding: 0px; color: #111827; } * { font-family:"Poppins", sans-serif !important; }`,
                                                    setup: (editor) => {
                                                        editor.ui.registry.addIcon('capitalize-icon', '<img src="/images/icons/smallcaps.png" style="width:16px;height:16px;" />');
                                                        editor.ui.registry.addButton('capitalize', {
                                                            icon: 'capitalize-icon',
                                                            tooltip: 'Capitalize Text',
                                                            onAction: () => {
                                                                editor.formatter.register('capitalize', { inline: 'span', styles: { textTransform: 'capitalize' } });
                                                                editor.formatter.toggle('capitalize');
                                                            },
                                                        });
                                                    },
                                                }}
                                            />
                                        </div>
                                        {planErrors.termsAndCondition && <p className="text-sm text-red-500 mt-1">{planErrors.termsAndCondition}</p>}
                                    </div>

                                    <div className="text-right">
                                        <button
                                            type="button"
                                            onClick={handleSavePlan}
                                            disabled={isSavePlan}
                                            className={`w-full bg-[#237FEA] text-white text-[16px] font-semibold py-3 rounded-lg mt-6 ${isSavePlan ? 'opacity-50' : 'hover:bg-blue-700'}`}
                                        >
                                            {isSavePlan ? "Saving..." : "Add Plan"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </>}
            </div>


        </div>
    );
};

export default HolidayAddPaymentPlanGroup;
