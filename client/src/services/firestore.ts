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
  totalAssets: number | null;
  totalDebts: number | null;
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

// AI Plan Interface - designed for AI to save structured financial plans
export interface Plan {
  id?: string;
  userId?: string;
  title: string;
  description: string;
  timeframe: string; // e.g., "6 months", "2 years"
  category: 'investment' | 'savings' | 'debt' | 'income' | 'budget' | 'mixed';
  priority: 'high' | 'medium' | 'low';
  steps: PlanStep[];
  milestones: PlanMilestone[];
  estimatedCost?: number;
  expectedReturn?: number;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites?: string[];
  resources?: PlanResource[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  order: number;
  timeframe: string;
  completed: boolean;
  dueDate?: string;
  cost?: number;
  resources?: string[];
}

export interface PlanMilestone {
  id: string;
  title: string;
  description: string;
  targetAmount?: number;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
}

export interface PlanResource {
  type: 'link' | 'document' | 'tool' | 'contact';
  title: string;
  url?: string;
  description?: string;
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
  assets: Asset[] | null; // null = not entered, [] = no assets
  debts: Debt[] | null;   // null = not entered, [] = no debts
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
  message: string;
  extractedData?: {
    personalInfo?: any;
    financialInfo?: any;
    goals?: any[];
  };
  updatedSections?: any;
  isReadyForPlan?: boolean;
  sessionId?: string;
}

export interface PlanGenerationResponse {
  success: boolean;
  message: string;
  plan?: Plan;
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

// Legacy goal functions (for individual goals)
const addGoalFn = httpsCallable(functions, 'addGoal');
const updateGoalFn = httpsCallable(functions, 'updateGoal');
const deleteGoalFn = httpsCallable(functions, 'deleteGoal');

const cleanupUserDataFn = httpsCallable(functions, 'cleanupUserData');

const savePlanFn = httpsCallable(functions, 'savePlan');
const getUserPlansFn = httpsCallable(functions, 'getUserPlans');
const updatePlanFn = httpsCallable(functions, 'updatePlan');
const deletePlanFn = httpsCallable(functions, 'deletePlan');

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



export const savePlan = async (planData: Partial<Plan>) => {
  return await handleFunctionCall(savePlanFn, planData);
};

export const getUserPlans = async (): Promise<Plan[]> => {
  const response: any = await handleFunctionCall(getUserPlansFn);
  return response.data ? response.data.map((plan: any) => ({
    ...plan,
    createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
    updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date(),
  })) : [];
};

export const updatePlan = async (planId: string, updates: Partial<Plan>) => {
  return await handleFunctionCall(updatePlanFn, { planId, updates });
};

export const deletePlan = async (planId: string) => {
  return await handleFunctionCall(deletePlanFn, { planId });
};

// Generate dynamic milestones based on user's financial goal and intermediate goals
// Chat and AI Functions
export const sendChatMessage = async (message: string, sessionId?: string): Promise<ChatResponse> => {
  const handleChatMessage = httpsCallable(functions, 'handleChatMessage');
  return await handleFunctionCall(handleChatMessage, { message, sessionId });
};

export const generateFinancialPlan = async (goalId?: string, goalData?: any): Promise<PlanGenerationResponse> => {
  const generatePlan = httpsCallable(functions, 'generateFinancialPlan');
  return await handleFunctionCall(generatePlan, { goalId, goalData });
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

 