import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// Basic Information Interface
export interface BasicInfo {
  name: string | null;
  email: string;
  birthday: string | null;
  location: string | null;
  occupation: string | null;
  country: string | null;
  employmentStatus: string | null;
}

// Asset Interface
export interface Asset {
  id?: string;
  name: string;
  type: 'real-estate' | 'stocks' | 'bonds' | 'savings' | 'retirement' | 'crypto' | 'business' | 'other';
  value: number;
  description?: string;
}

// Debt Interface
export interface Debt {
  id?: string;
  name: string;
  type: 'mortgage' | 'credit-card' | 'student-loan' | 'car-loan' | 'personal-loan' | 'business-loan' | 'other';
  balance: number;
  interestRate?: number;
  description?: string;
}

// Financial Information Interface
export interface FinancialInfo {
  annualIncome: number | null;
  annualExpenses: number | null;
  currentSavings: number | null;
}

// Financial Goal Interface
export interface FinancialGoal {
  targetAmount: number;
  targetYear: number;
  timeframe?: string | null;
  riskTolerance?: string | null;
  primaryStrategy?: string | null;
}

// Submilestone Interface
export interface Submilestone {
  id: string;
  title: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
  completed: boolean;
  completedDate?: string;
  order: number;
}

// Intermediate Goal Interface
export interface IntermediateGoal {
  id?: string;
  title: string;
  type: 'financial' | 'skill' | 'behavior' | 'lifestyle' | 'networking' | 'project';
  targetAmount?: number;
  targetDate?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  currentAmount?: number;
  progress?: number;
  description?: string;
  category?: string;
  submilestones?: Submilestone[];
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

// User Skills Interface (separate backend collection)
export interface UserSkills {
  id?: string;
  userId: string;
  skillsAndInterests: SkillsAndInterests;
  createdAt: Date;
  updatedAt: Date;
}

// Dynamic Milestone Interface
export interface DynamicMilestone {
  id: string;
  amount: number;
  title: string;
  description: string;
  completed: boolean;
  progress: number;
  isGoal?: boolean;
}

// User Profile Interface (contains basic profile info + financial goal - NO skills)
export interface UserProfile {
  id?: string;
  userId: string;
  basicInfo: BasicInfo;
  educationHistory: EducationEntry[];
  experience: ExperienceEntry[];
  financialGoal: FinancialGoal;
  createdAt: Date;
  updatedAt: Date;
}

// Financials Interface (separate collection - only contains financial info)
export interface UserFinancials {
  id?: string;
  userId: string;
  financialInfo: FinancialInfo;
  assets: Asset[] | null; // null = not entered, [] = no assets (AI always returns [])
  debts: Debt[] | null;   // null = not entered, [] = no debts (AI always returns [])
  createdAt: Date;
  updatedAt: Date;
}

// Goals Interface (separate collection)
export interface UserGoals {
  id?: string;
  userId: string;
  intermediateGoals: IntermediateGoal[] | null; // null = not entered, [] = no goals
  createdAt: Date;
  updatedAt: Date;
}

// User Stats Interface
export interface UserStats {
  financialInfo: FinancialInfo | null;
  netWorth: number;
}

// Chat Interfaces
export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

export interface ChatResponse {
  success: boolean;
  message?: string; // Legacy support for old chat
  data?: {
    message: string;
    financialInfo?: any;
    assets?: any[]; // Always array (never null from AI)
    debts?: any[];  // Always array (never null from AI)
    goals?: any[];
    skills?: any;
    usedUserData?: boolean;
    tokensSaved?: number;
    routingDecision?: any;
    responseSource?: string;
    isReadyForPlan?: boolean;
  };
  extractedData?: {
    personalInfo?: any;
    financialInfo?: any;
    goals?: any[];
  };
  updatedSections?: any;
  isReadyForPlan?: boolean;
  sessionId?: string;
}



// Cloud Function Callable Instances - Following bounceback pattern
const createUserProfileFn = httpsCallable(functions, 'createUserProfile');
const getUserStatsFn = httpsCallable(functions, 'getUserStats');
const getUserProfileFn = httpsCallable(functions, 'getUserProfile');
const saveUserProfileFn = httpsCallable(functions, 'saveUserProfile');
const updateUserProfileSectionFn = httpsCallable(functions, 'updateUserProfileSection');

// Financials functions
const getUserFinancialsFn = httpsCallable(functions, 'getUserFinancials');
const saveUserFinancialsFn = httpsCallable(functions, 'saveUserFinancials');
const updateUserFinancialsSectionFn = httpsCallable(functions, 'updateUserFinancialsSection');

// Goals functions
const getUserGoalsFn = httpsCallable(functions, 'getUserIntermediateGoals');
const saveUserGoalsFn = httpsCallable(functions, 'saveUserIntermediateGoals');
const addIntermediateGoalFn = httpsCallable(functions, 'addIntermediateGoal');
const updateIntermediateGoalFn = httpsCallable(functions, 'updateIntermediateGoal');
const deleteIntermediateGoalFn = httpsCallable(functions, 'deleteIntermediateGoal');

// Skills functions (backend collection - not used by frontend directly)
const getUserSkillsFn = httpsCallable(functions, 'getUserSkills');
const saveUserSkillsFn = httpsCallable(functions, 'saveUserSkills');
const updateUserSkillsSectionFn = httpsCallable(functions, 'updateUserSkillsSection');



const cleanupUserDataFn = httpsCallable(functions, 'cleanupUserData');

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
  console.log('getUserStats - Raw backend response:', response);
  console.log('getUserStats - Response.data:', response.data);
  console.log('getUserStats - NetWorth from response:', response.data?.netWorth);
  
