import React, { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function QcConfiguration() {
    const [questions, setQuestions] = useState([
        {
            id: "q1",
            title: "What are the roles we have at SSS?",
            options: ["Rules are not given", "There are 4 rules", "Only 10 rules are available"],
            open: true,
        },
        { id: "q2", title: "What are the roles we have at SSS?", options: [], open: false },
        { id: "q3", title: "What are the roles we have at SSS?", options: [], open: false },
    ]);

    const [editingId, setEditingId] = useState(null);
    const [editedTitle, setEditedTitle] = useState("");

    // ---------------- DRAG END ----------------
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(questions);
        const [reordered] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reordered);

        setQuestions(items);
    };

    // ---------------- TOGGLE ACCORDION ----------------
    const toggleAccordion = (id) => {
        setQuestions((prev) =>
            prev.map((q) => ({ ...q, open: q.id === id ? !q.open : q.open }))
        );
    };

    // ---------------- SAVE TITLE ----------------
    const saveQuestionTitle = (id) => {
        setQuestions(prev =>
            prev.map(q =>
                q.id === id ? { ...q, title: editedTitle } : q
            )
        );
        setEditingId(null);
    };

    // ---------------- ADD NEW QUESTION ----------------
    const addQuestion = () => {
        const newQ = {
            id: "q" + (questions.length + 1),
            title: "New Question",
            options: [],
            open: true,
        };
        setQuestions([...questions, newQ]);
    };

    // ---------------- ADD OPTION ----------------
    const addOption = (qid) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === qid ? { ...q, options: [...q.options, "New Option"] } : q
            )
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center p-4 justify-center z-[999]">
            <div className="bg-white rounded-3xl w-6/12 md:h-[95vh] overflow-hidden">

                {/* HEADER */}
                <div className="flex justify-between items-center px-6 border-b border-[#E2E1E5] py-5">
                    <h2 className="text-xl font-semibold">Questions</h2>
                    <button
                        onClick={addQuestion}
                        className="text-white p-2 rounded-xl bg-[#237FEA] text-sm flex items-center gap-2"
                    >
                        <Plus size={16} /> Add New Question
                    </button>
                </div>

                {/* SCROLL AREA */}
                <div className="h-[80vh] overflow-auto px-6 py-6 space-y-6">

                    {/* DRAGGABLE QUESTIONS */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="questions-droppable">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                    {questions.map((q, index) => (
                                        <Draggable key={q.id} draggableId={q.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="bg-white rounded-2xl border border-[#E2E1E5]"
                                                >

                                                    {/* HEADER ROW */}
                                                    <div
                                                        className="flex items-center justify-between p-3 cursor-pointer"
                                                        onClick={() => toggleAccordion(q.id)}
                                                    >
                                                        <div className="flex items-center gap-3">

                                                            {/* DRAG HANDLE */}
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <GripVertical className="text-gray-400" />
                                                            </div>

                                                            {/* EDITABLE TITLE */}
                                                            {editingId === q.id ? (
                                                                <input
                                                                    autoFocus
                                                                    value={editedTitle}
                                                                    onChange={(e) => setEditedTitle(e.target.value)}
                                                                    onBlur={() => saveQuestionTitle(q.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") saveQuestionTitle(q.id);
                                                                    }}
                                                                    className="border p-2 rounded-lg text-sm w-64"
                                                                />
                                                            ) : (
                                                                <p
                                                                    className="font-semibold text-[#3E3E47]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingId(q.id);
                                                                        setEditedTitle(q.title);
                                                                    }}
                                                                >
                                                                    {q.title}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ACCORDION CONTENT */}
                                                    {q.open && (
                                                        <div className="border-t border-[#E2E1E5] space-y-3">
                                                            <div className="space-y-2 p-4">
                                                                {q.options.map((opt, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3">
                                                                        <GripVertical className="text-gray-400" />
                                                                        <input type="radio" name={q.id} />
                                                                        <input
                                                                            type="text"
                                                                            defaultValue={opt}
                                                                            className="w-6/12 bg-[#FAFAFA] text-[#717073] p-3 outline-none border border-[#E2E1E5] rounded-xl text-sm"
                                                                        />
                                                                    </div>
                                                                ))}

                                                                {/* ADD OPTION */}
                                                                <button
                                                                    onClick={() => addOption(q.id)}
                                                                    className="text-white p-2 ms-16 mt-2 rounded-xl bg-[#237FEA] text-sm flex items-center gap-2"
                                                                >
                                                                    <Plus size={16} /> Add Option
                                                                </button>
                                                            </div>

                                                            <div className="flex justify-end gap-2 border-t border-[#E2E1E5] py-3 px-6">
                                                                <button className="px-4 py-2 bg-[#237FEA] text-white rounded-lg text-sm hover:bg-blue-700">
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* OTHER AREAS */}
                    <div className="pt-4">
                        <h2 className="text-xl font-semibold mb-4">Other Areas</h2>

                        <div className="space-y-3">
                            {["Top 3 strength", "Top 3 improvements", "Additional notes"].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#E2E1E5]">
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="text-gray-400" />
                                        <span className="text-[#3E3E47] font-semibold">{item}</span>
                                    </div>
                                    <div className="flex justify-between gap-2 items-center">
                                        <img src="/reportsIcons/Pen.png" alt="" className="w-5 h-5 cursor-pointer" />
                                        <img src="/reportsIcons/delete-02.png" className="w-5 h-5 cursor-pointer" alt="" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
