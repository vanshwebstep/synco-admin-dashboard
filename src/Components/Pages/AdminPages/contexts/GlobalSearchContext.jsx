import { createContext, useContext, useState, useCallback } from "react";

const GlobalSearchContext = createContext();

export const GlobalSearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredData, setRegisteredData] = useState([]);

  const registerTableData = useCallback((data) => {
    setRegisteredData((prev) => {
      // Merge karo — duplicate id/bookingId remove karo
      const existingMap = new Map();

      [...prev, ...data].forEach((row) => {
        const key =
          row?.bookingId ||
          row?.id ||
          null;

        if (!key) return;

        // Same key already hai — skip (pehla wala rakho)
        if (!existingMap.has(key)) {
          existingMap.set(key, row);
        }
      });

      return Array.from(existingMap.values());
    });
  }, []);

  // Search clear hone pe registered data bhi clear karo
  const clearRegisteredData = useCallback(() => {
    setRegisteredData([]);
  }, []);

  return (
    <GlobalSearchContext.Provider
      value={{ searchQuery, setSearchQuery, registeredData, registerTableData, clearRegisteredData }}
    >
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearch = () => useContext(GlobalSearchContext);