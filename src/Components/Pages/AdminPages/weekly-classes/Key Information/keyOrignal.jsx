import React, { useState, useEffect } from "react"; // Added useEffect
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useMembers } from "../../contexts/MemberContext";
import Loader from "../../contexts/Loader";

const KeyInformation = () => {
 const { keyInfoData, fetchKeyInfo ,KeyInformationCreate ,loading} = useMembers();
  const [keyInfo, setKeyInfo] = useState(keyInfoData?.keyInformation);
  const [editorValue, setEditorValue] = useState(keyInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

 console.log('keyInfoData',keyInfoData?.keyInformation)
  // Fetch key info when component mounts
  useEffect(() => {
    fetchKeyInfo();
  }, [fetchKeyInfo]);

  // Optionally update keyInfo when keyInfoData changes
  useEffect(() => {
    if (keyInfoData) {
      setKeyInfo(keyInfoData?.keyInformation);
      setEditorValue(keyInfoData?.keyInformation);
    }
  }, [keyInfoData]);


  

const handleSave = async () => {
  if (editorValue.trim() === "") return;

  setIsLoading(true); // start loading
  try {
    // Call your create/update API
    await KeyInformationCreate(editorValue);

    // Update local state after successful save
    setKeyInfo(editorValue);
    setIsEditing(false);
  } catch (error) {
    console.error("Failed to save key info:", error);
  } finally {
    setIsLoading(false); // stop loading
  }
};
    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }
  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Key Information</h2>

      {isEditing ? (
        <div className="space-y-4">
          <ReactQuill
            theme="snow"
            value={editorValue}
            onChange={setEditorValue}
            className="bg-white rounded-lg border border-gray-300 shadow-sm"
            placeholder="Type and format key information..."
          />
          <div className="flex gap-3">
           <button
  onClick={handleSave}
  disabled={isLoading || editorValue.trim() === ""}
  className={`px-6 py-2 rounded-full shadow-md transition 
              ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
              text-white`}
>
  {isLoading ? "Saving..." : "Save"}
</button>

            <button
              onClick={() => {
                setEditorValue(keyInfo);
                setIsEditing(false);
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 px-5 py-4 rounded-xl shadow-sm border flex justify-between items-center">
          <span
            className="text-base text-gray-800"
            dangerouslySetInnerHTML={{ __html: keyInfo }}
          />
          <button
            onClick={() => setIsEditing(true)}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default KeyInformation;
