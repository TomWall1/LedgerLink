import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
      
      // First try using auth/xero/status endpoint directly
      try {
        const apiUrl = getApiUrl();
        console.log('Making direct API call to Xero auth status:', `${apiUrl}/auth/xero/status`);
        
        const response = await fetch(`${apiUrl}/auth/xero/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit', // don't send credentials
          mode: 'cors'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auth status direct response:', data);
          
          // If the backend says we're authenticated or we have local auth, consider us authenticated
          const authStatus = !!data.isAuthenticated || localStorage.getItem('xeroAuth') === 'true';
          setIsAuthenticated(authStatus);
          setIsCheckingAuth(false);
          return authStatus;
        } else {
          const errorText = await response.text();
          console.log('Direct API call failed:', response.status, errorText);
          throw new Error(`Backend error: ${response.status}`);
        }
      } catch (directError) {
        console.log('Direct auth endpoint failed, falling back to stored value:', directError);
      }
      
      // Continue using the stored authentication state
      console.log('Using stored auth value due to API error');
      const storedAuth = localStorage.getItem('xeroAuth') === 'true';
      setIsAuthenticated(storedAuth);
      setIsCheckingAuth(false);
      return storedAuth;
    } catch (error) {
      console.error('Error fetching auth status:', error);
      setError(error.message);
      setIsCheckingAuth(false);
      // Continue using the stored authentication state
      console.log('Using stored auth value due to API error');
      const storedAuth = localStorage.getItem('xeroAuth') === 'true';
      setIsAuthenticated(storedAuth);
      return storedAuth;
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
