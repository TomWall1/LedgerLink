import { MatchResult, InvoiceRecord, calculateMatchConfidence, generateMatchInsights } from '../utils/matchConfidence';

export interface DashboardMetrics {
  totalInvoices: number;
  matchedInvoices: number;
  pendingInvoices: number;
  totalValue: number;
  averageMatchConfidence: number;
  connectionsActive: number;
  recentActivity: Array<{
    id: string;
    type: 'match' | 'connection' | 'error';
    message: string;
    timestamp: string;
    details?: string;
  }>;
}

export interface ERPConnection {
  id: string;
  name: string;
  type: 'xero' | 'quickbooks' | 'sage' | 'netsuite' | 'sap';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  recordCount: number;
  authUrl?: string;
  errorMessage?: string;
}

export interface CounterpartyLink {
  id: string;
  ourCustomer: string;
  theirCompany: string;
  theirSystem: string;
  connectionStatus: 'linked' | 'pending' | 'error';
  inviteDate: string;
  lastActivity?: string;
  recordsShared: number;
}

// Sample invoice records
const sampleOurRecords: InvoiceRecord[] = [
  {
    id: 'our-001',
    invoiceNumber: 'INV-2024-001',
    amount: 1250.00,
    date: '2024-01-15',
    counterparty: 'Acme Corporation',
    reference: 'PO-4567',
    status: 'outstanding',
  },
  {
    id: 'our-002',
    invoiceNumber: 'INV-2024-002',
    amount: 3750.50,
    date: '2024-01-18',
    counterparty: 'Beta Industries',
    reference: 'REF-8901',
    status: 'paid',
  },
  {
    id: 'our-003',
    invoiceNumber: 'INV-2024-003',
    amount: 987.25,
    date: '2024-01-20',
    counterparty: 'Gamma Solutions',
    reference: 'ORD-2345',
    status: 'outstanding',
  },
  {
    id: 'our-004',
    invoiceNumber: 'INV-2024-004',
    amount: 2100.00,
    date: '2024-01-22',
    counterparty: 'Delta Corp',
    reference: 'PO-6789',
    status: 'paid',
  },
  {
    id: 'our-005',
    invoiceNumber: 'INV-2024-005',
    amount: 1575.75,
    date: '2024-01-25',
    counterparty: 'Epsilon Ltd',
    status: 'outstanding',
  },
];

const sampleTheirRecords: InvoiceRecord[] = [
  {
    id: 'their-001',
    invoiceNumber: 'INV-2024-001',
    amount: 1250.00,
    date: '2024-01-15',
    counterparty: 'Your Company',
    reference: 'PO-4567',
    status: 'received',
  },
  {
    id: 'their-002',
    invoiceNumber: 'INV-2024-002',
    amount: 3752.50, // Slight difference
    date: '2024-01-19', // One day difference
    counterparty: 'Your Company',
    reference: 'REF-8901',
    status: 'processed',
  },
  {
    id: 'their-003',
    invoiceNumber: 'INV-2024-004', // Different invoice number
    amount: 2100.00,
    date: '2024-01-22',
    counterparty: 'Your Company',
    reference: 'PO-6789',
    status: 'processed',
  },
  // Note: No record for INV-2024-003 and INV-2024-005 (unmatched)
];

// Generate matching results
const generateMatchingResults = (): MatchResult[] => {
  const results: MatchResult[] = [];
  
  // Perfect match
  const perfectMatch = calculateMatchConfidence(sampleOurRecords[0], sampleTheirRecords[0]);
  results.push({
    id: 'match-001',
    ourRecord: sampleOurRecords[0],
    theirRecord: sampleTheirRecords[0],
    confidence: perfectMatch.confidence,
    status: 'matched',
    reasons: perfectMatch.reasons,
    insights: generateMatchInsights({
      id: 'match-001',
      ourRecord: sampleOurRecords[0],
      theirRecord: sampleTheirRecords[0],
      confidence: perfectMatch.confidence,
      status: 'matched',
      reasons: perfectMatch.reasons,
      insights: [],
    }),
  });
  
  // Mismatched (amount and date differences)
  const mismatch = calculateMatchConfidence(sampleOurRecords[1], sampleTheirRecords[1]);
  results.push({
    id: 'match-002',
    ourRecord: sampleOurRecords[1],
    theirRecord: sampleTheirRecords[1],
    confidence: mismatch.confidence,
    status: 'mismatched',
    reasons: mismatch.reasons,
    insights: generateMatchInsights({
      id: 'match-002',
      ourRecord: sampleOurRecords[1],
      theirRecord: sampleTheirRecords[1],
      confidence: mismatch.confidence,
      status: 'mismatched',
      reasons: mismatch.reasons,
      insights: [],
    }),
  });
  
  // Unmatched records
  results.push({
    id: 'match-003',
    ourRecord: sampleOurRecords[2],
    confidence: 0,
    status: 'no-match',
    reasons: ['No corresponding record found in counterparty system'],
    insights: ['This invoice may not have been received or processed yet'],
  });
  
  // Possible match with different invoice number
  const possibleMatch = calculateMatchConfidence(sampleOurRecords[3], sampleTheirRecords[2]);
  results.push({
    id: 'match-004',
    ourRecord: sampleOurRecords[3],
    theirRecord: sampleTheirRecords[2],
    confidence: possibleMatch.confidence,
    status: 'mismatched',
    reasons: possibleMatch.reasons,
    insights: generateMatchInsights({
      id: 'match-004',
      ourRecord: sampleOurRecords[3],
      theirRecord: sampleTheirRecords[2],
      confidence: possibleMatch.confidence,
      status: 'mismatched',
      reasons: possibleMatch.reasons,
      insights: [],
    }),
  });
  
  // Another unmatched
  results.push({
    id: 'match-005',
    ourRecord: sampleOurRecords[4],
    confidence: 0,
    status: 'no-match',
    reasons: ['No corresponding record found in counterparty system'],
    insights: ['Recent invoice - may still be in processing'],
  });
  
  return results;
};

