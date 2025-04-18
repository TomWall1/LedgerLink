import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

/**
 * Match records between two datasets based on various criteria
 * @param {Array} company1Data - First company's transaction data
 * @param {Array} company2Data - Second company's transaction data
 * @param {string} dateFormat1 - Date format for first company's data
 * @param {string} dateFormat2 - Date format for second company's data
 * @param {Array} historicalData - Optional historical AR data to check paid status
 * @returns {Object} Matching results containing perfect matches, mismatches, unmatched items, and historical insights
 */
export const matchRecords = async (company1Data, company2Data, dateFormat1 = 'DD/MM/YYYY', dateFormat2 = 'DD/MM/YYYY', historicalData = []) => {
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

    // Log some sample data for debugging
    console.log('Company1 sample data:', company1Data.slice(0, 2));
    console.log('Company2 sample data:', company2Data.slice(0, 2));
    if (historicalData.length > 0) {
      console.log('Historical sample data:', historicalData.slice(0, 2));
    }

    // Normalize data
    const normalizedCompany1 = normalizeData(company1Data, dateFormat1);
    const normalizedCompany2 = normalizeData(company2Data, dateFormat2);
    
    // Normalize historical data if provided
    const normalizedHistorical = historicalData.length > 0 ? 
      normalizeData(historicalData, dateFormat1) : [];

    // Log normalized data for debugging
    console.log('Normalized Company1 sample:', normalizedCompany1.slice(0, 2));
    console.log('Normalized Company2 sample:', normalizedCompany2.slice(0, 2));

    const perfectMatches = [];
    const mismatches = [];
    const unmatchedItems = {
      company1: [...normalizedCompany1],
      company2: [...normalizedCompany2]
    };
    
    // Array to track historical insights for unmatched AP items
    const historicalInsights = [];
    
    // Array to track date mismatches in otherwise perfect matches
    const dateMismatches = [];

    // Calculate totals - only consider open items for company1 (AR)
    const openCompany1Items = normalizedCompany1.filter(item => 
      !item.is_paid && item.status !== 'PAID' && item.status !== 'VOIDED'
    );
    const company1Total = calculateTotal(openCompany1Items);
    const company2Total = calculateTotal(normalizedCompany2);

    console.log('Company totals:', { company1Total, company2Total });

    // Find matches
    for (const item1 of normalizedCompany1) {
      const potentialMatches = findPotentialMatches(item1, normalizedCompany2);
      console.log(`Found ${potentialMatches.length} potential matches for transaction: ${item1.transactionNumber}`);

      if (potentialMatches.length === 1) {
        const match = potentialMatches[0];
        
        // Check for status mismatches (e.g., Paid in one system but Open in another)
        const statusMismatch = hasStatusMismatch(item1, match);
        
        if (isExactMatch(item1, match) && !statusMismatch) {
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
        mismatches.push({ company1: item1, company2: bestMatch });
        removeFromUnmatched(unmatchedItems, item1, bestMatch);
      }
      // If no matches found, item1 remains in unmatchedItems.company1
    }
    
    // Ensure company2 items are properly tracked as unmatched
    console.log(`Unmatched company2 items before check: ${unmatchedItems.company2.length}`);
    
    // After regular matching, check for historical insights for unmatched AP items
    if (normalizedHistorical.length > 0) {
      for (const apItem of unmatchedItems.company2) {
        // Look for matching transaction numbers or references in historical data
        const historicalMatches = findHistoricalMatches(apItem, normalizedHistorical);
        
        if (historicalMatches.length > 0) {
          // Sort matches by relevance (paid status prioritized, then by date)
          const sortedMatches = historicalMatches.sort((a, b) => {
            // Prioritize paid items
            if (a.is_paid && !b.is_paid) return -1;
            if (!a.is_paid && b.is_paid) return 1;
            
            // Then sort by date (most recent first)
            if (a.date && b.date) {
              return dayjs(b.date).diff(dayjs(a.date));
            }
            return 0;
          });
          
          // Take the best historical match
          const bestHistoricalMatch = sortedMatches[0];
          
          const insight = determineHistoricalInsight(apItem, bestHistoricalMatch);
          console.log(`Historical insight generated for ${apItem.transactionNumber}: ${insight.message}`);
          
          historicalInsights.push({
            apItem: apItem,
            historicalMatch: bestHistoricalMatch,
            insight: insight
          });
        }
      }
    }
    
    // Log final unmatched counts
    console.log(`Final unmatched counts - Company1: ${unmatchedItems.company1.length}, Company2: ${unmatchedItems.company2.length}`);

    // Calculate variance - the absolute difference between totals
    const variance = calculateVariance(company1Total, company2Total);

    // Print final counts for debugging
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
  } catch (error) {
    console.error('Error in matchRecords:', error);
    throw new Error(`Matching error: ${error.message}`);
  }
};

