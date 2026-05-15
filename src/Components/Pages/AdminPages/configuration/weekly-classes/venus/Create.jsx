import { useState, useEffect, useRef } from "react";
import { useVenue } from "../../../contexts/VenueContext";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { showError } from "../../../../../../utils/swalHelper";

const Create = ({ groups, termGroup }) => {
  const { formData, setFormData, createVenues, isEditVenue, updateVenues, setIsEditVenue, openForm, setOpenForm } = useVenue();

  // ── inline error state ──
  const [fieldErrors, setFieldErrors] = useState({});

  // ── refs for scroll-to-error ──
  const areaRef = useRef(null);
  const nameRef = useRef(null);
  const addressRef = useRef(null);
  const facilityRef = useRef(null);
  const parkingNoteRef = useRef(null);
  const howToEnterRef = useRef(null);
  const termRef = useRef(null);

  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedTermIds, setSelectedTermIds] = useState([]);

  // ── helpers ──
  const clearError = (key) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const fieldClass = (key) =>
    `w-full border rounded-xl p-4 text-sm ${fieldErrors[key]
      ? "border-[#F04438] bg-red-50"
      : "border-[#E2E1E5]"
    }`;

  const ErrorMsg = ({ name }) =>
    fieldErrors[name] ? (
      <p className="text-[#F04438] text-[12px] mt-1">{fieldErrors[name]}</p>
    ) : null;

  // ── validation ──
  const validateForm = () => {
    const newErrors = {};

    if (!formData.area?.trim()) newErrors.area = "Area is required";
    if (!formData.name?.trim()) newErrors.name = "Name of Venue is required";
    if (!formData.address?.trim()) newErrors.address = "Address is required";
    if (!formData.facility) newErrors.facility = "Please select Facility (Indoor/Outdoor)";
    if (formData.hasParking && !formData.parkingNote?.trim())
      newErrors.parkingNote = "Please add a Parking Note";
    if (formData.isCongested && !formData.howToEnterFacility?.trim())
      newErrors.howToEnterFacility = "Please add a Congestion Note";
    if (selectedTermIds.length === 0) newErrors.termGroupId = "Please select at least one Term Date Linkage";

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // scroll to first error
      const refMap = {
        area: areaRef,
        name: nameRef,
        address: addressRef,
        facility: facilityRef,
        parkingNote: parkingNoteRef,
        howToEnterFacility: howToEnterRef,
        termGroupId: termRef,
      };

      const firstKey = Object.keys(newErrors)[0];
      setTimeout(() => {
        refMap[firstKey]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      return false;
    }

    return true;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearError(name);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createVenues(formData);
  };

  const handleCancel = () => {
    setFormData({
      area: "", name: "", address: "", facility: "",
      hasParking: false, isCongested: false, starterPack: false, parkingNote: "",
      howToEnterFacility: "", termGroupId: [], paymentGroupId: ""
    });
    setFieldErrors({});
    setIsEditVenue(false);
    setOpenForm(null);
  };

  const handleUpdate = (id) => {
    if (!validateForm()) return;

    let termGroupId = formData.termGroupId;
    if (!Array.isArray(termGroupId)) {
      try { termGroupId = JSON.parse(termGroupId); }
      catch { termGroupId = termGroupId ? [Number(termGroupId)] : []; }
    }
    termGroupId = termGroupId.map(x => Number(x));

    const updatedVenueData = { ...formData, termGroupId };
    updateVenues(id, updatedVenueData);
    setFormData({
      area: "", name: "", address: "", facility: "",
      hasParking: false, isCongested: false, starterPack: false, parkingNote: "",
      howToEnterFacility: "", termGroupId: [], paymentGroupId: ""
    });
  };

  const toggleTermId = (id) => {
    setSelectedTermIds((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const updated = current.includes(id)
        ? current.filter(i => i !== id)
        : [...current, id];
      setFormData(prevForm => ({ ...prevForm, termGroupId: updated }));
      if (updated.length > 0) clearError("termGroupId");
      return updated;
    });
  };

  const handleSaveTerm = () => {
    setFormData((prev) => ({ ...prev, termGroupId: selectedTermIds }));
    if (selectedTermIds.length > 0) clearError("termGroupId");
    setShowTermDropdown(false);
  };

  const handleSaveSub = () => {
    setFormData((prev) => ({ ...prev, paymentGroupId: selectedSub }));
    setShowSubDropdown(false);
  };

  const termOptions = Array.isArray(termGroup)
    ? termGroup.map((group) => {
      if (!group?.id || !group?.name) return null;
      const label = `${group.name.replace(/^(Saturday|Sunday|Tuesday)\s?/i, "")}`.trim();
      return { id: group.id, label };
    }).filter(Boolean)
    : [];

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
    if (formData?.paymentGroupId != null) {
      try {
        const parsed = Array.isArray(formData.paymentGroupId)
          ? formData.paymentGroupId
          : JSON.parse(formData.paymentGroupId);
        setSelectedSub(parsed);
      } catch { setSelectedSub(null); }
    }
    if (formData?.termGroupId != null) {
      try {
        const parsedTermGroup = Array.isArray(formData.termGroupId)
          ? formData.termGroupId
          : JSON.parse(formData.termGroupId);
        setSelectedTermIds(parsedTermGroup);
      } catch { setSelectedTermIds([]); }
    }
  }, [formData]);

  const labels = Array.isArray(termOptions) && Array.isArray(selectedTermIds)
    ? termOptions.filter(opt => opt && selectedTermIds.includes(opt.id)).map(opt => opt.label).filter(Boolean)
    : [];

  const facilityOptions = [
    { value: "Indoor", label: "Indoor" },
    { value: "Outdoor", label: "Outdoor" },
  ];

  return (
    <div className="max-w-md mx-auto">
      <h2
        onClick={handleCancel}
        className="md:text-[24px] cursor-pointer hover:opacity-80 font-semibold mb-4 flex gap-2 items-center border-[#E2E1E5] border-b p-5"
      >
        <img src="/members/Arrow - Left.png" className="w-6" alt="" />
        {isEditVenue ? "Edit Venue" : "Add New Venue"}
      </h2>

      <form className="space-y-2 p-5 pt-1">

        {/* Area */}
        <div ref={areaRef}>
          <label className="block font-semibold text-[16px] pb-2 poppins">Area</label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            className={fieldClass("area")}
          />
          <ErrorMsg name="area" />
        </div>

        {/* Name */}
        <div ref={nameRef}>
          <label className="block font-semibold text-[16px] pb-2 poppins">Name of Venue</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={fieldClass("name")}
          />
          <ErrorMsg name="name" />
        </div>

        {/* Address */}
        <div ref={addressRef}>
          <label className="block font-semibold text-[16px] pb-2 poppins">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={fieldClass("address")}
          />
          <ErrorMsg name="address" />
        </div>

        {/* Facility */}
        <div ref={facilityRef}>
          <label className="block font-semibold text-[16px] pb-2 poppins">Facility</label>
          <Select
            name="facility"
            value={facilityOptions.find(o => o.value === formData.facility) || null}
            onChange={(selected) => {
              handleInputChange({ target: { name: "facility", value: selected.value } });
              clearError("facility");
            }}
            components={{ IndicatorSeparator: () => null }}
            options={facilityOptions}
            className="w-full text-sm"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                borderColor: fieldErrors.facility ? "#ef4444" : base.borderColor,
                backgroundColor: fieldErrors.facility ? "#fef2f2" : base.backgroundColor,
              }),
            }}
          />
          <ErrorMsg name="facility" />
        </div>

        {/* Toggles */}
        <div className="flex py-2 flex-wrap items-center justify-between gap-6">
          {/* Parking Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="block font-semibold text-[16px] poppins">Parking</span>
            <input
              type="checkbox"
              name="hasParking"
              checked={formData.hasParking}
              onChange={(e) => {
                const { checked } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  hasParking: checked,
                  parkingNote: checked ? prev.parkingNote : "",
                }));
                if (!checked) clearError("parkingNote");
              }}
              className="sr-only"
            />
            <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${formData.hasParking ? "bg-[#5372FF] justify-end" : "bg-gray-300 justify-start"}`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-md" />
            </div>
          </label>

          {/* Congestion Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="block font-semibold text-[16px] poppins">Congestion</span>
            <input
              type="checkbox"
              name="isCongested"
              checked={formData.isCongested}
              onChange={(e) => {
                const { checked } = e.target;
                setFormData((prev) => ({ ...prev, isCongested: checked }));
                if (!checked) clearError("howToEnterFacility");
              }}
              className="sr-only"
            />
            <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${formData.isCongested ? "bg-[#5372FF] justify-end" : "bg-gray-300 justify-start"}`}>
              <div className="w-4 h-4 bg-white rounded-full shadow-md" />
            </div>
          </label>
        </div>

        {/* Parking Note */}
        {formData.hasParking && (
          <div ref={parkingNoteRef}>
            <textarea
              rows={3}
              name="parkingNote"
              value={formData.parkingNote}
              onChange={handleInputChange}
              placeholder="Add a parking note"
              className={`${fieldClass("parkingNote")} bg-[#FAFAFA]`}
            />
            <ErrorMsg name="parkingNote" />
          </div>
        )}

        {/* How to enter facility */}
        <div ref={howToEnterRef}>
          <label className="block font-semibold text-[16px] pb-2 poppins">How to enter facility</label>
          <textarea
            name="howToEnterFacility"
            value={formData.howToEnterFacility}
            onChange={handleInputChange}
            className={`${fieldClass("howToEnterFacility")} bg-[#FAFAFA]`}
            rows={3}
            placeholder="Add notes"
          />
          <ErrorMsg name="howToEnterFacility" />
        </div>

        <div className="space-y-6 max-w-md">

          {/* Term Date Linkage */}
          <div className="w-full max-w-xl" ref={termRef}>
            <label className="block font-semibold text-[16px] pb-2 poppins">Term Date Linkage</label>
            <div
              onClick={() => setShowTermDropdown(!showTermDropdown)}
              className={`w-full border rounded-xl p-4 text-sm text-[#717073] bg-white relative cursor-pointer
                after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2
                after:w-2 after:h-2 after:border-r-2 after:border-b-2 after:border-[#717073] after:rotate-45
                ${fieldErrors.termGroupId ? "border-[#F04438] bg-red-50" : "border-[#E2E1E5]"}`}
            >
              {labels.length > 0 ? labels.join(", ") : "Select Term Date Group"}
            </div>
            <ErrorMsg name="termGroupId" />

            <AnimatePresence>
              {showTermDropdown && (
                <motion.div
                  className="w-full bg-white rounded-2xl shadow p-4 space-y-2 mt-2"
                  initial="hidden" animate="visible" exit="exit"
                  variants={dropdownVariants} transition={{ duration: 0.2 }}
                >
                  <p className="font-semibold text-[17px] poppins">Select Term Date Group</p>
                  {termOptions.map((group) => (
                    <label key={group.id} className="flex items-center gap-2 text-[15px]">
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedTermIds) && selectedTermIds.includes(group.id)}
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
                  >Save</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subscription Plan Linkage */}
          <div className="w-full">
            <label className="block font-semibold text-[16px] pb-2 poppins">Subscription Plan Linkage</label>
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
                  initial="hidden" animate="visible" exit="exit"
                  variants={dropdownVariants} transition={{ duration: 0.2 }}
                >
                  <p className="font-semibold text-[17px]">Select Available Subscription Plan</p>
                  {subOptions.map((plan) => (
                    <label key={plan.id} className="flex items-center gap-2 text-[15px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSub === plan.id}
                        onChange={() => {
                          setSelectedSub(plan.id);
                          setFormData(prev => ({ ...prev, paymentGroupId: plan.id }));
                          setShowSubDropdown(false);
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
                  >Save</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Starter Pack Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="block font-semibold text-[16px] poppins">Starter Pack</span>
          <input
            type="checkbox"
            name="starterPack"
            checked={formData.starterPack}
            onChange={(e) => setFormData((prev) => ({ ...prev, starterPack: e.target.checked }))}
            className="sr-only"
          />
          <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${formData.starterPack ? "bg-[#5372FF] justify-end" : "bg-gray-300 justify-start"}`}>
            <div className="w-4 h-4 bg-white rounded-full shadow-md" />
          </div>
        </label>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="w-1/2 mr-2 py-3 font-semibold border border-[#E2E1E5] rounded-xl text-[18px] text-[#717073] hover:bg-gray-100"
          >Cancel</button>
          <button
            type="button"
            onClick={() => isEditVenue ? handleUpdate(formData.id) : handleSubmit()}
            className="w-1/2 ml-2 py-3 font-semibold bg-[#237FEA] text-white rounded-xl text-[18px] hover:bg-blue-700"
          >{isEditVenue ? "Update" : "Add"}</button>
        </div>

      </form>
    </div>
  );
};

export default Create;
