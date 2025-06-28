import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, Modal, Input, Select, DatePicker, LoadingSpinner } from '../components/ui';
import Footer from '../components/Footer';
import { MiniChatbot } from '../components/MiniChatbot';
import { 
  IntermediateGoal
} from '../services/firestore';
import { isFormChanged, useUnsavedChanges, UnsavedChangesPrompt } from '../utils/unsavedChanges';
import { useGoals } from '../hooks/useGoals';

export default function Goals() {
  const { currentUser } = useAuth();
  const { 
    loading, 
    saving, 
    profile, 
    stats, 
    goals, 
    addGoal, 
    updateGoal, 
    deleteGoal,
    calculateMainGoalProgress,
    calculateYearsRemaining,
    calculateMonthlyTarget,
    getMainGoalStatus
  } = useGoals();
  const [userName, setUserName] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
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

  // Set user name when profile loads
  useEffect(() => {
    if (profile && currentUser) {
      const name = profile.basicInfo?.name || currentUser.displayName || currentUser.email?.split('@')[0] || '';
      setUserName(name.split(' ')[0]); // Use first name only
    }
  }, [profile, currentUser]);

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

      if (editingGoal && editingGoal.id) {
        await updateGoal(editingGoal.id, newGoal);
      } else {
        await addGoal(newGoal);
      }

      setShowModal(false);
      
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting goal:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-accent-50/20 to-primary-50/30 flex items-center justify-center">
        <LoadingSpinner 
          size="xl" 
          variant="accent" 
          text="Loading your goals..." 
        />
      </div>
    );
  }

  const progress = calculateMainGoalProgress();
  const monthlyTarget = calculateMonthlyTarget();
  const status = getMainGoalStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-accent-50/20 to-primary-50/30">
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
          <Card variant="primary" className="text-center group hover:scale-105" hover>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-primary-700 mb-2">
              {goals?.intermediateGoals?.length || 0}
            </div>
            <div className="text-sm text-primary-600 font-medium">Total Goals</div>
          </Card>
          
          <Card variant="secondary" className="text-center group hover:scale-105" hover>
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-secondary-700 mb-2">
              {goals?.intermediateGoals?.filter(g => g.status === 'Completed').length || 0}
            </div>
            <div className="text-sm text-secondary-600 font-medium">Completed</div>
          </Card>
          
          <Card variant="accent" className="text-center group hover:scale-105" hover>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-accent-700 mb-2">
              {goals?.intermediateGoals?.filter(g => g.status === 'In Progress').length || 0}
            </div>
            <div className="text-sm text-accent-600 font-medium">In Progress</div>
          </Card>
          
          <Card variant="glass" className="text-center group hover:scale-105" hover>
            <div className="w-12 h-12 bg-gradient-to-br from-surface-400 to-surface-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-medium">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-surface-700 mb-2">
              {goals?.intermediateGoals?.filter(g => g.status === 'Not Started').length || 0}
            </div>
            <div className="text-sm text-surface-600 font-medium">Not Started</div>
          </Card>
        </div>

        {/* Main Financial Goal */}
        <Card variant="gradient" className="p-8 mb-8">
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
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-surface-900">All Goals</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Goals */}
            {goals?.intermediateGoals?.map((goal, index) => (
              <Card key={goal.id || index} variant="glass" className="p-6" hover>
                <div className="mb-4">
                  {/* Header with icon and title */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-lg mt-0.5 flex-shrink-0">{getGoalTypeIcon(goal.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-surface-900 leading-tight break-words">{goal.title}</h4>
                    </div>
                    <button
                      onClick={() => openEditModal(goal)}
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
                  {goal.submilestones && goal.submilestones.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-surface-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-surface-500">Submilestones</span>
                        <span className="text-xs text-surface-500">
                          {goal.submilestones.filter(sub => sub.completed).length}/{goal.submilestones.length} completed
                        </span>
                      </div>
                      <div className="space-y-1">
                        {goal.submilestones.slice(0, 3).map((submilestone, subIndex) => (
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
                        {goal.submilestones.length > 3 && (
                          <div className="text-xs text-surface-500 text-center">
                            +{goal.submilestones.length - 3} more
                          </div>
                        )}
                      </div>
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
            
            <Input
              label="Description (Optional)"
              value={goalForm.description}
              onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
              placeholder="Additional details about this goal"
            />

            {/* Submilestones Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-medium text-surface-900">Submilestones</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubmilestone}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Submilestone
                </Button>
              </div>

              {goalForm.submilestones.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
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
                        
                        <div className="grid grid-cols-2 gap-2">
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
                        
                        <Input
                          label="Description"
                          value={submilestone.description}
                          onChange={(e) => updateSubmilestone(index, 'description', e.target.value)}
                          placeholder="Brief description"
                        />
                        
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
            
            <div className="flex justify-between pt-4">
              {editingGoal && editingGoal.id && (
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
                <Button 
                  onClick={handleSaveGoal} 
                  loading={saving}
                  disabled={saving || !isFormChanged(originalGoalForm, goalForm)}
                  variant={isFormChanged(originalGoalForm, goalForm) ? 'primary' : 'outline'}
                >
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        <MiniChatbot />

        {/* Unsaved Changes Prompt */}
        <UnsavedChangesPrompt
          isOpen={showPrompt}
          onConfirm={confirmNavigation}
          onCancel={cancelNavigation}
          message="You have unsaved changes to your goal. Are you sure you want to leave without saving?"
        />
      </div>
      <Footer />
    </div>
  );
} 