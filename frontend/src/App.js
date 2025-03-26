import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Dashboard from './pages/Dashboard';

// Custom routing without React Router
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
  // Render content based on current page
  const renderContent = () => {
    switch(currentPage) {
      case 'home':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Home Page</h2>
            <p>Welcome to LedgerLink - your account reconciliation solution.</p>
            <div className="mt-6">
              <Dashboard />
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">About Page</h2>
            <p>LedgerLink helps businesses connect their financial systems and reconcile accounts across organizations.</p>
          </div>
        );
      case 'connections':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Connections</h2>
            <p>This page would normally show your ERP connections.</p>
          </div>
        );
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
          </div>
        );
    }
  };
  
  // Handle navigation
  const navigate = (page) => {
    setCurrentPage(page);
    // Update URL without page reload (for a better UX)
    window.history.pushState(null, "", `/${page === 'home' ? '' : page}`);
  };
  
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-6">LedgerLink</h1>
          
          {/* Navigation */}
          <div className="mb-6 flex space-x-4">
            <button 
              onClick={() => navigate('home')} 
              className={`px-4 py-2 rounded ${currentPage === 'home' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
            >
              Home
            </button>
            <button 
              onClick={() => navigate('about')} 
              className={`px-4 py-2 rounded ${currentPage === 'about' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
            >
              About
            </button>
            <button 
              onClick={() => navigate('connections')} 
              className={`px-4 py-2 rounded ${currentPage === 'connections' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
            >
              Connections
            </button>
          </div>
          
          {/* Content area */}
          {renderContent()}
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;