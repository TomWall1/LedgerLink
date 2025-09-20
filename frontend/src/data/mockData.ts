// Empty data structures for LedgerLink
// All mock data has been removed - these are empty structures for the application

export interface DashboardMetrics {
  totalInvoices: number;
  matchedInvoices: number;
  pendingInvoices: number;
  unmatchedInvoices: number;
  averageMatchConfidence: number;
  totalValue: number;
  matchedValue: number;
  recentActivity: {
    id: string;
    type: 'match' | 'connection' | 'report';
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }[];
}

export interface ERPConnection {
  id: string;
  name: string;
  type: 'xero' | 'quickbooks' | 'sage' | 'netsuite' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  recordCount: number;
  setupDate: string;
  nextSync?: string;
}

export interface CounterpartyLink {
  id: string;
  ourCustomer: string;
  theirSystem: string;
  theirContact: string;
  theirEmail: string;
  connectionStatus: 'linked' | 'pending' | 'failed';
  lastActivity: string;
  totalInvoices: number;
  matchRate: number;
}

export interface MatchingResult {
  id: string;
  ourRecord: {
    invoiceNumber: string;
    amount: number;
    date: string;
    counterparty: string;
    reference?: string;
    status: string;
  };
  theirRecord?: {
    invoiceNumber: string;
    amount: number;
    date: string;
    reference?: string;
    status: string;
  };
  confidence: number;
  status: 'matched' | 'mismatched' | 'no-match';
  reasons: string[];
  insights: string[];
}

// Empty Dashboard Data - No mock data
export const mockDashboardMetrics: DashboardMetrics = {
  totalInvoices: 0,
  matchedInvoices: 0,
  pendingInvoices: 0,
  unmatchedInvoices: 0,
  averageMatchConfidence: 0,
  totalValue: 0,
  matchedValue: 0,
  recentActivity: [],
};

// Empty ERP Connections - No mock data
export const mockERPConnections: ERPConnection[] = [];

// Empty Counterparty Links - No mock data
export const mockCounterpartyLinks: CounterpartyLink[] = [];

// Empty Matching Results - No mock data
export const mockMatchingResults: MatchingResult[] = [];

// Helper function to get random metrics - now returns empty data
export const getRandomMetrics = () => {
  return mockDashboardMetrics;
};

// System status data - empty state
export const mockSystemStatus = {
  overallHealth: 'healthy' as 'healthy' | 'warning' | 'error',
  uptime: 0,
  lastIncident: '',
  activeConnections: 0,
  processingQueue: 0,
  apiResponseTime: 0, // milliseconds
};

// Feature availability based on login status
export const getFeatureAvailability = (isLoggedIn: boolean) => {
  return {
    erpConnections: isLoggedIn,
    counterpartyLinks: isLoggedIn,
    advancedMatching: isLoggedIn,
    reportGeneration: isLoggedIn,
    csvUpload: true, // Available to all users
    exportResults: isLoggedIn,
    customMatchingRules: isLoggedIn,
    apiAccess: isLoggedIn,
  };
};

export default {
  mockDashboardMetrics,
  mockERPConnections,
  mockCounterpartyLinks,
  mockMatchingResults,
  mockSystemStatus,
  getRandomMetrics,
  getFeatureAvailability,
};
