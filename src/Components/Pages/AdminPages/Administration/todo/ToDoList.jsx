import { Plus, MoreVertical, Filter, X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { ChevronDown, Send } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Select from "react-select";
import { useToDoListTemplate } from "../../contexts/ToDoListContext";
import { useNotification } from "../../contexts/NotificationContext";

const columns = [
    { id: "to_do", label: "To Do (My Tasks)", color: "bg-[#237FEA]", bgColor: "bg-[#237FEA]" },
    { id: "in_progress", label: "In Progress", color: "bg-[#EDA600]", bgColor: "bg-[#EDA600]" },
    { id: "completed", label: "Completed", color: "bg-[#1CB72B]", bgColor: "bg-[#1CB72B]" },
];



export default function TodoList() {

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const { fetchToDoList, toDoList } = useToDoListTemplate();
    const getServiceTypePath = (serviceType) => {
        if (!serviceType) return "";
        const type = serviceType.toLowerCase();
        if (type === "weekly class membership") return "membership";
        if (type === "weekly class trial") return "trial";
        if (type === "holiday camp") return "holiday";
        if (type === "birthday party") return "birthdayparty";
        if (type === "one to one") return "onetoone";
        return type;
    };
    const getBookingId = (item) => {
        const type = item.serviceType?.toLowerCase();
        if (type === "weekly class membership") return item.bookingId || null;
        if (type === "weekly class trial") return item.bookingId || null;
        if (type === "holiday camp") return item.holidayBookingId || null;
        if (type === "birthday party") return item.birthdayPartyBookingId || null;
        if (type === "one to one") return item.oneToOneBookingId || null;
        return item.bookingId || null;
    };
    const formatTasks = (data) => {
        return Object.values(data || {}).flat().map(item => ({
            ...item,
            type: item.feedbackType ? 'feedback' : (item.type || 'task'),
            title: item.category || item.title || "Feedback",
            description: item.notes || item.description || "",
            assignedAdmins: item.assignedAgents || item.assignedAdmins || [],
            attachments: item.attachments || [],
            status: item.status === "not_resolved" ? "to_do" : (item.status === "resolved" ? "completed" : (item.status === "to-do" ? "to_do" : (item.status || "to_do"))),
            parentAccount: item.creator ? { id: item.creator.id, name: `${item.creator.firstName || ''} ${item.creator.lastName || ''}`.trim() } : null,
            creator: item.createdByDetails || item.creator || null,
            priority: item.priority || "high",
            createdAt: item.created_at || item.createdAt,
            updatedAt: item.updated_at || item.updatedAt,
            bookingId: getBookingId(item) || null,        // ✅ add this
            serviceType: getServiceTypePath(item.serviceType) || null,    // ✅ add this
        }));
    };

    useEffect(() => {
        setTaskData(formatTasks(toDoList));
    }, [toDoList]);

    const tasks = formatTasks(toDoList);
    const [selectedAdmins, setSelectedAdmins] = useState([]);
    const [selectedPriority, setSelectedPriority] = useState(['high']);

    const [openNewTask, setOpenNewTask] = useState(false);
    const [openViewTask, setOpenViewTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [open, setOpen] = useState('comment');
    const [loading, setLoading] = useState(null);
    const [taskData, setTaskData] = useState(tasks);
    const [Members, setMembers] = useState([]);
    const [activeTab, setActiveTab] = useState("tasks");
    const handleOpenNewTask = () => setOpenNewTask(true);
    const handleCloseNewTask = () => setOpenNewTask(false);
    const [showFilter, setShowFilter] = useState(false);
    // Collect all unique toDoList

    console.log('toDoList', toDoList)
    const allAdmins = tasks
        .flatMap(task => {
            // Handle assignedAdmins (sometimes string)
            if (typeof task.assignedAdmins === "string") {
                try {
                    return JSON.parse(task.assignedAdmins);
                } catch (e) {
                    return []; // fallback for invalid JSON
                }
            }
            return task.assignedAdmins || [];
        })
        .reduce((acc, admin) => {
            if (!acc.some(a => a.id === admin.id)) {
                acc.push(admin);
            }
            return acc;
        }, []);


    useEffect(() => {
        fetchToDoList(activeTab);
    }, [fetchToDoList, activeTab]);
    const [admins, setAdmins] = useState(allAdmins);

    useEffect(() => {
        setAdmins(allAdmins);
    }, [toDoList]);


    console.log("ALL ADMINS:", allAdmins);
    const handleOpenFilter = () => {
        setShowFilter(true);
    };
    const handleApplyFilter = ({ selectedAdmins, selectedPriority }) => {

        const filtered = tasks.filter(t => {
            const adminMatch =
                selectedAdmins.length === 0 ||
                t.assignedAdmins?.some(ad => selectedAdmins.includes(ad.id));

            const priorityMatch =
                selectedPriority.length === 0 ||
                selectedPriority.includes(t.priority);

            return adminMatch && priorityMatch;
        });

        setTaskData(filtered);
    };



    const updateTaskStatus = async (id, status) => {
        const token = localStorage.getItem("adminToken");

        let mappedStatus = status;

        if (status === 'completed') {
            mappedStatus = 'resolved';
        } else if (status === 'to_do') {
            mappedStatus = 'to-do';
        } else if (status === 'in_progress') {
            mappedStatus = 'in_progress';
        }

        const endpoint = activeTab === 'feedback'
            ? `${API_BASE_URL}/api/admin/to-do-list/parent/update-status`
            : `${API_BASE_URL}/api/admin/to-do-list/update-status`;

        try {
            await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id, status: mappedStatus }),
            });

            await fetchToDoList(activeTab);
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    console.log('taskData', taskData);


    const resolvedStatus = taskData.filter(task => task.status === 'completed');

    console.log('resolvedStatus', resolvedStatus)
    const updateSortOrder = async (sortOrder) => {
        const token = localStorage.getItem("adminToken");

        const endpoint = activeTab === 'feedback'
            ? `${API_BASE_URL}/api/admin/to-do-list/parent/update-sort-order`
            : `${API_BASE_URL}/api/admin/to-do-list/update-sort-order`;

        try {
            await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ sortOrder }),
            });
            await fetchToDoList(activeTab);
        } catch (err) {
            console.error("Failed to update sort order:", err);
        }
    };
    const mapTaskForModal = (task) => {
        if (!task) return null;

        console.log('task', task)

        return {
            title: task.title,
            description: task.description,
            attachments: task.attachments || [],
            comment: task.comment || task.notes || [],
            assigned: (task.assignedAdmins || []).map(a => ({
                id: a.id,
                avatar: a.profile || "/members/dummyuser.png",
                name: a.name || (a.firstName + " " + (a.lastName || ""))
            })),
            creator: {
                id: task.creator?.id,
                name: task.creator?.name || (task.creator?.firstName + " " + (task.creator?.lastName || "")),
                profile: task.creator?.profile
            },

            assignedAdmins: {
                name: task.creator?.name || (task.creator?.firstName + " " + (task.creator?.lastName || "")),
                avatar: task.creator?.profile || "/members/dummyuser.png"
            },

            status: task.status,
            priority: task.priority,

            createdAt: task.createdAt,
            updatedAt: task.updatedAt
        };
    };
    const handleOpenViewTask = (rawTask) => {
        console.log("Raw task clicked:", rawTask);
        const formattedTask = mapTaskForModal(rawTask);
        setSelectedTask(formattedTask);
        setOpenViewTask(true);
    };
    const handleCloseViewTask = () => setOpenViewTask(false);

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { draggableId, destination, source } = result;
        const taskId = parseInt(draggableId);

        let updatedTaskData = [...taskData];
        const taskIndex = updatedTaskData.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const taskToMove = updatedTaskData[taskIndex];
        const oldStatus = taskToMove.status;
        const newStatus = destination.droppableId;

        // Detect if column changed → STATUS UPDATE
        if (oldStatus !== newStatus) {
            taskToMove.status = newStatus;

            // 🔥 CALL STATUS API
            updateTaskStatus(taskId, newStatus);
        }

        // Get all tasks in the destination column matching the current tab
        const isFeedback = taskToMove.type === 'feedback' || taskToMove.category === 'Parent Feedback' || taskToMove.isFeedback;
        const columnTasks = updatedTaskData.filter(t => {
            const tIsFeedback = t.type === 'feedback' || t.category === 'Parent Feedback' || t.isFeedback;
            return t.status === newStatus && (activeTab === "feedback" ? tIsFeedback : !tIsFeedback);
        });

        // Reorder list within the specific column
        const columnTasksWithoutMoved = columnTasks.filter(t => t.id !== taskId);
        columnTasksWithoutMoved.splice(destination.index, 0, taskToMove);

        // Isolate tasks not belonging to the current column/tab
        const otherTasks = updatedTaskData.filter(t => {
            const tIsFeedback = t.type === 'feedback' || t.category === 'Parent Feedback' || t.isFeedback;
            return !(t.status === newStatus && (activeTab === "feedback" ? tIsFeedback : !tIsFeedback));
        });

        // Re-assemble global task data
        const finalData = [...otherTasks, ...columnTasksWithoutMoved];
        setTaskData(finalData);

        // 🔥 CALL SORT ORDER API — send IDs in new order
        const sortOrder = columnTasksWithoutMoved.map(t => t.id);
        if (sortOrder.length > 0) {
            await updateSortOrder(sortOrder);
        }
    };

    const fetchMembers = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setMembers(result);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    console.log("selectedTask:", selectedTask);

    useEffect(() => {
        fetchMembers();
    }, [])
    const handleResetFilter = () => {
        setSelectedAdmins([]);
        setSelectedPriority([]);
        setTaskData(tasks);
    };



    return (
        <div className="p-6 min-h-[100vh] w-full">


            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold">To Do List</h1>
                <div className="relative">
                    <button
                        onClick={handleOpenFilter}
                        className="flex items-center gap-2 px-4 py-2 bg-[#237FEA] text-white rounded-lg text-sm"
                    >
                        <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                        Filter
                    </button>

                    {showFilter && (
                        <FilterModal
                            admins={allAdmins}
                            onApply={handleApplyFilter}
                            onClose={() => setShowFilter(false)}
                            onReset={handleResetFilter}
                            selectedAdmins={selectedAdmins}       // ✅ pass selections
                            selectedPriority={selectedPriority}
                            setSelectedAdmins={setSelectedAdmins} // ✅ allow modal to update parent
                            setSelectedPriority={setSelectedPriority}   // ✅ PASS RESET

                        />
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-6 border-b border-[#E2E1E5]">
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === "tasks" ? "border-b-2 border-[#237FEA] text-[#237FEA]" : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    To Do Tasks
                </button>
                <button
                    onClick={() => setActiveTab("feedback")}
                    className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === "feedback" ? "border-b-2 border-[#237FEA] text-[#237FEA]" : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Parent Feedback
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {columns.map((col) => {
                        const filteredTasks = taskData.filter((t) => {
                            const isFeedback = t.type === 'feedback' || t.category === 'Parent Feedback' || t.isFeedback;
                            return t.status === col.id && (activeTab === "feedback" ? isFeedback : !isFeedback);
                        });
                        return (
                            <TaskColumn
                                key={col.id}
                                column={col}
                                tasks={filteredTasks}
                                onAddTask={handleOpenNewTask}
                                onTaskClick={handleOpenViewTask}
                                activeTab={activeTab}
                            />
                        )
                    })}
                </div>
            </DragDropContext>



            {openNewTask && <CreateTaskModal members={Members} onClose={handleCloseNewTask} />}
            {openViewTask && (
                <ViewTaskModal task={selectedTask} open={open} setOpen={setOpen} onClose={handleCloseViewTask} activeTab={activeTab} />
            )}
        </div>
    );
}
function FilterModal({
    admins,
    onApply,
    onClose,
    onReset,
    selectedAdmins,
    selectedPriority,
    setSelectedAdmins,
    setSelectedPriority
}) {
    const priorities = ["high", "medium", "low"];


    const toggleAdmin = (id) => {
        setSelectedAdmins(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const togglePriority = (p) => {
        setSelectedPriority(prev =>
            prev.includes(p) ? prev.filter(pr => pr !== p) : [...prev, p]
        );
    };

    const handleApply = () => {
        onApply({ selectedAdmins, selectedPriority }); // ✅ use stored values
        setSelectedAdmins(selectedAdmins);
        setSelectedPriority(selectedPriority);
        onClose();
    };

    return (
        <div className="absolute z-999 right-0 mt-2 w-64 bg-white shadow-lg rounded-xl p-3 border">
            <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm" onClick={onReset}>
                Refresh Filter
            </button>

            <h3 className="font-medium mb-2 text-sm">Admins</h3>
            <div className="max-h-32 overflow-auto space-y-1 mb-3">
                {admins.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            onChange={() => toggleAdmin(a.id)}
                            checked={selectedAdmins.includes(a.id)} // ✅ now works
                        />
                        {a.name || (a.firstName + " " + (a.lastName || ""))}
                    </label>
                ))}
            </div>

            <h3 className="font-medium mb-2 text-sm">Priority</h3>
            <div className="space-y-1 mb-3">
                {priorities.map(p => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            onChange={() => togglePriority(p)}
                            checked={selectedPriority.includes(p)} // ✅ now stays checked
                        />
                        {p}
                    </label>
                ))}
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="text-xs px-3 py-1 border rounded">Cancel</button>
                <button onClick={handleApply} className="text-xs px-3 py-1 bg-blue-600 text-white rounded">Apply</button>
            </div>
        </div>
    );
}




function TaskColumn({ column, tasks, onAddTask, onTaskClick, activeTab }) {
    return (
        <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-full min-h-[200px] flex flex-col 
        transition-all duration-200 
        ${snapshot.isDraggingOver ? "bg-blue-50 border-2 border-blue-300" : ""}
      `}>
                    {/* HEADER SAME */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                            <span className="font-medium text-sm">{column.label}</span>
                            <span className={`${column.bgColor} text-xs text-white px-3 py-0.5 rounded-full`}>
                                {tasks.length}
                            </span>
                        </div>
                        <button onClick={onAddTask} className="p-1 flex items-center gap-1 hover:bg-gray-100 rounded">
                            <Plus size={18} />  <MoreVertical size={18} />
                        </button>
                    </div>

                    {/* ADD NEW TASK BUTTON SAME */}
                    {
                        activeTab !== "feedback" && <button
                            onClick={onAddTask}
                            className="w-full bg-white flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-xl text-sm text-[#237FEA] hover:bg-gray-50 mb-4"
                        >
                            <Plus size={16} />
                            Add New Task
                        </button>

                    }
                    {/* TASKS WITH DRAGGABLE */}
                    <div className="space-y-4 relative">
                        {tasks.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex items-center justify-center h-24 text-sm text-gray-400 italic">
                                No data available
                            </div>
                        )}
                        {tasks.map((t, index) => (
                            <Draggable key={t.id} draggableId={t.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`transition-all duration-200 ${snapshot.isDragging ? "shadow-xl scale-[1.02]" : ""
                                            }`}
                                    >
                                        <TaskCard task={t} onClick={() => onTaskClick(t)} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {snapshot.isDraggingOver && (
                            <div className="h-16 bg-gray-200 rounded-xl border-2 border-dashed border-gray-400"></div>
                        )}
                        {provided.placeholder}
                    </div>

                </div>
            )}
        </Droppable>
    );
}




function TaskCard({ task, onClick }) {
    const isFeedback = task.type === 'feedback' || task.category === 'Parent Feedback' || task.isFeedback;
    const priorityStyles = {
        low: "bg-green-100 text-green-700",
        medium: "bg-yellow-100 text-yellow-700",
        high: "bg-red-100 text-red-700",
    };

    return (
        <div
            onClick={onClick}
            className="bg-white border border-[#E2E1E5] rounded-xl  cursor-pointer hover:shadow-sm transition"
        >
            <div className="p-4 pb-0">
                <div className="flex justify-between items-start">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${priorityStyles[task.priority] || ""
                        }`}>
                        {task.priority}
                    </span>
                    <MoreVertical size={18} />
                </div>

                <h2 className="mt-3 font-semibold capitalize text-[18px]">{task.title}</h2>
                <p className="text-sm text-gray-600 capitalize mt-1 line-clamp-2">{task.description}</p>



                <div className="flex items-center gap-2 mt-3">
                    {task.assignedAdmins.map((u, index) => (
                        <div key={index} className="flex gap-1 items-center">
                            <img
                                key={index}
                                src={u.profile || "/members/dummyuser.png"}
                                className="h-9 w-9 rounded-full border-2 border-white object-cover"
                            />
                            <span className="text-sm font-medium">{u.name || (u.firstName + " " + (u.lastName || ""))}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center border-t border-[#E2E1E5] text-[16px] p-4 font-semibold text-gray-500 mt-4">
                <div className="flex items-center gap-1 justify-between w-full">
                    {isFeedback && task.parentAccount ? (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                            <a
                                href={`/weekly-classes/account-information?id=${task.bookingId}&serviceType=${task.serviceType}`}
                                className="text-sm  hover:underline flex items-center gap-1"
                            >
                                <button className='cursor-pointer bg-[#237FEA] text-white rounded-lg hover:bg-blue-600 py-1 px-2'>See Profile</button>
                            </a>
                        </div>
                    ) : (
                        <a

                            className="text-sm hover:underline flex items-center gap-1"
                        >
                            <img src="/reportsIcons/share.png" className="w-4" />  {task.assignedAdmins.length}
                        </a>

                    )}
                    <span>3 Days Left</span>

                </div>
                {/* <div>{task.daysLeft} 3 days left</div> */}
            </div>
        </div>
    );
}


function CreateTaskModal({ members, onClose }) {
    const { adminInfo, setAdminInfo } = useNotification();

    const { createToDoList } = useToDoListTemplate();

    const memberOptions = members.map(m => ({
        value: m.id,
        label: `${m.firstName} ${m.lastName || ""}`.trim(),
        profile: m.profile,
        fullData: m
    }));
    const [priority, setPriority] = useState("high");
    const [showComment, setShowComment] = useState(false);

    const [createdAt] = useState(new Date());
    const [updatedAt, setUpdatedAt] = useState(new Date());

    const priorityOptions = ["high", "medium", "low"];

    const [selectedMembers, setSelectedMembers] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        comment: "",
    });
    const [showMembers, setShowMembers] = useState(null);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleFiles = (files) => {
        const fileArray = Array.from(files);

        const filePreviews = fileArray.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            type: file.type,
        }));

        setUploadedFiles((prev) => [...prev, ...filePreviews]);
    };

    const handleFileUpload = (e) => {
        handleFiles(e.target.files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // REQUIRED
    };



    const handleCommentChange = (e) => {
        setFormData((p) => ({ ...p, comment: e.target.value }));
    };



    const handleSubmit = async () => {
        const data = new FormData();

        (uploadedFiles || []).forEach((f) => {
            // f.file is the real File object
            data.append("attachments", f.file);   // ✅ THIS sends (binary)
        });

        // other fields
        data.append("priority", priority);
        data.append("assignedAdmins", JSON.stringify(
            selectedMembers.map(m => m.fullData.id)
        ));

        // add formData fields
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        // finally send
        createToDoList(data);

        console.log("FORMDATA SENT:", [...data.entries()]);
        onClose();
    };

    const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });


    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">

            <div className="bg-white rounded-2xl md:w-5/12 max-h-[90vh] overflow-auto ">

                <div className="flex p-6 justify-center relative items-center border-b border-[#E2E1E5]">
                    <h2 className="text-xl font-semibold">Create Task</h2>
                    <button onClick={onClose} className="absolute left-4 top-7 font-bold text-gray-500 hover:text-black">
                        <X />
                    </button>
                </div>

                <div className="flex">
                    <div className="md:w-[60%] p-6 space-y-6">


                        <div>
                            <label className="text-sm ">Title</label>
                            <input
                                className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 focus:outline-none"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>


                        <div>
                            <label className="text-sm ">Description</label>
                            <textarea
                                className="bg-[#FAFAFA] w-full h-32 border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 resize-none focus:outline-none"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>


                        <div>
                            <label className="text-md font-semibold">Add attachments</label>

                            <div className="mt-4">
                                <label
                                    className="border-2 border-dashed border-[#ACACAC] rounded-md mt-2 h-28 
        flex items-center justify-center text-gray-500 cursor-pointer"
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <div className="text-center pointer-events-none">
                                        <img src="/reportsIcons/folder.png" className="w-10 m-auto" alt="" />
                                        <p className="text-sm mt-2">Click to upload or drag and drop</p>
                                    </div>

                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>


                                {uploadedFiles.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {uploadedFiles.map((item, index) => (
                                            <div key={index} className="relative border border-gray-200 rounded-md p-2 bg-white shadow-sm">

                                                {/* Delete Button */}
                                                <button
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6
                flex items-center justify-center text-xs"
                                                    onClick={() =>
                                                        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                                                    }
                                                >
                                                    ✕
                                                </button>

                                                {/* IMAGE OR PDF */}
                                                {(item.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                                                    item.type?.startsWith("image/") ||
                                                    item.url?.startsWith("data:image")) ? (

                                                    /* IMAGE PREVIEW */
                                                    <img
                                                        src={item.url}
                                                        className="w-full h-24 object-cover rounded"
                                                        alt="preview"
                                                    />

                                                ) : (
                                                    /* PDF PREVIEW */
                                                    <div className="flex flex-col items-center justify-center h-24">
                                                        <img src="/reportsIcons/pdf.png" className="w-10 mb-2" />

                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                    </div>
                                )}

                            </div>




                        </div>


                        <div className="mt-3 space-y-4 p-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={
                                        adminInfo?.profile
                                            ? `${adminInfo.profile}`
                                            : '/members/dummyuser.png'
                                    }
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 relative">
                                    <input
                                        placeholder="Add a comment"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-0 focus:outline-none"
                                        value={formData.comment}
                                        onChange={handleCommentChange}
                                    />
                                    <button onClick={() => setShowComment(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#237FEA] text-white rounded-lg hover:bg-blue-600">
                                        <Send size={16} />
                                    </button>
                                </div>

                            </div>
                            {showComment && (
                                <p className="text-sm text-gray-500 mt-2">{formData.comment}</p>
                            )}
                        </div>


                    </div>


                    <div className="md:w-[40%] bg-[#FAFAFA] py-6 space-y-6">

                        {/* Created By */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold">Created by</p>
                            <div className="flex items-center gap-3 mt-4">
                                <img src={
                                    adminInfo?.profile
                                        ? `${adminInfo.profile}`
                                        : '/members/dummyuser.png'
                                } className="w-10 h-10 rounded-full" />
                                <p className="font-medium">
                                    {`${adminInfo.firstName} ${adminInfo.lastName}`}
                                </p>
                            </div>
                        </div>

                        {/* Assign Members */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold">Assign</p>

                            {/* Selected avatars */}
                            <div className="flex flex-wrap gap-1 mt-3">
                                <div className="flex flex-wrap gap-3">
                                    {selectedMembers.map((m) => (
                                        <img
                                            src={
                                                m?.profile
                                                    ? `${m.profile}`
                                                    : '/members/dummyuser.png'
                                            }
                                            key={m.value}

                                            alt={m.label}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ))}
                                </div>

                                {/* Add button */}
                                <button
                                    onClick={() => setShowMembers(true)}
                                    className="cursor-pointer w-8 h-8 border border-[#717073] rounded-full flex items-center justify-center text-xl"
                                >
                                    +
                                </button>
                            </div>

                            {/* Modal */}
                            {showMembers && (
                                <AssignModal
                                    close={() => setShowMembers(false)}
                                    selectedMembers={selectedMembers}
                                    setSelectedMembers={setSelectedMembers}
                                    memberOptions={memberOptions}
                                />
                            )}
                        </div>

                        {/* Status */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold mb-2">Status</p>
                            {/* <span className="mt-1 inline-block bg-blue-100 text-[#237FEA] text-xs px-2 py-1 rounded-md">
                                Next
                            </span> */}
                        </div>

                        {/* Priority */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold mb-2">Priority</p>

                            <div className="flex gap-2">
                                {priorityOptions.map((p) => (
                                    <span
                                        key={p}
                                        onClick={() => {
                                            setPriority(p);
                                            setUpdatedAt(new Date());
                                        }}
                                        className={`cursor-pointer text-xs px-2 py-1 rounded-md
                        ${priority === p
                                                ? "bg-red-500 text-white"
                                                : "bg-red-100 text-[#FF5C40]"}
                    `}
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Created */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold">Created</p>
                            <p className="text-sm mt-1">
                                {today}
                            </p>
                        </div>

                        <div className="pb-6 px-6">
                            <p className="text-[17px] font-semibold">Last Update</p>
                            <p className="text-sm mt-1">
                                {today}
                            </p>
                        </div>


                    </div>

                </div>
                <div className="p-4 flex justify-end border-t border-gray-200">
                    <button
                        onClick={handleSubmit}
                        className="bg-[#237FEA] text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Save Task
                    </button>
                </div>

            </div>
        </div>
    );
}

const AssignModal = ({ close, selectedMembers, setSelectedMembers, memberOptions }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white w-[400px] p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Assign Members</h2>

                <Select
                    options={memberOptions}
                    isMulti
                    onChange={(selected) => setSelectedMembers(selected)}
                    value={selectedMembers}
                    placeholder="Select Members"
                    className="text-sm"
                />

                <div className="flex justify-end gap-3 mt-5">
                    <button
                        onClick={close}
                        className="px-4 py-2 bg-gray-300 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={close}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};


function ViewTaskModal({ task, open, setOpen, onClose, activeTab }) {
    if (!task) return null;
    const { adminInfo, setAdminInfo } = useNotification();

    const toggle = (section) => setOpen(open === section ? null : section);

    // ===========================
    // ATTACHMENTS HANDLING
    // ===========================
    console.log("task in ViewTaskModal:", task);
    const [uploadedFiles, setUploadedFiles] = useState(() => {
        let raw = task?.attachments;

        // If attachments is a string → try parsing
        if (typeof raw === "string") {
            try {
                raw = JSON.parse(raw);
            } catch {
                raw = [];
            }
        }

        if (!Array.isArray(raw)) raw = [];

        // Normalize all formats
        return raw.map(item => {
            // CASE 1: URL-based server file
            if (item.url) {
                return {
                    name: item.name || "",
                    url: item.url,
                    type: item.type || "image",
                    file: null
                };
            }

            // CASE 2: Base64 file
            if (item.file?.startsWith("data:")) {
                return {
                    name: item.name || "base64-image",
                    url: item.file,   // base64 already usable
                    type: item.type || "image",
                    file: null
                };
            }

            // Default fallback
            return {
                name: item.name || "",
                url: item.url || "",
                type: item.type || "file",
                file: null
            };
        });
    });


    const handleFiles = (files) => {
        const mapped = Array.from(files).map((file) => ({
            file,
            url: URL.createObjectURL(file),
            type: file.type
        }));

        setUploadedFiles((prev) => [...prev, ...mapped]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleFileUpload = (e) => {
        handleFiles(e.target.files);
    };

    // ===========================
    // COMMENT HANDLING
    // ===========================
    const [comment, setComment] = useState("");

    const addComment = () => {
        console.log("COMMENT:", comment);
        setComment("");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? dateString : d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
            <div className="bg-white rounded-2xl md:w-5/12 max-h-[90vh] overflow-auto">
                {/* HEADER */}
                <div className="flex p-6 justify-center relative items-center border-b border-[#E2E1E5]">
                    <h2 className="text-xl font-semibold">Task</h2>
                    <button onClick={onClose} className="absolute left-4 top-7 text-gray-500 hover:text-black">
                        <X />
                    </button>
                </div>

                <div className="flex">
                    {/* LEFT SIDE */}
                    <div className="md:w-[60%] space-y-6">
                        <div className="p-6">
                            <h4 className="text-[24px] font-semibold mb-2">{task.title}</h4>
                            <p className="text-[16px] text-[#717073]">{task.description}</p>
                        </div>

                        {/* =========================== ATTACHMENTS =========================== */}
                        {activeTab !== "feedback" && (

                            <div className="bg-white rounded-2xl py-4">
                                <button
                                    onClick={() => toggle("attachments")}
                                    className="flex justify-between items-center w-full px-5 py-3 border-b border-[#E2E1E5]"
                                >
                                    <span className="font-medium text-[16px]">Attachments</span>
                                    <ChevronDown size={18} className={`transition-transform ${open === "attachments" ? "rotate-180" : ""}`} />
                                </button>

                                {open === "attachments" && (
                                    <div className="p-4">

                                        {/* Preview */}
                                        {uploadedFiles.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                {uploadedFiles.map((item, index) => (
                                                    <div key={index} className="relative border rounded-md p-2 bg-white shadow-sm">
                                                        <button
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                                            onClick={() =>
                                                                setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                                                            }
                                                        >
                                                            ✕
                                                        </button>

                                                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(item.url) ? (
                                                            <img src={item.url} className="w-full h-24 object-cover rounded" />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-24">
                                                                <img src={item.url} className="w-10 mb-2" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========================== COMMENT =========================== */}
                        <div className="bg-white rounded-2xl py-4">
                            <button
                                onClick={() => toggle("comment")}
                                className="flex justify-between items-center w-full px-5 py-3 border-b border-[#E2E1E5]"
                            >
                                <span className="font-medium text-[16px]">{activeTab == "feedback" ? "Notes" : "Comment"}</span>
                                <ChevronDown size={18} className={`transition-transform ${open === "comment" ? "rotate-180" : ""}`} />
                            </button>

                            {open === "comment" && (

                                <div className="mt-3 space-y-4 p-4">
                                    <p className="text-[16px] text-[#717073]">{task.comment || task.notes}</p>

                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE DETAILS */}
                    <div className="md:w-[40%] bg-[#FAFAFA] py-6 space-y-6">
                        {/* Created By */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold">Created by</p>
                            <div className="flex items-center gap-3 mt-4">
                                <img src={task.creator?.profile || task.createdBy?.profile || "/members/dummyuser.png"} className="w-10 h-10 rounded-full" />
                                <p className="font-medium">{task.creator?.name || "Unknown"}</p>
                            </div>
                        </div>

                        {/* Assigned */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold">Assign</p>
                            <div className="flex gap-2 mt-2 items-center flex-wrap">
                                {(task.assigned || []).map((m, i) => (
                                    <div key={i} className="flex items-center gap-2 mr-3">
                                        <img src={m.profile || m.avatar || "/members/dummyuser.png"} className="w-8 h-8 rounded-full" />
                                        <p>{m.name}</p>
                                    </div>
                                ))}

                            </div>
                        </div>

                        {/* Status */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold mb-2">Status</p>
                            <span className="mt-1 inline-block bg-blue-100 text-[#237FEA] text-xs px-2 py-1 rounded-md">
                                {task.status
                                    .split('_')                 // split by underscore
                                    .map(word => word[0].toUpperCase() + word.slice(1)) // capitalize each word
                                    .join(' ')}
                            </span>

                        </div>

                        {/* Priority */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold mb-2">Priority</p>
                            <span className="mt-1 capitalize inline-block bg-red-100 text-[#FF5C40] text-xs px-2 py-1 rounded-md">
                                {task.priority}
                            </span>
                        </div>

                        {/* Created Date */}
                        <div className="border-b border-[#E2E1E5] pb-6 px-6">
                            <p className="text-[17px] font-semibold">Created</p>
                            <p className="text-sm mt-1">{formatDate(task.createdAt)}</p>
                        </div>

                        {/* Updated Date */}
                        <div className="pb-6 px-6">
                            <p className="text-[17px] font-semibold">Last Update</p>
                            <p className="text-sm mt-1">{formatDate(task.updatedAt)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

