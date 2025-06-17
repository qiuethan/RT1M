import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select } from '../components/ui';
import Footer from '../components/Footer';
import { 
  getUserProfile, 
  getUserStats,
  saveUserProfile,
  UserProfile,
  UserStats,
  IntermediateGoal
} from '../services/firestore';

export default function Goals() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<IntermediateGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    status: 'Not Started',
    description: ''
  });

  // Load profile and stats on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profileData, statsData] = await Promise.all([
          getUserProfile(),
          getUserStats()
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const openAddModal = () => {
    setEditingGoal(null);
    setGoalForm({
      title: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      status: 'Not Started',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (goal: IntermediateGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate || '',
      status: goal.status,
      description: goal.description || ''
    });
    setShowModal(true);
  };

  const handleSaveGoal = async () => {
    if (!profile || !goalForm.title || !goalForm.targetAmount) return;

    try {
      setSaving(true);
      
      const newGoal: IntermediateGoal = {
        id: editingGoal?.id || Date.now().toString(),
        title: goalForm.title,
        targetAmount: parseFloat(goalForm.targetAmount) || 0,
        currentAmount: parseFloat(goalForm.currentAmount) || 0,
        targetDate: goalForm.targetDate || '',
        status: goalForm.status as 'Not Started' | 'In Progress' | 'Completed',
        description: goalForm.description || undefined
      };

      let updatedGoals = [...(profile.intermediateGoals || [])];
      
      if (editingGoal) {
        // Update existing goal
        const index = updatedGoals.findIndex(g => g.id === editingGoal.id);
        if (index !== -1) {
          updatedGoals[index] = newGoal;
        }
      } else {
        // Add new goal
        updatedGoals.push(newGoal);
      }

      const updatedProfile = {
        ...profile,
        intermediateGoals: updatedGoals
      };

      await saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setShowModal(false);
      
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!profile) return;

    try {
      setSaving(true);
      
      const updatedGoals = (profile.intermediateGoals || []).filter(g => g.id !== goalId);
      const updatedProfile = {
        ...profile,
        intermediateGoals: updatedGoals
      };

      await saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setShowModal(false);
      
    } catch (error) {
      console.error('Error deleting goal:', error);
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
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

  const getGoalStatus = () => {
    const progress = calculateProgress();
    if (progress >= 100) return 'Achieved';
    if (progress >= 75) return 'On Track';
    if (progress >= 50) return 'Making Progress';
    if (progress >= 25) return 'Getting Started';
    return 'Just Starting';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Achieved':
        return 'success';
      case 'On Track':
        return 'primary';
      case 'Making Progress':
        return 'accent';
      case 'Getting Started':
        return 'warning';
      case 'Just Starting':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-surface-900 mb-2">No Profile Found</h2>
          <p className="text-surface-600 mb-4">Please complete your profile first to track your financial goals.</p>
          <Button onClick={() => window.location.href = '/profile'}>
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const yearsRemaining = calculateYearsRemaining();
  const monthlyTarget = calculateMonthlyTarget();
  const status = getGoalStatus();

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-surface-900">Your Financial Goals</h1>
              <p className="text-surface-600 mt-2">Track your progress toward financial independence</p>
            </div>
            <Button onClick={() => window.location.href = '/profile'} variant="outline">
              Edit Goals
            </Button>
          </div>
        </div>

        {/* Main Financial Goal */}
        <div>
          <h2 className="text-2xl font-semibold text-surface-900 mb-6">Main Financial Goal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Goal Card */}
            <div className="lg:col-span-2">
              <Card className="p-8 mb-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-surface-900 mb-2">
                      {formatCurrency(profile.financialGoal?.targetAmount || 0)}
                    </h2>
                    <p className="text-surface-600">
                      Target by {profile.financialGoal?.targetYear}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(status) as any}>
                    {status}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-surface-700">Progress</span>
                    <span className="text-sm font-medium text-surface-700">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Current vs Target */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 bg-surface-50 rounded-lg">
                    <div className="text-2xl font-bold text-surface-900">
                      {formatCurrency(stats.netWorth || 0)}
                    </div>
                    <div className="text-sm text-surface-600">Current Net Worth</div>
                  </div>
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-700">
                      {formatCurrency((profile.financialGoal?.targetAmount || 0) - (stats.netWorth || 0))}
                    </div>
                    <div className="text-sm text-primary-600">Remaining to Goal</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-surface-900 mb-4">Timeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-accent-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-surface-900">{yearsRemaining} years remaining</div>
                        <div className="text-sm text-surface-600">Until target year</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-secondary-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-surface-900">{formatCurrency(monthlyTarget)}/month</div>
                        <div className="text-sm text-surface-600">Needed to reach goal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Intermediate Goals */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-surface-900">Intermediate Goals</h3>
                  <Button onClick={openAddModal} size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Goal
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Existing Goals */}
                  {profile.intermediateGoals && profile.intermediateGoals.map((goal, index) => (
                    <Card key={goal.id || index} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-surface-900">{goal.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'primary' : 'neutral' as any} size="sm">
                            {goal.status}
                          </Badge>
                          <button
                            onClick={() => openEditModal(goal)}
                            className="text-surface-400 hover:text-surface-600 transition-colors"
                            title="Edit goal"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-surface-600">Progress</span>
                          <span className="text-xs font-medium text-surface-600">
                            {goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-surface-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-secondary-500 to-accent-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-surface-500">Current:</span>
                          <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-500">Target:</span>
                          <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        {goal.targetDate && (
                          <div className="flex justify-between">
                            <span className="text-surface-500">Due:</span>
                            <span className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {goal.description && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-surface-600">{goal.description}</p>
                        </div>
                      )}
                    </Card>
                  ))}

                  {/* Add New Goal Card */}
                  <div 
                    className="p-4 border-2 border-dashed border-surface-300 hover:border-primary-300 transition-colors cursor-pointer bg-white rounded-lg shadow-sm"
                    onClick={openAddModal}
                  >
                    <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-surface-900 mb-1">
                        Add Goal
                      </h4>
                      <p className="text-xs text-surface-600">
                        Set a new intermediate goal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">Financial Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-surface-600">Total Assets</span>
                    <span className="font-medium">{formatCurrency(profile.financialInfo?.totalAssets || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-600">Total Debts</span>
                    <span className="font-medium text-red-600">-{formatCurrency(profile.financialInfo?.totalDebts || 0)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Net Worth</span>
                    <span>{formatCurrency(stats.netWorth || 0)}</span>
                  </div>
                </div>
              </Card>

              {/* Annual Overview */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">Annual Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-surface-600">Annual Income</span>
                    <span className="font-medium text-green-600">{formatCurrency(profile.financialInfo?.annualIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-600">Annual Expenses</span>
                    <span className="font-medium text-red-600">-{formatCurrency(profile.financialInfo?.annualExpenses || 0)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Net Annual</span>
                    <span className={`${(profile.financialInfo?.annualIncome || 0) - (profile.financialInfo?.annualExpenses || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency((profile.financialInfo?.annualIncome || 0) - (profile.financialInfo?.annualExpenses || 0))}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Savings Rate */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">Savings Rate</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {profile.financialInfo?.annualIncome ? 
                      (((profile.financialInfo.annualIncome - profile.financialInfo.annualExpenses) / profile.financialInfo.annualIncome) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-surface-600">of income saved annually</div>
                </div>
                <div className="mt-4 p-3 bg-surface-50 rounded-lg">
                  <div className="text-sm text-surface-600 mb-1">Monthly Savings</div>
                  <div className="font-semibold">
                    {formatCurrency(((profile.financialInfo?.annualIncome || 0) - (profile.financialInfo?.annualExpenses || 0)) / 12)}
                  </div>
                </div>
              </Card>

              {/* Goal Insights */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">Insights</h3>
                <div className="space-y-3 text-sm">
                  {progress >= 100 ? (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg">
                      🎉 Congratulations! You've achieved your financial goal!
                    </div>
                  ) : yearsRemaining <= 0 ? (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                      ⚠️ Your target year has passed. Consider updating your goal timeline.
                    </div>
                  ) : monthlyTarget > ((profile.financialInfo?.annualIncome || 0) - (profile.financialInfo?.annualExpenses || 0)) / 12 ? (
                    <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg">
                      💡 You may need to increase income or reduce expenses to reach your goal on time.
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                      ✅ You're on track! Keep saving consistently to reach your goal.
                    </div>
                  )}
                  
                  {progress < 25 && (
                    <div className="p-3 bg-surface-50 text-surface-600 rounded-lg">
                      💪 Every journey starts with a single step. You're building momentum!
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
        >
          <div className="space-y-4">
            <Input
              label="Goal Title"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              placeholder="e.g., Emergency Fund, Vacation, New Car"
            />
            
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
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Date"
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
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div>
              {editingGoal && (
                <Button 
                  onClick={() => handleDeleteGoal(editingGoal.id || '')} 
                  disabled={saving} 
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {saving ? 'Deleting...' : 'Delete Goal'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowModal(false)} 
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveGoal} 
                disabled={saving || !goalForm.title || !goalForm.targetAmount}
              >
                {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Add Goal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 