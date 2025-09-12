import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
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
  
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Don't show NavHeader on public pages
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname);
  const showNavHeader = user && !isPublicPage;
  
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
  
  return (
    <div className="min-h-screen">
      {showNavHeader && <NavHeader />}
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/invoice-matching" 
          element={
            <ProtectedRoute>
              <CustomerTransactionMatcher />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/xero-auth" 
          element={
            <ProtectedRoute>
              <XeroAuth />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/erp-connections" 
          element={
            <ProtectedRoute>
              <ERPConnectionManager />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback - redirect to appropriate page based on auth status */}
        <Route 
          path="*" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
          } 
        />
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