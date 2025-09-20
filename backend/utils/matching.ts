import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// TypeScript interfaces for the matching algorithm
export interface TransactionRecord {
  transactionNumber?: string;
  transaction_number?: string;
  invoice_number?: string;
  id?: string;
  type?: string;
  transaction_type?: string;
  amount: number | string;
  date?: string;
  issue_date?: string;
  invoiceDate?: string;
  dueDate?: string;
  due_date?: string;
  status?: string;
  reference?: string;
  payment_date?: string;
  is_paid?: boolean;
  is_voided?: boolean;
  is_partially_paid?: boolean;
  original_amount?: number | string;
  amount_paid?: number | string;
}

export interface NormalizedRecord {
  transactionNumber: string;
  type: string;
  amount: number;
  date: string | null;
  dueDate: string | null;
  status: string;
  reference: string;
  payment_date: string | null;
  is_paid: boolean;
  is_voided: boolean;
  is_partially_paid: boolean;
  original_amount: number;
  amount_paid: number;
}

export interface MatchResult {
  company1: NormalizedRecord;
  company2: NormalizedRecord;
}

export interface DateMismatch {
  company1: NormalizedRecord;
  company2: NormalizedRecord;
  mismatchType: string;
  company1Date: string | null;
  company2Date: string | null;
  daysDifference: number;
}

export interface HistoricalInsight {
  apItem: NormalizedRecord;
  historicalMatch: NormalizedRecord;
  insight: {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  };
}

export interface MatchingResults {
  perfectMatches: MatchResult[];
  mismatches: MatchResult[];
  unmatchedItems: {
    company1: NormalizedRecord[];
    company2: NormalizedRecord[];
  };
  historicalInsights: HistoricalInsight[];
  dateMismatches: DateMismatch[];
  totals: {
    company1Total: number;
    company2Total: number;
    variance: number;
  };
}

/**
 * Match records between two datasets based on various criteria
 */