/**
 * Check if two items have mismatched statuses
 * @param {Object} item1 - Item from first company (AR)
 * @param {Object} item2 - Item from second company (AP)
 * @returns {boolean} True if there is a status mismatch
 */
const hasStatusMismatch = (item1, item2) => {
  // Check for paid status mismatch
  if ((item1.is_paid || item1.status === 'PAID') && (!item2.is_paid && item2.status !== 'PAID')) {
    console.log(`Status mismatch: ${item1.transactionNumber} is paid in AR but not in AP`);
    return true;
  }
  
  if ((!item1.is_paid && item1.status !== 'PAID') && (item2.is_paid || item2.status === 'PAID')) {
    console.log(`Status mismatch: ${item1.transactionNumber} is not paid in AR but paid in AP`);
    return true;
  }
  
  // Check for voided status mismatch
  if ((item1.is_voided || item1.status === 'VOIDED') && (!item2.is_voided && item2.status !== 'VOIDED')) {
    console.log(`Status mismatch: ${item1.transactionNumber} is voided in AR but not in AP`);
    return true;
  }
  
  if ((!item1.is_voided && item1.status !== 'VOIDED') && (item2.is_voided || item2.status === 'VOIDED')) {
    console.log(`Status mismatch: ${item1.transactionNumber} is not voided in AR but voided in AP`);
    return true;
  }
  
  return false;
};

/**
 * Find date mismatches between two otherwise matching items
 * @param {Object} item1 - Item from first company
 * @param {Object} item2 - Item from second company
 * @returns {Object|null} Date mismatch details or null if dates match
 */
