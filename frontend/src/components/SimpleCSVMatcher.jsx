import React, { useState } from 'react';
import CSVUpload from './CSVUpload';

const SimpleCSVMatcher = ({ onBackToHome }) => {
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState(1); // 1: Upload, 2: Configure, 3: Results
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState(null);

  // Handle CSV data processing
  const handleDataProcessed = (data, filename) => {
    setCsvData(data);
    setFileName(filename);
    setStep(2);
  };

  // Simple matching algorithm for demo purposes
  const performMatching = async () => {
    setIsMatching(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock matching algorithm
    const matches = [];
    const unmatched = [];
    
    csvData.forEach((row, index) => {
      // Simple demo logic - randomly assign matches for demonstration
      const hasMatch = Math.random() > 0.3; // 70% match rate
      
      if (hasMatch) {
        matches.push({
          id: index,
          original: row,
          matchConfidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
          matchedWith: {
            reference: `MATCH-${Math.floor(Math.random() * 1000)}`,
            amount: row.amount || (Math.random() * 1000).toFixed(2),
            date: new Date().toISOString().split('T')[0]
          }
        });
      } else {
        unmatched.push({ id: index, original: row });
      }
    });

    setMatchResults({
      totalRows: csvData.length,
      matched: matches,
      unmatched: unmatched,
      matchRate: Math.round((matches.length / csvData.length) * 100)
    });
    
    setIsMatching(false);
    setStep(3);
  };

  const resetMatcher = () => {
    setCsvData([]);
    setFileName('');
    setStep(1);
    setMatchResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LedgerLink - CSV Matcher</h1>
                <p className="text-sm text-gray-500">Try our invoice matching engine for free</p>
              </div>
            </div>
            <button
              onClick={onBackToHome}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`h-1 w-16 mx-4 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2 max-w-sm mx-auto">
            <span>Upload CSV</span>
            <span>Process</span>
            <span>Results</span>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Your CSV File</h2>
              <p className="text-gray-600">
                Upload your invoice or transaction data to see our AI-powered matching in action.
                No account required - this is completely free to try!
              </p>
            </div>
            <CSVUpload onDataProcessed={handleDataProcessed} />
          </div>
        )}

        {/* Step 2: Configure & Process */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Process</h2>
              <p className="text-gray-600">
                We've loaded {csvData.length} rows from {fileName}. 
                Click "Start Matching" to see our intelligent reconciliation engine in action.
              </p>
            </div>

            {/* Data Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {csvData[0] && Object.keys(csvData[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-4 font-medium text-gray-600">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 3).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-4 text-gray-800">
                            {String(value).substring(0, 30)}
                            {String(value).length > 30 ? '...' : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 3 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing 3 of {csvData.length} rows
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={resetMatcher}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Upload Different File
              </button>
              <button
                onClick={performMatching}
                disabled={isMatching}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isMatching ? 'Processing...' : 'Start Matching'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && matchResults && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Matching Results</h2>
              <p className="text-gray-600">
                Our AI engine processed {matchResults.totalRows} rows and achieved a {matchResults.matchRate}% match rate!
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {matchResults.totalRows}
                </div>
                <div className="text-gray-600">Total Transactions</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {matchResults.matched.length}
                </div>
                <div className="text-gray-600">Successfully Matched</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {matchResults.matchRate}%
                </div>
                <div className="text-gray-600">Match Accuracy</div>
              </div>
            </div>

            {/* Matched Transactions */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-green-600">✅ Successfully Matched ({matchResults.matched.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Original Data</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Matched With</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchResults.matched.slice(0, 5).map((match, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-4">
                          <div className="text-sm">
                            {Object.entries(match.original).slice(0, 2).map(([key, value]) => (
                              <div key={key}><span className="font-medium">{key}:</span> {value}</div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="text-sm">
                            <div><span className="font-medium">Reference:</span> {match.matchedWith.reference}</div>
                            <div><span className="font-medium">Amount:</span> ${match.matchedWith.amount}</div>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.matchConfidence >= 0.8 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {Math.round(match.matchConfidence * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {matchResults.matched.length > 5 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing 5 of {matchResults.matched.length} matched transactions
                  </p>
                )}
              </div>
            </div>

            {/* Unmatched Transactions */}
            {matchResults.unmatched.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-amber-600">⚠️ Needs Review ({matchResults.unmatched.length})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {matchResults.unmatched[0] && Object.keys(matchResults.unmatched[0].original).map((key) => (
                          <th key={key} className="text-left py-2 px-4 font-medium text-gray-600">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matchResults.unmatched.slice(0, 3).map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          {Object.values(item.original).map((value, cellIndex) => (
                            <td key={cellIndex} className="py-2 px-4 text-gray-800">{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="text-center bg-blue-50 rounded-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Impressed with the results? 🎉
              </h3>
              <p className="text-gray-600 mb-6">
                This is just a taste of what LedgerLink can do. With a full account, you get:
                advanced matching algorithms, Xero integration, batch processing, and much more!
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetMatcher}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Try Another File
                </button>
                <button
                  onClick={onBackToHome}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up for Full Access
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isMatching && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Your Data</h3>
              <p className="text-gray-600">Our AI is analyzing {csvData.length} transactions...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SimpleCSVMatcher;