import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { XeroProvider } from './context/XeroContext';
import Dashboard from './pages/Dashboard';

// Diagnostic App for debugging
function App() {
  const [errorInfo, setErrorInfo] = useState(null);
  const [shouldAttemptRouter, setShouldAttemptRouter] = useState(false);
  
  // Effect to safely try loading React Router
  useEffect(() => {
    if (shouldAttemptRouter) {
      try {
        // Dynamically import React Router components
        const attemptRouterImport = async () => {
          try {
            const routerModule = await import('react-router-dom');
            // Log the loaded module to see what's available
            console.log('Successfully loaded react-router-dom:', Object.keys(routerModule));
            
            setErrorInfo({
              status: 'success',
              message: 'React Router loaded successfully',
              routerVersion: routerModule.version || 'unknown'
            });
          } catch (err) {
            console.error('Error importing react-router-dom:', err);
            setErrorInfo({
              status: 'error',
              message: 'Failed to import React Router',
              error: err.toString(),
              stack: err.stack
            });
          }
        };
        
        attemptRouterImport();
      } catch (err) {
        console.error('Error in router test:', err);
        setErrorInfo({
          status: 'error',
          message: 'Exception in router test',
          error: err.toString(),
          stack: err.stack
        });
      }
    }
  }, [shouldAttemptRouter]);
  
  return (
    <AuthProvider>
      <XeroProvider>
        <div className="min-h-screen bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-4">LedgerLink - Diagnostic Mode</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Router Diagnostics</h2>
            
            {!shouldAttemptRouter ? (
              <button 
                onClick={() => setShouldAttemptRouter(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test React Router
              </button>
            ) : errorInfo ? (
              <div className="mt-4">
                <h3 className="font-medium text-lg mb-2">
                  Status: <span className={errorInfo.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {errorInfo.status}
                  </span>
                </h3>
                <p className="mb-2">{errorInfo.message}</p>
                
                {errorInfo.status === 'error' && (
                  <div className="bg-gray-100 p-4 rounded overflow-auto">
                    <p className="font-bold">Error: {errorInfo.error}</p>
                    <pre className="mt-2 text-sm">{errorInfo.stack}</pre>
                  </div>
                )}
                
                {errorInfo.status === 'success' && (
                  <p className="text-green-600">React Router version: {errorInfo.routerVersion}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                <p>Testing React Router...</p>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Dashboard Component</h2>
            <Dashboard />
          </div>
        </div>
      </XeroProvider>
    </AuthProvider>
  );
}

export default App;