/**
 * Mock data for demonstrating LedgerLink functionality
 */

import { InvoiceRecord } from '../utils/matchConfidence';

export const mockARLedger: InvoiceRecord[] = [
  {
    id: 'ar-001',
    invoiceNumber: 'INV-2024-001',
    amount: 15000.00,
    date: '2024-01-15',
    dueDate: '2024-02-14',
    reference: 'PO-ABC-123',
    counterparty: 'Acme Corporation',
    status: 'open',
    transactionType: 'INVOICE',
  },
  {
    id: 'ar-002',
    invoiceNumber: 'INV-2024-002',
    amount: 8750.50,
    date: '2024-01-18',
    dueDate: '2024-02-17',
    reference: 'SO-456789',
    counterparty: 'Beta Industries Ltd',
    status: 'paid',
    transactionType: 'INVOICE',
  },
  {
    id: 'ar-003',
    invoiceNumber: 'INV-2024-003',
    amount: 23400.00,
    date: '2024-01-22',
    dueDate: '2024-02-21',
    reference: 'PO-XYZ-789',
    counterparty: 'Gamma Solutions Inc',
    status: 'overdue',
    transactionType: 'INVOICE',
  },
  {
    id: 'ar-004',
    invoiceNumber: 'INV-2024-004',
    amount: 5200.00,
    date: '2024-01-25',
    dueDate: '2024-02-24',
    reference: 'WO-2024-01',
    counterparty: 'Delta Manufacturing',
    status: 'open',
    transactionType: 'INVOICE',
  },
  {
    id: 'ar-005',
    invoiceNumber: 'CNT-2024-001',
    amount: -1200.00,
    date: '2024-01-28',
    reference: 'INV-2024-001',
    counterparty: 'Acme Corporation',
    status: 'open',
    transactionType: 'CREDIT_NOTE',
  },
];

export const mockAPLedger: InvoiceRecord[] = [
  {
    id: 'ap-001',
    invoiceNumber: 'INV-2024-001',
    amount: 15000.00,
    date: '2024-01-16', // 1 day difference
    dueDate: '2024-02-14',
    reference: 'PO-ABC-123',
    counterparty: 'Acme Corp', // Slight name difference
    status: 'paid', // Status difference
    transactionType: 'INVOICE',
  },
  {
    id: 'ap-002',
    invoiceNumber: 'INV-2024-002',
    amount: 8750.50,
    date: '2024-01-18',
    dueDate: '2024-02-17',
    reference: 'SO-456789',
    counterparty: 'Beta Industries Ltd',
    status: 'paid',
    transactionType: 'INVOICE',
  },
  {
    id: 'ap-003',
    invoiceNumber: 'INV-2024-0O3', // OCR error: 0 instead of 0
    amount: 23400.00,
    date: '2024-01-22',
    dueDate: '2024-02-21',
    reference: 'PO-XYZ-789',
    counterparty: 'Gamma Solutions Inc',
    status: 'open',
    transactionType: 'INVOICE',
  },
  // Missing INV-2024-004 (no match scenario)
  {
    id: 'ap-005',
    invoiceNumber: 'INV-2024-999', // Extra invoice not in AR
    amount: 3300.00,
    date: '2024-01-30',
    dueDate: '2024-02-28',
    reference: 'MISC-001',
    counterparty: 'Epsilon Services',
    status: 'open',
    transactionType: 'INVOICE',
  },
];

export interface ERPConnection {
  id: string;
  name: string;
  type: 'xero' | 'quickbooks' | 'sap' | 'netsuite' | 'sage';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  recordCount?: number;
}

export const mockERPConnections: ERPConnection[] = [
  {
    id: 'erp-001',
    name: 'Xero Production',
    type: 'xero',
    status: 'connected',
    lastSync: '2024-01-30T10:30:00Z',
    recordCount: 1247,
  },
  {
    id: 'erp-002',
    name: 'QuickBooks Enterprise',
    type: 'quickbooks',
    status: 'disconnected',
    lastSync: '2024-01-28T15:45:00Z',
    recordCount: 892,
  },
];

export interface CounterpartyLink {
  id: string;
  ourCustomer: string;
  theirSystem: string;
  connectionStatus: 'linked' | 'invited' | 'pending' | 'declined';
  inviteDate?: string;
  linkDate?: string;
  email?: string;
}

