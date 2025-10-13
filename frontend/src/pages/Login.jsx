import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';

const Login = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await axios.post(`${apiUrl}/api/users/login`, {
        email: formData.email,
        password: formData.password
      });
      
      const { token, user } = response.data;
      
      // Store token and update auth state
      localStorage.setItem('authToken', token);
      
      // Use AuthContext login if available, otherwise handle directly
      if (login) {
        await login(formData.email, formData.password);
      }
      
      // Redirect will be handled by AuthContext
    } catch (error) {
      setErrors({
        submit: error.response?.data?.error || 'Login failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        animation: 'fadeIn 0.4s ease-in-out'
      }}>
        {/* Logo Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            backgroundColor: '#2a8fe6',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(42, 143, 230, 0.15)'
          }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0f1724',
            marginBottom: '8px',
            lineHeight: '1.2'
          }}>
            Log in to LedgerLink
          </h1>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px 32px',
          boxShadow: '0 6px 18px rgba(14, 25, 40, 0.08)',
          border: '1px solid #e6eef9'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="email" 
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#334155',
                  marginBottom: '8px'
                }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: errors.email ? '2px solid #ef4444' : '2px solid #e6eef9',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  transition: 'all 0.12s ease',
                  outline: 'none',
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}
                onFocus={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = '#2a8fe6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(42, 143, 230, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = '#e6eef9';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.email && (
                <p style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#ef4444'
                }} role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label 
                  htmlFor="password" 
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#334155'
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  style={{
                    fontSize: '14px',
                    color: '#2a8fe6',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#1464a6'}
                  onMouseLeave={(e) => e.target.style.color = '#2a8fe6'}
                  onClick={() => {/* Handle forgot password */}}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: errors.password ? '2px solid #ef4444' : '2px solid #e6eef9',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  transition: 'all 0.12s ease',
                  outline: 'none',
                  fontFamily: "'Inter', system-ui, sans-serif"
                }}
                onFocus={(e) => {
                  if (!errors.password) {
                    e.target.style.borderColor = '#2a8fe6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(42, 143, 230, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.password) {
                    e.target.style.borderColor = '#e6eef9';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.password && (
                <p style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#ef4444'
                }} role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#991b1b',
                  margin: '0'
                }} role="alert">
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: isLoading ? '#94a3b8' : '#2a8fe6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s ease',
                boxShadow: '0 6px 18px rgba(42, 143, 230, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#1464a6';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(42, 143, 230, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#2a8fe6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 18px rgba(42, 143, 230, 0.15)';
                }
              }}
              onMouseDown={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0'
          }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                color: '#2a8fe6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                padding: '0',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.target.style.color = '#1464a6'}
              onMouseLeave={(e) => e.target.style.color = '#2a8fe6'}
            >
              Register here
            </button>
          </p>
        </div>

        {/* Trust Indicators */}
        <div style={{
          marginTop: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#64748b'
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Secure login</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#64748b'
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Bank-grade encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add keyframe animation */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
