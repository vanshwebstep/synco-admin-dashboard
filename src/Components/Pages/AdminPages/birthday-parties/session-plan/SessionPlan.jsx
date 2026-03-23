import React, { useEffect, useState, useCallback } from "react";

import { Eye, User, Edit2, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../../contexts/Loader";

import { Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { usePermission } from "../../Common/permission";
import { showError, showConfirm, showLoading, showSuccess } from "../../../../../utils/swalHelper";
const BirthdaySessionPlan = () => {

    const [sessionGroup, setSessionGroup] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reorderMode, setReorderMode] = useState(false);
    const [weekList, setWeekList] = useState(sessionGroup || []);
    const [tempList, setTempList] = useState(sessionGroup || []);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("adminToken");
    const { checkPermission } = usePermission();
    const [loadingPinId, setLoadingPinId] = useState(null); // Track which group is being pinned

    const canDelete = checkPermission({ module: 'session-plan-birthdayParty', action: 'delete' });
    const canEdit = checkPermission({ module: 'session-plan-birthdayParty', action: 'update' });
    console.log('canDelete', canDelete)
    const navigate = useNavigate();

    const fetchSessionGroup = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/session-plan-birthdayParty/listing/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                // If response is not OK, throw error
                const errData = await response.json();
                throw new Error(errData.message || "Failed to fetch session groups");
            }

            const result = await response.json();
            console.log('result', result);
            setSessionGroup(result.data || []);
            setWeekList(result.data || []);
            setTempList(result.data || []);

        } catch (err) {
            console.error("Failed to fetch sessionGroup:", err);
            await showError(err.message || "Failed to fetch session groups");

        } finally {
            setLoading(false);
        }
    }, [token, API_BASE_URL]);
    const handleDelete = async (groupId, level) => {
        const myLevel = level?.toLowerCase();
        if (!groupId || !myLevel) return;

        const confirm = await showConfirm(
            "Delete Session Plan?",
            `
            <p class="text-gray-700 text-sm">
                You’re about to delete the <b>${level}</b> session plan.<br/>
                This action cannot be undone.
            </p>
        `,
            "Yes, delete it",
            true
        );

        if (!confirm.isConfirmed) return;

        try {
            showLoading("Deleting...", `<div class="text-gray-600 text-sm mt-2">Please wait while we remove the session plan.</div>`);

            const response = await fetch(
                `${API_BASE_URL}/api/admin/birthday-party/session-plan-birthdayParty/${groupId}/level/${myLevel}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to delete session plan");

            showSuccess("Deleted!", `${level} session plan has been successfully removed.`);

            fetchSessionGroup(); // refresh list
        } catch (error) {
            console.error("Delete error:", error);
            showError("Error", error.message || "Something went wrong while deleting.");
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!groupId) return;

        const confirm = await showConfirm(
            "Delete Session Plan Group?",
            `
            <p class="text-gray-700 text-sm">
                You’re about to delete this session plan group.<br/>
                This action cannot be undone.
            </p>
        `,
            "Yes, delete it",
            true
        );

        if (!confirm.isConfirmed) return;

        try {
            showLoading("Deleting...", `<div class="text-gray-600 text-sm mt-2">Please wait while we remove the session plan group.</div>`);

            const response = await fetch(
                `${API_BASE_URL}/api/admin/birthday-party/session-plan-birthdayParty/delete/${groupId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to delete session plan group");

            showSuccess("Deleted!", data.message || "Session plan group has been successfully removed.");

            fetchSessionGroup();
        } catch (error) {
            console.error("Delete error:", error);
            showError("Error", error.message || "Something went wrong while deleting.");
        }
    };

    const handlePinToggle = async (groupId, pinned = false, forceRePin = false) => {
        try {
            setLoadingPinId(groupId);

            // ✅ Logic: if already pinned, make unpin (0); if not pinned, make pin (1)
            // If forceRePin is true (from "Re-pin All"), always set pinned = 1
            const payload = { pinned: forceRePin ? 1 : pinned ? 0 : 1 };

            const response = await fetch(
                `${API_BASE_URL}/api/admin/one-to-one/session-plan-structure/${groupId}/repin`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Pin/Unpin success:", data);

            fetchSessionGroup();
            setSessionGroup(prev =>
                prev.map(g =>
                    g.id === groupId ? { ...g, pinned: payload.pinned === 1 } : g
                )
            );
        } catch (error) {
            console.error("Error pinning/unpinning:", error);
        } finally {
            setLoadingPinId(null);
        }
    };
    const handleReorder = async (newList) => {
        if (!token) return;

        const orderedIds = newList.map((w) => w.id);
        try {
            await fetch(`${API_BASE_URL}/api/admin/birthday-party/session-plan-birthdayParty/reorder`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderedIds }),
            });
            console.log("Reordered:", orderedIds);
        } catch (err) {
            console.error("Failed to reorder:", err);
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const updatedList = Array.from(tempList);
        const [movedItem] = updatedList.splice(result.source.index, 1);
        updatedList.splice(result.destination.index, 0, movedItem);
        setTempList(updatedList);
    };


    useEffect(() => {
        setTempList(weekList); // initialize tempList with server list
    }, [weekList]);

    useEffect(() => {
        fetchSessionGroup();
    }, [fetchSessionGroup]);

    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }
    console.log('sessionGroup', sessionGroup)
    return (
        <div className="">
            {/* Header Section */}
            <div className="flex justify-between py-5">
                <h2 className="text-[28px] font-semibold">
                    Session Plan Library
                </h2>

                {reorderMode ? (
                    <div className="flex gap-5 items-center">
                        <button
                            onClick={() => {
                                handleReorder(tempList); // save reordered list to backend
                                setWeekList(tempList);
                                setReorderMode(false);
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 font-semibold"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => {
                                setTempList(weekList); // reset order
                                setReorderMode(false);
                            }}
                            className="bg-gray-400 text-white px-4 py-2 rounded-xl hover:bg-gray-500 font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setReorderMode(true)}
                        className="bg-[#237FEA] flex items-center gap-2 cursor-pointer text-white px-4 py-[10px] rounded-xl hover:bg-blue-700 text-[16px] font-semibold"
                    >
                        Reorder Sessions
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="p-6 bg-white min-h-[600px] rounded-3xl">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="weekList" direction="horizontal">
                        {(provided) => (
                            <div
                                className="grid md:grid-cols-4 gap-6"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {tempList.map((group, index) => {
                                    return (
                                        <Draggable
                                            key={group.id}
                                            draggableId={group.id.toString()}
                                            index={index}
                                            isDragDisabled={!reorderMode}
                                        >
                                            {(provided) => (
                                                <div
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    ref={provided.innerRef}
                                                    className={`bg-[#FAFAFA] border border-[#E2E1E5] rounded-3xl h-auto transition-all ${reorderMode
                                                        ? "cursor-grab hover:shadow-lg"
                                                        : "hover:shadow-md"
                                                        }`}
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between p-3">
                                                        <h2 className="font-semibold text-[24px] max-w-[215px] overflow-hidden">
                                                            {group.groupName}
                                                        </h2>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/birthday-party/session-plan-preview?id=${group.id}`
                                                                    )
                                                                }
                                                                className="hover:scale-110 transition"
                                                            >
                                                                <Eye size={25} />
                                                            </button>
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteGroup(group.id, group.groupName)
                                                                    }
                                                                    className="hover:scale-110 transition"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Inner Levels */}
                                                    <div className="p-4 pt-0 flex flex-col gap-3">
                                                        {group.levels &&
                                                            Object.keys(group.levels).map((levelKey, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex justify-between items-center bg-white border border-[#E2E1E5] rounded-2xl p-2 hover:shadow-sm transition"
                                                                >
                                                                    <div>
                                                                        <p className="font-semibold text-[#282829] capitalize">
                                                                            {levelKey}
                                                                        </p>
                                                                        <p className="text-sm text-gray-500 pt-1">
                                                                            {group.levels[levelKey].ageRange || ""}
                                                                            <p className="text-[14px] text-gray-400">
                                                                                {{
                                                                                    Beginner: "4-5 years",
                                                                                    beginner: "4-5 years",
                                                                                    Intermediate: "6-7 years",
                                                                                    intermediate: "6-7 years",
                                                                                    Advanced: "8-9 years",
                                                                                    advanced: "8-9 years",
                                                                                    Pro: "10-12 years",
                                                                                    pro: "10-12 years",
                                                                                }[levelKey] || ""}
                                                                            </p>

                                                                        </p>

                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        {canEdit && (
                                                                            <button
                                                                                onClick={() =>
                                                                                    navigate(
                                                                                        `/birthday-party/session-plan-update?id=${group.id}&level=${encodeURIComponent(
                                                                                            levelKey
                                                                                        )}`
                                                                                    )
                                                                                }
                                                                            >
                                                                                <img
                                                                                    src="/images/icons/edit.png"
                                                                                    alt="Edit"
                                                                                    className="min-w-6 max-h-6 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                                                                />
                                                                            </button>
                                                                        )}
                                                                        {canDelete && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (Object.keys(group.levels || {}).length === 1) {
                                                                                        handleDeleteGroup(group.id);
                                                                                    } else {
                                                                                        handleDelete(group.id, levelKey);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src="/images/icons/deleteIcon.png"
                                                                                    alt="Delete"
                                                                                    className="w-6 h-6 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                                                                />
                                                                            </button>
                                                                        )}

                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}

                                {/* Add Group Card */}
                                <button
                                    onClick={() => navigate("/birthday-party/session-plan-create")}
                                    className="border border-dashed border-gray-300 rounded-3xl w-[180px] h-[100px] flex flex-col justify-center items-center text-black hover:bg-gray-50 transition"
                                >
                                    <Plus className="w-6 h-5 mb-2" />
                                    <span className="font-medium text-sm">Add Group</span>
                                </button>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );

};

export default BirthdaySessionPlan;
