// backend/services/invoiceMatchingEngine.js
// Engine to match invoices between Coupa and NetSuite

class InvoiceMatchingEngine {
  constructor(options = {}) {
    // Matching tolerances (can be configured per company)
    this.amountTolerance = options.amountTolerance || 0.01; // $0.01 tolerance
    this.dateTolerance = options.dateTolerance || 3; // 3 days tolerance
    this.fuzzyThreshold = options.fuzzyThreshold || 0.8; // 80% similarity threshold
  }

  /**
   * Compare Coupa invoices against NetSuite AR ledger
   * @param {Array} coupaInvoices - Invoices from Coupa
   * @param {Array} netsuiteInvoices - Invoices from NetSuite AR ledger
   * @returns {Object} Matching results with categorized invoices
   */
  compareInvoices(coupaInvoices, netsuiteInvoices) {
    console.log(`Starting comparison: ${coupaInvoices.length} Coupa invoices vs ${netsuiteInvoices.length} NetSuite invoices`);
    
    const results = {
      timestamp: new Date(),
      summary: {
        totalCoupa: coupaInvoices.length,
        totalNetSuite: netsuiteInvoices.length,
        matched: 0,
        approvedInCoupa: 0,
        pendingApproval: 0,
        notInCoupa: 0,
        inCoupaNotNetSuite: 0,
        disputed: 0
      },
      matches: [],
      categories: {
        approvedInCoupa: [], // Matched invoices that are approved in Coupa
        pendingApproval: [],  // Matched invoices pending approval in Coupa
        notInCoupa: [],      // NetSuite invoices not found in Coupa
        inCoupaNotNetSuite: [], // Coupa invoices not found in NetSuite
        disputed: []         // Conflicting data between systems
      },
      unmatchedCoupa: [],
      unmatchedNetSuite: []
    };

    // Create lookup maps for faster matching
    const coupaLookup = this.createLookupMaps(coupaInvoices);
    const netsuiteLookup = this.createLookupMaps(netsuiteInvoices);
    
    const processedNetSuite = new Set();
    const processedCoupa = new Set();

    // Phase 1: Exact matches by invoice number
    console.log('Phase 1: Matching by invoice number...');
    for (const coupaInvoice of coupaInvoices) {
      if (coupaInvoice.invoiceNumber) {
        const matches = this.findByInvoiceNumber(coupaInvoice.invoiceNumber, netsuiteInvoices);
        
        for (const netsuiteInvoice of matches) {
          if (!processedNetSuite.has(netsuiteInvoice.id)) {
            const match = this.createMatch(coupaInvoice, netsuiteInvoice, 'INVOICE_NUMBER', 1.0);
            this.categorizeMatch(match, results);
            processedCoupa.add(coupaInvoice.coupaId);
            processedNetSuite.add(netsuiteInvoice.id);
            break; // Take first match only
          }
        }
      }
    }

    // Phase 2: Match by PO number
    console.log('Phase 2: Matching by PO number...');
    const unprocessedCoupa = coupaInvoices.filter(inv => !processedCoupa.has(inv.coupaId));
    const unprocessedNetSuite = netsuiteInvoices.filter(inv => !processedNetSuite.has(inv.id));

    for (const coupaInvoice of unprocessedCoupa) {
      if (coupaInvoice.poNumber) {
        const matches = this.findByPONumber(coupaInvoice.poNumber, unprocessedNetSuite);
        
        for (const netsuiteInvoice of matches) {
          if (!processedNetSuite.has(netsuiteInvoice.id)) {
            const match = this.createMatch(coupaInvoice, netsuiteInvoice, 'PO_NUMBER', 0.9);
            this.categorizeMatch(match, results);
            processedCoupa.add(coupaInvoice.coupaId);
            processedNetSuite.add(netsuiteInvoice.id);
            break;
          }
        }
      }
    }

    // Phase 3: Fuzzy matching by supplier + date + amount
    console.log('Phase 3: Fuzzy matching by supplier, date, and amount...');
    const stillUnprocessedCoupa = coupaInvoices.filter(inv => !processedCoupa.has(inv.coupaId));
    const stillUnprocessedNetSuite = netsuiteInvoices.filter(inv => !processedNetSuite.has(inv.id));

    for (const coupaInvoice of stillUnprocessedCoupa) {
      const bestMatch = this.findBestFuzzyMatch(coupaInvoice, stillUnprocessedNetSuite);
      
      if (bestMatch && !processedNetSuite.has(bestMatch.invoice.id)) {
        const match = this.createMatch(coupaInvoice, bestMatch.invoice, 'FUZZY', bestMatch.confidence);
        this.categorizeMatch(match, results);
        processedCoupa.add(coupaInvoice.coupaId);
        processedNetSuite.add(bestMatch.invoice.id);
      }
    }

    // Phase 4: Categorize remaining unmatched invoices
    console.log('Phase 4: Categorizing unmatched invoices...');
    
    // NetSuite invoices not in Coupa
    const finalUnmatchedNetSuite = netsuiteInvoices.filter(inv => !processedNetSuite.has(inv.id));
    results.categories.notInCoupa = finalUnmatchedNetSuite;
    results.summary.notInCoupa = finalUnmatchedNetSuite.length;

    // Coupa invoices not in NetSuite  
    const finalUnmatchedCoupa = coupaInvoices.filter(inv => !processedCoupa.has(inv.coupaId));
    results.categories.inCoupaNotNetSuite = finalUnmatchedCoupa;
    results.summary.inCoupaNotNetSuite = finalUnmatchedCoupa.length;

    results.unmatchedCoupa = finalUnmatchedCoupa;
    results.unmatchedNetSuite = finalUnmatchedNetSuite;

    console.log('Comparison complete:', results.summary);
    return results;
  }

