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
import DebugInfo from './components/DebugInfo';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Loading LedgerLink...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  console.log('ProtectedRoute - Loading:', loading, 'User:', user);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user, loading } = useAuth();
  
  console.log('AppContent - Loading:', loading, 'User:', user, 'Path:', window.location.pathname);
  
  // Show loading screen while checking authentication
  if (loading) {
    console.log('Showing loading screen');
    return <LoadingScreen />;
  }
  
  return (
    <div className="min-h-screen">
      <DebugInfo />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            (() => {
              console.log('Root route - User:', user);
              if (user) {
                console.log('User authenticated, redirecting to dashboard');
                return <Navigate to="/dashboard" replace />;
              } else {
                console.log('No user, showing landing page');
                return <LandingPage />;
              }
            })()
          }
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
        />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <NavHeader />
              <Dashboard />
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/invoice-matching" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <NavHeader />
              <CustomerTransactionMatcher />
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/xero-auth" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <NavHeader />
              <XeroAuth />
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/erp-connections" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <NavHeader />
              <ERPConnectionManager />
            </div>
          </ProtectedRoute>
        } />
        
        {/* Fallback - redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  console.log('App component rendering');
  
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