import { ArrowLeft } from "lucide-react";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showLoading } from "../../../../../../utils/swalHelper";

const REQUIRED = "This field is required.";

export default function StudentCourceAdd() {
    const fileInputRef = useRef(null);
    const videoInputRefs = useRef({});
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();

    // ── Field refs for scroll-to-error ──
    const courseNameRef = useRef(null);
    const durationRef = useRef(null);
    const levelRef = useRef(null);
    const coverImageRef = useRef(null);
    const videoNameRefs = useRef({});
    const videoFileRefs = useRef({});

    const [formData, setFormData] = useState({
        courseName: "",
        duration: "",
        durationType: "Minutes",
        level: "",
        coverImage: null,
        coverImagePreview: null,
        videos: [
            {
                id: Date.now(),
                videoName: "",
                videoFile: null,
                videoFilePreview: null,
                childFeatures: [""],
            },
        ],
    });

    const [errors, setErrors] = useState({});

    /* ---------------- Validation ---------------- */

    const validate = () => {
        const newErrors = {};

        if (!formData.courseName.trim())
            newErrors.courseName = REQUIRED;

        if (!formData.duration)
            newErrors.duration = REQUIRED;

        if (!formData.level)
            newErrors.level = REQUIRED;

        if (!formData.coverImage)
            newErrors.coverImage = "Please upload a cover image.";

        formData.videos.forEach((video) => {
            if (!video.videoName.trim())
                newErrors[`videoName_${video.id}`] = REQUIRED;
            if (!video.videoFile)
                newErrors[`videoFile_${video.id}`] = "Please upload a video file.";
        });

        return newErrors;
    };

    const scrollToFirstError = (newErrors) => {
        // Priority order: top-level fields first, then per-video fields
        if (newErrors.courseName && courseNameRef.current) {
            courseNameRef.current.focus();
            courseNameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        if (newErrors.duration && durationRef.current) {
            durationRef.current.focus();
            durationRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        if (newErrors.level && levelRef.current) {
            levelRef.current.focus();
            levelRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        if (newErrors.coverImage && coverImageRef.current) {
            coverImageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        // Check video-level errors in order
        for (const video of formData.videos) {
            if (newErrors[`videoName_${video.id}`] && videoNameRefs.current[video.id]) {
                videoNameRefs.current[video.id].focus();
                videoNameRefs.current[video.id].scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
            if (newErrors[`videoFile_${video.id}`] && videoFileRefs.current[video.id]) {
                videoFileRefs.current[video.id].scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
        }
    };

    /* ---------------- Clear single error on change ---------------- */

    const clearError = (key) => {
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    /* ---------------- Handlers ---------------- */

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        clearError(key);
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData((prev) => ({
            ...prev,
            coverImage: file,
            coverImagePreview: URL.createObjectURL(file),
        }));
        clearError("coverImage");
    };

    const handleVideoChange = (id, key, value) => {
        setFormData((prev) => ({
            ...prev,
            videos: prev.videos.map((v) =>
                v.id === id ? { ...v, [key]: value } : v
            ),
        }));
        clearError(`${key}_${id}`);
    };

    const handleVideoFileChange = (id, file) => {
        setFormData((prev) => ({
            ...prev,
            videos: prev.videos.map((v) =>
                v.id === id
                    ? {
                        ...v,
                        videoFile: file,
                        videoFilePreview: file ? URL.createObjectURL(file) : null,
                    }
                    : v
            ),
        }));
        clearError(`videoFile_${id}`);
    };

    const handleChildFeatureChange = (videoId, index, value) => {
        setFormData((prev) => ({
            ...prev,
            videos: prev.videos.map((v) => {
                if (v.id !== videoId) return v;
                const updated = [...v.childFeatures];
                updated[index] = value;
                return { ...v, childFeatures: updated };
            }),
        }));
    };

    const addChildFeature = (videoId) => {
        setFormData((prev) => ({
            ...prev,
            videos: prev.videos.map((v) =>
                v.id === videoId
                    ? { ...v, childFeatures: [...v.childFeatures, ""] }
                    : v
            ),
        }));
    };

    const removeChildFeature = (videoId, index) => {
        setFormData((prev) => ({
            ...prev,
            videos: prev.videos.map((v) =>
                v.id === videoId
                    ? { ...v, childFeatures: v.childFeatures.filter((_, i) => i !== index) }
                    : v
            ),
        }));
    };

    const addVideo = () => {
        setFormData((prev) => ({
            ...prev,
            videos: [
                ...prev.videos,
                {
                    id: Date.now(),
                    videoName: "",
                    videoFile: null,
                    videoFilePreview: null,
                    childFeatures: [""],
                },
            ],
        }));
    };

    const removeVideo = (id) => {
        setFormData((prev) => ({
            ...prev,
            videos: prev.videos.filter((v) => v.id !== id),
        }));
        // Clean up errors for this video
        setErrors((prev) => {
            const next = { ...prev };
            delete next[`videoName_${id}`];
            delete next[`videoFile_${id}`];
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            scrollToFirstError(newErrors);
            return;
        }

        const fd = new FormData();
        fd.append("courseName", formData.courseName);
        fd.append("duration", formData.duration);
        fd.append("durationType", formData.durationType);
        fd.append("level", formData.level);
        if (formData.coverImage) fd.append("coverImage", formData.coverImage);

        const videosJson = formData.videos.map((video) => ({
            name: video.videoName,
            childFeatures: video.childFeatures.filter(Boolean),
        }));
        fd.append("videos", JSON.stringify(videosJson));

        formData.videos.forEach((video, indx) => {
            if (video.videoFile) fd.append(`video_${indx + 1}`, video.videoFile);
        });

        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Unauthorized", "Admin session expired. Please login again.");
            return;
        }

        showLoading("Uploading Course...", "Please wait while the student course is being uploaded");

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/student-course/create`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Course upload failed");

            showSuccess("Course Uploaded", "Student course has been uploaded successfully");
            navigate(`/configuration/coach-pro/student`);
        } catch (err) {
            showError("Upload Failed", err.message || "Unable to upload student course");
        }
    };

    /* ---------------- Shared style helpers ---------------- */

    const inputCls = (hasError) =>
        `border rounded-xl px-3 py-3 ${hasError ? "border-red-500 focus:outline-red-500" : "border-[#E2E1E5]"}`;

    const ErrorMsg = ({ msg }) =>
        msg ? <p className="text-red-500 text-sm mt-1">{msg}</p> : null;

    /* ---------------- JSX ---------------- */

    return (
        <>
            <h2 className="text-[28px] font-semibold mb-6 flex items-center gap-2">
                <ArrowLeft
                    onClick={() => navigate(`/configuration/coach-pro/student`)}
                    className="cursor-pointer"
                />
                Create a course
            </h2>

            <form onSubmit={handleSubmit} noValidate>
                {/* ── General Settings ── */}
                <section className="mb-10 bg-white rounded-4xl py-5">
                    <h3 className="text-[28px] px-5 font-semibold mb-4 border-b pb-5 border-gray-200">
                        General Settings
                    </h3>

                    <div className="space-y-6 p-5">
                        {/* Course Name */}
                        <div className="flex gap-2 items-start border-[#E2E1E5] pb-6 border-b">
                            <label className="md:w-2/12 text-[20px] font-semibold pt-2">
                                Name of the course
                            </label>
                            <div className="md:w-3/12">
                                <input
                                    ref={courseNameRef}
                                    type="text"
                                    value={formData.courseName}
                                    onChange={(e) => handleChange("courseName", e.target.value)}
                                    className={`w-full ${inputCls(errors.courseName)}`}
                                />
                                <ErrorMsg msg={errors.courseName} />
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="flex gap-2 items-start border-[#E2E1E5] pb-6 border-b">
                            <label className="md:w-2/12 text-[20px] font-semibold pt-2">
                                Duration
                            </label>
                            <div>
                                <div className="flex space-x-3 items-center">
                                    <div>
                                        <input
                                            ref={durationRef}
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => handleChange("duration", e.target.value)}
                                            className={inputCls(errors.duration)}
                                        />
                                    </div>
                                    <select
                                        value={formData.durationType}
                                        onChange={(e) => handleChange("durationType", e.target.value)}
                                        className="border border-[#E2E1E5] rounded-xl px-3 py-3"
                                    >
                                        <option>Minutes</option>
                                        <option>Hours</option>
                                        <option>Days</option>
                                    </select>
                                </div>
                                <ErrorMsg msg={errors.duration} />
                            </div>
                        </div>

                        {/* Level */}
                        <div className="flex gap-2 items-start border-[#E2E1E5] pb-6 border-b">
                            <label className="md:w-2/12 text-[20px] font-semibold pt-2">
                                Level
                            </label>
                            <div>
                                <select
                                    ref={levelRef}
                                    value={formData.level}
                                    onChange={(e) => handleChange("level", e.target.value)}
                                    className={`w-48 ${inputCls(errors.level)}`}
                                >
                                    <option value="">Select level</option>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                                <ErrorMsg msg={errors.level} />
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="flex gap-2 items-start">
                            <label className="md:w-2/12 text-[20px] font-semibold pt-2">
                                Cover image
                            </label>
                            <div ref={coverImageRef}>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className={`border rounded-2xl p-3 px-5 ${errors.coverImage ? "border-red-500" : "border-[#E2E1E5]"}`}
                                >
                                    Add Image
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverImageChange}
                                    className="hidden"
                                />
                                {formData.coverImagePreview && (
                                    <img
                                        src={formData.coverImagePreview}
                                        className="mt-2 h-24 rounded border border-[#E2E1E5]"
                                    />
                                )}
                                <ErrorMsg msg={errors.coverImage} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Course Videos ── */}
                <section className="bg-white rounded-4xl py-5">
                    <h3 className="text-[28px] px-5 font-semibold mb-4 border-b pb-5 border-gray-200">
                        Courses videos
                    </h3>

                    {formData.videos.map((video, vidIndex) => (
                        <div key={video.id} className="rounded p-4 relative">
                            {formData.videos.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeVideo(video.id)}
                                    className="absolute top-2 right-2 text-red-500 font-bold text-xl"
                                >
                                    &times;
                                </button>
                            )}

                            {/* Video Name */}
                            <div className="flex gap-2 items-start border-[#E2E1E5] py-6 border-b">
                                <label className="md:w-2/12 text-[20px] font-semibold pt-2">
                                    Name of the video
                                </label>
                                <div className="w-4/12">
                                    <input
                                        ref={(el) => (videoNameRefs.current[video.id] = el)}
                                        type="text"
                                        value={video.videoName}
                                        onChange={(e) =>
                                            handleVideoChange(video.id, "videoName", e.target.value)
                                        }
                                        className={`w-full ${inputCls(errors[`videoName_${video.id}`])}`}
                                    />
                                    <ErrorMsg msg={errors[`videoName_${video.id}`]} />
                                </div>
                            </div>

                            {/* Video File */}
                            <div className="flex gap-2 items-start border-[#E2E1E5] py-6 border-b">
                                <label className="md:w-2/12 text-[20px] font-semibold pt-2">
                                    Add course video
                                </label>
                                <div ref={(el) => (videoFileRefs.current[video.id] = el)}>
                                    <button
                                        type="button"
                                        onClick={() => videoInputRefs.current[video.id].click()}
                                        className={`border rounded-2xl p-3 px-5 ${errors[`videoFile_${video.id}`] ? "border-red-500" : "border-[#E2E1E5]"}`}
                                    >
                                        Add Video
                                    </button>
                                    <input
                                        ref={(el) => (videoInputRefs.current[video.id] = el)}
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) =>
                                            handleVideoFileChange(video.id, e.target.files[0])
                                        }
                                        className="hidden"
                                    />
                                    {video.videoFilePreview && (
                                        <video
                                            src={video.videoFilePreview}
                                            controls
                                            className="mt-2 max-h-40 rounded border border-[#E2E1E5]"
                                        />
                                    )}
                                    <ErrorMsg msg={errors[`videoFile_${video.id}`]} />
                                </div>
                            </div>

                            {/* Child Features */}
                            <div className="flex gap-2 items-start pt-6">
                                <label className="md:w-2/12 text-[20px] font-semibold pt-2">
                                    Childs features
                                </label>
                                <div className="space-y-2 md:w-3/12">
                                    {video.childFeatures.map((feature, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                value={feature}
                                                onChange={(e) =>
                                                    handleChildFeatureChange(video.id, idx, e.target.value)
                                                }
                                                className="border border-[#E2E1E5] rounded-xl px-3 py-2"
                                            />
                                            {video.childFeatures.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeChildFeature(video.id, idx)}
                                                    className="text-red-500 font-bold text-xl"
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addChildFeature(video.id)}
                                    className="border border-[#E2E1E5] px-3 py-2 rounded-lg"
                                >
                                    Add more descriptions
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                <div className="my-8 flex justify-between">
                    <button
                        type="button"
                        onClick={addVideo}
                        className="bg-[#237FEA] text-white px-4 py-2 rounded-xl"
                    >
                        Add course video
                    </button>
                    <button
                        type="submit"
                        className="bg-[#237FEA] text-white px-6 py-2 rounded-xl"
                    >
                        Save
                    </button>
                </div>
            </form>
        </>
    );
}