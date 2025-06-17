import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge } from '../components/ui';
import Footer from '../components/Footer';
import { 
  getUserStats, 
  getUserProfile,
  UserStats,
  UserProfile 
} from '../services/firestore';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const [statsData, profileData] = await Promise.all([
          getUserStats(),
          getUserProfile()
        ]);
        setStats(statsData);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);



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
                Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0]}!
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

        {/* Progress to Target */}
        <Card className="mb-8 p-8">
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
            {profile?.intermediateGoals && profile.intermediateGoals.slice(0, 2).map((goal, index) => (
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
                      {goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-secondary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-sm text-surface-600">
                  ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
                </div>
              </Card>
            ))}

            {/* Add New Goal Card */}
            <div 
              className="p-6 border-2 border-dashed border-surface-300 hover:border-primary-300 transition-colors cursor-pointer bg-white rounded-lg shadow-sm"
              onClick={() => window.location.href = '/profile'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Financial Overview */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-xl font-semibold text-surface-900 mb-4">Financial Overview</h3>
            {profile?.financialInfo && (stats?.netWorth !== undefined) ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-700">
                      ${profile.financialInfo.annualIncome.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Annual Income</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-700">
                      ${profile.financialInfo.annualExpenses.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">Annual Expenses</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-700">
                      ${profile.financialInfo.totalAssets.toLocaleString()}
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
                Financial Assistant
              </Button>
            </div>
          </Card>
        </div>

        {/* Milestone Indicator */}
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-semibold text-surface-900 mb-4">Milestones</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-surface-900">$10K</div>
                <div className="text-sm text-secondary-600">
                  {currentAmount >= 10000 ? 'Completed ✓' : 'Not Started'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                currentAmount >= 50000 ? 'bg-secondary-500' : 'bg-surface-300'
              }`}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-surface-900">$50K</div>
                <div className={`text-sm ${currentAmount >= 50000 ? 'text-secondary-600' : 'text-surface-500'}`}>
                  {currentAmount >= 50000 ? 'Completed ✓' : 'Not Started'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                currentAmount >= 100000 ? 'bg-secondary-500' : 
                currentAmount >= 50000 ? 'bg-primary-500 animate-pulse' : 'bg-surface-300'
              }`}>
                {currentAmount >= 100000 ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-surface-900">$100K</div>
                <div className={`text-sm ${
                  currentAmount >= 100000 ? 'text-secondary-600' : 
                  currentAmount >= 50000 ? 'text-primary-600' : 'text-surface-500'
                }`}>
                  {currentAmount >= 100000 ? 'Completed ✓' : 
                   currentAmount >= 50000 ? 'In Progress' : 'Not Started'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                currentAmount >= 250000 ? 'bg-secondary-500' : 
                currentAmount >= 100000 ? 'bg-primary-500 animate-pulse' : 'bg-surface-300'
              }`}>
                {currentAmount >= 250000 ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-surface-900">$250K</div>
                <div className={`text-sm ${
                  currentAmount >= 250000 ? 'text-secondary-600' : 
                  currentAmount >= 100000 ? 'text-primary-600' : 'text-surface-500'
                }`}>
                  {currentAmount >= 250000 ? 'Completed ✓' : 
                   currentAmount >= 100000 ? 'In Progress' : 'Not Started'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                currentAmount >= 500000 ? 'bg-secondary-500' : 
                currentAmount >= 250000 ? 'bg-primary-500 animate-pulse' : 'bg-surface-300'
              }`}>
                {currentAmount >= 500000 ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-surface-900">$500K</div>
                <div className={`text-sm ${
                  currentAmount >= 500000 ? 'text-secondary-600' : 
                  currentAmount >= 250000 ? 'text-primary-600' : 'text-surface-500'
                }`}>
                  {currentAmount >= 500000 ? 'Completed ✓' : 
                   currentAmount >= 250000 ? 'In Progress' : 'Not Started'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                currentAmount >= targetAmount ? 'bg-secondary-500' : 
                currentAmount >= 500000 ? 'bg-primary-500 animate-pulse' : 'bg-surface-300'
              }`}>
                {currentAmount >= targetAmount ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-surface-900">${targetAmount.toLocaleString()}</div>
                <div className={`text-sm ${
                  currentAmount >= targetAmount ? 'text-secondary-600' : 
                  currentAmount >= 500000 ? 'text-primary-600' : 'text-surface-500'
                }`}>
                  {currentAmount >= targetAmount ? 'Goal Achieved! 🎉' : 
                   currentAmount >= 500000 ? 'In Progress' : 'Goal'}
                </div>
              </div>
            </div>
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
    </div>
  );
}; 