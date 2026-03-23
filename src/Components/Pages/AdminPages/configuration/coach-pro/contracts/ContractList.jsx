import { Download, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { showError, showSuccess, showConfirm, showLoading } from "../../../../../../utils/swalHelper";
import Loader from "../../../contexts/Loader";

const ContractList = () => {
    const navigate = useNavigate();
    const [tagInput, setTagInput] = useState("");

    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [errors, setErrors] = useState({});
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [formData, setFormData] = useState({
        pdfFile: null,
        title: "",
        description: "",
        contractType: "",
        tags: [],
    });

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/contract/list`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const json = await res.json();

            // ❗ API-level error
            if (!res.ok) {
                throw new Error(json?.message || "Something went wrong");
            }

            setData(json?.data || []);
        } catch (err) {
            console.error("Fetch failed", err);

            showError("Error", err.message || "Failed to fetch contracts");
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);
    const handleSubmit = async () => {
        const newErrors = {};

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
            showLoading("Creating Template...", "Please wait");

            const token = localStorage.getItem("adminToken");

            const formdata = new FormData();
            formdata.append("pdfFile", formData.pdfFile);
            formdata.append("title", formData.title);
            formdata.append("description", formData.description);
            formdata.append("contractType", formData.contractType);
            formdata.append("tags", JSON.stringify(formData.tags));

            const res = await fetch(
                `${API_BASE_URL}/api/admin/contract/create`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formdata,
                }
            );

            const json = await res.json();

            // ❗ API error handling
            if (!res.ok) {
                throw new Error(json?.message || "Failed to create contract");
            }

            showSuccess("Success", json?.message || "Contract template created successfully");

            setOpenModal(false);

            setFormData({
                pdfFile: null,
                title: "",
                description: "",
                contractType: "",
                tags: [],
            });
            fetchData();
        } catch (err) {
            showError("Error", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = useCallback(async (id, pdf) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);

        showLoading("Downloading PDF...");

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/contract/${id}/download?pdfFile=${pdf}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(
                    errorData?.message || "Unable to download the PDF"
                );
            }

            // Convert response to Blob
            const blob = await res.blob();

            // Create temporary URL
            const downloadUrl = window.URL.createObjectURL(blob);

            // Create anchor tag
            const a = document.createElement("a");
            a.href = downloadUrl;

            // Optional: set filename
            a.download = pdf.split("/").pop();

            document.body.appendChild(a);
            a.click();

            // Cleanup
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            showSuccess("Downloaded", "PDF downloaded successfully");

        } catch (err) {
            console.error("Fetch failed", err);

            showError("Download Failed", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);


    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Error", "Admin token missing");
            return;
        }

        const result = await showConfirm("Delete contract?", "This action cannot be undone", "Yes, delete");

        if (!result.isConfirmed) return;

        showLoading("Deleting...", "Please wait");

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/contract/delete/${id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Delete failed");


            showSuccess("Deleted", "Contract deleted successfully");

            fetchData();
        } catch (err) {
            showError("Delete failed", err.message || "Something went wrong");
        }
    };

    if (loading) {
        return (
            <Loader />
        )
    }

    return (
        <div>

            <h2 className="text-2xl font-semibold py-5">Coaching Contracts</h2>

            <div className="bg-white border border-[#EFEEF2] h-screen rounded-3xl overflow-hidden">
                <div className="flex justify-between items-center  border-b border-[#EFEEF2] p-5">
                    <h3 className="font-semibold text-2xl">Contract List</h3>

                    <button
                        onClick={() => setOpenModal(true)}
                        className="text-white bg-[#237FEA] rounded-xl p-3 py-2.5 flex gap-2"
                    >
                        <Plus /> Add Template
                    </button>
                </div>

                {data.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between p-4 border-b border-[#EFEEF2]   "
                    >
                        <span className="font-semibold">{item?.contractType}</span>
                        <div className="flex gap-3 items-center">
                            <Download onClick={() => handleDownloadPdf(item?.id, item?.pdfFile)} className="cursor-pointer" />
                            <img
                                src="/reportsIcons/Pen.png"
                                className="w-5 cursor-pointer"
                                onClick={() =>
                                    navigate(
                                        `/configuration/coach-pro/contracts/update?id=${item?.id}`
                                    )
                                }
                            />
                            <button onClick={() => handleDelete(item?.id)} className="text-gray-500 hover:text-red-500">
                                <img src="/reportsIcons/delete-02.png" className="w-6" alt="" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {openModal && (
                <div className="fixed inset-0 bg-black/40 z-50  flex items-center justify-center">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl p-6 relative">
                        <button
                            onClick={() => setOpenModal(false)}
                            className="absolute top-4 right-4"
                        >
                            <X />
                        </button>

                        <h2 className="text-xl font-semibold mb-5">
                            Add Contract Template
                        </h2>

                        <div className="mb-4">
                            <label className="font-semibold">Upload PDF *</label>
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
                                onClick={() => setOpenModal(false)}
                                className="px-4 py-2 border border-[#EFEEF2] rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-5 py-2 bg-[#237FEA] text-white rounded-lg"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractList;
