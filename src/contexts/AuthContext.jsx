import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
  
  useEffect(() => {
    // Check if user is logged in on app start
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // No token found, user is not authenticated
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Verify token with backend
      const response = await fetch(`${apiUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, clear token and set user to null
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${apiUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    // Don't set loading here as it's a synchronous operation
  };
  
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuthStatus
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};