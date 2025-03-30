// Format currency values consistently
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return 'N/A';
  return numericAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
};

// Format dates consistently
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    // Simple format - handle YYYY-MM-DD format (most common from backend)
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [year, month, day] = date.split('-');
      // Format as DD/MM/YYYY for better readability
      return `${day}/${month}/${year}`;
    }
    
    // For anything else, try the standard Date parsing
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      // Format with day first (DD/MM/YYYY)
      return dateObj.toLocaleDateString('en-GB');
    }
    
    // If we get here, just return the original string
    return String(date);
  } catch (error) {
    // On error, at least return something meaningful
    console.error('Date formatting error:', error, 'Date value:', date);
    return String(date) || 'N/A';
  }
};