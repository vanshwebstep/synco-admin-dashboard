import React from "react";
import PermissionProtectedRoute from "./PermissionProtectedRoute";
import AdminLayout from "./Components/Layout/AdminLayout";
import ProtectedRoute from "./Components/ProtectedRoute";
import { GlobalSearchProvider } from "./Components/Pages/AdminPages/contexts/GlobalSearchContext";
const RoleBasedRoute = ({ children }) => {
    return children;
}
export const renderProtectedRoute = (Component, needPermissions = []) => (

    <ProtectedRoute>
        <GlobalSearchProvider>
        <AdminLayout>
            <RoleBasedRoute>
                <PermissionProtectedRoute
                    element={<Component />}
                    needPermissions={needPermissions}
                />
            </RoleBasedRoute>
        </AdminLayout>
        </GlobalSearchProvider>
    </ProtectedRoute>
);
