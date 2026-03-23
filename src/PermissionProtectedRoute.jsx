import React from "react";
import { Navigate } from "react-router-dom";
import { usePermission } from "./Components/Pages/AdminPages/Common/permission";

const PermissionProtectedRoute = ({ element, needPermissions = [] }) => {
  const { checkPermission } = usePermission();

  // ✅ If no permissions required, allow access
  // console.log('needPermissions',needPermissions)
  if (!needPermissions || needPermissions.length === 0) return element;
  // ✅ Check if user has *any* of the required permissions
  const hasPermission = needPermissions.some((perm) => checkPermission(perm));
// console.log('hasPermission',hasPermission)
  // ❌ No valid permission → redirect to home
  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default PermissionProtectedRoute;
