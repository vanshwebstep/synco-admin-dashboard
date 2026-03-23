// SessionPlanSelect.js

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Search } from 'lucide-react';
import { useSessionPlan } from '../../../contexts/SessionPlanContext';
import { useHolidaySessionPlan } from '../../../contexts/HolidaySessionPlanContext';





const customStyles = {

  control: (base, state) => ({
    ...base,
    borderRadius: '1rem',
    borderColor: state.isFocused ? '#237FEA' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(35, 127, 234, 0.3)' : 'none',
    fontWeight: 600,
    fontSize: '15px',
    // paddingLeft: '36px',
    height: '50px',
    backgroundColor: '#fff',
  }),
  option: (base, state) => ({
    ...base,
    opacity: state.isDisabled ? 0.4 : 1,
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',

    backgroundColor: state.isFocused ? '#F2F2F2' : '#fff',
    color: '#000',
    fontWeight: 600,
    fontSize: '15px',
    paddingTop: '10px',
    paddingBottom: '10px',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '12px',
    marginTop: 2,
    overflow: 'hidden',
    zIndex: 20,
  }),
  placeholder: (base) => ({
    ...base,
    color: '#a1a1aa',
  }),
};

const SessionPlanSelect = ({ idx = 0, label = '', value, onChange, usedSessionPlans = [] }) => {

  const { fetchSessionGroup, sessionGroup, loading } = useHolidaySessionPlan();
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
     const getPackages = async () => {
       try {
         const response = await fetchSessionGroup();
         console.log("Fetched packages:", response);
       } catch (error) {
         console.error("Error fetching packages:", error);
       }
     };
     getPackages();
   }, [fetchSessionGroup]);
 
   useEffect(() => {
     if (sessionGroup?.length > 0) {
       const transformedWeeks = sessionGroup.map((group) => ({
         value: group.id,
         label: group.groupName,
         isDisabled: usedSessionPlans.includes(group.id), // <-- DISABLE IF USED
       }));
 
       setOptions(transformedWeeks);
     }
   }, [sessionGroup, usedSessionPlans]);


  // Sync selected value when options or value change
   useEffect(() => {
      if (options.length > 0 && value) {
        const matched = options.find((opt) => opt.value === value);
        setSelectedOption(matched || null);
      }
    }, [value, options]);
  
    const handleChange = (option) => {
      setSelectedOption(option);
      if (onChange) {
        onChange(idx, 'sessionPlanId', option?.value || '');
      }
    };

  return (
    <div className="relative w-full mb-5">
      {loading ? (

        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-2xl px-4 py-3 mb-4 shadow-sm">
          Loading...
        </div>
      ) : (
        <Select
          options={options}
          value={selectedOption}
          isClearable={true}   
          onChange={handleChange}
          placeholder="Search Session Plan Group"
          styles={customStyles}
          isSearchable
        />
      )}
    </div>

  );
};

export default SessionPlanSelect;
