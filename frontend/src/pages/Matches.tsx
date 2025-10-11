/**
 * Enhanced Matches Page with Step-by-Step Workflow
 * 
 * This is the main page for invoice matching functionality.
 * Now features a clear, progressive workflow for selecting data sources
 * and performing matches.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';
import CSVUpload from '../components/matching/CSVUpload';
import MatchingResultsDisplay from '../components/matching/MatchingResults';
import MatchingStats from '../components/matching/MatchingStats';
import LedgerTypeSelector from '../components/matching/workflow/LedgerTypeSelector';
import DataSourceDropdown, { DataSourceType } from '../components/matching/workflow/DataSourceDropdown';
import CustomerSelectorDropdown from '../components/matching/workflow/CustomerSelectorDropdown';
import DataSourceSummary from '../components/matching/workflow/DataSourceSummary';
import MatchReadyCard from '../components/matching/workflow/MatchReadyCard';
import { MatchingResults, TransactionRecord } from '../types/matching';
import matchingService from '../services/matchingService';
import { xeroService } from '../services/xeroService';
import { downloadCSVTemplate, getTemplateInfo } from '../utils/csvTemplate';

interface MatchesProps {
  isLoggedIn: boolean;
}

type ViewMode = 'upload' | 'results' | 'history';

interface LoadedDataSource {
  type: 'xero' | 'csv';
  invoices: TransactionRecord[];
  customerName?: string;
  fileName?: string;
  invoiceCount: number;
}

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
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  
  // Xero integration state
  const [isXeroConnected, setIsXeroConnected] = useState(false);
  const [checkingXero, setCheckingXero] = useState(true);

  // Workflow state
  const [ledgerType, setLedgerType] = useState<'AR' | 'AP' | null>(null);
  const [dataSource1Type, setDataSource1Type] = useState<DataSourceType>(null);
  const [dataSource1, setDataSource1] = useState<LoadedDataSource | null>(null);
  const [dataSource2Type, setDataSource2Type] = useState<DataSourceType>(null);
  const [dataSource2, setDataSource2] = useState<LoadedDataSource | null>(null);

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
    setLedgerType(null);
    setDataSource1Type(null);
    setDataSource1(null);
    setDataSource2Type(null);
    setDataSource2(null);
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
   * Handle CSV template download
   */
  const handleDownloadTemplate = () => {
    try {
      downloadCSVTemplate();
      showToast('CSV template downloaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to download template', 'error');
    }
  };

  /**
   * Handle Xero customer selection and data loading
   * CRITICAL FIX: Strengthened null/undefined checks to prevent property access errors
   */
  const handleXeroDataLoad = (data: { invoices: any[]; customerName: string; invoiceCount: number }) => {
    try {
      console.log('📊 Received Xero data:', data.customerName, data.invoiceCount, 'invoices');
      
      // DEFENSIVE VALIDATION: Ensure invoices is an array
      if (!Array.isArray(data.invoices)) {
        console.error('❌ Invoices is not an array:', data.invoices);
        showToast('Invalid invoice data received', 'error');
        return;
      }

      // CRITICAL FIX: Strengthen validation with explicit null/undefined checks BEFORE any property access
      const validInvoices = data.invoices.filter((invoice, index) => {
        // FIRST: Check for null or undefined IMMEDIATELY - this prevents ANY property access on bad values
        if (invoice === null || invoice === undefined) {
          console.warn(`⚠️ Filtering out null/undefined invoice at index ${index}`);
          return false;
        }
        
        // SECOND: Verify it's actually an object (not a primitive)
        if (typeof invoice !== 'object') {
          console.warn(`⚠️ Filtering out non-object invoice at index ${index}:`, typeof invoice);
          return false;
        }
        
        // NOW it's safe to access properties - wrap in try-catch for extra safety
        try {
          // Check for required id field
          if (typeof invoice.id === 'undefined' || invoice.id === null) {
            console.warn(`⚠️ Filtering out invoice without id at index ${index}:`, invoice);
            return false;
          }
          
          // Check for transactionNumber field (camelCase - matches TransactionRecord interface)
          if (typeof invoice.transactionNumber === 'undefined') {
            console.warn(`⚠️ Filtering out invoice without transactionNumber at index ${index}:`, invoice);
            return false;
          }
          
          // Check for amount field
          if (typeof invoice.amount === 'undefined') {
            console.warn(`⚠️ Filtering out invoice without amount at index ${index}:`, invoice);
            return false;
          }
          
          // Check for date field (camelCase - matches TransactionRecord interface)
          if (typeof invoice.date === 'undefined') {
            console.warn(`⚠️ Filtering out invoice without date at index ${index}:`, invoice);
            return false;
          }
          
          return true;
        } catch (error) {
          console.error(`❌ Error validating invoice at index ${index}:`, error);
          return false;
        }
      });

      if (validInvoices.length !== data.invoices.length) {
        console.warn(`⚠️ Filtered ${data.invoices.length - validInvoices.length} invalid invoices from Xero data`);
      }

      if (validInvoices.length === 0) {
        console.error('❌ No valid invoices after filtering');
        showToast('No valid invoices found in the data', 'error');
        return;
      }

      console.log(`✅ Validated ${validInvoices.length} invoices with camelCase properties`);
      
      const loadedData: LoadedDataSource = {
        type: 'xero',
        invoices: validInvoices,
        customerName: data.customerName,
        invoiceCount: validInvoices.length
      };

      if (!dataSource1) {
        console.log('📥 Setting as Data Source 1');
        setDataSource1(loadedData);
        showToast(
          `Loaded ${validInvoices.length} invoice${validInvoices.length !== 1 ? 's' : ''} from Xero for ${data.customerName}`,
          'success'
        );
      } else {
        console.log('📥 Setting as Data Source 2');
        setDataSource2(loadedData);
        showToast(
          `Loaded ${validInvoices.length} invoice${validInvoices.length !== 1 ? 's' : ''} from Xero for ${data.customerName}`,
          'success'
        );
      }
    } catch (error: any) {
      console.error('❌ Error processing Xero data:', error);
      showToast('Failed to process invoice data', 'error');
    }
  };

  /**
   * Handle CSV file upload for Data Source 1
   */
  const handleCSV1Upload = (file: File, invoices: TransactionRecord[]) => {
    const loadedData: LoadedDataSource = {
      type: 'csv',
      invoices: invoices,
      fileName: file.name,
      invoiceCount: invoices.length
    };

    setDataSource1(loadedData);
    showToast(`Loaded ${invoices.length} invoices from ${file.name}`, 'success');
  };

  /**
   * Clear data source
   */
  const handleClearDataSource = (sourceNumber: 1 | 2) => {
    if (sourceNumber === 1) {
      setDataSource1(null);
      setDataSource1Type(null);
      // Also clear source 2 since workflow requires source 1 first
      setDataSource2(null);
      setDataSource2Type(null);
    } else {
      setDataSource2(null);
      setDataSource2Type(null);
    }
  };

  /**
   * Handle going back to a previous step
   */
  const handleBackToStep = (step: 1 | 2) => {
    if (step === 1) {
      // Back to ledger type selection
      setLedgerType(null);
      setDataSource1Type(null);
      setDataSource1(null);
      setDataSource2Type(null);
      setDataSource2(null);
    } else if (step === 2) {
      // Back to data source 1 selection
      setDataSource1Type(null);
      setDataSource1(null);
      setDataSource2Type(null);
      setDataSource2(null);
    }
  };

  /**
   * Start matching when both sources are ready
   */
  const handleStartMatching = async () => {
    if (!dataSource1 || !dataSource2) {
      showToast('Both data sources are required', 'error');
      return;
    }

    try {
      const results = await matchingService.matchFromERP(
        dataSource1.invoices,
        dataSource2.invoices,
        {
          sourceType1: dataSource1.type,
          sourceType2: dataSource2.type,
        }
      );

      handleMatchingComplete(results);
    } catch (error) {
      handleMatchingError(
        error instanceof Error ? error.message : 'Matching failed'
      );
    }
  };

  // Get template info for display
  const templateInfo = getTemplateInfo();

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
            {/* CSV Template Download Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">CSV Template</h2>
                    <p className="text-neutral-600">
                      Download our template to ensure your data is formatted correctly
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleDownloadTemplate}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 mb-2">Required Columns:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {templateInfo.columns.filter(col => col.required).map(col => (
                          <div key={col.name} className="flex items-start space-x-2">
                            <svg className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <span className="font-medium text-neutral-900">{col.name}</span>
                              <span className="text-neutral-600"> - {col.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowTemplateInfo(!showTemplateInfo)}
                        className="text-sm text-primary-600 hover:text-primary-700 mt-3 font-medium"
                      >
                        {showTemplateInfo ? 'Hide' : 'Show'} optional columns
                      </button>
                      {showTemplateInfo && (
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <p className="text-sm font-medium text-neutral-900 mb-2">Optional Columns:</p>
                          <div className="space-y-2 text-sm">
                            {templateInfo.columns.filter(col => !col.required).map(col => (
                              <div key={col.name} className="flex items-start space-x-2">
                                <svg className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  <span className="font-medium text-neutral-900">{col.name}</span>
                                  <span className="text-neutral-600"> - {col.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NEW: Matching Workflow Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">Matching Workflow</h2>
                    <p className="text-neutral-600">
                      Follow the steps below to set up your invoice matching
                    </p>
                  </div>
                  {ledgerType && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBackToStep(1)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Start Over
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Step 1: Select Ledger Type */}
                <LedgerTypeSelector
                  selectedType={ledgerType}
                  onSelect={setLedgerType}
                />

                {/* Step 2: Select Data Source 1 (only show if ledger type selected) */}
                {ledgerType && (
                  <div className="space-y-4 pt-6 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-h3 text-neutral-900 mb-2">
                          Step 2: Select Your Ledger (Data Source 1)
                        </h3>
                        <p className="text-small text-neutral-600">
                          Choose where to load your {ledgerType === 'AR' ? 'receivables' : 'payables'} data from
                        </p>
                      </div>
                      {dataSource1Type && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBackToStep(2)}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back
                        </Button>
                      )}
                    </div>

                    {!dataSource1 ? (
                      <>
                        <DataSourceDropdown
                          value={dataSource1Type}
                          onChange={setDataSource1Type}
                          isXeroConnected={isXeroConnected}
                          label="Choose data source"
                          description="Select where you want to load your invoice data from"
                        />

                        {/* Show Xero customer selector if Xero is selected */}
                        {dataSource1Type === 'xero' && isXeroConnected && (
                          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                            <CustomerSelectorDropdown
                              onLoadData={handleXeroDataLoad}
                              onError={(error) => showToast(error, 'error')}
                            />
                          </div>
                        )}

                        {/* Show CSV upload if CSV is selected */}
                        {dataSource1Type === 'csv' && (
                          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                            <p className="text-small text-neutral-700 mb-3">
                              Upload your CSV file to continue
                            </p>
                            <div className="text-small text-neutral-600">
                              CSV upload will be enabled once this step is complete. Please use the full CSV upload section below for now.
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <DataSourceSummary
                        source={dataSource1.type}
                        customerName={dataSource1.customerName}
                        fileName={dataSource1.fileName}
                        invoiceCount={dataSource1.invoiceCount}
                        onClear={() => handleClearDataSource(1)}
                        label="Data Source 1"
                      />
                    )}
                  </div>
                )}

                {/* Step 3: Select Data Source 2 (only show if Data Source 1 is loaded) */}
                {dataSource1 && (
                  <div className="space-y-4 pt-6 border-t border-neutral-200">
                    <h3 className="text-h3 text-neutral-900 mb-2">
                      Step 3: Select Counterparty Ledger (Data Source 2)
                    </h3>
                    <p className="text-small text-neutral-600 mb-4">
                      Choose where to load the counterparty's data from
                    </p>

                    {!dataSource2 ? (
                      <>
                        <DataSourceDropdown
                          value={dataSource2Type}
                          onChange={setDataSource2Type}
                          isXeroConnected={isXeroConnected}
                          label="Choose counterparty data source"
                        />

                        {/* Show Xero customer selector if Xero is selected */}
                        {dataSource2Type === 'xero' && isXeroConnected && (
                          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                            <CustomerSelectorDropdown
                              onLoadData={handleXeroDataLoad}
                              onError={(error) => showToast(error, 'error')}
                            />
                          </div>
                        )}

                        {/* Show CSV upload instruction if CSV is selected */}
                        {dataSource2Type === 'csv' && (
                          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                            <p className="text-small text-neutral-700 mb-3">
                              Use the CSV upload section below to upload the counterparty's file
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <DataSourceSummary
                        source={dataSource2.type}
                        customerName={dataSource2.customerName}
                        fileName={dataSource2.fileName}
                        invoiceCount={dataSource2.invoiceCount}
                        onClear={() => handleClearDataSource(2)}
                        label="Data Source 2"
                      />
                    )}
                  </div>
                )}

                {/* Ready to Match Summary (only show when both sources loaded) */}
                {dataSource1 && dataSource2 && (
                  <div className="pt-6">
                    <MatchReadyCard
                      source1={{
                        type: dataSource1.type,
                        name: dataSource1.customerName || dataSource1.fileName || 'Source 1',
                        invoiceCount: dataSource1.invoiceCount
                      }}
                      source2={{
                        type: dataSource2.type,
                        name: dataSource2.customerName || dataSource2.fileName || 'Source 2',
                        invoiceCount: dataSource2.invoiceCount
                      }}
                      onStartMatching={handleStartMatching}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CSV Upload Component (for when CSV is selected in workflow) */}
            {(dataSource2Type === 'csv' || (!ledgerType && !dataSource1)) && (
              <CSVUpload
                onMatchingComplete={handleMatchingComplete}
                onError={handleMatchingError}
                xeroData={dataSource1?.invoices}
                xeroCustomerName={dataSource1?.customerName}
              />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">1. Select Ledger Type</h3>
                <p className="text-sm text-neutral-600">
                  Choose AR (customer invoices) or AP (supplier invoices)
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">2. Load Data Sources</h3>
                <p className="text-sm text-neutral-600">
                  Connect to Xero or upload CSV files for both parties
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
                  Get detailed reports showing matches and discrepancies
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mt-6">
              <h4 className="font-medium text-blue-900 mb-2">Supported Data Sources</h4>
              <p className="text-sm text-blue-800">
                Connect directly to Xero for automatic data import, or upload CSV files with transactionNumber, amount, and date columns.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
