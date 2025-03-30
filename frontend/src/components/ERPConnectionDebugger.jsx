import React, { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * ERPConnectionDebugger - A development tool for testing the ERP connection endpoints
 * 
 * This component helps developers test various ERP connection endpoints and view raw API
 * responses. It is intended for development/debugging only and should not be used in
 * production views.
 */
const ERPConnectionDebugger = () => {
  const [endpointTests, setEndpointTests] = useState([
    { name: 'Server Root', endpoint: '/', status: 'pending', data: null, error: null },
    { name: 'Health Check', endpoint: '/api/health', status: 'pending', data: null, error: null },
    { name: 'ERP Connections (with API prefix)', endpoint: '/api/erp-connections', status: 'pending', data: null, error: null },
    { name: 'ERP Connections (without prefix)', endpoint: '/erp-connections', status: 'pending', data: null, error: null },
  ]);
  const [testRunning, setTestRunning] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const runTests = async () => {
    setTestRunning(true);
    
    // Create a copy of the tests to update
    const updatedTests = [...endpointTests];
    
    // Run each test sequentially
    for (let i = 0; i < updatedTests.length; i++) {
      const test = updatedTests[i];
      test.status = 'running';
      setEndpointTests([...updatedTests]);
      
      try {
        const response = await api.get(test.endpoint, {
          validateStatus: () => true, // Don't throw errors for any status code
          timeout: 5000 // 5 second timeout
        });
        
        test.status = 'success';
        test.data = response.data;
        test.statusCode = response.status;
        test.error = null;
      } catch (err) {
        test.status = 'error';
        test.data = null;
        test.error = err.message || 'Unknown error';
        
        // Add more debug info if available
        if (err.response) {
          test.statusCode = err.response.status;
          test.responseData = err.response.data;
        }
      }
      
      // Update the state after each test
      setEndpointTests([...updatedTests]);
    }
    
    setTestRunning(false);
  };

  const toggleExpand = (index) => {
    if (expanded === index) {
      setExpanded(null);
    } else {
      setExpanded(index);
    }
  };

  const formatData = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (err) {
      return String(data);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">ERP Connection Endpoint Debugger</h2>
        <button
          onClick={runTests}
          disabled={testRunning}
          className={`px-4 py-2 rounded ${testRunning 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        >
          {testRunning ? 'Testing...' : 'Run Tests'}
        </button>
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        This tool tests the availability of the ERP connection endpoints and other critical API paths.
        Use it to troubleshoot backend connectivity issues.
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {endpointTests.map((test, index) => (
              <React.Fragment key={test.endpoint}>
                <tr className={expanded === index ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{test.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{test.endpoint}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {test.status === 'pending' && <span className="text-gray-500">Not Run</span>}
                    {test.status === 'running' && (
                      <span className="text-yellow-500 flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-yellow-500 rounded-full"></span>
                        Running
                      </span>
                    )}
                    {test.status === 'success' && <span className="text-green-600">Success</span>}
                    {test.status === 'error' && <span className="text-red-600">Error</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {test.statusCode ? (
                      <span className={`px-2 py-1 rounded-full font-mono text-xs ${test.statusCode >= 200 && test.statusCode < 300 
                        ? 'bg-green-100 text-green-800' 
                        : test.statusCode >= 400 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'}`}>
                        {test.statusCode}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {(test.status === 'success' || test.status === 'error') && (
                      <button
                        onClick={() => toggleExpand(index)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expanded === index ? 'Hide Details' : 'Show Details'}
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === index && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 bg-gray-50">
                      <div className="rounded-lg overflow-hidden border border-gray-200">
                        {test.error ? (
                          <div className="bg-red-50 p-4 border-b border-red-200">
                            <h4 className="text-red-800 font-medium">Error</h4>
                            <p className="text-red-700 font-mono text-sm">{test.error}</p>
                          </div>
                        ) : null}
                        
                        {test.data ? (
                          <div className="p-4">
                            <h4 className="text-gray-800 font-medium mb-2">Response Data</h4>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                              {formatData(test.data)}
                            </pre>
                          </div>
                        ) : (test.responseData ? (
                          <div className="p-4">
                            <h4 className="text-gray-800 font-medium mb-2">Error Response Data</h4>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                              {formatData(test.responseData)}
                            </pre>
                          </div>
                        ) : null)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ERPConnectionDebugger;
