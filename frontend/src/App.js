import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavHeader from './components/NavHeader';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import XeroAuth from './components/XeroAuth';
import InvoiceMatching from './components/InvoiceMatching';
import ERPConnectionManager from './components/ERPConnectionManager';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <NavHeader />
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/invoice-matching" element={
              <ProtectedRoute>
                <NavHeader />
                <InvoiceMatching />
              </ProtectedRoute>
            } />
            <Route path="/xero-auth" element={
              <ProtectedRoute>
                <NavHeader />
                <XeroAuth />
              </ProtectedRoute>
            } />
            <Route path="/erp-connections" element={
              <ProtectedRoute>
                <NavHeader />
                <ERPConnectionManager />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;