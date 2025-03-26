import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NavHeader from './components/NavHeader';
import XeroCallback from './components/XeroCallback';

// Simple app with basic routing
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <XeroProvider>
          <div className="min-h-screen bg-gray-100">
            <NavHeader />
            <div className="pt-16">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/auth/xero/callback" element={<XeroCallback />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </XeroProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;