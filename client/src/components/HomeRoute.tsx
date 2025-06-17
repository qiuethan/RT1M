import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Landing from '../pages/Landing';

const HomeRoute = () => {
  const { currentUser } = useAuth();
  
  // If user is authenticated, redirect to dashboard
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user is not authenticated, show landing page
  return <Landing />;
};

export default HomeRoute; 