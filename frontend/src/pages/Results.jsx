import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MatchingResults from '../components/MatchingResults';

const Results = () => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // First try to use results from location state (if coming from Upload page)
    if (location.state?.results) {
      setResults(location.state.results);
      setIsLoading(false);
      return;
    }
    
    // Otherwise fetch from API
    const fetchResults = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
        const response = await axios.get(`${apiUrl}/api/match`);
        setResults(response.data);
      } catch (err) {
        console.error('Error fetching match results:', err);
        setError('Failed to fetch matching results. Please try again or upload new files.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [location.state]);

  const handleExportAll = () => {
    // This is handled by the MatchingResults component's internal export functionality
    console.log('Export all data triggered');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/upload" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Go Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto my-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          No matching results found.
        </div>
        <div className="mt-4">
          <Link to="/upload" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Go Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Matching Results</h1>
        <div className="flex space-x-2">
          <Link to="/upload" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload New Files
          </Link>
          <Link to="/account-links" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
            Manage Account Links
          </Link>
        </div>
      </div>

      {/* Main content - MatchingResults component */}
      <MatchingResults matchResults={results} handleExportAll={handleExportAll} />
    </div>
  );
};

export default Results;