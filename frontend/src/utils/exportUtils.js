// Helper function to convert an array of objects to CSV format
export const convertToCSV = (data, headers) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Create CSV header row
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  
  // Create CSV data rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key];
      // Handle different value types and ensure proper CSV formatting
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`;
      } else if (typeof value === 'object') {
        // For objects (like dates), convert to string
        return `"${String(value).replace(/"/g, '""')}"`;
      } else {
        return String(value);
      }
    }).join(',');
  }).join('\n');

  return `${headerRow}\n${rows}`;
};

// Helper function to download a CSV file
export const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format perfect matches for export
export const preparePerfectMatchesForExport = (perfectMatches) => {
  return perfectMatches.map(match => ({
    transactionNumber: match?.company1?.transactionNumber || match?.company2?.transactionNumber || '',
    type: match?.company1?.type || match?.company2?.type || '',
    amount: match?.company1?.amount || 0,
    date: match?.company1?.date || match?.company2?.date || '',
    dueDate: match?.company1?.dueDate || match?.company2?.dueDate || '',
    status: match?.company1?.status || match?.company2?.status || '',
    partiallyPaid: match?.company1?.is_partially_paid || match?.company2?.is_partially_paid ? 'Yes' : 'No',
    amountPaid: match?.company1?.amount_paid || match?.company2?.amount_paid || 0,
    originalAmount: match?.company1?.original_amount || match?.company2?.original_amount || 0
  }));
};

// Format mismatches for export
export const prepareMismatchesForExport = (mismatches) => {
  return mismatches.map(mismatch => {
    const receivableAmount = Math.abs(parseFloat(mismatch?.company1?.amount || 0));
    const payableAmount = Math.abs(parseFloat(mismatch?.company2?.amount || 0));
    const difference = Math.abs(receivableAmount - payableAmount);
    
    return {
      transactionNumber: mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || '',
      type: mismatch?.company1?.type || mismatch?.company2?.type || '',
      receivableAmount: receivableAmount || 0,
      payableAmount: payableAmount || 0,
      difference: difference || 0,
      date: mismatch?.company1?.date || mismatch?.company2?.date || '',
      status: mismatch?.company1?.status || mismatch?.company2?.status || '',
      partiallyPaid: mismatch?.company1?.is_partially_paid || mismatch?.company2?.is_partially_paid ? 'Yes' : 'No',
      paymentDate: mismatch?.company1?.payment_date || mismatch?.company2?.payment_date || ''
    };
  });
};

// Format unmatched items for export
export const prepareUnmatchedItemsForExport = (unmatchedItems) => {
  const company1Items = unmatchedItems.company1?.map(item => ({
    transactionNumber: item?.transactionNumber || '',
    type: item?.type || '',
    amount: item?.amount || 0,
    date: item?.date || '',
    dueDate: item?.dueDate || '',
    status: item?.status || '',
    partiallyPaid: item?.is_partially_paid ? 'Yes' : 'No',
    amountPaid: item?.amount_paid || 0,
    originalAmount: item?.original_amount || 0
  })) || [];
  
  const company2Items = unmatchedItems.company2?.map(item => ({
    transactionNumber: item?.transactionNumber || '',
    type: item?.type || '',
    amount: item?.amount || 0,
    date: item?.date || '',
    dueDate: item?.dueDate || '',
    status: item?.status || '',
    partiallyPaid: item?.is_partially_paid ? 'Yes' : 'No',
    amountPaid: item?.amount_paid || 0,
    originalAmount: item?.original_amount || 0
  })) || [];
  
  return {
    company1: company1Items,
    company2: company2Items
  };
};

// Format historical insights for export
export const prepareHistoricalInsightsForExport = (historicalInsights) => {
  return historicalInsights.map(insight => ({
    apTransactionNumber: insight.apItem?.transactionNumber || '',
    apAmount: insight.apItem?.amount || 0,
    apDate: insight.apItem?.date || '',
    apStatus: insight.apItem?.status || '',
    arTransactionNumber: insight.historicalMatch?.transactionNumber || '',
    arOriginalAmount: insight.historicalMatch?.original_amount || 0,
    arCurrentAmount: insight.historicalMatch?.amount || 0,
    arAmountPaid: insight.historicalMatch?.amount_paid || 0,
    arDate: insight.historicalMatch?.date || '',
    arStatus: insight.historicalMatch?.status || '',
    arPaymentDate: insight.historicalMatch?.payment_date || '',
    insightType: insight.insight?.type || '',
    insightMessage: insight.insight?.message || '',
    insightSeverity: insight.insight?.severity || ''
  }));
};