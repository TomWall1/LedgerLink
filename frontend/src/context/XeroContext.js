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
      
      // If authenticated from storage, verify with the server
      if (storedAuth) {
        checkAuth().catch(() => {
          console.log('Using stored auth value due to API error');
        });
      }
    }
  }, []);

  // This function is used to check authentication status with the server
  const checkAuth = async () => {
    try {
      setIsCheckingAuth(true);
      console.log('Checking Xero authentication status');
      
      // First try using the proxy directly with fetch (no Axios)
      try {
        console.log('Trying proxy endpoint for Xero auth status');
        const proxyResponse = await fetch('/api/xero-status');
        
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          console.log('Proxy endpoint response:', data);
          setIsAuthenticated(!!data.isAuthenticated);
          setIsCheckingAuth(false);
          return data.isAuthenticated;
        } else {
          console.log('Proxy returned error status:', proxyResponse.status);
          // Let the error propagate to fallback
          throw new Error(`Proxy returned ${proxyResponse.status}`);
        }
      } catch (proxyError) {
        console.log('Proxy endpoint failed, fallback to direct:', proxyError);
      }
      
      // Fallback to backend API with specific CORS-friendly settings
      console.log('Making direct API call to Xero auth status');
      const apiUrl = getApiUrl();
      
      // We're removing Pragma and Cache-Control headers that might cause issues
      const response = await fetch(`${apiUrl}/auth/xero/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth status direct response:', data);
        setIsAuthenticated(!!data.isAuthenticated);
        setIsCheckingAuth(false);
        return data.isAuthenticated;
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching auth status:', error);
      setError(error.message);
      setIsCheckingAuth(false);
      // Continue using the stored authentication state
      console.log('Using stored auth value due to API error');
      return localStorage.getItem('xeroAuth') === 'true';
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
