import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, Modal, Input, Select } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
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

export default function Goals() {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<IntermediateGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    type: 'financial' as 'financial' | 'skill' | 'behavior' | 'lifestyle' | 'networking' | 'project',
    targetAmount: '',
    currentAmount: '',
    progress: '',
    targetDate: '',
    status: 'Not Started',
    description: '',
    category: ''
  });

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
        
        // Set user name for personalization
        const name = profileData?.basicInfo?.name || currentUser.displayName || currentUser.email?.split('@')[0] || '';
        setUserName(name.split(' ')[0]); // Use first name only
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const openAddModal = () => {
    setEditingGoal(null);
    setGoalForm({
      title: '',
      type: 'financial',
      targetAmount: '',
      currentAmount: '',
      progress: '',
      targetDate: '',
      status: 'Not Started',
      description: '',
      category: ''
    });
    setShowModal(true);
  };

  const openEditModal = (goal: IntermediateGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      type: goal.type,
      targetAmount: goal.targetAmount?.toString() || '',
      currentAmount: goal.currentAmount?.toString() || '',
      progress: goal.progress?.toString() || '',
      targetDate: goal.targetDate || '',
      status: goal.status,
      description: goal.description || '',
      category: goal.category || ''
    });
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
        category: goalForm.category || undefined
      };

      if (editingGoal) {
        await updateIntermediateGoal(editingGoal.id!, newGoal);
      } else {
        await addIntermediateGoal(newGoal);
      }

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

  const handleDeleteGoal = async (goalId: string) => {
    try {
      setSaving(true);
      
      await deleteIntermediateGoal(goalId);
      
      // Reload goals data
      const updatedGoals = await getUserIntermediateGoals();
      setGoals(updatedGoals);
      setShowModal(false);
      
    } catch (error) {
      console.error('Error deleting goal:', error);
    } finally {
      setSaving(false);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Achieved':
        return 'success';
      case 'On Track':
        return 'primary';
      case 'Making Progress':
        return 'accent';
      case 'Getting Started':
        return 'secondary';
      default:
        return 'neutral';
    }
  };

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
    }
    return goal.progress || 0;
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
          <p className="text-surface-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  const progress = calculateMainGoalProgress();
  const monthlyTarget = calculateMonthlyTarget();
  const status = getMainGoalStatus();

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-surface-900">
                {userName ? `${userName}'s Goals & Progress` : 'Your Goals & Progress'}
              </h1>
              <p className="text-surface-600 mt-2">
                {userName 
                  ? `Welcome back, ${userName}! Track and manage all your goals in one place` 
                  : 'Track and manage all your goals in one place'
                }
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={openAddModal} size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Goal
              </Button>
            </div>
          </div>
        </div>

        {/* Goal Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-primary-600 mb-2">
              {goals?.intermediateGoals?.length || 0}
            </div>
            <div className="text-sm text-surface-600">Total Goals</div>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {goals?.intermediateGoals?.filter(g => g.status === 'Completed').length || 0}
            </div>
            <div className="text-sm text-surface-600">Completed</div>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {goals?.intermediateGoals?.filter(g => g.status === 'In Progress').length || 0}
            </div>
            <div className="text-sm text-surface-600">In Progress</div>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-surface-600 mb-2">
              {goals?.intermediateGoals?.filter(g => g.status === 'Not Started').length || 0}
            </div>
            <div className="text-sm text-surface-600">Not Started</div>
          </Card>
        </div>

        {/* Main Financial Goal */}
        <Card className="p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-surface-900 mb-2">
                RT1M Goal: {formatCurrency(profile?.financialGoal?.targetAmount || 1000000)}
              </h2>
              <p className="text-surface-600">
                Target by {profile?.financialGoal?.targetYear || new Date().getFullYear() + 10}
              </p>
            </div>
            <Badge variant={getStatusColor(status) as any}>
              {status}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-surface-700">Overall Progress</span>
              <span className="text-sm font-medium text-surface-700">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-surface-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-700">
                {formatCurrency(stats?.netWorth || 0)}
              </div>
              <div className="text-sm text-green-600">Current Net Worth</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-700">
                {formatCurrency((profile?.financialGoal?.targetAmount || 0) - (stats?.netWorth || 0))}
              </div>
              <div className="text-sm text-blue-600">Remaining to Goal</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-700">
                {formatCurrency(monthlyTarget)}
              </div>
              <div className="text-sm text-purple-600">Monthly Target</div>
            </div>
          </div>
        </Card>

        {/* All Goals */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-surface-900">All Goals</h3>
            <Button onClick={openAddModal} size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Goal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Goals */}
            {goals?.intermediateGoals?.map((goal, index) => (
              <Card key={goal.id || index} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getGoalTypeIcon(goal.type)}</span>
                    <h4 className="font-semibold text-surface-900">{goal.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getGoalTypeColor(goal.type)}`}>
                      {goal.type}
                    </span>
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
                
                <div className="mb-4">
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
                  {goal.description && (
                    <div className="mt-3 p-2 bg-surface-50 rounded text-xs text-surface-600">
                      {goal.description}
                    </div>
                  )}
                </div>
              </Card>
            )) || []}
            
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
                <h4 className="text-lg font-medium text-surface-900 mb-2">
                  Add New Goal
                </h4>
                <p className="text-sm text-surface-600">
                  Create a financial or personal development goal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
        >
          <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
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
            
            <Input
              label="Target Date (Optional)"
              type="date"
              value={goalForm.targetDate}
              onChange={(e) => setGoalForm({...goalForm, targetDate: e.target.value})}
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
            
            <Input
              label="Description (Optional)"
              value={goalForm.description}
              onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
              placeholder="Additional details about this goal"
            />
            
            <div className="flex justify-between pt-4">
              {editingGoal && (
                <Button 
                  variant="outline" 
                  onClick={() => handleDeleteGoal(editingGoal.id!)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete Goal
                </Button>
              )}
              <div className="flex space-x-3 ml-auto">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal} loading={saving}>
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        <MiniChatbot />
      </div>
      <Footer />
    </div>
  );
} 