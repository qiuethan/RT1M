// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_REQUIRED: 'Please log in to continue',
  AUTH_FAILED: 'Authentication failed. Please try logging in again.',
  
  // Data Loading Errors
  LOAD_PROFILE_FAILED: 'Failed to load profile data. Please refresh the page.',
  LOAD_FINANCIALS_FAILED: 'Failed to load financial data. Please refresh the page.',
  LOAD_GOALS_FAILED: 'Failed to load goals data. Please refresh the page.',
  LOAD_SKILLS_FAILED: 'Failed to load skills data. Please refresh the page.',
  
  // Data Saving Errors
  SAVE_PROFILE_FAILED: 'Failed to save profile. Please try again.',
  SAVE_FINANCIALS_FAILED: 'Failed to save financial data. Please try again.',
  SAVE_GOALS_FAILED: 'Failed to save goals. Please try again.',
  SAVE_SKILLS_FAILED: 'Failed to save skills. Please try again.',
  SAVE_ASSET_FAILED: 'Failed to save asset. Please try again.',
  SAVE_DEBT_FAILED: 'Failed to save debt. Please try again.',
  
  // Validation Errors
  INVALID_ASSET: 'Please provide a valid asset name and value.',
  INVALID_DEBT: 'Please provide a valid debt name and balance.',
  INVALID_GOAL: 'Please provide a valid goal title and target amount.',
  INVALID_FINANCIAL_INFO: 'Please provide valid financial information.',
  
  // Generic Errors
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_SAVED: 'Profile saved successfully!',
  FINANCIALS_SAVED: 'Financial information saved successfully!',
  GOALS_SAVED: 'Goals saved successfully!',
  SKILLS_SAVED: 'Skills saved successfully!',
  ASSET_SAVED: 'Asset saved successfully!',
  DEBT_SAVED: 'Debt saved successfully!',
  GOAL_ADDED: 'Goal added successfully!',
  GOAL_UPDATED: 'Goal updated successfully!',
  GOAL_DELETED: 'Goal deleted successfully!',
} as const;

// Error Handler Function
export const handleError = (error: any, context?: string): AppError => {
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  // Handle Firebase/Network errors
  if (error?.code) {
    switch (error.code) {
      case 'permission-denied':
        return { message: ERROR_MESSAGES.AUTH_REQUIRED, code: error.code };
      case 'unauthenticated':
        return { message: ERROR_MESSAGES.AUTH_FAILED, code: error.code };
      case 'unavailable':
        return { message: ERROR_MESSAGES.NETWORK_ERROR, code: error.code };
      default:
        return { 
          message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR, 
          code: error.code,
          details: error 
        };
    }
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return { message: error.message, details: error };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }
  
  // Fallback for unknown error types
  return { 
    message: ERROR_MESSAGES.UNKNOWN_ERROR, 
    details: error 
  };
};

// Async Function Wrapper with Error Handling
export const withErrorHandling = async <T>(
  asyncFn: () => Promise<T>,
  context: string,
  onError?: (error: AppError) => void,
  onSuccess?: (result: T) => void
): Promise<T | null> => {
  try {
    const result = await asyncFn();
    if (onSuccess) {
      onSuccess(result);
    }
    return result;
  } catch (error) {
    const appError = handleError(error, context);
    if (onError) {
      onError(appError);
    } else {
      // Default error handling - show alert
      alert(appError.message);
    }
    return null;
  }
};

// Loading State Manager
export class LoadingManager {
  private loadingStates: Map<string, boolean> = new Map();
  private callbacks: Map<string, (isLoading: boolean) => void> = new Map();

  setLoading(key: string, isLoading: boolean): void {
    this.loadingStates.set(key, isLoading);
    const callback = this.callbacks.get(key);
    if (callback) {
      callback(isLoading);
    }
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  subscribe(key: string, callback: (isLoading: boolean) => void): void {
    this.callbacks.set(key, callback);
  }

  unsubscribe(key: string): void {
    this.callbacks.delete(key);
  }
}

// Global loading manager instance
export const globalLoadingManager = new LoadingManager();

// Notification System (Simple Alert-based for now)
export const notify = {
  success: (message: string) => {
    console.log('✅ Success:', message);
    alert(message);
  },
  
  error: (message: string) => {
    console.error('❌ Error:', message);
    alert(message);
  },
  
  info: (message: string) => {
    console.info('ℹ️ Info:', message);
    alert(message);
  },
  
  warning: (message: string) => {
    console.warn('⚠️ Warning:', message);
    alert(message);
  }
};

// Validation Error Handler
export const handleValidationError = (field: string, value: any): string | null => {
  if (value === null || value === undefined) {
    return `${field} is required`;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return `${field} cannot be empty`;
  }
  
  if (typeof value === 'number' && (isNaN(value) || value < 0)) {
    return `${field} must be a valid positive number`;
  }
  
  return null;
};

// Retry Logic
export const withRetry = async <T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}; 