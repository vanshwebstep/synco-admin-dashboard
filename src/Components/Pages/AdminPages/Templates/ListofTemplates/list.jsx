import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import Select from "react-select";

const emailData = [
    { id: 1, title: "Welcome Email", sentDate: "Sent 23/06/2023", status: "Sent", recipients: 520, agent: "Ben Marcus", opens: "1.2k Opens" },
    { id: 2, title: "New Course Launch", sentDate: "Sent 10/07/2023", status: "Scheduled", recipients: 430, agent: "Laura Smith", opens: "–" },
    { id: 3, title: "Feedback Request", sentDate: "Sent 01/05/2023", status: "Draft", recipients: 120, agent: "Chris Lee", opens: "–" },
];

const textData = [
    { id: 101, title: "Trial Class Reminder", sentDate: "Sent 15/08/2023", status: "Sent", recipients: 300, agent: "Ben Marcus", opens: "850 Opens" },
    { id: 102, title: "Holiday Discount", sentDate: "Sent 28/09/2023", status: "Sent", recipients: 660, agent: "Emma Watson", opens: "1.7k Opens" },
    { id: 103, title: "Class Cancel Update", sentDate: "Sent 02/10/2023", status: "Sent", recipients: 90, agent: "Operations", opens: "210 Opens" },
];


export default function CommunicationsList() {
    const [activeTab, setActiveTab] = useState("Email");
    const [searchText, setSearchText] = useState("");
    const [myVenues, setMyVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const currentData = activeTab === "Email" ? emailData : textData;

    const filteredData = currentData.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <h2 className="text-xl font-bold mb-6">Communications</h2>

            <div className='flex justify-between items-center'>
                <div className="flex gap-3 mb-6 bg-white max-w-fit border-gray-300 border rounded-xl p-2">
                    {["Email", "Text"].map(tab => (
                        <motion.button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            whileTap={{ scale: 0.95 }}
                            className={`px-10 py-2 rounded-xl font-semibold ${activeTab === tab ? "bg-[#237FEA] text-white shadow-lg" : "bg-white text-gray-700"
                                }`}
                        >
                            {tab}
                        </motion.button>
                    ))}

                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="ml-auto bg-[#237FEA] hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium"
                >
                    + Create Template
                </motion.button>
            </div>
            {/* Search + Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div>
                    <p className="text-base mb-2">Search</p>
                    <div className="relative">

                        <input
                            type="text"

                            className="w-full border min-w-100 bg-white border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                            placeholder={`Search ${activeTab}`}

                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                        <FiSearch className="absolute left-3 top-4 text-[20px]" />
                    </div>
                </div>
                <div className="min-w-40">
                    <label htmlFor="" className="text-base font-semibold">Date</label>
                    <div className="relative mt-2 ">
                        <Select
                            options={myVenues.map((venue) => ({
                                label: venue?.name, // or `${venue.name} (${venue.area})`
                                value: venue?.id,
                            }))}
                            value={selectedVenue}
                            onChange={(venue) => setSelectedVenue(venue)}
                            placeholder="All"
                            className="mt-2"
                            classNamePrefix="react-select"
                            isClearable={true} // 👈 adds cross button
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    borderRadius: "1.5rem",
                                    borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
                                    boxShadow: "none",
                                    padding: "4px 8px",
                                    minHeight: "48px",
                                }),
                                placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                indicatorSeparator: () => ({ display: "none" }),
                            }}
                        />



                    </div>
                </div>
                <div className="min-w-40">
                    <label htmlFor="" className="text-base font-semibold">Category</label>
                    <div className="relative mt-2 ">
                        <Select
                            options={myVenues.map((venue) => ({
                                label: venue?.name, // or `${venue.name} (${venue.area})`
                                value: venue?.id,
                            }))}
                            value={selectedVenue}
                            onChange={(venue) => setSelectedVenue(venue)}
                            placeholder="All"
                            className="mt-2"
                            classNamePrefix="react-select"
                            isClearable={true} // 👈 adds cross button
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    borderRadius: "1.5rem",
                                    borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
                                    boxShadow: "none",
                                    padding: "4px 8px",
                                    minHeight: "48px",
                                }),
                                placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                indicatorSeparator: () => ({ display: "none" }),
                            }}
                        />



                    </div>
                </div>
                <div className="min-w-40">
                    <label htmlFor="" className="text-base font-semibold">Status</label>
                    <div className="relative mt-2 ">
                        <Select
                            options={myVenues.map((venue) => ({
                                label: venue?.name, // or `${venue.name} (${venue.area})`
                                value: venue?.id,
                            }))}
                            value={selectedVenue}
                            onChange={(venue) => setSelectedVenue(venue)}
                            placeholder="All"
                            className="mt-2"
                            classNamePrefix="react-select"
                            isClearable={true} // 👈 adds cross button
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    borderRadius: "1.5rem",
                                    borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
                                    boxShadow: "none",
                                    padding: "4px 8px",
                                    minHeight: "48px",
                                }),
                                placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                indicatorSeparator: () => ({ display: "none" }),
                            }}
                        />



                    </div>
                </div>



            </div>

            {/* List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredData.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white  rounded-xl px-6 py-4 flex items-center justify-between border border-gray-200"
                        >
                            <div className="w-52">
                                <p className="font-semibold text-gray-900 mb-2">{item.title}</p>
                                <p className="text-xs text-gray-400">{item.sentDate}</p>
                            </div>

                            {/* Status with dot */}
                            <div>
                                <p className="font-semibold text-gray-900 mb-2">Status</p>

                                <div className="flex items-center gap-2 w-32">
                                    <span className={`w-2.5 h-2.5 rounded-full ${item.status === "Sent" ? "bg-green-500" : item.status === "Scheduled" ? "bg-yellow-500" : "bg-gray-500"
                                        }`} />
                                    <p className="text-sm text-gray-700 font-medium">{item.status}</p>
                                </div></div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-2">Recepitients</p>
                                <div className="w-24 text-sm font-medium text-gray-700">{item.recipients}</div>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-2">Agents</p>
                                <div className="w-32 text-sm font-medium text-gray-700">{item.agent}</div>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-2">opens</p>
                                <div className="w-28 text-sm font-medium text-gray-700">{item.opens}</div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.94 }}
                                className="bg-[#237FEA] text-white px-10 py-1.5 rounded-lg"
                            >
                                View
                            </motion.button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredData.length === 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-gray-400 text-sm py-6"
                    >
                        No {activeTab} communications found.
                    </motion.p>
                )}
            </div>
        </div>
    );
}
