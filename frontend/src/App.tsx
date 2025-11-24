// Force cache invalidation - v1.0.12 - ACCEPT INVITE PAGE ADDED
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './hooks/useToast';
import { AppLayout } from './components/layout/AppLayout';
import ConnectionsPage from './pages/ConnectionsPage';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Import your page components
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Matches from './pages/Matches';
import { Counterparties } from './pages/Counterparties';
import { AcceptInvite } from './pages/AcceptInvite';
import { Settings } from './pages/Settings';

import './styles/global.css';

interface Company {
  id: string;
  name: string;
  ownerId: string;
}

type AppView = 'landing' | 'login' | 'register' | 'dashboard' | 'invite-acceptance';

// Component to handle tab state based on current route
const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  
  // Authentication and view state
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [company, setCompany] = useState<Company | null>(null);
  
  // Check for invite acceptance route
  useEffect(() => {
    if (location.pathname.startsWith('/accept-invite')) {
      setCurrentView('invite-acceptance');
    }
  }, [location.pathname]);
  
  // Check authentication status on mount
  useEffect(() => {
    if (loading) return;
    
    // Don't override invite-acceptance view
    if (currentView === 'invite-acceptance') return;
    
    if (user) {
      // User is authenticated
      setCurrentView('dashboard');
      // Set company info from user data
      if (user.companyId && user.companyName) {
        setCompany({
          id: user.companyId,
          name: user.companyName,
          ownerId: user.id
        });
      }
    } else {
      // Check for demo mode
      const demoToken = localStorage.getItem('authToken');
      if (demoToken === 'demo_token_123') {
        setCurrentView('dashboard');
        setCompany({
          id: 'demo-company',
          name: 'Demo Company',
          ownerId: 'demo-user'
        });
      }
    }
  }, [user, loading, currentView]);
  
  // Get active tab from current route (when in dashboard mode)
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
  
  // Landing page handlers
  const handleLogin = () => {
    console.log('🔐 Switching to login view');
    setCurrentView('login');
  };
  
  const handleTryForFree = () => {
    console.log('🎯 Starting demo/free trial mode');
    // Set demo token for API calls
    localStorage.setItem('authToken', 'demo_token_123');
    setCompany({
      id: 'demo-company', 
      name: 'Demo Company',
      ownerId: 'demo-user'
    });
    setCurrentView('dashboard');
    console.log('🎯 DEMO MODE: Demo authentication token set');
  };
  
  // Auth handlers
  const handleLoginSuccess = () => {
    console.log('✅ Login successful');
    setCurrentView('dashboard');
    navigate('/dashboard');
    // User and company will be set by AuthContext
  };
  
  const handleRegisterSuccess = () => {
    console.log('✅ Registration successful');
    setCurrentView('dashboard');
    navigate('/dashboard');
    // User and company will be set by AuthContext
  };
  
  const handleLogout = async () => {
    console.log('🔓 Logging out');
    await logout();
    setCompany(null);
    localStorage.removeItem('authToken');
    setCurrentView('landing');
    navigate('/');
  };
  
  const handleInvite = () => {
    console.log('📧 Invite functionality');
    // TODO: Implement invite functionality
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    navigate('/');
  };

  // Navigation handler for tab-based navigation
  const handleTabChange = (tab: string) => {
    // The AppLayout will handle navigation via router
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Handle invite acceptance (can be accessed without auth)
  if (currentView === 'invite-acceptance') {
    return (
      <ErrorBoundary>
        <AcceptInvite />
      </ErrorBoundary>
    );
  }
  
  // Render based on current view
  if (currentView === 'landing') {
    return (
      <ErrorBoundary>
        <LandingPage 
          onLogin={handleLogin}
          onTryForFree={handleTryForFree}
        />
      </ErrorBoundary>
    );
  }
  
  if (currentView === 'login') {
    return (
      <ErrorBoundary>
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setCurrentView('register')}
          onBackToLanding={handleBackToLanding}
        />
      </ErrorBoundary>
    );
  }
  
  if (currentView === 'register') {
    return (
      <ErrorBoundary>
        <Register 
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setCurrentView('login')}
          onBackToLanding={handleBackToLanding}
        />
      </ErrorBoundary>
    );
  }
  
  // Dashboard mode - authenticated users (real or demo)
  if (currentView === 'dashboard') {
    // Create user object for dashboard (from real auth or demo)
    const displayUser = user || {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@ledgerlink.com'
    };
    
    const displayCompany = company || {
      id: 'demo-company',
      name: 'Demo Company',
      ownerId: 'demo-user'
    };

    return (
      <ErrorBoundary>
        <ToastProvider>
          <div className="App">
            <AppLayout
              user={displayUser}
              isLoggedIn={true}
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
                      <Dashboard user={displayUser} />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/matches" 
                  element={
                    <ErrorBoundary>
                      <Matches isLoggedIn={true} />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/connections" 
                  element={
                    <ErrorBoundary>
                      <ConnectionsPage companyId={displayCompany.id} />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/counterparties" 
                  element={
                    <ErrorBoundary>
                      <Counterparties />
                    </ErrorBoundary>
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
                    <ErrorBoundary>
                      <Settings />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/accept-invite/:token" 
                  element={
                    <ErrorBoundary>
                      <AcceptInvite />
                    </ErrorBoundary>
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
                          onClick={() => navigate('/dashboard')}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
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
  }
  
  // Fallback - should not reach here
  return (
    <ErrorBoundary>
      <LandingPage 
        onLogin={handleLogin}
        onTryForFree={handleTryForFree}
      />
    </ErrorBoundary>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
