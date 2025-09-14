/**
 * Example App.tsx integration with Xero functionality
 * Update your existing App.tsx with these changes
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './hooks/useToast';
import ConnectionsPage from './pages/ConnectionsPage';
// Import your existing pages here
// import DashboardPage from './pages/DashboardPage';
// import MatchesPage from './pages/MatchesPage';
// etc.

// Import global styles
import './styles/global.css';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('connections');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [companyId] = useState('default-company'); // Get this from your user/company context
  
  // Initialize authentication state
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token and get user info
      // This depends on your existing auth implementation
      setIsLoggedIn(true);
      setUser({
        id: 'user-id',
        name: 'John Doe',
        email: 'john@example.com'
      });
    }
  }, []);
  
  const handleLogin = () => {
    // Implement your login logic
    console.log('Login clicked');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('matches'); // Redirect to public page
  };
  
  const handleInvite = () => {
    // Implement invite counterparty logic
    console.log('Invite clicked');
  };
  
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        // return <DashboardPage />;
        return <div className="p-8">Dashboard - Coming Soon</div>;
      
      case 'connections':
        return <ConnectionsPage companyId={companyId} />;
      
      case 'counterparties':
        // return <CounterpartiesPage />;
        return <div className="p-8">Counterparties - Coming Soon</div>;
      
      case 'matches':
        // return <MatchesPage />;
        return <div className="p-8">Matches - Available for all users</div>;
      
      case 'reports':
        // return <ReportsPage />;
        return <div className="p-8">Reports - Coming Soon</div>;
      
      case 'settings':
        // return <SettingsPage />;
        return <div className="p-8">Settings - Coming Soon</div>;
      
      default:
        return <div className="p-8">Page not found</div>;
    }
  };
  
  return (
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
  );
}

export default App;