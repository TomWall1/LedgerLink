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
    console.log('AuthContext: Initializing auth check...');
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      console.log('AuthContext: Checking auth status...');
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      console.log('AuthContext: Token found:', !!token);
      
      if (!token) {
        // No token, user is not logged in
        console.log('AuthContext: No token found, setting user to null');
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('AuthContext: Verifying token with backend...');
      // Verify token with backend
      const response = await fetch(`${apiUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('AuthContext: Token valid, user authenticated:', userData.email);
        setUser(userData);
      } else {
        // Token is invalid, remove it
        console.log('AuthContext: Token invalid, removing token');
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Error checking auth status:', error);
      // On error, assume user is not logged in
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      console.log('AuthContext: Auth check complete, loading set to false');
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      const response = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('AuthContext: Login successful');
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        console.log('AuthContext: Login failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return { success: false, error: 'Network error - please try again' };
    }
  };
  
  const register = async (name, email, password) => {
    try {
      console.log('AuthContext: Attempting registration for:', email);
      const response = await fetch(`${apiUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('AuthContext: Registration successful');
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        console.log('AuthContext: Registration failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      return { success: false, error: 'Network error - please try again' };
    }
  };
  
  const logout = () => {
    console.log('AuthContext: Logging out user');
    localStorage.removeItem('authToken');
    setUser(null);
  };
  
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuthStatus
  };
  
  console.log('AuthContext: Current state - user:', !!user, 'loading:', loading);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};