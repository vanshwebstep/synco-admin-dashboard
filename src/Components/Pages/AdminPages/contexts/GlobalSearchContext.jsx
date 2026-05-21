import { createContext, useContext, useState, useCallback } from "react";

const GlobalSearchContext = createContext();

export const GlobalSearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredData, setRegisteredData] = useState([]);

  const registerTableData = useCallback((data) => { }, []);

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
