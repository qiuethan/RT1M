import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { Card, Button, Badge, Modal, Input, Select, DatePicker, LoadingSpinner, ChatHelpModal } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { 
  getUserStats, 
  getUserProfile,
  getUserIntermediateGoals,
  addIntermediateGoal,
  UserStats,
  UserProfile,
  UserGoals,
  IntermediateGoal
} from '../services/firestore';
import { generateNextMilestone } from '../utils/financial';
import { isFormChanged, useUnsavedChanges, UnsavedChangesPrompt } from '../utils/unsavedChanges';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { registerDataRefreshCallback, unregisterDataRefreshCallback } = useChatContext();

  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextMilestone, setNextMilestone] = useState<{ nextMilestone: any; progressToNext: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IntermediateGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressForm, setProgressForm] = useState({
    currentAmount: '',
    progress: ''
  });
  const [editingGoal, setEditingGoal] = useState<IntermediateGoal | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    type: 'financial' as 'financial' | 'skill' | 'behavior' | 'lifestyle' | 'networking' | 'project',
    targetAmount: '',
    currentAmount: '',
    progress: '',
    targetDate: '',
    status: 'Not Started',
    description: '',
    category: '',
    submilestones: [] as Array<{
      id: string;
      title: string;
      description: string;
      targetAmount: string;
      targetDate: string;
      completed: boolean;
      order: number;
    }>
  });
  
  // Original form for change detection
  const [originalGoalForm, setOriginalGoalForm] = useState(goalForm);

  // Unsaved changes protection (only when modal is open and has changes)
  const hasUnsavedGoalChanges = showModal && isFormChanged(originalGoalForm, goalForm);
  const { showPrompt, confirmNavigation, cancelNavigation } = useUnsavedChanges(
    hasUnsavedGoalChanges,
    'You have unsaved changes to your goal. Are you sure you want to leave without saving?'
  );

  // Memoized calculated progress values to prevent unnecessary re-renders during tour
  const progressValues = useMemo(() => {
    const currentAmount = stats?.netWorth || 0;
    const targetAmount = profile?.financialGoal?.targetAmount ?? 1000000;
    const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    
    return { currentAmount, targetAmount, progressPercentage };
  }, [stats?.netWorth, profile?.financialGoal?.targetAmount]);

  const { currentAmount, targetAmount, progressPercentage } = progressValues;

  const goalTypeOptions = [
    { value: 'financial', label: '💰 Financial Goals' },
    { value: 'skill', label: '🧠 Skill-Based Goals' },
    { value: 'behavior', label: '📊 Financial Behavior Goals' },
    { value: 'lifestyle', label: '🏋️ Lifestyle Discipline Goals' },
    { value: 'networking', label: '💬 Networking & Mentorship Goals' },
    { value: 'project', label: '🛠️ Project / Output-Based Goals' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return '💰';
      case 'skill': return '🧠';
      case 'behavior': return '📊';
      case 'lifestyle': return '🏋️';
      case 'networking': return '💬';
      case 'project': return '🛠️';
      default: return '🎯';
    }
  };

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'skill':
        return 'bg-blue-100 text-blue-800';
      case 'behavior':
        return 'bg-purple-100 text-purple-800';
      case 'lifestyle':
        return 'bg-orange-100 text-orange-800';
      case 'networking':
        return 'bg-pink-100 text-pink-800';
      case 'project':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-surface-100 text-surface-800';
    }
  };

  const getGoalProgress = (goal: IntermediateGoal) => {
    if (goal.type === 'financial' && goal.targetAmount && goal.targetAmount > 0) {
      return ((goal.currentAmount || 0) / goal.targetAmount) * 100;
    } else {
      return goal.progress || 0;
    }
  };

  // Submilestone management functions
  const addSubmilestone = () => {
    const newSubmilestone = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: '',
      description: '',
      targetAmount: '',
      targetDate: '',
      completed: false,
      order: goalForm.submilestones.length
    };
    setGoalForm({
      ...goalForm,
      submilestones: [...goalForm.submilestones, newSubmilestone]
    });
  };

  const updateSubmilestone = (index: number, field: string, value: any) => {
    const updatedSubmilestones = [...goalForm.submilestones];
    updatedSubmilestones[index] = { ...updatedSubmilestones[index], [field]: value };
    setGoalForm({
      ...goalForm,
      submilestones: updatedSubmilestones
    });
  };

  const removeSubmilestone = (index: number) => {
    const updatedSubmilestones = goalForm.submilestones.filter((_, i) => i !== index);
    // Reorder remaining submilestones
    const reorderedSubmilestones = updatedSubmilestones.map((sub, i) => ({ ...sub, order: i }));
    setGoalForm({
      ...goalForm,
      submilestones: reorderedSubmilestones
    });
  };

  const handleDeleteGoal = async (_goalId: string) => {
    try {
      // For now, just reload the data after delete
      // You may want to implement a proper delete function
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const openDetailsModal = (goal: IntermediateGoal) => {
    setSelectedGoal(goal);
    setProgressForm({
      currentAmount: goal.currentAmount?.toString() || '',
      progress: goal.progress?.toString() || ''
    });
    setShowDetailsModal(true);
  };

  const handleProgressUpdate = async () => {
    if (!selectedGoal) return;

    try {
      setSavingProgress(true);
      
      const updatedGoal: IntermediateGoal = {
        ...selectedGoal,
        currentAmount: selectedGoal.type === 'financial' ? (parseFloat(progressForm.currentAmount) || 0) : selectedGoal.currentAmount,
        progress: selectedGoal.type !== 'financial' ? (parseFloat(progressForm.progress) || 0) : selectedGoal.progress
      };

      await addIntermediateGoal(updatedGoal);
      
      // Update the selected goal state
      setSelectedGoal(updatedGoal);
      
      // Reload goals data
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
      
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSubmilestoneToggle = async (submilestoneId: string) => {
    if (!selectedGoal || !selectedGoal.submilestones) return;

    try {
      const updatedSubmilestones = selectedGoal.submilestones.map(sub => 
        sub.id === submilestoneId ? { ...sub, completed: !sub.completed } : sub
      );

      const updatedGoal: IntermediateGoal = {
        ...selectedGoal,
        submilestones: updatedSubmilestones
      };

      await addIntermediateGoal(updatedGoal);
      
      // Update the selected goal state
      setSelectedGoal(updatedGoal);
      
      // Reload goals data
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
      
    } catch (error) {
      console.error('Error updating submilestone:', error);
    }
  };



  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) {
        console.log('Dashboard - No current user, skipping data load');
        return;
      }
      
      console.log('Dashboard - Starting data load for user:', currentUser.uid);
      
      try {
        setLoading(true);
        
        console.log('Dashboard - Loading stats...');
        const userStats = await getUserStats();
        console.log('Dashboard - Stats loaded:', userStats);
        console.log('Dashboard - Stats netWorth:', userStats?.netWorth);
        console.log('Dashboard - Stats full object:', JSON.stringify(userStats, null, 2));
        
        console.log('Dashboard - Loading profile...');
        const userProfile = await getUserProfile();
        console.log('Dashboard - Profile loaded:', userProfile);
        
        console.log('Dashboard - Loading goals...');
        const userGoals = await getUserIntermediateGoals();
        console.log('Dashboard - Goals loaded:', userGoals);
        
        setStats(userStats);
        setProfile(userProfile);
        setGoals(userGoals);

        // Set user name for personalization
        if (userProfile?.basicInfo?.name) {
          setUserName(userProfile.basicInfo.name.split(' ')[0]); // Use first name only
        } else {
          // Fallback to displayName or email prefix
          const fallbackName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
          setUserName(fallbackName.split(' ')[0]);
        }

        // Generate next milestone
        if (userStats && userProfile) {
          const currentAmount = userStats.netWorth || 0;
          const targetAmount = userProfile.financialGoal?.targetAmount || 1000000;
          
          console.log('Dashboard - Generating next milestone with:', {
            currentAmount,
            targetAmount,
            netWorth: userStats.netWorth
          });
          
          const milestone = generateNextMilestone(currentAmount, targetAmount);
          console.log('Dashboard - Generated milestone:', milestone);
          setNextMilestone(milestone);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert(`Dashboard loading error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  // Register for data refresh callbacks from chat
  useEffect(() => {
    const refreshData = async () => {
      if (!currentUser) return;
      
      try {
        console.log('Dashboard - Refreshing data due to AI update');
        const [userStats, userProfile, userGoals] = await Promise.all([
          getUserStats(),
          getUserProfile(),
          getUserIntermediateGoals()
        ]);
        
        setStats(userStats);
        setProfile(userProfile);
        setGoals(userGoals);

        // Set user name for personalization
        if (userProfile?.basicInfo?.name) {
          setUserName(userProfile.basicInfo.name.split(' ')[0]);
        }

        // Generate next milestone
        if (userStats && userProfile) {
          const currentAmount = userStats.netWorth || 0;
          const targetAmount = userProfile.financialGoal?.targetAmount || 1000000;
          const milestone = generateNextMilestone(currentAmount, targetAmount);
          setNextMilestone(milestone);
        }
        
        console.log('Dashboard - Data refreshed successfully');
      } catch (error) {
        console.error('Dashboard - Error refreshing data:', error);
      }
    };

    registerDataRefreshCallback(refreshData);
    
    return () => {
      unregisterDataRefreshCallback(refreshData);
    };
  }, [currentUser, registerDataRefreshCallback, unregisterDataRefreshCallback]);



  const openAddModal = () => {
    setEditingGoal(null);
    const newForm = {
      title: '',
      type: 'financial' as 'financial' | 'skill' | 'behavior' | 'lifestyle' | 'networking' | 'project',
      targetAmount: '',
      currentAmount: '',
      progress: '',
      targetDate: '',
      status: 'Not Started',
      description: '',
      category: '',
      submilestones: []
    };
    setGoalForm(newForm);
    setOriginalGoalForm(newForm);
    setShowModal(true);
  };

  const openEditModal = (goal: IntermediateGoal) => {
    setEditingGoal(goal);
    const editForm = {
      title: goal.title,
      type: goal.type,
      targetAmount: goal.targetAmount?.toString() || '',
      currentAmount: goal.currentAmount?.toString() || '',
      progress: goal.progress?.toString() || '',
      targetDate: goal.targetDate || '',
      status: goal.status,
      description: goal.description || '',
      category: goal.category || '',
      submilestones: (goal.submilestones || []).map(sub => ({
        id: sub.id,
        title: sub.title,
        description: sub.description || '',
        targetAmount: sub.targetAmount?.toString() || '',
        targetDate: sub.targetDate || '',
        completed: sub.completed,
        order: sub.order
      }))
    };
    setGoalForm(editForm);
    setOriginalGoalForm(editForm);
    setShowModal(true);
  };

  const handleSaveGoal = async () => {
    if (!goalForm.title || !goalForm.type) return;

    try {
      setSaving(true);
      
      const newGoal: IntermediateGoal = {
        id: editingGoal?.id || Date.now().toString(),
        title: goalForm.title,
        type: goalForm.type,
        targetAmount: goalForm.type === 'financial' ? (parseFloat(goalForm.targetAmount) || 0) : undefined,
        currentAmount: goalForm.type === 'financial' ? (parseFloat(goalForm.currentAmount) || 0) : undefined,
        progress: goalForm.type !== 'financial' ? (parseFloat(goalForm.progress) || 0) : undefined,
        targetDate: goalForm.targetDate || undefined,
        status: goalForm.status as 'Not Started' | 'In Progress' | 'Completed',
        description: goalForm.description || undefined,
        category: goalForm.category || undefined,
        submilestones: goalForm.submilestones.map(sub => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          targetAmount: sub.targetAmount ? parseFloat(sub.targetAmount) : undefined,
          targetDate: sub.targetDate || undefined,
          completed: sub.completed,
          order: sub.order
        }))
      };

      await addIntermediateGoal(newGoal);
      
      // Reload goals data
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
      setShowModal(false);
      
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/20 to-secondary-50/30 flex items-center justify-center">
        <LoadingSpinner 
          size="xl" 
          variant="primary" 
          text="Loading your dashboard..." 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/20 to-secondary-50/30 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Welcome back, {userName || 'there'}!
              </h1>
              <p className="text-surface-600 mt-1 sm:mt-2 text-sm sm:text-base">Track your journey to ${targetAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Progress to Target & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Progress to Target */}
          <Card variant="gradient" className="lg:col-span-2 p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-surface-900 mb-1 sm:mb-2">Progress to ${targetAmount.toLocaleString()}</h2>
              <p className="text-surface-600 text-sm sm:text-base">Your current net worth journey</p>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="mb-4 sm:mb-6 relative">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-medium text-surface-600">Current Net Worth</span>
                <span className="text-xs sm:text-sm font-medium text-surface-900">
                  ${currentAmount.toLocaleString()} / ${targetAmount.toLocaleString()}
                </span>
              </div>
              
              {/* Progress Bar Container - Simplified for mobile */}
              <div className="relative">
                {/* Background Track */}
                <div className="w-full bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 rounded-full h-6 sm:h-8 shadow-inner overflow-hidden">
                  {/* Animated Background Pattern - Hidden on small screens for performance */}
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  
                  {/* Progress Fill */}
                  <div 
                    className="relative h-6 sm:h-8 rounded-full transition-all duration-1000 ease-out overflow-hidden"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                >
                    {/* Multi-layer gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-cyan-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/80 via-secondary-500/80 to-accent-400/80 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20"></div>
                    
                    {/* Animated shine effect - Hidden on mobile for performance */}
                    <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide-shine"></div>
                    
                    {/* Sparkle effects - Simplified for mobile */}
                    {progressPercentage > 25 && (
                      <div className="absolute top-1 sm:top-1 left-2 sm:left-8 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
                    )}
                    {progressPercentage > 50 && (
                      <div className="hidden sm:block absolute top-1 left-1/2 w-1 h-1 bg-white rounded-full animate-twinkle-delay-2"></div>
                    )}
                  </div>
                  
                  {/* Progress Indicator */}
                  <div 
                    className="absolute top-0 transform -translate-x-1/2 transition-all duration-1000 ease-out"
                    style={{ left: `${Math.min(progressPercentage, 100)}%` }}
                  >
                    <div className="relative">
                      {/* Main indicator - smaller on mobile */}
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-primary-500">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary-500 rounded-full"></div>
                </div>
                      
                      {/* Shooting star effect for high progress - Hidden on mobile */}
                      {progressPercentage > 80 && (
                        <div className="hidden sm:block absolute -top-2 -left-2 w-12 h-12">
                          <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                          <div className="absolute top-1 left-1 w-1 h-1 bg-yellow-300 rounded-full animate-bounce"></div>
                          <div className="absolute top-3 left-6 w-1 h-1 bg-yellow-300 rounded-full animate-bounce delay-75"></div>
              </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Milestone Markers - Simplified for mobile */}
                <div className="absolute top-0 w-full h-6 sm:h-8 pointer-events-none">
                  {[25, 50, 75].map((milestone) => (
                    <div
                      key={milestone}
                      className={`absolute top-0 h-6 sm:h-8 w-0.5 transform -translate-x-1/2 transition-colors duration-500 ${
                        progressPercentage >= milestone ? 'bg-white/60' : 'bg-surface-400/40'
                      }`}
                      style={{ left: `${milestone}%` }}
                    >
                      <div className={`hidden sm:block absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium transition-colors duration-500 ${
                        progressPercentage >= milestone ? 'text-primary-600' : 'text-surface-500'
                      }`}>
                        {milestone}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Progress Stats - Mobile optimized layout */}
              <div className="grid grid-cols-2 sm:flex sm:justify-between gap-4 sm:gap-0 mt-4 sm:mt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    {progressPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs sm:text-sm text-surface-600">Complete</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm sm:text-lg lg:text-xl font-semibold text-surface-700">
                    ${(targetAmount - currentAmount).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-surface-600">Remaining</div>
                </div>
                
                {progressPercentage > 0 && (
                  <div className="text-center col-span-2 sm:col-span-1">
                    <div className="text-sm sm:text-lg lg:text-xl font-semibold text-green-600">
                      +${currentAmount.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-surface-600">Progress Made</div>
                  </div>
                )}
              </div>
              
              {/* Motivational Message */}
              <div className="text-center mt-3 sm:mt-4">
                {progressPercentage >= 100 ? (
                  <div className="text-sm sm:text-base lg:text-lg font-semibold text-green-600 animate-bounce">
                    🎉 Congratulations! You've reached your goal! 🎉
                  </div>
                ) : progressPercentage >= 75 ? (
                  <div className="text-xs sm:text-sm text-primary-600 font-medium">
                    🌟 Amazing! You're in the final stretch!
                  </div>
                ) : progressPercentage >= 50 ? (
                  <div className="text-xs sm:text-sm text-secondary-600 font-medium">
                    🚀 Great progress! You're halfway there!
                  </div>
                ) : progressPercentage >= 25 ? (
                  <div className="text-xs sm:text-sm text-accent-600 font-medium">
                    💪 Keep it up! You're building momentum!
                  </div>
                ) : progressPercentage > 0 ? (
                  <div className="text-xs sm:text-sm text-surface-600 font-medium">
                    🌱 Every journey begins with a single step!
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-surface-600 font-medium">
                    🎯 Ready to start your wealth-building journey?
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card variant="primary" className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-primary-800 mb-3 sm:mb-4">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
                onClick={() => navigate('/chatbot')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI Assistant
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
                onClick={() => setShowHelpModal(true)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chatbot Help & Tips
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
                onClick={() => navigate('/goals')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Manage Goals
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
                onClick={() => navigate('/financials')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Manage Financials
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
                onClick={() => navigate('/profile')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Update Profile
              </Button>

            </div>
          </Card>
        </div>

        {/* Intermediate Goals */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-surface-900">Your Intermediate Goals</h2>
            <Button onClick={() => navigate('/goals')} variant="outline">
              View All Goals
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Goals */}
            {goals?.intermediateGoals && goals.intermediateGoals
              .slice()
              .sort((a, b) => {
                // Sort by target date, with goals without dates at the end
                if (!a.targetDate && !b.targetDate) return 0;
                if (!a.targetDate) return 1;
                if (!b.targetDate) return -1;
                return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
              })
              .slice(0, 2)
              .map((goal, index) => (
              <div key={goal.id || index} className="cursor-pointer" onClick={() => openDetailsModal(goal)}>
                <Card variant="glass" className="p-6 h-[400px] flex flex-col" hover>
                {/* Header Section - Fixed Height */}
                <div className="h-20 mb-4 flex-shrink-0">
                  {/* Header with icon and title */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-lg mt-0.5 flex-shrink-0">{getGoalTypeIcon(goal.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-surface-900 leading-tight break-words line-clamp-2" title={goal.title}>
                        {goal.title}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(goal);
                      }}
                      className="text-surface-400 hover:text-surface-600 transition-colors flex-shrink-0 ml-2"
                      title="Edit goal"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Tags row */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getGoalTypeColor(goal.type)}`}>
                      {goal.type}
                    </span>
                    <Badge 
                      variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'primary' : 'neutral' as any} 
                      className="px-3 py-1 text-xs font-medium"
                    >
                    {goal.status}
                  </Badge>
                  </div>
                </div>
                
                {/* Progress Section - Fixed Height */}
                <div className="h-16 mb-4 flex-shrink-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-surface-600">Progress</span>
                    <span className="text-sm font-medium text-surface-600">
                      {getGoalProgress(goal).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.type === 'financial' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ 
                        width: `${Math.min(getGoalProgress(goal), 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Details Section - Fixed Height */}
                <div className="h-20 mb-4 flex-shrink-0">
                  <div className="space-y-2 text-sm">
                  {goal.type === 'financial' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-surface-500">Current:</span>
                          <span className="font-medium">{formatCurrency(goal.currentAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-500">Target:</span>
                          <span className="font-medium">{formatCurrency(goal.targetAmount || 0)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-surface-500">Progress:</span>
                        <span className="font-medium">{(goal.progress || 0).toFixed(0)}% Complete</span>
                      </div>
                    )}
                    {goal.targetDate && (
                      <div className="flex justify-between">
                        <span className="text-surface-500">Due:</span>
                        <span className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flexible Content Section */}
                <div className="flex-1 overflow-hidden">
                  {goal.description && (
                    <div className="mb-3 p-2 bg-surface-50 rounded text-xs text-surface-600">
                      <div className="line-clamp-3">
                        {goal.description}
                      </div>
                    </div>
                  )}
                  {goal.submilestones && goal.submilestones.length > 0 && (
                    <div className="pt-2 border-t border-surface-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-surface-500">Submilestones</span>
                        <span className="text-xs text-surface-500">
                          {goal.submilestones.filter(sub => sub.completed).length}/{goal.submilestones.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {goal.submilestones.slice(0, 2).map((submilestone) => (
                          <div key={submilestone.id} className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              submilestone.completed ? 'bg-green-500' : 'bg-surface-300'
                            }`}></div>
                            <span className={`truncate ${
                              submilestone.completed ? 'text-surface-500 line-through' : 'text-surface-700'
                            }`}>
                              {submilestone.title}
                            </span>
                          </div>
                        ))}
                        {goal.submilestones.length > 2 && (
                          <div className="text-xs text-surface-500 text-center">
                            +{goal.submilestones.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              </div>
            ))}

            {/* Add New Goal Card - Hidden on mobile */}
            <div 
              className="hidden sm:flex p-6 border-2 border-dashed border-surface-300 hover:border-primary-300 transition-colors cursor-pointer bg-white rounded-lg shadow-sm h-[400px] items-center justify-center"
              onClick={openAddModal}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-surface-900 mb-2">
                  Add New Goal
                </h3>
                <p className="text-sm text-surface-600">
                  Set a new intermediate goal to track your progress
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Milestone */}
        <Card variant="secondary" className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Next Milestone</h3>
          {nextMilestone?.nextMilestone ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  nextMilestone.nextMilestone.completed ? 'bg-secondary-500' : 'bg-primary-500 animate-pulse'
                }`}>
                  {nextMilestone.nextMilestone.completed ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : nextMilestone.nextMilestone.isGoal ? (
                    <div className="text-white text-lg">🎯</div>
                  ) : (
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-surface-900 text-lg">
                      ${nextMilestone.nextMilestone.amount.toLocaleString()}
                      {nextMilestone.nextMilestone.isGoal && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">FINAL GOAL</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-primary-600">
                      {nextMilestone.progressToNext.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-surface-600 mb-2">{nextMilestone.nextMilestone.title}</div>
                  <div className="text-sm text-surface-500 mb-3">{nextMilestone.nextMilestone.description}</div>
                  
                  {!nextMilestone.nextMilestone.completed && (
                    <div className="w-full bg-surface-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(nextMilestone.progressToNext, 100)}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {nextMilestone.nextMilestone.completed && (
                    <div className="text-sm font-medium text-secondary-600 mt-2">
                      🎉 Congratulations! All milestones completed!
                    </div>
                  )}
                </div>
              </div>
              
              {!nextMilestone.nextMilestone.completed && (
                <div className="bg-surface-50 rounded-lg p-4 mt-4">
                  <div className="text-sm text-surface-600">
                    <div className="flex justify-between items-center">
                      <span>Current Net Worth:</span>
                      <span className="font-medium">${currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Amount Needed:</span>
                      <span className="font-medium text-primary-600">
                        ${Math.max(0, nextMilestone.nextMilestone.amount - currentAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-500">
              <div className="text-4xl mb-2">🎯</div>
              <p>Complete your profile to see your next milestone</p>
            </div>
          )}
        </Card>

      </div>
      <Footer />
      
      {/* Mini Chatbot */}
      <MiniChatbot />

      {/* ChatHelpModal */}
      <ChatHelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
      
              {/* Goal Edit/Add Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
          size="lg"
        >
          <div className="space-y-2 sm:space-y-3">
            <Input
              label="Goal Title"
              value={goalForm.title}
            onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
            placeholder="Save $10,000 for emergency fund"
            />
            
            <Select
              label="Goal Type"
              value={goalForm.type}
            onChange={(e) => setGoalForm({...goalForm, type: e.target.value as any})}
              options={goalTypeOptions}
            />
            
            {goalForm.type === 'financial' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <Input
                  label="Target Amount ($)"
                  type="number"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})}
                  placeholder="10000"
                />
                <Input
                  label="Current Amount ($)"
                  type="number"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({...goalForm, currentAmount: e.target.value})}
                  placeholder="2500"
                />
              </div>
            ) : (
              <Input
                label="Progress (%)"
                type="number"
                value={goalForm.progress}
                onChange={(e) => setGoalForm({...goalForm, progress: e.target.value})}
                placeholder="25"
              />
            )}
            
              <DatePicker
                label="Target Date (Optional)"
                value={goalForm.targetDate}
            onChange={(date) => setGoalForm({...goalForm, targetDate: date || ''})}
              />
          
              <Select
                label="Status"
                value={goalForm.status}
            onChange={(e) => setGoalForm({...goalForm, status: e.target.value})}
                options={[
                  { value: 'Not Started', label: 'Not Started' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' }
                ]}
          />
          
                      <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-medium text-surface-700">
                Description (Optional)
              </label>
              <textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                placeholder="Additional details about this goal..."
                rows={2}
                className="w-full px-2 py-1.5 text-base border border-surface-300 rounded-md shadow-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
                      {/* Submilestones Section */}
            <div className="border-t pt-2 sm:pt-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm sm:text-base font-medium text-surface-900">Submilestones</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubmilestone}
                  className="px-2 py-1 text-xs"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">Add Submilestone</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>

            {goalForm.submilestones.length > 0 ? (
              <div className="space-y-3">
                {goalForm.submilestones.map((submilestone, index) => (
                  <div key={submilestone.id} className="p-3 border border-surface-200 rounded-lg bg-surface-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-surface-700">Submilestone {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSubmilestone(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
            <Input
                        label="Title"
                        value={submilestone.title}
                        onChange={(e) => updateSubmilestone(index, 'title', e.target.value)}
                        placeholder="Submilestone title"
                      />
                      
                      <div className={`grid gap-2 ${goalForm.type === 'financial' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {goalForm.type === 'financial' && (
                          <Input
                            label="Target Amount ($)"
                            type="number"
                            value={submilestone.targetAmount}
                            onChange={(e) => updateSubmilestone(index, 'targetAmount', e.target.value)}
                            placeholder="1000"
                          />
                        )}
                        <DatePicker
                          label="Target Date"
                          value={submilestone.targetDate}
                          onChange={(date) => updateSubmilestone(index, 'targetDate', date || '')}
            />
          </div>
          
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-surface-700">
                          Description
                        </label>
                        <textarea
                          value={submilestone.description}
                          onChange={(e) => updateSubmilestone(index, 'description', e.target.value)}
                          placeholder="Brief description of this submilestone..."
                          rows={2}
                          className="w-full px-2 py-1.5 text-base border border-surface-300 rounded-md shadow-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`submilestone-${index}-completed`}
                          checked={submilestone.completed}
                          onChange={(e) => updateSubmilestone(index, 'completed', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`submilestone-${index}-completed`} className="text-sm text-surface-700">
                          Completed
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500 text-center py-4">
                No submilestones added yet. Break down your goal into smaller, manageable steps.
              </p>
            )}
          </div>
          
                      <div className="flex justify-between pt-2 sm:pt-3">
              {editingGoal && editingGoal.id && (
                <Button 
                  variant="outline" 
                  onClick={() => handleDeleteGoal(editingGoal.id!)}
                  className="text-red-600 hover:text-red-700 px-2 py-1 text-xs sm:text-sm"
                  size="sm"
                >
                  <span className="hidden sm:inline">Delete Goal</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              )}
              <div className="flex space-x-2 sm:space-x-3 ml-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  size="sm"
                  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveGoal} 
                  loading={saving}
                  disabled={saving || !isFormChanged(originalGoalForm, goalForm)}
                  variant={isFormChanged(originalGoalForm, goalForm) ? 'primary' : 'outline'}
                  size="sm"
                  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">{editingGoal ? 'Update Goal' : 'Add Goal'}</span>
                  <span className="sm:hidden">{editingGoal ? 'Update' : 'Add'}</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>

            {/* Goal Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Goal Details"
        size="md"
      >
        {selectedGoal && (
          <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">{getGoalTypeIcon(selectedGoal.type)}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-surface-900 mb-1 leading-tight">{selectedGoal.title}</h3>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getGoalTypeColor(selectedGoal.type)}`}>
                    {selectedGoal.type}
                  </span>
                  <Badge 
                    variant={selectedGoal.status === 'Completed' ? 'success' : selectedGoal.status === 'In Progress' ? 'primary' : 'neutral' as any}
                    className="px-2 py-0.5 text-xs font-medium"
                  >
                    {selectedGoal.status}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedGoal);
                }}
                className="px-2 py-1 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Edit Goal</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-surface-600">Progress</span>
                <span className="text-sm font-medium text-surface-600">
                  {getGoalProgress(selectedGoal).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-surface-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    selectedGoal.type === 'financial' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ 
                    width: `${Math.min(getGoalProgress(selectedGoal), 100)}%` 
                  }}
                ></div>
              </div>
            </div>

                          {/* Progress Update Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-2">Update Progress</h4>
                <div className="space-y-2">
                  {selectedGoal.type === 'financial' ? (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 mb-1">
                        Current Amount ($)
                      </label>
                      <input
                        type="number"
                        value={progressForm.currentAmount}
                        onChange={(e) => setProgressForm({...progressForm, currentAmount: e.target.value})}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-surface-300 rounded-md shadow-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter current amount"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-surface-700 mb-1">
                        Progress (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={progressForm.progress}
                        onChange={(e) => setProgressForm({...progressForm, progress: e.target.value})}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-surface-300 rounded-md shadow-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter progress percentage"
                      />
                    </div>
                  )}
                  <Button
                    onClick={handleProgressUpdate}
                    disabled={savingProgress || (selectedGoal.type === 'financial' ? !progressForm.currentAmount : !progressForm.progress)}
                    loading={savingProgress}
                    size="sm"
                    className="w-full px-2 py-1 text-xs sm:text-sm"
                  >
                    {savingProgress ? 'Updating...' : 'Update Progress'}
                  </Button>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedGoal.type === 'financial' ? (
                  <>
                    <div className="bg-surface-50 p-2 sm:p-3 rounded-lg">
                      <div className="text-xs sm:text-sm text-surface-500">Current Amount</div>
                      <div className="text-sm sm:text-base font-semibold text-surface-900">
                        {formatCurrency(selectedGoal.currentAmount || 0)}
                      </div>
                    </div>
                    <div className="bg-surface-50 p-2 sm:p-3 rounded-lg">
                      <div className="text-xs sm:text-sm text-surface-500">Target Amount</div>
                      <div className="text-sm sm:text-base font-semibold text-surface-900">
                        {formatCurrency(selectedGoal.targetAmount || 0)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-surface-50 p-2 sm:p-3 rounded-lg sm:col-span-2">
                    <div className="text-xs sm:text-sm text-surface-500">Progress</div>
                    <div className="text-sm sm:text-base font-semibold text-surface-900">
                      {(selectedGoal.progress || 0).toFixed(0)}% Complete
                    </div>
                  </div>
                )}
                {selectedGoal.targetDate && (
                  <div className="bg-surface-50 p-2 sm:p-3 rounded-lg sm:col-span-2">
                    <div className="text-xs sm:text-sm text-surface-500">Target Date</div>
                    <div className="text-sm sm:text-base font-semibold text-surface-900">
                      {new Date(selectedGoal.targetDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

                        {/* Description */}
            {selectedGoal.description && (
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-surface-700 mb-1">Description</h4>
                <p className="text-xs sm:text-sm text-surface-600 bg-surface-50 p-2 rounded-lg">
                  {selectedGoal.description}
                </p>
              </div>
            )}

            {/* Submilestones */}
            {selectedGoal.submilestones && selectedGoal.submilestones.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs sm:text-sm font-medium text-surface-700">Submilestones</h4>
                  <span className="text-xs text-surface-500">
                    Click to toggle
                  </span>
                </div>
                                <div className="space-y-2">
                  {selectedGoal.submilestones.map((submilestone) => (
                    <div key={submilestone.id} className="flex items-start gap-2 p-2 bg-surface-50 rounded-lg hover:bg-surface-100 cursor-pointer transition-colors" onClick={() => handleSubmilestoneToggle(submilestone.id)}>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                        submilestone.completed ? 'bg-green-500' : 'bg-surface-300'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs sm:text-sm font-medium ${
                          submilestone.completed ? 'text-surface-500 line-through' : 'text-surface-900'
                        }`}>
                          {submilestone.title}
                        </div>
                        {submilestone.description && (
                          <p className="text-xs text-surface-600 mt-0.5">
                            {submilestone.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-surface-500">
                          {selectedGoal.type === 'financial' && submilestone.targetAmount && submilestone.targetAmount > 0 && (
                            <span className="truncate">Target: {formatCurrency(submilestone.targetAmount)}</span>
                          )}
                          {submilestone.targetDate && (
                            <span className="truncate">Due: {new Date(submilestone.targetDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Unsaved Changes Prompt */}
      <UnsavedChangesPrompt
        isOpen={showPrompt}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
        message="You have unsaved changes to your goal. Are you sure you want to leave without saving?"
      />


    </div>
  );
}; 