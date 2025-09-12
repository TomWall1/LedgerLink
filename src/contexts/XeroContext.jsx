import React, { createContext, useContext, useState, useEffect } from 'react';

const XeroContext = createContext();

export const useXero = () => {
  const context = useContext(XeroContext);
  if (!context) {
    throw new Error('useXero must be used within a XeroProvider');
  }
  return context;
};

export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState(null);
  
  const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
  
  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${apiUrl}/api/xero/auth-status`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated || false);
        setTenantId(data.tenantId || null);
      } else {
        setIsAuthenticated(false);
        setTenantId(null);
      }
    } catch (error) {
      console.error('Error checking Xero auth status:', error);
      setIsAuthenticated(false);
      setTenantId(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const connectToXero = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/xero/connect`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else {
        throw new Error('Failed to get Xero connection URL');
      }
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      throw error;
    }
  };
  
  const disconnectFromXero = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/xero/disconnect`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsAuthenticated(false);
        setTenantId(null);
      } else {
        throw new Error('Failed to disconnect from Xero');
      }
    } catch (error) {
      console.error('Error disconnecting from Xero:', error);
      throw error;
    }
  };
  
  const value = {
    isAuthenticated,
    isLoading,
    tenantId,
    checkAuth,
    connectToXero,
    disconnectFromXero
  };
  
  return (
    <XeroContext.Provider value={value}>
      {children}
    </XeroContext.Provider>
  );
};

export default XeroProvider;