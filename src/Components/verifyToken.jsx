export const verifyToken = async (token) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
     console.log('🔍 Verifying token...');
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/login/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
     console.log('📦 Verify response:', result);

    if (response.ok) {
      localStorage.setItem('adminInfo', JSON.stringify(result.admin));
      localStorage.setItem('role', (result.admin.role));
         localStorage.setItem(
          "hasPermission",
          JSON.stringify(result.hasPermission)
        );
          //  console.log('permission saved in verifytoken',result.hasPermission)
    
      return true;
    } else {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      throw new Error(result.message || 'Token verification failed');
    }
  } catch (err) {
    console.error('❌ verifyToken error:', err);
    throw new Error(err.message || 'Something went wrong during token verification');
  }
};

