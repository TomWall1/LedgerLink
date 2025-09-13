/**
 * Match confidence calculation utilities
 * Determines match percentage and reason codes for invoice matching
 */

export interface MatchingRule {
  field: string;
  weight: number;
  tolerance?: number;
}

export interface MatchResult {
  confidence: number;
  status: 'matched' | 'mismatched' | 'no-match';
  reasons: string[];
  details: {
    invoiceNumber: number;
    amount: number;
    date: number;
    reference: number;
    counterparty: number;
  };
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  dueDate?: string;
  reference?: string;
  counterparty: string;
  status: 'open' | 'paid' | 'overdue';
  transactionType: 'INVOICE' | 'CREDIT_NOTE' | 'PAYMENT';
}

const defaultRules: MatchingRule[] = [
  { field: 'invoiceNumber', weight: 30 },
  { field: 'amount', weight: 30, tolerance: 0.01 }, // 1% tolerance
  { field: 'date', weight: 20, tolerance: 7 }, // 7 days tolerance
  { field: 'reference', weight: 10 },
  { field: 'counterparty', weight: 10 },
];

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate date similarity with tolerance
 */
function calculateDateSimilarity(date1: string, date2: string, toleranceDays: number = 7): number {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 1;
    if (diffDays <= toleranceDays) return Math.max(0, 1 - (diffDays / toleranceDays));
    
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Calculate amount similarity with tolerance
 */
function calculateAmountSimilarity(amount1: number, amount2: number, tolerancePercent: number = 0.01): number {
  if (amount1 === amount2) return 1;
  
  const diff = Math.abs(amount1 - amount2);
  const avgAmount = (amount1 + amount2) / 2;
  const diffPercent = diff / avgAmount;
  
  if (diffPercent <= tolerancePercent) return 1;
  if (diffPercent <= tolerancePercent * 10) return Math.max(0, 1 - (diffPercent / (tolerancePercent * 10)));
  
  return 0;
}

/**
 * Calculate match confidence between two invoice records
 */
export function calculateMatchConfidence(
  record1: InvoiceRecord,
  record2: InvoiceRecord,
  rules: MatchingRule[] = defaultRules
): MatchResult {
  const scores = {
    invoiceNumber: 0,
    amount: 0,
    date: 0,
    reference: 0,
    counterparty: 0,
  };
  
  const reasons: string[] = [];
  
  // Calculate individual field scores
  scores.invoiceNumber = calculateStringSimilarity(record1.invoiceNumber, record2.invoiceNumber);
  if (scores.invoiceNumber < 0.8) {
    reasons.push(`Invoice number mismatch: ${record1.invoiceNumber} vs ${record2.invoiceNumber}`);
  }
  
  const amountRule = rules.find(r => r.field === 'amount');
  scores.amount = calculateAmountSimilarity(record1.amount, record2.amount, amountRule?.tolerance);
  if (scores.amount < 1) {
    reasons.push(`Amount difference: $${Math.abs(record1.amount - record2.amount).toFixed(2)}`);
  }
  
  const dateRule = rules.find(r => r.field === 'date');
  scores.date = calculateDateSimilarity(record1.date, record2.date, dateRule?.tolerance);
  if (scores.date < 1) {
    const daysDiff = Math.abs((new Date(record1.date).getTime() - new Date(record2.date).getTime()) / (1000 * 60 * 60 * 24));
    reasons.push(`Date difference: ${Math.round(daysDiff)} days`);
  }
  
  scores.reference = calculateStringSimilarity(record1.reference || '', record2.reference || '');
  if (scores.reference < 0.5 && (record1.reference || record2.reference)) {
    reasons.push(`Reference mismatch: ${record1.reference || 'N/A'} vs ${record2.reference || 'N/A'}`);
  }
  
  scores.counterparty = calculateStringSimilarity(record1.counterparty, record2.counterparty);
  if (scores.counterparty < 0.8) {
    reasons.push(`Counterparty name difference`);
  }
  
  // Calculate weighted confidence score
  let confidence = 0;
  for (const rule of rules) {
    const fieldScore = scores[rule.field as keyof typeof scores] || 0;
    confidence += fieldScore * (rule.weight / 100);
  }
  
  confidence = Math.round(confidence * 100);
  
  // Determine status
  let status: 'matched' | 'mismatched' | 'no-match';
  if (confidence >= 90) {
    status = 'matched';
  } else if (confidence >= 50) {
    status = 'mismatched';
  } else {
    status = 'no-match';
  }
  
  return {
    confidence,
    status,
    reasons,
    details: {
      invoiceNumber: Math.round(scores.invoiceNumber * 100),
      amount: Math.round(scores.amount * 100),
      date: Math.round(scores.date * 100),
      reference: Math.round(scores.reference * 100),
      counterparty: Math.round(scores.counterparty * 100),
    },
  };
}

/**
 * Generate insights based on ERP history and match results
 */
export function generateMatchInsights(
  record1: InvoiceRecord,
  record2: InvoiceRecord,
  matchResult: MatchResult
): string[] {
  const insights: string[] = [];
  
  // Status-based insights
  if (record1.status === 'paid' && record2.status === 'open') {
    insights.push(`${record1.invoiceNumber} shows as paid in our system but remains open in counterparty ledger`);
  }
  
  if (record1.status === 'open' && record2.status === 'paid') {
    insights.push(`${record1.invoiceNumber} shows as open in our system but paid in counterparty ledger`);
  }
  
  // Amount insights
  if (matchResult.details.amount < 100 && matchResult.details.amount > 80) {
    insights.push('Small amount difference may indicate currency conversion or fees');
  }
  
  // Date insights
  if (matchResult.details.date < 100 && matchResult.details.date > 50) {
    insights.push('Date difference may indicate processing delays or different fiscal periods');
  }
  
  // Due date insights
  if (record1.dueDate && record2.dueDate) {
    const dueDateDiff = Math.abs((new Date(record1.dueDate).getTime() - new Date(record2.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (dueDateDiff > 7) {
      insights.push('Different payment terms may explain due date variance');
    }
  }
  
  return insights;
}

/**
 * Export functions for CSV/PDF reporting
 */
export function formatMatchResultForExport(matchResult: MatchResult, record1: InvoiceRecord, record2: InvoiceRecord) {
  return {
    'Invoice Number (Our)': record1.invoiceNumber,
    'Invoice Number (Their)': record2.invoiceNumber,
    'Amount (Our)': record1.amount,
    'Amount (Their)': record2.amount,
    'Date (Our)': record1.date,
    'Date (Their)': record2.date,
    'Match Confidence': `${matchResult.confidence}%`,
    'Status': matchResult.status,
    'Reasons': matchResult.reasons.join('; '),
  };
}