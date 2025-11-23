import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

/**
 * Detect if an item is a credit note
 * Credit notes have types like ACCRECCREDIT or ACCPAYCREDIT, or are negative amounts
 * @param {Object} item - Transaction item to check
 * @returns {boolean} - True if item is a credit note
 */
const isCreditNote = (item) => {
  // Check by transaction type - Xero uses ACCRECCREDIT and ACCPAYCREDIT
  if (item.type && (
    item.type.toUpperCase().includes('CREDIT') || 
    item.type.toUpperCase() === 'ACCRECCREDIT' ||
    item.type.toUpperCase() === 'ACCPAYCREDIT'
  )) {
    return true;
  }
  
  // Also check if amount is negative (credit notes reduce balances)
  if (item.amount && item.amount < 0) {
    return true;
  }
  
  return false;
};

/**
 * Match records between two datasets based on various criteria
 * @param {Array} company1Data - First company's transaction data
 * @param {Array} company2Data - Second company's transaction data
 * @param {string} dateFormat1 - Date format for first company's data
 * @param {string} dateFormat2 - Date format for second company's data
 * @param {Array} historicalData - Optional historical AR data to check paid status
 * @returns {Object} Matching results containing perfect matches, mismatches, unmatched items, and historical insights
 */
const matchRecords = async (company1Data, company2Data, dateFormat1 = 'DD/MM/YYYY', dateFormat2 = 'DD/MM/YYYY', historicalData = []) => {
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
    
    // Count credit notes for logging
    const company1CreditNotes = normalizedCompany1.filter(isCreditNote).length;
    const company2CreditNotes = normalizedCompany2.filter(isCreditNote).length;
    console.log(`📋 Credit notes detected - Company1: ${company1CreditNotes}, Company2: ${company2CreditNotes}`);

    const perfectMatches = [];
    const mismatches = [];
    const unmatchedItems = {
      company1: [...normalizedCompany1],
      company2: [...normalizedCompany2]
    };
    
    // New array to track historical insights for unmatched AP items
    const historicalInsights = [];
    
    // NEW: Array to track date mismatches in otherwise perfect matches
    const dateMismatches = [];

    // Calculate totals
    const company1Total = calculateTotal(normalizedCompany1);
    const company2Total = calculateTotal(normalizedCompany2);

    console.log('Company totals:', { company1Total, company2Total });

    // Find matches
    for (const item1 of normalizedCompany1) {
      const potentialMatches = findPotentialMatches(item1, normalizedCompany2);
      
      if (potentialMatches.length === 1) {
        const match = potentialMatches[0];
        if (isExactMatch(item1, match)) {
          perfectMatches.push({ company1: item1, company2: match });
          
          // Log credit note matches for debugging
          if (isCreditNote(item1) || isCreditNote(match)) {
            console.log(`✅ Matched credit note: ${item1.transactionNumber || item1.reference} ↔ ${match.transactionNumber || match.reference}`);
          }
          
          // NEW: Check for date mismatches in perfect matches
          const dateMismatch = findDateMismatch(item1, match);
          if (dateMismatch) {
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
          mismatches.push({ company1: item1, company2: match });
          removeFromUnmatched(unmatchedItems, item1, match);
        }
      } else if (potentialMatches.length > 1) {
        // FIX: When multiple potential matches exist, check if one is a PERFECT match
        // before automatically classifying as mismatch
        
        // First, try to find an exact transaction number match with matching amount
        const perfectMatch = findPerfectMatchAmongCandidates(item1, potentialMatches);
        
        if (perfectMatch) {
          // Found a perfect match among the candidates
          perfectMatches.push({ company1: item1, company2: perfectMatch });
          
          // Log credit note matches for debugging
          if (isCreditNote(item1) || isCreditNote(perfectMatch)) {
            console.log(`✅ Matched credit note (from multiple candidates): ${item1.transactionNumber || item1.reference} ↔ ${perfectMatch.transactionNumber || perfectMatch.reference}`);
          }
          
          // Check for date mismatches in perfect matches
          const dateMismatch = findDateMismatch(item1, perfectMatch);
          if (dateMismatch) {
            dateMismatches.push({
              company1: item1,
              company2: perfectMatch,
              mismatchType: dateMismatch.type,
              company1Date: dateMismatch.date1,
              company2Date: dateMismatch.date2,
              daysDifference: dateMismatch.daysDifference
            });
          }
          
          removeFromUnmatched(unmatchedItems, item1, perfectMatch);
        } else {
          // No perfect match found, use best match as a mismatch
          const bestMatch = findBestMatch(item1, potentialMatches);
          mismatches.push({ company1: item1, company2: bestMatch });
          removeFromUnmatched(unmatchedItems, item1, bestMatch);
        }
      }
      // If no matches found, item1 remains in unmatchedItems.company1
    }
    
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
          
          historicalInsights.push({
            apItem: apItem,
            historicalMatch: bestHistoricalMatch,
            insight: determineHistoricalInsight(apItem, bestHistoricalMatch)
          });
        }
      }
    }

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
      dateMismatches, // NEW: Include date mismatches in the results
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
 * Find a perfect match among multiple candidates
 * Prioritizes exact transaction number matches over reference-only matches
 * SPECIAL HANDLING: For credit notes, reference matching is given equal priority
 * @param {Object} item1 - Item from first company
 * @param {Array} candidates - Array of potential matches
 * @returns {Object|null} - Perfect match or null if none found
 */
