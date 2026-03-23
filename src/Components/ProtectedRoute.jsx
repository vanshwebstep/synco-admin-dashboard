// components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking' | 'allowed' | 'denied'
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
 
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        console.warn('Token missing');
        setAuthStatus('denied');
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/auth/login/verify`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok && result.status === true) {
          setAuthStatus('allowed');
          // Optional: Save admin info to localStorage
          localStorage.setItem('adminInfo', JSON.stringify(result.admin));
          localStorage.setItem('role', (result.admin.role.role));
          localStorage.setItem(
            "hasPermission",
            JSON.stringify(result.hasPermission)
          );
          //  console.log('permission saved in protectedroute', result.admin.hasPermission)
        } else {
          console.warn('Token invalid or expired');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          navigate('/admin-login');
          setAuthStatus('denied');
        }
      } catch (error) {
        console.error('Verification failed:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        navigate('/admin-login');
        setAuthStatus('denied');
      }
    };

    verifyToken();
  }, []);

  if (authStatus === 'checking') {
    return (
      <div className="w-full h-screen flex justify-center items-center text-lg text-gray-700">
        Verifying session...
      </div>
    );
  }

  return authStatus === 'allowed' ? children : <Navigate to="/admin-login" replace />;
};

export default ProtectedRoute;
