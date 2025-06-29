import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Logo, Button, Input, Card } from '../components/ui';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

// Custom error message mapping for Firebase errors
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/wrong-password':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/missing-password':
      return 'Password is required. Please enter your password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Email validation
  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Password validation
  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  // Handle input changes with real-time validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) setEmailError(''); // Clear error when user starts typing
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) setPasswordError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form inputs
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (emailValidationError || passwordValidationError) {
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back! You\'ve been logged in successfully.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract Firebase error code
      const errorCode = error.code || error.message;
      const userFriendlyMessage = getFirebaseErrorMessage(errorCode);
      
      // Show specific error message based on error type
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-email') {
        setEmailError(userFriendlyMessage);
      } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/missing-password') {
        setPasswordError(userFriendlyMessage);
      } else {
        toast.error(userFriendlyMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-surface-50 to-secondary-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="xl" />
        </div>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-surface-900">
          Welcome back!
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600">
          Continue your journey to financial freedom
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-6 sm:py-8 px-4 sm:px-10 shadow-card-hover">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              error={emailError}
              className="text-base" // Prevents zoom on mobile
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              error={passwordError}
              className="text-base" // Prevents zoom on mobile
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-surface-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors py-2 px-1 -mx-1 rounded min-h-[44px] flex items-center"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full min-h-[44px]"
              size="lg"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-4 sm:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-surface-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <Link to="/signup">
                <Button variant="outline" className="w-full min-h-[44px]">
                  Create new account
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Background decorations - Simplified for mobile */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 sm:w-80 h-60 sm:h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
} 