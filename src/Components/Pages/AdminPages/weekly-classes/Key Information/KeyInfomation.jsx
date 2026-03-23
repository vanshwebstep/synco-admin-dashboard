import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import Select from "react-select";
import { useMembers } from "../../contexts/MemberContext";
import Loader from "../../contexts/Loader";

const KeyInformation = () => {
  const { keyInfoData, fetchKeyInfo, KeyInformationCreate, loading } = useMembers();
  const [editorValue, setEditorValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [initialServiceType, setInitialServiceType] = useState(null);

  const servicesOptions = [
    { value: "trial", label: "Weekly Class Trial" },
    { value: "membership", label: "Weekly Class Membership" },
    { value: "waiting_list", label: "Waiting List" },
    { value: "holiday_camp", label: "Holiday Camp" },
    { value: "birthday_party", label: "Birthday Party" },
    { value: "one_to_one", label: "One To One" },
  ];

  // Fetch key info when component mounts
  useEffect(() => {
    fetchKeyInfo();
  }, [fetchKeyInfo]);

  const handleEdit = (item) => {
    setInitialServiceType(item.serviceType);
    const serviceOpt = servicesOptions.find(opt => opt.value === item.serviceType);
    setSelectedService(serviceOpt || { value: item.serviceType, label: item.serviceType });

    // Convert array to HTML if it's an array, otherwise use as is
    const content = Array.isArray(item.keyInformation)
      ? `<ul>${item.keyInformation.map(line => `<li>${line}</li>`).join('')}</ul>`
      : item.keyInformation;

    setEditorValue(content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editorValue.trim() === "" || !selectedService) return;

    setIsLoading(true);
    try {
      await KeyInformationCreate(editorValue, selectedService.value);
      setIsEditing(false);
      setSelectedService(null);
      setEditorValue('');
      setInitialServiceType(null);
    } catch (error) {
      console.error("Failed to save key info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const renderContent = (content) => {
    return (
      <div
        className="text-gray-800 prose prose-blue max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Key Information Library</h2>
          {!isEditing && (
            <button
              onClick={() => {
                setIsEditing(true);
                setSelectedService(null);
                setEditorValue('');
                setInitialServiceType(null);
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
            >
              <span>+</span> Add New Instruction
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedService ? `Edit ${selectedService.label}` : 'Create New Instructions'}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Select Service Category
                </label>
                <Select
                  options={servicesOptions}
                  value={selectedService}
                  onChange={setSelectedService}
                  isOptionDisabled={(option) => {
                    const addedServiceTypes = keyInfoData?.map(item => item.serviceType) || [];
                    return addedServiceTypes.includes(option.value) && option.value !== initialServiceType;
                  }}
                  classNamePrefix="react-select"
                  placeholder="Choose a service category..."
                  className="text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Instruction Content
                </label>
                <ReactQuill
                  theme="snow"
                  value={editorValue}
                  onChange={setEditorValue}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200"
                  placeholder="Enter key instructions here..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={isLoading || editorValue.trim() === "" || !selectedService}
                className={`px-10 py-3 rounded-xl shadow-md transition-all font-bold text-lg
                ${isLoading || !selectedService ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 scale-[1.02] active:scale-[0.98]"} 
                text-white`}
              >
                {isLoading ? "Saving..." : "Save Instructions"}
              </button>

              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedService(null);
                  setEditorValue('');
                  setInitialServiceType(null);
                }}
                className="px-10 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-bold text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(keyInfoData) && keyInfoData.length > 0 ? (
              keyInfoData.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                    <h3 className="font-bold text-lg text-gray-800 capitalize">
                      {item.serviceType.replace(/_/g, ' ')}
                    </h3>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-3 py-1 rounded-lg hover:bg-blue-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="p-6">
                    {renderContent(JSON.parse(item.keyInformationRaw))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-lg mb-4">No key information found.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Create your first instruction set
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyInformation;
