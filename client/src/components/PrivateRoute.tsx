import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingProtection } from '../hooks/useOnboardingProtection';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: onboardingLoading, onboardingCompleted } = useOnboardingProtection();

  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // The useOnboardingProtection hook handles redirection automatically
  // We just need to show loading or the content
  return <>{children}</>;
} 