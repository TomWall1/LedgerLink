/**
 * Utility Functions for Formatting
 * 
 * These are helper functions that format data consistently across
 * the application. Think of them as your "formatting toolbox" that
 * ensures all numbers, dates, and text look the same everywhere.
 */

/**
 * Format currency amounts
 * 
 * Converts numbers into properly formatted currency strings.
 * Example: 1234.56 → "$1,234.56"
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'AUD',
  locale: string = 'en-AU'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
};

/**
 * Format currency without decimals (for large amounts)
 * 
 * Example: 1234567.89 → "$1,234,568"
 */
export const formatCurrencyShort = (
  amount: number,
  currency: string = 'AUD',
  locale: string = 'en-AU'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

/**
 * Format large numbers with K/M suffixes
 * 
 * Example: 1234567 → "$1.23M"
 */
export const formatCurrencyCompact = (
  amount: number,
  currency: string = 'AUD',
  locale: string = 'en-AU'
): string => {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1000000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(amount);
  } else if (absAmount >= 1000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(amount);
  } else {
    return formatCurrency(amount, currency, locale);
  }
};

/**
 * Format percentages
 * 
 * Example: 0.8567 → "85.7%"
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  locale: string = 'en-AU'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Format dates for display
 * 
 * Handles different date input formats and converts them to
 * user-friendly display formats.
 */
export const formatDate = (
  dateInput: string | Date | null | undefined,
  options: {
    format?: 'short' | 'medium' | 'long' | 'relative';
    locale?: string;
    includeTime?: boolean;
  } = {}
): string => {
  const { format = 'medium', locale = 'en-AU', includeTime = false } = options;
  
  if (!dateInput) return '-';
  
  let date: Date;
  
  try {
    if (typeof dateInput === 'string') {
      // Handle various date string formats
      if (dateInput.includes('/')) {
        // Handle DD/MM/YYYY or MM/DD/YYYY formats
        const parts = dateInput.split('/');
        if (parts.length === 3) {
          // Assume DD/MM/YYYY for Australian locale
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          date = new Date(dateInput);
        }
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateInput.toString();
    }
    
    // Handle relative dates
    if (format === 'relative') {
      return formatRelativeDate(date, locale);
    }
    
    // Standard date formatting
    let formatOptions: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case 'short':
        formatOptions = {
          year: '2-digit',
          month: 'short',
          day: 'numeric',
        };
        break;
      case 'medium':
        formatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };
        break;
      case 'long':
        formatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        };
        break;
    }
    
    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
    
  } catch (error) {
    // If all else fails, return the original input as string
    return dateInput.toString();
  }
};

/**
 * Format relative dates (e.g., "2 hours ago", "yesterday")
 */
export const formatRelativeDate = (
  date: Date,
  locale: string = 'en-AU'
): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    // For older dates, use regular formatting
    return formatDate(date, { format: 'short', locale });
  }
};

/**
 * Format file sizes
 * 
 * Example: 1234567 → "1.23 MB"
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format processing time
 * 
 * Example: 1234 → "1.23s", 123456 → "2m 3s"
 */
export const formatProcessingTime = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
};

/**
 * Format numbers with thousand separators
 * 
 * Example: 1234567 → "1,234,567"
 */
export const formatNumber = (
  value: number,
  decimals: number = 0,
  locale: string = 'en-AU'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Truncate text with ellipsis
 * 
 * Example: "This is a very long text" → "This is a very..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Generate initials from a name
 * 
 * Example: "John Smith" → "JS"
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a random color for avatars/badges
 */
export const generateColor = (seed: string): string => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green  
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#F97316', // orange
    '#84CC16', // lime
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Capitalize first letter of each word
 * 
 * Example: "hello world" → "Hello World"
 */
export const capitalizeWords = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Sleep function for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
