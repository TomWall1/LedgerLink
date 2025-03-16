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
      checkAuth();
    }
  }, []);

  // This function is used to check authentication status with the server
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
        const apiUrl = getApiUrl();
        console.log('Checking Xero authentication status from API:', apiUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        // Try both endpoints with a preference for /auth/xero/status
        try {
          const response = await fetch(`${apiUrl}/auth/xero/status`, {
            signal: controller.signal,
            credentials: 'include' // Include cookies if any
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Xero authentication status:', data);
            
            setIsAuthenticated(data.isAuthenticated);
            
            // Also update localStorage to keep state consistent
            if (data.isAuthenticated) {
              localStorage.setItem('xeroAuth', 'true');
            } else {
              localStorage.removeItem('xeroAuth');
            }
            
            clearTimeout(timeoutId);
            setLoading(false);
            setIsCheckingAuth(false);
            return data.isAuthenticated;
          }
        } catch (firstError) {
          console.warn('Failed to check auth with /auth/xero/status:', firstError.message);
          // Try the alternative endpoint
          try {
            const response = await fetch(`${apiUrl}/api/xero/status`, {
              signal: controller.signal,
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('Xero authentication status from alternative endpoint:', data);
              
              setIsAuthenticated(data.isAuthenticated);
              
              // Update localStorage
              if (data.isAuthenticated) {
                localStorage.setItem('xeroAuth', 'true');
              } else {
                localStorage.removeItem('xeroAuth');
              }
              
              clearTimeout(timeoutId);
              setLoading(false);
              setIsCheckingAuth(false);
              return data.isAuthenticated;
            }
          } catch (secondError) {
            console.warn('Failed to check auth with alternative endpoint:', secondError.message);
            // Continue with fallback to localStorage value
          }
        }
        
        clearTimeout(timeoutId);
        // If all API calls fail, use the localStorage value as fallback
        console.log('Using stored auth value due to API failures');
        setIsAuthenticated(storedAuth);
        setLoading(false);
        setIsCheckingAuth(false);
        return storedAuth;
      } catch (error) {
        // If the API call fails (e.g., timeout), use the localStorage value
        console.error('Error fetching auth status:', error);
        setError(`Failed to connect to Xero service: ${error.message}`);
        setIsAuthenticated(storedAuth);
        setLoading(false);
        setIsCheckingAuth(false);
        return storedAuth;
      }
    } catch (error) {
      console.error('Error checking Xero auth:', error);
      setError(`Authentication error: ${error.message}`);
      setLoading(false);
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
