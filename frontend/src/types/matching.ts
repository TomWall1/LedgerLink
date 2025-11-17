/**
 * TypeScript Types for Matching System
 * 
 * These types define the structure of data used in the invoice matching system.
 * Think of them as "blueprints" that tell TypeScript what shape our data should have.
 */

// API Response Types - How the backend sends data to the frontend
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

// Date Format Options - Different ways dates can be formatted in CSV files  
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY';

// Invoice/Transaction Record - A single invoice or transaction line
export interface TransactionRecord {
  transactionNumber: string;
  amount: number;
  date: string;
  dueDate?: string;
  status?: string;
  reference?: string;
  type?: string;
  vendor?: string;
  description?: string;
  // Partial payment fields
  is_partially_paid?: boolean;
  amount_paid?: number;
  original_amount?: number;
  payment_date?: string;
  // Allow for additional fields from different CSV formats
  [key: string]: any;
}

// Perfect Match - When two invoices match exactly
export interface PerfectMatch {
  company1: TransactionRecord;
  company2: TransactionRecord;
  confidence: number;
  matchedOn: string[]; // What fields were used to match (e.g., ['transactionNumber', 'amount'])
}

// Mismatch - When invoices are related but have differences
export interface Mismatch {
  company1: TransactionRecord;
  company2: TransactionRecord;
  confidence: number;
  differences: {
    field: string;
    company1Value: any;
    company2Value: any;
    variance?: number;
  }[];
  matchedOn: string[];
}

// Unmatched Items - Invoices that couldn't be matched to anything
export interface UnmatchedItems {
  company1: TransactionRecord[];
  company2: TransactionRecord[];
}

// Date Mismatch - When matched transactions have date discrepancies
export interface DateMismatch {
  company1: TransactionRecord;
  company2: TransactionRecord;
  company1Date: string;
  company2Date: string;
  mismatchType: 'transaction_date' | 'due_date';
  daysDifference: number;
}

// Historical Insight - Shows AP items with historical AR matches
export interface HistoricalInsight {
  apItem: TransactionRecord;
  historicalMatch: TransactionRecord;
  insight: {
    message: string;
    severity: 'error' | 'warning' | 'info';
    type: string;
  };
}

// Totals and Summary Information
export interface MatchingTotals {
  company1Total: number;
  company2Total: number;
  variance: number;
  perfectMatchTotal: number;
  mismatchTotal: number;
  unmatchedTotal: number;
}

// Statistics calculated from the matching results
export interface MatchingStatistics {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  matchRate: number; // Percentage
  avgConfidence: number;
  totalAmount: number;
  matchedAmount: number;
  varianceAmount: number;
}

// Complete Matching Results - Everything returned from a matching operation
export interface MatchingResults {
  perfectMatches: PerfectMatch[];
  mismatches: Mismatch[];
  unmatchedItems: UnmatchedItems;
  dateMismatches?: DateMismatch[];
  historicalInsights?: HistoricalInsight[];
  totals: MatchingTotals;
  statistics: MatchingStatistics;
  processingTime: number; // How long the matching took in milliseconds
  matchId?: string; // Database ID for this matching result
  timestamp: string;
}

// Upload Request - What we send to the backend when uploading CSVs
export interface UploadMatchingRequest {
  company1File: File;
  company2File: File;
  dateFormat1?: DateFormat;
  dateFormat2?: DateFormat;
  notes?: string;
  counterpartyId?: string;
}

// Matching History - Previous matching operations
export interface MatchingHistoryItem {
  _id: string;
  createdAt: string;
  metadata: {
    fileName1?: string;
    fileName2?: string;
    sourceType1?: string;
    sourceType2?: string;
    processingTime: number;
    uploadedBy: string;
    notes?: string;
  };
  statistics: MatchingStatistics;
  totals: MatchingTotals;
}

// Company Statistics - Overall stats for a company's matching history
export interface CompanyStatistics {
  totalRuns: number;
  avgMatchRate: number;
  totalPerfectMatches: number;
  totalMismatches: number;
  lastRun: string | null;
}

// API Response for History endpoint
export interface MatchingHistoryResponse {
  history: MatchingHistoryItem[];
  statistics: CompanyStatistics;
}

// CSV Upload Component Props
export interface CSVUploadProps {
  onUploadSuccess: (results: MatchingResults) => void;
  onUploadError: (error: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// Matching Results Display Props  
export interface MatchingResultsProps {
  results: MatchingResults | null;
  isLoading?: boolean;
  onExport?: (matchId: string) => void;
  onDelete?: (matchId: string) => void;
}

// Upload Status for UI feedback
export interface UploadStatus {
  isUploading: boolean;
  progress?: number;
  message?: string;
  error?: string;
}

// File Validation Result
export interface FileValidation {
  isValid: boolean;
  error?: string;
  previewData?: {
    headers: string[];
    rows: any[][];
    totalRows: number;
  };
}