const findPerfectMatchAmongCandidates = (item1, candidates) => {
  const isItem1CreditNote = isCreditNote(item1);
  
  // First priority: Find exact transaction number match with matching amount
  for (const candidate of candidates) {
    // Check for exact transaction number match
    if (item1.transactionNumber && candidate.transactionNumber && 
        item1.transactionNumber === candidate.transactionNumber) {
      
      // Check if amounts match (within tolerance)
      const amount1 = Math.abs(item1.amount || 0);
      const amount2 = Math.abs(candidate.amount || 0);
      const amountsMatch = Math.abs(amount1 - amount2) < 0.01;
      
      // Check if neither is partially paid
      const notPartiallyPaid = !item1.is_partially_paid && !candidate.is_partially_paid;
      
      if (amountsMatch && notPartiallyPaid) {
        console.log(`✅ Found perfect transaction number match: ${item1.transactionNumber}`);
        return candidate;
      }
    }
  }
  
  // Second priority: For CREDIT NOTES, check for reference match with matching amount
  // This is CRITICAL because Xero credit notes (CN-001) often reference the original invoice (INV-001)
  // and CSV credit notes might use the invoice number as their transaction number
  if (isItem1CreditNote) {
    const creditNoteReferenceMatches = candidates.filter(candidate => {
      // Both must be credit notes for this special matching
      if (!isCreditNote(candidate)) return false;
      
      // Check if reference matches
      if (item1.reference && candidate.reference && 
          item1.reference === candidate.reference) {
        const amount1 = Math.abs(item1.amount || 0);
        const amount2 = Math.abs(candidate.amount || 0);
        return Math.abs(amount1 - amount2) < 0.01;
      }
      
      return false;
    });
    
    // Only return if there's exactly one credit note reference match
    if (creditNoteReferenceMatches.length === 1 && 
        !creditNoteReferenceMatches[0].is_partially_paid && 
        !item1.is_partially_paid) {
      console.log(`✅ Found unique credit note reference match: ${item1.reference} (Credit Note)`);
      return creditNoteReferenceMatches[0];
    }
  }
  
  // Third priority: If no transaction number match, check for reference match with matching amount
  // But only if there's exactly one reference match with matching amount (for non-credit notes)
  if (!isItem1CreditNote) {
    const referenceMatches = candidates.filter(candidate => {
      if (item1.reference && candidate.reference && 
          item1.reference === candidate.reference) {
        const amount1 = Math.abs(item1.amount || 0);
        const amount2 = Math.abs(candidate.amount || 0);
        return Math.abs(amount1 - amount2) < 0.01;
      }
      return false;
    });
    
    // Only return a reference match if there's exactly one
    if (referenceMatches.length === 1 && !referenceMatches[0].is_partially_paid && !item1.is_partially_paid) {
      console.log(`✅ Found unique reference match: ${item1.reference}`);
      return referenceMatches[0];
    }
  }
  
  // No perfect match found
  return null;
};

