import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const XeroCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!router.isReady) return;
    
    // Get the query parameters
    const { authenticated, error } = router.query;
    
    if (authenticated === 'true') {
      // Store authentication state in localStorage
      localStorage.setItem('xeroAuth', 'true');
      setStatus('Authentication successful!');
      
      // Redirect after a brief delay
      const timer = setTimeout(() => {
        router.push('/upload?xero=true');
      }, 1500);
      
      return () => clearTimeout(timer);
    } else if (error) {
      // Handle error
      setStatus('Authentication failed');
      setError(decodeURIComponent(error));
      console.log('Xero callback error:', new Error(decodeURIComponent(error)));
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
