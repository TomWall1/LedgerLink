import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mt-8 mb-4">LedgerLink</h1>
          <p className="text-xl text-text">A powerful tool for reconciling accounts and linking financial systems</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-primary">Accounts Receivable Data</h2>
            <div className="space-y-3">
              <Link
                to="/upload"
                className="block bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors text-center font-medium"
              >
                <div className="flex items-center justify-center">
                  <img 
                    src="/xero-logo.svg" 
                    alt="Xero logo" 
                    className="w-5 h-5 mr-2"
                  />
                  Connect to Xero
                </div>
              </Link>
              <Link
                to="/upload"
                className="block bg-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors text-center font-medium"
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload CSV
                </div>
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-primary">Accounts Payable Data</h2>
            <Link
              to="/upload"
              className="block bg-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors text-center font-medium"
            >
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload CSV
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 text-primary">
            Account Linking Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-6">
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <div className="text-secondary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-primary">Upload and Match</h3>
              <p className="text-text">
                Upload AR and AP ledgers from different systems and automatically match transactions.
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <div className="text-secondary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-primary">Link Accounts</h3>
              <p className="text-text">
                Create permanent links between accounts in different systems for ongoing reconciliation.
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <div className="text-secondary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-primary">Analyze Results</h3>
              <p className="text-text">
                View detailed reports of matches, mismatches, and exceptions to resolve discrepancies.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-primary bg-opacity-5 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-primary">
            CSV Data Format Requirements
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-primary mb-2">Required Columns:</h3>
              <ul className="list-disc list-inside space-y-2 text-text">
                <li><span className="font-medium">transaction_number</span> - Unique identifier for each transaction</li>
                <li><span className="font-medium">transaction_type</span> - Type of transaction (e.g., INVOICE, BILL, CREDIT_NOTE)</li>
                <li><span className="font-medium">amount</span> - Decimal number (positive for AR, negative for AP)</li>
                <li><span className="font-medium">issue_date</span> - Date the transaction was issued</li>
                <li><span className="font-medium">due_date</span> - Date the transaction is due</li>
                <li><span className="font-medium">status</span> - Current status of the transaction (e.g., OPEN, PAID, VOIDED)</li>
                <li><span className="font-medium">reference</span> - Additional reference identifier (optional but useful for matching)</li>
              </ul>
            </div>
            
            <div className="text-sm text-text italic">
              Tip: Matching is based primarily on transaction numbers and references. Use consistent date formats (YYYY-MM-DD recommended).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
