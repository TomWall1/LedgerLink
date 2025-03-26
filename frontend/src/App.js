import React from 'react';
import { createHashRouter, RouterProvider, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Dashboard from './pages/Dashboard';

// Create a very basic router using hash routing instead of browser routing
// Hash routing doesn't require server configuration and might bypass the issue
const router = createHashRouter([
  {
    path: '/',
    element: <Dashboard />
  }
]);

// Minimal App with hash router
function App() {
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100">
          <RouterProvider router={router} />
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;