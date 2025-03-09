import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const XeroCallback = () => {
  const [status, setStatus] = useState('Processing');
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get query params from URL
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        
        if (!code) {
          setError('No authorization code received from Xero');
          setStatus('Failed');
          return;
        }
        
        setStatus('Exchanging code for access token...');
        
        // Make API call to backend to exchange the code for an access token
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        await axios.post(`${apiUrl}/auth/xero/callback`, { code });
        
        setStatus('Success! Redirecting...');
        
        // Redirect back to the upload page after successful authentication
        setTimeout(() => {
          navigate('/upload', { 
            state: { xeroAuthenticated: true } 
          });
        }, 2000);
        
      } catch (err) {
        console.error('Error during Xero callback processing:', err);
        setError(err.response?.data?.error || err.message || 'Unknown error occurred');
        setStatus('Failed');
      }
    };
    
    processCallback();
  }, [location, navigate]);
  
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Xero Authorization</h1>
      
      <div className="mb-6 flex flex-col items-center">
        {status === 'Processing' || status.includes('Exchanging') ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        ) : status === 'Success! Redirecting...' ? (
          <div className="text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        
        <p className={`text-center ${status === 'Failed' ? 'text-red-600' : 'text-gray-700'}`}>
          {status}
        </p>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {status === 'Failed' && (
        <div className="text-center">
          <button 
            onClick={() => navigate('/upload')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Return to Upload Page
          </button>
        </div>
      )}
    </div>
  );
};

export default XeroCallback;