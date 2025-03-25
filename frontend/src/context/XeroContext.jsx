import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// Create the Xero context
const XeroContext = createContext();

// Provider component
export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Get the API URL based on environment
  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'development') {
      return process.env.REACT_APP_API_URL || 'http://localhost:3002';
    }
    return process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
  };
  
  // Check Xero authentication status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsCheckingAuth(true);
        const response = await api.get('/auth/xero/status');
        setIsAuthenticated(response.data.isAuthenticated === true);
      } catch (error) {
        console.error('Error checking Xero auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Function to check token status for debugging
  const checkBackendTokens = async () => {
    try {
      const response = await api.get('/auth/xero/debug-auth');
      setDebugInfo(response.data.tokenInfo);
      return response.data.tokenInfo;
    } catch (error) {
      console.error('Error fetching token debug info:', error);
      return null;
    }
  };
  
  // Context values
  const contextValue = {
    isAuthenticated,
    setIsAuthenticated,
    isCheckingAuth,
    getApiUrl,
    checkBackendTokens,
    debugInfo
  };
  
  return (
    <XeroContext.Provider value={contextValue}>
      {children}
    </XeroContext.Provider>
  );
};

// Custom hook to use the Xero context
export const useXero = () => useContext(XeroContext);
