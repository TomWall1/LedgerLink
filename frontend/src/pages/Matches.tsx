/**
 * Redesigned Matches Page - Simplified Two-Box Layout
 * 
 * Streamlined interface for invoice matching with side-by-side AR/AP boxes.
 * Inspired by Ledger-Match design for simplicity and ease of use.
 * 
 * Key Features:
 * - Two-box layout for AR and AP data
 * - Smart counterparty auto-detection
 * - Integrated CSV upload with date format selection
 * - Always-visible CSV templates and requirements
 * - Clean, professional design with LedgerLink branding
 * 
 * FIX: Now passes Xero connection ID to DataSourceBox components
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';
import MatchingResultsDisplay from '../components/matching/MatchingResults';
import MatchingStats from '../components/matching/MatchingStats';
import DataSourceBox from '../components/matching/redesign/DataSourceBox';
import MatchingReadyButton from '../components/matching/redesign/MatchingReadyButton';
import CSVTemplateSection from '../components/matching/redesign/CSVTemplateSection';
import { MatchingResults } from '../types/matching';
import matchingService from '../services/matchingService';
import { xeroService } from '../services/xeroService';
import counterpartyService from '../services/counterpartyService';

interface MatchesProps {
  isLoggedIn: boolean;
}

type ViewMode = 'upload' | 'results' | 'history';

interface LoadedDataSource {
  type: 'xero' | 'csv';
  invoices: any[];
  customerName?: string;
  fileName?: string;
  invoiceCount: number;
}

interface CounterpartyConnection {
  companyName: string;
  erpType: string;
}

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const Matches: React.FC<MatchesProps> = ({ isLoggedIn }) => {
  const navigate = useNavigate();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [currentResults, setCurrentResults] = useState<MatchingResults | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);
  
  // Xero connection state
  const [isXeroConnected, setIsXeroConnected] = useState(false);
  const [xeroConnectionId, setXeroConnectionId] = useState<string | undefined>(undefined); // FIX: Add connection ID
  const [checkingXero, setCheckingXero] = useState(true);

  // AR/AP data states
  const [arData, setArData] = useState<LoadedDataSource | null>(null);
  const [apData, setApData] = useState<LoadedDataSource | null>(null);
  
  // Counterparty connection states
  const [arCounterparty, setArCounterparty] = useState<CounterpartyConnection | null>(null);
  const [apCounterparty, setApCounterparty] = useState<CounterpartyConnection | null>(null);

  // Matching state
  const [isMatching, setIsMatching] = useState(false);

  /**
   * Check if Xero is connected on mount
   * FIX: Now also stores the connection ID (tenant ID)
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
        
        const hasConnection = connections.length > 0;
        setIsXeroConnected(hasConnection);
        
        // FIX: Store the first connection's tenant ID for use in DataSourceBox
        if (hasConnection) {
          const connectionId = connections[0].tenantId;
          console.log('📝 Using Xero connection ID:', connectionId);
          setXeroConnectionId(connectionId);
        } else {
          setXeroConnectionId(undefined);
        }
      } catch (error) {
        console.error('❌ Error checking Xero connection:', error);
        setIsXeroConnected(false);
        setXeroConnectionId(undefined);
      } finally {
        setCheckingXero(false);
      }
    };

    checkXeroConnection();
  }, [isLoggedIn]);

  /**
   * Check for counterparty connection when AR data is loaded from Xero
   */
  useEffect(() => {
    const checkArCounterparty = async () => {
      if (!arData || arData.type !== 'xero' || !arData.customerName) {
        setApCounterparty(null);
        return;
      }

      console.log(`🔍 Checking if ${arData.customerName} has linked account...`);

      try {
        const result = await counterpartyService.checkLink(arData.customerName, 'AR');

        if (result.success && result.linked && result.counterparty) {
          console.log('✅ Found linked counterparty:', result.counterparty.companyName);
          
          setApCounterparty({
            companyName: result.counterparty.companyName,
            erpType: result.counterparty.erpType
          });

          showToast(
            `${result.counterparty.companyName} has a linked account!`,
            'success'
          );
        } else {
          console.log('ℹ️ No linked counterparty found');
          setApCounterparty(null);
        }
      } catch (error) {
        console.error('❌ Error checking counterparty link:', error);
        setApCounterparty(null);
      }
    };

    checkArCounterparty();
  }, [arData]);

  /**
   * Check for counterparty connection when AP data is loaded from Xero
   */
  useEffect(() => {
    const checkApCounterparty = async () => {
      if (!apData || apData.type !== 'xero' || !apData.customerName) {
        setArCounterparty(null);
        return;
      }

      console.log(`🔍 Checking if ${apData.customerName} has linked account...`);

      try {
        const result = await counterpartyService.checkLink(apData.customerName, 'AP');

        if (result.success && result.linked && result.counterparty) {
          console.log('✅ Found linked counterparty:', result.counterparty.companyName);
          
          setArCounterparty({
            companyName: result.counterparty.companyName,
            erpType: result.counterparty.erpType
          });

          showToast(
            `${result.counterparty.companyName} has a linked account!`,
            'success'
          );
        } else {
          console.log('ℹ️ No linked counterparty found');
          setArCounterparty(null);
        }
      } catch (error) {
        console.error('❌ Error checking counterparty link:', error);
        setArCounterparty(null);
      }
    };

    checkApCounterparty();
  }, [apData]);

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 5000);
  };

  /**
   * Handle AR data loaded
   */
  const handleArDataLoad = (data: LoadedDataSource) => {
    console.log('📥 AR data loaded:', data);
    setArData(data);
  };

  /**
   * Handle AP data loaded
   */
  const handleApDataLoad = (data: LoadedDataSource) => {
    console.log('📥 AP data loaded:', data);
    setApData(data);
  };

  /**
   * Handle "Use CSV Instead" for AR side
   */
  const handleArUseCsvInstead = () => {
    console.log('🔄 AR switching to CSV');
    setArCounterparty(null);
  };

  /**
   * Handle "Use CSV Instead" for AP side
   */
  const handleApUseCsvInstead = () => {
    console.log('🔄 AP switching to CSV');
    setApCounterparty(null);
  };

  /**
   * Handle "Connect to Counterparty" button
   */
  const handleConnectCounterparty = () => {
    navigate('/counterparties');
  };

  /**
   * Start matching
   */
  const handleStartMatching = async () => {
    if (!arData || !apData) {
      showToast('Both AR and AP data are required', 'error');
      return;
    }

    setIsMatching(true);
    console.log('🚀 Starting matching...', {
      arCount: arData.invoiceCount,
      apCount: apData.invoiceCount
    });

    try {
      const results = await matchingService.matchFromERP(
        arData.invoices,
        apData.invoices,
        {
          sourceType1: arData.type,
          sourceType2: apData.type,
        }
      );

      setCurrentResults(results);
      setViewMode('results');
      showToast(
        `Matching completed! Found ${results.perfectMatches.length} perfect matches.`,
        'success'
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Matching failed',
        'error'
      );
    } finally {
      setIsMatching(false);
    }
  };

  /**
   * Start a new matching operation
   */
  const handleStartNew = () => {
    setCurrentResults(null);
    setSelectedHistoryId(null);
    setArData(null);
    setApData(null);
    setArCounterparty(null);
    setApCounterparty(null);
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-neutral-900 mb-2">Invoice Matching</h1>
        <p className="text-body-lg text-neutral-600">
          Compare and reconcile your ledgers with connected systems or CSV uploads.
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
        {/* Upload Mode - NEW REDESIGNED LAYOUT */}
        {viewMode === 'upload' && (
          <div className="space-y-6">
            {/* Two-Box Matching Interface */}
            <Card>
              <CardContent className="p-6">
                {/* AR and AP Boxes Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* AR Box - FIX: Now passes xeroConnectionId */}
                  <DataSourceBox
                    side="AR"
                    title="Accounts Receivable Data"
                    isXeroConnected={isXeroConnected}
                    xeroConnectionId={xeroConnectionId}
                    onDataLoaded={handleArDataLoad}
                    onError={(error) => showToast(error, 'error')}
                    counterpartyConnection={arCounterparty}
                    isCounterpartyLocked={!!arCounterparty}
                    onUseCsvInstead={handleArUseCsvInstead}
                    onConnectCounterparty={handleConnectCounterparty}
                  />

                  {/* AP Box - FIX: Now passes xeroConnectionId */}
                  <DataSourceBox
                    side="AP"
                    title="Accounts Payable Data"
                    isXeroConnected={isXeroConnected}
                    xeroConnectionId={xeroConnectionId}
                    onDataLoaded={handleApDataLoad}
                    onError={(error) => showToast(error, 'error')}
                    counterpartyConnection={apCounterparty}
                    isCounterpartyLocked={!!apCounterparty}
                    onUseCsvInstead={handleApUseCsvInstead}
                    onConnectCounterparty={handleConnectCounterparty}
                  />
                </div>

                {/* Start Matching Button (appears when both loaded) */}
                <MatchingReadyButton
                  arData={arData}
                  apData={apData}
                  onStartMatching={handleStartMatching}
                  isLoading={isMatching}
                />
              </CardContent>
            </Card>

            {/* CSV Templates - Always Visible */}
            <CSVTemplateSection
              onDownload={() => showToast('Template downloaded successfully!', 'success')}
            />

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

      {/* Toast Notifications */}
      {toast && (
        <Toast
          toast={{
            id: toast.id,
            title: toast.message,
            variant: toast.type === 'info' ? 'default' : toast.type,
            duration: 5000
          }}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Matches;
