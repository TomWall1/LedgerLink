import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { XeroProvider } from './contexts/XeroContext';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Register from './components/Register';
import SimpleCSVMatcher from './components/SimpleCSVMatcher';

// Navigation Header Component for authenticated users
const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-nav">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="h3 font-bold text-neutral-900">LedgerLink</h1>
              <p className="text-small text-neutral-400 hidden sm:block">Account Reconciliation</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search invoices, customers..."
                className="input pl-10 w-full"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></div>
            </button>

            {/* Help */}
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* User Avatar & Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-small font-medium text-neutral-900">{user.companyName || 'User'}</p>
                <p className="text-small text-neutral-400">{user.email}</p>
              </div>
              <div className="relative">
                <button className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-small">
                  {(user.companyName || user.email || 'U').charAt(0).toUpperCase()}
                </button>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-ghost text-small px-3 py-1.5 h-auto"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      <p className="text-neutral-400">Loading LedgerLink...</p>
    </div>
  </div>
);

// Simple Dashboard placeholder
const Dashboard = ({ user }) => (
  <div className="min-h-screen bg-muted">
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="h1 text-neutral-900 mb-2">
          Welcome back, {user.companyName || 'there'}! 👋
        </h1>
        <p className="text-large text-neutral-600">
          Here's your reconciliation overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-400 mb-1">Total Invoices</p>
                <p className="h2 text-neutral-900">1,247</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-400 mb-1">Match Rate</p>
                <p className="h2 text-success">94.2%</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-400 mb-1">Pending Review</p>
                <p className="h2 text-warning">72</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="h3">Recent Activity</h2>
          <p className="text-small text-neutral-400">Latest reconciliation updates</p>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="h3 text-neutral-900 mb-2">No data yet</h3>
            <p className="text-base text-neutral-400 mb-6">
              Upload your first ledger to start reconciling accounts
            </p>
            <button className="btn btn-primary">
              Upload Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Main App Router Component
const AppRouter = () => {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = React.useState('home'); // 'home', 'login', 'register', 'csv-matcher'

  if (loading) {
    return <LoadingSpinner />;
  }

  // Authenticated user - show dashboard
  if (user) {
    return (
      <div className="page-container">
        <Header user={user} onLogout={logout} />
        <main>
          <Dashboard user={user} />
        </main>
      </div>
    );
  }

  // Unauthenticated user - show based on current view
  switch (currentView) {
    case 'login':
      return (
        <Login 
          onSwitchToRegister={() => setCurrentView('register')}
          onBackToHome={() => setCurrentView('home')}
        />
      );
    
    case 'register':
      return (
        <Register 
          onSwitchToLogin={() => setCurrentView('login')}
          onBackToHome={() => setCurrentView('home')}
        />
      );
    
    case 'csv-matcher':
      return (
        <SimpleCSVMatcher 
          onBackToHome={() => setCurrentView('home')}
        />
      );
    
    case 'home':
    default:
      return (
        <HomePage 
          onLogin={() => setCurrentView('login')}
          onTryForFree={() => setCurrentView('csv-matcher')}
        />
      );
  }
};

// Root App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        {/* XeroProvider with autoCheckAuth=false to prevent automatic API calls */}
        <XeroProvider autoCheckAuth={false}>
          <AppRouter />
        </XeroProvider>
      </AuthProvider>
    </div>
  );
}

export default App;