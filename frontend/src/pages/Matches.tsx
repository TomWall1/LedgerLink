/**
 * Enhanced Matches Page
 * 
 * This is the main page for invoice matching functionality.
 * It integrates the CSV upload, results display, and statistics
 * components into a complete matching workflow.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import CSVUpload from '../components/matching/CSVUpload';
import MatchingResultsDisplay from '../components/matching/MatchingResults';
import MatchingStats from '../components/matching/MatchingStats';
import XeroDataSelector from '../components/xero/XeroDataSelector';
import { MatchingResults, TransactionRecord } from '../types/matching';
import matchingService from '../services/matchingService';
import { xeroService } from '../services/xeroService';

interface MatchesProps {
  isLoggedIn: boolean;
}

type ViewMode = 'upload' | 'results' | 'history';

export const Matches: React.FC<MatchesProps> = ({ isLoggedIn }) => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [currentResults, setCurrentResults] = useState<MatchingResults | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Xero integration state
  const [isXeroConnected, setIsXeroConnected] = useState(false);
  const [checkingXero, setCheckingXero] = useState(true);
  const [showXeroModal, setShowXeroModal] = useState(false);
  const [xeroData, setXeroData] = useState<{
    invoices: TransactionRecord[];
    customerName: string;
  } | null>(null);

  /**
   * Check if Xero is connected
   */
  useEffect(() => {
    const checkXeroConnection = async () => {
      console.log('🔍 Checking Xero connection...');
      if (!isLoggedIn) {
        console.log('❌ User not logged in, skipping Xero check');
        setCheckingXero(false);
        return;
      }

      try {
        const connections = await xeroService.getConnections();
        console.log('✅ Xero connections found:', connections.length);
        setIsXeroConnected(connections.length > 0);
      } catch (error) {
        console.error('❌ Error checking Xero connection:', error);
        setIsXeroConnected(false);
      } finally {
        setCheckingXero(false);
      }
    };

    checkXeroConnection();
  }, [isLoggedIn]);

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  /**
   * Handle successful matching completion
   */
  const handleMatchingComplete = (results: MatchingResults) => {
    setCurrentResults(results);
    setViewMode('results');
    showToast(
      `Matching completed! Found ${results.perfectMatches.length} perfect matches and ${results.mismatches.length} discrepancies.`,
      'success'
    );
  };

  /**
   * Handle matching errors
   */
  const handleMatchingError = (error: string) => {
    showToast(error, 'error');
  };

  /**
   * Start a new matching operation
   */
  const handleStartNew = () => {
    setCurrentResults(null);
    setSelectedHistoryId(null);
    setXeroData(null);
    setViewMode('upload');
  };

  /**
   * View historical matching results
   */
  const handleViewHistory = async (matchId: string) => {
    setIsLoadingHistory(true);
    try {
      const results = await matchingService.getMatchingResult(matchId);
      setCurrentResults(results);
      setSelectedHistoryId(matchId);
      setViewMode('results');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to load historical results',
        'error'
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  /**
   * Export current results
   */
  const handleExport = async () => {
    if (!currentResults?.matchId) {
      showToast('No results to export', 'warning');
      return;
    }

    try {
      await matchingService.exportToCSV(currentResults.matchId);
      showToast('Results exported successfully!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Export failed',
        'error'
      );
    }
  };

  /**
   * Handle Xero button click
   */
  const handleXeroClick = () => {
    console.log('🎯 Xero button clicked!');
    console.log('   isXeroConnected:', isXeroConnected);
    console.log('   checkingXero:', checkingXero);
    console.log('   showXeroModal:', showXeroModal);
    
    if (!isXeroConnected) {
      console.log('⚠️ Xero not connected, showing warning toast');
      showToast('Please connect to Xero first from the Connections page', 'warning');
      return;
    }
    
    console.log('✅ Opening Xero modal...');
    setShowXeroModal(true);
    console.log('   showXeroModal state should now be true');
  };

  /**
   * Handle Xero data selection
   */
  const handleXeroDataSelected = (data: { invoices: TransactionRecord[]; customerName: string; invoiceCount: number }) => {
    console.log('📊 Xero data selected:', data.customerName, data.invoiceCount, 'invoices');
    setXeroData({
      invoices: data.invoices,
      customerName: data.customerName
    });
    setShowXeroModal(false);
    showToast(
      `Loaded ${data.invoiceCount} invoice${data.invoiceCount !== 1 ? 's' : ''} from Xero for ${data.customerName}`,
      'success'
    );
  };

  /**
   * Clear Xero data
   */
  const handleClearXeroData = () => {
    setXeroData(null);
    showToast('Xero data cleared', 'info');
  };

  // Debug log for modal state changes
  useEffect(() => {
    console.log('🔄 showXeroModal changed to:', showXeroModal);
  }, [showXeroModal]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-neutral-900 mb-2">Invoice Matching</h1>
        <p className="text-body-lg text-neutral-600">
          {isLoggedIn
            ? 'Compare and reconcile your ledgers with connected systems or CSV uploads.'
            : 'Try our matching engine with CSV uploads. Create an account to connect your ERP systems.'}
        </p>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'upload' ? 'primary' : 'ghost'}
                onClick={() => setViewMode('upload')}
              >
                New Match
              </Button>
              <Button
                variant={viewMode === 'results' ? 'primary' : 'ghost'}
                onClick={() => setViewMode('results')}
                disabled={!currentResults}
              >
                {selectedHistoryId ? 'Historical Results' : 'Current Results'}
              </Button>
              <Button
                variant={viewMode === 'history' ? 'primary' : 'ghost'}
                onClick={() => setViewMode('history')}
              >
                Statistics & History
              </Button>
            </div>

            {/* Quick Actions */}
            {viewMode !== 'upload' && (
              <div className="flex space-x-2">
                {currentResults && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExport}
                  >
                    Export CSV
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartNew}
                >
                  New Match
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Upload Mode */}
        {viewMode === 'upload' && (
          <div className="space-y-6">
            {/* Show Xero data if loaded */}
            {xeroData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900">Xero Data Loaded</h2>
                      <p className="text-neutral-600">
                        {xeroData.invoices.length} invoice{xeroData.invoices.length !== 1 ? 's' : ''} from {xeroData.customerName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearXeroData}
                    >
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-primary-900">Data Source 1: Xero</p>
                        <p className="text-sm text-primary-700 mt-1">
                          Upload a CSV file for Data Source 2 to begin matching, or select another Xero customer.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <CSVUpload
              onMatchingComplete={handleMatchingComplete}
              onError={handleMatchingError}
              xeroData={xeroData?.invoices}
              xeroCustomerName={xeroData?.customerName}
            />

            {/* ERP Integration */}
            {isLoggedIn && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-neutral-900">ERP Integration</h2>
                  <p className="text-neutral-600">
                    Connect your accounting systems for automatic matching
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="ghost" 
                      className={`h-20 border-2 ${isXeroConnected ? 'border-primary-300 bg-primary-50' : 'border-dashed border-neutral-300'}`}
                      onClick={handleXeroClick}
                      disabled={checkingXero}
                    >
                      <div className="text-center">
                        <div className="text-lg font-medium flex items-center justify-center">
                          {isXeroConnected && (
                            <svg className="w-5 h-5 text-success-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          Xero
                        </div>
                        <div className="text-sm text-neutral-600">
                          {checkingXero ? 'Checking...' : isXeroConnected ? 'Click to Select Data' : 'Not Connected'}
                        </div>
                      </div>
                    </Button>
                    <Button variant="ghost" className="h-20 border-2 border-dashed border-neutral-300" disabled>
                      <div className="text-center">
                        <div className="text-lg font-medium">QuickBooks</div>
                        <div className="text-sm text-neutral-600">Coming Soon</div>
                      </div>
                    </Button>
                    <Button variant="ghost" className="h-20 border-2 border-dashed border-neutral-300" disabled>
                      <div className="text-center">
                        <div className="text-lg font-medium">SAP</div>
                        <div className="text-sm text-neutral-600">Coming Soon</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats Preview */}
            <MatchingStats onViewDetails={handleViewHistory} />
          </div>
        )}

        {/* Results Mode */}
        {viewMode === 'results' && currentResults && (
          <div className="space-y-6">
            {selectedHistoryId && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-neutral-600">
                        Viewing historical results from previous matching operation
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleStartNew}>
                      Back to New Match
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <MatchingResultsDisplay
              results={currentResults}
              onExport={handleExport}
              onStartNew={handleStartNew}
            />
          </div>
        )}

        {/* History Mode */}
        {viewMode === 'history' && (
          <MatchingStats onViewDetails={handleViewHistory} />
        )}

        {/* Loading State for History */}
        {isLoadingHistory && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading historical results...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help & Documentation */}
      {viewMode === 'upload' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-900">How It Works</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">1. Select Data Sources</h3>
                <p className="text-sm text-neutral-600">
                  Upload CSV files or connect to Xero to import invoice data
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">2. Smart Matching</h3>
                <p className="text-sm text-neutral-600">
                  Our algorithm finds matches based on transaction numbers, amounts, and dates
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">3. View Results</h3>
                <p className="text-sm text-neutral-600">
                  Get detailed reports showing matches, mismatches, and reconciliation insights
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mt-6">
              <h4 className="font-medium text-blue-900 mb-2">Supported Data Sources</h4>
              <p className="text-sm text-blue-800">
                CSV files with transaction_number, amount, and date columns, or connect directly to Xero for automatic data import.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Xero Data Selection Modal */}
      {console.log('🎨 Rendering Modal with isOpen:', showXeroModal)}
      <Modal
        isOpen={showXeroModal}
        onClose={() => {
          console.log('🚪 Modal onClose called');
          setShowXeroModal(false);
        }}
        title="Select Xero Customer"
        description="Choose a customer to load their invoice data for matching"
        size="lg"
      >
        {console.log('📋 Modal children rendering...')}
        <XeroDataSelector
          onDataSelected={handleXeroDataSelected}
          onError={(error) => {
            showToast(error, 'error');
          }}
        />
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Matches;
