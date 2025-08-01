import { FinancialInfo, Asset, Debt, IntermediateGoal, DynamicMilestone } from '../services/firestore';
import { MILESTONE_PERCENTAGES, SAVINGS_RATE_THRESHOLDS } from '../constants/financial';

// Financial Calculations
export const calculateNetWorth = (assets: Asset[], debts: Debt[]): number => {
  const totalAssets = calculateTotalAssets(assets);
  const totalDebts = calculateTotalDebts(debts);
  return totalAssets - totalDebts;
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
  _intermediateGoals: IntermediateGoal[]
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

// Dynamic Milestone Generation - Next Milestone Focus
export const generateNextMilestone = (
  currentAmount: number,
  targetAmount: number
): { nextMilestone: DynamicMilestone | null; progressToNext: number } => {
  const milestonePercentages = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0];
  
  // Find the next uncompleted milestone
  for (const percentage of milestonePercentages) {
    const milestoneAmount = Math.round(targetAmount * percentage);
    
    if (currentAmount < milestoneAmount) {
      const isGoal = percentage === 1.0;
      const title = isGoal ? "Final Goal - RT1M Achieved!" : `${Math.round(percentage * 100)}% Milestone`;
      const description = isGoal 
        ? "You've reached your ultimate financial goal!" 
        : `Reach ${Math.round(percentage * 100)}% of your financial goal`;
      
      // Calculate progress from current milestone to next milestone
      let progressToNext = 0;
      if (currentAmount > 0) {
        // Find the previous milestone
        const previousPercentage = milestonePercentages[milestonePercentages.indexOf(percentage) - 1] || 0;
        const previousAmount = Math.round(targetAmount * previousPercentage);
        const progressRange = milestoneAmount - previousAmount;
        const currentProgress = currentAmount - previousAmount;
        progressToNext = progressRange > 0 ? Math.max(0, Math.min(100, (currentProgress / progressRange) * 100)) : 0;
      }
      
      return {
        nextMilestone: {
          id: `milestone-${percentage}`,
          amount: milestoneAmount,
          title,
          description,
          completed: false,
          progress: progressToNext,
          isGoal
        },
        progressToNext
      };
    }
  }
  
  // All milestones completed
  return {
    nextMilestone: {
      id: 'milestone-completed',
      amount: targetAmount,
      title: "🎉 All Milestones Completed!",
      description: "Congratulations! You've achieved your RT1M goal!",
      completed: true,
      progress: 100,
      isGoal: true
    },
    progressToNext: 100
  };
};

// Formatting Utilities
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyOrEmpty = (amount: number | null, currency = 'USD'): string => {
  if (amount === null || amount === undefined) return 'Not Entered';
  return formatCurrency(amount, currency);
};

export const formatNumberOrEmpty = (value: number | null): string => {
  if (value === null || value === undefined) return 'Not Entered';
  return value.toLocaleString();
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
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

// Detailed Validation Functions that return error messages
export const validateAssetValue = (value: number | string): string => {
  if (!value && value !== 0) return 'Asset value is required';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'Asset value must be a valid number';  
  if (numValue <= 0) return 'Asset value must be greater than $0';
  return '';
};

export const validateDebtBalance = (balance: number | string): string => {
  if (!balance && balance !== 0) return 'Debt balance is required';
  const numValue = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(numValue)) return 'Debt balance must be a valid number';
  if (numValue <= 0) return 'Debt balance must be greater than $0';
  return '';
};

export const validateInterestRate = (rate: number | string): string => {
  if (!rate && rate !== 0) return '';  // Interest rate is optional
  const numValue = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (isNaN(numValue)) return 'Interest rate must be a valid number';
  if (numValue < 0) return 'Interest rate cannot be negative';
  if (numValue > 100) return 'Interest rate cannot be greater than 100%';
  return '';
};

export const validateFinancialAmount = (amount: number | null, fieldName: string): string => {
  if (amount === null || amount === undefined) return `${fieldName} is required`;
  if (isNaN(amount)) return `${fieldName} must be a valid number`;
  if (amount < 0) return `${fieldName} cannot be negative`;
  return '';
};

export const validateGoalTargetAmount = (amount: string | number): string => {
  if (!amount && amount !== 0) return 'Target amount is required';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numValue)) return 'Target amount must be a valid number';
  if (numValue <= 0) return 'Target amount must be greater than $0';
  return '';
};

export const validateGoalCurrentAmount = (current: string | number, target?: string | number): string => {
  if (!current && current !== 0) return '';  // Current amount is optional
  const currentNum = typeof current === 'string' ? parseFloat(current) : current;
  if (isNaN(currentNum)) return 'Current amount must be a valid number';
  if (currentNum < 0) return 'Current amount cannot be negative';
  
  // If target is provided, current shouldn't exceed target
  if (target) {
    const targetNum = typeof target === 'string' ? parseFloat(target) : target;
    if (!isNaN(targetNum) && currentNum > targetNum) {
      return 'Current amount cannot exceed target amount';
    }
  }
  return '';
};

export const validateGoalProgress = (progress: string | number): string => {
  if (!progress && progress !== 0) return '';  // Progress is optional
  const numValue = typeof progress === 'string' ? parseFloat(progress) : progress;
  if (isNaN(numValue)) return 'Progress must be a valid number';
  if (numValue < 0) return 'Progress cannot be negative';
  if (numValue > 100) return 'Progress cannot exceed 100%';
  return '';
};

export const validateSubmilestoneAmount = (amount: string | number, parentTarget?: string | number): string => {
  if (!amount && amount !== 0) return 'Submilestone target amount is required';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numValue)) return 'Target amount must be a valid number';
  if (numValue <= 0) return 'Target amount must be greater than $0';
  
  // If parent target is provided, submilestone shouldn't exceed it
  if (parentTarget) {
    const parentNum = typeof parentTarget === 'string' ? parseFloat(parentTarget) : parentTarget;
    if (!isNaN(parentNum) && numValue > parentNum) {
      return 'Submilestone amount cannot exceed main goal target';
    }
  }
  return '';
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

export const calculateMonthlyTarget = (
  targetAmount: number, 
  currentAmount: number, 
  yearsRemaining: number
): number => {
  const remaining = targetAmount - currentAmount;
  if (yearsRemaining <= 0) return 0;
  return remaining / (yearsRemaining * 12);
}; 