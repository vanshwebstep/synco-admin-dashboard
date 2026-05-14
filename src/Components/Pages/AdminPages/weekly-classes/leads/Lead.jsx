
import {
    Plus, Filter, Check
} from "lucide-react";
import { TiUserAdd } from "react-icons/ti";
import Cards from "./Cards";
import Filters from "./Filters";
import { useLeads } from "../../contexts/LeadsContext";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, UserPlus, X, Loader2 } from "lucide-react";
import { showSuccess, showError, showWarning } from "../../../../../utils/swalHelper";
import Facebook from "./Facebook";
import Select from "react-select";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Lead = () => {
    const tabs = [
        { name: "Facebook", component: <Facebook /> },
        { name: "Referral", component: <Facebook /> },
        { name: "All other leads", component: <Facebook /> },
        { name: "All", component: <Facebook /> },
    ];

    const leadsData = useLeads();
    const [showFilter, setShowFilter] = useState(false);

    const {
        activeTab,
        setActiveTab,
        setSearchTerm,
        fetchData,
        setSelectedVenue,
        loading,
        setCurrentPage,
        data,
        sheetUrl,
        selectedUserIds,
        setSelectedUserIds
    } = leadsData || {};

    const [agentsData, setAgentsData] = useState([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [showAgentPopup, setShowAgentPopup] = useState(false);
    const [isAssigningAgent, setIsAssigningAgent] = useState(false);
    const [selectedAgents, setSelectedAgents] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        if (fetchData) {
            fetchData();
        }
    }, [activeTab, fetchData]);


    console.log('activeTab', activeTab);

    if (!leadsData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg font-semibold text-gray-600">Loading Leads Context...</div>
            </div>
        );
    }
    const fetchAllAgents = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setAgentsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/get-agents`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setAgentsData(result);
            setShowAgentPopup(true);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
            showError("Error", "Failed to fetch agents.");
        } finally {
            setAgentsLoading(false);
        }
    }, []);

    const handleClick = () => {
        if (!selectedUserIds || selectedUserIds.length === 0) {
            showWarning("Warning", 'Please select at least 1 lead');
            return;
        }

        // Check if any selected lead is already assigned (optional, based on requirement)
        const selectedLeads = data.filter(lead => selectedUserIds.includes(lead.id));
        const alreadyAssigned = selectedLeads.filter(lead => lead.assignedAgentId != null);

        if (alreadyAssigned.length > 0) {
            // If the user wants to allow re-assignment, they can, 
            // but here we follow the user's logic of warning.
            showWarning(
                "Warning",
                "One or more selected leads are already assigned to an agent."
            );
            return;
        }

        fetchAllAgents();
    };

    const handleAssignAgent = async () => {
        if (!selectedAgents || selectedAgents.length === 0) {
            showWarning("Warning", "Please select an agent.");
            return;
        }
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setIsAssigningAgent(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/lead/assign-lead`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    leadIds: selectedUserIds,
                    assignedAgentId: selectedAgents[0]?.value, // Send single ID
                }),
            });

            const result = await response.json();

            if (response.ok) {
                showSuccess("Success", result.message || "Agent assigned successfully.");
                setShowAgentPopup(false);
                setSelectedUserIds([]); // Clear selection
                setSelectedAgents([]); // Clear selected agents
                if (fetchData) fetchData(); // Refresh data
            } else {
                throw new Error(result.message || "Failed to assign agents.");
            }
        } catch (error) {
            console.error("Failed to assign agent:", error);
            showError("Error", error.message || "Failed to assign agent.");
        } finally {
            setIsAssigningAgent(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden bg-gray-50 py-6 flex flex-col lg:flex-row ">


            <div className={` gap-6 md:pe-3 mb-4 md:mb-0 ${showFilter ? "md:w-[73%]" : "w-full"}`}>
                <Cards />
                <div className="flex justify-between items-center mt-5">
                    <div className="flex  items-center  p-1 space-x-2 overflow-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                disabled={loading}
                                onClick={() => {
                                    setSelectedVenue(null); setSearchTerm("");
                                    setCurrentPage(1);
                                    setActiveTab(tab.name);
                                }}
                                className={`relative flex-1 text-[15px] px-3 md:text-base font-semibold py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.name
                                    ? "bg-[#237FEA] shadow text-white"
                                    : "text-[#282829] hover:text-[#282829] border border-[#E2E1E5]"
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 items-center">
                        {activeTab === "Facebook" && sheetUrl && (
                            <button
                                onClick={() => window.open(sheetUrl, "_blank")}
                                className="flex items-center gap-2 bg-[#4285F4] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#357ae8] transition"
                            >
                                <FileText size={16} />
                                View Docs
                            </button>
                        )}
                        <div className="bg-white min-w-[38px] min-h-[38px]   border border-gray-300 p-2 rounded-full flex items-center justify-center">
                            <Filter size={16} className='cursor-pointer' onClick={() => setShowFilter(!showFilter)} />
                        </div>
                        <button onClick={handleClick} className="bg-white border border-[#E2E1E5] rounded-full flex justify-center items-center h-10 w-10"><TiUserAdd className="text-xl" /></button>
                        <button onClick={() => navigate('/weekly-classes/central-leads/create')}
                            className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            <Plus size={16} />
                            Add new lead
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    {tabs.find((tab) => tab.name === activeTab)?.component}
                </div>
            </div>

            {showFilter && <Filters />}

            {/* Agent Assignment Popup */}
            {showAgentPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[28px] font-bold text-[#282829]">Select agent</h3>
                            <button
                                onClick={() => setShowAgentPopup(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {agentsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="text-[#237FEA] animate-spin" size={32} />
                                </div>
                            ) : agentsData.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 font-medium">No agents available.</p>
                            ) : (
                                agentsData.map((agent) => {
                                    const isSelected = selectedAgents.some(a => a.value === agent.id);
                                    return (
                                        <div
                                            key={agent.id}
                                            className="flex items-center gap-4 py-2 cursor-pointer group"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedAgents([]);
                                                } else {
                                                    setSelectedAgents([{ value: agent.id, label: `${agent.firstName} ${agent.lastName}` }]);
                                                }
                                            }}
                                        >
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#237FEA] border-[#237FEA]' : 'border-gray-200 group-hover:border-[#237FEA]'
                                                }`}>
                                                {isSelected && <Check size={16} className="text-white" strokeWidth={4} />}
                                            </div>

                                            <div className="relative">
                                                <img
                                                    src={agent.profilePicture || agent.image || "/images/avatar-placeholder.png"}
                                                    alt=""
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-[#E6F7FB]"
                                                    onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + agent.firstName + "+" + agent.lastName + "&background=E6F7FB&color=237FEA"}
                                                />
                                                <div className="absolute inset-0 rounded-full border-2 border-yellow-400/30 pointer-events-none"></div>
                                            </div>

                                            <span className="text-[20px] font-medium text-[#282829]">
                                                {agent.firstName} {agent.lastName}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleAssignAgent}
                                disabled={isAssigningAgent || selectedAgents.length === 0}
                                className="w-full py-4 bg-[#237FEA] text-white font-bold rounded-2xl hover:bg-[#1a6ed8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-100 text-lg"
                            >
                                {isAssigningAgent ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    'Assign'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lead;
