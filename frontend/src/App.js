import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NavHeader from './components/NavHeader';
import XeroCallback from './components/XeroCallback';
import ERPConnectionManager from './components/ERPConnectionManager';
import ERPDataView from './components/ERPDataView';

// Basic App with simple routing
function App() {
  return (
    <AuthProvider>
      <XeroProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-100">
            <NavHeader />
            <div className="pt-16">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/auth/xero/callback" element={<XeroCallback />} />
                <Route path="/erp-connections" element={<ERPConnectionManager />} />
                <Route path="/erp-data/:connectionId" element={<ERPDataView />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;