export const matchRecords = async (
  company1Data: TransactionRecord[],
  company2Data: TransactionRecord[],
  dateFormat1: string = 'DD/MM/YYYY',
  dateFormat2: string = 'DD/MM/YYYY',
  historicalData: TransactionRecord[] = []
): Promise<MatchingResults> => {
  try {
    console.log('Starting matching process with:', {
      company1Count: company1Data.length,
      company2Count: company2Data.length,
      historicalCount: historicalData.length,
      dateFormat1,
      dateFormat2
    });

    // Check for common field name variations
    checkAndNormalizeFieldNames(company1Data);
    checkAndNormalizeFieldNames(company2Data);
    if (historicalData.length > 0) {
      checkAndNormalizeFieldNames(historicalData);
    }

    // Normalize data
    const normalizedCompany1 = normalizeData(company1Data, dateFormat1);
    const normalizedCompany2 = normalizeData(company2Data, dateFormat2);
    
    // Normalize historical data if provided
    const normalizedHistorical = historicalData.length > 0 ? 
      normalizeData(historicalData, dateFormat1) : [];

    const perfectMatches: MatchResult[] = [];
    const mismatches: MatchResult[] = [];
    const unmatchedItems = {
      company1: [...normalizedCompany1],
      company2: [...normalizedCompany2]
    };
    
    const historicalInsights: HistoricalInsight[] = [];
    const dateMismatches: DateMismatch[] = [];

    // Calculate totals
    const company1Total = calculateTotal(normalizedCompany1);
    const company2Total = calculateTotal(normalizedCompany2);

    console.log('Company totals:', { company1Total, company2Total });

    // Find matches
    for (const item1 of normalizedCompany1) {
      const potentialMatches = findPotentialMatches(item1, normalizedCompany2);
      console.log(`Found ${potentialMatches.length} potential matches for transaction: ${item1.transactionNumber}`);

      if (potentialMatches.length === 1) {
        const match = potentialMatches[0];
        if (isExactMatch(item1, match)) {
          console.log(`Perfect match found for transaction: ${item1.transactionNumber}`);
          perfectMatches.push({ company1: item1, company2: match });
          
          // Check for date mismatches in perfect matches
          const dateMismatch = findDateMismatch(item1, match);
          if (dateMismatch) {
            console.log(`Date mismatch found for transaction: ${item1.transactionNumber}`);
            dateMismatches.push({
              company1: item1,
              company2: match,
              mismatchType: dateMismatch.type,
              company1Date: dateMismatch.date1,
              company2Date: dateMismatch.date2,
              daysDifference: dateMismatch.daysDifference
            });
          }
          
          removeFromUnmatched(unmatchedItems, item1, match);
        } else {
          console.log(`Mismatch found for transaction: ${item1.transactionNumber}`);
          mismatches.push({ company1: item1, company2: match });
          removeFromUnmatched(unmatchedItems, item1, match);
        }
      } else if (potentialMatches.length > 1) {
        console.log(`Multiple matches found for transaction: ${item1.transactionNumber}, selecting best match`);
        const bestMatch = findBestMatch(item1, potentialMatches);
        if (bestMatch) {
          mismatches.push({ company1: item1, company2: bestMatch });
          removeFromUnmatched(unmatchedItems, item1, bestMatch);
        }
      }
    }
    
    // After regular matching, check for historical insights for unmatched AP items
    if (normalizedHistorical.length > 0) {
      for (const apItem of unmatchedItems.company2) {
        const historicalMatches = findHistoricalMatches(apItem, normalizedHistorical);
        
        if (historicalMatches.length > 0) {
          const sortedMatches = historicalMatches.sort((a, b) => {
            if (a.is_paid && !b.is_paid) return -1;
            if (!a.is_paid && b.is_paid) return 1;
            
            if (a.date && b.date) {
              return dayjs(b.date).diff(dayjs(a.date));
            }
            return 0;
          });
          
          const bestHistoricalMatch = sortedMatches[0];
          
          historicalInsights.push({
            apItem: apItem,
            historicalMatch: bestHistoricalMatch,
            insight: determineHistoricalInsight(apItem, bestHistoricalMatch)
          });
        }
      }
    }

    // Calculate variance
    const variance = calculateVariance(company1Total, company2Total);

    console.log('Matching results:', {
      perfectMatchesCount: perfectMatches.length,
      mismatchesCount: mismatches.length,
      unmatchedCompany1Count: unmatchedItems.company1.length,
      unmatchedCompany2Count: unmatchedItems.company2.length,
      historicalInsightsCount: historicalInsights.length,
      dateMismatchesCount: dateMismatches.length
    });

    return {
      perfectMatches,
      mismatches,
      unmatchedItems,
      historicalInsights,
      dateMismatches,
      totals: {
        company1Total,
        company2Total,
        variance
      }
    };
  } catch (error: any) {
    console.error('Error in matchRecords:', error);
    throw new Error(`Matching error: ${error.message}`);
  }
};

/**
 * Find date mismatches between two otherwise matching items
 */
const findDateMismatch = (item1: NormalizedRecord, item2: NormalizedRecord): any => {
  // Check normal date mismatch
  if (item1.date && item2.date) {
    const date1 = dayjs(item1.date);
    const date2 = dayjs(item2.date);
    
    if (date1.isValid() && date2.isValid()) {
      const daysDifference = Math.abs(date1.diff(date2, 'day'));
      
      if (daysDifference > 1) {
        return {
          type: 'transaction_date',
          date1: item1.date,
          date2: item2.date,
          daysDifference
        };
      }
    }
  }
  
  // Check due date mismatch
  if (item1.dueDate && item2.dueDate) {
    const dueDate1 = dayjs(item1.dueDate);
    const dueDate2 = dayjs(item2.dueDate);
    
    if (dueDate1.isValid() && dueDate2.isValid()) {
      const daysDifference = Math.abs(dueDate1.diff(dueDate2, 'day'));
      
      if (daysDifference > 1) {
        return {
          type: 'due_date',
          date1: item1.dueDate,
          date2: item2.dueDate,
          daysDifference
        };
      }
    }
  }
  
  return null;
};

/**
 * Check for commonly variable field names and standardize them
 */
const checkAndNormalizeFieldNames = (data: TransactionRecord[]): void => {
  if (!data || data.length === 0) return;
  
  const record = data[0];
  
  // Check for transaction number field variations
  if (!record.transaction_number && record.transactionNumber) {
    data.forEach(item => {
      item.transaction_number = item.transactionNumber;
    });
  } else if (!record.transaction_number && record.id) {
    data.forEach(item => {
      item.transaction_number = item.id;
    });
  } else if (!record.transaction_number && record.invoice_number) {
    data.forEach(item => {
      item.transaction_number = item.invoice_number;
    });
  }
  
  // Check for date field variations
  if (!record.issue_date && record.date) {
    data.forEach(item => {
      item.issue_date = item.date;
    });
  } else if (!record.issue_date && record.invoiceDate) {
    data.forEach(item => {
      item.issue_date = item.invoiceDate;
    });
  }
  
  // Check for due date variations
  if (!record.due_date && record.dueDate) {
    data.forEach(item => {
      item.due_date = item.dueDate;
    });
  }
  
  // Check for transaction type variations
  if (!record.transaction_type && record.type) {
    data.forEach(item => {
      item.transaction_type = item.type;
    });
  }
};

