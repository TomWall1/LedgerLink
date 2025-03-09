import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center my-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to LedgerLink</h1>
        <p className="text-xl text-gray-600 mb-8">
          A powerful tool for reconciling accounts and linking financial systems
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Upload & Match Ledgers
          </Link>
          <Link
            to="/account-links"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Manage Account Links
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Upload and Match</h2>
          <p className="text-gray-600">
            Upload AR and AP ledgers from different systems and automatically match transactions to identify discrepancies.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-green-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Link Accounts</h2>
          <p className="text-gray-600">
            Create permanent links between accounts in different systems for ongoing reconciliation and monitoring.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-purple-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Analyze Results</h2>
          <p className="text-gray-600">
            View detailed reports of matches, mismatches, and exceptions to resolve discrepancies efficiently.
          </p>
        </div>
      </div>

      <div className="bg-gray-100 p-8 rounded-lg my-12">
        <h2 className="text-2xl font-bold mb-4">New in LedgerLink</h2>
        <div className="border-l-4 border-blue-500 pl-4 mb-6">
          <h3 className="text-lg font-semibold">Account Linking System</h3>
          <p className="text-gray-600">
            Our new account linking feature allows you to create permanent connections between accounts in different systems, enabling automatic and regular reconciliation.
          </p>
        </div>
        <div className="border-l-4 border-green-500 pl-4 mb-6">
          <h3 className="text-lg font-semibold">Xero Integration</h3>
          <p className="text-gray-600">
            Connect directly to Xero to import your AR ledger data without manual CSV export and upload.
          </p>
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="text-lg font-semibold">Enhanced Matching Algorithm</h3>
          <p className="text-gray-600">
            Our improved matching engine now detects partial payments, early payments, and more complex reconciliation scenarios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;