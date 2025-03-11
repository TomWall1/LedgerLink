import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Results = () => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('matched');

  useEffect(() => {
    // Mock API call to fetch matching results
    const fetchResults = async () => {
      try {
        // In production, you would fetch from a real API
        // const response = await fetch('/api/match');
        // const data = await response.json();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockData = {
          matches: [
            {
              arTransaction: {
                transaction_number: 'INV001',
                transaction_type: 'INVOICE',
                amount: 1000.00,
                issue_date: '2024-01-01',
                due_date: '2024-01-31',
                status: 'open',
                reference: 'PO12345'
              },
              apTransaction: {
                transaction_number: 'INV001',
                transaction_type: 'INVOICE',
                amount: 1000.00,
                issue_date: '2024-01-01',
                due_date: '2024-01-31',
                status: 'open',
                reference: 'PO12345'
              },
              status: 'MATCHED'
            },
            {
              arTransaction: {
                transaction_number: 'CN005',
                transaction_type: 'CREDIT_NOTE',
                amount: -500.00,
                issue_date: '2024-01-15',
                due_date: '2024-02-14',
                status: 'open',
                reference: 'RET123'
              },
              apTransaction: {
                transaction_number: 'CN005',
                transaction_type: 'CREDIT_NOTE',
                amount: -500.00,
                issue_date: '2024-01-15',
                due_date: '2024-02-14',
                status: 'open',
                reference: 'RET123'
              },
              status: 'MATCHED'
            }
          ],
          mismatches: [
            {
              arTransaction: {
                transaction_number: 'INV002',
                transaction_type: 'INVOICE',
                amount: 1500.00,
                issue_date: '2024-01-02',
                due_date: '2024-02-01',
                status: 'open',
                reference: 'PO12346'
              },
              apTransaction: {
                transaction_number: 'INV002',
                transaction_type: 'INVOICE',
                amount: 1450.00, // amount mismatch
                issue_date: '2024-01-02',
                due_date: '2024-02-01',
                status: 'open',
                reference: 'PO12346'
              },
              discrepancies: ['amount']
            },
            {
              arTransaction: {
                transaction_number: 'INV006',
                transaction_type: 'INVOICE',
                amount: 2200.00,
                issue_date: '2024-01-20',
                due_date: '2024-02-19',
                status: 'open',
                reference: 'PO12350'
              },
              apTransaction: {
                transaction_number: 'INV006',
                transaction_type: 'INVOICE',
                amount: 2200.00,
                issue_date: '2024-01-20',
                due_date: '2024-02-25', // due date mismatch
                status: 'open',
                reference: 'PO12350'
              },
              discrepancies: ['due_date']
            }
          ],
          arOnly: [
            {
              transaction_number: 'INV003',
              transaction_type: 'INVOICE',
              amount: 2000.00,
              issue_date: '2024-01-05',
              due_date: '2024-02-04',
              status: 'open',
              reference: 'PO12347'
            },
            {
              transaction_number: 'INV007',
              transaction_type: 'INVOICE',
              amount: 3500.00,
              issue_date: '2024-01-25',
              due_date: '2024-02-24',
              status: 'open',
              reference: 'PO12351'
            }
          ],
          apOnly: [
            {
              transaction_number: 'INV004',
              transaction_type: 'INVOICE',
              amount: 1200.00,
              issue_date: '2024-01-10',
              due_date: '2024-02-09',
              status: 'open',
              reference: 'PO12348'
            }
          ],
          summary: {
            totalTransactions: 7,
            matchedCount: 2,
            mismatchCount: 2,
            arOnlyCount: 2,
            apOnlyCount: 1,
            matchedAmount: 1500.00,
            mismatchAmount: 3700.00,
            discrepancyAmount: 50.00
          }
        };
        
        setResults(mockData);
      } catch (err) {
        setError('Failed to fetch matching results');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/upload" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Go Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto my-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          No matching results found.
        </div>
        <div className="mt-4">
          <Link to="/upload" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Go Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Matching Results</h1>
        <div className="flex space-x-2">
          <Link to="/upload" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
            Upload New Files
          </Link>
          <button 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            onClick={() => alert('Report would be exported')}
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Transactions</div>
            <div className="text-2xl font-bold">{results.summary.totalTransactions}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Matched</div>
            <div className="text-2xl font-bold">{results.summary.matchedCount}</div>
            <div className="text-sm text-gray-500">${results.summary.matchedAmount.toFixed(2)}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Mismatched</div>
            <div className="text-2xl font-bold">{results.summary.mismatchCount}</div>
            <div className="text-sm text-gray-500">${results.summary.mismatchAmount.toFixed(2)}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Missing</div>
            <div className="text-2xl font-bold">{results.summary.arOnlyCount + results.summary.apOnlyCount}</div>
            <div className="text-sm text-gray-500">AR: {results.summary.arOnlyCount} | AP: {results.summary.apOnlyCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('matched')}
            className={`py-2 px-1 ${activeTab === 'matched' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Matched ({results.matches.length})
          </button>
          <button
            onClick={() => setActiveTab('mismatched')}
            className={`py-2 px-1 ${activeTab === 'mismatched' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mismatched ({results.mismatches.length})
          </button>
          <button
            onClick={() => setActiveTab('ar-only')}
            className={`py-2 px-1 ${activeTab === 'ar-only' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            AR Only ({results.arOnly.length})
          </button>
          <button
            onClick={() => setActiveTab('ap-only')}
            className={`py-2 px-1 ${activeTab === 'ap-only' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            AP Only ({results.apOnly.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Matched Tab */}
        {activeTab === 'matched' && (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.matches.map((match, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.arTransaction.transaction_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.arTransaction.transaction_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${match.arTransaction.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.arTransaction.issue_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.arTransaction.due_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {match.arTransaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mismatched Tab */}
        {activeTab === 'mismatched' && (
          <div>
            {results.mismatches.map((mismatch, index) => (
              <div key={index} className="border-b border-gray-200 last:border-0">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">{mismatch.arTransaction.transaction_number}</h3>
                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold">
                      Discrepancy: {mismatch.discrepancies.join(', ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="text-sm font-semibold text-blue-700 mb-2">AR Transaction</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Type:</span> {mismatch.arTransaction.transaction_type}</div>
                        <div><span className="font-medium">Amount:</span> ${mismatch.arTransaction.amount.toFixed(2)}</div>
                        <div><span className="font-medium">Issue Date:</span> {mismatch.arTransaction.issue_date}</div>
                        <div><span className="font-medium">Due Date:</span> {mismatch.arTransaction.due_date}</div>
                        <div><span className="font-medium">Status:</span> {mismatch.arTransaction.status}</div>
                        <div><span className="font-medium">Reference:</span> {mismatch.arTransaction.reference}</div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className="text-sm font-semibold text-green-700 mb-2">AP Transaction</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Type:</span> {mismatch.apTransaction.transaction_type}</div>
                        <div className={mismatch.discrepancies.includes('amount') ? 'text-red-600 font-bold' : ''}>
                          <span className="font-medium">Amount:</span> ${mismatch.apTransaction.amount.toFixed(2)}
                        </div>
                        <div className={mismatch.discrepancies.includes('issue_date') ? 'text-red-600 font-bold' : ''}>
                          <span className="font-medium">Issue Date:</span> {mismatch.apTransaction.issue_date}
                        </div>
                        <div className={mismatch.discrepancies.includes('due_date') ? 'text-red-600 font-bold' : ''}>
                          <span className="font-medium">Due Date:</span> {mismatch.apTransaction.due_date}
                        </div>
                        <div><span className="font-medium">Status:</span> {mismatch.apTransaction.status}</div>
                        <div><span className="font-medium">Reference:</span> {mismatch.apTransaction.reference}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">Mark as Resolved</button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm">Add Note</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AR Only Tab */}
        {activeTab === 'ar-only' && (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.arOnly.map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.transaction_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.transaction_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.issue_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.due_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AP Only Tab */}
        {activeTab === 'ap-only' && (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.apOnly.map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.transaction_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.transaction_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.issue_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.due_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-right">
        <Link to="/account-links" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Manage Account Links
        </Link>
      </div>
    </div>
  );
};

export default Results;