  /**
   * Create lookup maps for faster searching
   */
  createLookupMaps(invoices) {
    const byInvoiceNumber = {};
    const byPONumber = {};
    
    for (const invoice of invoices) {
      if (invoice.invoiceNumber) {
        const key = invoice.invoiceNumber.toLowerCase().trim();
        if (!byInvoiceNumber[key]) byInvoiceNumber[key] = [];
        byInvoiceNumber[key].push(invoice);
      }
      
      if (invoice.poNumber) {
        const key = invoice.poNumber.toLowerCase().trim();
        if (!byPONumber[key]) byPONumber[key] = [];
        byPONumber[key].push(invoice);
      }
    }
    
    return { byInvoiceNumber, byPONumber };
  }

  /**
   * Find invoices by invoice number
   */
  findByInvoiceNumber(invoiceNumber, invoices) {
    const searchKey = invoiceNumber.toLowerCase().trim();
    return invoices.filter(inv => 
      inv.invoiceNumber && inv.invoiceNumber.toLowerCase().trim() === searchKey
    );
  }

  /**
   * Find invoices by PO number
   */
  findByPONumber(poNumber, invoices) {
    const searchKey = poNumber.toLowerCase().trim();
    return invoices.filter(inv => 
      inv.poNumber && inv.poNumber.toLowerCase().trim() === searchKey
    );
  }

