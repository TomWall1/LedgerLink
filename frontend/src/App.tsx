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
  
  // DEMO MODE: Always logged in by default
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState<User>({
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@ledgerlink.com'
  });
  const [company, setCompany] = useState<Company>({
    id: 'demo-company', 
    name: 'Demo Company',
    ownerId: 'demo-user'
  });
  const [loading, setLoading] = useState(false); // No loading in demo mode
  
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
  
  // DEMO MODE: Set up demo token for backend API calls
  useEffect(() => {
    // Always set demo token for API calls
    localStorage.setItem('authToken', 'demo_token_123');
    console.log('🎯 DEMO MODE: Demo authentication token set');
  }, []);
  
  const handleLogin = () => {
    // Already logged in demo mode - do nothing
    console.log('🎯 DEMO MODE: Already logged in');
  };
  
  const handleLogout = () => {
    console.log('🎯 DEMO MODE: Logout disabled in demo');
    // In demo mode, don't actually log out
  };
  
  const handleInvite = () => {
    console.log('🎯 DEMO MODE: Invite functionality');
  };

  // Navigation handler for tab-based navigation
  const handleTabChange = (tab: string) => {
    // The AppLayout will handle navigation via router
  };
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="App">
          <AppLayout
            user={user}
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
                    <ConnectionsPage companyId={company.id} />
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/counterparties" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Counterparties</h1>
                    <p className="text-gray-600">Counterparty management functionality</p>
                    <p className="text-sm text-gray-500 mt-2">This feature is available in the full version</p>
                  </div>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Reports</h1>
                    <p className="text-gray-600">Reporting and analytics functionality</p>
                    <p className="text-sm text-gray-500 mt-2">This feature is available in the full version</p>
                  </div>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Settings</h1>
                    <p className="text-gray-600">Application settings</p>
                    <p className="text-sm text-gray-500 mt-2">This feature is available in the full version</p>
                  </div>
                } 
              />
              <Route 
                path="*" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                    <p className="text-gray-600">The requested page could not be found: {location.pathname}</p>
                    <div className="mt-4">
                      <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Go to Dashboard
                      </button>
                    </div>
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