import Transaction from '../models/Transaction.js';

/**
 * Match transactions between two companies
 * @param {String} companyId1 - First company ID
 * @param {String} companyId2 - Second company ID
 */
export const matchTransactions = async (companyId1, companyId2) => {
  try {
    // Get all unmatched transactions for company 1
    const company1Transactions = await Transaction.find({
      company: companyId1,
      matchStatus: 'UNMATCHED',
    });

    // Get all unmatched transactions for company 2
    const company2Transactions = await Transaction.find({
      company: companyId2,
      matchStatus: 'UNMATCHED',
    });

    console.log(`Matching ${company1Transactions.length} transactions from company ${companyId1} with ${company2Transactions.length} transactions from company ${companyId2}`);

    // No transactions to match
    if (company1Transactions.length === 0 || company2Transactions.length === 0) {
      return {
        matched: 0,
        withDiscrepancies: 0,
      };
    }

    let matchedCount = 0;
    let discrepancyCount = 0;

    // Loop through company 1 transactions and try to match them with company 2
    for (const transaction1 of company1Transactions) {
      // Try exact match on transaction number first
      let matches = company2Transactions.filter(
        (t) => t.transactionNumber === transaction1.transactionNumber
      );

      // If no exact match, try using reference
      if (matches.length === 0 && transaction1.reference) {
        matches = company2Transactions.filter(
          (t) => t.reference && t.reference === transaction1.reference
        );
      }

      if (matches.length > 0) {
        // Use the first match
        const transaction2 = matches[0];
        
        // Check for discrepancies
        const { isMatch, discrepancies } = matchTransactionPair(transaction1, transaction2);
        
        // Update both transactions
        transaction1.counterparty = companyId2;
        transaction1.counterpartyTransactionId = transaction2._id;
        transaction1.matchStatus = isMatch ? 'MATCHED' : 'DISCREPANCY';
        transaction1.discrepancies = discrepancies || [];
        
        transaction2.counterparty = companyId1;
        transaction2.counterpartyTransactionId = transaction1._id;
        transaction2.matchStatus = isMatch ? 'MATCHED' : 'DISCREPANCY';
        transaction2.discrepancies = discrepancies || [];
        
        await transaction1.save();
        await transaction2.save();
        
        if (isMatch) {
          matchedCount++;
        } else {
          discrepancyCount++;
        }
      }
    }
    
    return {
      matched: matchedCount,
      withDiscrepancies: discrepancyCount,
    };
  } catch (error) {
    console.error('Transaction matching error:', error);
    throw error;
  }
};

/**
 * Match a pair of transactions to detect discrepancies
 * @param {Object} transaction1 - First transaction
 * @param {Object} transaction2 - Second transaction
 * @returns {Object} - Matching result with isMatch flag and discrepancies array
 */
export const matchTransactionPair = (transaction1, transaction2) => {
  const discrepancies = [];
  
  // Check amount (allowing for sign inversion between AR and AP)
  const amount1 = transaction1.amount;
  const amount2 = -transaction2.amount; // Invert for matching
  
  if (Math.abs(amount1 - amount2) > 0.01) {
    discrepancies.push({
      field: 'amount',
      company1Value: amount1,
      company2Value: -amount2, // Show original value
    });
  }
  
  // Check dates
  if (transaction1.issueDate && transaction2.issueDate) {
    const date1 = new Date(transaction1.issueDate).toISOString().split('T')[0];
    const date2 = new Date(transaction2.issueDate).toISOString().split('T')[0];
    
    if (date1 !== date2) {
      discrepancies.push({
        field: 'issueDate',
        company1Value: date1,
        company2Value: date2,
      });
    }
  }
  
  // Check due dates if both exist
  if (transaction1.dueDate && transaction2.dueDate) {
    const dueDate1 = new Date(transaction1.dueDate).toISOString().split('T')[0];
    const dueDate2 = new Date(transaction2.dueDate).toISOString().split('T')[0];
    
    if (dueDate1 !== dueDate2) {
      discrepancies.push({
        field: 'dueDate',
        company1Value: dueDate1,
        company2Value: dueDate2,
      });
    }
  }
  
  return {
    isMatch: discrepancies.length === 0,
    discrepancies: discrepancies.length > 0 ? discrepancies : null,
  };
};

