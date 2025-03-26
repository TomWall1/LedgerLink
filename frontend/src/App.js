import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';

// Minimal App with context providers but simple routing
function App() {
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-6">LedgerLink</h1>
          
          <BrowserRouter>
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
            
            <div className="mt-6 flex space-x-4">
              <a href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Home
              </a>
              <a href="/about" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                About
              </a>
            </div>
          </BrowserRouter>
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;