  return {
    financialInfo: response.data?.financialInfo || null,
    netWorth: response.data?.netWorth || 0,
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

// Financials Operations
export const getUserFinancials = async (): Promise<UserFinancials | null> => {
  const result = await handleFunctionCall(getUserFinancialsFn);
  if (!result) return null;
  
  return {
    ...result,
    createdAt: result.createdAt?.toDate?.() || new Date(result.createdAt),
    updatedAt: result.updatedAt?.toDate?.() || new Date(result.updatedAt)
  };
};

export const saveUserFinancials = async (financialsData: Partial<UserFinancials>) => {
  return await handleFunctionCall(saveUserFinancialsFn, financialsData);
};

export const updateUserFinancialsSection = async (section: string, data: any) => {
  return await handleFunctionCall(updateUserFinancialsSectionFn, { section, data });
};

// Intermediate Goals Operations
export const getUserIntermediateGoals = async (): Promise<UserGoals | null> => {
  const result = await handleFunctionCall(getUserGoalsFn);
  if (!result) return null;
  
  return {
    ...result,
    createdAt: result.createdAt?.toDate?.() || new Date(result.createdAt),
    updatedAt: result.updatedAt?.toDate?.() || new Date(result.updatedAt)
  };
};

export const saveUserIntermediateGoals = async (goalsData: Partial<UserGoals>) => {
  return await handleFunctionCall(saveUserGoalsFn, goalsData);
};

export const addIntermediateGoal = async (goalData: IntermediateGoal) => {
  return await handleFunctionCall(addIntermediateGoalFn, goalData);
};

export const updateIntermediateGoal = async (goalId: string, updates: Partial<IntermediateGoal>) => {
  return await handleFunctionCall(updateIntermediateGoalFn, { goalId, updates });
};

export const deleteIntermediateGoal = async (goalId: string) => {
  return await handleFunctionCall(deleteIntermediateGoalFn, { goalId });
};

// Skills & Interests Backend Operations (separate collection)
export const getUserSkills = async (): Promise<UserSkills | null> => {
  const result = await handleFunctionCall(getUserSkillsFn);
  if (!result) return null;
  
  return {
    ...result,
    createdAt: result.createdAt?.toDate?.() || new Date(result.createdAt),
    updatedAt: result.updatedAt?.toDate?.() || new Date(result.updatedAt)
  };
};

export const saveUserSkills = async (skillsData: Partial<UserSkills>) => {
  return await handleFunctionCall(saveUserSkillsFn, skillsData);
};

export const updateUserSkillsSection = async (section: string, data: any) => {
  return await handleFunctionCall(updateUserSkillsSectionFn, { section, data });
};







// Generate dynamic milestones based on user's financial goal and intermediate goals
// Chat and AI Functions
export const sendChatMessage = async (message: string, sessionId?: string): Promise<ChatResponse> => {
  const handleSmartChatMessage = httpsCallable(functions, 'handleSmartChatMessage');
  return await handleFunctionCall(handleSmartChatMessage, { message, sessionId });
};



// Tour completion functions
export const updateTourCompletion = async (tourName: string, completed: boolean = true) => {
  const updateTourCompletionFn = httpsCallable(functions, 'updateTourCompletion');
  return await handleFunctionCall(updateTourCompletionFn, { tourName, completed });
};

export const getTourCompletions = async () => {
  const getTourCompletionsFn = httpsCallable(functions, 'getTourCompletions');
  return await handleFunctionCall(getTourCompletionsFn);
};

export const generateDynamicMilestones = (
  currentAmount: number,
  targetAmount: number,
  intermediateGoals: IntermediateGoal[]
): DynamicMilestone[] => {
  console.log('generateDynamicMilestones called with:', { currentAmount, targetAmount });
  
  const milestones: DynamicMilestone[] = [];
  
  // Add standard percentage-based milestones - always show all benchmarks
  const percentages = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0]; // 1%, 5%, 10%, 25%, 50%, 75%, 100%
  
  percentages.forEach((percentage) => {
    const amount = Math.round(targetAmount * percentage); // Round to nearest dollar
    const completed = currentAmount >= amount;
    const progress = currentAmount >= amount ? 100 : Math.max((currentAmount / amount) * 100, 0);
    
    console.log(`Milestone ${(percentage * 100).toFixed(0)}%:`, {
      amount,
      currentAmount,
      completed,
      progress
    });
    
    milestones.push({
      id: `percentage_${percentage}`,
      amount,
      title: percentage === 1.0 ? 'Final Goal - RT1M Achieved!' : `${(percentage * 100).toFixed(0)}% Milestone`,
      description: percentage === 1.0 
        ? 'Congratulations! You\'ve reached your RT1M goal!' 
        : `Reach ${(percentage * 100).toFixed(0)}% of your target amount`,
      completed,
      progress,
      isGoal: percentage === 1.0
    });
  });
  
  // Sort by amount to ensure proper order
  return milestones.sort((a, b) => a.amount - b.amount);
};

 