import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { 
  getUserProfile,
  getUserStats,
  getUserIntermediateGoals,
  addIntermediateGoal,
  updateIntermediateGoal,
  deleteIntermediateGoal,
  UserProfile,
  UserStats,
  UserGoals,
  IntermediateGoal
} from '../services/firestore';

export interface UseGoalsReturn {
  // State
  loading: boolean;
  saving: boolean;
  profile: UserProfile | null;
  stats: UserStats | null;
  goals: UserGoals | null;
  
  // Actions
  refreshData: () => Promise<void>;
  addGoal: (goal: IntermediateGoal) => Promise<void>;
  updateGoal: (goalId: string, goal: IntermediateGoal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  
  // Calculations
  calculateMainGoalProgress: () => number;
  calculateYearsRemaining: () => number;
  calculateMonthlyTarget: () => number;
  getMainGoalStatus: () => string;
}

export const useGoals = (): UseGoalsReturn => {
  const { currentUser } = useAuth();
  const { registerDataRefreshCallback, unregisterDataRefreshCallback } = useChatContext();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);

  // Refresh data function
  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Refreshing goals data due to AI update');
      const [profileData, statsData, goalsData] = await Promise.all([
        getUserProfile(),
        getUserStats(),
        getUserIntermediateGoals()
      ]);
      
      setProfile(profileData);
      setStats(statsData);
      setGoals(goalsData);
      
      console.log('Goals data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing goals data:', error);
    }
  }, [currentUser]);

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const [profileData, statsData, goalsData] = await Promise.all([
          getUserProfile(),
          getUserStats(),
          getUserIntermediateGoals()
        ]);
        setProfile(profileData);
        setStats(statsData);
        setGoals(goalsData);
      } catch (error) {
        console.error('Error loading goals data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Register for data refresh callbacks from chat
  useEffect(() => {
    registerDataRefreshCallback(refreshData);
    
    return () => {
      unregisterDataRefreshCallback(refreshData);
    };
  }, [refreshData, registerDataRefreshCallback, unregisterDataRefreshCallback]);

  // Actions
  const addGoal = async (goal: IntermediateGoal) => {
    setSaving(true);
    try {
      await addIntermediateGoal(goal);
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateGoal = async (goalId: string, goal: IntermediateGoal) => {
    setSaving(true);
    try {
      await updateIntermediateGoal(goalId, goal);
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (goalId: string) => {
    setSaving(true);
    try {
      await deleteIntermediateGoal(goalId);
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const calculateMainGoalProgress = () => {
    if (!profile?.financialGoal?.targetAmount || !stats?.netWorth) return 0;
    return Math.min((stats.netWorth / profile.financialGoal.targetAmount) * 100, 100);
  };

  const calculateYearsRemaining = () => {
    if (!profile?.financialGoal?.targetYear) return 0;
    return Math.max(profile.financialGoal.targetYear - new Date().getFullYear(), 0);
  };

  const calculateMonthlyTarget = () => {
    if (!profile?.financialGoal?.targetAmount || !stats?.netWorth) return 0;
    const remaining = profile.financialGoal.targetAmount - stats.netWorth;
    const yearsRemaining = calculateYearsRemaining();
    if (yearsRemaining <= 0) return 0;
    return remaining / (yearsRemaining * 12);
  };

  const getMainGoalStatus = () => {
    const progress = calculateMainGoalProgress();
    if (progress >= 100) return 'Achieved';
    if (progress >= 75) return 'On Track';
    if (progress >= 50) return 'Making Progress';
    if (progress >= 25) return 'Getting Started';
    return 'Just Starting';
  };

  return {
    // State
    loading,
    saving,
    profile,
    stats,
    goals,
    
    // Actions
    refreshData,
    addGoal,
    updateGoal,
    deleteGoal,
    
    // Calculations
    calculateMainGoalProgress,
    calculateYearsRemaining,
    calculateMonthlyTarget,
    getMainGoalStatus,
  };
}; 