/**
 * Find matches for AP items in historical AR data
 */
const findHistoricalMatches = (apItem: NormalizedRecord, historicalData: NormalizedRecord[]): NormalizedRecord[] => {
  return historicalData.filter(histItem => {
    // Match transaction number
    if (apItem.transactionNumber && histItem.transactionNumber && 
        apItem.transactionNumber === histItem.transactionNumber) {
      return true;
    }
    
    // Match reference
    if (apItem.reference && histItem.reference && 
        apItem.reference === histItem.reference) {
      return true;
    }
    
    return false;
  });
};

/**
 * Determine insight about historical match
 */
const determineHistoricalInsight = (apItem: NormalizedRecord, historicalItem: NormalizedRecord) => {
  const insight = {
    type: '',
    message: '',
    severity: 'info' as 'info' | 'warning' | 'error'
  };
  
  if (historicalItem.is_paid) {
    insight.type = 'already_paid';
    insight.message = `Invoice ${apItem.transactionNumber} appears to have been paid on ${dayjs(historicalItem.payment_date).format('DD/MM/YYYY')}`;
    insight.severity = 'warning';
  } else if (historicalItem.is_partially_paid) {
    insight.type = 'partially_paid';
    insight.message = `Invoice ${apItem.transactionNumber} is partially paid in AR system. Original amount: ${formatCurrency(historicalItem.original_amount)}, Paid: ${formatCurrency(historicalItem.amount_paid)}, Outstanding: ${formatCurrency(historicalItem.amount)}`;
    insight.severity = 'warning';
  } else if (historicalItem.is_voided) {
    insight.type = 'voided';
    insight.message = `Invoice ${apItem.transactionNumber} was voided in the AR system`;
    insight.severity = 'error';
  } else if (historicalItem.status === 'DRAFT') {
    insight.type = 'draft';
    insight.message = `Invoice ${apItem.transactionNumber} exists as a draft in the AR system`;
    insight.severity = 'info';
  } else {
    insight.type = 'found_in_history';
    insight.message = `Invoice ${apItem.transactionNumber} found in AR history with status: ${historicalItem.status}`;
    insight.severity = 'info';
  }
  
  return insight;
};

// Helper function for currency formatting
const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  const numericAmount = parseFloat(amount.toString());
  if (isNaN(numericAmount)) return 'N/A';
  return numericAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
};

// Safely convert a value to number
const parseAmount = (value: any): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    const cleanValue = value.replace(/[^\d.-]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }
  
  return 0;
};

const normalizeData = (data: TransactionRecord[], dateFormat: string): NormalizedRecord[] => {
  return data.map(record => {
    const transactionNumber = record.transaction_number || record.transactionNumber || record.invoice_number || '';
    const type = record.transaction_type || record.type || '';
    const amount = record.amount;
    const issueDate = record.issue_date || record.date;
    const dueDate = record.due_date || record.dueDate;
    
    if (transactionNumber) {
      console.log(`Normalizing record ${transactionNumber}, amount: ${amount}, date: ${issueDate}`);
    }
    
    const normalized: NormalizedRecord = {
      transactionNumber: transactionNumber?.toString().trim(),
      type: type?.toString().trim(),
      amount: parseAmount(amount),
      date: parseDate(issueDate, dateFormat),
      dueDate: parseDate(dueDate, dateFormat),
      status: record.status?.toString().trim() || '',
      reference: record.reference?.toString().trim() || '',
      payment_date: record.payment_date ? parseDate(record.payment_date, dateFormat) : null,
      is_paid: record.is_paid || record.status === 'PAID',
      is_voided: record.is_voided || record.status === 'VOIDED',
      is_partially_paid: record.is_partially_paid || false,
      original_amount: parseAmount(record.original_amount || record.amount),
      amount_paid: parseAmount(record.amount_paid || 0)
    };
    
    return normalized;
  });
};

