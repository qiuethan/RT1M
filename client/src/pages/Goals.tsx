import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Select } from '../components/ui';
import Footer from '../components/Footer';
import { 
  getUserGoals, 
  addGoal, 
  updateGoal, 
  deleteGoal, 
  Goal 
} from '../services/firestore';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  // Form data for new goal
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    category: 'financial'
  });

  const categories = [
    { value: 'financial', label: 'Financial' },
    { value: 'career', label: 'Career' },
    { value: 'personal', label: 'Personal' },
    { value: 'health', label: 'Health' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
  ];

  // Load goals on component mount
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoading(true);
        const goalsData = await getUserGoals();
        setGoals(goalsData);
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.title || !newGoal.deadline) return;

    try {
      setAddingGoal(true);
      await addGoal({
        title: newGoal.title,
        targetAmount: newGoal.targetAmount ? parseFloat(newGoal.targetAmount) : undefined,
        deadline: newGoal.deadline,
        category: newGoal.category
      });

      // Refresh goals list
      const goalsData = await getUserGoals();
      setGoals(goalsData);
      
      // Reset form
      setNewGoal({
        title: '',
        targetAmount: '',
        deadline: '',
        category: 'financial'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding goal:', error);
    } finally {
      setAddingGoal(false);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, newProgress: number, newStatus: Goal['status']) => {
    try {
      setEditingGoal(goalId);
      await updateGoal(goalId, { 
        progress: newProgress,
        status: newStatus
      });

      // Refresh goals list
      const goalsData = await getUserGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setEditingGoal(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteGoal(goalId);
      
      // Refresh goals list
      const goalsData = await getUserGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Not Started':
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-surface-900">Your Goals</h1>
              <p className="text-surface-600 mt-2">Track your personal and financial goals</p>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="group">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Goal
            </Button>
          </div>
        </div>

        {/* Add Goal Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add New Goal</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-surface-400 hover:text-surface-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddGoal} className="p-6 space-y-4">
                <Input
                  label="Goal Title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Save $10K Emergency Fund"
                  required
                />
                
                <Input
                  label="Target Amount (optional)"
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  placeholder="10000"
                />
                
                <Input
                  label="Target Date"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  required
                />
                
                <Select
                  label="Category"
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  options={categories}
                />
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={addingGoal}
                    className="flex-1"
                  >
                    Add Goal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Goal Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-surface-900 flex-1 mr-3">
                  {goal.title}
                </h3>
                <Badge 
                  variant={getStatusColor(goal.status) as any}
                  size="sm"
                >
                  {goal.status}
                </Badge>
              </div>

              {/* Category */}
              <div className="mb-3">
                <span className="text-sm text-surface-600 capitalize">
                  {goal.category}
                </span>
              </div>

              {/* Target Amount */}
              {goal.targetAmount && (
                <div className="mb-3">
                  <span className="text-sm text-surface-600">Target Amount:</span>
                  <div className="text-xl font-bold text-primary-600">
                    {formatCurrency(goal.targetAmount)}
                  </div>
                </div>
              )}

              {/* Deadline */}
              <div className="mb-4">
                <span className="text-sm text-surface-600">Target Date:</span>
                <div className="text-sm font-medium text-surface-900">
                  {formatDate(goal.deadline)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-surface-600">Progress</span>
                  <span className="text-sm font-medium text-surface-900">
                    {goal.progress}%
                  </span>
                </div>
                <div className="w-full bg-surface-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      goal.status === 'Completed' 
                        ? 'bg-secondary-500' 
                        : goal.status === 'In Progress'
                        ? 'bg-primary-500'
                        : 'bg-surface-400'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    const newProgress = goal.progress === 100 ? 0 : goal.progress + 25;
                    const newStatus = newProgress === 100 ? 'Completed' : 
                                     newProgress > 0 ? 'In Progress' : 'Not Started';
                    handleUpdateGoalProgress(goal.id!, newProgress, newStatus);
                  }}
                  loading={editingGoal === goal.id}
                >
                  {goal.progress === 100 ? 'Reset' : 'Update +25%'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteGoal(goal.id!)}
                  className="text-error-600 hover:bg-error-50"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}

          {/* Add New Goal Card */}
          <div 
            className="p-6 border-2 border-dashed border-surface-300 hover:border-primary-300 transition-colors cursor-pointer bg-white rounded-lg shadow-sm"
            onClick={() => setShowAddForm(true)}
          >
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-surface-900 mb-2">
                Add New Goal
              </h3>
              <p className="text-sm text-surface-600">
                Set a new financial or personal goal to track your progress
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-surface-900">
              {goals.length}
            </div>
            <div className="text-sm text-surface-600">Total Goals</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary-600">
              {goals.filter(g => g.status === 'Completed').length}
            </div>
            <div className="text-sm text-surface-600">Completed</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">
              {goals.filter(g => g.status === 'In Progress').length}
            </div>
            <div className="text-sm text-surface-600">In Progress</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-surface-400">
              {goals.filter(g => g.status === 'Not Started').length}
            </div>
            <div className="text-sm text-surface-600">Not Started</div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
} 