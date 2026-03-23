import React, { useEffect, useState, useMemo } from "react";
import { Check } from "lucide-react";
import { useMembers } from "../contexts/MemberContext";
import { Loader2 } from "lucide-react"; // spinner icon
import Loader from '../contexts/Loader';
import { usePermission } from "../Common/permission";

const PermissionList = () => {
  const {
    fetchRoles,
    fetchPermission,
    roleOptions,
    permissions,
    handlePermissionCreate,
  } = useMembers();
  const { checkPermission } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  // Selected permissions state
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({}); // keep baseline
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    Promise.all([fetchPermission(), fetchRoles()])
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false); // still stop loading even on error
      });
  }, [fetchPermission, fetchRoles]);

  // Prefill selected permissions when roles data is available
  useEffect(() => {
    if (permissions?.roles) {
      const prefill = {};
      const baseline = {};
      permissions.roles.forEach((role) => {
        const permIds = role.permissions.map((p) => p.id);
        prefill[role.id] = new Set(permIds);
        baseline[role.id] = new Set(permIds);
      });
      setSelectedPermissions(prefill);
      setOriginalPermissions(baseline);
    }
  }, [permissions]);

  const roles =
    roleOptions?.length > 0
      ? roleOptions
      : permissions?.roles?.map((r) => ({
        value: r.id,
        label: r.role,
      })) || [];

  const toggleCheckbox = (permId, roleId) => {
    setSelectedPermissions((prev) => {
      const rolePerms = prev[roleId] || new Set();
      const newRolePerms = new Set(rolePerms);

      if (newRolePerms.has(permId)) {
        newRolePerms.delete(permId);
      } else {
        newRolePerms.add(permId);
      }

      return { ...prev, [roleId]: newRolePerms };
    });
  };

  // Filter
  const filteredPermissions = useMemo(() => {
    if (!permissions?.permissions) return [];
    return permissions.permissions.filter(
      (perm) =>
        perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [permissions, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
  const paginatedPermissions = filteredPermissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Save handler → only send changed ones
  const handleSave = async () => {
    const payload = [];

    Object.entries(selectedPermissions).forEach(([roleId, newPerms]) => {
      const original = originalPermissions[roleId] || new Set();

      const isSame =
        newPerms.size === original.size &&
        [...newPerms].every((p) => original.has(p));

      if (!isSame) {
        payload.push({
          roleId: Number(roleId),
          permissions: Array.from(newPerms),
        });
      }
    });

     console.log("SAVE PAYLOAD 👉", payload);
    if (payload.length > 0) {
      try {
        setSubmitLoading(true);
        await handlePermissionCreate(payload); // assume async
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }

  // Check user permissions
  const canView = checkPermission({ module: 'admin-role', action: 'view-listing' });
  const canCreate = checkPermission({ module: 'admin-role', action: 'create' });
  const canUpdate = checkPermission({ module: 'admin-role', action: 'update' });

  // Determine global disable state
// User can only view if they have view permission but cannot create or update
const isViewOnly = canView && !(canCreate && canUpdate);

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by module or action..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-xl px-4 py-2 w-full sm:w-1/2"
        />
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
            <tr className="font-semibold text-[#717073]">
              <th className="p-4">Permission</th>
              {roles.map((role) => (
                <th key={role.value} className="p-4 text-left">
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
      {paginatedPermissions.length === 0 ? (
        <tr>
          <td
            colSpan={roles.length + 1}
            className="p-6 text-center text-[#717073] font-medium"
          >
            No data available
          </td>
        </tr>
      ) : (
        paginatedPermissions.map((perm) => (
          <tr
            key={perm.id}
            className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50"
          >
            <td className="p-4">
              {perm.module} - {perm.action}
            </td>

            {roles.map((role) => {
              const isChecked =
                selectedPermissions[role.value]?.has(perm.id);

              const isSuperAdminLock =
                role.label === "Super Admin" &&
                perm.module === "admin-role";

              const isDisabled = isSuperAdminLock || isViewOnly;

              return (
                <td key={role.value} className="p-4 text-center">
                  <button
                    onClick={() =>
                      !isDisabled && toggleCheckbox(perm.id, role.value)
                    }
                    disabled={isDisabled}
                    className={`w-5 h-5 flex items-center justify-center rounded-md border-2
                      ${isChecked ? "border-gray-500 bg-blue-600" : "border-gray-300"}
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isChecked && (
                      <Check
                        size={16}
                        strokeWidth={3}
                        className="text-white"
                      />
                    )}
                  </button>
                </td>
              );
            })}
          </tr>
        ))
      )}
    </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4 items-center">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end mt-5">
        <button
          onClick={handleSave}
          disabled={submitLoading || isViewOnly}
          className={`bg-[#237FEA] flex items-center justify-center gap-2 cursor-pointer 
    text-white px-6 py-3 rounded-2xl hover:bg-blue-700 
    ${isViewOnly ? 'opacity-50 cursor-not-allowed' : ''} 
    text-base md:text-lg font-semibold min-w-[140px] disabled:opacity-70`}
        >
          {submitLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </span>
          ) : (
            "SAVE"
          )}
        </button>

      </div>
    </div>
  );
};

export default PermissionList;
