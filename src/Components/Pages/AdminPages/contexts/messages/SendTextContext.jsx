// TextContext.jsx
import React, { createContext, useContext, useState } from "react";

const TextContext = createContext();


const TextPopup = () => {
    const {
        showTextPopup,
        textData,
        setTextData,
        textLoading,
        closeTextPopup,
        handleSendText
    } = useContext(TextContext);

    if (!showTextPopup) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[520px] rounded-2xl p-6 space-y-5 shadow-2xl">

                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Send Text</h2>
                    <button onClick={closeTextPopup} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
                </div>

                {/* 👇 Show Parent Name + Phone */}
                <div>
                    <label className="text-sm font-medium text-gray-600">Recipients</label>
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-gray-50 max-h-32 overflow-y-auto text-sm">
                        {textData.phones.map((p, i) => (
                            <div key={i}>
                                {p.name} ({p.phone})
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-600">Message</label>
                    <textarea
                        rows={5}
                        value={textData.message}
                        onChange={(e) =>
                            setTextData(prev => ({ ...prev, message: e.target.value }))
                        }
                        placeholder="Write your message..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={closeTextPopup}
                        disabled={textLoading}
                        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSendText}
                        disabled={textLoading}
                        className={`px-6 py-2.5 rounded-xl text-white flex items-center gap-2
                        ${textLoading ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
                    >
                        {textLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                        {textLoading ? "Sending..." : "Send Text"}
                    </button>
                </div>

            </div>
        </div>
    );
};
export const TextProvider = ({ children }) => {
    const [showTextPopup, setShowTextPopup] = useState(false);
    const [textLoading, setTextLoading] = useState(false);
    const [textData, setTextData] = useState({ phones: [], message: "", endpoint: "" });
    const [callbacks, setCallbacks] = useState({ token: null, showError: null, showSuccess: null });

    const openTextPopup = (phones, endpoint, { token, showError, showSuccess }) => {
        setTextData({
            phones: Array.isArray(phones) ? phones : [phones],
            message: "",
            endpoint: endpoint || "/api/admin/send-manual-text"
        });

        setCallbacks({ token, showError, showSuccess });
        setShowTextPopup(true);
    };
    const closeTextPopup = () => {
        setShowTextPopup(false);
        setTextData({ phones: [], message: "", endpoint: "" });
    };

    const handleSendText = async () => {
        const { phones, message, endpoint } = textData;
        const { token, showError, showSuccess } = callbacks;

        if (!phones || phones.length === 0) return showError("Validation Error", "Please add at least one phone number");
        if (!message.trim()) return showError("Validation Error", "Message cannot be empty");

        try {
            setTextLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ phones: phones.map(p => p.phone), message }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to send text");
            await showSuccess("Success", "Text sent successfully");
            closeTextPopup();
        } catch (err) {
            await callbacks.showError("Error", err.message);
        } finally {
            setTextLoading(false);
        }
    };

    return (
        <TextContext.Provider value={{ showTextPopup, textLoading, textData, setTextData, openTextPopup, closeTextPopup, handleSendText }}>
            {children}
            <TextPopup />
        </TextContext.Provider>
    );
};

export const useTextPopup = () => useContext(TextContext);