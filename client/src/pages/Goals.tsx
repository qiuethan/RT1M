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
    calculateMonthlyTarget,
    getMainGoalStatus
  } = useGoals();
  const [userName, setUserName] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IntermediateGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<IntermediateGoal | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressForm, setProgressForm] = useState({
    currentAmount: '',
    progress: ''
  });
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

      if (selectedGoal.id) {
        await updateGoal(selectedGoal.id, updatedGoal);
      }
      
      // Update the selected goal state
      setSelectedGoal(updatedGoal);
      
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

      if (selectedGoal.id) {
        await updateGoal(selectedGoal.id, updatedGoal);
      }
      
      // Update the selected goal state
      setSelectedGoal(updatedGoal);
      
    } catch (error) {
      console.error('Error updating submilestone:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-accent-50/20 to-primary-50/30 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
                {userName ? `${userName}'s Goals & Progress` : 'Your Goals & Progress'}
              </h1>
              <p className="text-sm sm:text-base text-surface-600 mt-1 sm:mt-2">
                {userName 
                  ? `Welcome back, ${userName}! Track and manage all your goals in one place` 
                  : 'Track and manage all your goals in one place'
                }
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={openAddModal} size="sm" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Add Goal</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Goal Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-6 sm:mb-8">
          <Card variant="primary" className="group hover:scale-105" hover>
            <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 shadow-medium">
              <svg className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-primary-700 mb-1 sm:mb-2 text-center">
              {goals?.intermediateGoals?.length || 0}
            </div>
            <div className="text-xs sm:text-sm text-primary-600 font-medium text-center">Total Goals</div>
          </Card>
          
          <Card variant="secondary" className="group hover:scale-105" hover>
            <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 shadow-medium">
              <svg className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-secondary-700 mb-1 sm:mb-2 text-center">
              {goals?.intermediateGoals?.filter(g => g.status === 'Completed').length || 0}
            </div>
            <div className="text-xs sm:text-sm text-secondary-600 font-medium text-center">Completed</div>
          </Card>
          
          <Card variant="accent" className="group hover:scale-105" hover>
            <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 shadow-medium">
              <svg className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-accent-700 mb-1 sm:mb-2 text-center">
              {goals?.intermediateGoals?.filter(g => g.status === 'In Progress').length || 0}
            </div>
            <div className="text-xs sm:text-sm text-accent-600 font-medium text-center">In Progress</div>
          </Card>
          
          <Card variant="glass" className="group hover:scale-105" hover>
            <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-gradient-to-br from-surface-400 to-surface-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 shadow-medium">
              <svg className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-surface-700 mb-1 sm:mb-2 text-center">
              {goals?.intermediateGoals?.filter(g => g.status === 'Not Started').length || 0}
            </div>
            <div className="text-xs sm:text-sm text-surface-600 font-medium text-center">Not Started</div>
          </Card>
        </div>

        {/* Main Financial Goal */}
        <Card variant="gradient" className="p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
            <div className="mb-2 sm:mb-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-surface-900 mb-1 sm:mb-2">
                RT1M Goal: {formatCurrency(profile?.financialGoal?.targetAmount || 1000000)}
              </h2>
              <p className="text-sm sm:text-base text-surface-600">
                Target by {profile?.financialGoal?.targetYear || new Date().getFullYear() + 10}
              </p>
            </div>
            <Badge variant={getStatusColor(status) as any}>
              {status}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-medium text-surface-700">Overall Progress</span>
              <span className="text-xs sm:text-sm font-medium text-surface-700">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-surface-200 rounded-full h-3 sm:h-4">
              <div 
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 sm:h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
              <div className="text-sm sm:text-base lg:text-lg font-bold text-green-700">
                {formatCurrency(stats?.netWorth || 0)}
              </div>
              <div className="text-xs sm:text-sm text-green-600">Current Net Worth</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
              <div className="text-sm sm:text-base lg:text-lg font-bold text-blue-700">
                {formatCurrency((profile?.financialGoal?.targetAmount || 0) - (stats?.netWorth || 0))}
              </div>
              <div className="text-xs sm:text-sm text-blue-600">Remaining to Goal</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
              <div className="text-sm sm:text-base lg:text-lg font-bold text-purple-700">
                {formatCurrency(monthlyTarget)}
              </div>
              <div className="text-xs sm:text-sm text-purple-600">Monthly Target</div>
            </div>
          </div>
        </Card>

        {/* All Goals */}
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-surface-900">All Goals</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Existing Goals */}
            {goals?.intermediateGoals
              ?.slice()
              ?.sort((a, b) => {
                // Sort by target date, with goals without dates at the end
                if (!a.targetDate && !b.targetDate) return 0;
                if (!a.targetDate) return 1;
                if (!b.targetDate) return -1;
                return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
              })
              ?.map((goal, index) => (
              <div key={goal.id || index} className="cursor-pointer" onClick={() => openDetailsModal(goal)}>
                <Card variant="glass" className="p-2 sm:p-3 lg:p-4 h-[300px] sm:h-[350px] lg:h-[400px] flex flex-col" hover>
                {/* Header Section - Fixed Height */}
                <div className="h-14 sm:h-16 mb-1 sm:mb-2 flex-shrink-0">
                  {/* Header with icon and title */}
                  <div className="flex items-start gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <span className="text-sm sm:text-lg mt-0.5 flex-shrink-0">{getGoalTypeIcon(goal.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-semibold text-surface-900 leading-tight break-words line-clamp-2" title={goal.title}>
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
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${getGoalTypeColor(goal.type)}`}>
                      {goal.type}
                    </span>
                    <Badge 
                      variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'primary' : 'neutral' as any} 
                      className="px-1.5 sm:px-2 py-0.5 text-xs font-medium"
                    >
                      {goal.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Progress Section - Fixed Height */}
                <div className="h-10 sm:h-12 mb-1 sm:mb-2 flex-shrink-0">
                  <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium text-surface-600">Progress</span>
                    <span className="text-xs sm:text-sm font-medium text-surface-600">
                      {getGoalProgress(goal).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-1.5 sm:h-2">
                    <div 
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
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
                <div className="h-16 mb-2 flex-shrink-0">
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
                    <div className="mb-2 p-1.5 bg-surface-50 rounded text-xs text-surface-600">
                      <div className="line-clamp-3">
                        {goal.description}
                      </div>
                    </div>
                  )}
                  {goal.submilestones && goal.submilestones.length > 0 && (
                    <div className="pt-1.5 border-t border-surface-200">
                      <div className="flex justify-between items-center mb-1">
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
            )) || []}
            
            {/* Add New Goal Card */}
            <div 
              className="p-3 sm:p-4 border-2 border-dashed border-surface-300 hover:border-primary-300 transition-colors cursor-pointer bg-white rounded-lg shadow-sm h-[300px] sm:h-[350px] lg:h-[400px] flex items-center justify-center"
              onClick={openAddModal}
            >
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 mx-auto">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-base font-medium text-surface-900 mb-1 sm:mb-2">
                  Add New Goal
                </h4>
                <p className="text-xs sm:text-sm text-surface-600">
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
                <div className="space-y-2">
                  {goalForm.submilestones.map((submilestone, index) => (
                    <div key={submilestone.id} className="p-2 border border-surface-200 rounded-lg bg-surface-50">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs sm:text-sm font-medium text-surface-700">Submilestone {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeSubmilestone(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Input
                          label="Title"
                          value={submilestone.title}
                          onChange={(e) => updateSubmilestone(index, 'title', e.target.value)}
                          placeholder="Submilestone title"
                        />
                        
                        <div className={`grid gap-1.5 ${goalForm.type === 'financial' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
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
                        
                        <div className="space-y-1">
                          <label className="block text-xs sm:text-sm font-medium text-surface-700">
                            Description
                          </label>
                          <textarea
                            value={submilestone.description}
                            onChange={(e) => updateSubmilestone(index, 'description', e.target.value)}
                            placeholder="Brief description of this submilestone..."
                            rows={1}
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
                <p className="text-xs sm:text-sm text-surface-500 text-center py-2">
                  No submilestones added yet. Break down your goal into smaller steps.
                </p>
              )}
            </div>
            
            <div className="flex justify-between pt-2 sm:pt-3">
              {editingGoal && editingGoal.id && (
                <Button 
                  variant="outline" 
                  onClick={() => handleDeleteGoal(editingGoal.id!)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete Goal
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

        <MiniChatbot />

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
      <Footer />
    </div>
  );
} 