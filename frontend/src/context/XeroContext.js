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

  useEffect(() => {
    // Only do the initial auth check once
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) return isAuthenticated;
    
    try {
      setIsCheckingAuth(true);
      setLoading(true);
      setError(null);
      
      // First try to get from localStorage to avoid unnecessary API calls
      const storedAuth = localStorage.getItem('xeroAuth') === 'true';
      if (storedAuth) {
        setIsAuthenticated(true);
        setLoading(false);
        setIsCheckingAuth(false);
        return true;
      }
      
      // Only call the API if we don't have the auth state in localStorage
      try {
        // For simplicity in development, let's skip the real API call and return false
        // This will prevent the error and let us test other functionality
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Skipping Xero API call');
          setIsAuthenticated(false);
          localStorage.removeItem('xeroAuth');
          return false;
        }
        
        const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
        const response = await axios.get(`${apiUrl}/auth/xero/status`, {
          timeout: 8000, // 8 second timeout
          withCredentials: true // Include cookies if any
        });
        
        console.log('Xero authentication status:', response.data);
        setIsAuthenticated(response.data.isAuthenticated);
        
        // Also update localStorage to keep state consistent
        if (response.data.isAuthenticated) {
          localStorage.setItem('xeroAuth', 'true');
        } else {
          localStorage.removeItem('xeroAuth');
        }
        
        return response.data.isAuthenticated;
      } catch (error) {
        // If the API call fails, use the localStorage value
        console.error('Error fetching auth status:', error);
        
        // In development, we'll just suppress the error
        if (process.env.NODE_ENV === 'development') {
          return false;
        }
        
        setError(`Failed to connect to Xero service: ${error.message}`);
        return storedAuth;
      }
    } catch (error) {
      console.error('Error checking Xero auth:', error);
      
      // In development, we'll just suppress the error
      if (process.env.NODE_ENV === 'development') {
        return false;
      }
      
      setError(`Authentication error: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  return (
    <XeroContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      customerData,
      setCustomerData,
      checkAuth,
      loading,
      error
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
