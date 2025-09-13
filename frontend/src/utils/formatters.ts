/**
 * Format currency values
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format dates in a consistent way
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string => {
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Format date with time
 */
export const formatDateTime = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Format numbers with appropriate separators
 */
export const formatNumber = (
  num: number,
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
};

/**
 * Format percentage values
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Format file sizes
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  if (diffMs < minute) {
    return 'Just now';
  } else if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffMs < week) {
    const days = Math.floor(diffMs / day);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffMs < month) {
    const weeks = Math.floor(diffMs / week);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffMs < year) {
    const months = Math.floor(diffMs / month);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffMs / year);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter of each word
 */
export const toTitleCase = (str: string): string => {
  return str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Convert camelCase to Title Case
 */
export const camelToTitle = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

/**
 * Format invoice numbers consistently
 */
export const formatInvoiceNumber = (invoiceNumber: string): string => {
  // Remove extra spaces and convert to uppercase
  return invoiceNumber.trim().toUpperCase();
};

/**
 * Format confidence scores
 */
export const formatConfidence = (confidence: number): string => {
  return `${confidence}%`;
};

/**
 * Format status text for display
 */
export const formatStatus = (status: string): string => {
  return status
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatRelativeTime,
  truncateText,
  toTitleCase,
  camelToTitle,
  formatInvoiceNumber,
  formatConfidence,
  formatStatus,
};