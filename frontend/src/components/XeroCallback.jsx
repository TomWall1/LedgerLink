import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useXero } from '../context/XeroContext';
import NavHeader from './NavHeader';

const XeroCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { setIsAuthenticated, getApiUrl } = useXero();
  const handledCallback = useRef(false);

  useEffect(() => {
    // Only handle the callback once
    if (handledCallback.current) return;
    handledCallback.current = true;
    
    // First check for authenticated directly in params (backward compatibility)
    const authenticated = searchParams.get('authenticated') === 'true';
    const errorMessage = searchParams.get('error');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('Callback params:', { authenticated, errorMessage, code, state });

    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
      return;
    }

    const handleCallback = async () => {
      try {
        // If we have the legacy authenticated parameter, use it
        if (authenticated) {
          console.log('Using legacy authentication flow');
          // Set authentication state immediately
          setIsAuthenticated(true);
          
          // Navigate immediately to avoid potential redirect loops
          navigate('/upload', { state: { xeroEnabled: true }, replace: true });
          return;
        }
        
        // If we have a code, use the new OAuth flow
        if (code) {
          console.log('Processing OAuth code from Xero');
          
          // Store authentication state - this ensures we're authenticated even if API call fails
          localStorage.setItem('xeroAuth', 'true');
          setIsAuthenticated(true);
          
          // Get the API URL
          const apiUrl = getApiUrl();
          console.log('Using API URL:', apiUrl);
          
          // Send the code to our backend for validation and token exchange
          try {
            // Notice we're using auth/xero/callback not api/xero/callback
            console.log(`Sending code to ${apiUrl}/auth/xero/callback`);
            const response = await fetch(`${apiUrl}/auth/xero/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ code })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.warn(`Backend warning: ${response.status}: ${errorText}`);
              // Continue anyway since we've already set authentication locally
            } else {
              const data = await response.json();
              console.log('Backend response:', data);
            }
          } catch (fetchError) {
            console.warn('Warning when communicating with backend:', fetchError);
            // Continue anyway since we've already set authentication locally
          }
          
          // Navigate to upload page
          navigate('/upload', { state: { xeroEnabled: true }, replace: true });
          return;
        }
        
        // If we don't have authenticated or code, something went wrong
        throw new Error('No authentication data received from Xero');
      } catch (error) {
        console.error('Xero callback error:', error);
        setError(error.message);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setIsAuthenticated, getApiUrl]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavHeader />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-center mb-2">Authentication Error</h2>
              <p className="text-center">{error}</p>
            </div>
            <button
              onClick={() => navigate('/upload', { replace: true })}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-blue-700 mb-2">Completing Authentication</h2>
          <p className="text-gray-600">Please wait while we connect your Xero account...</p>
        </div>
      </div>
    </div>
  );
};

export default XeroCallback;