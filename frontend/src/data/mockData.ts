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

// Mock Dashboard Data
export const mockDashboardMetrics: DashboardMetrics = {
  totalInvoices: 2847,
  matchedInvoices: 2654,
  pendingInvoices: 123,
  unmatchedInvoices: 70,
  averageMatchConfidence: 94,
  totalValue: 1245670.89,
  matchedValue: 1176543.21,
  recentActivity: [
    {
      id: 'act-001',
      type: 'match',
      description: 'Matched 47 invoices from Acme Corp',
      timestamp: '2024-01-30T14:30:00Z',
      status: 'success',
    },
    {
      id: 'act-002',
      type: 'connection',
      description: 'Xero connection synchronized',
      timestamp: '2024-01-30T13:15:00Z',
      status: 'success',
    },
    {
      id: 'act-003',
      type: 'report',
      description: 'Monthly reconciliation report generated',
      timestamp: '2024-01-30T10:45:00Z',
      status: 'success',
    },
    {
      id: 'act-004',
      type: 'match',
      description: '3 mismatched invoices require review',
      timestamp: '2024-01-30T09:20:00Z',
      status: 'warning',
    },
    {
      id: 'act-005',
      type: 'connection',
      description: 'QuickBooks sync failed - authentication expired',
      timestamp: '2024-01-29T16:30:00Z',
      status: 'error',
    },
  ],
};

// Mock ERP Connections
export const mockERPConnections: ERPConnection[] = [
  {
    id: 'erp-001',
    name: 'Xero Production',
    type: 'xero',
    status: 'connected',
    lastSync: '2024-01-30T13:15:00Z',
    recordCount: 1247,
    setupDate: '2023-12-15T10:00:00Z',
    nextSync: '2024-01-30T19:15:00Z',
  },
  {
    id: 'erp-002',
    name: 'QuickBooks Online',
    type: 'quickbooks',
    status: 'error',
    lastSync: '2024-01-28T14:20:00Z',
    recordCount: 892,
    setupDate: '2023-11-20T09:30:00Z',
  },
  {
    id: 'erp-003',
    name: 'Sage 50cloud',
    type: 'sage',
    status: 'connected',
    lastSync: '2024-01-30T12:45:00Z',
    recordCount: 1356,
    setupDate: '2023-10-05T11:15:00Z',
    nextSync: '2024-01-31T00:45:00Z',
  },
  {
    id: 'erp-004',
    name: 'NetSuite Sandbox',
    type: 'netsuite',
    status: 'syncing',
    lastSync: '2024-01-30T15:00:00Z',
    recordCount: 2103,
    setupDate: '2023-09-12T14:20:00Z',
  },
];

// Mock Counterparty Links
export const mockCounterpartyLinks: CounterpartyLink[] = [
  {
    id: 'cp-001',
    ourCustomer: 'Acme Corporation',
    theirSystem: 'Xero',
    theirContact: 'Sarah Johnson',
    theirEmail: 'sarah.johnson@acmecorp.com',
    connectionStatus: 'linked',
    lastActivity: '2024-01-30T14:30:00Z',
    totalInvoices: 127,
    matchRate: 98.4,
  },
  {
    id: 'cp-002',
    ourCustomer: 'Global Suppliers Ltd',
    theirSystem: 'QuickBooks',
    theirContact: 'Michael Chen',
    theirEmail: 'michael.chen@globalsuppliers.com',
    connectionStatus: 'linked',
    lastActivity: '2024-01-29T16:45:00Z',
    totalInvoices: 89,
    matchRate: 94.3,
  },
  {
    id: 'cp-003',
    ourCustomer: 'TechFlow Solutions',
    theirSystem: 'Sage',
    theirContact: 'Emma Rodriguez',
    theirEmail: 'emma.rodriguez@techflow.com',
    connectionStatus: 'pending',
    lastActivity: '2024-01-28T10:20:00Z',
    totalInvoices: 0,
    matchRate: 0,
  },
  {
    id: 'cp-004',
    ourCustomer: 'Metro Logistics',
    theirSystem: 'Custom API',
    theirContact: 'David Park',
    theirEmail: 'david.park@metrologistics.com',
    connectionStatus: 'failed',
    lastActivity: '2024-01-27T09:15:00Z',
    totalInvoices: 45,
    matchRate: 76.5,
  },
];

