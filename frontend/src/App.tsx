import React, { useState, useEffect } from 'react';
import { ToastProvider } from './hooks/useToast';
import { AppLayout } from './components/layout/AppLayout';
import ConnectionsPage from './pages/ConnectionsPage';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Import your existing components here
// import DashboardPage from './pages/DashboardPage';
// import MatchesPage from './pages/MatchesPage';
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

function App() {
  const [activeTab, setActiveTab] = useState('connections');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // TODO: Verify token with your backend and get user info
          // const response = await fetch('/api/auth/me', {
          //   headers: { Authorization: `Bearer ${token}` }
          // });
          // const userData = await response.json();
          // setUser(userData.user);
          // setCompany(userData.company);
          
          // For now, just set logged in status
          setIsLoggedIn(true);
          // Real user data will be fetched from backend
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
    // TODO: Implement your login logic
    // This could redirect to a login page or open a login modal
    console.log('Login clicked');
    
    // For development purposes, simulate login
    localStorage.setItem('authToken', 'demo_token_123');
    setIsLoggedIn(true);
    // Real user data will be fetched from backend
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setCompany(null);
    setActiveTab('matches'); // Redirect to a public page
  };
  
  const handleInvite = () => {
    // TODO: Implement invite counterparty logic
    console.log('Invite clicked');
  };
  
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        // TODO: Replace with your actual DashboardPage component
        // return <DashboardPage user={user} company={company} />;
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-600">Dashboard functionality - Replace this with your DashboardPage component</p>
          </div>
        );
      
      case 'connections':
        return (
          <ErrorBoundary>
            <ConnectionsPage companyId={company?.id || 'default-company'} />
          </ErrorBoundary>
        );
      
      case 'counterparties':
        // TODO: Replace with your actual CounterpartiesPage component
        // return <CounterpartiesPage user={user} company={company} />;
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Counterparties</h1>
            <p className="text-gray-600">Counterparty management - Replace this with your CounterpartiesPage component</p>
          </div>
        );
      
      case 'matches':
        // TODO: Replace with your actual MatchesPage component
        // This should be available for all users (logged in or not)
        // return <MatchesPage />;
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Transaction Matches</h1>
            <p className="text-gray-600">Transaction matching functionality - Available for all users</p>
            <p className="text-sm text-gray-500 mt-2">Replace this with your MatchesPage component</p>
          </div>
        );
      
      case 'reports':
        // TODO: Replace with your actual ReportsPage component
        // return <ReportsPage user={user} company={company} />;
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Reports</h1>
            <p className="text-gray-600">Reporting and analytics - Replace this with your ReportsPage component</p>
          </div>
        );
      
      case 'settings':
        // TODO: Replace with your actual SettingsPage component
        // return <SettingsPage user={user} company={company} />;
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-gray-600">Application settings - Replace this with your SettingsPage component</p>
          </div>
        );
      
      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <p className="text-gray-600">The requested page could not be found.</p>
          </div>
        );
    }
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
            onTabChange={setActiveTab}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onInvite={handleInvite}
          >
            {renderPage()}
          </AppLayout>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
