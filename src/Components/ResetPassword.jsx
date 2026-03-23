import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/swalHelper';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || ''; // Make sure 'token' is used here

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    if (!newPassword || !confirmPassword) {
      showWarning("Both fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    const raw = JSON.stringify({
      newPassword,
      confirmPassword,
    });

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/reset-password?email=${email}&token=${token}`,
        {
          method: "POST",
          headers: myHeaders,
          body: raw,
        }
      );

      const result = await response.json();

      if (response.ok) {
        showSuccess("Password successfully reset.").then(() => {
          navigate("/admin-login"); // redirect after popup closes
        });
      } else {
        showError(result.message || "Reset failed");
      }
    } catch (err) {
      console.error(err);
      showError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Reset Password</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative mb-3">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              className="w-full p-3 border rounded-xl text-lg"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-4"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-600" />
              ) : (
                <Eye className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              className="w-full p-3 border rounded-xl text-lg"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-4"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-600" />
              ) : (
                <Eye className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold text-lg ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {loading ? 'Submitting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
