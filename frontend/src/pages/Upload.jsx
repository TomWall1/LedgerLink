import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const [arFile, setArFile] = useState(null);
  const [apFile, setApFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleARFileChange = (e) => {
    setArFile(e.target.files[0]);
  };

  const handleAPFileChange = (e) => {
    setApFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!arFile && !apFile) {
      setError('Please select at least one file to upload');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For demo purposes, we'll simulate a successful upload
      // In production, you would send the files to the backend
      
      // Mock delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to results page
      navigate('/results');
    } catch (err) {
      setError('Error uploading files: ' + err.message);
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
                  />
                </label>
                
                {arFile && (
                  <div className="text-sm bg-blue-50 p-2 rounded">
                    <p className="font-medium">{arFile.name}</p>
                    <p className="text-gray-500">{(arFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                
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
                
                <p className="text-sm text-gray-500 mt-2">
                  CSV format: Transaction number, Type, Amount, Issue date, Due date, Status, Reference
                </p>
              </div>
            </div>
          </div>
          
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
      
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Connect with Xero</h2>
        <p className="text-gray-600 mb-4">
          You can also import your ledger data directly from Xero. This allows for seamless integration without manual CSV exports.
        </p>
        <button 
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          onClick={() => alert('Xero integration would open an authorization window here')}
        >
          Connect to Xero
        </button>
      </div>
    </div>
  );
};

export default Upload;