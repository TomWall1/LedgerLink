/**
 * Validation utilities for forms and data
 */

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password strength validation
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Invoice number validation
 */
export const isValidInvoiceNumber = (invoiceNumber: string): boolean => {
  // Basic validation - not empty and reasonable length
  return invoiceNumber.trim().length > 0 && invoiceNumber.trim().length <= 50;
};

/**
 * Amount validation
 */
export const isValidAmount = (amount: number | string): boolean => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0 && numAmount < 1000000000; // Max 1 billion
};

/**
 * Date validation
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date instanceof Date;
};

/**
 * CSV file validation
 */
export const isValidCSVFile = (file: File): {
  isValid: boolean;
  error?: string;
} => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { isValid: false, error: 'File must be a CSV file' };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { isValid: false, error: 'File size must be less than 10MB' };
  }
  
  return { isValid: true };
};

/**
 * URL validation
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Phone number validation (basic)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Company name validation
 */
export const isValidCompanyName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

/**
 * Percentage validation
 */
export const isValidPercentage = (value: number): boolean => {
  return !isNaN(value) && value >= 0 && value <= 100;
};

/**
 * Required field validation
 */
export const isRequired = (value: string | number | boolean): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  return value !== null && value !== undefined;
};

/**
 * Generic form validation
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
  }>
): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && !isRequired(value)) {
      errors[field] = rule.message || `${field} is required`;
      continue;
    }
    
    if (value && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
        continue;
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = rule.message || `${field} must be no more than ${rule.maxLength} characters`;
        continue;
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} format is invalid`;
        continue;
      }
    }
    
    if (rule.custom && !rule.custom(value)) {
      errors[field] = rule.message || `${field} is invalid`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export default {
  isValidEmail,
  validatePassword,
  isValidInvoiceNumber,
  isValidAmount,
  isValidDate,
  isValidCSVFile,
  isValidURL,
  isValidPhoneNumber,
  isValidCompanyName,
  isValidPercentage,
  isRequired,
  validateForm,
  sanitizeInput,
};