import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from '../contexts/Loader';

const MainTable = () => {
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // 👈 change this to 20, 50 etc. if needed

    const fetchMembers = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/account-information`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setMembers(result.accountInformation || []);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const toggleCheckbox = (userId) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };
    const isAllSelected = members.length > 0 && selectedUserIds.length === members.length;

    const toggleSelectAll = () => {
        if (isAllSelected) setSelectedUserIds([]);
        else setSelectedUserIds(members.map((user) => user.id));
    };

    const statusColors = {
        active: "bg-green-100 text-green-800",
        "In Progress": "bg-yellow-100 text-yellow-800",
        cancelled: "bg-red-100 text-red-800",
        "waiting list": "bg-gray-200 text-gray-800",
    };

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

  const safe = (val) => {
  if (
    val === null ||
    val === undefined ||
    val === '' ||
    val === 'null' ||
    val === 'undefined'
  ) {
    return 'N/A';
  }

  // Convert to string, replace underscores with spaces, and trim
  const formatted = String(val).replace(/_/g, ' ').trim();

  return formatted;
};


    if (loading) return <Loader />;

    // Pagination logic
    const totalPages = Math.ceil(members.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMembers = members.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <>
            <div className="transition-all duration-300 w-full">
                {members.length > 0 ? (
                    <>
                        <div className="overflow-auto rounded-2xl bg-white shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                                    <tr className="font-semibold text-[#717073]">
                                        <th className="p-4">
                                            <div className="flex gap-2 items-center">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="w-5 h-5 flex items-center justify-center rounded-md border-2 border-gray-500"
                                                >
                                                    {isAllSelected && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                                                </button>
                                                Name
                                            </div>
                                        </th>
                                        <th className="p-4">Age</th>
                                        <th className="p-4">Venue</th>
                                        <th className="p-4">Date of Booking</th>
                                        <th className="p-4">Who Booked</th>
                                        <th className="p-4">Membership Plan</th>
                                        <th className="p-4">Life Cycle of Membership</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {currentMembers.map((user, idx) => {
                                        const isChecked = selectedUserIds.includes(user.id);
                                        return (
                                            <tr key={idx} className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50">
                                                <td className="p-4 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => toggleCheckbox(user.id)}
                                                            className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? 'border-gray-500' : 'border-gray-300'}`}
                                                        >
                                                            {isChecked && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                                                        </button>

                                                        <img
                                                            src={safe(user.profile) !== 'N/A' ? user.profile : '/members/dummyuser.png'}
                                                            alt={safe(user.firstName)}
                                                            onClick={() => navigate(`/weekly-classes/account-information?id=${user.id}`)}
                                                            className="w-10 h-10 rounded-full object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = '/members/dummyuser.png';
                                                            }}
                                                        />

                                                        <span onClick={() => navigate(`/weekly-classes/account-information?id=${user.id}`)}>
                                                            {`${safe(user?.students?.[0]?.studentFirstName)} ${safe(user?.students?.[0]?.studentLastName)}`}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-4 whitespace-nowrap" onClick={() => navigate(`/weekly-classes/account-information?id=${user.id}`)}>
                                                    {safe(user?.students?.[0]?.age)}
                                                </td>
                                                <td className="p-4 whitespace-nowrap" onClick={() => navigate(`/weekly-classes/account-information?id=${user.id}`)}>
                                                    {safe(user?.venue?.name)}
                                                </td>
                                                <td className="p-4 whitespace-nowrap" onClick={() => navigate(`/weekly-classes/account-information?id=${user.id}`)}>
                                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4 whitespace-nowrap" onClick={() => navigate(`/weekly-classes/account-information?id=${user.id}`)}>
                                                    {`${safe(user?.bookedByAdmin?.firstName)} ${safe(user?.bookedByAdmin?.lastName)}`}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">{safe(user?.paymentPlan?.title)}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    {user?.paymentPlan?.duration && user?.paymentPlan?.interval
                                                        ? `${user.paymentPlan?.duration} ${user.paymentPlan?.interval}${user.paymentPlan?.duration > 1 ? 's' : ''}`
                                                        : 'N/A'}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-xl capitalize font-semibold ${statusColors[user.status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {safe(user.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-4 px-2">
                            <p className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, members.length)} of {members.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-md border ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300'}`}
                                >
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <span className="text-sm font-medium text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-md border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300'}`}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-center p-4 rounded-md bg-white">No Data Found</p>
                )}
            </div>
        </>
    );
};

export default MainTable;
