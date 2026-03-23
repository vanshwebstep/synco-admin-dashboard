import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Eye, Copy, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess, showWarning, showConfirm, showLoading } from "../../../../../../utils/swalHelper";
import Loader from '../../../contexts/Loader';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { usePermission } from '../../../Common/permission';
import { useHolidaySessionPlan } from '../../../contexts/HolidaySessionPlanContext';

const HolidaySessionPlan = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");

  const navigate = useNavigate();
  const { fetchSessionGroup, sessionGroup, deleteSessionGroup, deleteSessionlevel, duplicateSession, updateDiscount, loading, setLoading } = useHolidaySessionPlan();
  const [weeks, setWeeks] = useState([]);
  const ageMapping = {
    Beginner: "4-6 Years",
    Intermediate: "6-7 Years",
    Advanced: "8-9 Years",
    Pro: "10-12 Years",
  };
  const [weekList, setWeekList] = useState([]);
  const [tempList, setTempList] = useState([]); // holds the working reorder
  const [reorderMode, setReorderMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null); // {weekId}
  const [editedWeekTitle, setEditedWeekTitle] = useState("");
  useEffect(() => {
    const getPackages = async () => {
      try {
        const response = await fetchSessionGroup();
        // do something with response (set state, display, etc.)
      } catch (error) {
        console.error("Error fetching packages:", error);
      }
    };
    getPackages();
  }, [fetchSessionGroup]);
  // with empty conditon 

  useEffect(() => {
    setTempList(weekList); // initialize tempList with server list
  }, [weekList]);
  useEffect(() => {
    if (sessionGroup?.length > 0) {
      const transformedWeeks = sessionGroup
        .map((group) => {
          const levels = typeof group.levels === 'string'
            ? JSON.parse(group.levels)
            : group.levels || {};

          const validLevels = Object.keys(levels).filter((levelKey) => {
            const levelData = levels[levelKey];
            return levelData?.some(item =>
              item.player?.trim() ||
              item.skillOfTheDay?.trim() ||
              item.description?.trim() ||
              (item.sessionExerciseId?.length > 0) ||
              (item.sessionExercises?.length > 0 && Object.keys(item.sessionExercises[0] || {}).length > 0)
            );
          });

          if (validLevels.length === 0) return null;

          const groups = validLevels.map((levelKey, index) => {
            const capitalizedLevel = levelKey.charAt(0).toUpperCase() + levelKey.slice(1);

            // Get first non-empty player
            const levelPlayer = levels[levelKey]
              .map(item => item.player?.trim())
              .find(player => !!player) || ""; // Default to empty string

            return {
              id: index + 1,
              name: capitalizedLevel,
              age: ageMapping[capitalizedLevel] || "N/A",
              player: levelPlayer,
            };
          });

          return {
            id: group.id,
            title: group.groupName,
            groups,
          };
        })
        .filter(Boolean); // remove nulls

      setWeeks(transformedWeeks);
      setWeekList(transformedWeeks);
    }
    else {
      setWeekList([])
      setTempList([])
    }
  }, [sessionGroup]);


  const handleEditGroup = (weekId, groupId) => {
    navigate(`/configuration/holiday-camp/session-plan/create?id=${weekId}&level=${groupId}`);
  };

  const handleDeleteGroup = async (weekId) => {
    const result = await showConfirm(
      "Are you sure?",
      "This group will be permanently deleted.",
      "Yes, delete it!",
      true
    );

    if (result.isConfirmed) {
      deleteSessionGroup(weekId);
      showSuccess('Deleted!', 'The group has been deleted.');
    }
  };

  const handleDuplicateGroup = async (weekId) => {
    const result = await showConfirm(
      "Duplicate Group?",
      "This group will be duplicated.",
      "Yes, duplicate it!"
    );

    if (result.isConfirmed) {
      try {
        showLoading("Duplicating...");
        await duplicateSession(weekId); // Call your duplication function
        showSuccess('Duplicated!', 'The group has been duplicated.');
      } catch (err) {
        console.error(err);
        showError('Error!', 'Failed to duplicate the group.');
      } finally {
        setLoading(false);
      }
    }
  };


  const handleDeleteLevel =async (id, level) => {
    const result = await showConfirm(
      "Are you sure?",
      "This Level will be permanently deleted.",
      "Yes, delete it!",
      true
    );

    if (result.isConfirmed) {
      deleteSessionlevel(id, level);
      showSuccess('Deleted!', 'The group has been deleted.');
    }
  };
  const handleEditGroupNameOnly = (weekId, currentTitle) => {
    setEditingWeek(weekId);
    setEditedWeekTitle(currentTitle); // prefill existing title
  };
  const handleSaveWeekTitle = useCallback(
    async (weekId) => {
      // ✅ Update only the title in local state
      setTempList((prev) =>
        prev.map((week) =>
          week.id === weekId ? { ...week, title: editedWeekTitle } : week
        )
      );

      if (!token) return;

      setLoading(true);

      try {
        const formData = new FormData();
        if (editedWeekTitle) {
          formData.append("groupName", editedWeekTitle); // 👈 use "title", not "groupName"
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/holiday/session-plan-group/update/${weekId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to update");

        showSuccess("Success", result.message || "Week title updated successfully.");

        await fetchSessionGroup(); // ✅ refresh list after update
      } catch (err) {
        console.error("Failed to update week title:", err);
        showError("Error", err.message || "Something went wrong.");
      } finally {
        setLoading(false);
        setEditingWeek(null);
      }
    },
    [editedWeekTitle, token, navigate, fetchSessionGroup]
  );

  const handlecancelledit = () => {
    setEditingWeek(null);
  };


  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }
  const handleReorder = async (newList) => {
    if (!token) return;

    const orderedIds = newList.map((w) => w.id);
    try {
      await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.error("Failed to reorder:", err);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newList = Array.from(tempList);
    const [movedItem] = newList.splice(result.source.index, 1);
    newList.splice(result.destination.index, 0, movedItem);

    setTempList(newList); // just update local reorder, not server
  };
  const { checkPermission } = usePermission();

  const canCreate = checkPermission({ module: 'session-plan-group', action: 'create' });
  const canEdit = checkPermission({ module: 'session-plan-group', action: 'update' });
  const canDelete = checkPermission({ module: 'session-plan-group', action: 'delete' });

  return (
    <div className="pt-1 bg-gray-50 min-h-screen">

      <div className="md:flex pe-4 justify-between items-center mb-4 w-full">
        <h2 className="text-[28px] font-semibold">Session Plan Library</h2>

        {reorderMode ? (
          <>
            <div className="flex gap-5 items-center">
              <button
                onClick={() => {
                  handleReorder(tempList); // save reordered list
                  setWeekList(tempList);   // commit changes
                  setReorderMode(false);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 font-semibold"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setTempList(weekList);  // reset back to original order
                  setReorderMode(false);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-xl hover:bg-gray-500 font-semibold"
              >
                Cancel
              </button>
            </div>
          </>
        ) : weekList.length > 0 ? (
          <button
            onClick={() => setReorderMode(true)}
            className="bg-[#237FEA] flex items-center gap-2 cursor-pointer text-white px-4 py-[10px] rounded-xl hover:bg-blue-700 text-[16px] font-semibold"
          >
            Reorder Sessions
          </button>
        ) :
          (
            <p className="text-red-500 text-[16px] font-medium">
              You don't have any  plans
            </p>
          )}

      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="weekList" direction="horizontal">
          {(provided) => (
            <div
              className="grid lg:grid-cols-4 bg-white justify-center md:justify-start  flex-wrap rounded-3xl p-6 shadow gap-4 relative"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {tempList.map((week, index) => (
                <Draggable
                  key={week.id}
                  draggableId={String(week.id)}
                  index={index}
                  isDragDisabled={!reorderMode}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`bg-[#FAFAFA] rounded-2xl border border-gray-300  p-4 w-full transform ${snapshot.isDragging ? 'scale-105 shadow-xl transition-transform duration-200' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between p-2 w-full gap-2">
                        {editingWeek === week.id ? (
                          <>
                            <input
                              type="text"
                              value={editedWeekTitle}
                              onChange={(e) => setEditedWeekTitle(e.target.value)}
                              className="border border-gray-300 w-inherit rounded px-2 py-1 text-lg font-semibold" style={{ width: "inherit" }}
                            />

                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => handleSaveWeekTitle(week.id)}
                                className="text-green-600 font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={handlecancelledit}
                                className="text-red-500 font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-[24px] max-w-[215px] overflow-hidden">{week.title}</h3>
                            {!reorderMode && (
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={() => handleEditGroupNameOnly(week.id, week.title)}
                                  className="text-gray-500 hover:text-blue-600"
                                >
                                  <img
                                    src="/images/icons/edit2.png"
                                    alt="Edit"
                                    className="min-w-6 min-h-6 max-w-6 max-h-6 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/configuration/holiday-camp/session-plan/preview?id=${week.id}`)
                                  }
                                  className="text-gray-800 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                >
                                  <Eye size={24} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDuplicateGroup(week.id)
                                  }
                                  className="text-gray-800 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                >
                                  <Copy size={24} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>


                      {week.groups.map((group) => (
                        <div
                          key={group.id}
                          className="bg-white border border-gray-300 p-3 mb-2 rounded-xl flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium text-[16px]">{group.name}</p>
                            <p className="text-[14px] text-gray-400">
                              {{
                                Beginner: "4-5 years",
                                Intermediate: "6-7 years",
                                Advanced: "8-9 years",
                                Pro: "10-12 years",
                              }[group.name] || ""}
                            </p>                          </div>

                          <div className="flex gap-2">
                            {canEdit &&
                              <button
                                onClick={() => handleEditGroup(week.id, group.name)}
                                className="text-gray-500 hover:text-blue-600"
                              >
                                <img
                                  src="/images/icons/edit.png"
                                  alt="Edit"
                                  className="w-6 h-6 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                />
                              </button>
                            }
                            {canDelete &&
                              <button
                                onClick={() => {
                                  if (week.groups?.length === 1) {
                                    handleDeleteGroup(week.id);
                                  } else {
                                    handleDeleteLevel(week.id, group.name);
                                  }
                                }}
                                className="text-gray-500 hover:text-red-500"
                              >
                                <img
                                  src="/images/icons/deleteIcon.png"
                                  alt="Delete"
                                  className="w-6 h-6  transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                />
                              </button>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Draggable>
              ))}

              {!reorderMode && canCreate && (
                <div
                  onClick={() => navigate('/configuration/holiday-camp/session-plan/create')}
                  className="border border-dashed border-gray-300 rounded-2xl min-w-[168px] max-w-xs items-center justify-center max-h-[100px] cursor-pointer text-gray-500 hover:text-black p-6 text-center text-[14px] font-semibold"
                >
                  <img
                    src="/members/addblack.png"
                    alt=""
                    className="w-6 h-6 m-auto mb-2"
                  />
                  Add Group
                </div>
              )}


              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default HolidaySessionPlan;
