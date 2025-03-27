import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

// Create the Xero context
const XeroContext = createContext();

// Provider component
export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Get the API URL based on environment
  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'development') {
      return process.env.REACT_APP_API_URL || 'http://localhost:3002';
    }
    return process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
  };
  
  // Check Xero authentication status
  const checkAuthStatus = useCallback(async (force = false) => {
    try {
      setIsCheckingAuth(true);
      
      // Don't check too frequently unless forced
      const now = new Date();
      if (!force && lastChecked && (now - lastChecked) < 30000) {
        // If last check was less than 30 seconds ago, don't check again
        setIsCheckingAuth(false);
        return isAuthenticated;
      }
      
      // Use the enhanced API utility
      const response = await api.xero.getAuthStatus();
      
      setLastChecked(now);
      const authenticated = response.data.isAuthenticated === true;
      setIsAuthenticated(authenticated);
      
      // If authenticated, also fetch connection details
      if (authenticated) {
        fetchConnectionDetails();
      }
      
      return authenticated;
    } catch (error) {
      console.error('Error checking Xero auth status:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated, lastChecked]);
  
  // Check authentication status on load
  useEffect(() => {
    checkAuthStatus();
    
    // Set up a periodic check every 5 minutes
    const interval = setInterval(() => {
      checkAuthStatus(true);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [checkAuthStatus]);
  
  // Fetch Xero connection details
  const fetchConnectionDetails = async () => {
    try {
      // Only try to fetch details if we believe we're authenticated
      if (!isAuthenticated) return null;
      
      const response = await api.xero.getConnectionDetails();
      if (response.data && response.data.organization) {
        setConnectionDetails(response.data);
        return response.data;
      } else {
        setConnectionDetails(null);
        return null;
      }
    } catch (error) {
      console.warn('Error fetching Xero connection details:', error);
      setConnectionDetails(null);
      return null;
    }
  };
  
  // Function to check token status for debugging
  const checkBackendTokens = async () => {
    try {
      const response = await api.get('/auth/xero/debug-auth');
      const tokenInfo = response.data.tokenInfo;
      setDebugInfo(tokenInfo);
      
      // Update authentication status based on debug info
      if (tokenInfo) {
        const hasValidToken = tokenInfo.hasAccessToken && 
          (!tokenInfo.expiresAt || new Date(tokenInfo.expiresAt) > new Date());
        setIsAuthenticated(hasValidToken);
      }
      
      return tokenInfo;
    } catch (error) {
      console.error('Error fetching token debug info:', error);
      return null;
    }
  };
  
  // Function to refresh token
  const refreshToken = async () => {
    try {
      setRefreshingToken(true);
      const response = await api.post('/auth/xero/refresh-token');
      if (response.data.success) {
        setIsAuthenticated(true);
        await checkBackendTokens(); // Update debug info
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    } finally {
      setRefreshingToken(false);
    }
  };
  
  // Context values
  const contextValue = {
    isAuthenticated,
    setIsAuthenticated,
    isCheckingAuth,
    getApiUrl,
    checkBackendTokens,
    debugInfo,
    connectionDetails,
    checkAuthStatus,
    refreshToken,
    refreshingToken,
    fetchConnectionDetails
  };
  
  return (
    <XeroContext.Provider value={contextValue}>
      {children}
    </XeroContext.Provider>
  );
};

// Custom hook to use the Xero context
export const useXero = () => useContext(XeroContext);
