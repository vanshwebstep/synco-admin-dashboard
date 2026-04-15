// EmailContext.jsx
import React, { createContext, useContext, useState } from "react";

const EmailContext = createContext();

const EmailPopup = () => {
    const { showEmailPopup, emailData, setEmailData, mailLoading, closeEmailPopup, handleSendEmail } = useContext(EmailContext);

    if (!showEmailPopup) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[520px] rounded-2xl p-6 space-y-5 shadow-2xl animate-fadeIn">

                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Send Email</h2>
                    <button onClick={closeEmailPopup} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-600">To</label>
                    <input type="text" readOnly value={emailData.emails.join(", ")}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 bg-gray-50 focus:outline-none" />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-600">Subject</label>
                    <input type="text" value={emailData.subject} placeholder="Enter subject"
                        onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-black transition" />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-600">Message</label>
                    <textarea rows={5} value={emailData.message} placeholder="Write your message..."
                        onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-black transition resize-none" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={closeEmailPopup} disabled={mailLoading}
                        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200">
                        Cancel
                    </button>
                    <button onClick={handleSendEmail} disabled={mailLoading}
                        className={`px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-200 shadow-md flex items-center gap-2
                            ${mailLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900"}`}>
                        {mailLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                        {mailLoading ? "Sending..." : "Send Email"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export const EmailProvider = ({ children }) => {
    const [showEmailPopup, setShowEmailPopup] = useState(false);
    const [mailLoading, setMailLoading] = useState(false);
    const [emailData, setEmailData] = useState({ emails: [], subject: "", message: "", endpoint: "" });
    const [callbacks, setCallbacks] = useState({ token: null, showError: null, showSuccess: null });

    const openEmailPopup = (emails, endpoint, { token, showError, showSuccess }) => {
        setEmailData({
            emails: Array.isArray(emails) ? emails : [emails],
            subject: "",
            message: "",
            endpoint: endpoint || "/api/admin/send-manual-email"
        });
        setCallbacks({ token, showError, showSuccess });
        setShowEmailPopup(true);
    };

    const closeEmailPopup = () => {
        setShowEmailPopup(false);
        setEmailData({ emails: [], subject: "", message: "", endpoint: "" });
    };

    const handleSendEmail = async () => {
        const { emails, subject, message, endpoint } = emailData;
        const { token, showError, showSuccess } = callbacks;

        if (!emails || emails.length === 0) return showError("Validation Error", "Please add at least one email");
        if (!subject.trim()) return showError("Validation Error", "Subject is required");
        if (!message.trim()) return showError("Validation Error", "Message cannot be empty");

        try {
            setMailLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ emails, subject, message }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to send email");
            await showSuccess("Success", "Email sent successfully");
            closeEmailPopup();
        } catch (err) {
            await callbacks.showError("Error", err.message);
        } finally {
            setMailLoading(false);
        }
    };

    return (
        <EmailContext.Provider value={{ showEmailPopup, mailLoading, emailData, setEmailData, openEmailPopup, closeEmailPopup, handleSendEmail }}>
            {children}
            <EmailPopup />
        </EmailContext.Provider>
    );
};

export const useEmail = () => useContext(EmailContext);