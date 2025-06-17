import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize Firebase Functions
const functions = getFunctions();

// User Profile Interface
export interface UserProfile {
  id?: string;
  userId: string;
  // Basic Information
  birthday?: string;
  employmentStatus?: string;
  // Financial Information
  income?: number;
  expenses?: number;
  currentSavings?: number;
  assets?: number;
  debts?: number;
  // Financial Goal
  targetAmount?: number;
  targetAge?: number;
  targetYear?: number;
  // Education History
  education?: Array<{
    id: number;
    school: string;
    major: string;
    graduationYear: string;
  }>;
  // Skills and Interests
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// User Progress Interface
export interface UserProgress {
  id?: string;
  userId: string;
  currentAmount: number;
  targetAmount: number;
  goalDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Stats Interface (simplified without transactions)
export interface UserStats {
  userProgress: UserProgress | null;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
}

// Goal Interface
export interface Goal {
  id?: string;
  userId: string;
  title: string;
  targetAmount?: number;
  deadline: Date;
  category: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to handle Firebase Functions responses
const handleFunctionCall = async (functionName: string, data?: any): Promise<any> => {
  try {
    const fn = httpsCallable(functions, functionName);
    const result = await fn(data);
    return result.data;
  } catch (error: any) {
    console.error(`Error calling ${functionName}:`, error);
    throw new Error(error.message || `Failed to call ${functionName}`);
  }
};

// Helper function to parse dates from ISO strings
const parseUserProgress = (data: any): UserProgress | null => {
  if (!data) return null;
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    goalDate: data.goalDate ? new Date(data.goalDate) : undefined,
  };
};

// Helper function to parse goals from ISO strings
const parseGoal = (data: any): Goal => {
  return {
    ...data,
    deadline: data.deadline ? new Date(data.deadline) : new Date(),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };
};

// User Profile Management
export const createUserProfile = async () => {
  return await handleFunctionCall('createUserProfile');
};

export const cleanupUserData = async () => {
  return await handleFunctionCall('cleanupUserData');
};

// User Progress Operations
export const getUserProgress = async (): Promise<UserProgress | null> => {
  const response: any = await handleFunctionCall('getUserProgress');
  return parseUserProgress(response.data);
};

export const updateUserProgress = async (progressId: string, updates: Partial<UserProgress>) => {
  return await handleFunctionCall('updateUserProgress', { progressId, updates });
};

export const updateProgressTarget = async (targetAmount: number) => {
  return await handleFunctionCall('updateProgressTarget', { targetAmount });
};

// Statistics (simplified without transactions)
export const getUserStats = async (): Promise<UserStats> => {
  const response: any = await handleFunctionCall('getUserStats');
  const stats = response.data;
  
  return {
    userProgress: parseUserProgress(stats.userProgress),
    totalIncome: stats.totalIncome,
    totalExpenses: stats.totalExpenses,
    netAmount: stats.netAmount,
  };
};

// Profile Operations
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const response: any = await handleFunctionCall('getUserProfile');
  if (!response.data) return null;
  
  return {
    ...response.data,
    createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
    updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
  };
};

export const saveUserProfile = async (profileData: Partial<UserProfile>) => {
  return await handleFunctionCall('saveUserProfile', profileData);
};

export const updateUserProfileSection = async (section: string, data: any) => {
  return await handleFunctionCall('updateUserProfileSection', { profileSection: section, data });
};

// Goal Operations
export const getUserGoals = async (): Promise<Goal[]> => {
  const response: any = await handleFunctionCall('getUserGoals');
  return response.data.map(parseGoal);
};

export const addGoal = async (goalData: {
  title: string;
  targetAmount?: number;
  deadline: string;
  category?: string;
}) => {
  return await handleFunctionCall('addGoal', goalData);
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
  // Convert date to ISO string if provided
  const updateData: any = { ...updates };
  if (updates.deadline) {
    updateData.deadline = updates.deadline.toISOString();
  }
  return await handleFunctionCall('updateGoal', { goalId, updates: updateData });
};

export const deleteGoal = async (goalId: string) => {
  return await handleFunctionCall('deleteGoal', { goalId });
};

// Legacy function names for backward compatibility
export const updateUserProgressDirect = updateUserProgress; 