import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugInfo = () => {
  const { user, loading } = useAuth();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed top-0 right-0 bg-black text-white p-2 text-xs z-50">
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? 'authenticated' : 'null'}</div>
      <div>Path: {window.location.pathname}</div>
      <div>Token: {localStorage.getItem('authToken') ? 'exists' : 'none'}</div>
    </div>
  );
};

export default DebugInfo;