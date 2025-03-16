import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useXero } from '../context/XeroContext';

const XeroCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsAuthenticated, getApiUrl } = useXero();

  useEffect(() => {
    const processCallback = async () => {
      // Parse the URL query parameters
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');
      const authenticated = params.get('authenticated');

      // Check for an error parameter first
      if (errorParam) {
        console.error('Error returned from Xero:', errorParam);
        setError(`Error authenticating with Xero: ${errorParam}`);
        setLoading(false);
        return;
      }

      // Check if we came back from the backend redirect with authenticated=true
      if (authenticated === 'true') {
        console.log('Successfully authenticated with Xero (via backend redirect)');
        localStorage.setItem('xeroAuth', 'true');
        setIsAuthenticated(true);
        setSuccess(true);
        setLoading(false);
        return;
      }

      // If no code parameter, check for direct backend redirects
      if (!code) {
        // This could be a redirect from our backend callback
        // with just the 'authenticated' parameter
        if (location.pathname.includes('/auth/xero/callback')) {
          console.log('Processing backend redirect');
          // The backend has already processed the OAuth flow
          // and has redirected here to complete the flow
          localStorage.setItem('xeroAuth', 'true');
          setIsAuthenticated(true);
          setSuccess(true);
          setLoading(false);
          return;
        } else {
          console.warn('No authorization code found in callback URL');
          setError('No authorization code received from Xero');
          setLoading(false);
          return;
        }
      }

      // We have a code, so we need to exchange it for tokens
      try {
        console.log('Exchanging authorization code for tokens...');
        const apiUrl = getApiUrl();

        // Try to send the code to the backend for token exchange
        try {
          // First try the auth endpoint
          const response = await fetch(`${apiUrl}/auth/xero/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, state })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              console.log('Successfully exchanged code for tokens');
              localStorage.setItem('xeroAuth', 'true');
              setIsAuthenticated(true);
              setSuccess(true);
            } else {
              throw new Error(data.error || 'Failed to exchange code for tokens');
            }
          } else {
            // Try to get error details from response
            let errorText = 'Failed to exchange code';
            try {
              const errorData = await response.json();
              errorText = errorData.error || errorData.details || 'Unknown error';
            } catch (parseError) {
              console.warn('Backend error response parsing failed:', parseError);
              errorText = await response.text();
            }

            console.warn('Backend warning:', response.status + ': ' + errorText);
            throw new Error(`${response.status}: ${errorText}`);
          }
        } catch (firstError) {
          console.warn('First attempt failed, trying API endpoint:', firstError);
          
          // Try the API endpoint as fallback
          try {
            const response = await fetch(`${apiUrl}/api/xero/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ code, state })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                console.log('Successfully exchanged code for tokens (fallback)');
                localStorage.setItem('xeroAuth', 'true');
                setIsAuthenticated(true);
                setSuccess(true);
              } else {
                throw new Error(data.error || 'Failed to exchange code for tokens');
              }
            } else {
              // Try to get error details from response
              let errorText = 'Failed to exchange code';
              try {
                const errorData = await response.json();
                errorText = errorData.error || errorData.details || 'Unknown error';
              } catch (parseError) {
                errorText = await response.text();
              }
              throw new Error(`${response.status}: ${errorText}`);
            }
          } catch (secondError) {
            console.error('Both auth attempts failed:', secondError);
            setError(`Failed to complete authentication: ${secondError.message}`);
          }
        }
      } catch (error) {
        console.error('Error processing Xero callback:', error);
        setError(`Error processing Xero callback: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [location, setIsAuthenticated, getApiUrl]);

  // Redirect to upload page after 3 seconds if successful
  useEffect(() => {
    let redirectTimer;
    if (success) {
      redirectTimer = setTimeout(() => {
        navigate('/upload', { state: { xeroEnabled: true } });
      }, 3000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [success, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-primary mb-4">Completing Authentication</h1>
          <div className="flex justify-center mb-4">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Processing your authentication with Xero...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Failed</h1>
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Authentication Successful</h1>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-green-700">Successfully connected to Xero!</p>
            <p className="text-sm text-gray-600 mt-2">Redirecting to data upload page...</p>
          </div>
          <button 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
            onClick={() => navigate('/upload', { state: { xeroEnabled: true } })}
          >
            Continue Now
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default XeroCallback;