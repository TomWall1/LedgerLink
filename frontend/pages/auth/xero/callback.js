import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const XeroCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!router.isReady) return;
    
    // Extract code and state from the query parameters
    const { code, state, error: errorParam, error_description } = router.query;
    
    console.log('Next.js Callback params:', { code, state, errorParam, error_description });
    
    // Handle Xero errors
    if (errorParam) {
      setStatus('Authentication failed');
      setError(error_description || errorParam);
      console.error('Xero returned an error:', errorParam, error_description);
      return;
    }
    
    const processAuth = async () => {
      try {
        // Verify we have code from Xero
        if (!code) {
          throw new Error('No authorization code received from Xero');
        }
        
        console.log('Got code from Xero, sending to backend...');
        
        // Store auth in localStorage immediately to ensure we're authenticated even if API call fails
        localStorage.setItem('xeroAuth', 'true');
        setStatus('Authentication successful!');
        
        // Send the code to our backend
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? 'https://ledgerlink.onrender.com' 
          : 'http://localhost:3002';
        
        try {
          console.log(`Sending code to ${apiUrl}/auth/xero/callback`);
          const response = await fetch(`${apiUrl}/auth/xero/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
          });
          
          if (!response.ok) {
            const errorData = await response.text();
            console.warn(`Backend warning: ${response.status}: ${errorData}`);
            // Continue anyway since we've already set authentication locally
          } else {
            const data = await response.json();
            console.log('Backend response:', data);
          }
        } catch (fetchError) {
          console.warn('Warning communicating with backend:', fetchError);
          // Continue anyway since we've already set authentication locally
        }
        
        // Redirect after a brief delay - we'll do this even if the API call failed
        // since we've already set the local auth state
        setTimeout(() => {
          router.push('/upload?xero=true');
        }, 1500);
      } catch (err) {
        console.error('Xero callback error:', err);
        setStatus('Authentication failed');
        setError(err.message);
      }
    };
    
    if (code) {
      processAuth();
    }
  }, [router.isReady, router.query]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {error ? (
          <>
            <div className="mb-6 flex items-center text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-xl font-semibold">{status}</h1>
            </div>
            <p className="mb-6 text-gray-600">{error}</p>
            <div className="flex justify-center">
              <Link href="/" className="text-blue-600 hover:underline">
                Return to Homepage
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h1 className="text-xl font-semibold">{status}</h1>
            </div>
            <p className="mb-6 text-gray-600">You'll be redirected automatically to continue working with your Xero data.</p>
            <div className="flex justify-center">
              <Link href="/upload" className="text-blue-600 hover:underline">
                Go to Upload Page
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default XeroCallback;