const parseDate = (dateString: any, format: string): string | null => {
  if (!dateString) return null;
  
  // If already a standard ISO date string, return it directly
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateString;
  }
  
  // Try to parse using the specified format
  let parsed = dayjs(dateString, format);
  
  // If that fails, try the default parsing
  if (!parsed.isValid()) {
    parsed = dayjs(dateString);
  }
  
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
};

const calculateTotal = (data: NormalizedRecord[]): number => {
  return data.reduce((sum, record) => {
    const amount = record.amount || 0;
    return sum + amount;
  }, 0);
};

const calculateVariance = (total1: number, total2: number): number => {
  return Math.abs(total1 - Math.abs(total2));
};

const findPotentialMatches = (item1: NormalizedRecord, company2Data: NormalizedRecord[]): NormalizedRecord[] => {
  return company2Data.filter(item2 => {
    // Basic case: exact transaction number match
    if (item1.transactionNumber && item2.transactionNumber && 
        item1.transactionNumber === item2.transactionNumber) {
      return true;
    }
    
    // Alternative: reference match if both have references
    if (item1.reference && item2.reference && 
        item1.reference === item2.reference) {
      return true;
    }
    
    return false;
  });
};

const isExactMatch = (item1: NormalizedRecord, item2: NormalizedRecord): boolean => {
  // We must have transaction numbers or references that match
  const idMatch = (item1.transactionNumber && item2.transactionNumber && 
                  item1.transactionNumber === item2.transactionNumber) ||
                 (item1.reference && item2.reference && 
                  item1.reference === item2.reference);
  
  if (!idMatch) return false;
  
  // Check if the amounts are close (with some small tolerance for rounding)
  const amount1 = item1.amount || 0;
  const amount2 = item2.amount || 0;
  const amountsMatch = Math.abs(Math.abs(amount1) - Math.abs(amount2)) < 0.01;
  
  // If item is partially paid, it's not an exact match
  if (item1.is_partially_paid || item2.is_partially_paid) {
    console.log('Item is partially paid, not an exact match');
    return false;
  }
  
  return idMatch && amountsMatch;
};

const findBestMatch = (item1: NormalizedRecord, potentialMatches: NormalizedRecord[]): NormalizedRecord | null => {
  return potentialMatches.reduce<NormalizedRecord | null>((best, current) => {
    if (!best) return current;

    const currentMatchScore = calculateMatchScore(item1, current);
    const bestMatchScore = calculateMatchScore(item1, best);

    return currentMatchScore > bestMatchScore ? current : best;
  }, null);
};

const calculateMatchScore = (item1: NormalizedRecord, item2: NormalizedRecord): number => {
  let score = 0;

  // Amount match (accounting for sign with tolerance)
  const amount1 = Math.abs(item1.amount || 0);
  const amount2 = Math.abs(item2.amount || 0);
  if (Math.abs(amount1 - amount2) < 0.01) score += 3;

  // Transaction number match
  if (item1.transactionNumber && item2.transactionNumber && 
      item1.transactionNumber === item2.transactionNumber) score += 2;

  // Reference match
  if (item1.reference && item2.reference && 
      item1.reference === item2.reference) score += 2;

  // Date proximity (if dates are valid)
  if (item1.date && item2.date) {
    const date1 = dayjs(item1.date);
    const date2 = dayjs(item2.date);
    const daysDiff = Math.abs(date1.diff(date2, 'day'));
    if (daysDiff === 0) score += 1;
    else if (daysDiff <= 5) score += 0.5;
  }

  return score;
};

const removeFromUnmatched = (unmatchedItems: any, item1: NormalizedRecord, item2: NormalizedRecord): void => {
  // Use a more reliable way to identify items for removal
  unmatchedItems.company1 = unmatchedItems.company1.filter((item: NormalizedRecord) => {
    if (item1.transactionNumber && item.transactionNumber) {
      return item.transactionNumber !== item1.transactionNumber;
    }
    return JSON.stringify(item) !== JSON.stringify(item1);
  });
  
  unmatchedItems.company2 = unmatchedItems.company2.filter((item: NormalizedRecord) => {
    if (item2.transactionNumber && item.transactionNumber) {
      return item.transactionNumber !== item2.transactionNumber;
    }
    return JSON.stringify(item) !== JSON.stringify(item2);
  });
};
