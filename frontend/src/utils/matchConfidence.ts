export interface InvoiceRecord {
  invoiceNumber: string;
  amount: number;
  date: string;
  counterparty: string;
  reference?: string;
  status: string;
}

export interface MatchFactors {
  invoiceNumberMatch: number;
  amountMatch: number;
  dateMatch: number;
  referenceMatch: number;
  overallConfidence: number;
}

export interface MatchInsight {
  type: 'positive' | 'warning' | 'error';
  message: string;
  weight: number;
}

/**
 * Calculate the confidence score for matching two invoice records
 * Returns a score from 0-100 indicating how likely the records match
 */
export const calculateMatchConfidence = (
  ourRecord: InvoiceRecord,
  theirRecord: InvoiceRecord,
  tolerances: {
    amountTolerance: number; // percentage (e.g., 0.01 = 1%)
    dateTolerance: number; // days
    fuzzyMatching: boolean;
  } = {
    amountTolerance: 0.01,
    dateTolerance: 7,
    fuzzyMatching: true,
  }
): MatchFactors => {
  const factors: MatchFactors = {
    invoiceNumberMatch: 0,
    amountMatch: 0,
    dateMatch: 0,
    referenceMatch: 0,
    overallConfidence: 0,
  };

  // Invoice Number Matching (35% weight)
  factors.invoiceNumberMatch = calculateInvoiceNumberMatch(
    ourRecord.invoiceNumber,
    theirRecord.invoiceNumber,
    tolerances.fuzzyMatching
  );

  // Amount Matching (30% weight)
  factors.amountMatch = calculateAmountMatch(
    ourRecord.amount,
    theirRecord.amount,
    tolerances.amountTolerance
  );

  // Date Matching (20% weight)
  factors.dateMatch = calculateDateMatch(
    ourRecord.date,
    theirRecord.date,
    tolerances.dateTolerance
  );

  // Reference Matching (15% weight)
  factors.referenceMatch = calculateReferenceMatch(
    ourRecord.reference,
    theirRecord.reference,
    tolerances.fuzzyMatching
  );

  // Calculate weighted overall confidence
  factors.overallConfidence = Math.round(
    factors.invoiceNumberMatch * 0.35 +
    factors.amountMatch * 0.30 +
    factors.dateMatch * 0.20 +
    factors.referenceMatch * 0.15
  );

  return factors;
};

/**
 * Calculate invoice number match score
 */
const calculateInvoiceNumberMatch = (
  our: string,
  their: string,
  fuzzyMatching: boolean
): number => {
  if (!our || !their) return 0;

  // Exact match
  if (our === their) return 100;

  if (!fuzzyMatching) return 0;

  // Normalize for comparison (remove spaces, convert to lowercase)
  const ourNormalized = our.replace(/\s+/g, '').toLowerCase();
  const theirNormalized = their.replace(/\s+/g, '').toLowerCase();

  if (ourNormalized === theirNormalized) return 95;

  // Check for common OCR/typing errors
  const similarity = calculateStringSimilarity(ourNormalized, theirNormalized);
  
  if (similarity > 0.9) return 90;
  if (similarity > 0.8) return 75;
  if (similarity > 0.7) return 60;
  if (similarity > 0.5) return 40;
  
  return 0;
};

/**
 * Calculate amount match score
 */
const calculateAmountMatch = (
  our: number,
  their: number,
  tolerance: number
): number => {
  if (!our || !their) return 0;

  // Exact match
  if (our === their) return 100;

  // Calculate percentage difference
  const difference = Math.abs(our - their);
  const percentDifference = difference / Math.max(our, their);

  if (percentDifference <= tolerance) return 95;
  if (percentDifference <= tolerance * 2) return 85;
  if (percentDifference <= tolerance * 3) return 70;
  if (percentDifference <= tolerance * 5) return 50;
  if (percentDifference <= 0.1) return 30; // Up to 10% difference
  
  return 0;
};

/**
 * Calculate date match score
 */
const calculateDateMatch = (
  our: string,
  their: string,
  toleranceDays: number
): number => {
  if (!our || !their) return 0;

  const ourDate = new Date(our);
  const theirDate = new Date(their);

  // Check if dates are valid
  if (isNaN(ourDate.getTime()) || isNaN(theirDate.getTime())) return 0;

  // Exact match
  if (ourDate.getTime() === theirDate.getTime()) return 100;

  // Calculate day difference
  const diffTime = Math.abs(ourDate.getTime() - theirDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= toleranceDays) return 90;
  if (diffDays <= toleranceDays * 2) return 75;
  if (diffDays <= toleranceDays * 3) return 60;
  if (diffDays <= 30) return 40; // Within a month
  if (diffDays <= 90) return 20; // Within a quarter
  
  return 0;
};

/**
 * Calculate reference match score
 */
const calculateReferenceMatch = (
  our?: string,
  their?: string,
  fuzzyMatching: boolean = true
): number => {
  // If either reference is missing, neutral score
  if (!our || !their) return 70;

  // Exact match
  if (our === their) return 100;

  if (!fuzzyMatching) return 0;

  // Normalize and compare
  const ourNormalized = our.replace(/\s+/g, '').toLowerCase();
  const theirNormalized = their.replace(/\s+/g, '').toLowerCase();

  if (ourNormalized === theirNormalized) return 95;

  // Check similarity
  const similarity = calculateStringSimilarity(ourNormalized, theirNormalized);
  
  if (similarity > 0.8) return 85;
  if (similarity > 0.6) return 70;
  if (similarity > 0.4) return 50;
  
  return 30;
};

