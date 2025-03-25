import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NavHeader from './components/NavHeader';
import ProtectedRoute from './components/ProtectedRoute';
import XeroCallback from './components/XeroCallback';
import ERPConnectionManager from './components/ERPConnectionManager';
import ERPDataView from './components/ERPDataView';

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
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/auth/xero/callback" element={<XeroCallback />} />
                <Route path="/erp-connections" element={
                  <ProtectedRoute>
                    <ERPConnectionManager />
                  </ProtectedRoute>
                } />
                <Route path="/erp-data/:connectionId" element={
                  <ProtectedRoute>
                    <ERPDataView />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </div>
        </XeroProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
