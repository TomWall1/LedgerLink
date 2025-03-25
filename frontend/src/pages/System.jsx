import React from 'react';
import SystemStatus from '../components/SystemStatus';

const System = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">System Status</h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            This page shows the current status of the LedgerLink system components including the API server and database connection.
            Use this to diagnose any connection or database issues.
          </p>
        </div>
        
        <SystemStatus />
        
        {/* MongoDB Info Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 my-4">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">MongoDB Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about MongoDB setup and usage</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Connection String Format</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <code className="bg-gray-100 p-1 rounded">mongodb://localhost:27017/ledgerlink</code>
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Database Collections</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <span className="flex-1 w-0 truncate">users</span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="font-medium text-blue-600">User accounts</span>
                      </div>
                    </li>
                    <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <span className="flex-1 w-0 truncate">companies</span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="font-medium text-blue-600">Company profiles</span>
                      </div>
                    </li>
                    <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <span className="flex-1 w-0 truncate">companylinks</span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="font-medium text-blue-600">Company relationships</span>
                      </div>
                    </li>
                    <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <span className="flex-1 w-0 truncate">transactions</span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="font-medium text-blue-600">Transaction records</span>
                      </div>
                    </li>
                  </ul>
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Common MongoDB Issues</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-4">
                    <div className="rounded-md bg-yellow-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Service Not Running</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>If MongoDB is not running as a Windows service, start it from the Services panel (services.msc)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-md bg-yellow-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Connection String Issues</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>Verify the connection string in the backend .env file matches your MongoDB setup</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Helpful Resources */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 my-4">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Development Resources</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Links to helpful documentation and tools</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5">
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>
                <a href="https://mongodb.github.io/node-mongodb-native/" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                  MongoDB Node.js Driver Documentation
                </a>
              </li>
              <li>
                <a href="https://mongoosejs.com/docs/" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                  Mongoose Documentation (MongoDB ODM)
                </a>
              </li>
              <li>
                <a href="https://www.mongodb.com/docs/manual/installation/" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                  MongoDB Installation Guide
                </a>
              </li>
              <li>
                <a href="https://github.com/TomWall1/LedgerLink/blob/main/DEVELOPMENT_GUIDE.md" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                  LedgerLink Development Guide
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default System;
