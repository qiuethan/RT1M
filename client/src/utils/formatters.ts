// Format currency values
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Format date
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Format date and time
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Calculate percentage progress
export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

// Calculate remaining amount
export const calculateRemaining = (current: number, target: number): number => {
  return Math.max(target - current, 0);
};

// Format large numbers (e.g., 1000 -> 1K, 1000000 -> 1M)
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Format a number value for display, showing both null and 0 as "0"
 * but preserving the distinction in the data
 */
export const formatNumberForDisplay = (value: number | null): string => {
  if (value === null || value === undefined) {
    return '0';
  }
  return value.toString();
};

/**
 * Format a string value for display, showing both null and empty string as empty
 */
export const formatStringForDisplay = (value: string | null): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return value;
};

/**
 * Parse input value, converting empty string to null and numbers to actual numbers
 */
export const parseNumberInput = (value: string): number | null => {
  if (value === '' || value === undefined) {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Parse string input, converting empty string to null
 */
export const parseStringInput = (value: string): string | null => {
  if (value === '' || value === undefined) {
    return null;
  }
  return value.trim();
};

/**
 * Get display value for currency, showing $0 for both null and 0
 * but indicating when data is missing in tooltips/context
 */
export const formatCurrencyWithContext = (value: number | null): { display: string; hasData: boolean } => {
  return {
    display: `$${(value || 0).toLocaleString()}`,
    hasData: value !== null
  };
};

/**
 * Format date for display with null handling
 */
export const formatDateDisplay = (date: Date | string | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  } catch {
    return '';
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
};

/**
 * Format array for display, handling null vs empty array distinction
 * Returns empty array for display purposes when null
 */
export const formatArrayForDisplay = <T>(array: T[] | null): T[] => {
  return array || [];
};

/**
 * Check if array has been entered (not null) vs just empty
 */
export const isArrayEntered = <T>(array: T[] | null): boolean => {
  return array !== null;
};

/**
 * Check if array has actual items
 */
export const hasArrayItems = <T>(array: T[] | null): boolean => {
  return array !== null && array.length > 0;
};

/**
 * Get array status for context
 */
export const getArrayStatus = <T>(array: T[] | null): 'not-entered' | 'empty' | 'has-items' => {
  if (array === null) return 'not-entered';
  if (array.length === 0) return 'empty';
  return 'has-items';
}; 