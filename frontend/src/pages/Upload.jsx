import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useXero } from '../context/XeroContext';
import XeroConnection from '../components/XeroConnection';

const Upload = () => {
  const [arFile, setArFile] = useState(null);
  const [apFile, setApFile] = useState(null);
  const [dateFormat1, setDateFormat1] = useState('YYYY-MM-DD');
  const [dateFormat2, setDateFormat2] = useState('YYYY-MM-DD');
  const [useHistoricalData, setUseHistoricalData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [xeroData, setXeroData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useXero();
  
  // Check if we're coming from Xero connection
  useEffect(() => {
    if (location.state?.xeroEnabled && isAuthenticated) {
      // TODO: Fetch Xero data when enabled
      console.log('Xero integration enabled');
      // For now, just log it
    }
  }, [location.state, isAuthenticated]);

  const handleARFileChange = (e) => {
    setArFile(e.target.files[0]);
  };

  const handleAPFileChange = (e) => {
    setApFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!arFile && !apFile && !xeroData) {
      setError('Please select at least one file to upload or connect to Xero');
      return;
    }
    
    if (!apFile) {
      setError('Please select an AP file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      if (arFile) formData.append('arFile', arFile);
      if (apFile) formData.append('apFile', apFile);
      
      // Add Xero data if available
      if (xeroData) {
        formData.append('arData', JSON.stringify(xeroData));
      }
      
      // Add date formats and historical data flag
      formData.append('dateFormat1', dateFormat1);
      formData.append('dateFormat2', dateFormat2);
      formData.append('useHistoricalData', useHistoricalData);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
      
      const response = await axios.post(`${apiUrl}/api/match`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Navigate to results page with the data
      navigate('/results', { state: { results: response.data } });
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Error uploading files: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Ledger Files</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* AR File Upload */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Accounts Receivable (AR)</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <label className="block mb-4">
                  <span className="text-gray-700 block mb-2">Upload AR CSV file</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                    onChange={handleARFileChange}
                    disabled={xeroData !== null}
                  />
                </label>
                
                {arFile && (
                  <div className="text-sm bg-blue-50 p-2 rounded">
                    <p className="font-medium">{arFile.name}</p>
                    <p className="text-gray-500">{(arFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                
                {xeroData && (
                  <div className="text-sm bg-green-50 p-2 rounded">
                    <p className="font-medium">Using Xero Data</p>
                    <p className="text-gray-500">{xeroData.length} records from Xero</p>
                  </div>
                )}
                
                <div className="mt-2">
                  <label className="text-sm text-gray-700 block mb-1">Date format</label>
                  <select
                    className="block w-full text-sm border border-gray-300 rounded p-1.5"
                    value={dateFormat1}
                    onChange={(e) => setDateFormat1(e.target.value)}
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  CSV format: Transaction number, Type, Amount, Issue date, Due date, Status, Reference
                </p>
              </div>
            </div>
            
            {/* AP File Upload */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Accounts Payable (AP)</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <label className="block mb-4">
                  <span className="text-gray-700 block mb-2">Upload AP CSV file</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-green-50 file:text-green-700
                      hover:file:bg-green-100"
                    onChange={handleAPFileChange}
                  />
                </label>
                
                {apFile && (
                  <div className="text-sm bg-green-50 p-2 rounded">
                    <p className="font-medium">{apFile.name}</p>
                    <p className="text-gray-500">{(apFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                
                <div className="mt-2">
                  <label className="text-sm text-gray-700 block mb-1">Date format</label>
                  <select
                    className="block w-full text-sm border border-gray-300 rounded p-1.5"
                    value={dateFormat2}
                    onChange={(e) => setDateFormat2(e.target.value)}
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  CSV format: Transaction number, Type, Amount, Issue date, Due date, Status, Reference
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useHistoricalData"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={useHistoricalData}
                onChange={(e) => setUseHistoricalData(e.target.checked)}
              />
              <label htmlFor="useHistoricalData" className="ml-2 block text-sm text-gray-700">
                Use historical data (if available) for enhanced matching
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              This will use historical invoice data to help identify previously resolved matches.
            </p>
          </div>
          
          {isLoading && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      Uploading
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div style={{ width: `${uploadProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-6">
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Match & Process Files'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Xero Integration */}
      <XeroConnection />
    </div>
  );
};

export default Upload;