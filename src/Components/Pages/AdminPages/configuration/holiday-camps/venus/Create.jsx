import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { useHolidayVenue } from "../../../contexts/HolidayVenueContext";
import { showError } from "../../../../../../utils/swalHelper";

const Create = ({ groups, termGroup }) => {


  const { formData, setFormData, createVenues, isEditVenue, updateVenues, setIsEditVenue, openForm, setOpenForm } = useHolidayVenue();


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedTermIds, setSelectedTermIds] = useState([]);
  const validateForm = () => {
    if (!formData.area?.trim()) return 'Area is required';
    if (!formData.name?.trim()) return 'Name of Venue is required';
    if (!formData.address?.trim()) return 'Address is required';
    if (!formData.facility) return 'Please select Facility (Indoor/Outdoor)';
    if (formData.hasParking && !formData.parkingNote?.trim()) return 'Please add a Parking Note';
    if (formData.isCongested && !formData.howToEnterFacility?.trim()) return 'Please add a Congestion Note';
    if (selectedTermIds.length === 0) return 'Please select at least one Camp Date Linkage';
    return null; // ✅ valid
  };

  const handleSubmit = () => {
    const err = validateForm();
    if (err) {
      showError('Validation Error', err);
      
      return; // stop here
    }

    // Success flow
    createVenues(formData);


  };


  const handleCancel = () => {
    setFormData({
      area: "", name: "", address: "", facility: "",
      hasParking: false, isCongested: false, parkingNote: "",
      howToEnterFacility: "", holidayCampId: [], paymentGroupId: ""
    });
    setIsEditVenue(false);
    setOpenForm(null);

  };
  console.log('formData', formData)


  const handleUpdate = (id) => {
    const err = validateForm();
    if (err) {
      showError('Validation Error', err);
      return; // stop here, don't close
    }

    // Normalize holidayCampIds
 let holidayCampId = formData.holidayCampId;

// Step 1: Parse if string
if (typeof holidayCampId === "string") {
  try {
    holidayCampId = JSON.parse(holidayCampId);
  } catch {
    holidayCampId = holidayCampId ? [Number(holidayCampId)] : [];
  }
}

// Step 2: Ensure array + flatten
holidayCampId = Array.isArray(holidayCampId)
  ? holidayCampId.flat(Infinity).map(Number)
  : holidayCampId
  ? [Number(holidayCampId)]
  : [];

console.log("Final holidayCampId:", holidayCampId);




    // Create updated data object
    const updatedVenueData = { ...formData, holidayCampId: holidayCampId, };

    // Send normalized data to API
    updateVenues(id, updatedVenueData);

    // Reset form

  };






  const handleSaveTerm = () => {
    setFormData((prev) => ({
      ...prev,
      holidayCampId: isEditVenue ? selectedTermIds : selectedTermIds, // now just an array
    }));
    setShowTermDropdown(false);
  };

  const handleSaveSub = () => {
    setFormData((prev) => ({
      ...prev,
      paymentGroupId: selectedSub, // now just an array
    }));
    setShowSubDropdown(false);
  };

  // Helper: Get day suffix (st, nd, rd, th)
  function getDaySuffix(day) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  // Helper: Format date to "Sat 31st" OR "Tue 2nd June 2025"
  function formatHolidayDate(dateString, includeMonthYear = false) {
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = getDaySuffix(day);

    const weekday = date.toLocaleString("en-US", { weekday: "short" });
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    if (includeMonthYear) {
      return `${weekday} ${day}${suffix} ${month} ${year}`;
    }
    return `${weekday} ${day}${suffix}`;
  }

  // Main options
  const termOptions = Array.isArray(termGroup)
    ? termGroup
      .map((group) => {
        if (!group?.id || !group?.startDate || !group?.endDate) return null;

        const start = formatHolidayDate(group.startDate, false);  // Sat 31st
        const end = formatHolidayDate(group.endDate, true);       // Tue 2nd June 2025

        const label = `${start} - ${end}`;

        return {
          id: group.holidayCampId,
          label,
        };
      })
      .filter(Boolean)
    : [];

  const toggleTermId = (id) => {
    setSelectedTermIds(id);
  };





  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
  };

  const subOptions = Array.isArray(groups)
    ? groups.map(pkg => {
      if (!pkg?.id || !pkg?.name) return null;
      return { id: pkg.id, label: pkg.name };
    }).filter(Boolean)
    : [];



  useEffect(() => {
    // Handle subscription group ID
    if (formData?.paymentGroupId != null) {
      try {
        const parsed = Array.isArray(formData.paymentGroupId)
          ? formData.paymentGroupId
          : JSON.parse(formData.paymentGroupId);
        setSelectedSub(parsed);
      } catch {
        setSelectedSub(null);
      }
    }


    // Handle term group ID
    if (formData?.holidayCampId) {
      try {
        const parsed = JSON.parse(formData.holidayCampId); // gives array like [46]
        if (Array.isArray(parsed)) {
          setSelectedTermIds(parsed[0]); // set the first element as number
        } else {
          setSelectedTermIds(parsed);
        }
      } catch (e) {
        // fallback if parsing fails
        setSelectedTermIds(Number(formData.holidayCampId));
      }
    }

  }, [formData]);

  // ✅ First one (line ~140):
  const labels = Array.isArray(termOptions) && selectedTermIds != null
    ? termOptions
      .filter(opt => opt && opt.id === selectedTermIds)
      .map(opt => opt.label)
      .filter(Boolean)
    : [];

  const facilityOptions = [
    // { value: "", label: "Facility" },  
    { value: "Indoor", label: "Indoor" },
    { value: "Outdoor", label: "Outdoor" },
  ];
  return (
    <div className="max-w-md mx-auto">
      <h2 onClick={handleCancel} className="md:text-[24px] cursor-pointer hover:opacity-80 font-semibold mb-4 flex gap-2 items-center border-[#E2E1E5] border-b p-5"><img src="/members/Arrow - Left.png" className="w-6" alt="" />{isEditVenue ? 'Edit Venue' : 'Add New Venue'}</h2>
      <form className="space-y-2  p-5 pt-1">

        <div>
          <label className="block font-semibold text-[16px] pb-2">Area</label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            className="w-full border border-[#E2E1E5] rounded-xl p-4 text-sm"
          />
        </div>

        <div>
          <label className="block font-semibold text-[16px] pb-2">Name of Venue</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border border-[#E2E1E5] rounded-xl p-4 text-sm"
          />
        </div>

        <div>
          <label className="block font-semibold text-[16px] pb-2">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full border border-[#E2E1E5] rounded-xl p-4 text-sm"
          />
        </div>

        <div>
          <label className="block font-semibold text-[16px] pb-2">Facility</label>
          <Select
            name="facility"
            value={facilityOptions.find(option => option.value === formData.facility)}
            onChange={(selectedOption) =>
              handleInputChange({ target: { name: "facility", value: selectedOption.value } })
            }
            components={{
              IndicatorSeparator: () => null, // 🚀 removes the "|" separator
            }}
            options={facilityOptions}
            className="w-full text-sm"
            classNamePrefix="react-select"
          />
        </div>

        <div className="flex py-2 items-center justify-between gap-6">
          {/* Parking Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="block font-semibold text-[16px]">Parking</span>
            <input
              type="checkbox"
              name="hasParking"
              checked={formData.hasParking}
              onChange={(e) => {
                const { checked } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  hasParking: checked,
                  parkingNote: checked ? prev.parkingNote : '',
                }));
              }}
              className="sr-only"
            />
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300
      ${formData.hasParking ? 'bg-[#5372FF] justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </label>

          {/* Congestion Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="block font-semibold text-[16px]">Congestion</span>
            <input
              type="checkbox"
              name="isCongested"
              checked={formData.isCongested}
              onChange={(e) => {
                const { checked } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  isCongested: checked,
                }));
              }}
              className="sr-only"
            />
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300
      ${formData.isCongested ? 'bg-[#5372FF] justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </label>
        </div>

        {/* Conditionally Render Textareas */}
        {formData.hasParking && (
          <div>
            <textarea
              rows={3}
              name="parkingNote"
              value={formData.parkingNote}
              onChange={handleInputChange}
              placeholder="Add a parking note"
              className="w-full border bg-[#FAFAFA] border-[#E2E1E5] rounded-xl p-4 text-sm"
            />
          </div>
        )}


        <div>
          <label className="block font-semibold text-[16px] pb-2">How to enter facility</label>
          <textarea
            name="howToEnterFacility"
            value={formData.howToEnterFacility}
            onChange={handleInputChange}
            className="w-full border bg-[#FAFAFA] border-[#E2E1E5] rounded-xl p-4 text-sm"
            rows={3}
            placeholder="Add notes"
          />
        </div>



        <div className="space-y-6 max-w-md">

          {/* Camp Date */}
          <div className="w-full max-w-xl">
            <label className="block font-semibold text-[16px] pb-2">
              Holiday Camp Date Linkage
            </label>
            <div
              onClick={() => setShowTermDropdown(!showTermDropdown)}
              className="w-full border border-[#E2E1E5] rounded-xl p-4 text-sm text-[#717073] bg-white relative cursor-pointer 
  after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 
  after:w-2 after:h-2 after:border-r-2 after:border-b-2 after:border-[#717073] after:rotate-45"
            >
              {labels.length > 0
                ? labels.join(", ")
                : "Select Camp Date Group"}
            </div>

            <AnimatePresence>
              {showTermDropdown && (
                <motion.div
                  className="w-full bg-white rounded-2xl shadow p-4 space-y-2 mt-2"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dropdownVariants}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-semibold text-[17px]">Select Camp Date Group</p>
                  {termOptions.map((group) => (
                    <label key={group.id} className="flex items-center gap-2 text-[15px] cursor-pointer">
                      <input
                        type="radio"
                        name="termOption" // all radios share this name
                        checked={selectedTermIds === group.id}  // use singular selectedTermId
                        onChange={() => toggleTermId(group.id)}
                        className="accent-blue-600"
                      />
                      {group.label}
                    </label>
                  ))}

                  <button
                    type="button"
                    onClick={handleSaveTerm}
                    className="w-full bg-[#237FEA] hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-2"
                  >
                    Save
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Payment Plan */}
          <div className="w-full">
            <label className="block font-semibold text-[16px] pb-2">
              Payment Plan Linkage
            </label>
            <div
              onClick={() => setShowSubDropdown(!showSubDropdown)}
              className="w-full border border-[#E2E1E5] rounded-xl p-4 text-sm text-[#717073] bg-white relative cursor-pointer
  after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 
  after:w-2 after:h-2 after:border-r-2 after:border-b-2 after:border-[#717073] after:rotate-45 min-h-[40px] flex items-center"
            >
              {selectedSub
                ? subOptions.find(opt => opt.id === selectedSub)?.label
                : <span className="invisible">placeholder</span>}
            </div>


            <AnimatePresence>
              {showSubDropdown && (
                <motion.div
                  className="w-full bg-white rounded-2xl shadow p-4 space-y-2 mt-2"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dropdownVariants}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-semibold text-[17px]">Select Available Payment Plan</p>
                  {subOptions?.map((plan) => (
                    <label key={plan.id} className="flex items-center gap-2 text-[15px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSub === plan.id}
                        onChange={() => setSelectedSub(plan.id)}
                        className="accent-blue-600"
                      />
                      {plan.label}
                    </label>
                  ))}

                  <button
                    type="button"
                    onClick={handleSaveSub}
                    className="w-full bg-[#237FEA] hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-2"
                  >
                    Save
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


        </div>

        {/* BUTTONS */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="w-1/2 mr-2 py-3 font-semibold border border-[#E2E1E5] rounded-xl text-[18px] text-[#717073] hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              if (isEditVenue) {
                handleUpdate(formData.id);
              } else {
                handleSubmit();
              }
            }}
            className="w-1/2 ml-2 py-3 font-semibold bg-[#237FEA] text-white rounded-xl text-[18px] hover:bg-blue-700"
          >
            {isEditVenue ? 'Update' : 'Add'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Create;