  /**
   * Find best fuzzy match using supplier, date, and amount
   */
  findBestFuzzyMatch(coupaInvoice, netsuiteInvoices) {
    let bestMatch = null;
    let bestConfidence = 0;

    for (const netsuiteInvoice of netsuiteInvoices) {
      const confidence = this.calculateMatchConfidence(coupaInvoice, netsuiteInvoice);
      
      if (confidence > this.fuzzyThreshold && confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = { invoice: netsuiteInvoice, confidence };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match confidence between two invoices
   */
  calculateMatchConfidence(coupaInvoice, netsuiteInvoice) {
    let score = 0;
    let factors = 0;

    // Supplier name similarity (40% weight)
    if (coupaInvoice.supplierName && netsuiteInvoice.supplierName) {
      const supplierSimilarity = this.stringSimilarity(
        coupaInvoice.supplierName.toLowerCase(),
        netsuiteInvoice.supplierName.toLowerCase()
      );
      score += supplierSimilarity * 0.4;
      factors += 0.4;
    }

    // Amount match (35% weight)
    if (coupaInvoice.amount && netsuiteInvoice.amount) {
      const amountDiff = Math.abs(coupaInvoice.amount - netsuiteInvoice.amount);
      const amountScore = amountDiff <= this.amountTolerance ? 1.0 : 
                         Math.max(0, 1 - (amountDiff / Math.max(coupaInvoice.amount, netsuiteInvoice.amount)));
      score += amountScore * 0.35;
      factors += 0.35;
    }

    // Date proximity (25% weight)
    if (coupaInvoice.invoiceDate && netsuiteInvoice.invoiceDate) {
      const dateDiff = Math.abs(
        new Date(coupaInvoice.invoiceDate) - new Date(netsuiteInvoice.invoiceDate)
      ) / (1000 * 60 * 60 * 24); // Convert to days
      
      const dateScore = dateDiff <= this.dateTolerance ? 1.0 : 
                       Math.max(0, 1 - (dateDiff / 30)); // Penalize beyond 30 days
      score += dateScore * 0.25;
      factors += 0.25;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity using Jaccard similarity
   */
  stringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Create a match object
   */
  createMatch(coupaInvoice, netsuiteInvoice, matchType, confidence) {
    return {
      matchId: `${coupaInvoice.coupaId}-${netsuiteInvoice.id}`,
      coupaInvoice,
      netsuiteInvoice,
      matchType,
      confidence,
      matchedAt: new Date(),
      discrepancies: this.findDiscrepancies(coupaInvoice, netsuiteInvoice)
    };
  }

  /**
   * Find discrepancies between matched invoices
   */
  findDiscrepancies(coupaInvoice, netsuiteInvoice) {
    const discrepancies = [];

    // Amount discrepancy
    if (Math.abs(coupaInvoice.amount - netsuiteInvoice.amount) > this.amountTolerance) {
      discrepancies.push({
        field: 'amount',
        coupa: coupaInvoice.amount,
        netsuite: netsuiteInvoice.amount,
        difference: coupaInvoice.amount - netsuiteInvoice.amount
      });
    }

    // Date discrepancy
    const dateDiff = Math.abs(
      new Date(coupaInvoice.invoiceDate) - new Date(netsuiteInvoice.invoiceDate)
    ) / (1000 * 60 * 60 * 24);
    
    if (dateDiff > this.dateTolerance) {
      discrepancies.push({
        field: 'invoiceDate',
        coupa: coupaInvoice.invoiceDate,
        netsuite: netsuiteInvoice.invoiceDate,
        daysDifference: Math.round(dateDiff)
      });
    }

    return discrepancies;
  }

  /**
   * Categorize a match based on Coupa status
   */
  categorizeMatch(match, results) {
    results.matches.push(match);
    results.summary.matched++;

    const coupaStatus = match.coupaInvoice.status;
    const approvalStatus = match.coupaInvoice.approvalStatus;

    if (match.discrepancies.length > 0) {
      results.categories.disputed.push(match);
      results.summary.disputed++;
    } else if (coupaStatus === 'APPROVED' || approvalStatus === 'APPROVED') {
      results.categories.approvedInCoupa.push(match);
      results.summary.approvedInCoupa++;
    } else if (coupaStatus === 'PENDING_APPROVAL' || approvalStatus === 'PENDING_APPROVAL' || approvalStatus === 'REQUIRES_APPROVAL') {
      results.categories.pendingApproval.push(match);
      results.summary.pendingApproval++;
    } else {
      // Default to pending if status is unclear
      results.categories.pendingApproval.push(match);
      results.summary.pendingApproval++;
    }
  }

  /**
   * Generate summary statistics
   */
  generateSummary(results) {
    const { summary } = results;
    
    return {
      ...summary,
      matchRate: summary.totalNetSuite > 0 ? (summary.matched / summary.totalNetSuite * 100).toFixed(1) : 0,
      approvalRate: summary.matched > 0 ? (summary.approvedInCoupa / summary.matched * 100).toFixed(1) : 0,
      discrepancyRate: summary.matched > 0 ? (summary.disputed / summary.matched * 100).toFixed(1) : 0
    };
  }
}

module.exports = InvoiceMatchingEngine;