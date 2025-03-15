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
      
      // First try using the proxy with native fetch API
      try {
        console.log('Trying proxy endpoint for Xero auth status');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const proxyResponse = await fetch('/api/xero-status', {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          console.log('Proxy endpoint response:', data);
          setIsAuthenticated(!!data.isAuthenticated);
          setIsCheckingAuth(false);
          return data.isAuthenticated;
        } else {
          const errorText = await proxyResponse.text();
          console.log('Proxy returned error:', proxyResponse.status, errorText);
          throw new Error(`Proxy error: ${proxyResponse.status}`);
        }
      } catch (proxyError) {
        console.log('Proxy endpoint failed, falling back to direct API call:', proxyError);
      }
      
      // Fallback to direct API call using fetch API
      console.log('Making direct API call to Xero auth status');
      const apiUrl = getApiUrl();
      
      // Using fetch with minimal headers to avoid CORS issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/auth/xero/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }, // minimal headers
        credentials: 'omit', // don't send credentials
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