/**
 * Initiate matching for a single transaction with potential counterparts
 * @param {String} transactionId - ID of the transaction to match
 * @returns {Object} - Matching results
 */
export const matchSingleTransaction = async (transactionId) => {
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.matchStatus !== 'UNMATCHED') {
      return { success: false, message: 'Transaction not available for matching' };
    }
    
    // Get all companies linked to this company
    const linkedCompanyIds = await getLinkedCompanyIds(transaction.company);
    if (linkedCompanyIds.length === 0) {
      return { success: false, message: 'No linked companies to match with' };
    }
    
    let bestMatch = null;
    let bestMatchScore = 0;
    
    // Look for potential matches in linked companies
    for (const linkedCompanyId of linkedCompanyIds) {
      const potentialMatches = await Transaction.find({
        company: linkedCompanyId,
        matchStatus: 'UNMATCHED',
        $or: [
          { transactionNumber: transaction.transactionNumber },
          { reference: transaction.reference }
        ]
      });
      
      for (const potentialMatch of potentialMatches) {
        const matchResult = matchTransactionPair(transaction, potentialMatch);
        const matchScore = calculateMatchScore(transaction, potentialMatch);
        
        if (matchScore > bestMatchScore) {
          bestMatch = {
            transaction: potentialMatch,
            matchResult,
            score: matchScore
          };
          bestMatchScore = matchScore;
        }
      }
    }
    
    if (bestMatch && bestMatchScore > 0.7) {
      // Update both transactions
      transaction.counterparty = bestMatch.transaction.company;
      transaction.counterpartyTransactionId = bestMatch.transaction._id;
      transaction.matchStatus = bestMatch.matchResult.isMatch ? 'MATCHED' : 'DISCREPANCY';
      transaction.discrepancies = bestMatch.matchResult.discrepancies || [];
      
      bestMatch.transaction.counterparty = transaction.company;
      bestMatch.transaction.counterpartyTransactionId = transaction._id;
      bestMatch.transaction.matchStatus = bestMatch.matchResult.isMatch ? 'MATCHED' : 'DISCREPANCY';
      bestMatch.transaction.discrepancies = bestMatch.matchResult.discrepancies || [];
      
      await transaction.save();
      await bestMatch.transaction.save();
      
      return {
        success: true,
        matched: bestMatch.matchResult.isMatch,
        withDiscrepancies: !bestMatch.matchResult.isMatch,
        matchDetails: bestMatch
      };
    }
    
    return { success: false, message: 'No suitable match found' };
  } catch (error) {
    console.error('Match single transaction error:', error);
    throw error;
  }
};

/**
 * Calculate a match score between two transactions
 * @param {Object} transaction1 - First transaction
 * @param {Object} transaction2 - Second transaction
 * @returns {Number} - Score between 0 and 1
 */
function calculateMatchScore(transaction1, transaction2) {
  let score = 0;
  let totalFactors = 0;
  
  // Exact transaction number match is a strong indicator
  if (transaction1.transactionNumber === transaction2.transactionNumber) {
    score += 0.5;
  }
  totalFactors += 0.5;
  
  // Reference match
  if (transaction1.reference && transaction2.reference && 
      transaction1.reference === transaction2.reference) {
    score += 0.3;
  }
  totalFactors += 0.3;
  
  // Amount match (considering sign inversion)
  const amount1 = transaction1.amount;
  const amount2 = -transaction2.amount;
  if (Math.abs(amount1 - amount2) < 0.01) {
    score += 0.2;
  }
  totalFactors += 0.2;
  
  return score / totalFactors;
}

/**
 * Get IDs of all companies linked to a given company
 * @param {String} companyId - Company ID
 * @returns {Array} - Array of linked company IDs
 */
async function getLinkedCompanyIds(companyId) {
  try {
    const CompanyLink = await import('../models/CompanyLink.js').then(module => module.default);
    
    const links = await CompanyLink.find({
      $or: [
        { requestingCompany: companyId },
        { targetCompany: companyId }
      ],
      status: 'approved'
    });
    
    const linkedCompanyIds = links.map(link => {
      return link.requestingCompany.toString() === companyId.toString() 
        ? link.targetCompany 
        : link.requestingCompany;
    });
    
    return linkedCompanyIds;
  } catch (error) {
    console.error('Get linked company IDs error:', error);
    return [];
  }
}