/**
 * Calculate string similarity using Levenshtein distance
 */
const calculateStringSimilarity = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLength = Math.max(len1, len2);
  const distance = matrix[len1][len2];
  return (maxLength - distance) / maxLength;
};

/**
 * Generate insights based on matching factors
 */
export const generateMatchInsights = (
  ourRecord: InvoiceRecord,
  theirRecord: InvoiceRecord,
  factors: MatchFactors
): MatchInsight[] => {
  const insights: MatchInsight[] = [];

  // Invoice number insights
  if (factors.invoiceNumberMatch === 100) {
    insights.push({
      type: 'positive',
      message: 'Invoice numbers match exactly',
      weight: 0.35,
    });
  } else if (factors.invoiceNumberMatch >= 90) {
    insights.push({
      type: 'positive',
      message: 'Invoice numbers match with minor formatting differences',
      weight: 0.35,
    });
  } else if (factors.invoiceNumberMatch > 0) {
    insights.push({
      type: 'warning',
      message: 'Invoice numbers are similar but may have errors',
      weight: 0.35,
    });
  } else {
    insights.push({
      type: 'error',
      message: 'Invoice numbers do not match',
      weight: 0.35,
    });
  }

  // Amount insights
  if (factors.amountMatch === 100) {
    insights.push({
      type: 'positive',
      message: 'Amounts match exactly',
      weight: 0.30,
    });
  } else if (factors.amountMatch >= 95) {
    const difference = Math.abs(ourRecord.amount - theirRecord.amount);
    insights.push({
      type: 'positive',
      message: `Amounts match within tolerance (difference: $${difference.toFixed(2)})`,
      weight: 0.30,
    });
  } else if (factors.amountMatch > 0) {
    const difference = Math.abs(ourRecord.amount - theirRecord.amount);
    const percentage = (difference / Math.max(ourRecord.amount, theirRecord.amount) * 100).toFixed(1);
    insights.push({
      type: 'warning',
      message: `Amount difference of $${difference.toFixed(2)} (${percentage}%) detected`,
      weight: 0.30,
    });
  }

  // Date insights
  if (factors.dateMatch === 100) {
    insights.push({
      type: 'positive',
      message: 'Dates match exactly',
      weight: 0.20,
    });
  } else if (factors.dateMatch >= 90) {
    const ourDate = new Date(ourRecord.date);
    const theirDate = new Date(theirRecord.date);
    const diffDays = Math.abs(Math.ceil((ourDate.getTime() - theirDate.getTime()) / (1000 * 60 * 60 * 24)));
    insights.push({
      type: 'positive',
      message: `Dates are ${diffDays} day(s) apart - within acceptable range`,
      weight: 0.20,
    });
  } else if (factors.dateMatch > 0) {
    insights.push({
      type: 'warning',
      message: 'Significant date difference detected',
      weight: 0.20,
    });
  }

  // Reference insights
  if (ourRecord.reference && theirRecord.reference) {
    if (factors.referenceMatch === 100) {
      insights.push({
        type: 'positive',
        message: 'Reference numbers match exactly',
        weight: 0.15,
      });
    } else if (factors.referenceMatch >= 85) {
      insights.push({
        type: 'positive',
        message: 'Reference numbers match with minor differences',
        weight: 0.15,
      });
    } else if (factors.referenceMatch >= 50) {
      insights.push({
        type: 'warning',
        message: 'Reference numbers are partially similar',
        weight: 0.15,
      });
    } else {
      insights.push({
        type: 'warning',
        message: 'Reference numbers do not match',
        weight: 0.15,
      });
    }
  }

  // Overall confidence insights
  if (factors.overallConfidence >= 95) {
    insights.push({
      type: 'positive',
      message: 'High confidence match - ready for automatic processing',
      weight: 1.0,
    });
  } else if (factors.overallConfidence >= 80) {
    insights.push({
      type: 'positive',
      message: 'Good match confidence - may require minimal review',
      weight: 1.0,
    });
  } else if (factors.overallConfidence >= 60) {
    insights.push({
      type: 'warning',
      message: 'Moderate confidence - manual review recommended',
      weight: 1.0,
    });
  } else {
    insights.push({
      type: 'error',
      message: 'Low confidence match - requires careful review',
      weight: 1.0,
    });
  }

  return insights;
};

/**
 * Determine match status based on confidence score
 */
export const determineMatchStatus = (
  confidence: number,
  autoMatchThreshold: number = 95
): 'matched' | 'mismatched' | 'no-match' => {
  if (confidence === 0) return 'no-match';
  if (confidence >= autoMatchThreshold) return 'matched';
  return 'mismatched';
};

/**
 * Batch process multiple records for matching
 */
export const batchProcessMatches = (
  ourRecords: InvoiceRecord[],
  theirRecords: InvoiceRecord[],
  tolerances?: {
    amountTolerance: number;
    dateTolerance: number;
    fuzzyMatching: boolean;
  }
): MatchFactors[] => {
  const results: MatchFactors[] = [];

  for (const ourRecord of ourRecords) {
    let bestMatch: MatchFactors | null = null;
    let bestConfidence = 0;

    for (const theirRecord of theirRecords) {
      const match = calculateMatchConfidence(ourRecord, theirRecord, tolerances);
      if (match.overallConfidence > bestConfidence) {
        bestConfidence = match.overallConfidence;
        bestMatch = match;
      }
    }

    if (bestMatch) {
      results.push(bestMatch);
    }
  }

  return results;
};

export default {
  calculateMatchConfidence,
  generateMatchInsights,
  determineMatchStatus,
  batchProcessMatches,
};