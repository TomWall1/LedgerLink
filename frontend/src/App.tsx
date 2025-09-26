import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

type AppView = 'landing' | 'login' | 'register' | 'dashboard';

// Component to handle tab state based on current route
const AppContent: React.FC = () => {
  const location = useLocation();
  
  // Authentication and view state
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Check for existing authentication on app load
  useEffect(() => {
    const existingToken = localStorage.getItem('authToken');
    if (existingToken && existingToken !== 'demo_token_123') {
      // If there's a real auth token, try to restore user session
      // For now, we'll just keep it simple
      setCurrentView('dashboard');
      setIsLoggedIn(true);
    }
  }, []);
  
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
    // Set up demo user and company
    const demoUser: User = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@ledgerlink.com'
    };
    const demoCompany: Company = {
      id: 'demo-company', 
      name: 'Demo Company',
      ownerId: 'demo-user'
    };
    
    setUser(demoUser);
    setCompany(demoCompany);
    setIsLoggedIn(true);
    setCurrentView('dashboard');
    
    // Set demo token for API calls
    localStorage.setItem('authToken', 'demo_token_123');
    console.log('🎯 DEMO MODE: Demo authentication token set');
  };
  
  // Auth component handlers
  const handleLoginSuccess = (userData: any) => {
    console.log('✅ Login successful', userData);
    setUser({
      id: userData.id || 'user-1',
      name: userData.name || userData.companyName || 'User',
      email: userData.email || 'user@example.com'
    });
    setCompany({
      id: userData.companyId || 'company-1',
      name: userData.companyName || 'Company',
      ownerId: userData.id || 'user-1'
    });
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };
  
  const handleRegisterSuccess = (userData: any) => {
    console.log('✅ Registration successful', userData);
    handleLoginSuccess(userData); // Same flow after registration
  };
  
  const handleLogout = () => {
    console.log('🔓 Logging out');
    setUser(null);
    setCompany(null);
    setIsLoggedIn(false);
    setCurrentView('landing');
    localStorage.removeItem('authToken');
  };
  
  const handleInvite = () => {
    console.log('📧 Invite functionality');
    // TODO: Implement invite functionality
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  // Navigation handler for tab-based navigation
  const handleTabChange = (tab: string) => {
    // The AppLayout will handle navigation via router
  };
  
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
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Login 
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setCurrentView('register')}
              onBackToLanding={handleBackToLanding}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }
  
  if (currentView === 'register') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Register 
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setCurrentView('login')}
              onBackToLanding={handleBackToLanding}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }
  
  // Dashboard mode - authenticated users
  if (currentView === 'dashboard' && isLoggedIn && user) {
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
                      <ConnectionsPage companyId={company?.id || 'demo-company'} />
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
      <AppContent />
    </Router>
  );
}

export default App;