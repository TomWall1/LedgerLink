import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import NavHeader from './components/NavHeader';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Results from './pages/Results';
import AccountLinks from './pages/AccountLinks';
import System from './pages/System';
import TransactionMatch from './pages/TransactionMatch';
import XeroCallback from './components/XeroCallback';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';

function App() {
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="App bg-white">
          <NavHeader />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/xero/callback" element={<XeroCallback />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/upload" element={<Upload />} />
              <Route path="/results" element={<Results />} />
              <Route path="/account-links" element={<AccountLinks />} />
              <Route path="/transactions/match" element={<TransactionMatch />} />
              <Route path="/transactions/match/:linkId" element={<TransactionMatch />} />
              <Route path="/system" element={<System />} />
            </Route>
          </Routes>
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;