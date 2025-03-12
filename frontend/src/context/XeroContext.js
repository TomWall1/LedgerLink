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
      checkApiConnection(); // First check if the API is reachable
      checkAuth(); // Then check authentication
    }
  }, []);
  
  // Check if the API is reachable at all
  const checkApiConnection = async () => {
    try {
      // Simple connectivity check without credentials
      const response = await axios.get(`${getApiUrl()}/xero-public-status`);
      console.log('API connectivity check:', response.data);
      return true;
    } catch (error) {
      console.error('API connectivity check failed:', error);
      setError('Unable to connect to the LedgerLink server. Please try again later.');
      return false;
    }
  };

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) return isAuthenticated;
    
    try {
      setIsCheckingAuth(true);
      setLoading(true);
      
      // First try to get from localStorage to avoid unnecessary API calls
      const storedAuth = localStorage.getItem('xeroAuth') === 'true';
      if (storedAuth) {
        setIsAuthenticated(true);
        setLoading(false);
        setIsCheckingAuth(false);
        return true;
      }
      
      // For development, always return false to avoid API calls
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Skipping Xero API call');
        setIsAuthenticated(false);
        localStorage.removeItem('xeroAuth');
        setLoading(false);
        setIsCheckingAuth(false);
        return false;
      }
      
      // For now, let's rely on localStorage only due to CORS issues
      // This simplifies the authentication flow
      setIsAuthenticated(storedAuth);
      setLoading(false);
      setIsCheckingAuth(false);
      return storedAuth;
      
      // When we're ready to re-enable server authentication checks, uncomment this:
      /*
      try {
        const response = await axios.get(`${getApiUrl()}/auth/xero/status`);
        setIsAuthenticated(response.data.isAuthenticated);
        
        if (response.data.isAuthenticated) {
          localStorage.setItem('xeroAuth', 'true');
        } else {
          localStorage.removeItem('xeroAuth');
        }
        
        return response.data.isAuthenticated;
      } catch (error) {
        console.error('Error fetching auth status:', error);
        return storedAuth;
      }
      */
    } catch (error) {
      console.error('Error checking Xero auth:', error);
      setError(`Authentication error: ${error.message}`);
      setLoading(false);
      setIsCheckingAuth(false);
      return false;
    }
  };

  // Function to manually set authentication state
  const setAuthenticated = (value) => {
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
      setIsAuthenticated: setAuthenticated,
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
