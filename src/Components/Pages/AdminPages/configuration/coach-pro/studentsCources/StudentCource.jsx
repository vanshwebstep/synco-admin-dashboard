import { Plus } from "lucide-react";
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../../../contexts/Loader";
import { showError, showSuccess, showConfirm, showLoading } from "../../../../../../utils/swalHelper";

import {
  DragDropContext,
  Droppable,
  Draggable,
} from "react-beautiful-dnd";

const tabs = ["Beginners", "Intermediate", "Advance"];

export default function StudentCourse() {
  const [activeTab, setActiveTab] = useState("Beginners");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  /* ---------------- Drag End ---------------- */
  const onDragEnd = async (result) => {

    if (!result.destination) {
      return;
    }

    const items = Array.from(data[activeTab] || []);

    const [movedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, movedItem);


    setData((prev) => ({
      ...prev,
      [activeTab]: items,
    }));

    const token = localStorage.getItem("adminToken");
    if (!token) {
      return;
    }

    const orderedIds = items.map((i) => i.id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/student-course/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderedIds }),
        }
      );

      const response = await res.json();
      fetchData();
    } catch (err) {
      console.error("🔥 Failed to reorder:", err);
    }
  };



  /* ---------------- Fetch Data ---------------- */
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/student-course/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      setData({
        Beginners: json?.data?.Beginner ?? [],
        Intermediate: json?.data?.Intermediate ?? [],
        Advance: json?.data?.Advanced ?? [],
      });
    } catch (err) {
      showError("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const handleDelete = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      showError("Error", "Admin token missing");
      return;
    }

    // 🔴 Confirmation
    const result = await showConfirm(
      "Delete course?",
      "This action cannot be undone",
      "Yes, delete"
    );

    if (!result.isConfirmed) return;

    // 🔵 Loading
    showLoading("Deleting...");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/student-course/delete//${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete failed");

      // ✅ Success
      showSuccess("Deleted", "course deleted successfully");

      fetchData();
    } catch (err) {
      // ❌ Error
      // ❌ Error
      showError("Delete failed", err.message || "Something went wrong");
    }
  };


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Loader />;

  /* ---------------- JSX ---------------- */
  return (
    <>
      <div className="flex my-5 justify-between">
        <h2 className="text-[24px] font-semibold">
          Skills Tracker Training Courses
        </h2>

        <button
          className="flex gap-2 items-center bg-[#237FEA] text-white rounded-2xl p-3 py-2"
          onClick={() =>
            navigate(`/configuration/coach-pro/student/create`)
          }
        >
          <Plus /> Add course
        </button>
      </div>

      <div className="py-6 bg-white min-h-screen rounded-4xl">
        <h2 className="text-center font-semibold text-[22px] mb-4">
          All Courses
        </h2>

        {/* Tabs */}
        <div className="flex justify-center mb-6 space-x-3 w-fit m-auto bg-[#F9F9FB] p-3 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-[18px] transition ${activeTab === tab
                ? "bg-[#237FEA] text-white"
                : "text-[#282829] hover:bg-gray-200"
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* DND */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId={`courses-${activeTab}`}
            direction="horizontal"
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid xl:grid-cols-4 md:grid-cols-3 gap-4"
              >
                {(data?.[activeTab] ?? []).length ? (
                  data[activeTab].map((course, index) => (
                    <Draggable
                      key={course.id}
                      draggableId={String(course.id)}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white rounded-2xl p-3"
                        >
                          <img
                            draggable={false}
                            src={
                              course?.coverImage ??
                              "/images/placeholder.png"
                            }
                            alt={course?.courseName}
                            className="rounded-2xl border border-gray-200 w-full h-36 object-cover mb-3"
                          />

                          <div className="flex justify-between items-start">
                            <h4 className="text-[20px] font-semibold">
                              {course?.courseName ?? "Untitled Course"}
                            </h4>

                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/configuration/coach-pro/student/update?id=${course.id}`
                                  );
                                }}
                              >
                                <img
                                  src="/images/icons/edit.png"
                                  className="w-6"
                                  draggable={false}
                                />
                              </button>

                              <button onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(course.id);
                              }}>
                                <img
                                  src="/images/icons/deleteIcon.png"
                                  className="w-6"
                                  draggable={false}
                                />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 my-2">
                            <div className="flex items-center space-x-1">
                              <img src="/reportsIcons/clock-01.png" className="w-5" />
                              <span className="text-[14px] font-semibold text-[#717073]">
                                {course?.duration ?? 0} {course?.durationType ?? ""}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <img src="/reportsIcons/Vector.png" className="w-5" />
                              <span className="text-[14px] font-semibold text-[#717073]">
                                {course?.videos?.length} Videos
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <img src="/reportsIcons/beginner.png" className="w-4" />
                              <span className="text-[14px] font-semibold text-[#717073]">
                                {course?.level ?? "Beginner"}
                              </span>
                            </div>
                          </div>

                          <div className="text-[14px] font-semibold text-[#34353B] mt-3 mb-1.5">
                            {course?.videos?.length > 0 ? "In Progress" : "Not Started"}
                          </div>

                          <div className="w-full h-[9px] bg-[#ECEEF1] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#43BE4F]"
                              style={{ width: `${course?.videos?.length ? 60 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500">
                    No courses available
                  </p>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </>
  );
}
