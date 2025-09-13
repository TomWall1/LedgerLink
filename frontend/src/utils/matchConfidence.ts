export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  counterparty: string;
  reference?: string;
  status: string;
}

export interface MatchResult {
  id: string;
  ourRecord: InvoiceRecord;
  theirRecord?: InvoiceRecord;
  confidence: number;
  status: 'matched' | 'mismatched' | 'no-match';
  reasons: string[];
  insights: string[];
}

export const calculateMatchConfidence = (
  record1: InvoiceRecord,
  record2: InvoiceRecord
): { confidence: number; reasons: string[] } => {
  let confidence = 0;
  const reasons: string[] = [];
  
  // Invoice number matching (40% weight)
  if (record1.invoiceNumber === record2.invoiceNumber) {
    confidence += 40;
  } else if (record1.invoiceNumber.toLowerCase().includes(record2.invoiceNumber.toLowerCase()) ||
             record2.invoiceNumber.toLowerCase().includes(record1.invoiceNumber.toLowerCase())) {
    confidence += 25;
    reasons.push('Invoice numbers partially match');
  } else {
    reasons.push('Invoice numbers do not match');
  }
  
  // Amount matching (30% weight)
  const amountDiff = Math.abs(record1.amount - record2.amount);
  const amountPercent = amountDiff / Math.max(record1.amount, record2.amount);
  
  if (amountDiff === 0) {
    confidence += 30;
  } else if (amountPercent <= 0.01) { // 1% tolerance
    confidence += 25;
    reasons.push('Minor amount difference detected');
  } else if (amountPercent <= 0.05) { // 5% tolerance
    confidence += 15;
    reasons.push('Moderate amount difference detected');
  } else {
    reasons.push(`Significant amount difference: $${amountDiff.toFixed(2)}`);
  }
  
  // Date matching (20% weight)
  const date1 = new Date(record1.date);
  const date2 = new Date(record2.date);
  const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    confidence += 20;
  } else if (daysDiff <= 7) {
    confidence += 15;
    reasons.push(`Date difference: ${Math.round(daysDiff)} days`);
  } else if (daysDiff <= 30) {
    confidence += 10;
    reasons.push(`Date difference: ${Math.round(daysDiff)} days`);
  } else {
    reasons.push(`Large date difference: ${Math.round(daysDiff)} days`);
  }
  
  // Reference matching (10% weight)
  if (record1.reference && record2.reference) {
    if (record1.reference === record2.reference) {
      confidence += 10;
    } else if (record1.reference.toLowerCase().includes(record2.reference.toLowerCase()) ||
               record2.reference.toLowerCase().includes(record1.reference.toLowerCase())) {
      confidence += 5;
      reasons.push('Reference numbers partially match');
    } else {
      reasons.push('Reference numbers do not match');
    }
  }
  
  return { confidence: Math.min(100, confidence), reasons };
};

export const generateMatchInsights = (result: MatchResult): string[] => {
  const insights: string[] = [];
  
  if (result.confidence >= 95) {
    insights.push('High confidence match - likely the same transaction');
  } else if (result.confidence >= 80) {
    insights.push('Good match - minor discrepancies may need review');
  } else if (result.confidence >= 60) {
    insights.push('Possible match - significant differences require investigation');
  } else {
    insights.push('Low confidence - may be different transactions');
  }
  
  // Add specific insights based on the data
  if (result.ourRecord && result.theirRecord) {
    const amountDiff = Math.abs(result.ourRecord.amount - result.theirRecord.amount);
    if (amountDiff > 0.01) {
      insights.push(`Amount difference of $${amountDiff.toFixed(2)} may indicate fees, taxes, or data entry errors`);
    }
    
    const date1 = new Date(result.ourRecord.date);
    const date2 = new Date(result.theirRecord.date);
    const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) {
      insights.push('Date difference may indicate processing delays or different booking practices');
    }
    
    if (result.ourRecord.invoiceNumber !== result.theirRecord.invoiceNumber) {
      insights.push('Different invoice numbers may indicate internal vs external reference systems');
    }
  }
  
  return insights;
};