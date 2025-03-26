import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NavHeader from './components/NavHeader';
import XeroCallback from './components/XeroCallback';
import ERPConnectionManager from './components/ERPConnectionManager';
import ERPDataView from './components/ERPDataView';

// Main app with routing
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <NavHeader />
      <div className="pt-16"> {/* Add padding to account for fixed navbar */}
        <Routes>
          <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated() ? <Register /> : <Navigate to="/" />} />
          
          <Route path="/" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} />
          
          <Route path="/auth/xero/callback" element={<XeroCallback />} />
          
          <Route path="/erp-connections" element={
            isAuthenticated() ? <ERPConnectionManager /> : <Navigate to="/login" />
          } />
          
          <Route path="/erp-data/:connectionId" element={
            isAuthenticated() ? <ERPDataView /> : <Navigate to="/login" />
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

// Root component that provides context
function App() {
  return (
    <Router>
      <AuthProvider>
        <XeroProvider>
          <AppRoutes />
        </XeroProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;