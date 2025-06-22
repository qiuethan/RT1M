import { FinancialInfo, Asset, Debt, IntermediateGoal, DynamicMilestone } from '../services/firestore';
import { MILESTONE_PERCENTAGES, SAVINGS_RATE_THRESHOLDS } from '../constants/financial';

// Financial Calculations
export const calculateNetWorth = (financialInfo: FinancialInfo): number => {
  return (financialInfo.totalAssets || 0) - (financialInfo.totalDebts || 0);
};

export const calculateCashFlow = (financialInfo: FinancialInfo): number => {
  return (financialInfo.annualIncome || 0) - (financialInfo.annualExpenses || 0);
};

export const calculateSavingsRate = (financialInfo: FinancialInfo): number => {
  if (!financialInfo.annualIncome || financialInfo.annualIncome === 0) return 0;
  return ((calculateCashFlow(financialInfo) / financialInfo.annualIncome) * 100);
};

export const calculateTotalAssets = (assets: Asset[]): number => {
  return assets.reduce((sum, asset) => sum + asset.value, 0);
};

export const calculateTotalDebts = (debts: Debt[]): number => {
  return debts.reduce((sum, debt) => sum + debt.balance, 0);
};

// Progress Calculations
export const calculateProgress = (current: number, target: number): number => {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
};

export const calculateGoalProgress = (goal: IntermediateGoal): number => {
  if (!goal.targetAmount || goal.targetAmount <= 0) return 0;
  const current = goal.currentAmount || 0;
  return Math.min((current / goal.targetAmount) * 100, 100);
};

// Dynamic Milestone Generation
export const generateDynamicMilestones = (
  currentAmount: number,
  targetAmount: number,
  intermediateGoals: IntermediateGoal[]
): DynamicMilestone[] => {
  const milestones: DynamicMilestone[] = [];

  // Generate percentage-based milestones
  MILESTONE_PERCENTAGES.forEach((percentage, index) => {
    const amount = Math.round(targetAmount * percentage);
    const isCompleted = currentAmount >= amount;
    const progress = Math.min((currentAmount / amount) * 100, 100);
    
    let title: string;
    let description: string;
    
    if (percentage === 1.0) {
      title = "Final Goal - RT1M Achieved!";
      description = "You've reached your ultimate financial goal!";
    } else {
      const percentDisplay = Math.round(percentage * 100);
      title = `${percentDisplay}% Milestone`;
      description = `Reach ${percentDisplay}% of your financial goal`;
    }

    milestones.push({
      id: `milestone-${index}`,
      amount,
      title,
      description,
      completed: isCompleted,
      progress,
      isGoal: percentage === 1.0
    });
  });

  return milestones;
};

// Formatting Utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

// Color Utilities for UI
export const getSavingsRateColor = (rate: number): string => {
  if (rate >= SAVINGS_RATE_THRESHOLDS.EXCELLENT) return 'text-green-600';
  if (rate >= SAVINGS_RATE_THRESHOLDS.GOOD) return 'text-yellow-600';
  return 'text-red-600';
};

export const getNetWorthColor = (netWorth: number): string => {
  return netWorth >= 0 ? 'text-green-600' : 'text-red-600';
};

export const getCashFlowColor = (cashFlow: number): string => {
  return cashFlow >= 0 ? 'text-green-600' : 'text-red-600';
};

// Validation Utilities
export const isValidAsset = (asset: Partial<Asset>): boolean => {
  return !!(asset.name && asset.name.trim() && asset.value && asset.value > 0);
};

export const isValidDebt = (debt: Partial<Debt>): boolean => {
  return !!(debt.name && debt.name.trim() && debt.balance && debt.balance > 0);
};

export const isValidFinancialInfo = (info: Partial<FinancialInfo>): boolean => {
  return !!(
    typeof info.annualIncome === 'number' && info.annualIncome >= 0 &&
    typeof info.annualExpenses === 'number' && info.annualExpenses >= 0 &&
    typeof info.currentSavings === 'number' && info.currentSavings >= 0
  );
};

// Array Utilities
export const updateItemInArray = <T extends { id?: string }>(
  array: T[],
  id: string,
  updates: Partial<T>
): T[] => {
  return array.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
};

export const removeItemFromArray = <T extends { id?: string }>(
  array: T[],
  id: string
): T[] => {
  return array.filter(item => item.id !== id);
};

export const addItemToArray = <T>(array: T[], item: T): T[] => {
  return [...array, item];
};

// Date Utilities
export const generateId = (): string => {
  return Date.now().toString();
};

export const isDateInPast = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 