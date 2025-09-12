import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { XeroProvider } from './contexts/XeroContext';
import NavHeader from './components/NavHeader';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import XeroAuth from './components/XeroAuth';
import CustomerTransactionMatcher from './components/CustomerTransactionMatcher';
import ERPConnectionManager from './components/ERPConnectionManager';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show NavHeader only for authenticated users and not on landing page */}
      {user && window.location.pathname !== '/' && <NavHeader />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <>
              <NavHeader />
              <Dashboard />
            </>
          </ProtectedRoute>
        } />
        
        <Route path="/invoice-matching" element={
          <ProtectedRoute>
            <>
              <NavHeader />
              <CustomerTransactionMatcher />
            </>
          </ProtectedRoute>
        } />
        
        <Route path="/xero-auth" element={
          <ProtectedRoute>
            <>
              <NavHeader />
              <XeroAuth />
            </>
          </ProtectedRoute>
        } />
        
        <Route path="/erp-connections" element={
          <ProtectedRoute>
            <>
              <NavHeader />
              <ERPConnectionManager />
            </>
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <XeroProvider>
        <Router>
          <AppContent />
        </Router>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;