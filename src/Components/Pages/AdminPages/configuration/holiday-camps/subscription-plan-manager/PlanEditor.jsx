import React, { useState, useRef } from 'react';

const Toolbar = ({ targetRef }) => {
  const applyFormat = (tag) => {
    const textarea = targetRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end);
    let formatted = selectedText;

    if (tag === 'bold') formatted = `**${selectedText}**`;
    if (tag === 'italic') formatted = `*${selectedText}*`;
    if (tag === 'underline') formatted = `__${selectedText}__`;

    const newValue =
      textarea.value.substring(0, start) +
      formatted +
      textarea.value.substring(end);

    textarea.value = newValue;
    textarea.setSelectionRange(start, start + formatted.length);
    textarea.focus();
  };

  return (
    <div className="flex space-x-2 mb-2 text-sm">
      <button
        type="button"
        onClick={() => applyFormat('bold')}
        className="px-2 py-1 border rounded hover:bg-gray-100"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => applyFormat('italic')}
        className="px-2 py-1 border rounded hover:bg-gray-100"
      >
        <i>I</i>
      </button>
      <button
        type="button"
        onClick={() => applyFormat('underline')}
        className="px-2 py-1 border rounded hover:bg-gray-100"
      >
        <u>U</u>
      </button>
    </div>
  );
};

const PlainTextEditor = () => {
  const [packageDetails, setPackageDetails] = useState('');
  const [terms, setTerms] = useState('');

  const packageRef = useRef();
  const termsRef = useRef();

  const handleSave = () => {
    alert('Plan saved successfully!');
  };

  return (
    <div className="">
      {/* Holiday Camp Package Details */}
      <div>
        <label className="block text-base  font-semibold text-gray-700 mb-2">
          Holiday Camp Package Details
        </label>
        <textarea
          ref={packageRef}
          value={packageDetails}
          onChange={(e) => setPackageDetails(e.target.value)}
          rows="5"
          className="w-full border border-gray-300 bg-gray-100 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
         
        />
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="block text-base  font-semibold text-gray-700 mb-2">
          Terms & Conditions
        </label>
        <textarea
          ref={termsRef}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows="5"
          className="w-full border border-gray-300 bg-gray-100 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      
        />
      </div>

      {/* Save Button */}
      <div className="text-right">
        <button
          onClick={handleSave}
          className="bg-[#237FEA] text-white mt-5 min-w-50 font-semibold px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Save Plan
        </button>
      </div>
    </div>
  );
};

export default PlainTextEditor;