// Mock Matching Results
export const mockMatchingResults: MatchingResult[] = [
  {
    id: 'match-001',
    ourRecord: {
      invoiceNumber: 'INV-2024-0156',
      amount: 2450.00,
      date: '2024-01-25',
      counterparty: 'Acme Corporation',
      reference: 'PO-789456',
      status: 'Outstanding',
    },
    theirRecord: {
      invoiceNumber: 'INV-2024-0156',
      amount: 2450.00,
      date: '2024-01-25',
      reference: 'PO-789456',
      status: 'Pending Payment',
    },
    confidence: 100,
    status: 'matched',
    reasons: [],
    insights: ['Perfect match on all fields', 'Both systems show consistent status'],
  },
  {
    id: 'match-002',
    ourRecord: {
      invoiceNumber: 'INV-2024-0157',
      amount: 1875.50,
      date: '2024-01-26',
      counterparty: 'Global Suppliers Ltd',
      reference: 'REF-445566',
      status: 'Outstanding',
    },
    theirRecord: {
      invoiceNumber: 'INV-2024-0157',
      amount: 1875.50,
      date: '2024-01-27',
      reference: 'REF-445566',
      status: 'Approved',
    },
    confidence: 95,
    status: 'matched',
    reasons: ['Date difference: 1 day'],
    insights: ['Minor date discrepancy likely due to processing delay', 'Amount and reference match perfectly'],
  },
  {
    id: 'match-003',
    ourRecord: {
      invoiceNumber: 'INV-2024-0158',
      amount: 3200.00,
      date: '2024-01-26',
      counterparty: 'TechFlow Solutions',
      reference: 'PROJ-2024-001',
      status: 'Outstanding',
    },
    theirRecord: {
      invoiceNumber: 'INV-2024-0158',
      amount: 3175.00,
      date: '2024-01-26',
      reference: 'PROJ-2024-001',
      status: 'Under Review',
    },
    confidence: 87,
    status: 'mismatched',
    reasons: ['Amount difference: $25.00 (0.78%)', 'Status discrepancy'],
    insights: ['Small amount difference may be due to discount or fees', 'Consider reviewing terms and conditions'],
  },
  {
    id: 'match-004',
    ourRecord: {
      invoiceNumber: 'INV-2024-0159',
      amount: 1450.00,
      date: '2024-01-27',
      counterparty: 'Metro Logistics',
      reference: 'SHIP-2024-789',
      status: 'Outstanding',
    },
    confidence: 0,
    status: 'no-match',
    reasons: ['No matching record found in counterparty system'],
    insights: ['Invoice may not have been received yet', 'Check if invoice was sent to correct system/contact'],
  },
  {
    id: 'match-005',
    ourRecord: {
      invoiceNumber: 'INV-2024-0160',
      amount: 890.75,
      date: '2024-01-28',
      counterparty: 'Acme Corporation',
      reference: 'PO-789457',
      status: 'Outstanding',
    },
    theirRecord: {
      invoiceNumber: 'INV-2024-160', // Missing leading zero
      amount: 890.75,
      date: '2024-01-28',
      reference: 'PO-789457',
      status: 'Received',
    },
    confidence: 92,
    status: 'matched',
    reasons: ['Minor invoice number format difference'],
    insights: ['Fuzzy matching detected invoice number format variation', 'Consider standardizing invoice numbering formats'],
  },
  {
    id: 'match-006',
    ourRecord: {
      invoiceNumber: 'INV-2024-0161',
      amount: 5670.00,
      date: '2024-01-28',
      counterparty: 'Global Suppliers Ltd',
      reference: 'BULK-ORDER-2024-Q1',
      status: 'Outstanding',
    },
    theirRecord: {
      invoiceNumber: 'INV-2024-0161',
      amount: 5670.00,
      date: '2024-01-30',
      reference: 'BULK-ORDER-2024-Q1',
      status: 'Processing',
    },
    confidence: 89,
    status: 'mismatched',
    reasons: ['Date difference: 2 days', 'Status shows as processing vs outstanding'],
    insights: ['Date discrepancy may indicate processing delays', 'Large invoice amount - consider priority follow-up'],
  },
];

// Helper function to get random sample data
export const getRandomMetrics = () => {
  const baseMetrics = mockDashboardMetrics;
  const variance = 0.1; // 10% variance
  
  return {
    ...baseMetrics,
    totalInvoices: Math.floor(baseMetrics.totalInvoices * (1 + (Math.random() - 0.5) * variance)),
    matchedInvoices: Math.floor(baseMetrics.matchedInvoices * (1 + (Math.random() - 0.5) * variance)),
    averageMatchConfidence: Math.floor(baseMetrics.averageMatchConfidence * (1 + (Math.random() - 0.5) * variance)),
  };
};

// System status data
export const mockSystemStatus = {
  overallHealth: 'healthy' as 'healthy' | 'warning' | 'error',
  uptime: 99.97,
  lastIncident: '2024-01-15T08:30:00Z',
  activeConnections: 12,
  processingQueue: 3,
  apiResponseTime: 145, // milliseconds
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