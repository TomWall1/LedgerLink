import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      // Redirect to dashboard after successful login
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#2a8fe6' }}>
              <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>LL</span>
            </div>
          </Link>
        </div>
        
        {/* Login Card */}
        <div className="bg-white rounded-xl p-8 shadow-md" style={{ boxShadow: '0 6px 18px rgba(14,25,40,0.08)' }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2" style={{ 
              color: '#0f1724', 
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontWeight: 600 
            }}>
              Log in to LedgerLink
            </h1>
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 rounded-lg" style={{ 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca' 
              }}>
                <div className="flex items-start">
                  <svg className="h-5 w-5 mt-0.5 mr-2" style={{ color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm" style={{ color: '#dc2626', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                    {error}
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium mb-2"
                  style={{ 
                    color: '#334155',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                  }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 rounded-lg transition-all duration-200"
                  style={{
                    height: '40px',
                    border: '1px solid #e6eef9',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2a8fe6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(42,143,230,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e6eef9';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="you@example.com"
                />
              </div>
              
              {/* Password Input */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium mb-2"
                  style={{ 
                    color: '#334155',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 rounded-lg transition-all duration-200"
                  style={{
                    height: '40px',
                    border: '1px solid #e6eef9',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2a8fe6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(42,143,230,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e6eef9';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your password"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 rounded-lg text-white font-medium text-sm transition-all duration-200"
              style={{
                height: '40px',
                backgroundColor: loading ? '#94a3b8' : '#2a8fe6',
                boxShadow: loading ? 'none' : '0 6px 18px rgba(42,143,230,0.12)',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#1464a6';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#2a8fe6';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Log in'
              )}
            </button>
          </form>
          
          {/* Links */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#e6eef9' }}>
            <div className="text-center text-sm" style={{ 
              color: '#334155',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}>
              <span>Can't log in? </span>
              <a href="#" className="font-medium" style={{ color: '#2a8fe6' }}>
                Get help
              </a>
            </div>
          </div>
        </div>
        
        {/* Sign up link */}
        <div className="mt-6 text-center text-sm" style={{ 
          color: '#334155',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          <span>Don't have an account? </span>
          <Link to="/register" className="font-medium" style={{ color: '#2a8fe6' }}>
            Sign up
          </Link>
        </div>
        
        {/* Back to home */}
        <div className="mt-4 text-center">
          <Link 
            to="/" 
            className="text-sm inline-flex items-center"
            style={{ 
              color: '#94a3b8',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
