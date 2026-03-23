import React from "react";
import PermissionProtectedRoute from "./PermissionProtectedRoute";
import AdminLayout from "./Components/Layout/AdminLayout";
import ProtectedRoute from "./Components/ProtectedRoute";
const RoleBasedRoute = ({ children }) => {
    return children;
}
export const renderProtectedRoute = (Component, needPermissions = []) => (

    <ProtectedRoute>
        <AdminLayout>
            <RoleBasedRoute>
                <PermissionProtectedRoute
                    element={<Component />}
                    needPermissions={needPermissions}
                />
            </RoleBasedRoute>
        </AdminLayout>
    </ProtectedRoute>
);
