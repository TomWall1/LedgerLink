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
  
  // DIAGNOSTIC: Track location changes
  useEffect(() => {
    console.log('🔍 DIAGNOSTIC: Location changed to:', location.pathname);
    console.log('🔍 DIAGNOSTIC: Full location object:', location);
  }, [location]);
  
  // Get active tab from current route
  const getActiveTab = () => {
    const path = location.pathname;
    console.log('🔍 DIAGNOSTIC: Getting active tab for path:', path);
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/matches')) return 'matches';
    if (path.startsWith('/connections')) return 'connections';
    if (path.startsWith('/counterparties')) return 'counterparties';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/login')) {
      console.log('🚨 DIAGNOSTIC: Login path detected! This should not exist in our routes.');
      return 'login';
    }
    return 'dashboard';
  };

  const activeTab = getActiveTab();
  console.log('🔍 DIAGNOSTIC: Active tab determined as:', activeTab);
  
  // Initialize authentication state
  useEffect(() => {
    console.log('🔍 DIAGNOSTIC: Starting authentication initialization...');
    
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('🔍 DIAGNOSTIC: Auth token from localStorage:', token ? '(exists)' : '(not found)');
        
        if (token) {
          console.log('🔍 DIAGNOSTIC: Token found, setting logged in state...');
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
          console.log('🔍 DIAGNOSTIC: User logged in successfully');
        } else {
          console.log('🔍 DIAGNOSTIC: No token found, user not logged in');
        }
      } catch (error) {
        console.error('🚨 DIAGNOSTIC: Authentication initialization error:', error);
        localStorage.removeItem('authToken');
      } finally {
        console.log('🔍 DIAGNOSTIC: Authentication initialization complete');
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // DIAGNOSTIC: Track auth state changes
  useEffect(() => {
    console.log('🔍 DIAGNOSTIC: Auth state changed - isLoggedIn:', isLoggedIn, 'user:', user?.name || 'none');
  }, [isLoggedIn, user]);
  
  const handleLogin = () => {
    console.log('🔍 DIAGNOSTIC: Login handler called');
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
    console.log('🔍 DIAGNOSTIC: Login completed');
  };
  
  const handleLogout = () => {
    console.log('🔍 DIAGNOSTIC: Logout handler called');
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setCompany(null);
    console.log('🔍 DIAGNOSTIC: Logout completed');
  };
  
  const handleInvite = () => {
    console.log('🔍 DIAGNOSTIC: Invite clicked');
  };

  // Navigation handler for tab-based navigation (converts to routes)
  const handleTabChange = (tab: string) => {
    console.log('🔍 DIAGNOSTIC: Tab change requested:', tab);
    // The AppLayout will handle navigation via router
    // This is just for compatibility
  };
  
  if (loading) {
    console.log('🔍 DIAGNOSTIC: App is in loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LedgerLink...</p>
        </div>
      </div>
    );
  }
  
  console.log('🔍 DIAGNOSTIC: App rendering main content. Current path:', location.pathname);
  
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
                element={
                  (() => {
                    console.log('🔍 DIAGNOSTIC: Root route accessed, redirecting to /dashboard');
                    return <Navigate to="/dashboard" replace />;
                  })()
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  (() => {
                    console.log('🔍 DIAGNOSTIC: Dashboard route accessed');
                    return (
                      <ErrorBoundary>
                        <Dashboard user={user} />
                      </ErrorBoundary>
                    );
                  })()
                } 
              />
              <Route 
                path="/matches" 
                element={
                  (() => {
                    console.log('🔍 DIAGNOSTIC: Matches route accessed');
                    return (
                      <ErrorBoundary>
                        <Matches isLoggedIn={isLoggedIn} />
                      </ErrorBoundary>
                    );
                  })()
                } 
              />
              <Route 
                path="/connections" 
                element={
                  (() => {
                    console.log('🔍 DIAGNOSTIC: Connections route accessed');
                    return (
                      <ErrorBoundary>
                        <ConnectionsPage companyId={company?.id || 'default-company'} />
                      </ErrorBoundary>
                    );
                  })()
                } 
              />
              <Route 
                path="/counterparties" 
                element={
                  (() => {
                    console.log('🔍 DIAGNOSTIC: Counterparties route accessed');
                    return (
                      <div className="p-8">
                        <h1 className="text-2xl font-bold mb-4">Counterparties</h1>
                        <p className="text-gray-600">Counterparty management functionality</p>
                      </div>
                    );
                  })()
                } 
              />
              <Route 
                path="/reports" 
                element={
                  (() => {
                    console.log('🔍 DIAGNOSTIC: Reports route accessed');
                    return (
                      <div className="p-8">
                        <h1 className="text-2xl font-bold mb-4">Reports</h1>
                        <p className="text-gray-600">Reporting and analytics functionality</p>
                      </div>
                    );
                  })()
                } 
              />
              <Route 
                path="/settings" 
                element={
                  (() => {
                    console.log('🔍 DIAGNOSTIC: Settings route accessed');
                    return (
                      <div className="p-8">
                        <h1 className="text-2xl font-bold mb-4">Settings</h1>
                        <p className="text-gray-600">Application settings</p>
                      </div>
                    );
                  })()
                } 
              />
              <Route 
                path="/login" 
                element={
                  (() => {
                    console.log('🚨 DIAGNOSTIC: /login route accessed - THIS SHOULD NOT HAPPEN!');
                    console.log('🚨 DIAGNOSTIC: Something is redirecting to /login but this route should not exist');
                    return (
                      <div className="p-8 bg-red-50 border border-red-200">
                        <h1 className="text-2xl font-bold mb-4 text-red-800">DEBUG: Login Route Accessed</h1>
                        <p className="text-red-600 mb-4">This is a diagnostic page. The /login route should not exist in our app.</p>
                        <p className="text-red-600 mb-4">Something is redirecting to /login unexpectedly.</p>
                        <button 
                          onClick={() => window.location.href = '/dashboard'}
                          className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    );
                  })()
                } 
              />
              <Route 
                path="*" 
                element={
                  (() => {
                    console.log('🚨 DIAGNOSTIC: Catch-all route accessed for path:', location.pathname);
                    return (
                      <div className="p-8">
                        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                        <p className="text-gray-600">The requested page could not be found: {location.pathname}</p>
                        <p className="text-gray-600 mt-4">
                          <a href="/dashboard" className="text-blue-500 underline">Go to Dashboard</a>
                        </p>
                      </div>
                    );
                  })()
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
  console.log('🔍 DIAGNOSTIC: App component initializing...');
  
  // DIAGNOSTIC: Override window.location assignments to detect redirects
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;
  
  window.location.assign = function(url) {
    console.log('🚨 DIAGNOSTIC: window.location.assign called with:', url);
    console.trace('🚨 DIAGNOSTIC: Stack trace for window.location.assign');
    return originalAssign.call(this, url);
  };
  
  window.location.replace = function(url) {
    console.log('🚨 DIAGNOSTIC: window.location.replace called with:', url);
    console.trace('🚨 DIAGNOSTIC: Stack trace for window.location.replace');
    return originalReplace.call(this, url);
  };
  
  // DIAGNOSTIC: Override href setter
  let hrefDescriptor = Object.getOwnPropertyDescriptor(window.location, 'href');
  if (!hrefDescriptor) {
    hrefDescriptor = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
  }
  
  if (hrefDescriptor && hrefDescriptor.set) {
    const originalHrefSetter = hrefDescriptor.set;
    Object.defineProperty(window.location, 'href', {
      ...hrefDescriptor,
      set: function(url) {
        console.log('🚨 DIAGNOSTIC: window.location.href set to:', url);
        console.trace('🚨 DIAGNOSTIC: Stack trace for window.location.href assignment');
        return originalHrefSetter.call(this, url);
      }
    });
  }
  
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;