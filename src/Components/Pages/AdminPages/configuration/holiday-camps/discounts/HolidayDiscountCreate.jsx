import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { showError, showSuccess, showWarning } from "../../../../../../utils/swalHelper";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import { useDiscounts } from "../../../contexts/DiscountContext";
import DatePicker from "react-datepicker";
import Loader from "../../../contexts/Loader";

import "react-datepicker/dist/react-datepicker.css";
const HolidayDiscountCreate = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();

    const { fetchDiscounts, createDiscount, loading } = useDiscounts();

    const [showEndDate, setShowEndDate] = useState(false); // only controls visibility
    const [showEnd, setShowEnd] = useState(false);

    const [photoPreview, setPhotoPreview] = useState(null);
    const [formData, setFormData] = useState({
        type: "",
        code: "",
        valueType: "",
        value: "",
        applyOncePerOrder: false,
        limitTotalUses: "",
        limitPerCustomer: "",
        startDatetime: "",
        endDatetime: "null",
        appliesTo: []
    });

    const token = localStorage.getItem("adminToken");



    const handleToggle = (type) => {
        setFormData((prev) => ({ ...prev, valueType: type }));
    };

    const handleInputChange = (e) => {
        setFormData((prev) => ({ ...prev, value: e.target.value }));
    };

    const handleCheckboxChange = (value) => {
        setFormData((prev) => {
            const updated = prev.appliesTo.includes(value)
                ? prev.appliesTo.filter((v) =>
                    value === "weekly_classes"
                        ? !["weekly_classes", "joining_fee", "per_rate_lessons", "uniform_fee"].includes(v)
                        : v !== value
                )
                : [...prev.appliesTo, value];

            return { ...prev, appliesTo: updated };
        });
    };

    const handleWeeklyRadioChange = (value) => {
        setFormData((prev) => {
            // Remove any existing weekly radio options
            const cleaned = prev.appliesTo.filter(
                (v) => !["joining_fee", "per_rate_lessons", "uniform_fee"].includes(v)
            );
            return {
                ...prev,
                appliesTo: [...cleaned, value],
            };
        });
    };

    const toISOString = (date, time) => {
        if (!date || !time) return "";
        return new Date(`${date}T${time}:00`).toISOString();
    };

    const handleStartChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        updated.startDatetime = toISOString(updated.startDate, updated.startTime);
        setFormData(updated);
    };

    const handleEndChange = (field, value) => {
        const updated = { ...formData, [field]: value };

        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${updated.endDate}T${updated.endTime}`);

        if (
            formData.startDate &&
            formData.startTime &&
            updated.endDate &&
            updated.endTime &&
            endDateTime < startDateTime
        ) {
            // Optional: show SweetAlert2 or toast instead
            showWarning("Invalid Component", "End date/time cannot be earlier than start date/time.");

            // ❌ Don't update the field if invalid
            return;
        }

        const endDatetime = toISOString(updated.endDate, updated.endTime);
        updated.endDatetime = showEndDate && endDatetime ? endDatetime : null;
        setFormData(updated);
    };


    const toggleEndInputs = (checked) => {
        setShowEndDate(checked);
        setFormData((prev) => ({
            ...prev,
            endDatetime: checked ? toISOString(prev.endDate, prev.endTime) : null,
        }));
    };
    const generateCode = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData((prev) => ({ ...prev, code: random }));
    };

    const handleTypeSelect = (type) => {
        setFormData((prev) => ({
            ...prev,
            type,
            code: type === "code" ? "" : prev.code, // clear when switching to manual
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            startDatetime: formData.startDatetime || null,
            endDatetime: formData.endDatetime || null,
            limitTotalUses: formData.limitTotalUses || "",
            limitPerCustomer: formData.limitPerCustomer || "",
            code: formData.code?.trim() || "",
            // any other cleanup/formatting logic
        };

        try {
            await createDiscount(payload); // ✅ send to server
            showSuccess("Discount Created", "Discount code has been created successfully!");
        } catch (err) {
            console.error("Submit error:", err);
            // Optionally show an error message here
            showError("Creation Failed", err.message || "Something went wrong.");
        }
    };
    const combineDateTime = (date, time) => {
        if (!date || !time) return null;
        const d = new Date(date);
        d.setHours(time.getHours());
        d.setMinutes(time.getMinutes());
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
    };

    // Update ISO datetimes whenever inputs change
    useEffect(() => {
        const start = combineDateTime(formData.startDate, formData.startTime);
        const end = combineDateTime(formData.endDate, formData.endTime);

        setFormData((prev) => ({
            ...prev,
            startDatetime: start ? start.toISOString() : null,
            endDatetime: end ? end.toISOString() : null,
        }));
    }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime]);

    const handleEndTimeChange = (time) => {
        const newEnd = combineDateTime(formData.endDate, time);
        const start = combineDateTime(formData.startDate, formData.startTime);

        if (start && newEnd && newEnd < start) {
            showWarning("Invalid Time", "End time cannot be before start time");
            return;
        }

        setFormData({ ...formData, endTime: time });
    };
    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }
    return (
        <div className="bg-gray-50 min-h-screen p-6">
            {/* Top Navigation */}
            <h2
                onClick={() => navigate('/configuration/holiday-camp/discount/list')}
                className="text-2xl font-semibold flex items-center gap-2 cursor-pointer hover:opacity-80 mb-6"
            >
                <img src="/images/icons/arrow-left2.png" alt="Back" />
                Create Discount
            </h2>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6 w-full">
                {/* Left Side: Form */}
                <div className="w-full lg:w-8/12 space-y-6">
                    {/* Amount off products */}
                    <div className="bg-white rounded-3xl p-6 shadow">
                        <h4 className="text-base font-semibold mb-2">Amount off products</h4>

                        {/* Checkbox-looking radio logic */}
                        {/* Checkbox-looking radio logic */}
                        <div className="text-[16px] mb-2 flex gap-2 items-center">
                            <input
                                type="checkbox"
                                checked={formData.type === "code"}
                                onChange={() => handleTypeSelect("code")}
                            />
                            Discount Code
                        </div>

                        <div className="text-[16px] mb-4 flex gap-2 items-center">
                            <input
                                type="checkbox"
                                checked={formData.type === "automatic"}
                                onChange={() => handleTypeSelect("automatic")}
                            />
                            Automatic Discount
                        </div>

                        {/* Discount Code Input */}
                        <div>
                            <h3 className="text-sm font-semibold mb-2">Discount code</h3>

                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <input
                                    type="text"
                                    value={formData.code}
                                    disabled={formData.type === "automatic"}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, code: e.target.value }))
                                    }
                                    placeholder={
                                        formData.type === "automatic"
                                            ? "Click generate to create code"
                                            : "Enter discount code"
                                    }
                                    className={`w-full md:flex-1 border rounded-xl px-3 py-3 
        ${formData.type === "automatic"
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : "border-[#E2E1E5]"}`}
                                />

                                <button
                                    type="button"
                                    onClick={generateCode}
                                    disabled={formData.type !== "automatic"}
                                    className={`w-full md:w-auto px-6 py-3 rounded-xl text-[16px] transition
        ${formData.type === "automatic"
                                            ? "bg-[#237FEA] text-white hover:bg-blue-700"
                                            : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                                >
                                    Generate
                                </button>
                            </div>
                        </div>



                    </div>

                    {/* Value Section */}
                    <div className="bg-white rounded-3xl p-6 shadow">
                        <h4 className="text-base font-semibold mb-4">Value</h4>
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6 w-full">
                            <button
                                type="button"
                                onClick={() => handleToggle("percentage")}
                                className={`py-2 px-4 rounded-xl text-[16px] transition w-full md:w-auto ${formData.valueType === "percentage"
                                    ? "bg-[#237FEA] text-white hover:bg-blue-700"
                                    : "bg-[#F5F5F5] text-black hover:bg-gray-200"
                                    }`}
                            >
                                Percentage
                            </button>

                            <button
                                type="button"
                                onClick={() => handleToggle("fixed")}
                                className={`py-2 px-4 rounded-xl text-[16px] transition w-full md:w-auto ${formData.valueType === "fixed"
                                    ? "bg-[#237FEA] text-white hover:bg-blue-700"
                                    : "bg-[#F5F5F5] text-black hover:bg-gray-200"
                                    }`}
                            >
                                Fixed amount
                            </button>

                            <div className="relative w-full md:max-w-[200px]">
                                <input
                                    type="text"
                                    value={formData.value}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-gray-200 py-2 px-3 rounded-xl text-[16px] pr-8"
                                />
                                <img
                                    className="absolute top-3 right-3 w-4 h-4"
                                    src="/images/icons/percentIcon.png"
                                    alt="%"
                                />
                            </div>
                        </div>


                        {/* Apply To Section */}
                        <h4 className="text-base font-semibold mb-4">Apply to</h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={formData.appliesTo.includes("weekly_classes")}
                                    onChange={() => handleCheckboxChange("weekly_classes")}
                                />
                                Weekly classes
                            </label>

                            {formData.appliesTo.includes("weekly_classes") && (
                                <div className="pl-6 space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="weeklyOption"
                                            value="joining_fee"
                                            checked={formData.appliesTo.includes("joining_fee")}
                                            onChange={(e) => handleWeeklyRadioChange(e.target.value)}
                                        />
                                        Joining Fee
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="weeklyOption"
                                            value="per_rate_lessons"
                                            checked={formData.appliesTo.includes("per_rate_lessons")}
                                            onChange={(e) => handleWeeklyRadioChange(e.target.value)}
                                        />
                                        Per Rate Lessons
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="weeklyOption"
                                            value="uniform_fee"
                                            checked={formData.appliesTo.includes("uniform_fee")}
                                            onChange={(e) => handleWeeklyRadioChange(e.target.value)}
                                        />
                                        Uniform Fee
                                    </label>
                                </div>
                            )}

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={formData.appliesTo.includes("one_to_one")}
                                    onChange={() => handleCheckboxChange("one_to_one")}
                                />
                                One to one
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={formData.appliesTo.includes("holiday_camp")}
                                    onChange={() => handleCheckboxChange("holiday_camp")}
                                />
                                Holiday camp
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={formData.appliesTo.includes("birthday_party")}
                                    onChange={() => handleCheckboxChange("birthday_party")}
                                />
                                Birthday party
                            </label>
                            <hr className="text-gray-200 my-5" />
                            <label className="flex items-center gap-2 mt-4">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={formData.applyOncePerOrder}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            applyOncePerOrder: e.target.checked,
                                        }))
                                    }
                                />
                                Apply discount once per order
                            </label>
                        </div>
                    </div>

                    {/* Maximum Discount Uses */}
                    <div className="bg-white rounded-3xl p-6 shadow space-y-4">
                        <h4 className="text-base font-semibold">Maximum discount uses</h4>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={!!formData.limitTotalUses}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        limitTotalUses: e.target.checked ? "1" : "", // default to 1 if checked
                                    }));
                                }}
                            />
                            Limit number of times this discount can be used in total
                        </label>

                        {/* ✅ Input appears only when checked */}
                        <AnimatePresence initial={false}>
                            {formData.limitTotalUses && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="pl-6"
                                >
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Enter max uses"
                                        className="mt-2 w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2"
                                        value={formData.limitTotalUses}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                limitTotalUses: e.target.value,
                                            }))
                                        }
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ✅ Limit to one use per customer */}
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={formData.limitPerCustomer === "1"}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        limitPerCustomer: e.target.checked ? "1" : "",
                                    }))
                                }
                            />
                            Limit to one use per customer
                        </label>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow space-y-4">
                        <h4 className="text-base font-semibold">Active Dates</h4>

                        {/* Start Date & Time */}
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                            <div className="flex flex-col w-full md:w-3/12">
                                <label className="text-sm font-medium mb-1">Start Date</label>
                                <DatePicker
                                    selected={formData.startDate}
                                    onChange={(date) => setFormData({ ...formData, startDate: date })}
                                    dateFormat="P"
                                    minDate={new Date()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                                    withPortal
                                />
                            </div>
                            <div className="flex flex-col w-full md:w-3/12">
                                <label className="text-sm font-medium mb-1">Start Time</label>
                                <DatePicker
                                    selected={formData.startTime}
                                    onChange={(time) => setFormData({ ...formData, startTime: time })}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    dateFormat="h:mm aa"
                                    timeCaption="Time"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                                    withPortal
                                />
                            </div>
                        </div>

                        {/* End Date Toggle */}
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={showEnd}
                                onChange={(e) => setShowEnd(e.target.checked)}
                            />
                            <label className="text-sm font-medium">Set end date</label>
                        </div>

                        <AnimatePresence initial={false}>
                            {showEnd && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className=""
                                >
                                    <div className="flex flex-col md:flex-row gap-4 w-full">
                                        <div className="flex flex-col w-full md:w-3/12">
                                            <label className="text-sm font-medium mb-1">End Date</label>
                                            <DatePicker
                                                selected={formData.endDate}
                                                onChange={(date) => setFormData({ ...formData, endDate: date })}
                                                dateFormat="P"
                                                minDate={formData.startDate || new Date()}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                                                disabled={!formData.startDate}
                                                withPortal
                                            />
                                        </div>
                                        <div className="flex flex-col w-full md:w-3/12">
                                            <label className="text-sm font-medium mb-1">End Time</label>
                                            <DatePicker
                                                selected={formData.endTime}
                                                onChange={handleEndTimeChange}
                                                showTimeSelect
                                                showTimeSelectOnly
                                                timeIntervals={15}
                                                dateFormat="h:mm aa"
                                                timeCaption="Time"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                                                x disabled={!formData.endDate}
                                                withPortal
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Debug Output */}

                    </div>

                    {/* Footer Buttons */}
                    <div className="flex flex-col md:flex-row justify-start gap-4 w-full">
                        <button className="w-full md:w-auto px-6 py-3 bg-none border border-gray-300 font-semibold rounded-xl text-black hover:bg-gray-100 transition">
                            Cancel
                        </button>

                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="w-full md:w-auto px-6 py-3 bg-[#237FEA] text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                        >
                            Create
                        </button>


                    </div>

                </div>

                {/* Right Side Summary Box */}
                <div className="w-full lg:w-4/12">
                    <div className="bg-white rounded-3xl p-6 shadow space-y-3">
                        <h4 className="text-[16px] text-[#237FEA] font-semibold">Summary</h4>
                        <p className="text-[20px] font-semibold">SAMBA 10</p>
                        <div className="border-t border-gray-200 pt-2">
                        </div>
                        <div>
                            <h5 className="text-[16px] mb-2 font-semibold text-gray-700">Summary</h5>
                            <p className="text-sm  mb-1  text-gray-600">Amount of products</p>
                            <p className="text-sm text-gray-600">Code</p>
                        </div>
                        <div className="border-t border-gray-200 pt-2">
                        </div>
                        <div>
                            <h5 className="text-[16px] font-semibold mb-2 ">Details</h5>
                            <ul className="list-none text-sm text-gray-600 space-y-1">
                                <li>5%</li>
                                <li>Applies once per order</li>
                                <li>Active from today</li>
                                <li>Weekly classes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default HolidayDiscountCreate;
