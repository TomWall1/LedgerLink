import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const XeroContext = createContext();

export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [error, setError] = useState(null);
  // Use a ref to track if we've already performed the initial check
  const initialCheckDone = useRef(false);

  // Get the API URL once to ensure consistency
  const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
  };

  useEffect(() => {
    // Only do the initial auth check once
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      // Check the local auth state only - don't try to connect to server yet
      const storedAuth = localStorage.getItem('xeroAuth') === 'true';
      setIsAuthenticated(storedAuth);
      setLoading(false);
    }
  }, []);

  // This function is only used internally
  const checkAuth = async () => {
    // Just check local storage and return the value
    // We're not making server calls due to CORS issues
    const storedAuth = localStorage.getItem('xeroAuth') === 'true';
    return storedAuth;
  };

  // Function to set authentication state
  const setAuth = (value) => {
    if (value) {
      localStorage.setItem('xeroAuth', 'true');
    } else {
      localStorage.removeItem('xeroAuth');
    }
    setIsAuthenticated(value);
  };

  return (
    <XeroContext.Provider value={{
      isAuthenticated, 
      setIsAuthenticated: setAuth,
      customerData,
      setCustomerData,
      checkAuth,
      loading,
      error,
      getApiUrl
    }}>
      {children}
    </XeroContext.Provider>
  );
};

export const useXero = () => {
  const context = useContext(XeroContext);
  if (!context) {
    throw new Error('useXero must be used within a XeroProvider');
  }
  return context;
};
