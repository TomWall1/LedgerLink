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
    // Handle .NET JSON date format: "/Date(1728950400000+0000)/"
    if (typeof date === 'string' && date.startsWith('/Date(') && date.includes('+')) {
      const timestamp = parseInt(date.substring(6, date.indexOf('+')));
      if (!isNaN(timestamp)) {
        const dateObj = new Date(timestamp);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    
    // Handle ISO strings that might have additional content
    if (typeof date === 'string' && date.includes('T')) {
      // Try to extract just the date part if we have something like "27T00:00:00.000Z/10/2024"
      const parts = date.split('T')[0].split('/');
      if (parts.length >= 3) {
        // Assuming format might be DD/MM/YYYY or similar
        return parts.slice(0, 3).join('/');
      }
      
      // For standard ISO dates
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    
    // Simple format - handle YYYY-MM-DD format (most common from backend)
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [year, month, day] = date.split('-');
      // Format as DD/MM/YYYY for better readability
      return `${day.substring(0,2)}/${month}/${year}`;
    }
    
    // For anything else, try the standard Date parsing
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      // Format with day first (DD/MM/YYYY)
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // If we get here, just return the original string
    return String(date);
  } catch (error) {
    // On error, at least return something meaningful
    console.error('Date formatting error:', error, 'Date value:', date);
    return String(date) || 'N/A';
  }
};