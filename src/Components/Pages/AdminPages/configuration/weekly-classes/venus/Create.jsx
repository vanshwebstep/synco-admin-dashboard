import { useState, useEffect } from "react";
import { useVenue } from "../../../contexts/VenueContext";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { ChevronDown } from "lucide-react"; // you can replace with plain "<" if you prefer
import { showError } from "../../../../../../utils/swalHelper";

const Create = ({ groups, termGroup }) => {


  const { formData, setFormData, createVenues, isEditVenue, updateVenues, setIsEditVenue, openForm, setOpenForm } = useVenue();


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedTermIds, setSelectedTermIds] = useState([]);
  const validateForm = () => {
    if (!formData.area?.trim()) return 'Area is required';
    if (!formData.name?.trim()) return 'Name of Venue is required';
    if (!formData.address?.trim()) return 'Address is required';
    if (!formData.facility) return 'Please select Facility (Indoor/Outdoor)';
    if (formData.hasParking && !formData.parkingNote?.trim()) return 'Please add a Parking Note';
    if (formData.isCongested && !formData.howToEnterFacility?.trim()) return 'Please add a Congestion Note';
    if (selectedTermIds.length === 0) return 'Please select at least one Term Date Linkage';
    return null; // ✅ valid
  };

  const handleSubmit = () => {
    const err = validateForm();
    if (err) {
      showError("Validation Error", err);

      return; // stop here
    }

    // Success flow
    // console.log("Venue Submitted:", formData);
    createVenues(formData);


  };


  const handleCancel = () => {
    setFormData({
      area: "", name: "", address: "", facility: "",
      hasParking: false, isCongested: false, hasStarterPack: false, parkingNote: "",
      howToEnterFacility: "", termGroupId: [], paymentGroupId: ""
    });
    setIsEditVenue(false);
    setOpenForm(null);

  };

  // console.log('formData', formData)
  const toggleValue = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };
  const handleUpdate = (id) => {
    const err = validateForm();
    if (err) {
      showError("Validation Error", err);

      return; // stop here, don't close
    }

    // Normalize termGroupId
    let termGroupId = formData.termGroupId;

    if (!Array.isArray(termGroupId)) {
      try {
        termGroupId = JSON.parse(termGroupId);
      } catch (e) {
        console.warn("termGroupId is not JSON, converting to array:", termGroupId);
        termGroupId = termGroupId ? [Number(termGroupId)] : [];
      }
    }

    // ensure all elements are numbers
    termGroupId = termGroupId.map(x => Number(x));

    console.log("Normalized termGroupId:", termGroupId);

    // Create updated data object
    const updatedVenueData = { ...formData, termGroupId };

    // Send normalized data to API
    updateVenues(id, updatedVenueData);

    // Reset form
    setFormData({
      area: "", name: "", address: "", facility: "",
      hasParking: false, isCongested: false, hasStarterPack: false, parkingNote: "",
      howToEnterFacility: "", termGroupId: [], paymentGroupId: ""
    });

  };






  const handleSaveTerm = () => {
    setFormData((prev) => ({
      ...prev,
      termGroupId: selectedTermIds, // now just an array
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



  const termOptions = Array.isArray(termGroup)
    ? termGroup.map((group) => {
      if (!group?.id || !group?.name) return null;

      const label = `${group.name.replace(/^(Saturday|Sunday|Tuesday)\s?/i, "")}`.trim();

      return {
        id: group.id,
        label,
      };
    }).filter(Boolean)
    : [];


  const toggleTermId = (id) => {
    setSelectedTermIds((prev) => {
      const current = Array.isArray(prev) ? prev : [];

      const updated = current.includes(id)
        ? current.filter(i => i !== id)
        : [...current, id];

      // auto-save to formData
      setFormData(prevForm => ({
        ...prevForm,
        termGroupId: updated,
      }));

      return updated;
    });
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

  // console.log(subOptions);


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

    console.log('formData.termGroupId', formData.termGroupId);

    // Handle term group ID
    if (formData?.termGroupId != null) {
      try {
        const parsedTermGroup = Array.isArray(formData.termGroupId)
          ? formData.termGroupId
          : JSON.parse(formData.termGroupId);
        setSelectedTermIds(parsedTermGroup);
      } catch {
        setSelectedTermIds([]);
      }
    }
  }, [formData]);

  console.log('selectedTermIds', selectedTermIds)
  // ✅ First one (line ~140):
  const labels = Array.isArray(termOptions) && Array.isArray(selectedTermIds)
    ? termOptions
      .filter(opt => opt && selectedTermIds.includes(opt.id))
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

        <div className="flex py-2 flex-wrap items-center justify-between gap-6">
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

          {/* TERM DATE */}
          <div className="w-full max-w-xl">
            <label className="block font-semibold text-[16px] pb-2">
              Term Date Linkage
            </label>
            <div
              onClick={() => setShowTermDropdown(!showTermDropdown)}
              className="w-full border border-[#E2E1E5] rounded-xl p-4 text-sm text-[#717073] bg-white relative cursor-pointer 
  after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 
  after:w-2 after:h-2 after:border-r-2 after:border-b-2 after:border-[#717073] after:rotate-45"
            >
              {labels.length > 0
                ? labels.join(", ")
                : "Select Term Date Group"}
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
                  <p className="font-semibold text-[17px]">Select Term Date Group</p>
                  {termOptions.map((group) => (
                    <label key={group.id} className="flex items-center gap-2 text-[15px]">
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedTermIds) && selectedTermIds.includes(group.id)}
                        onChange={() => {
                          toggleTermId(group.id);
                        }}

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

          {/* SUBSCRIPTION PLAN */}
          <div className="w-full">
            <label className="block font-semibold text-[16px] pb-2">
              Subscription Plan Linkage
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
                  <p className="font-semibold text-[17px]">Select Available Subscription Plan</p>
                  {subOptions?.map((plan) => (
                    <label key={plan.id} className="flex items-center gap-2 text-[15px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSub === plan.id}
                        onChange={() => {
                          setSelectedSub(plan.id);
                          setFormData(prev => ({
                            ...prev,
                            paymentGroupId: plan.id,
                          }));
                          setShowSubDropdown(false); // auto close feels right
                        }}
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
         {/* Starter Pack Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="block font-semibold text-[16px]">Starter Pack</span>
            <input
              type="checkbox"
              name="hasStarterPack"
              checked={formData.hasStarterPack}
              onChange={(e) => {
                const { checked } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  hasStarterPack: checked,
                }));
              }}
              className="sr-only"
            />
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300
      ${formData.hasStarterPack ? 'bg-[#5372FF] justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </label>

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
