import React from "react";
import { useMembers } from "../contexts/MemberContext";

const RoleModal = () => {
  const {
    showRoleModal,
    setShowRoleModal,
    roleName,
    setRoleName,
    roleOptions,
    permissions,
    setPermissions,
    handleRoleCreate,
  } = useMembers();

  const handlePermissionToggle = (perm) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = () => {
    if (!roleName.trim()) return;
    handleRoleCreate(roleName, permissions);
    setRoleName("");
    setPermissions([]);
    setShowRoleModal(false);
  };

  if (!showRoleModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl w-[90%] max-w-sm p-6 relative shadow-lg">
        <button
          onClick={() => setShowRoleModal(false)}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          title="Close"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold text-center mb-5">Create New Role</h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Role Name
          </label>
          <input
            type="text"
            value={roleName}
            onKeyPress={(e) => {
              // Prevent numbers from being entered
              if (/\d/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => setRoleName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter role name"
          />
        </div>

        {roleOptions.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Permissions
            </label>
            <div className="block gap-3 items-center max-h-40 overflow-y-auto pr-1 flex-wrap">
              {roleOptions.map((role) => (
                <label key={role.value} className="inline-flex w-full items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={permissions.includes(role.label)}
                    onChange={() => handlePermissionToggle(role.label)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  {role.label}
                </label>

              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Create
        </button>
      </div>

    </div>
  );
};

export default RoleModal;
