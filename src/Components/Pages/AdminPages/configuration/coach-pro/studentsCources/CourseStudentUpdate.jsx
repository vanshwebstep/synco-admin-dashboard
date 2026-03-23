import { ArrowLeft } from "lucide-react";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { showError, showSuccess, showLoading } from "../../../../../../utils/swalHelper";
import Loader from "../../../contexts/Loader";
export default function CourseStudentUpdate() {
    const fileInputRef = useRef(null);

    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("id"); // <-- this will be "9" 
    const videoInputRefs = useRef({});
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();
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

    /* ---------------- handlers ---------------- */

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData((prev) => ({
            ...prev,
            coverImage: file,
            coverImagePreview: URL.createObjectURL(file),
        }));
    };

    const handleVideoChange = (id, key, value) => {
        setFormData((prev) => ({
            ...prev,
            videos: prev.videos.map((v) =>
                v.id === id ? { ...v, [key]: value } : v
            ),
        }));
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
                    ? {
                        ...v,
                        childFeatures: v.childFeatures.filter((_, i) => i !== index),
                    }
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();

        fd.append("courseName", formData.courseName);
        fd.append("duration", formData.duration);
        fd.append("durationType", formData.durationType);
        fd.append("level", formData.level);

        // cover image (file only, not preview)
        if (formData.coverImage) {
            fd.append("coverImage", formData.coverImage);
        }

        /* ---------------- Videos JSON (metadata only) ---------------- */

        const videosPayload = [];
        let uploadIndex = 0;

        // build JSON + track file keys
        formData.videos.forEach((video) => {
            // new upload
            if (video.videoFile) {
                const fileKey = `video_${uploadIndex}`;

                videosPayload.push({
                    name: video.videoName,
                    childFeatures: video.childFeatures.filter(Boolean),
                    videoUrl: video.videoUrl || "",   // keep or empty
                    fileKey: fileKey,                 // 👈 IMPORTANT
                });

                uploadIndex++;
            }
            // existing video only
            else {
                videosPayload.push({
                    name: video.videoName,
                    childFeatures: video.childFeatures.filter(Boolean),
                    videoUrl: video.videoUrl,          // existing URL
                });
            }
        });

        // append JSON
        fd.append("videos", JSON.stringify(videosPayload));

        // append files (same order)
        let fileIndex = 0;
        formData.videos.forEach((video) => {
            if (video.videoFile) {
                fd.append(`video_${fileIndex}`, video.videoFile);
                fileIndex++;
            }
        });
        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Unauthorized", "Admin session expired. Please login again.");
            return;
        }

        showLoading("Uploading Course...", "Please wait while the student course is being uploaded");


        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/student-course/update/${id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: fd,
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Course upload failed");

            showSuccess("Course Uploaded", "Student course has been uploaded successfully");

            navigate(`/configuration/coach-pro/student`)



        } catch (err) {
            showError("Upload Failed", err.message || "Unable to upload student course");
        }
    };
    const fetchDataById = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token || !id) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/student-course/listBy/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const json = await res.json();

            // ❗ API error handling
            if (!res.ok) {
                throw new Error(json?.message || "Failed to fetch course details");
            }

            const course = json?.data;
            if (!course) return;

            setFormData({
                courseName: course?.courseName ?? "",
                duration: course?.duration ?? "",
                durationType: course?.durationType ?? "Minutes",
                level: course?.level ?? "",
                coverImage: null, // file will be set only if user uploads new
                coverImagePreview: course?.coverImage ?? null,

                videos: (course?.videos ?? []).map((video, index) => ({
                    id: Date.now() + index,
                    videoName: video?.name ?? "",
                    videoFile: null, // user upload only
                    videoFilePreview: video?.videoUrl ?? null,
                    videoUrl: video?.videoUrl ?? null,
                    childFeatures: video?.childFeatures?.length
                        ? video.childFeatures
                        : [""],
                })),
            });


        } catch (err) {
            console.error("Fetch failed", err);

            showError("Error", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, id]);


    useEffect(() => {
        fetchDataById();
    }, []);



    if (loading) return <Loader />;
    /* ---------------- JSX (UNCHANGED UI) ---------------- */

    return (
        <>
            <h2 className="text-[28px] font-semibold mb-6 flex items-center gap-2"> <ArrowLeft onClick={() => navigate(`/configuration/coach-pro/student`)} className="cursor-pointer" /> Update course</h2>

            <form onSubmit={handleSubmit}>
                <section className="mb-10 bg-white rounded-4xl py-5">
                    <h3 className="text-[28px] px-5 font-semibold mb-4 border-b pb-5 border-gray-200">
                        General Settings
                    </h3>

                    <div className="space-y-6 p-5">
                        <div className="flex gap-2 items-center border-[#E2E1E5] pb-6 border-b">
                            <label className="md:w-2/12 text-[20px] font-semibold">
                                Name of the course
                            </label>
                            <input
                                type="text"
                                value={formData.courseName}
                                onChange={(e) =>
                                    handleChange("courseName", e.target.value)
                                }
                                className="md:w-3/12 border border-[#E2E1E5] rounded-xl px-3 py-3"
                            />
                        </div>

                        <div className="flex gap-2 items-center border-[#E2E1E5] pb-6 border-b">
                            <label className="md:w-2/12 text-[20px] font-semibold">
                                Duration
                            </label>
                            <div className="flex space-x-3 items-center max-w-xs">
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) =>
                                        handleChange("duration", e.target.value)
                                    }
                                    className="border border-[#E2E1E5] rounded-xl px-3 py-2"
                                />
                                <select
                                    value={formData.durationType}
                                    onChange={(e) =>
                                        handleChange("durationType", e.target.value)
                                    }
                                    className="border border-[#E2E1E5] rounded-xl px-3 py-3"
                                >
                                    <option>Minutes</option>
                                    <option>Hours</option>
                                    <option>Days</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center border-[#E2E1E5] pb-6 border-b">
                            <label className="md:w-2/12 text-[20px] font-semibold">
                                Level
                            </label>
                            <select
                                value={formData.level}
                                onChange={(e) => handleChange("level", e.target.value)}
                                className="w-48 border  border-[#E2E1E5] rounded-xl px-3 py-3"
                            >
                                <option value=""></option>
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </select>
                        </div>

                        <div className="flex gap-2 items-center">
                            <label className="md:w-2/12 text-[20px] font-semibold">
                                Cover image
                            </label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="border border-[#E2E1E5] rounded-2xl p-3 px-5"
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
                                    className="h-24 rounded border border-[#E2E1E5]"
                                />
                            )}
                        </div>
                    </div>
                </section>

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
                                    className="absolute top-2 right-2 text-red-500 font-bold"
                                >
                                    &times;
                                </button>
                            )}

                            <div className="flex gap-2 items-center border-[#E2E1E5] py-6 border-b">
                                <label className="md:w-2/12 text-[20px] font-semibold">
                                    Name of the video
                                </label>
                                <input
                                    type="text"
                                    value={video.videoName}
                                    onChange={(e) =>
                                        handleVideoChange(
                                            video.id,
                                            "videoName",
                                            e.target.value
                                        )
                                    }
                                    className="w-4/12 border border-[#E2E1E5] rounded-xl px-3 py-2"
                                />
                            </div>

                            <div className="flex gap-2 items-center border-[#E2E1E5] py-6 border-b">
                                <label className="md:w-2/12 text-[20px] font-semibold">
                                    Add course video
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        videoInputRefs.current[video.id].click()
                                    }
                                    className="border border-[#E2E1E5] rounded-2xl p-3 px-5"
                                >
                                    Add Video
                                </button>
                                <input
                                    ref={(el) =>
                                        (videoInputRefs.current[video.id] = el)
                                    }
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) =>
                                        handleVideoFileChange(
                                            video.id,
                                            e.target.files[0]
                                        )
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
                            </div>

                            <div className="flex gap-2 items-center pt-6">
                                <label className="md:w-2/12 text-[20px] font-semibold">
                                    Childs features
                                </label>
                                <div className="space-y-2 md:w-3/12">
                                    {video.childFeatures.map((feature, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                value={feature}
                                                onChange={(e) =>
                                                    handleChildFeatureChange(
                                                        video.id,
                                                        idx,
                                                        e.target.value
                                                    )
                                                }
                                                className="border border-[#E2E1E5] rounded-xl px-3 py-2"
                                            />
                                            {video.childFeatures.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeChildFeature(video.id, idx)
                                                    }
                                                    className="text-red-500 font-bold"
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
