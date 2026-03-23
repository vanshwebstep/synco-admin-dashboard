// src/Components/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>403 - Unauthorized Access</h1>
      <p>You don't have permission to access this page.</p>
      <Link to="/">Return to Dashboard</Link>
    </div>
  );
};

export default Unauthorized;