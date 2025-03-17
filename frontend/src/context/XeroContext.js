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

  // Function to check authentication status with the server
  const checkServerAuth = async () => {
    try {
      setIsCheckingAuth(true);
      console.log('Checking Xero auth status with server...');
      
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/xero/status`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth check failed:', errorText);
        return false;
      }
      
      const data = await response.json();
      console.log('Server auth response:', data);
      return data.isAuthenticated === true;
    } catch (error) {
      console.error('Error checking auth with server:', error);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    // Only do the initial auth check once
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      
      const checkAuth = async () => {
        try {
          setLoading(true);
          
          // Try to get authentication from localStorage first
          const storedAuth = localStorage.getItem('xeroAuth') === 'true';
          
          if (storedAuth) {
            // If locally stored as authenticated, verify with server
            const serverAuth = await checkServerAuth();
            
            if (serverAuth) {
              // Both client and server are authenticated
              setIsAuthenticated(true);
            } else {
              // Server says not authenticated, update local storage
              localStorage.removeItem('xeroAuth');
              setIsAuthenticated(false);
            }
          } else {
            // Not authenticated locally
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Auth check error:', err);
          setError(err.message);
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      };
      
      checkAuth();
    }
  }, []);

  // This function is used to check authentication status with the server
  const checkAuth = async () => {
    const serverAuth = await checkServerAuth();
    
    // Update local state if needed
    if (serverAuth !== isAuthenticated) {
      setAuth(serverAuth);
    }
    
    return serverAuth;
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
