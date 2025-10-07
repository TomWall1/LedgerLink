// TEMPORARY FIX: MatchingStats component removed from upload view to prevent crashes
// Will be re-enabled once backend history endpoint is available
// Changed line ~729: Commented out <MatchingStats onViewDetails={handleViewHistory} />

/**
 * Enhanced Matches Page with Step-by-Step Workflow
 * 
 * This is the main page for invoice matching functionality.
 * Now features a clear, progressive workflow for selecting data sources
 * and performing matches, with automatic linked counterparty detection.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Toast } from '../components/ui/Toast';
import CSVUpload from '../components/matching/CSVUpload';
import MatchingResultsDisplay from '../components/matching/MatchingResults';
// import MatchingStats from '../components/matching/MatchingStats'; // TEMPORARILY DISABLED
import LedgerTypeSelector from '../components/matching/workflow/LedgerTypeSelector';
import DataSourceDropdown, { DataSourceType } from '../components/matching/workflow/DataSourceDropdown';
import CustomerSelectorDropdown from '../components/matching/workflow/CustomerSelectorDropdown';
import DataSourceSummary from '../components/matching/workflow/DataSourceSummary';
import MatchReadyCard from '../components/matching/workflow/MatchReadyCard';
import LinkedCounterpartyCard from '../components/matching/workflow/LinkedCounterpartyCard';
import { MatchingResults, TransactionRecord } from '../types/matching';
import matchingService from '../services/matchingService';
import { xeroService } from '../services/xeroService';
import { counterpartyService, LinkedCounterparty } from '../services/counterpartyService';
import { downloadCSVTemplate, getTemplateInfo } from '../utils/csvTemplate';

interface MatchesProps {
  isLoggedIn: boolean;
}

type ViewMode = 'upload' | 'results' | 'history';

interface LoadedDataSource {
  type: 'xero' | 'csv';
  invoices: TransactionRecord[];
  customerName?: string;
  customerId?: string;
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
  
  // Linked counterparty state
  const [linkedCounterparty, setLinkedCounterparty] = useState<LinkedCounterparty | null>(null);
  const [checkingLinkedCounterparty, setCheckingLinkedCounterparty] = useState(false);
  const [showLinkedCounterparty, setShowLinkedCounterparty] = useState(true);
  const [loadingLinkedData, setLoadingLinkedData] = useState(false);

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
   * Check for linked counterparty when Data Source 1 is loaded
   */
  useEffect(() => {
    const checkLinkedCounterparty = async () => {
      if (!dataSource1 || !dataSource1.customerId || !dataSource1.customerName) {
        setLinkedCounterparty(null);
        return;
      }

      setCheckingLinkedCounterparty(true);
      try {
        console.log('🔗 Checking for linked counterparty...');
        const linked = await counterpartyService.getLinkedCounterpartyWithFallback(
          dataSource1.customerId,
          dataSource1.customerName
        );
        
        if (linked) {
          console.log('✅ Found linked counterparty:', linked.name);
          setLinkedCounterparty(linked);
          setShowLinkedCounterparty(true);
        } else {
          console.log('ℹ️ No linked counterparty found');
          setLinkedCounterparty(null);
        }
      } catch (error) {
        console.error('Error checking linked counterparty:', error);
        setLinkedCounterparty(null);
      } finally {
        setCheckingLinkedCounterparty(false);
      }
    };

    checkLinkedCounterparty();
  }, [dataSource1]);

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
    setLinkedCounterparty(null);
    setShowLinkedCounterparty(true);
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
  const handleDownloadTemplate = (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      downloadCSVTemplate();
      showToast('CSV template downloaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to download template', 'error');
    }
  };

  /**
   * Handle Xero customer selection and data loading
   */
  const handleXeroDataLoad = async (customer: any) => {
    try {
      console.log('📊 Loading invoices for customer:', customer.Name);
      const invoices = await xeroService.getInvoices(customer.ContactID);
      
      const loadedData: LoadedDataSource = {
        type: 'xero',
        invoices: invoices,
        customerName: customer.Name,
        customerId: customer.ContactID,
        invoiceCount: invoices.length
      };

      if (!dataSource1) {
        setDataSource1(loadedData);
        showToast(
          `Loaded ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} from Xero for ${customer.Name}`,
          'success'
        );
      } else {
        setDataSource2(loadedData);
        showToast(
          `Loaded ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} from Xero for ${customer.Name}`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error loading Xero invoices:', error);
      showToast('Failed to load invoices from Xero', 'error');
    }
  };

  /**
   * Handle using linked counterparty account
   */
  const handleUseLinkedAccount = async () => {
    if (!linkedCounterparty || !linkedCounterparty.xeroContactId) {
      showToast('Cannot load linked account data', 'error');
      return;
    }

    setLoadingLinkedData(true);
    try {
      console.log('📊 Loading invoices for linked counterparty:', linkedCounterparty.name);
      const invoices = await xeroService.getInvoices(linkedCounterparty.xeroContactId);
      
      const loadedData: LoadedDataSource = {
        type: 'xero',
        invoices: invoices,
        customerName: linkedCounterparty.name,
        customerId: linkedCounterparty.xeroContactId,
        invoiceCount: invoices.length
      };

      setDataSource2(loadedData);
      showToast(
        `Loaded ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} from linked account: ${linkedCounterparty.name}`,
        'success'
      );
    } catch (error) {
      console.error('Error loading linked counterparty invoices:', error);
      showToast('Failed to load invoices from linked account', 'error');
    } finally {
      setLoadingLinkedData(false);
    }
  };

  /**
   * Handle choosing different source (bypass linked counterparty)
   */
  const handleChooseDifferentSource = () => {
    setShowLinkedCounterparty(false);
    showToast('You can now choose a different data source', 'info');
  };

  /**
   * Clear data source
   */
  const handleClearDataSource = (sourceNumber: 1 | 2) => {
    if (sourceNumber === 1) {
      setDataSource1(null);
      setDataSource1Type(null);
      setLinkedCounterparty(null);
      setShowLinkedCounterparty(true);
      // Also clear source 2 since workflow requires source 1 first
      setDataSource2(null);
      setDataSource2Type(null);
    } else {
      setDataSource2(null);
      setDataSource2Type(null);
      setShowLinkedCounterparty(true);
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
      setLinkedCounterparty(null);
      setShowLinkedCounterparty(true);
    } else if (step === 2) {
      // Back to data source 1 selection
      setDataSource1Type(null);
      setDataSource1(null);
      setDataSource2Type(null);
      setDataSource2(null);
      setLinkedCounterparty(null);
      setShowLinkedCounterparty(true);
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

  // Determine if we should show linked counterparty card
  const shouldShowLinkedCounterparty = 
    dataSource1 && 
    !dataSource2 && 
    linkedCounterparty && 
    showLinkedCounterparty &&
    !checkingLinkedCounterparty;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* REMAINING CODE CONTINUES THE SAME... */}
      {/* Note: MatchingStats component is temporarily disabled until backend history endpoint is implemented */}
    </div>
  );
};

export default Matches;
