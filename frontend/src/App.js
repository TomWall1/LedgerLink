import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NavHeader from './components/NavHeader';
import XeroCallback from './components/XeroCallback';
import ERPConnectionManager from './components/ERPConnectionManager';
import ERPDataView from './components/ERPDataView';
import { useAuth } from './context/AuthContext';

// Protected route wrapper component
const ProtectedRouteWrapper = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" replace />
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <XeroProvider>
          <div className="min-h-screen bg-gray-100">
            <NavHeader />
            <div className="pt-16"> {/* Add padding to account for fixed navbar */}
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/" element={
                  <ProtectedRouteWrapper>
                    <Dashboard />
                  </ProtectedRouteWrapper>
                } />
                
                <Route path="/auth/xero/callback" element={<XeroCallback />} />
                
                <Route path="/erp-connections" element={
                  <ProtectedRouteWrapper>
                    <ERPConnectionManager />
                  </ProtectedRouteWrapper>
                } />
                
                <Route path="/erp-data/:connectionId" element={
                  <ProtectedRouteWrapper>
                    <ERPDataView />
                  </ProtectedRouteWrapper>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </XeroProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;