export const mockDashboardMetrics: DashboardMetrics = {
  totalInvoices: 1247,
  matchedInvoices: 1089,
  pendingInvoices: 158,
  totalValue: 2847300,
  averageMatchConfidence: 87,
  connectionsActive: 3,
  recentActivity: [
    {
      id: 'activity-001',
      type: 'match',
      message: 'Matched 23 invoices with Acme Corporation',
      timestamp: '2024-01-28T10:30:00Z',
      details: '23 invoices successfully matched with 95% average confidence',
    },
    {
      id: 'activity-002',
      type: 'connection',
      message: 'Xero integration synchronized',
      timestamp: '2024-01-28T09:15:00Z',
      details: '1,247 records synchronized from Xero',
    },
    {
      id: 'activity-003',
      type: 'match',
      message: 'Found 5 potential matches requiring review',
      timestamp: '2024-01-28T08:45:00Z',
      details: 'Low confidence matches detected with Beta Industries',
    },
    {
      id: 'activity-004',
      type: 'error',
      message: 'QuickBooks sync failed',
      timestamp: '2024-01-27T16:20:00Z',
      details: 'Authentication token expired, re-authorization required',
    },
    {
      id: 'activity-005',
      type: 'connection',
      message: 'New counterparty invitation sent',
      timestamp: '2024-01-27T14:10:00Z',
      details: 'Invitation sent to Gamma Solutions via email',
    },
  ],
};

export const mockERPConnections: ERPConnection[] = [
  {
    id: 'erp-001',
    name: 'Xero Production',
    type: 'xero',
    status: 'connected',
    lastSync: '2024-01-28T10:30:00Z',
    recordCount: 1247,
  },
  {
    id: 'erp-002',
    name: 'QuickBooks Online',
    type: 'quickbooks',
    status: 'error',
    lastSync: '2024-01-27T16:20:00Z',
    recordCount: 0,
    errorMessage: 'Authentication token expired. Please re-authorize.',
    authUrl: 'https://apps.intuit.com/oauth2/authorize...',
  },
  {
    id: 'erp-003',
    name: 'Sage Intacct',
    type: 'sage',
    status: 'disconnected',
    lastSync: '2024-01-20T08:00:00Z',
    recordCount: 0,
  },
  {
    id: 'erp-004',
    name: 'NetSuite',
    type: 'netsuite',
    status: 'syncing',
    lastSync: '2024-01-28T11:00:00Z',
    recordCount: 892,
  },
];

export const mockCounterpartyLinks: CounterpartyLink[] = [
  {
    id: 'cp-001',
    ourCustomer: 'Acme Corporation',
    theirCompany: 'Acme Corp',
    theirSystem: 'Xero',
    connectionStatus: 'linked',
    inviteDate: '2024-01-15T10:00:00Z',
    lastActivity: '2024-01-28T10:30:00Z',
    recordsShared: 89,
  },
  {
    id: 'cp-002',
    ourCustomer: 'Beta Industries',
    theirCompany: 'Beta Industries Inc',
    theirSystem: 'QuickBooks',
    connectionStatus: 'linked',
    inviteDate: '2024-01-10T14:30:00Z',
    lastActivity: '2024-01-27T16:45:00Z',
    recordsShared: 156,
  },
  {
    id: 'cp-003',
    ourCustomer: 'Gamma Solutions',
    theirCompany: 'Gamma Solutions Ltd',
    theirSystem: 'Sage',
    connectionStatus: 'pending',
    inviteDate: '2024-01-27T14:10:00Z',
    recordsShared: 0,
  },
  {
    id: 'cp-004',
    ourCustomer: 'Delta Corp',
    theirCompany: 'Delta Corporation',
    theirSystem: 'NetSuite',
    connectionStatus: 'error',
    inviteDate: '2024-01-20T09:15:00Z',
    lastActivity: '2024-01-25T11:20:00Z',
    recordsShared: 23,
  },
];

export const mockMatchingResults: MatchResult[] = generateMatchingResults();

// Helper functions for mock data
export const getERPConnectionByType = (type: string): ERPConnection | undefined => {
  return mockERPConnections.find(conn => conn.type === type);
};

export const getCounterpartyByStatus = (status: string): CounterpartyLink[] => {
  return mockCounterpartyLinks.filter(cp => cp.connectionStatus === status);
};

export const getTotalValueByStatus = (status: string): number => {
  return mockMatchingResults
    .filter(result => result.status === status)
    .reduce((sum, result) => sum + result.ourRecord.amount, 0);
};

export const getMatchingResultsByConfidence = (minConfidence: number): MatchResult[] => {
  return mockMatchingResults.filter(result => result.confidence >= minConfidence);
};