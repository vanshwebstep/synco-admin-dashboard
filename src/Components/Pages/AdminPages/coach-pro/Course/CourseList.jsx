import { Plus } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../../contexts/Loader";
import { showError, showSuccess, showConfirm, showLoading } from "../../../../../utils/swalHelper";
export default function CourseList() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(null);

    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/course/list`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const json = await res.json();

            // ❗ handle API error
            if (!res.ok) {
                throw new Error(json?.message || "Failed to fetch courses");
            }

            setCourses(json?.data || []);
        } catch (err) {
            console.error("Fetch failed", err);

            showError("Error", err.message || "Something went wrong");
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

        const result = await showConfirm("Delete Course?", "This action cannot be undone", "Yes, delete");

        if (!result.isConfirmed) return;

        showLoading("Deleting...", "Please wait");

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin/course/delete/${id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Delete failed");


            showSuccess("Deleted", "Course deleted successfully");

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
        <div className="p-8 bg-[#F7F8FA] ">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Courses List</h2>
            </div>
            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-[#E2E1E5] h-screen overflow-hidden ">
                <table className="w-full text-sm">
                    {/* Header */}
                    <thead className="bg-white-50 text-gray-500 border-b border-gray-300 ">
                        <tr>
                            <th className="text-left py-3 px-6 text-2xl text-black font-semibold "> <div>Courses  </div> </th>
                            <th className="text-left py-5 px-2 w-50"><button onClick={() => navigate('/configuration/coach-pro/course/create')} className="bg-[#237FEA] hover:bg-blue-600  text-white px-4 py-2 rounded-lg flex items-center gap-2 text-base font-semibold">
                                <Plus size={16} />
                                Create a course
                            </button></th>
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody>
                        {courses.map((item) => (
                            <tr
                                key={item?.id}
                                className="border-b border-gray-300 last:border-none hover:bg-gray-50 transition"
                            >
                                {/* Title */}
                                <td className="py-4 px-6 text-[14px] text-gray-700">
                                    {item?.title}
                                </td>

                                {/* Status Badge */}


                                {/* Actions */}
                                <td className="py-4 px-6">
                                    <div className="flex gap-3">
                                        {item?.status === "publish" ? (
                                            <span className="bg-[#F1F9F3] text-[#34AE56] text-xs text-center px-3 py-2 rounded-md min-w-[80px] font-semibold ">
                                                Published
                                            </span>
                                        ) : (
                                            <span className="bg-[#FDF6E5] text-[#EDA600] text-xs text-center px-3 py-2 rounded-md min-w-[80px] font-semibold ">
                                                Draft
                                            </span>
                                        )}
                                        <button onClick={() => navigate(`/configuration/coach-pro/course/update?id=${item?.id}`)} className="text-gray-500 hover:text-gray-700">
                                            <img src="/images/icons/edit.png" className="w-6" alt="" />
                                        </button>

                                        <button onClick={() => handleDelete(item?.id)} className="text-gray-500 hover:text-red-500">
                                            <img src="/images/icons/deleteIcon.png" className="w-6" alt="" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {courses.length === 0 && (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="text-center py-8 text-gray-400 text-sm"
                                >
                                    No courses found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
