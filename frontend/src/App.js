import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import NavHeader from './components/NavHeader.jsx';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ERPConnectionManager from './components/ERPConnectionManager';
import XeroCallback from './components/XeroCallback';
import ERPDataView from './components/ERPDataView';
import TransactionMatcher from './components/TransactionMatcher';
import CompanyLinker from './components/CompanyLinker';
import { getCurrentRoute, initRouteListener, getRouteParam } from './utils/customRouter';

// Custom route-based App
function App() {
  const [currentRoute, setCurrentRoute] = useState(getCurrentRoute());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize route listener
  useEffect(() => {
    const cleanup = initRouteListener((route) => {
      setCurrentRoute(route);
    });
    
    return cleanup;
  }, []);
  
  // Check authentication status
  useEffect(() => {
    // Simple check if token exists in localStorage
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);
  
  // Render the appropriate component based on route
  const renderContent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    // Special route for Xero callback (bypass auth check)
    if (currentRoute === 'auth/xero/callback') {
      return <XeroCallback />;
    }
    
    // Authentication routes (accessible when not logged in)
    if (!isAuthenticated) {
      switch(currentRoute) {
        case 'login':
          return <Login />;
        case 'register':
          return <Register />;
        default:
          // Redirect to login if trying to access protected route
          window.location.href = '/login';
          return null;
      }
    }
    
    // Protected routes (require authentication)
    switch(currentRoute) {
      case 'dashboard':
        return <Dashboard />;
      case 'login':
      case 'register':
        // Redirect to dashboard if already authenticated
        window.location.href = '/';
        return null;
      case 'erp-connections':
        return <ERPConnectionManager />;
      case 'erp-data':
        const connectionId = getRouteParam('connectionId');
        return <ERPDataView connectionId={connectionId} />;
      case 'transaction-matching':
        return <TransactionMatcher />;
      case 'company-links':
        return <CompanyLinker />;
      default:
        return (
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
            <a href="/" className="text-blue-500 hover:underline">Go back to dashboard</a>
          </div>
        );
    }
  };
  
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100">
          <NavHeader />
          <div className="pt-16">
            {renderContent()}
          </div>
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;