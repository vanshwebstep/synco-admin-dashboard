import React, { createContext, useContext, useCallback } from "react";

// Create Context
const PermissionContext = createContext();

// Provider Component
export const PermissionProvider = ({ children }) => {
  const checkPermission = useCallback(({ module, action }) => {
    const stored = JSON.parse(localStorage.getItem("hasPermission") || "[]");

 
    if (!module || !action || !Array.isArray(stored)) {
      return false;
    }
console.log()
    const result = stored.some(
      (perm) =>
        perm.module?.toLowerCase() === module.toLowerCase() &&
        perm.action?.toLowerCase() === action.toLowerCase()
    );

 
    return result;
  }, []);

  return (
    <PermissionContext.Provider value={{ checkPermission }}>
      {children}
    </PermissionContext.Provider>
  );
};

// Custom hook
export const usePermission = () => {
  return useContext(PermissionContext);
};
