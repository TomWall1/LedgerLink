import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TransactionMatch = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // This is a placeholder until the full component is implemented
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction Matching</h1>
          <button
            onClick={() => navigate('/account-links')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            Back to Company Links
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            {linkId ? 'Company Link Transaction Matching' : 'Cross-Company Transaction Matching'}
          </h2>
          <p className="text-gray-600 mb-6">
            This feature is currently being implemented. The full transaction matching interface
            will allow you to compare and reconcile transactions between your company and linked companies.
          </p>
          <button
            onClick={() => navigate('/account-links')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Manage Company Links
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionMatch;