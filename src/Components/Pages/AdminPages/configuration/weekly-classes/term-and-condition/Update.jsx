import Select from "react-select";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTermContext } from '../../../contexts/TermDatesSessionContext';
import SessionPlanSelect from "./SessionPlanSelect"
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSearchParams } from "react-router-dom";

import { showError, showSuccess, showConfirm, showWarning } from '../../../../../../utils/swalHelper';

const initialTerms = [
    {
        id: 1,
        name: 'Autumn 2025',
        startDate: '',
        endDate: '',
        exclusions: [''],
        sessions: '12',
        isOpen: true,
    },
    {
        id: 2,
        name: 'Spring 2025',
        startDate: '',
        endDate: '',
        exclusions: [''],
        sessions: '10',
        isOpen: false,
    },
    {
        id: 3,
        name: 'Summer 2025',
        startDate: '',
        endDate: '',
        exclusions: [''],
        sessions: '',
        isOpen: false,
    },
];
const Create = () => {
    const [searchParams] = useSearchParams();
    const [initialTerms, setInitialTerms] = useState([]);

    const id = searchParams.get("id");
    const [isEditMode, setIsEditMode] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("adminToken");
    const [isCreated, setIsCreated] = useState(false); // ✅ Track if group was created
    const [isMapCreated, setIsMapCreated] = useState(false); // ✅ Track if group was created

    const [termGroupName, setTermGroupName] = useState("");
    const [termGroupId, setTermGroupId] = useState(null); // store ID after creation
    const { createTermGroup, updateTermGroup, myGroupData, selectedTermGroup, setMyGroupData, fetchTerm, termData, fetchTermGroupById, } = useTermContext();
    const [mapSession, setMapSession] = useState([]);

    const [terms, setTerms] = useState(initialTerms);
    const [activeSessionValue, setActiveSessionValue] = useState('');
    const [sessionMappings, setSessionMappings] = useState([]);
    const [machedTermsID, setMachedTermsID] = useState([]);

    const activeTerm = terms.find(t => t.isOpen);
    const activeSessionCount = parseInt(activeSessionValue || 0, 10);
    const [isMapping, setIsMapping] = useState(false);
    const navigate = useNavigate();

    const handleMapSession = () => {
        setIsMapping(!isMapping); // toggle the mapping state
    };
    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            fetchTermGroupById(id);
            fetchTerm()
        }
    }, [id]);


    useEffect(() => {
        const openTerm = terms.find(t => t.isOpen);
        if (openTerm) {
            setActiveSessionValue(openTerm.sessions || '');
        } else {
            setActiveSessionValue('');
        }
    }, [terms]);

    const toggleTerm = (id) => {
        setTerms((prev) =>
            prev.map((term) => ({
                ...term,
                isOpen: term.id === id ? !term.isOpen : false, // only one open at a time
            }))
        );
        setIsMapCreated(false);
    };
    const handleBlur = async () => {
        const trimmedName = termGroupName.trim();
        if (!trimmedName) return;

        const payload = {
            name: trimmedName,
        };

        try {
            if (selectedTermGroup?.id) {
                // ✅ Update using selectedTermGroup.id
                await updateTermGroup(selectedTermGroup.id, payload);
                // console.log("🔄 Updated using selectedTermGroup");
            } else if (isCreated) {
                // ✅ Update using myGroupData.id
                await updateTermGroup(myGroupData.id, payload);
                // console.log("🔄 Updated using myGroupData");
            } else {
                // ✅ Create new
                await createTermGroup(payload);
                setIsCreated(true);
                // console.log("✅ Created new term group");
            }
        } catch (err) {
            console.error("❌ Error saving Term Group:", err);
        }
    };

    useEffect(() => {
        setIsCreated(false);
        setTermGroupName('');
    }, []);
    const handleInputChange = (id, field, value) => {
        setTerms((prev) =>
            prev.map((term) =>
                term.id === id ? { ...term, [field]: value } : term
            )
        );

        if (field === 'sessions') {
            const current = terms.find(t => t.id === id);
            if (current?.isOpen) {
                setActiveSessionValue(value);
            }
        }
    };
    const handleSaveTerm = async (term, isEdit) => {
        // console.log('myGroupData', myGroupData)
        if (!myGroupData?.id) {
            console.error("Missing termGroupId");
            return;
        }

        const sessionsMap = sessionMappings.map((session) => ({
            sessionDate: session.date,
            sessionPlanId: session.plan,
        }));

        const payload = {
            termName: term.name,
            termGroupId: myGroupData.id,
            sessionPlanGroupId: 1, // Replace with dynamic value if needed
            startDate: term.startDate,
            endDate: term.endDate,
            exclusionDates: term.exclusions.filter((ex) => ex.trim() !== ""),
            totalSessions: Number(term.sessions), // Use totalSessions for PUT as per your API
            sessionsMap: sessionsMap, // Optional in PUT if not needed
        };

        const url = isEdit
            ? `${API_BASE_URL}/api/admin/term/${term.id}`
            : `${API_BASE_URL}/api/admin/term`;

        const method = isEdit ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save term.');
            }

            // console.log(`✅ Term ${isEdit ? 'Updated' : 'Created'}:`, data);

            showSuccess(data.message || `Term ${isEdit ? 'Updated' : 'Saved'} Successfully`);

            toggleTerm(term.id);

        } catch (error) {
            console.error(`❌ Error ${isEdit ? 'updating' : 'saving'} term:`, error);
            showError(`Failed to ${isEdit ? 'Update' : 'Save'} Term`, error.message || 'An unexpected error occurred.');
        }
    };


    const handleExclusionChange = (termId, index, value) => {
        setTerms((prev) =>
            prev.map((term) =>
                term.id === termId
                    ? {
                        ...term,
                        exclusions: term.exclusions.map((ex, i) =>
                            i === index ? value : ex
                        ),
                    }
                    : term
            )
        );
    };
    const addExclusionDate = (termId) => {
        setTerms((prev) =>
            prev.map((term) =>
                term.id === termId
                    ? { ...term, exclusions: [...term.exclusions, ''] }
                    : term
            )
        );
    };

    const deleteTerm = useCallback(async (id) => {
        if (!token) return;

        const willDelete = await showConfirm(
            "Are you sure?",
            "This action will permanently delete the term.",
            "Yes, delete it!"
        );

        if (!willDelete.isConfirmed) return; // Exit if user cancels

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/term/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                showSuccess("Deleted!", "The term was deleted successfully.");
                fetchTerm()
            } else {
                const errorData = await response.json();
                showError("Failed", errorData.message || "Failed to delete the term.");
            }
        } catch (err) {
            console.error("Failed to delete term:", err);
            showError("Error", "Something went wrong. Please try again.");
        }
    }, [token]);


    const removeExclusionDate = (termId, indexToRemove) => {
        setTerms((prev) =>
            prev.map((term) =>
                term.id === termId
                    ? {
                        ...term,
                        exclusions: term.exclusions.filter((_, idx) => idx !== indexToRemove),
                    }
                    : term
            )
        );
    };
    const handleMappingChange = (idx, field, value) => {
        setSessionMappings((prev) => {
            const updated = [...prev];
            const globalIndex = sessionMappings.findIndex(
                (m, i) => m.termId === activeTerm.id && i === idx
            );

            if (globalIndex !== -1) {
                updated[globalIndex] = {
                    ...updated[globalIndex],
                    [field]: value,
                };
            } else {
                // Handle when session not found for the index
                updated.push({
                    termId: activeTerm.id,
                    date: field === 'date' ? value : '',
                    plan: field === 'plan' ? value : '',
                });
            }

            return updated;
        });
    };
    const handleSaveMappings = () => {
        // Add sessionMappings into activeTerm
        const updatedTerm = {
            ...activeTerm,
            mappedSessions: sessionMappings, // Add new field or overwrite existing
        };


        // Optional: log or use updatedTerm somewhere
        // console.log('✅ Updated Active Term with mapped sessions:', updatedTerm);

        // Update state if needed
        // Update state if needed
        setMapSession(sessionMappings); // Still keep this if it's used elsewhere
        setIsMapCreated(true);
        showSuccess('Success', 'Map Saved successfully.');

        setIsMapping(false);

        // If you want to update activeTerm state as well
        // setActiveTerm(updatedTerm); // uncomment if using useState
    };
    const handleSaveClick = async () => {
        // Optional: perform save logic here (e.g. API call)

        // Show SweetAlert
        // Show SweetAlert
        await showSuccess('Saved!', 'Your data has been saved.');

        // Navigate after confirmation
        navigate('/configuration/weekly-classes/term-dates/list');
    };
    // console.log('selectedTermGroup', selectedTermGroup)
    useEffect(() => {
        if (selectedTermGroup) {
            setTermGroupName(selectedTermGroup?.name);
            setMyGroupData(selectedTermGroup);

        }
    }, [selectedTermGroup]);
    useEffect(() => {
        if (selectedTermGroup?.id) {
            const matchedTerms = termData.filter(
                (term) => term.termGroup?.id === selectedTermGroup.id
            );

            const formattedTerms = matchedTerms.map((term) => ({
                id: term.id,
                name: term.termName,
                startDate: term.startDate,
                endDate: term.endDate,
                exclusions: JSON.parse(term.exclusionDates || '[]'),
                sessions: term.sessionsMap?.length || 0,
                sessionsMap: term.sessionsMap || [],
                isEditMode: true
            }));

            const extractedData = formattedTerms.flatMap(term =>
                term.sessionsMap.map(session => ({
                    date: session.sessionDate,
                    plan: session.sessionPlanId,
                    termId: term.id,
                }))
            );

            setSessionMappings(extractedData);
            // console.log('sessionMapData', extractedData);

            setTerms(formattedTerms);
            setMachedTermsID(formattedTerms)
        }
    }, [selectedTermGroup, termData]);

    const filteredMappings = sessionMappings.filter(
        (mapping) => mapping.termId === activeTerm?.id
    );
    // console.log('Terms', terms);
    // console.log('setSessionMappings', sessionMappings);

    return (
        <div className="md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2">
                <h2
                    onClick={() => {
                        navigate('/configuration/weekly-classes/term-dates/list');
                    }}
                    className="text-xl md:text-[28px] font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 duration-200">
                    <img
                        src="/images/icons/arrow-left.png"
                        alt="Back"
                        className="w-5 h-5 md:w-6 md:h-6"
                    />
                    <span className="truncate">Add Term Dates</span>
                </h2>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-8  md:flex-row rounded-3xl w-full">
                <div className="transition-all duration-300 md:w-1/2">
                    <h3 className="font-semibold   text-[24px]"> <b>Step 1: </b>Add term Dates </h3>

                    <div className="rounded-2xl mb-5 bg-white md:p-6">

                        <div className="border border-gray-200 rounded-3xl px-4 py-3">
                            <div className="flex items-center justify-between">
                                <label className="rounded-3xl block text-base font-semibold text-gray-700 mb-2">
                                    Name of Term Group
                                </label>
                                <img src="/images/icons/edit.png" className="w-[18px]" alt="" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Term Group Name"
                                value={termGroupName}
                                onChange={(e) => setTermGroupName(e.target.value)}
                                onBlur={handleBlur}
                                className="md:w-1/2 px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="rounded-2xl mb-5 bg-white md:p-6">
                        {terms.map((term) => (
                            <div
                                key={term.id}
                                className="border mb-5 border-gray-200 rounded-3xl px-4 py-3"
                            >
                                <div className="flex items-center justify-between">
                                    <label className="rounded-3xl block text-base font-semibold text-gray-700 mb-2">
                                        {term.name || 'Term Name'}
                                    </label>
                                    <div className="flex gap-2">
                                        <img
                                            src="/images/icons/edit.png"
                                            className="w-[18px] cursor-pointer"
                                            onClick={() => toggleTerm(term.id)}
                                        />
                                        <img
                                            src="/images/icons/deleteIcon.png"
                                            className="w-[18px] cursor-pointer"
                                            onClick={() => deleteTerm(term.id)}
                                        />
                                        {term.isOpen && (
                                            <img
                                                src="/images/icons/crossGray.png"
                                                className="w-[18px] cursor-pointer"
                                                onClick={() => toggleTerm(term.id)}
                                            />
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {term.isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Enter Term Name"
                                                value={term.name}
                                                onChange={(e) =>
                                                    handleInputChange(term.id, 'name', e.target.value)
                                                }
                                                className="md:w-1/2 px-4 mb-5 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />

                                            <div className="md:flex gap-4 mb-5 justify-between">
                                                <div className="w-full">
                                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                                        Start Date
                                                    </label>
                                                    <DatePicker
                                                        withPortal
                                                        placeholderText="Enter Start Date"
                                                        selected={term.startDate ? new Date(term.startDate) : null}
                                                        onChange={(date) =>
                                                            handleInputChange(term.id, "startDate", date?.toISOString() || "")
                                                        }
                                                        className="w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="w-full">
                                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                                        End Date
                                                    </label>
                                                    <DatePicker
                                                        withPortal
                                                        placeholderText="Enter End Date"
                                                        selected={term.endDate ? new Date(term.endDate) : null}
                                                        onChange={(date) =>
                                                            handleInputChange(term.id, "endDate", date?.toISOString() || "")
                                                        }
                                                        className="w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />

                                                </div>
                                            </div>

                                            <div className="md:flex gap-4 mb-5 justify-between">
                                                <div className="w-full">
                                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                                        Exclusion Date(s)
                                                    </label>
                                                    {term.exclusions.map((ex, idx) => (
                                                        <div key={idx} className="flex gap-2 mb-2 items-center">
                                                            <DatePicker
                                                                withPortal
                                                                placeholderText={`Exclusion Date ${idx + 1}`}
                                                                selected={ex ? new Date(ex) : null}
                                                                onChange={(date) =>
                                                                    handleExclusionChange(term.id, idx, date?.toISOString() || "")
                                                                }
                                                                className="w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />

                                                            {term.exclusions.length > 1 && (
                                                                <button
                                                                    onClick={() => removeExclusionDate(term.id, idx)}
                                                                    type="button"
                                                                    className="text-red-500 hover:text-red-700 font-bold text-xl"
                                                                    title="Remove"
                                                                >
                                                                    &times;
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        className="text-sm text-blue-500 mt-1 font-semibold"
                                                        onClick={() => addExclusionDate(term.id)}
                                                    >
                                                        + Add Exclusion Date
                                                    </button>
                                                </div>

                                                <div className="w-full">
                                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                                        Total Number of Sessions
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Total Number of Sessions"
                                                        value={term.sessions}
                                                        onChange={(e) =>
                                                            handleInputChange(term.id, 'sessions', e.target.value)
                                                        }
                                                        className="w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:w-1/2 mb-4">
                                                <button
                                                    className="flex w-full items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                                                    onClick={() => addExclusionDate(term.id)}
                                                >
                                                    + Add Exclusion Date
                                                </button>
                                            </div>
                                            {activeSessionValue && (
                                                <div className="text-right font-semibold text-blue-600 mb-4">
                                                    Active Term Sessions: {activeSessionValue}
                                                </div>
                                            )}

                                            <div className="flex gap-4 justify-between">
                                                <div className="w-full md:block hidden " />
                                                <div className="w-full md:flex items-center gap-2 space-y-2 md:space-y-0">
                                                    <button
                                                        className="flex whitespace-nowrap md:w-4/12 md:mt-0 mt-4 w-full items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg text-[14px] font-semibold hover:bg-blue-50"
                                                        onClick={handleMapSession}
                                                    >
                                                        Map Session
                                                    </button>
                                                    <button
                                                        className={`text-[14px] md:w-8/12 w-full font-semibold px-6 py-3 rounded-lg 
    ${(isEditMode || (isMapCreated && termGroupName.trim()))
                                                                ? 'bg-[#237FEA] text-white hover:bg-blue-700'
                                                                : 'bg-gray-400 text-white cursor-not-allowed'}`}
                                                        onClick={() => {
                                                            if (!termGroupName.trim()) {
                                                                showWarning('Group name is required');
                                                                return;
                                                            }

                                                            if (!isMapCreated && !isEditMode) {
                                                                showWarning('Please save map first');
                                                                return;
                                                            }
                                                            // Use update handler in edit mode
                                                            if (isEditMode) {
                                                                handleSaveTerm(term, true);
                                                            } else {
                                                                handleSaveTerm(term);
                                                            }

                                                        }}
                                                    >
                                                        {isEditMode ? 'Update' : 'Save'}
                                                    </button>

                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}

                        <div className="flex mb-5 flex-wrap flex-col-reverse gap-4 md:flex-row md:items-center md:justify-end md:gap-4">
                            <button
                                onClick={() =>
                                    setTerms((prev) => [
                                        ...prev,
                                        {
                                            id: Date.now(),
                                            name: '',
                                            startDate: '',
                                            endDate: '',
                                            exclusions: [''],
                                            sessions: '',
                                            isOpen: true,
                                        },
                                    ])
                                }
                                className="flex items-center min-w-40 justify-center gap-1 border border-gray-400 text-gray-400 text-[14px] px-4 py-3 rounded-lg hover:bg-gray-100 w-full md:w-auto"
                            >
                                + Add Term
                            </button>
                            <button
                                onClick={() => {
                                    if (!termGroupName?.trim()) {
                                        showWarning('You cannot save without a group name');
                                        return;
                                    }

                                    handleSaveClick();
                                }}
                                className={`text-white text-base w-6/12 font-semibold px-6 py-3 rounded-lg 
    ${!termGroupName?.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#237FEA] hover:bg-blue-700'}`}
                            >
                                Save
                            </button>

                        </div>
                    </div>


                </div>

                <AnimatePresence>
                    {activeTerm && isMapping && (
                        <motion.div
                            key="session-step"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.4 }}
                            className="transition-all duration-300 md:w-1/2"
                        >
                            <h3 className="font-semibold text-[24px] mb-4">
                                <b>Step 2:</b> Map Sessions Plans for{' '}
                                <span className="text-blue-600">{activeTerm.name}</span>
                            </h3>

                            <motion.div
                                initial={{ scale: 0.98, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.98, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="rounded-2xl mb-5 bg-white md:p-6"
                            >
                                <div className="border border-gray-200 rounded-3xl px-4 py-3">
                                    <div className="md:flex items-center justify-between mb-2">
                                        <label className="block text-[22px] font-semibold">
                                            {activeTerm.name}
                                        </label>
                                    </div>

                                    <div className="md:flex items-start gap-5 justify-between">
                                        {/* Session Date Column */}
                                        {/* Session Date Column */}
                                        <div className="w-full">
                                            <label className="text-base">Session Date</label>
                                            {Array.from({ length: activeSessionCount }).map((_, idx) => (
                                                <motion.div
                                                    key={`date-${idx}`}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <DatePicker
                                                        withPortal
                                                        placeholderText={`Session Date ${idx + 1}`}
                                                        selected={
                                                            filteredMappings[idx]?.date
                                                                ? new Date(filteredMappings[idx].date)
                                                                : null
                                                        }
                                                        onChange={(date) =>
                                                            handleMappingChange(idx, "date", date?.toISOString() || "", activeTerm.id)
                                                        }
                                                        className="w-full px-4 mb-5 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        dateFormat="yyyy-MM-dd"
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Session Plan Column */}
                                        <div className="w-full">
                                            <label className="text-base">Session Plan</label>
                                            {Array.from({ length: activeSessionCount }).map((_, idx) => (
                                                <motion.div
                                                    key={`plan-${idx}`}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <SessionPlanSelect
                                                        idx={idx}
                                                        value={filteredMappings[idx]?.plan}
                                                        onChange={(value) =>
                                                            handleMappingChange(idx, "plan", value, activeTerm.id)
                                                        }
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>

                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="flex gap-4 justify-between">
                                        <div className="w-1/2" />
                                        <div className="w-full flex items-center gap-2">
                                            <button
                                                onClick={handleMapSession}
                                                className="flex whitespace-nowrap w-6/12 items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg text-base font-semibold hover:bg-blue-50">
                                                Cancel
                                            </button>

                                            <button
                                                onClick={handleSaveMappings}
                                                className="bg-[#237FEA] text-white text-base w-6/12 font-semibold px-6 py-3 rounded-lg hover:bg-blue-700"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>

    );
};

export default Create;
