import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Dashboard from './pages/Dashboard';

// Ultra-minimal App with no routing
function App() {
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-4">LedgerLink</h1>
          <p className="mb-8">If you can see this message, the basic app is working.</p>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <Dashboard />
          </div>
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;