/**
 * Find date mismatches between two otherwise matching items
 * @param {Object} item1 - Item from first company
 * @param {Object} item2 - Item from second company
 * @returns {Object|null} Date mismatch details or null if dates match
 */
const findDateMismatch = (item1, item2) => {
  // Check normal date mismatch
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
    const issueDate = record.issue_date || record.date;
    const dueDate = record.due_date || record.dueDate;
    
    // Normalize the data
    const normalized = {
      transactionNumber: transactionNumber?.toString().trim(),
      type: type?.toString().trim(),
      amount: parseAmount(amount),
      date: parseDate(issueDate, dateFormat),
      dueDate: parseDate(dueDate, dateFormat),
      status: record.status?.toString().trim(),
      reference: record.reference?.toString().trim(),
      // Add historical data fields if they exist
      payment_date: record.payment_date ? parseDate(record.payment_date, dateFormat) : null,
      is_paid: record.is_paid || record.status === 'PAID',
      is_voided: record.is_voided || record.status === 'VOIDED',
      // Add part payment fields
      is_partially_paid: record.is_partially_paid || false,
      original_amount: parseAmount(record.original_amount || record.amount),
      amount_paid: parseAmount(record.amount_paid || 0)
    };
    
    return normalized;
  });
};

/**
 * Parse date string into standardized format
 * Handles multiple date formats including Xero's .NET JSON date format
 * @param {string} dateString - Date string to parse
 * @param {string} format - Expected date format (e.g., 'DD/MM/YYYY')
 * @returns {string|null} - Standardized date string in YYYY-MM-DD format or null
 */
