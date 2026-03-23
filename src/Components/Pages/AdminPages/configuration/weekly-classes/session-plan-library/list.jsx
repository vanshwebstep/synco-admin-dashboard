import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Eye, Copy, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSessionPlan } from '../../../contexts/SessionPlanContext';
import { showError, showSuccess, showWarning, showConfirm, showLoading } from "../../../../../../utils/swalHelper";
import Loader from '../../../contexts/Loader';
import { usePermission } from '../../../Common/permission';
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
const SortableItem = ({ week, children, disabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: week.id, disabled });

    const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
  {typeof children === "function" ? children(listeners) : children}
    </div>
  );
};
const List = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");

  const navigate = useNavigate();
  const { fetchSessionGroup, sessionGroup, deleteSessionGroup, deleteSessionlevel, duplicateSession, updateDiscount, loading, setLoading } = useSessionPlan();
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
  const [saveLoading, setSaveLoading] = useState(null);
  const [editingWeek, setEditingWeek] = useState(null); // {weekId}
  const [editedWeekTitle, setEditedWeekTitle] = useState("");
  useEffect(() => {
    const getPackages = async () => {
      try {
        const response = await fetchSessionGroup();
        console.log("Fetched packages:", response);
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
            sortOrder: group.sortOrder,
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
useEffect(() => {
  const sortedList = [...weekList].sort((a, b) => a.sortOrder - b.sortOrder);
  setTempList(sortedList);
}, [weekList]);
  console.log('sessionGroup', sessionGroup)
  // without condition 
  //  useEffect(() => {
  //   if (sessionGroup?.length > 0) {
  //      console.log('sessionGroup', sessionGroup);

  //     const transformedWeeks = sessionGroup.map((group) => {
  //       const levels = typeof group.levels === 'string'
  //         ? JSON.parse(group.levels)
  //         : group.levels || {};

  //       const groups = Object.keys(levels)
  //         .filter((levelKey) => {
  //           const levelData = levels[levelKey];
  //           // Check if *every* object inside the array is fully empty
  //           return levelData.some(item => {
  //             return item.player?.trim() ||
  //               item.skillOfTheDay?.trim() ||
  //               item.description?.trim() ||
  //               (item.sessionExerciseId && item.sessionExerciseId.length > 0) ||
  //               (item.sessionExercises && item.sessionExercises.length > 0 && Object.keys(item.sessionExercises[0]).length > 0);
  //           });
  //         })
  //         .map((levelKey, index) => {
  //           const capitalizedLevel = levelKey.charAt(0).toUpperCase() + levelKey.slice(1);
  //           return {
  //             id: index + 1,
  //             name: capitalizedLevel,
  //             age: ageMapping[capitalizedLevel] || "N/A",
  //           };
  //         });

  //        console.log('groups', groups);

  //       return {
  //         id: group.id,
  //         title: group.groupName,
  //         groups,
  //       };
  //     });

  //     setWeeks(transformedWeeks);
  //     setWeekList(transformedWeeks);
  //   }
  // }, [sessionGroup]);


  const handleAddNew = () => {
    // Logic to reorder sessions
    console.log("Reorder Sessions clicked");
  };

  const handleEditGroup = (weekId, groupId) => {
    navigate(`/configuration/weekly-classes/session-plan-create?id=${weekId}&level=${groupId}`);
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


  const handleDeleteLevel = async (id, level) => {
    const result = await showConfirm(
      "Are you sure?",
      "This Level will be permanently deleted.",
      "Yes, delete it!",
      true
    );

    if (result.isConfirmed) {
      deleteSessionlevel(id, level);
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
      setSaveLoading(weekId)

      try {
        const formData = new FormData();
        if (editedWeekTitle) {
          formData.append("groupName", editedWeekTitle); // 👈 use "title", not "groupName"
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/session-plan-group/${weekId}`,
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



        await fetchSessionGroup(false); // ✅ refresh list after update
        showSuccess("Success", result.message || "Week title updated successfully.");
      } catch (err) {
        console.error("Failed to update week title:", err);
        showError("Error", err.message || "Something went wrong.");
      } finally {
        setSaveLoading(null);
        setEditingWeek(null);
      }
    },
    [editedWeekTitle, token, navigate, fetchSessionGroup]
  );



  console.log('setTempList', tempList)


  const handlecancelledit = () => {
    setEditingWeek(null);
  };

  const handleAddGroup = (weekId) => {
    // Add group logic here
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
      await fetch(`${API_BASE_URL}/api/admin/session-plan-group/reorder`, {
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

  const handleDragEnd = (event) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = tempList.findIndex(i => i.id === active.id);
  const newIndex = tempList.findIndex(i => i.id === over.id);

  const newList = arrayMove(tempList, oldIndex, newIndex);

  // ✅ update sortOrder after reorder
  const updatedList = newList.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));

  setTempList(updatedList);
};
  const { checkPermission } = usePermission();

  const canCreate = checkPermission({ module: 'session-plan-group', action: 'create' });
  const canEdit = checkPermission({ module: 'session-plan-group', action: 'update' });
  const canDelete = checkPermission({ module: 'session-plan-group', action: 'delete' });

  console.log(weekList)
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
      <div className="p-6 bg-white min-h-[600px] rounded-3xl">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={tempList.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid md:grid-cols-4 gap-6">
              {tempList.map((week, index) => (
                <SortableItem
                  key={week.id}
                  week={week}
                  disabled={!reorderMode}
                >
                  {(listeners) => (
                    <div
                      className={`bg-[#FAFAFA] rounded-2xl border border-gray-300 p-4 w-full`}
                    >
                      <div className="flex items-center justify-between p-2 w-full gap-2 cursor-grab" {...listeners}>
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
                                {saveLoading === week.id ? "Saving..." : "Save"}
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
                                    className="min-w-6 h-6 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/configuration/weekly-classes/session-plan-preview?id=${week.id}`)
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

                </SortableItem>
              ))}

              {!reorderMode && canCreate && (
                <div
                  onClick={() => navigate('/configuration/weekly-classes/session-plan-create')}
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


              {/* {provided.placeholder} */}
            </div>

          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default List;
