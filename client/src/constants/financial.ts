// Asset and Debt Type Options
export const ASSET_TYPE_OPTIONS = [
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'stocks', label: 'Stocks & Equities' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'retirement', label: 'Retirement Account' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'business', label: 'Business Investment' },
  { value: 'other', label: 'Other' }
];

export const DEBT_TYPE_OPTIONS = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'student-loan', label: 'Student Loan' },
  { value: 'car-loan', label: 'Car Loan' },
  { value: 'personal-loan', label: 'Personal Loan' },
  { value: 'business-loan', label: 'Business Loan' },
  { value: 'other', label: 'Other' }
];

// Financial Goal Constants
export const TIMEFRAME_OPTIONS = [
  { value: '1-2 years', label: '1-2 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '6-10 years', label: '6-10 years' },
  { value: '10+ years', label: '10+ years' }
] as const;

export const RISK_TOLERANCE_OPTIONS = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' }
] as const;

export const PRIMARY_STRATEGY_OPTIONS = [
  { value: 'savings', label: 'High-Yield Savings' },
  { value: 'stocks', label: 'Stock Market Investing' },
  { value: 'real-estate', label: 'Real Estate Investment' },
  { value: 'business', label: 'Business/Entrepreneurship' },
  { value: 'mixed', label: 'Mixed Strategy' }
] as const;

// Employment Status Options
export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'Employed', label: 'Employed' },
  { value: 'Self-employed', label: 'Self-employed' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'Student', label: 'Student' },
  { value: 'Retired', label: 'Retired' }
] as const;

// Goal Categories
export const GOAL_CATEGORIES = [
  { value: 'financial', label: 'Financial' },
  { value: 'skill', label: 'Skill Development' },
  { value: 'behavior', label: 'Behavior Change' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'networking', label: 'Networking' },
  { value: 'project', label: 'Project' }
] as const;

// Goal Status Options
export const GOAL_STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' }
] as const;

// Financial Calculation Helpers
export const SAVINGS_RATE_THRESHOLDS = {
  EXCELLENT: 20,
  GOOD: 10,
  POOR: 0
} as const;

// Default Values
export const DEFAULT_FINANCIAL_INFO = {
  annualIncome: 0,
  annualExpenses: 0,
  currentSavings: 0
} as const;

export const DEFAULT_ASSET = {
  name: '',
  type: 'savings' as const,
  value: 0,
  description: ''
} as const;

export const DEFAULT_DEBT = {
  name: '',
  type: 'credit-card' as const,
  balance: 0,
  interestRate: 0,
  description: ''
} as const;

// Milestone Percentages for Dashboard
export const MILESTONE_PERCENTAGES = [0.01, 0.05, 0.10, 0.25, 0.50, 0.75, 1.0] as const; 