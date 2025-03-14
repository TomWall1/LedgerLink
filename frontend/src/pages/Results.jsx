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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
            {error}
          </div>
          <div className="mt-4">
            <Link to="/upload" className="bg-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative mb-4">
            No matching results found.
          </div>
          <div className="mt-4">
            <Link to="/upload" className="bg-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Matching Results</h1>
          <div className="flex space-x-3">
            <Link to="/upload" className="bg-white hover:bg-gray-50 text-primary border border-gray-300 px-4 py-2 rounded-lg flex items-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload New Files
            </Link>
            <Link to="/account-links" className="bg-secondary hover:bg-opacity-90 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
              </svg>
              Manage Account Links
            </Link>
          </div>
        </div>

        {/* Main content - MatchingResults component */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <MatchingResults matchResults={results} handleExportAll={handleExportAll} />
        </div>
      </div>
    </div>
  );
};

export default Results;