const findDateMismatch = (item1, item2) => {
  // Check transaction date mismatch
  if (item1.date && item2.date) {
    const date1 = dayjs(item1.date);
    const date2 = dayjs(item2.date);
    
    if (date1.isValid() && date2.isValid()) {
      const daysDifference = Math.abs(date1.diff(date2, 'day'));
      
      // If dates differ by more than 1 day, it's a mismatch
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
      
      // If due dates differ by more than 1 day, it's a mismatch
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
  
  return null; // No date mismatches found
};

/**
 * Check for commonly variable field names and standardize them
 * @param {Array} data - Array of data records to normalize fields for
 */
const checkAndNormalizeFieldNames = (data) => {
  if (!data || data.length === 0) return;
  
  // Sample record to check field names
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
 * @param {Object} apItem - AP item to find matches for
 * @param {Array} historicalData - Historical AR data
 * @returns {Array} Matching historical items
 */
const findHistoricalMatches = (apItem, historicalData) => {
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
 * @param {Object} apItem - AP item 
 * @param {Object} historicalItem - Matching historical AR item
 * @returns {Object} Insight about the historical match
 */
const determineHistoricalInsight = (apItem, historicalItem) => {
  const insight = {
    type: '',
    message: '',
    severity: 'info' // 'info', 'warning', or 'error'
  };
  
  if (historicalItem.is_paid) {
    insight.type = 'already_paid';
    // More specific message with invoice number and date
    insight.message = `Invoice ${apItem.transactionNumber || 'unknown'} appears to have been paid on ${dayjs(historicalItem.payment_date).format('DD/MM/YYYY')}`;
    insight.severity = 'warning';
  } else if (historicalItem.is_partially_paid) {
    insight.type = 'partially_paid';
    // More detailed message showing payment details
    insight.message = `Invoice ${apItem.transactionNumber || 'unknown'} is partially paid in AR system. Original amount: ${formatCurrency(historicalItem.original_amount)}, Paid: ${formatCurrency(historicalItem.amount_paid)}, Outstanding: ${formatCurrency(historicalItem.amount)}`;
    insight.severity = 'warning';
  } else if (historicalItem.is_voided) {
    insight.type = 'voided';
    // Include when it was voided if that information is available
    const voidedDate = historicalItem.void_date ? ` on ${dayjs(historicalItem.void_date).format('DD/MM/YYYY')}` : '';
    insight.message = `Invoice ${apItem.transactionNumber || 'unknown'} was voided in the AR system${voidedDate}`;
    insight.severity = 'error';
  } else if (historicalItem.status === 'DRAFT') {
    insight.type = 'draft';
    // Add date information if available
    const draftDate = historicalItem.date ? ` created on ${dayjs(historicalItem.date).format('DD/MM/YYYY')}` : '';
    insight.message = `Invoice ${apItem.transactionNumber || 'unknown'} exists as a draft in the AR system${draftDate}`;
    insight.severity = 'info';
  } else {
    insight.type = 'found_in_history';
    // Include more details about the historical match
    let additionalInfo = historicalItem.date ? ` from ${dayjs(historicalItem.date).format('DD/MM/YYYY')}` : '';
    additionalInfo += historicalItem.amount ? `, amount: ${formatCurrency(historicalItem.amount)}` : '';
    insight.message = `Invoice ${apItem.transactionNumber || 'unknown'} found in AR history with status: ${historicalItem.status}${additionalInfo}`;
    insight.severity = 'info';
  }
  
  return insight;
};

// Helper function for currency formatting in messages
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return 'N/A';
  return numericAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
};

// Safely convert a value to number, handling various formats
const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  // If already a number, return it
  if (typeof value === 'number') {
    return value;
  }
  
  // Convert string to number, handling different formats
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and other non-numeric characters except for decimal point and minus sign
    const cleanValue = value.replace(/[^\d.-]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }
  
  return 0;
};

const normalizeData = (data, dateFormat) => {
  return data.map(record => {
    // Normalize key field names first to ensure we have standard field access
    const transactionNumber = record.transaction_number || record.transactionNumber || record.invoice_number || '';
    const type = record.transaction_type || record.type || '';
    const amount = record.amount;
    const issueDate = record.issue_date || record.date || record.Date;
    const dueDate = record.due_date || record.dueDate || record.DueDate;
    
    // Debug logging to understand the input format
    if (transactionNumber) {
      console.log(`Normalizing record ${transactionNumber}, amount: ${amount}, date: ${issueDate}`);
    }
    
    // Normalize the data
    const normalized = {
      transactionNumber: transactionNumber?.toString().trim(),
      type: type?.toString().trim(),
      amount: parseAmount(amount || record.Total || 0),
      date: parseDate(issueDate, dateFormat),
      dueDate: parseDate(dueDate, dateFormat),
      status: record.status?.toString().trim() || record.Status || '',
      reference: record.reference?.toString().trim() || record.Reference || '',
      // Add historical data fields if they exist
      payment_date: record.payment_date ? parseDate(record.payment_date, dateFormat) : null,
      is_paid: record.is_paid || record.Status === 'PAID',
      is_voided: record.is_voided || record.Status === 'VOIDED',
      // Add part payment fields
      is_partially_paid: record.is_partially_paid || false,
      original_amount: parseAmount(record.original_amount || record.amount || record.Total || 0),
      amount_paid: parseAmount(record.amount_paid || 0),
      // Add void date if available
      void_date: record.void_date ? parseDate(record.void_date, dateFormat) : null
    };
    
    return normalized;
  });
};

const parseDate = (dateString, format) => {
  if (!dateString) return null;
  
  console.log(`Parsing date: ${dateString} with format ${format}`);
  
  // Handle dates differently based on format
  if (format === 'DD/MM/YYYY' && typeof dateString === 'string' && dateString.includes('/')) {
    // Use explicit DD/MM/YYYY parsing
    const [day, month, year] = dateString.split('/');
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }
  }
  
  // If already a standard ISO date string, return it directly
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateString;
  }
  
  // Try to parse using the specified format 
  let parsed = dayjs(dateString, format);
  console.log(`Date parsed with format: ${format}, valid: ${parsed.isValid()}`);
  
  // If that fails, try the default parsing
  if (!parsed.isValid()) {
    parsed = dayjs(dateString);
    console.log(`Date parsed with default, valid: ${parsed.isValid()}`);
  }
  
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
};

