import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserFinancials } from '../services/firestore';

export const useOnboardingProtection = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile();
        
        // Check if essential fields are filled (matching onboarding validation requirements)
        // Note: Financial info (income/expenses) is NOT required for onboarding completion
        // as that step was removed from the onboarding process
        const hasBasicInfo = profile?.basicInfo?.name && 
                            profile?.basicInfo?.email && 
                            profile?.basicInfo?.country && 
                            profile?.basicInfo?.employmentStatus;
        
        const hasGoal = profile?.financialGoal?.targetAmount && 
                       profile?.financialGoal?.targetAmount > 0 &&
                       profile?.financialGoal?.targetYear && 
                       profile?.financialGoal?.targetYear > new Date().getFullYear();
        
        const completed = Boolean(hasBasicInfo && hasGoal);
        setOnboardingCompleted(completed);

        // If user hasn't completed onboarding and isn't on onboarding page
        if (!completed && location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true });
        }
        // If user has completed onboarding and is on onboarding page
        else if (completed && location.pathname === '/onboarding') {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error getting profile, assume onboarding is needed
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [currentUser, authLoading, navigate, location.pathname]);

  return {
    loading: loading || authLoading,
    onboardingCompleted,
    needsOnboarding: currentUser && !onboardingCompleted
  };
}; 