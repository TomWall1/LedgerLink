import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const XeroContext = createContext();

export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
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

  // Check auth status with the backend
  const checkBackendAuth = async (skipCache = false) => {
    try {
      setIsCheckingAuth(true);
      const apiUrl = getApiUrl();
      console.log('Checking auth status with backend:', apiUrl);
      
      // Add cache-busting parameter if requested
      const cacheParam = skipCache ? `?nocache=${Date.now()}` : '';
      
      // Try direct endpoint first
      try {
        const response = await fetch(`${apiUrl}/direct-auth-status${cacheParam}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Direct auth status response:', data);
          return data.isAuthenticated;
        }
      } catch (directError) {
        console.warn('Direct auth status failed:', directError);
        // Continue to standard endpoint
      }
      
      // Fall back to standard endpoint
      const response = await fetch(`${apiUrl}/auth/xero/status${cacheParam}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Backend auth check failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Backend auth response:', data);
      return data.isAuthenticated;
    } catch (error) {
      console.error('Error checking backend auth:', error);
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
          
          // First check local storage
          const storedAuth = localStorage.getItem('xeroAuth') === 'true';
          
          // If we think we're authenticated locally, verify with the backend
          if (storedAuth) {
            // Always skip cache on initial load to ensure we have fresh auth status
            const backendAuth = await checkBackendAuth(true);
            
            // Sync auth state with backend
            if (backendAuth) {
              // Both agree we're authenticated
              setIsAuthenticated(true);
              
              // Get debug info for troubleshooting (remove in production)
              checkBackendTokens().then(info => {
                setDebugInfo(info);
              });
            } else {
              // Backend says not authenticated, update local state
              localStorage.removeItem('xeroAuth');
              setIsAuthenticated(false);
            }
          } else {
            // We're not authenticated locally
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          setError('Failed to check authentication status');
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
    return await checkBackendAuth(true); // Always skip cache when manually checking
  };

  // Function to set authentication state
  const setAuth = async (value) => {
    try {
      if (value) {
        // Store auth in localStorage
        localStorage.setItem('xeroAuth', 'true');
        setIsAuthenticated(true);
      } else {
        // Clear auth and notify backend
        localStorage.removeItem('xeroAuth');
        setIsAuthenticated(false);
        
        // Try to notify backend of disconnect
        try {
          const apiUrl = getApiUrl();
          await fetch(`${apiUrl}/auth/xero/disconnect`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          console.log('Backend notified of disconnect');
        } catch (err) {
          console.warn('Failed to notify backend of disconnect:', err);
        }
      }
    } catch (err) {
      console.error('Error setting auth state:', err);
      setError('Failed to update authentication state');
    }
  };

  // Debug function to check backend token status
  const checkBackendTokens = async () => {
    try {
      const apiUrl = getApiUrl();
      
      // Try direct endpoint first
      try {
        const response = await fetch(`${apiUrl}/direct-debug-auth?nocache=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Direct debug status response:', data);
          return data;
        }
      } catch (directError) {
        console.warn('Direct debug endpoint failed:', directError);
        // Continue to standard endpoint
      }
      
      // Fall back to standard endpoint
      const response = await fetch(`${apiUrl}/auth/xero/debug-auth?nocache=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Debug check failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Backend token status:', data);
      return data;
    } catch (err) {
      console.error('Error checking tokens:', err);
      return { error: err.message };
    }
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
      getApiUrl,
      checkBackendTokens,
      isCheckingAuth,
      debugInfo
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