const calculateTotal = (data) => {
  return data.reduce((sum, record) => {
    const amount = record.amount || 0;
    return sum + amount;
  }, 0);
};

const calculateVariance = (total1, total2) => {
  // Calculate the absolute difference between the two totals
  return Math.abs(total1 - Math.abs(total2));
};

const findPotentialMatches = (item1, company2Data) => {
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

const isExactMatch = (item1, item2) => {
  // We must have transaction numbers or references that match
  const idMatch = (item1.transactionNumber && item2.transactionNumber && 
                  item1.transactionNumber === item2.transactionNumber) ||
                 (item1.reference && item2.reference && 
                  item1.reference === item2.reference);
  
  if (!idMatch) return false;
  
  // For financial data, one should be positive (receivable) and one negative (payable)
  // We'll check if they're similar in absolute value but opposite in sign
  const amount1 = item1.amount || 0;
  const amount2 = item2.amount || 0;
  
  // Check if the amounts are close (with some small tolerance for rounding)
  const amountsMatch = Math.abs(Math.abs(amount1) - Math.abs(amount2)) < 0.01;
  
  // If item1 is partially paid, it's not an exact match (should be a mismatch)
  if (item1.is_partially_paid || item2.is_partially_paid) {
    console.log('Item is partially paid, not an exact match');
    return false;
  }
  
  return idMatch && amountsMatch;
};

const findBestMatch = (item1, potentialMatches) => {
  return potentialMatches.reduce((best, current) => {
    if (!best) return current;

    const currentMatchScore = calculateMatchScore(item1, current);
    const bestMatchScore = calculateMatchScore(item1, best);

    return currentMatchScore > bestMatchScore ? current : best;
  }, null);
};

const calculateMatchScore = (item1, item2) => {
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

const removeFromUnmatched = (unmatchedItems, item1, item2) => {
  // Use transaction number as the primary identifier for removing matched items
  if (item1.transactionNumber) {
    unmatchedItems.company1 = unmatchedItems.company1.filter(item => 
      item.transactionNumber !== item1.transactionNumber
    );
  } else {
    // Fallback to JSON comparison if no transaction number
    unmatchedItems.company1 = unmatchedItems.company1.filter(item => 
      JSON.stringify(item) !== JSON.stringify(item1)
    );
  }
  
  if (item2.transactionNumber) {
    unmatchedItems.company2 = unmatchedItems.company2.filter(item => 
      item.transactionNumber !== item2.transactionNumber
    );
  } else {
    // Fallback to JSON comparison if no transaction number
    unmatchedItems.company2 = unmatchedItems.company2.filter(item => 
      JSON.stringify(item) !== JSON.stringify(item2)
    );
  }
};

export default matchRecords;