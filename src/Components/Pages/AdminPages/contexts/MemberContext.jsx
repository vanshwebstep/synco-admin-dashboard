import { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError } from "../../../../utils/swalHelper";
import { useNavigate } from "react-router-dom";

const MemberContext = createContext();

export const MemberProvider = ({ children }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [authStatus, setAuthStatus] = useState('checking'); // 'checking' | 'allowed' | 'denied'
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [roleOptions, setRoleOptions] = useState([]);
    const [keyInfoData, setKeyInfoData] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleName, setRoleName] = useState("");
    const [permissions, setPermissions] = useState([]);
    const [dashboardData, setDashboardData] = useState([]);

    const [activeTab, setActiveTab] = useState("All");
    const token = localStorage.getItem("adminToken");
    const verifyToken = async () => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            console.warn("Token missing");
            setAuthStatus("denied");
            return false; // return false if no token
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/auth/login/verify`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (response.ok && result.status === true) {
                setAuthStatus("allowed");

                // Optional: Save admin info to localStorage
                localStorage.setItem("adminInfo", JSON.stringify(result.admin));
                localStorage.setItem("role", result.admin.role);
                localStorage.setItem(
                    "hasPermission",
                    JSON.stringify(result.hasPermission)
                );

                // console.log("permission saved in protectedroute", result.hasPermission);
                return true; // ✅ success
            } else {
                console.warn("Token invalid or expired");
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminInfo");
                navigate("/admin-login");
                setAuthStatus("denied");
                return false; // ❌ failure
            }
        } catch (error) {
            console.error("Verification failed:", error);
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminInfo");
            navigate("/admin-login");
            setAuthStatus("denied");
            return false; // ❌ failure
        }
    };
    const fetchRoles = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/role`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();
            const formatted = result.data.map((item) => ({
                value: item.id,
                label: item.role,
            }));

            setRoleOptions(formatted);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
        }
    }, [token]);
    const handleRoleCreate = useCallback(async (name, perms) => {
        try {
            await fetch(`${API_BASE_URL}/api/admin/role`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: name }),
            });

            await fetchRoles();
        } catch (error) {
            console.error("Create role error:", error);
        }
    }, [token, fetchRoles]);

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



    const fetchPermission = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/role/permission`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();
            const permissions = result.data || [];
            console.log('permissions', permissions)
            setPermissions(permissions);

        } catch (error) {
            console.error("Failed to fetch roles:", error);
        }
    }, [token]);
    const handlePermissionCreate = useCallback(async (rolePermissions) => {
        try {
            // rolePermissions example:
            // [
            //   { roleId: 1, permissions: [1, 2] },
            //   { roleId: 2, permissions: [2, 3] }
            // ]

            const response = await fetch(`${API_BASE_URL}/api/admin/role/permission`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(rolePermissions),
            });

            if (!response.ok) throw new Error("Failed to update role permissions");

            const data = await response.json();
            console.log("Updated role-permission mapping:", data);

            // Refresh UI
            await fetchPermission();
            await fetchRoles();

            // Dynamic SweetAlert2
            showSuccess("Success!", `${rolePermissions.length} role(s) updated successfully!`);

        } catch (error) {
            console.error("Create role error:", error);

            // Error alert
            showError("Oops!", error.message || "Something went wrong");
        }
    }, [token, fetchRoles, fetchPermission]);

    const fetchKeyInfo = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/key-information/list`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json(); // ✅ parse once

            if (!response.ok) {
                throw new Error(result?.message || "Failed to fetch key information");
            }

            setKeyInfoData(result.data);

        } catch (error) {
            console.error("Failed to fetch key info:", error);

            // ✅ show backend error in swal
            showError(error.message || "Something went wrong while fetching key info");
        } finally {
            setLoading(false);
        }
    }, [token]);


    const KeyInformationCreate = useCallback(async (keyinfo, service) => {
        try {
            await fetch(`${API_BASE_URL}/api/admin/key-information`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ keyInformation: [keyinfo], serviceType: service }),
            });

            await fetchKeyInfo();
        } catch (error) {
            console.error("Key Info error:", error);
        }
    }, [token, fetchKeyInfo]);

    const fetchDashboard = useCallback(async (params = {}) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const { studentName, venueName, filterTypes = [], fromDate, toDate } = params;

        // build query params
        const searchParams = new URLSearchParams();

        if (studentName) searchParams.append("studentName", studentName);
        if (venueName) searchParams.append("venueName", venueName);

        // support multiple filterTypes
        filterTypes.forEach((ft) => searchParams.append("filterType", ft));

        if (fromDate) searchParams.append("fromDate", fromDate);
        if (toDate) searchParams.append("toDate", toDate);

        const query = searchParams.toString();
        const url = `${API_BASE_URL}/api/admin/dashboard/stats${query ? `?${query}` : ""}`;

        console.log("🚀 Fetching:", url);

        setLoading(true);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setDashboardData(result);
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, []);


    return (
        <MemberContext.Provider value={{
            members, activeTab, handlePermissionCreate, fetchPermission, setActiveTab, setMembers, fetchMembers, loading, roleOptions,
            fetchRoles,
            showRoleModal,
            fetchKeyInfo,
            keyInfoData,
            KeyInformationCreate,
            setShowRoleModal,
            roleName,
            setRoleName,
            permissions,
            setPermissions,
            handleRoleCreate,
            verifyToken,
            fetchDashboard,
            dashboardData
        }}>
            {children}
        </MemberContext.Provider>
    );
};

export const useMembers = () => useContext(MemberContext);
