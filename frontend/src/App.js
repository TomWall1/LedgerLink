import React from 'react';

// Ultra minimal App with absolutely no routing or context
function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">LedgerLink - Emergency Mode</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Static Content</h2>
        <p className="mb-4">
          This is an emergency static version of the application while we resolve routing issues.
        </p>
        <p>
          Please check back soon for the full version with all features.
        </p>
      </div>
    </div>
  );
}

export default App;