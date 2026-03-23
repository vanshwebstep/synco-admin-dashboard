import Select from "react-select";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import Loader from '../../contexts/Loader';
import { Editor } from '@tinymce/tinymce-react';

import { useSessionPlan } from '../../contexts/SessionPlanContext';

const Create = () => {
    const videoInputRef = useRef(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const tabRef = useRef(null);
    const bannerInputRef = useRef(null);
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const level = searchParams.get("level");
    const tabs = ['Beginner', 'intermediate', 'advanced', 'pro'];
    const [activeTab, setActiveTab] = useState('Beginner');
    const fileInputRef = useRef(null);
    const [page, setPage] = useState(1);
    const [groupName, setGroupName] = useState('');
    const [groupNameSection, setGroupNameSection] = useState('');
    const [player, setPlayer] = useState('');
    const [skillOfTheDay, setSkillOfTheDay] = useState('');
    const [descriptionSession, setDescriptionSession] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewShowModal, setPreviewShowModal] = useState(false);
    const { fetchExercises, sessionGroup, groups, updateDiscount, createSessionExercise, selectedGroup, fetchGroupById, loading, createGroup, selectedExercise, exercises, updateGroup, setExercises, createSessionGroup, fetchSessionGroup } = useSessionPlan();
    const [selectedPlans, setSelectedPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const visibleTabs = level ? tabs.filter((tab) => tab.toLowerCase() == level.toLowerCase()) : tabs;

    const [sessionExerciseId, setSessionExerciseId] = useState([]); // or selectedPlans[0]?.id
    const [levels, setLevels] = useState([]);
    // State for raw file instead of preview URL
    const [videoFile, setVideoFile] = useState(null);
    const [videoFilePreview, setVideoFilePreview] = useState(null);
    const [bannerFilePreview, setBannerFilePreview] = useState(null);

    const [bannerFile, setBannerFile] = useState(null);
    const [packageDetails, setPackageDetails] = useState('');
    const [terms, setTerms] = useState('');
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        duration: '',
        description: '',
        image: null, // new field

    });

    const [openForm, setOpenForm] = useState(false);
    const navigate = useNavigate();
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
        }
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file); 

        }
    };
     // console.log('bannerfile',bannerFile)
     // console.log('selectedGroup',selectedGroup)

    const handleCreateSession = () => {
        if (isProcessing) return;
        setIsProcessing(true);

        if (tabRef.current) {
            tabRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const currentLevel = {
            level: activeTab,
            player,
            groupNameSection,
            skillOfTheDay,
            descriptionSession,
            videoFile,
            bannerFile,
            sessionExerciseIds: selectedPlans.map(plan => plan.id),
        };
         // console.log('currentLevel', currentLevel)
        setLevels((prevLevels) => {
            const existingIndex = prevLevels.findIndex((lvl) => lvl.level == activeTab);
            const updated = [...prevLevels];

            if (existingIndex !== -1) {
                updated[existingIndex] = currentLevel;
            } else {
                updated.push(currentLevel);
            }
             // console.log('updated', updated)
            handleNextTabOrSubmit(updated);

            return updated;
        });
        setIsProcessing(false);

    };

    const handleNextTabOrSubmit = (updatedLevels) => {
        const nextIndex = tabs.findIndex((tab) => tab == activeTab) + 1;

        // ✅ If in edit mode, always submit and skip tab switching
        if (isEditMode && id && level) {
            const transformed = {
                groupName: groupNameSection,
                levels: {},
            };

            updatedLevels.forEach((item) => {
                const levelKey = item.level.replace(/s$/i, '');
                if (!transformed.levels[levelKey]) {
                    transformed.levels[levelKey] = [];
                }
                transformed.levels[levelKey].push({
                    player: item.player,
                    video: item.videoFile,
                    banner: item.bannerFile,
                    skillOfTheDay: item.skillOfTheDay,
                    description: item.descriptionSession,
                    sessionExerciseId: item.sessionExerciseIds || [],
                });
            });

            const allMediaFiles = {};
            updatedLevels.forEach((item) => {
                const levelKey = item.level.replace(/s$/i, '').toLowerCase();
                allMediaFiles[levelKey] = {
                    banner: item.bannerFile,
                    video: item.videoFile,
                };
            });

            Object.entries(allMediaFiles).forEach(([levelKey, media]) => {
                transformed[`${levelKey}_video`] = media.video || null;
                transformed[`${levelKey}_banner`] = media.banner || null;
            });

             // console.log("✅ Final Transformed Session Data (Edit Mode):", transformed);
            updateDiscount(id, transformed);
            return; // 🚫 Stop further execution
        }

        // ✅ Normal flow (non-edit mode)
        if (nextIndex >= tabs.length) {
            const transformed = {
                groupName: groupNameSection,
                levels: {},
            };

            updatedLevels.forEach((item) => {
                const levelKey = item.level.replace(/s$/i, '');
                if (!transformed.levels[levelKey]) {
                    transformed.levels[levelKey] = [];
                }
                transformed.levels[levelKey].push({
                    player: item.player,
                    video: item.videoFile,
                    banner: item.bannerFile,
                    skillOfTheDay: item.skillOfTheDay,
                    description: item.descriptionSession,
                    sessionExerciseId: item.sessionExerciseIds || [],
                });
            });

            const allMediaFiles = {};
            updatedLevels.forEach((item) => {
                const levelKey = item.level.replace(/s$/i, '').toLowerCase();
                allMediaFiles[levelKey] = {
                    banner: item.bannerFile,
                    video: item.videoFile,
                };
            });

            Object.entries(allMediaFiles).forEach(([levelKey, media]) => {
                transformed[`${levelKey}_video`] = media.video || null;
                transformed[`${levelKey}_banner`] = media.banner || null;
            });

             // console.log("✅ Final Transformed Session Data (Create Mode):", transformed);
            createSessionGroup(transformed);
        } else {
            // Move to next tab
            setActiveTab(tabs[nextIndex]);
            setPage(1);
            setPlayer('');
            setSkillOfTheDay('');
            setDescriptionSession('');
            setBannerFile('');
            setVideoFile('');
            setSelectedPlans([]);
            setSessionExerciseId([]);
            if (videoInputRef.current) videoInputRef.current.value = null;
            if (bannerInputRef.current) bannerInputRef.current.value = null;
        }
    };

    useEffect(() => {
         // console.log('level', level)
        if (level) {
            const matchedTab = tabs.find(
                tab => tab.toLowerCase() == level.toLowerCase()
            );
            setActiveTab(matchedTab || 'beginner');
             // console.log('tabFromUrl', matchedTab || 'Begisssnner');
        } else {
            const tabFromUrl = level && tabs.includes(level) ? (level) : 'beginner';
            setActiveTab(tabFromUrl);
             // console.log('tabFromUrl', tabFromUrl);
        }
    }, [level]);

    useEffect(() => {
        if (id) {
             // console.log('id foud', id);
            setIsEditMode(true);
            fetchGroupById(id);
        } else {
            setIsLoading(false);
        }
    }, [id]);


    useEffect(() => {
        if (selectedGroup?.levels && isEditMode) {
            let parsedLevels;

            if (typeof selectedGroup.levels === "string") {
                try {
                    parsedLevels = JSON.parse(selectedGroup.levels);
                } catch (err) {
                    console.error("Failed to parse levels JSON:", err);
                    return;
                }
            } else {
                parsedLevels = selectedGroup.levels;
            }

            const loadedLevels = [];
            setGroupNameSection(selectedGroup.groupName || '');
             // console.log('selectedGroup', selectedGroup);

            Object.entries(parsedLevels).forEach(([levelKey, sessions]) => {
                const bannerKey = `${levelKey}_banner`;
                const videoKey = `${levelKey}_video`;

                const banner = selectedGroup[bannerKey] || '';
                const video = selectedGroup[videoKey];

                if (video) {
                    const myVideo = `${API_BASE_URL}/${video}`;
                    setVideoFilePreview(myVideo); // ✅ Set only if it exists
                }

                if (banner) {
                    const myBanner = `${API_BASE_URL}/${banner}`;
                    setBannerFilePreview(myBanner); // ✅ Set only if it exists
                }

                setBannerFile(banner);
                sessions?.forEach((session) => {
                    loadedLevels.push({
                        level: levelKey,
                        player: session.player || '',
                        skillOfTheDay: session.skillOfTheDay || '',
                        descriptionSession: session.description || '',
                        sessionExerciseId: session.sessionExerciseId || [],
                        sessionExercises: session.sessionExercises || [],
                        bannerFile: banner,
                        videoFile: video,
                    });
                });
            });

            setLevels(loadedLevels);
        }
    }, [selectedGroup, isEditMode]);

useEffect(() => {
     // console.log("🔥 useEffect triggered with activeTab:", activeTab);
     // console.log("📦 All Levels:", levels);

    const existingLevel = levels.find((lvl) => lvl.level?.toLowerCase?.() === activeTab?.toLowerCase?.());
     // console.log("🔍 Found existingLevel:", existingLevel);

    if (!existingLevel) {
         // console.log("🚫 No matching level found. Resetting all states.");
        setPlayer('');
        setSkillOfTheDay('');
        setDescriptionSession('');
        setBannerFile('');
        setVideoFile('');
        setSelectedPlans([]);
        setSessionExerciseId([]);
        return;
    }

     // console.log("✅ Populating data from existingLevel...");

    setPlayer(existingLevel.player || '');
    setSkillOfTheDay(existingLevel.skillOfTheDay || '');
    setDescriptionSession(existingLevel.descriptionSession || '');
    setSessionExerciseId(existingLevel.sessionExerciseIds || []);

    const plans = (existingLevel.sessionExerciseDetails || []).map((ex) => ({
        id: ex.id,
        title: ex.title,
        duration: ex.duration,
    }));
     // console.log("📋 Set session plans:", plans);
    setSelectedPlans(plans);

    if (existingLevel.videoFile) {
        const videoPath = `${API_BASE_URL}/${existingLevel.videoFile}`;
         // console.log("🎞️ Fetching video from:", videoPath);

        fetch(videoPath)
            .then(res => {
                 // console.log("🎥 Video fetch response:", res);
                return res.blob();
            })
            .then(blob => {
                const ext = blob.type.split('/')[1];
                const file = new File([blob], `video.${ext}`, { type: blob.type });
                 // console.log("📁 Created video file object:", file);
                setVideoFile(file);
            })
            .catch(err => console.error("❌ Error fetching video:", err));
    } else {
         // console.log("🚫 No videoFile found in existingLevel.");
    }

    if (existingLevel.bannerFile) {
        const bannerPath = `${API_BASE_URL}/${existingLevel.bannerFile}`;
         // console.log("🖼️ Fetching banner from:", bannerPath);

        fetch(bannerPath)
            .then(res => {
                 // console.log("🖼️ Banner fetch response:", res);
                return res.blob();
            })
            .then(blob => {
                const ext = blob.type.split('/')[1];
                const file = new File([blob], `banner.${ext}`, { type: blob.type });
                 // console.log("📁 Created banner file object:", file);
                setBannerFile(file);
            })
            .catch(err => console.error("❌ Error fetching banner:", err));
    } else {
         // console.log("🚫 No bannerFile found in existingLevel.");
    }
}, [activeTab, levels]);


    useEffect(() => {
        const currentLevelData = levels.find((item) => item.level == activeTab);
         // console.log('currentLevelData', levels)
        setSelectedPlans(
            (currentLevelData?.sessionExercises || []).map((exercise) => ({
                id: exercise.id,
                title: exercise.title || 'not found',
                duration: exercise.duration || 'not found',
            }))
        );

    }, [activeTab, levels]);


    const planOptions = exercises?.map((plan) => ({
        value: plan.id,
        label: `${plan.duration}: ${plan.title}`,
        data: plan, // to retain full plan data
    }));

    const selectedOptions = selectedPlans.map((plan) => ({
        value: plan.id,
        label: `${plan.duration}: ${plan.title}`,
        data: plan,
    }));

    const handleSelectChange = (selected) => {
        setSelectedPlans(selected ? selected.map((item) => item.data) : []);
    };
    useEffect(() => {
        const getPackages = async () => {
            try {
                const response = await fetchExercises();
                 // console.log("Fetched exercises:", response);

                if (response?.status && Array.isArray(response.data)) {
                    setPlans(response.data); // Set the dynamic plans from backend
                }

            } catch (error) {
                console.error("Error fetching exercises:", error);
            }
        };

        getPackages();
    }, [fetchExercises]);
    const handleAddPlan = () => {
        setOpenForm(true);
    };
    const handleRemovePlan = (index) => {
        const updated = [...selectedPlans];
        updated.splice(index, 1);
        setSelectedPlans(updated);
    };
    const handleSavePlan = async () => {
        const newPlan = {
            title: formData.title,
            duration: formData.duration,
            description: formData.description,
        };

        try {
            await createSessionExercise(newPlan, formData.image); // pass file here

            // Reset form
            setFormData({
                title: '',
                duration: '',
                description: '',
                image: null,
            });
            setOpenForm(false);
        } catch (err) {
            console.error('Error saving exercise:', err);
        }
    };

    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }
     // console.log('selectedPlanss', selectedPlans)

     // console.log('videoFilePreview', videoFilePreview)

    return (
        <div className=" md:p-6 bg-gray-50 min-h-screen">

            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2`}>
                <h2
                    onClick={() => {
                        if (previewShowModal) {
                            setPreviewShowModal(false);
                        } else {
                            navigate('/configuration/weekly-classes/session-plan-list');
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
                        {previewShowModal ? '2023/24 Standard Pricing preview' : 'Add Subscription Plan Group'}
                    </span>
                </h2>


            </div>

            <div className={`flex flex-col md:flex-row bg-white  rounded-3xl ${previewShowModal ? 'md:min-w-3/4  md:p-10' : 'w-full  md:p-12 p-4'}`}>

                <>
                    <div className={`transition-all duration-300 md:w-1/2`}>
                        <div className="rounded-2xl  md:p-12 ">
                            <form className="mx-auto  space-y-4">
                                {/* Group Name */}
                                <div className="flex gap-4   border w-full border-gray-300 p-1 rounded-xl  flex-wrap">
                                    {visibleTabs.map((tab) => (
                                        <button
                                            type="button"
                                            ref={tabRef}
                                            key={tab}
                                            onClick={() => {
                                                setActiveTab(tab);
                                                setPage(1);
                                                setVideoFile('');
                                                setBannerFile('');
                                                if (videoInputRef.current) videoInputRef.current.value = null;
                                                if (bannerInputRef.current) bannerInputRef.current.value = null;
                                            }}
                                            className={`px-4 py-1.5 rounded-xl text-[19.28px] font-medium capitalize transition ${activeTab == tab ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div>

                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Group Name
                                    </label>
                                    <input
                                        value={groupNameSection}
                                        onChange={(e) => setGroupNameSection(e.target.value)}
                                        type="text"
                                        required
                                        placeholder="Enter Group Name"
                                        className="w-full px-4 font-semibold text-[18px] py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex w-full  gap-4 items-center">
                                    {/* Add Video */}
                                    <button
                                        type="button"
                                        onClick={() => videoInputRef.current.click()}
                                        className="flex md:w-1/2 items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                                    >
                                        {videoFile ? "Change Video" : "Add Video"}
                                    </button>
                                    <input
                                        type="file"
                                        ref={videoInputRef}
                                        onChange={handleVideoChange}
                                        accept="video/*"
                                        className="hidden"
                                    />

                                    {/* Add Banner */}
                                    <button
                                        type="button"
                                        onClick={() => bannerInputRef.current.click()}
                                        className="flex md:w-1/2 items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                                    >
                                        {bannerFile ? "Change Banner" : "Add Banner"}
                                    </button>
                                    <input
                                        type="file"
                                        ref={bannerInputRef}
                                        onChange={handleBannerChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 w-full">
                                    {/* Video Preview */}
                                    {videoFile && typeof videoFile == "string" && (
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-semibold mb-2 text-gray-700">Video Preview</label>
                                            <video
                                                controls
                                                className="w-full h-auto rounded shadow"
                                                src={videoFile}
                                                onError={() => console.error("Failed to load video:", videoFile)}
                                            />

                                        </div>
                                    )}



                                    {bannerFile && typeof bannerFile == "string" && (
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-sm font-semibold mb-2 text-gray-700">Banner Preview</label>
                                            <img
                                                src={
                                                   bannerFile
                                                }
                                                alt="Banner Preview"
                                                className="w-full h-auto rounded shadow"
                                              
                                            />

                                        </div>
                                    )}


                                </div>


                                {/* Description */}
                                <div>
                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Player
                                    </label>
                                    <input

                                        value={player}
                                        onChange={(e) => setPlayer(e.target.value)}
                                        type="text"
                                        requiredx
                                        className="w-full px-4 font-semibold py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Skill of the day
                                    </label>
                                    <input

                                        value={skillOfTheDay}
                                        onChange={(e) => setSkillOfTheDay(e.target.value)}
                                        type="text"
                                        required
                                        className="w-full px-4 font-semibold py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <input

                                        value={descriptionSession}
                                        onChange={(e) => setDescriptionSession(e.target.value)}
                                        type="text"
                                        required
                                        className="w-full px-4 font-semibold py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Payment Plans */}
                                <div className="w-full">
                                    {/* Label - Clickable to toggle options */}
                                    <div
                                        className="flex items-center justify-between cursor-pointer mb-2"
                                        onClick={() => setIsOpen(!isOpen)}
                                    >
                                        <label className="block text-[18px] font-semibold text-gray-700">
                                            Exercises
                                        </label>

                                    </div>

                                    {/* Animated Collapsible Plan Select Area */}


                                    {/* Selected Plans */}

                                    <div
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="mt-4 space-y-2 border border-gray-200 px-4 py-3 rounded-lg"
                                    >
                                        {selectedPlans.length > 0 ? (
                                            selectedPlans.map((plan, idx) => (
                                                <div
                                                    key={plan.id || idx}
                                                    className="flex items-center font-semibold justify-between"
                                                >
                                                    <span>{`${plan.duration}: ${plan.title}`}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevents triggering setIsOpen
                                                            handleRemovePlan(idx);
                                                        }}
                                                        className="text-gray-500 hover:text-red-500"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-400 italic">No Exercise selected</div>
                                        )}
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="transition-all" // remove "overflow-hidden"
                                            >
                                                <div className="w-full mb-4">
                                                    <Select
                                                        options={planOptions}
                                                        value={selectedOptions}
                                                        onChange={handleSelectChange}
                                                        isMulti
                                                        placeholder="Select payment plans..."
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"

                                                        menuPortalTarget={document.body} // 🔥 THIS FIXES OVERFLOW
                                                        styles={{
                                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }), // Ensure it's on top
                                                        }}
                                                    />


                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Add Payment Plan Button */}
                                <button
                                    type="button"
                                    onClick={handleAddPlan}
                                    className="w-full bg-[#237FEA] mb-8 text-white text-[16px] font-semibold py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Add New Exercise
                                </button>

                                {/* Footer Buttons */}
                                <div className="flex flex-wrap flex-col-reverse gap-4 md:flex-row md:items-center md:justify-end md:gap-4">



                                    <button
                                        type="button"
                                        onClick={handleCreateSession}
                                        className="bg-[#237FEA] text-white min-w-50 font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto"
                                    >
                                        {isEditMode && id && level ? (activeTab == 'Pro' ? "Finish & Update All" : "Update Session") : (activeTab == 'Pro' ? "Finish & Save All" : "Create Sessions")}
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
                                className="w-full bg-none md:w-1/2  max-h-fit"
                            >
                                <div className=" bg-white rounded-3xl p-6  shadow-2xl relative ">
                                    <button
                                        onClick={() => setOpenForm(false)}
                                        className="absolute top-2 right-3  hover:text-gray-700 text-5xl"
                                        title="Close"
                                    >
                                        &times;
                                    </button>
                                    {/* Add your form content here */}
                                    <div className="text-[24px] font-semibold mb-4">Exercise    </div>

                                    {[
                                        { label: "Title", name: "title" },

                                        { label: "Duration", name: "duration" },

                                    ].map((field) => (
                                        <div key={field.name} className="mb-4">
                                            <label className="block text-[18px]  font-semibold text-gray-700 mb-2">{field.label}</label>
                                            <input
                                                type="text"
                                                value={formData[field.name]}
                                                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                                className="w-full px-4 font-semibold text-[18px] py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}

                                    <div className="mb-4">
                                        <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <div className="rounded-md border border-gray-300 bg-gray-100 p-1">
                                            <Editor
                                                apiKey="sqe5er2lyngzjf0armhqaw1u7ffh0xgjyzmb7unv5irietwa"

                                                value={formData.description}
                                                onEditorChange={(content) =>
                                                    setFormData({ ...formData, description: content })
                                                }
                                                init={{
                                                    menubar: false,
                                                    toolbar: 'bold italic underline | bullist numlist | undo redo',
                                                    height: 150,
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
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                                style={{ display: 'none' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex w-full items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                                            >
                                                Upload image
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <button
                                            onClick={handleSavePlan}
                                            className="bg-[#237FEA] text-white mt-5 md:min-w-50 w-full md:w-auto font-semibold px-6 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            Save Exercise
                                        </button>
                                    </div>



                                </div>
                                <div className="flex items-center mt-16 gap-4 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/configuration/weekly-classes/session-plan-preview')}
                                        className="flex items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 w-full md:w-auto"
                                    >
                                        Preview Sessions
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[#237FEA] text-white  font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto"
                                    >
                                        {"Create Group"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                </>
            </div>


        </div>
    );
};

export default Create;
