"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist"; // ✅ MUST import this
import workerSrc from "../../../../../../pdf-worker"; // path to your pdf-worker.js
import { IoArrowBackOutline } from "react-icons/io5";

// Set the PDF.js worker
GlobalWorkerOptions.workerSrc = workerSrc;

import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../../../contexts/Loader";
import { e } from "mathjs";
import { showError, showSuccess, showLoading } from "../../../../../../utils/swalHelper";
const PdfEditor = () => {
    const viewerRef = useRef(null);
    const overlayRef = useRef(null);
    const drawCanvasRef = useRef(null);
    const navigate = useNavigate();
    const [tagInput, setTagInput] = useState("");
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("id"); // <-- this will be "9"  
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [formData, setFormData] = useState({
        pdfFile: null,
        title: "",
        description: "",
        contractType: "",
        tags: [],
    });

    const handleSubmit = async (e) => {
        const newErrors = {};
        e.preventDefault();

        if (!formData.pdfFile) newErrors.pdfFile = "PDF file is required";
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.contractType) newErrors.contractType = "Contract type is required";
        if (!formData.description) newErrors.description = "Description is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        try {
            setLoading(true);
            showLoading("Updating Template...");

            const token = localStorage.getItem("adminToken");

            const formdata = new FormData();
            formdata.append("pdfFile", formData.pdfFile);
            formdata.append("title", formData.title);
            formdata.append("description", formData.description);
            formdata.append("contractType", formData.contractType);
            formdata.append("tags", JSON.stringify(formData.tags));

            const res = await fetch(
                `${API_BASE_URL}/api/admin/contract/update/${id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formdata,
                }
            );

            const json = await res.json();

            // ❗ API error handling
            if (!res.ok) {
                throw new Error(json?.message || "Failed to update contract");
            }

            showSuccess("Success", json?.message || "Contract template updated successfully");
            navigate('/configuration/coach-pro/contracts')
            setFormData({
                pdfFile: null,
                title: "",
                description: "",
                contractType: "",
                tags: [],
            });
        } catch (err) {
            showError("Error", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };



    const [selectedPage, setSelectedPage] = useState(1);
    const [thumbnails, setThumbnails] = useState([]);
    const [activeTool, setActiveTool] = useState(null);
    const [pdfPages, setPdfPages] = useState([]);

    const [isDrawing, setIsDrawing] = useState(false);

    // ------------------ LOAD PDF ------------------

    useEffect(() => {
        if (!viewerRef.current || !overlayRef.current || !formData.pdfFile) return;

        const loadPDF = async () => {
            let fileUrl;

            try {
                // 🔹 If pdfFile is URL → convert to Base64 using API
                if (typeof formData.pdfFile === "string") {
                    const response = await fetch(
                        `${API_BASE_URL}/api/admin/contract/utils/url-to-base`,

                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                            },
                            body: JSON.stringify({
                                urls: [formData.pdfFile],
                            }),
                        }
                    );

                    const result = await response.json();

                    fileUrl = result?.data?.[0]?.base;
                    if (!fileUrl) throw new Error("Base64 PDF not found");
                }
                // 🔹 If pdfFile is File object
                else {
                    fileUrl = URL.createObjectURL(formData.pdfFile);
                }

                const loadingTask = pdfjsLib.getDocument(fileUrl);
                const pdf = await loadingTask.promise;

                const main = viewerRef.current;
                const overlay = overlayRef.current;

                main.innerHTML = "";
                overlay.innerHTML = "";

                const pagesArr = [];
                const thumbList = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.4 });

                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.className = "shadow-xl mb-6 rounded bg-white";

                    if (i === selectedPage) {
                        main.appendChild(canvas);
                        await page.render({ canvasContext: ctx, viewport }).promise;
                    }

                    pagesArr.push({
                        width: viewport.width,
                        height: viewport.height,
                    });

                    const thumbViewport = page.getViewport({ scale: 0.28 });
                    const thumbCanvas = document.createElement("canvas");
                    const thumbCtx = thumbCanvas.getContext("2d");

                    thumbCanvas.width = thumbViewport.width;
                    thumbCanvas.height = thumbViewport.height;

                    await page.render({
                        canvasContext: thumbCtx,
                        viewport: thumbViewport,
                    }).promise;

                    thumbList.push({
                        id: i,
                        src: thumbCanvas.toDataURL(),
                    });
                }

                setPdfPages(pagesArr);
                setThumbnails(thumbList);

                const drawCanvas = drawCanvasRef.current;
                drawCanvas.width = pagesArr[selectedPage - 1]?.width;
                drawCanvas.height = pagesArr[selectedPage - 1]?.height;

                // 🔹 Cleanup only for File object
                if (typeof formData.pdfFile !== "string") {
                    URL.revokeObjectURL(fileUrl);
                }
            } catch (err) {
                console.error("PDF render failed:", err);
            }
        };

        loadPDF();
    }, [formData.pdfFile, selectedPage]);


    // ------------------ ADD TEXT ------------------
    const addTextBox = () => {
        const overlay = overlayRef.current;

        const div = document.createElement("div");
        div.contentEditable = true;
        div.innerText = "Enter Text";
        div.className =
            "absolute top-10 left-10 bg-yellow-200 px-2 py-1 rounded border cursor-move";

        makeDraggable(div);
        overlay.appendChild(div);
    };

    // ------------------ ADD SHAPE ------------------
    const addRectangle = () => {
        const overlay = overlayRef.current;

        const box = document.createElement("div");
        box.className =
            "absolute top-20 left-20 w-40 h-28 border-2 border-green-600 bg-transparent cursor-move";

        makeDraggable(box);
        overlay.appendChild(box);
    };

    // ------------------ ADD COMMENT ------------------
    const addComment = () => {
        const overlay = overlayRef.current;

        const note = document.createElement("div");
        note.className =
            "absolute top-16 left-16 w-32 p-2 bg-blue-200 rounded shadow cursor-move text-xs";
        note.innerText = "Comment...";

        makeDraggable(note);
        overlay.appendChild(note);
    };

    // ------------------ FREEHAND DRAW ------------------
    const startDrawing = (e) => {
        if (activeTool !== "draw") return;
        setIsDrawing(true);

        const canvas = drawCanvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = drawCanvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "red";

        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    // ------------------ ADD NEW PAGE ------------------
    const addBlankPage = () => {
        const newPage = {
            width: 900,
            height: 1200,
        };

        setPdfPages([...pdfPages, newPage]);
        setSelectedPage(pdfPages.length + 1);
    };

    // ------------------ Draggable Utility ------------------
    const makeDraggable = (el) => {
        let offsetX = 0,
            offsetY = 0,
            isDown = false;

        el.onmousedown = (e) => {
            isDown = true;
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        };

        el.onmouseup = () => (isDown = false);

        el.onmousemove = (e) => {
            if (!isDown) return;
            el.style.left = e.pageX - viewerRef.current.offsetLeft - offsetX + "px";
            el.style.top = e.pageY - viewerRef.current.offsetTop - offsetY + "px";
        };
    };

    const handleToolClick = (tool) => {
        setActiveTool(tool);

        if (tool === "text") addTextBox();
        if (tool === "shape") addRectangle();
        if (tool === "comment") addComment();
        if (tool === "page") addBlankPage();
    };


    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/contract/listBy/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const json = await res.json();

            // ❗ handle API error response
            if (!res.ok) {
                throw new Error(json?.message || "Something went wrong");
            }

            const normalized = json?.data || [];
            setFormData(normalized);
        } catch (err) {
            console.error("Fetch failed", err);

            showError("Error", err.message || "Failed to fetch contract details");
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, id]);



    useEffect(() => {
        fetchData();
    }, [])
    if (loading) {
        return (
            <Loader />
        )
    }

    return (
        <div className="mt-3">
            <h2 className="text-xl mb-4 font-semibold flex gap-3 items-center">
                <IoArrowBackOutline onClick={() => navigate('/configuration/coach-pro/contracts')} className="cursor-pointer " /> {formData?.contractType} Contract</h2>

            <div className="flex gap-8">
                <div className="flex  bg-white rounded-2xl p-7 w-full h-screen overflow-hidden ">


                    {/* LEFT: PDF VIEWER + EDIT OVERLAY */}
                    <div className="relative flex-1 bg-[#636363] p-5 overflow-auto flex justify-center">
                        <div className="relative">
                            <div ref={viewerRef}></div>

                            {/* Overlay for shapes, text, comments */}
                            <div
                                ref={overlayRef}
                                className="absolute top-0 left-0 w-full h-full pointer-events-auto"
                            ></div>

                            {/* Drawing Canvas */}
                            <canvas
                                ref={drawCanvasRef}
                                className="absolute top-0 left-0 pointer-events-auto"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                            />
                        </div>
                        <div className="w-32  bg-[#636363]  p-4 overflow-auto flex flex-col items-center gap-4">
                            {thumbnails.map((thumb) => (
                                <div
                                    key={thumb.id}
                                    onClick={() => setSelectedPage(thumb.id)}
                                    className={`border-2 cursor-pointer rounded-md p-1 ${selectedPage === thumb.id
                                        ? "border-yellow-400"
                                        : "border-transparent"
                                        }`}
                                >
                                    <img src={thumb.src} className="w-full rounded" />
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* RIGHT: TOOLBOX */}
                    <div className="w-[200px] bg-white p-6 pe-0 border-l flex flex-col gap-5">
                        <h2 className="text-md font-semibold text-[#282829] mb-2">Edit Options</h2>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleToolClick("shape")}
                                className="w-10 h-10 bg-green-500 rounded-full text-white"
                            >
                                S
                            </button>

                            <button
                                onClick={() => handleToolClick("comment")}
                                className="w-10 h-10 bg-blue-500 rounded-full text-white"
                            >
                                C
                            </button>
                        </div>

                        <div className="flex gap-4 border-t border-[#E2E1E5] pt-3">
                            <button
                                onClick={() => handleToolClick("text")}
                                className="w-10 h-10 bg-yellow-500 rounded-full text-white"
                            >
                                T
                            </button>

                            <button
                                onClick={() => setActiveTool("draw")}
                                className="w-10 h-10 rounded-full"
                            >
                                <img src="/reportsIcons/pencil.png" alt="" />
                            </button>

                            <button
                                onClick={() => handleToolClick("page")}
                                className="w-10 h-10 bg-indigo-300 rounded-full text-white"
                            >
                                <img src="/reportsIcons/calender1.png" alt="" />

                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                    <div className="mb-4">
                        <label className="font-semibold">Update PDF *</label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    pdfFile: e.target.files[0],
                                })
                            }
                            className="w-full border border-[#EFEEF2] rounded-lg px-4 py-2 mt-1"
                        />
                        {errors.pdfFile && (
                            <p className="text-red-500 text-xs mt-1">{errors.pdfFile}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="font-semibold">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                            className="w-full border border-[#EFEEF2] rounded-lg px-4 py-2 mt-1"
                        />
                        {errors.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* DESCRIPTION */}
                    <div className="mb-4">
                        <label className="font-semibold">Description</label>
                        <textarea
                            rows="4"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            className="w-full border border-[#EFEEF2] rounded-lg px-4 py-2 mt-1"
                        />

                        {errors.description && (
                            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                        )}
                    </div>

                    {/* CONTRACT TYPE */}
                    <div className="mb-4">
                        <label className="font-semibold">Contract Type *</label>

                        <select
                            value={formData.contractType}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    contractType: e.target.value,
                                })
                            }
                            className="w-full border border-[#EFEEF2] rounded-lg px-4 py-2 mt-1"
                        >
                            <option value="">Select Contract Type</option>
                            <option value="Support Coach Contract">
                                Support Coach Contract
                            </option>
                            <option value="Lead Coach Contract">
                                Lead Coach Contract
                            </option>
                            <option value="Head Coach">
                                Head Coach
                            </option>
                        </select>
                        {errors.contractType && (
                            <p className="text-red-500 text-xs mt-1">{errors.contractType}</p>
                        )}
                    </div>


                    <div className="mb-6">
                        <label className="font-semibold">Tags</label>

                        <div className="flex flex-wrap gap-2 border border-[#EFEEF2] rounded-lg px-3 py-2 mt-1">
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-gray-100 text-sm px-3 py-1 rounded-full flex items-center gap-2"
                                >
                                    {tag.label}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = formData.tags.filter((_, i) => i !== index);
                                            setFormData({ ...formData, tags: updated });
                                        }}
                                        className="text-gray-500 hover:text-red-500"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}

                            <input
                                type="text"
                                placeholder="Type and press Enter"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && tagInput.trim()) {
                                        e.preventDefault();

                                        if (
                                            formData.tags.some(
                                                (t) => t.label.toLowerCase() === tagInput.trim().toLowerCase()
                                            )
                                        ) {
                                            setTagInput("");
                                            return;
                                        }

                                        setFormData({
                                            ...formData,
                                            tags: [
                                                ...formData.tags,
                                                { type: "C", label: tagInput.trim() },
                                            ],
                                        });

                                        setTagInput("");
                                    }
                                }}
                                className="flex-1 outline-none text-sm py-1"
                            />
                        </div>

                        {/* <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
                                {JSON.stringify(formData.tags, null, 2)}
                            </pre> */}
                    </div>


                    <div className="flex justify-end gap-3">
                        <button
                            className="px-4 py-2 border border-[#EFEEF2] rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-5 py-2 bg-[#237FEA] text-white rounded-lg"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default PdfEditor;
