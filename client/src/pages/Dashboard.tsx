import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { Card, Button, Badge, Modal, Input, Select, DatePicker, LoadingSpinner } from '../components/ui';
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
import { useLocation } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { registerDataRefreshCallback, unregisterDataRefreshCallback } = useChatContext();

  const location = useLocation();
  const [userName, setUserName] = useState<string>('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextMilestone, setNextMilestone] = useState<{ nextMilestone: any; progressToNext: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    type: 'financial' as 'financial' | 'skill' | 'behavior' | 'lifestyle' | 'networking' | 'project',
    targetAmount: '',
    currentAmount: '',
    progress: '',
    targetDate: '',
    status: 'Not Started',
    description: ''
  });
  
  // Original form for change detection
  const [originalGoalForm, setOriginalGoalForm] = useState(goalForm);

  // Unsaved changes protection (only when modal is open and has changes)
  const hasUnsavedGoalChanges = showModal && isFormChanged(originalGoalForm, goalForm);
  const { showPrompt, confirmNavigation, cancelNavigation } = useUnsavedChanges(
    hasUnsavedGoalChanges,
    'You have unsaved changes to your goal. Are you sure you want to leave without saving?'
  );



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
    const newForm = {
      title: '',
      type: 'financial' as 'financial' | 'skill' | 'behavior' | 'lifestyle' | 'networking' | 'project',
      targetAmount: '',
      currentAmount: '',
      progress: '',
      targetDate: '',
      status: 'Not Started',
      description: ''
    };
    setGoalForm(newForm);
    setOriginalGoalForm(newForm);
    setShowModal(true);
  };

  const handleSaveGoal = async () => {
    if (!goalForm.title || !goalForm.type) return;

    try {
      setSaving(true);
      
      const newGoal: IntermediateGoal = {
        id: Date.now().toString(),
        title: goalForm.title,
        type: goalForm.type,
        targetAmount: goalForm.type === 'financial' ? (parseFloat(goalForm.targetAmount) || 0) : undefined,
        currentAmount: goalForm.type === 'financial' ? (parseFloat(goalForm.currentAmount) || 0) : undefined,
        progress: goalForm.type !== 'financial' ? (parseFloat(goalForm.progress) || 0) : undefined,
        targetDate: goalForm.targetDate || undefined,
        status: goalForm.status as 'Not Started' | 'In Progress' | 'Completed',
        description: goalForm.description || undefined
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

  const goalTypeOptions = [
    { value: 'financial', label: '💰 Financial Goals' },
    { value: 'skill', label: '🧠 Skill-Based Goals' },
    { value: 'behavior', label: '📊 Financial Behavior Goals' },
    { value: 'lifestyle', label: '🏋️ Lifestyle Discipline Goals' },
    { value: 'networking', label: '💬 Networking & Mentorship Goals' },
    { value: 'project', label: '🛠️ Project / Output-Based Goals' }
  ];

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

  const currentAmount = stats?.netWorth || 0;
  const targetAmount = profile?.financialGoal?.targetAmount ?? 1000000;
  const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  
  console.log('Dashboard - Render values:', {
    currentAmount,
    targetAmount,
    progressPercentage,
    stats,
    profile: profile?.financialGoal
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/20 to-secondary-50/30">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-surface-900">
                Welcome back, {userName || 'there'}!
              </h1>
              <p className="text-surface-600 mt-2">Track your journey to ${targetAmount.toLocaleString()}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => window.location.href = '/goals'}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Manage Goals
              </Button>
            </div>
          </div>
        </div>

        {/* Progress to Target & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Progress to Target */}
          <Card variant="gradient" className="lg:col-span-2 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-surface-900 mb-2">Progress to ${targetAmount.toLocaleString()}</h2>
              <p className="text-surface-600">Your current net worth journey</p>
            </div>
            
            {/* Large Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-surface-600">Current Net Worth</span>
                <span className="text-sm font-medium text-surface-900">
                  ${currentAmount.toLocaleString()} / ${targetAmount.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-surface-200 rounded-full h-6">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-6 rounded-full transition-all duration-500 relative"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                >
                  <div className="absolute right-0 top-0 h-6 w-6 bg-white rounded-full shadow-lg transform translate-x-1/2 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-3">
                <span className="text-2xl font-bold text-primary-600">{progressPercentage.toFixed(1)}%</span>
                <span className="text-surface-600 ml-2">complete</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card variant="primary" className="p-6">
            <h3 className="text-xl font-semibold text-primary-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/profile'}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Update Profile
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/goals'}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Manage Goals
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/chatbot'}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI Assistant
              </Button>
              

            </div>
          </Card>
        </div>

        {/* Intermediate Goals */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-surface-900">Your Intermediate Goals</h2>
            <Button onClick={() => window.location.href = '/goals'} variant="outline">
              View All Goals
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Goals */}
            {goals?.intermediateGoals && goals.intermediateGoals.slice(0, 2).map((goal, index) => (
              <Card key={goal.id || index} variant="glass" className="p-6" hover>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-surface-900">{goal.title}</h3>
                  <Badge variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'primary' : 'neutral' as any}>
                    {goal.status}
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-surface-700">Progress</span>
                    <span className="text-sm font-medium text-surface-700">
                      {goal.type === 'financial' && goal.targetAmount && goal.targetAmount > 0 
                        ? (((goal.currentAmount || 0) / goal.targetAmount) * 100).toFixed(1) 
                        : (goal.progress || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-secondary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${goal.type === 'financial' && goal.targetAmount && goal.targetAmount > 0 
                          ? Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100) 
                          : Math.min(goal.progress || 0, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-sm text-surface-600">
                  {goal.type === 'financial' ? (
                    `$${(goal.currentAmount || 0).toLocaleString()} of $${(goal.targetAmount || 0).toLocaleString()}`
                  ) : (
                    `${(goal.progress || 0).toFixed(0)}% Complete`
                  )}
                </div>
              </Card>
            ))}

            {/* Add New Goal Card */}
            <div 
              className="p-6 border-2 border-dashed border-surface-300 hover:border-primary-300 transition-colors cursor-pointer bg-white rounded-lg shadow-sm"
              onClick={openAddModal}
            >
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
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
          <h3 className="text-xl font-semibold text-secondary-800 mb-4">Next Milestone</h3>
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
      
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Add New Goal"
        >
          <div className="space-y-4">
            <Input
              label="Goal Title"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              placeholder="e.g., Emergency Fund, Learn Python, Build Portfolio"
            />
            
            <Select
              label="Goal Type"
              value={goalForm.type}
              onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as any })}
              options={goalTypeOptions}
            />
            
            {goalForm.type === 'financial' ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Target Amount ($)"
                  type="number"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  placeholder="10000"
                />
                <Input
                  label="Current Amount ($)"
                  type="number"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
            ) : (
              <Input
                label="Progress (%)"
                type="number"
                value={goalForm.progress}
                onChange={(e) => setGoalForm({ ...goalForm, progress: e.target.value })}
                placeholder="0"
              />
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Target Date (Optional)"
                value={goalForm.targetDate}
                onChange={(date) => setGoalForm({ ...goalForm, targetDate: date || '' })}
              />
              <Select
                label="Status"
                value={goalForm.status}
                onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value as 'Not Started' | 'In Progress' | 'Completed' })}
                options={[
                  { value: 'Not Started', label: 'Not Started' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' }
                ]}
              />
            </div>
            
            <Input
              label="Description (Optional)"
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              placeholder="Brief description of this goal..."
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button 
              onClick={() => setShowModal(false)} 
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGoal} 
              disabled={saving || !goalForm.title || !goalForm.type || !isFormChanged(originalGoalForm, goalForm)}
              variant={isFormChanged(originalGoalForm, goalForm) ? 'primary' : 'outline'}
            >
              {saving ? 'Saving...' : 'Add Goal'}
            </Button>
          </div>
        </Modal>
      )}

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