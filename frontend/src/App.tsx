import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import { AppLayout } from './components/layout/AppLayout';
import ConnectionsPage from './pages/ConnectionsPage';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Import your page components
import { Dashboard } from './pages/Dashboard';
import Matches from './pages/Matches';
// import CounterpartiesPage from './pages/CounterpartiesPage';
// import ReportsPage from './pages/ReportsPage';
// import SettingsPage from './pages/SettingsPage';

import './styles/global.css';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Company {
  id: string;
  name: string;
  ownerId: string;
}

// Component to handle tab state based on current route
const AppContent: React.FC = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get active tab from current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/matches')) return 'matches';
    if (path.startsWith('/connections')) return 'connections';
    if (path.startsWith('/counterparties')) return 'counterparties';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTab();
  
  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // TODO: Verify token with your backend and get user info
          // For now, just set logged in status
          setIsLoggedIn(true);
          setUser({
            id: 'demo-user',
            name: 'Demo User',
            email: 'demo@ledgerlink.com'
          });
          setCompany({
            id: 'demo-company',
            name: 'Demo Company',
            ownerId: 'demo-user'
          });
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  const handleLogin = () => {
    // For development purposes, simulate login
    localStorage.setItem('authToken', 'demo_token_123');
    setIsLoggedIn(true);
    setUser({
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@ledgerlink.com'
    });
    setCompany({
      id: 'demo-company',
      name: 'Demo Company',
      ownerId: 'demo-user'
    });
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setCompany(null);
  };
  
  const handleInvite = () => {
    console.log('Invite clicked');
  };

  // Navigation handler for tab-based navigation (converts to routes)
  const handleTabChange = (tab: string) => {
    // The AppLayout will handle navigation via router
    // This is just for compatibility
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LedgerLink...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="App">
          <AppLayout
            user={user || undefined}
            isLoggedIn={isLoggedIn}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onInvite={handleInvite}
          >
            <Routes>
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ErrorBoundary>
                    <Dashboard user={user} />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/matches" 
                element={
                  <ErrorBoundary>
                    <Matches isLoggedIn={isLoggedIn} />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/connections" 
                element={
                  <ErrorBoundary>
                    <ConnectionsPage companyId={company?.id || 'default-company'} />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/counterparties" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Counterparties</h1>
                    <p className="text-gray-600">Counterparty management functionality</p>
                  </div>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Reports</h1>
                    <p className="text-gray-600">Reporting and analytics functionality</p>
                  </div>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Settings</h1>
                    <p className="text-gray-600">Application settings</p>
                  </div>
                } 
              />
              <Route 
                path="*" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                    <p className="text-gray-600">The requested page could not be found.</p>
                  </div>
                } 
              />
            </Routes>
          </AppLayout>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;