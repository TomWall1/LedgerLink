import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import NavHeader from './components/NavHeader.jsx';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ERPConnectionManager from './components/ERPConnectionManager';
import XeroCallback from './components/XeroCallback';
import ERPDataView from './components/ERPDataView';
import CustomerTransactionMatcher from './components/CustomerTransactionMatcher';
import CompanyLinker from './components/CompanyLinker';
import MatchResults from './pages/MatchResults';

// Main App component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication status
  useEffect(() => {
    // Simple check if token exists in localStorage
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);
  
  // Loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100">
          <NavHeader />
          <div className="pt-16">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
              <Route path="/auth/xero/callback" element={<XeroCallback />} />
              
              {/* Protected routes */}
              <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/erp-connections" element={isAuthenticated ? <ERPConnectionManager /> : <Navigate to="/login" />} />
              <Route path="/erp-data/:connectionId" element={isAuthenticated ? <ERPDataView /> : <Navigate to="/login" />} />
              <Route path="/customer-transaction-matching" element={isAuthenticated ? <CustomerTransactionMatcher /> : <Navigate to="/login" />} />
              <Route path="/company-links" element={isAuthenticated ? <CompanyLinker /> : <Navigate to="/login" />} />
              <Route path="/match-results" element={isAuthenticated ? <MatchResults /> : <Navigate to="/login" />} />
              
              {/* Catch all for invalid routes */}
              <Route path="*" element={
                <div className="container mx-auto p-4">
                  <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                  <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                  <a href="/" className="text-blue-500 hover:underline">Go back to dashboard</a>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;