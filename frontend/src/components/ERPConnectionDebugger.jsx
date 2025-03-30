import React, { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * A debugging component for ERP connections that helps troubleshoot API issues
 * Shows detailed connection status information and allows testing endpoints
 */
const ERPConnectionDebugger = ({ onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/api/erp-connections');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('{
  "connectionName": "Test Connection",
  "provider": "xero",
  "connectionType": "ar"
}');

  useEffect(() => {
    // Run initial health check when component mounts
    runHealthCheck();
  }, []);

  const addResult = (label, success, message, data = null) => {
    setResults(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        label,
        success,
        message,
        data
      },
      ...prev
    ]);
  };

  const runHealthCheck = async () => {
    setLoading(true);
    addResult('Health Check', null, 'Running server health check...');
    
    try {
      const isHealthy = await api.checkHealth();
      addResult(
        'Health Check',
        isHealthy,
        isHealthy ? 'Server is healthy and responding' : 'Server health check failed'
      );
    } catch (error) {
      addResult('Health Check', false, `Error running health check: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async () => {
    setLoading(true);
    addResult('API Request', null, `Testing ${method} ${endpoint}...`);
    
    try {
      let response;
      const options = {};
      
      // Add request body for POST/PUT methods
      if (method === 'POST' || method === 'PUT') {
        try {
          options.data = JSON.parse(requestBody);
        } catch (e) {
          addResult('API Request', false, `Invalid JSON in request body: ${e.message}`);
          setLoading(false);
          return;
        }
      }
      
      // Make the request based on the selected method
      switch (method) {
        case 'GET':
          response = await api.get(endpoint);
          break;
        case 'POST':
          response = await api.post(endpoint, options.data);
          break;
        case 'PUT':
          response = await api.put(endpoint, options.data);
          break;
        case 'DELETE':
          response = await api.delete(endpoint);
          break;
        default:
          throw new Error(`Method ${method} not supported`);
      }
      
      addResult(
        'API Request',
        true,
        `${method} ${endpoint} succeeded with status ${response.status}`,
        response.data
      );
    } catch (error) {
      let errorData = null;
      if (error.response) {
        errorData = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
      
      addResult(
        'API Request',
        false,
        `${method} ${endpoint} failed: ${error.message}`,
        errorData
      );
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (success) => {
    if (success === null) return 'bg-gray-100';
    return success ? 'bg-green-100' : 'bg-red-100';
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold">ERP Connection Debugger</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Run Health Check
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            >
              Clear Results
            </button>
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Test API Endpoint</h3>
            <div className="flex space-x-2 mb-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/erp-connections"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={testEndpoint}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Test
              </button>
            </div>
            
            {(method === 'POST' || method === 'PUT') && (
              <div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Enter request body as JSON"
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <h3 className="text-md font-medium mb-2">Results</h3>
          
          {results.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              No results yet. Run a test to see output here.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <div 
                  key={result.id}
                  className={`p-3 rounded-md border ${getResultColor(result.success)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{result.label}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.success === null ? 'bg-gray-200 text-gray-800' :
                      result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.success === null ? 'PENDING' : result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{result.message}</p>
                  
                  {result.data && (
                    <div className="mt-2">
                      <details>
                        <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                          Show Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-800 text-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ERPConnectionDebugger;