export const mockCounterpartyLinks: CounterpartyLink[] = [
  {
    id: 'cp-001',
    ourCustomer: 'Acme Corporation',
    theirSystem: 'Xero',
    connectionStatus: 'linked',
    linkDate: '2024-01-20T09:00:00Z',
    email: 'finance@acme-corp.com',
  },
  {
    id: 'cp-002',
    ourCustomer: 'Beta Industries Ltd',
    theirSystem: 'QuickBooks',
    connectionStatus: 'invited',
    inviteDate: '2024-01-25T14:30:00Z',
    email: 'accounts@betaindustries.com',
  },
  {
    id: 'cp-003',
    ourCustomer: 'Gamma Solutions Inc',
    theirSystem: 'SAP',
    connectionStatus: 'pending',
    inviteDate: '2024-01-28T11:15:00Z',
    email: 'ap@gammasolutions.com',
  },
];

export interface DashboardMetrics {
  totalInvoices: number;
  matchedInvoices: number;
  mismatchedInvoices: number;
  unmatchedInvoices: number;
  totalValue: number;
  matchedValue: number;
  mismatchedValue: number;
  unmatchedValue: number;
  averageMatchConfidence: number;
  lastSyncDate: string;
  connectedSystems: number;
  activeCounterparties: number;
}

export const mockDashboardMetrics: DashboardMetrics = {
  totalInvoices: 156,
  matchedInvoices: 89,
  mismatchedInvoices: 23,
  unmatchedInvoices: 44,
  totalValue: 2847653.75,
  matchedValue: 2156789.20,
  mismatchedValue: 445234.15,
  unmatchedValue: 245630.40,
  averageMatchConfidence: 87.3,
  lastSyncDate: '2024-01-30T10:30:00Z',
  connectedSystems: 3,
  activeCounterparties: 12,
};

export const mockMatchingResults = [
  {
    id: 'match-001',
    ourRecord: mockARLedger[0],
    theirRecord: mockAPLedger[0],
    confidence: 92,
    status: 'matched' as const,
    reasons: ['Status difference: open vs paid'],
    insights: ['INV-2024-001 shows as open in our system but paid in counterparty ledger'],
  },
  {
    id: 'match-002',
    ourRecord: mockARLedger[1],
    theirRecord: mockAPLedger[1],
    confidence: 100,
    status: 'matched' as const,
    reasons: [],
    insights: [],
  },
  {
    id: 'match-003',
    ourRecord: mockARLedger[2],
    theirRecord: mockAPLedger[2],
    confidence: 75,
    status: 'mismatched' as const,
    reasons: ['Invoice number mismatch: INV-2024-003 vs INV-2024-0O3'],
    insights: ['OCR error likely caused invoice number discrepancy'],
  },
  {
    id: 'match-004',
    ourRecord: mockARLedger[3],
    theirRecord: null,
    confidence: 0,
    status: 'no-match' as const,
    reasons: ['Missing from counterparty ledger'],
    insights: ['Invoice may not have been received or processed by counterparty'],
  },
];

export const supportedERPSystems = [
  { id: 'xero', name: 'Xero', logo: '🟢', description: 'Cloud accounting software' },
  { id: 'quickbooks', name: 'QuickBooks', logo: '🔵', description: 'Popular small business accounting' },
  { id: 'sap', name: 'SAP', logo: '🟡', description: 'Enterprise resource planning' },
  { id: 'netsuite', name: 'NetSuite', logo: '🟠', description: 'Cloud business management suite' },
  { id: 'sage', name: 'Sage', logo: '🟣', description: 'Business management software' },
  { id: 'myob', name: 'MYOB', logo: '🔴', description: 'Australian accounting software' },
];

export const supportedBSMSystems = [
  { id: 'salesforce', name: 'Salesforce', logo: '☁️', description: 'Customer relationship management' },
  { id: 'hubspot', name: 'HubSpot', logo: '🧡', description: 'Inbound marketing and sales' },
  { id: 'dynamics', name: 'Microsoft Dynamics', logo: '🔷', description: 'Business applications suite' },
  { id: 'pipedrive', name: 'Pipedrive', logo: '🟢', description: 'Sales-focused CRM' },
];