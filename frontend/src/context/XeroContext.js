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

  // Get the API URL based on environment
  const getApiUrl = () => {
    // For production
    if (process.env.NODE_ENV === 'production') {
      return 'https://ledgerlink.onrender.com';
    }
    // For development - use local server
    return 'http://localhost:3002';
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

  // This function is used to check authentication status with the server
  const checkAuth = async () => {
    try {
      setIsCheckingAuth(true);
      const apiUrl = getApiUrl();
      
      // Try connecting through Vercel proxy first
      try {
        const response = await axios.get('/api/xero-status', {
          timeout: 5000 // 5 second timeout
        });
        
        setIsAuthenticated(!!response.data.isAuthenticated);
        setIsCheckingAuth(false);
        return response.data.isAuthenticated;
      } catch (err) {
        console.warn('Proxy endpoint failed, falling back to direct API call:', err);
        
        // Fall back to direct API call
        console.log('Making direct API call to Xero auth status');
        const directResponse = await axios.get(`${apiUrl}/auth/xero/status`, {
          withCredentials: false
        });
        
        setIsAuthenticated(!!directResponse.data.isAuthenticated);
        setIsCheckingAuth(false);
        return directResponse.data.isAuthenticated;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setError(error.message);
      setIsCheckingAuth(false);
      return false;
    }
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
