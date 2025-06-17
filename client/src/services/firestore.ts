import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// Basic Information Interface
export interface BasicInfo {
  name: string;
  email: string;
  birthday: string;
  employmentStatus: string;
}

// Financial Information Interface
export interface FinancialInfo {
  annualIncome: number;
  annualExpenses: number;
  totalAssets: number;
  totalDebts: number;
  currentSavings: number;
}

// Financial Goal Interface
export interface FinancialGoal {
  targetAmount: number;
  targetYear: number;
}

// Intermediate Goal Interface
export interface IntermediateGoal {
  id?: string;
  title: string;
  targetAmount: number;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  currentAmount: number;
  description?: string;
}

// Education History Interface
export interface EducationEntry {
  school: string;
  field: string;
  graduationYear: string;
}

// Experience Interface
export interface ExperienceEntry {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description: string;
}

// Skills & Interests Interface
export interface SkillsAndInterests {
  skills: string[];
  interests: string[];
}

// User Profile Interface
export interface UserProfile {
  id?: string;
  userId: string;
  basicInfo: BasicInfo;
  financialInfo: FinancialInfo;
  financialGoal: FinancialGoal;
  intermediateGoals: IntermediateGoal[];
  educationHistory: EducationEntry[];
  experience: ExperienceEntry[];
  skillsAndInterests: SkillsAndInterests;
  createdAt: Date;
  updatedAt: Date;
}

// User Stats Interface
export interface UserStats {
  financialInfo: FinancialInfo | null;
  netWorth: number;
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

// Cloud Function Callable Instances - Following bounceback pattern
const createUserProfileFn = httpsCallable(functions, 'createUserProfile');
const getUserStatsFn = httpsCallable(functions, 'getUserStats');
const getUserProfileFn = httpsCallable(functions, 'getUserProfile');
const saveUserProfileFn = httpsCallable(functions, 'saveUserProfile');
const updateUserProfileSectionFn = httpsCallable(functions, 'updateUserProfileSection');
const getUserGoalsFn = httpsCallable(functions, 'getUserGoals');
const addGoalFn = httpsCallable(functions, 'addGoal');
const updateGoalFn = httpsCallable(functions, 'updateGoal');
const deleteGoalFn = httpsCallable(functions, 'deleteGoal');
const cleanupUserDataFn = httpsCallable(functions, 'cleanupUserData');
const testCallableFn = httpsCallable(functions, 'testCallable');

// Helper function to handle Firebase Functions responses
const handleFunctionCall = async (callableFn: any, data?: any): Promise<any> => {
  try {
    console.log(`Calling cloud function with data:`, data || 'no data');
    const result = await callableFn(data);
    console.log(`Cloud function response:`, result.data);
    return result.data;
  } catch (error: any) {
    console.error(`Error calling cloud function:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      fullError: error
    });
    throw new Error(error.message || `Failed to call cloud function`);
  }
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
export const createUserProfile = async (): Promise<any> => {
  return await handleFunctionCall(createUserProfileFn);
};

export const cleanupUserData = async () => {
  return await handleFunctionCall(cleanupUserDataFn);
};

// Statistics
export const getUserStats = async (): Promise<UserStats> => {
  const response: any = await handleFunctionCall(getUserStatsFn);
  
  return {
    financialInfo: response.financialInfo,
    netWorth: response.netWorth,
  };
};

// Profile Operations
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const response: any = await handleFunctionCall(getUserProfileFn);
  if (!response) return null;
  
  return {
    ...response,
    createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
    updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
  };
};

export const saveUserProfile = async (profileData: Partial<UserProfile>) => {
  return await handleFunctionCall(saveUserProfileFn, profileData);
};

export const updateUserProfileSection = async (section: string, data: any) => {
  return await handleFunctionCall(updateUserProfileSectionFn, { profileSection: section, data });
};

// Goal Operations
export const getUserGoals = async (): Promise<Goal[]> => {
  const response: any = await handleFunctionCall(getUserGoalsFn);
  return response.data ? response.data.map(parseGoal) : [];
};

export const addGoal = async (goalData: {
  title: string;
  targetAmount?: number;
  deadline: string;
  category?: string;
}) => {
  return await handleFunctionCall(addGoalFn, goalData);
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
  // Convert date to ISO string if provided
  const updateData: any = { ...updates };
  if (updates.deadline) {
    updateData.deadline = updates.deadline.toISOString();
  }
  return await handleFunctionCall(updateGoalFn, { goalId, updates: updateData });
};

export const deleteGoal = async (goalId: string) => {
  return await handleFunctionCall(deleteGoalFn, { goalId });
};

// Test function for debugging
export const testCallable = async () => {
  return await handleFunctionCall(testCallableFn);
};

 