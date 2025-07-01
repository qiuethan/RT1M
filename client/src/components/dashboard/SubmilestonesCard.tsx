import React from 'react';
import { Card, Badge } from '../ui';
import { IntermediateGoal, Submilestone } from '../../services/firestore';

interface SubmilestonesCardProps {
  goals: IntermediateGoal[];
  onSubmilestoneToggle: (goalId: string, submilestoneId: string) => void;
}

const SubmilestonesCard: React.FC<SubmilestonesCardProps> = ({ 
  goals, 
  onSubmilestoneToggle 
}) => {
  // Extract all submilestones from all goals with goal context
  const allSubmilestones = React.useMemo(() => {
    const submilestones: Array<Submilestone & { goalTitle: string; goalId: string; goalType: string }> = [];
    
    goals?.forEach(goal => {
      if (goal.submilestones && goal.submilestones.length > 0) {
        goal.submilestones.forEach(sub => {
          submilestones.push({
            ...sub,
            goalTitle: goal.title,
            goalId: goal.id || '',
            goalType: goal.type
          });
        });
      }
    });
    
    // Sort by target date (earliest first), with no date items at the end
    return submilestones.sort((a, b) => {
      if (!a.targetDate && !b.targetDate) return 0;
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
  }, [goals]);

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
      case 'financial': return 'bg-green-100 text-green-800';
      case 'skill': return 'bg-blue-100 text-blue-800';
      case 'behavior': return 'bg-purple-100 text-purple-800';
      case 'lifestyle': return 'bg-orange-100 text-orange-800';
      case 'networking': return 'bg-pink-100 text-pink-800';
      case 'project': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-surface-100 text-surface-800';
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

  const getDateStatus = (targetDate?: string) => {
    if (!targetDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { status: 'today', text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays <= 7) {
      return { status: 'soon', text: `${diffDays} days left`, color: 'text-yellow-600' };
    } else if (diffDays <= 30) {
      return { status: 'upcoming', text: `${diffDays} days left`, color: 'text-blue-600' };
    } else {
      return { status: 'future', text: `${diffDays} days left`, color: 'text-surface-600' };
    }
  };

  if (allSubmilestones.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-semibold text-surface-900">To-Do List</h3>
          <Badge variant="secondary">
            0 tasks
          </Badge>
        </div>
        <div className="text-center py-6 sm:py-8 text-surface-500">
          <div className="text-3xl sm:text-4xl mb-2">📋</div>
          <p className="text-sm">No tasks created yet</p>
          <p className="text-xs text-surface-400 mt-1">Add submilestones to your goals to break them into smaller steps</p>
        </div>
      </Card>
    );
  }

  const completedCount = allSubmilestones.filter(sub => sub.completed).length;
  const overdueSoon = allSubmilestones.filter(sub => {
    const dateStatus = getDateStatus(sub.targetDate);
    return !sub.completed && (dateStatus?.status === 'overdue' || dateStatus?.status === 'today' || dateStatus?.status === 'soon');
  }).length;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-lg sm:text-xl font-semibold text-surface-900">To-Do List</h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge variant="secondary">
            {allSubmilestones.length} tasks
          </Badge>
          <Badge variant="success">
            {completedCount} completed
          </Badge>
          {overdueSoon > 0 && (
            <Badge variant="error">
              {overdueSoon} urgent
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
        {allSubmilestones.map((submilestone) => {
          const dateStatus = getDateStatus(submilestone.targetDate);
          
          return (
            <div
              key={`${submilestone.goalId}-${submilestone.id}`}
              className="flex items-start gap-2 sm:gap-3 p-3 bg-surface-50 hover:bg-surface-100 rounded-lg cursor-pointer transition-colors active:bg-surface-200"
              onClick={() => onSubmilestoneToggle(submilestone.goalId, submilestone.id)}
            >
              {/* Completion Status */}
              <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full mt-1 flex-shrink-0 transition-colors ${
                submilestone.completed ? 'bg-green-500' : 'bg-surface-300'
              }`}></div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Submilestone Title */}
                <div className={`text-sm sm:text-sm font-medium transition-colors ${
                  submilestone.completed ? 'text-surface-500 line-through' : 'text-surface-900'
                }`}>
                  {submilestone.title}
                </div>
                
                {/* Goal Context */}
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                  <span className="text-xs text-surface-500">from</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{getGoalTypeIcon(submilestone.goalType)}</span>
                    <span className="text-xs font-medium text-surface-700 truncate">
                      {submilestone.goalTitle}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                {submilestone.description && (
                  <p className="text-xs text-surface-600 mt-1 line-clamp-2">
                    {submilestone.description}
                  </p>
                )}
                
                {/* Details Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 sm:mt-2 text-xs">
                  {/* Target Amount - Only show for financial goals */}
                  {submilestone.goalType === 'financial' && submilestone.targetAmount && submilestone.targetAmount > 0 && (
                    <span className="text-surface-600 bg-surface-200 px-2 py-0.5 rounded text-xs inline-block w-fit">
                      {formatCurrency(submilestone.targetAmount)}
                    </span>
                  )}
                  
                  {/* Target Date */}
                  {submilestone.targetDate && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-surface-500">Due:</span>
                      <span className="font-medium">
                        {new Date(submilestone.targetDate).toLocaleDateString()}
                      </span>
                      {dateStatus && !submilestone.completed && (
                        <span className={`font-medium ${dateStatus.color}`}>
                          ({dateStatus.text})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Goal Type Badge - Smaller on mobile */}
              <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 ${getGoalTypeColor(submilestone.goalType)}`}>
                <span className="hidden sm:inline">{getGoalTypeIcon(submilestone.goalType)} {submilestone.goalType}</span>
                <span className="sm:hidden">{getGoalTypeIcon(submilestone.goalType)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SubmilestonesCard; 