import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, Modal, Input, Select } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { 
  getUserStats, 
  getUserProfile,
  getUserFinancials,
  getUserIntermediateGoals,
  addIntermediateGoal,
  UserStats,
  UserProfile,
  UserFinancials,
  UserGoals,
  IntermediateGoal,
  generateDynamicMilestones,
  DynamicMilestone
} from '../services/firestore';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [financials, setFinancials] = useState<UserFinancials | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [dynamicMilestones, setDynamicMilestones] = useState<DynamicMilestone[]>([]);
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

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const [userStats, userProfile, userFinancials, userGoals] = await Promise.all([
          getUserStats(),
          getUserProfile(),
          getUserFinancials(),
          getUserIntermediateGoals()
        ]);
        
        setStats(userStats);
        setProfile(userProfile);
        setFinancials(userFinancials);
        setGoals(userGoals);

        // Set user name for personalization
        if (userProfile?.basicInfo?.name) {
          setUserName(userProfile.basicInfo.name.split(' ')[0]); // Use first name only
        } else {
          // Fallback to displayName or email prefix
          const fallbackName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
          setUserName(fallbackName.split(' ')[0]);
        }

        // Generate dynamic milestones
        if (userStats && userProfile && userGoals) {
          const currentAmount = userStats.netWorth || 0;
          const targetAmount = userProfile.financialGoal?.targetAmount || 1000000;
          const intermediateGoals = userGoals.intermediateGoals || [];
          
          const milestones = generateDynamicMilestones(currentAmount, targetAmount, intermediateGoals);
          setDynamicMilestones(milestones);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  const openAddModal = () => {
    setGoalForm({
      title: '',
      type: 'financial',
      targetAmount: '',
      currentAmount: '',
      progress: '',
      targetDate: '',
      status: 'Not Started',
      description: ''
    });
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
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const currentAmount = stats?.netWorth || 0;
  const targetAmount = profile?.financialGoal?.targetAmount ?? 1000000;
  const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-surface-50">
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
            <Button onClick={() => window.location.href = '/goals'}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Manage Goals
            </Button>
          </div>
        </div>

        {/* Progress to Target & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Progress to Target */}
          <Card className="lg:col-span-2 p-8">
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
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-surface-900 mb-4">Quick Actions</h3>
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
              <Card key={goal.id || index} className="p-6">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Financial Overview */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-surface-900 mb-4">Financial Overview</h3>
            {financials?.financialInfo && (stats?.netWorth !== undefined) ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-700">
                      ${financials.financialInfo.annualIncome.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Annual Income</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-700">
                      ${financials.financialInfo.annualExpenses.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">Annual Expenses</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-700">
                      ${financials.financialInfo.totalAssets.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">Total Assets</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-700">
                      ${stats.netWorth.toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-600">Net Worth</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button onClick={() => window.location.href = '/profile'} variant="outline">
                    Update Financial Information
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💰</div>
                <h4 className="text-lg font-semibold text-surface-900 mb-2">Complete Your Financial Profile</h4>
                <p className="text-surface-600 mb-4">
                  Add your financial information to start tracking your progress toward your goal
                </p>
                <Button onClick={() => window.location.href = '/profile'} variant="outline">
                  Complete Profile
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Dynamic Milestones */}
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-semibold text-surface-900 mb-4">Milestones</h3>
          <div className="space-y-4">
            {dynamicMilestones.length > 0 ? (
              dynamicMilestones.map((milestone) => {
                const isNextMilestone = !milestone.completed && dynamicMilestones.filter(m => !m.completed).indexOf(milestone) === 0;
                
                return (
                  <div key={milestone.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      milestone.completed ? 'bg-secondary-500' : 
                      isNextMilestone ? 'bg-primary-500 animate-pulse' : 'bg-surface-300'
                    }`}>
                      {milestone.completed ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : milestone.isGoal ? (
                        <div className="text-white text-xs font-bold">🎯</div>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-surface-900">
                          ${milestone.amount.toLocaleString()}
                          {milestone.isGoal && <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">GOAL</span>}
                        </div>
                        <div className="text-xs text-surface-500">
                          {milestone.progress.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-sm text-surface-600">{milestone.title}</div>
                      <div className={`text-xs ${
                        milestone.completed ? 'text-secondary-600' : 
                        isNextMilestone ? 'text-primary-600' : 'text-surface-500'
                      }`}>
                        {milestone.completed ? 'Completed ✓' : 
                         isNextMilestone ? 'Next Milestone' : 'Future Goal'}
                      </div>
                      {!milestone.completed && milestone.progress > 0 && (
                        <div className="mt-1 w-full bg-surface-200 rounded-full h-1">
                          <div 
                            className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(milestone.progress, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-surface-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Complete your profile to see personalized milestones</p>
              </div>
            )}
          </div>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Tasks Checklist */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-surface-900 mb-4">Financial Tasks</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-surface-50 rounded-lg">
                <input type="checkbox" checked className="mr-3 h-4 w-4 text-secondary-600 rounded" readOnly />
                <span className="text-surface-900 line-through">Set up emergency fund</span>
              </div>
              <div className="flex items-center p-3 bg-surface-50 rounded-lg">
                <input type="checkbox" checked className="mr-3 h-4 w-4 text-secondary-600 rounded" readOnly />
                <span className="text-surface-900 line-through">Open high-yield savings account</span>
              </div>
              <div className="flex items-center p-3 bg-primary-50 rounded-lg">
                <input type="checkbox" className="mr-3 h-4 w-4 text-primary-600 rounded" readOnly />
                <span className="text-surface-900">Increase 401k contribution</span>
              </div>
              <div className="flex items-center p-3 bg-surface-50 rounded-lg">
                <input type="checkbox" className="mr-3 h-4 w-4 text-primary-600 rounded" readOnly />
                <span className="text-surface-900">Review and optimize investment portfolio</span>
              </div>
              <div className="flex items-center p-3 bg-surface-50 rounded-lg">
                <input type="checkbox" className="mr-3 h-4 w-4 text-primary-600 rounded" readOnly />
                <span className="text-surface-900">Research real estate investment options</span>
              </div>
              <div className="flex items-center p-3 bg-surface-50 rounded-lg">
                <input type="checkbox" className="mr-3 h-4 w-4 text-primary-600 rounded" readOnly />
                <span className="text-surface-900">Start side hustle income stream</span>
              </div>
            </div>
          </Card>

          {/* Recommended Actions */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-surface-900 mb-4">Recommended Actions</h3>
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-surface-600 font-medium">Next Steps</p>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <div className="font-medium text-primary-900">Update Your Profile</div>
                  <div className="text-sm text-primary-700">Add your financial information to track progress accurately</div>
                </div>
                
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <div className="font-medium text-secondary-900">Set Goals</div>
                  <div className="text-sm text-secondary-700">Create specific financial goals to stay motivated</div>
                </div>
                
                <div className="p-3 bg-accent-50 rounded-lg">
                  <div className="font-medium text-accent-900">Get AI Guidance</div>
                  <div className="text-sm text-accent-700">Chat with our financial assistant for personalized advice</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
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
              <Input
                label="Target Date (Optional)"
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
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
              disabled={saving || !goalForm.title || !goalForm.type}
            >
              {saving ? 'Saving...' : 'Add Goal'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}; 