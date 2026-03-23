import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Upload, MoreVertical, Repeat, Trash2, Edit } from "lucide-react";
import { showError, showSuccess, showConfirm, showLoading } from "../../../../utils/swalHelper";
import Loader from "../contexts/Loader";
export default function MusicPlayer() {
    const audioRef = useRef(null);

    const [tracks, setTracks] = useState([]);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isLoop, setIsLoop] = useState(false);
    const [autoNext, setAutoNext] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [id, setId] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    console.log('currentTrack', currentTrack)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    /* ===================== AUDIO INIT ===================== */

    const handleFileSelect = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === "audio") {
            setAudioFile(file);
        }

        if (type === "cover") {
            setCoverFile(file);
        }

        e.target.value = null;
    };

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const onTimeUpdate = () => setProgress(audio.currentTime || 0);
        const onLoadedMeta = () => setDuration(audio.duration || 0);

        const onEnded = () => {
            if (isLoop) {
                audio.currentTime = 0;
                audio.play();
                return;
            }

            if (autoNext && currentTrack) {
                const index = tracks.findIndex((t) => t.id === currentTrack?.id);
                const next = tracks[index + 1];
                if (next) setCurrentTrack(next);
            }

            setIsPlaying(false);
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMeta);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.pause();
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoadedMeta);
            audio.removeEventListener("ended", onEnded);
        };
    }, [isLoop, autoNext, currentTrack, tracks]);

    /* ===================== LOAD TRACK ===================== */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!currentTrack) {
            audio.pause();
            setProgress(0);
            setDuration(0);
            return;
        }

        audio.src = currentTrack?.url;
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }, [currentTrack]);

    /* ===================== API ===================== */
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/music-player/list`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const json = await res.json();

            // ❗ API error handling
            if (!res.ok) {
                throw new Error(json?.message || "Failed to fetch music list");
            }

            const normalized = (json?.data || []).map((item) => {
                const fileName =
                    item?.uploadMusic
                        ?.split("/")
                        .pop()
                        ?.replace(/\.[^/.]+$/, "") || "Untitled";

                return {
                    id: item?.id,
                    title: fileName.replace(/[_-]/g, " "),
                    url: item?.uploadMusic,
                    duration: item?.durationSeconds,
                    durationFormatted: item?.durationFormatted,
                    musicImage: item?.musicImage,
                    createdAt: new Date(item?.createdAt).toLocaleDateString(),
                };
            });

            setTracks(normalized);
        } catch (err) {
            console.error("Fetch failed", err);

            showError("Error", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ===================== ACTIONS ===================== */
    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            await audio.play();
            setIsPlaying(true);
        }
    };

    const playTrack = (track) => {
        if (currentTrack?.id === track?.id) return togglePlayPause();
        setCurrentTrack(track);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        audio.currentTime = Number(e.target.value);
        setProgress(audio.currentTime);
    };

    const handleSaveUpload = async () => {
        if (!audioFile) {
            showError("Error", "Please select an audio file");
            return;
        }

        if (!coverFile) {
            showError("Error", "Please select a cover photo");
            return;
        }

        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Error", "Admin token missing");
            return;
        }

        const formData = new FormData();
        formData.append("uploadMusic", audioFile);   // 🎵 audio
        formData.append("musicImage", coverFile);    // 🖼 cover photo

        showLoading("Uploading...", "Please wait");

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/music-player/upload`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Upload failed");

            showSuccess("Uploaded", "Music uploaded successfully");

            // cleanup
            setAudioFile(null);
            setCoverFile(null);
            setIsUploadModalOpen(false);

            fetchData();

        } catch (err) {
            showError("Error", err.message || "Upload failed");
        }
    };


    const handleDelete = async (id) => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Error", "Admin token missing");
            return;
        }

        // 🔴 Confirmation
        const result = await showConfirm("Delete music?", "This action cannot be undone", "Yes, delete");

        if (!result.isConfirmed) return;

        // 🔵 Loading
        showLoading("Deleting...", "Please wait");

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/music-player/delete/${id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Delete failed");

            if (currentTrack?.id === id) {
                setCurrentTrack(null);
                setIsPlaying(false);
            }

            // ✅ Success
            showSuccess("Deleted", "Music deleted successfully");

            fetchData();
        } catch (err) {
            // ❌ Error
            showError("Delete failed", err.message || "Something went wrong");
        }
    };



    const handleEdit = (track) => {
        setTitle(track?.title);
        setId(track?.id);
    }

    const handleUpdateTitle = async () => {


        const token = localStorage.getItem("adminToken");

        try {
            // Loading alert
            showLoading("Updating...", "Please wait");

            const res = await fetch(
                `${API_BASE_URL}/api/admin/music-player/update/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ fileName: title }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to update title");
            }

            // Success alert
            showSuccess("Updated", "Music title updated successfully");

            setTitle("");
            setId("");
            fetchData();

        } catch (error) {
            // Error alert
            showError("Error", error.message || "Something went wrong");
        }
    };


    const formatTime = (t = 0) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;


    if (loading) {
        return (
            <Loader />
        )
    }

    /* ===================== UI ===================== */
    return (
        <div className="flex gap-6 p-6 bg-[#F7F8FA] min-h-screen">
            <div className="flex-1">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold">Samba Music</h2>
                    <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-[#237FEA] text-white px-4 py-2 rounded-lg cursor-pointer flex gap-2 items-center"
                    >
                        <Upload size={16} />
                        Upload
                    </button>

                </div>

                <div className="bg-white border border-[#E2E1E5] h-screen  rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr className="bg-[#F5F5F5] border-b border-[#DBDBDB]">
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === tracks.length && tracks.length > 0}
                                        onChange={(e) => toggleSelectAll(e.target.checked)}
                                    />
                                    <span className="ml-2">Title</span>
                                </th>
                                <th className="text-left">Duration</th>
                                <th className="text-left">Date</th>
                                <th className="px-3 text-left">Play</th>
                                <th className="text-left"></th>
                            </tr>
                        </thead>

                        <tbody>
                            {tracks.map((track) => (

                                <tr
                                    key={track?.id}
                                    className={`border-b bg-white border-[#EFEEF2]  cursor-pointer ${currentTrack?.id === track?.id ? "bg-gray-50" : ""}`}
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            onClick={(e) => e.stopPropagation()}
                                            type="checkbox"
                                            checked={selectedIds.includes(track?.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSelectedIds((prev) => (checked ? [...prev, track?.id] : prev.filter((id) => id !== track?.id)));
                                            }}
                                        />
                                        <span className="ml-2">{track?.title}</span>
                                    </td>
                                    <td>{track?.durationFormatted || "—"}</td>
                                    <td>{track?.createdAt}</td>

                                    <td>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playTrack(track);
                                            }}
                                            className="p-2 rounded-full "
                                        >
                                            {currentTrack?.id === track?.id && isPlaying ? <img src="/images/pausegray.png" className="w-8" alt="" /> : <img src="/images/playgray.png" className="w-8" alt="" />}
                                        </button>
                                    </td>

                                    <td className="px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(track)} className="text-gray-500 hover:text-gray-700">
                                                <img src="/images/icons/edit.png" className="w-6" alt="" />
                                            </button>

                                            <button onClick={() => handleDelete(track?.id)} className="text-gray-500 hover:text-red-500">
                                                <img src="/images/icons/deleteIcon.png" className="w-6" alt="" />
                                            </button>
                                            <MoreVertical size={16} className="text-gray-500" />
                                        </div>
                                    </td>

                                </tr>
                            ))}

                            {tracks.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-gray-400">
                                        No music uploaded
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="w-[320px] bg-[#2F3640] h-fit rounded-2xl text-white p-6">
                <h4 className="text-center mb-4 text-xl">Now Playing</h4>
                <div className="h-[180px] bg-gray-700 rounded-xl mb-4 flex items-center justify-center">
                    {currentTrack?.musicImage ? (
                        <img src={currentTrack?.musicImage} className="w-full p-3 h-full" alt="" />
                    ) : (
                        <span>Cover</span>
                    )}
                </div>
                <h3 className="text-center font-semibold">{currentTrack?.title || "No Track"}</h3>

                <input type="range" min="0" max={duration} value={progress} onChange={handleSeek} className="w-full mt-4" />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                <div className="flex justify-center gap-6 mt-6">
                    <Repeat onClick={() => setIsLoop((p) => !p)} className={isLoop ? "text-blue-400" : "text-gray-400"} />
                    <SkipBack onClick={() => playTrack(tracks[tracks.findIndex(t => t.id === currentTrack?.id) - 1])} />
                    <button className="bg-[#237FEA] p-4 rounded-full" onClick={togglePlayPause}>
                        {isPlaying ? <Pause /> : <Play />}
                    </button>
                    <SkipForward onClick={() => playTrack(tracks[tracks.findIndex(t => t.id === currentTrack?.id) + 1])} />
                </div>
            </div>


            {title && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-[400px] p-6">
                        <h3 className="text-lg font-semibold mb-4">Update Music Title</h3>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter title"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4"
                            autoFocus
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setTitle('');
                                    setId('');
                                }}
                                className="px-4 py-2 rounded-lg border-gray-200 border"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleUpdateTitle}
                                className="px-4 py-2 rounded-lg bg-[#237FEA] text-white"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">

                        <h2 className="text-lg font-semibold mb-4">Upload Music</h2>

                        {/* Audio */}
                        <label className="w-full h-30 border-2 border-dashed border-gray-300 rounded-xl flex gap-3 justify-center items-center cursor-pointer text-gray-500 text-sm bg-gray-50"
                        >
                            <Upload size={16} />
                            {audioFile ? audioFile.name : "Choose Audio"}
                            <input
                                hidden
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileSelect(e, "audio")}
                            />
                        </label>

                        {/* Cover */}
                        <label className="w-full h-30 my-4 border-2 border-dashed border-gray-300 rounded-xl flex gap-3 justify-center items-center cursor-pointer text-gray-500 text-sm bg-gray-50"
                        >
                            <Upload size={16} />
                            {coverFile ? coverFile.name : "Cover Photo"}
                            <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, "cover")}
                            />
                        </label>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setAudioFile(null);
                                    setCoverFile(null);
                                }}
                                className="px-4 py-2 rounded-lg border border-gray-200"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSaveUpload}
                                className="px-4 py-2 rounded-lg bg-[#237FEA] text-white"
                            >
                                Save
                            </button>
                        </div>

                    </div>
                </div>
            )}


        </div>
    );
}