const parseDate = (dateString, format) => {
  if (!dateString) return null;
  
  // CRITICAL FIX: Handle Xero's .NET JSON date format: /Date(1762646400000+0000)/
  if (typeof dateString === 'string' && dateString.startsWith('/Date(')) {
    try {
      // Extract the timestamp from the format: /Date(1762646400000+0000)/
      const timestampMatch = dateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        // Create date from milliseconds timestamp
        const parsed = dayjs(timestamp);
        if (parsed.isValid()) {
          console.log(`✅ Parsed Xero date ${dateString} as ${parsed.format('YYYY-MM-DD')}`);
          return parsed.format('YYYY-MM-DD');
        }
      }
    } catch (error) {
      console.error(`❌ Error parsing Xero date ${dateString}:`, error);
    }
  }
  
  // If already a standard ISO date string, return it directly
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateString;
  }
  
  // Try to parse using the specified format (which should now be DD/MM/YYYY by default)
  let parsed = dayjs(dateString, format);
  
  // If that fails, try the default parsing
  if (!parsed.isValid()) {
    parsed = dayjs(dateString);
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

/**
 * Find potential matches for an item in company2 data
 * ENHANCED: Prioritizes transaction number matches, but for credit notes also considers reference matches
 * @param {Object} item1 - Item from first company
 * @param {Array} company2Data - Array of items from second company
 * @returns {Array} - Array of potential matches
 */
const findPotentialMatches = (item1, company2Data) => {
  const isItem1CreditNote = isCreditNote(item1);
  
  // First, look for exact transaction number matches
  const transactionNumberMatches = company2Data.filter(item2 => {
    return item1.transactionNumber && item2.transactionNumber && 
           item1.transactionNumber === item2.transactionNumber;
  });
  
  // If we have transaction number matches, return only those
  // This prevents reference-only matches from polluting the results
  if (transactionNumberMatches.length > 0) {
    return transactionNumberMatches;
  }
  
  // ENHANCED FOR CREDIT NOTES: If this is a credit note, also look for reference matches
  // where BOTH items are credit notes
  if (isItem1CreditNote && item1.reference) {
    const creditNoteReferenceMatches = company2Data.filter(item2 => {
      // Both must be credit notes
      if (!isCreditNote(item2)) return false;
      
      // Check if references match
      return item2.reference && item1.reference === item2.reference;
    });
    
    if (creditNoteReferenceMatches.length > 0) {
      console.log(`🔍 Found ${creditNoteReferenceMatches.length} credit note reference matches for ${item1.reference}`);
      return creditNoteReferenceMatches;
    }
  }
  
  // If no transaction number matches and not a credit note with reference matches,
  // fall back to standard reference matches
  const referenceMatches = company2Data.filter(item2 => {
    return item1.reference && item2.reference && 
           item1.reference === item2.reference;
  });
  
  return referenceMatches;
};

/**
 * Check if two items are an exact match
 * ENHANCED: For credit notes, allows matching by reference alone if both are credit notes
 * @param {Object} item1 - Item from first company
 * @param {Object} item2 - Item from second company
 * @returns {boolean} - True if items match exactly
 */
const isExactMatch = (item1, item2) => {
  const isItem1CreditNote = isCreditNote(item1);
  const isItem2CreditNote = isCreditNote(item2);
  
  // ENHANCED: For credit notes, allow reference-only matching if both are credit notes
  // This handles the case where Xero credit note CN-001 references invoice INV-001
  // and CSV credit note uses INV-001 as its transaction number but also has INV-001 as reference
  let idMatch = false;
  
  if (isItem1CreditNote && isItem2CreditNote) {
    // For credit notes, reference matching is acceptable
    idMatch = (item1.transactionNumber && item2.transactionNumber && 
               item1.transactionNumber === item2.transactionNumber) ||
              (item1.reference && item2.reference && 
               item1.reference === item2.reference);
  } else {
    // For regular invoices, require transaction number or reference match
    idMatch = (item1.transactionNumber && item2.transactionNumber && 
               item1.transactionNumber === item2.transactionNumber) ||
              (item1.reference && item2.reference && 
               item1.reference === item2.reference);
  }
  
  if (!idMatch) return false;
  
  // For financial data, one should be positive (receivable) and one negative (payable)
  // We'll check if they're similar in absolute value but opposite in sign
  const amount1 = item1.amount || 0;
  const amount2 = item2.amount || 0;
  
  // Check if the amounts are close (with some small tolerance for rounding)
  const amountsMatch = Math.abs(Math.abs(amount1) - Math.abs(amount2)) < 0.01;
  
  // If item1 is partially paid, it's not an exact match (should be a mismatch)
  if (item1.is_partially_paid || item2.is_partially_paid) {
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

  // Transaction number match - highest priority
  if (item1.transactionNumber && item2.transactionNumber && 
      item1.transactionNumber === item2.transactionNumber) score += 5;

  // Reference match - ENHANCED: Higher priority for credit notes
  const isItem1CreditNote = isCreditNote(item1);
  const isItem2CreditNote = isCreditNote(item2);
  
  if (item1.reference && item2.reference && 
      item1.reference === item2.reference) {
    // Give higher score if both are credit notes
    if (isItem1CreditNote && isItem2CreditNote) {
      score += 4; // Almost as high as transaction number match for credit notes
    } else {
      score += 2; // Standard reference match score
    }
  }

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
  // Use a more reliable way to identify items for removal
  unmatchedItems.company1 = unmatchedItems.company1.filter(item => {
    // If we have transaction numbers, use them for comparison
    if (item1.transactionNumber && item.transactionNumber) {
      return item.transactionNumber !== item1.transactionNumber;
    }
    // Otherwise check all properties to find a match
    return JSON.stringify(item) !== JSON.stringify(item1);
  });
  
  unmatchedItems.company2 = unmatchedItems.company2.filter(item => {
    // If we have transaction numbers, use them for comparison
    if (item2.transactionNumber && item.transactionNumber) {
      return item.transactionNumber !== item2.transactionNumber;
    }
    // Otherwise check all properties to find a match
    return JSON.stringify(item) !== JSON.stringify(item2);
  });
};

// Export the main function and helper functions for testing
export {
  matchRecords,
  normalizeData,
  parseDate,
  calculateTotal,
  calculateVariance,
  findPotentialMatches,
  isExactMatch,
  findBestMatch,
  calculateMatchScore,
  formatCurrency,
  findPerfectMatchAmongCandidates,
  isCreditNote
};
