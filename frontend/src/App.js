import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';

// Using HashRouter instead of BrowserRouter
function App() {
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-6">LedgerLink</h1>
          
          <HashRouter>
            <div className="mb-6 flex space-x-4">
              <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Home
              </Link>
              <Link to="/about" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                About
              </Link>
            </div>
            
            <Routes>
              <Route 
                path="/" 
                element={<div className="bg-white p-6 rounded-lg shadow-md">Home Page</div>} 
              />
              <Route 
                path="/about" 
                element={<div className="bg-white p-6 rounded-lg shadow-md">About Page</div>} 
              />
            </Routes>
          </HashRouter>
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;