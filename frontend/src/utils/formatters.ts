/**
 * Utility functions for formatting data
 */

/**
 * Format currency amount with proper locale and currency symbol
 * @param amount - Numeric amount
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback if currency or locale is invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format number with thousands separators
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number, 
  decimals: number = 2, 
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    return value.toFixed(decimals);
  }
};

/**
 * Format date using Intl.DateTimeFormat
 * @param date - Date object or date string
 * @param options - Intl.DateTimeFormat options
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  },
  locale: string = 'en-US'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format date and time
 * @param date - Date object or date string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string,
  locale: string = 'en-US'
): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }, locale);
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date object or date string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Relative time string
 */
export const formatRelativeTime = (
  date: Date | string,
  locale: string = 'en-US'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    // Use Intl.RelativeTimeFormat if available
    if ('RelativeTimeFormat' in Intl) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      
      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(-diffInSeconds, 'second');
      } else if (Math.abs(diffInSeconds) < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
      } else if (Math.abs(diffInSeconds) < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
      } else if (Math.abs(diffInSeconds) < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
      } else if (Math.abs(diffInSeconds) < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
      } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
      }
    }
    
    // Fallback implementation
    const absDiff = Math.abs(diffInSeconds);
    const isPast = diffInSeconds > 0;
    
    if (absDiff < 60) {
      return 'just now';
    } else if (absDiff < 3600) {
      const minutes = Math.floor(absDiff / 60);
      return isPast ? `${minutes} minute${minutes !== 1 ? 's' : ''} ago` : `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (absDiff < 86400) {
      const hours = Math.floor(absDiff / 3600);
      return isPast ? `${hours} hour${hours !== 1 ? 's' : ''} ago` : `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(absDiff / 86400);
      return isPast ? `${days} day${days !== 1 ? 's' : ''} ago` : `in ${days} day${days !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format file size in bytes to human readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format percentage
 * @param value - Decimal value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    return `${(value * 100).toFixed(decimals)}%`;
  }
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Format phone number (US format)
 * @param phoneNumber - Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phoneNumber; // Return original if not standard format
};

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Format invoice number with padding
 * @param number - Invoice number
 * @param prefix - Prefix (e.g., 'INV')
 * @param padding - Number padding length (default: 4)
 * @returns Formatted invoice number
 */
export const formatInvoiceNumber = (
  number: number,
  prefix: string = 'INV',
  padding: number = 4
): string => {
  return `${prefix}-${number.toString().padStart(padding, '0')}`;
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  formatPercentage,
  truncateText,
  formatPhoneNumber,
  capitalizeWords,
  formatInvoiceNumber
};