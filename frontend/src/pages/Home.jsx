import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Reconcile Faster.<br />
                  Get Paid Sooner.
                </h1>
                <p className="text-xl text-gray-600">
                  Automate your account reconciliation and identify discrepancies in seconds.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/upload"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-center font-medium shadow-sm"
                >
                  Try for Free
                </Link>
                <Link
                  to="/upload"
                  className="inline-block bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-center font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>
            
            {/* Right Content - Dashboard Illustration */}
            <div className="hidden md:block">
              <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 border border-gray-200">
                <div className="bg-gray-50 p-3 rounded-t-lg border-b border-gray-200 flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="p-4 space-y-6">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-100 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="w-1/3 h-28 bg-blue-50 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="w-2/3 space-y-4">
                      <div className="h-12 bg-gray-100 rounded"></div>
                      <div className="h-12 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">1</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Connect</h3>
              <p className="text-gray-600">Import your ledger data directly from Xero or upload a CSV file.</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">2</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reconcile</h3>
              <p className="text-gray-600">Match transactions and identify discrepancies automatically in real-time.</p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">3</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Accelerate</h3>
              <p className="text-gray-600">Resolve discrepancies quickly and get paid faster with clear reporting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
