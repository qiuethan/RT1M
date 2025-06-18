import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createUserProfile, testCallable } from '../services/firestore';
import toast from 'react-hot-toast';
import { Logo, Button, Input, Card } from '../components/ui';

// Custom error message mapping for Firebase errors
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please try logging in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long with a mix of letters, numbers, and symbols.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many requests. Please wait a few minutes before trying again.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    agreeToTerms: ''
  });
  const [loading, setLoading] = useState(false);
  const { signup, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const validateDisplayName = (displayName: string): string => {
    if (!displayName.trim()) return 'Full name is required';
    if (displayName.trim().length < 2) return 'Full name must be at least 2 characters';
    return '';
  };

  const validateAgreeToTerms = (agreeToTerms: boolean): string => {
    if (!agreeToTerms) return 'You must agree to the Terms of Service and Privacy Policy to create an account';
    return '';
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing/changing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validate all fields
    const newErrors = {
      displayName: validateDisplayName(formData.displayName),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
      agreeToTerms: validateAgreeToTerms(formData.agreeToTerms)
    };
  
    setErrors(newErrors);
  
    // Check if there are any validation errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }
  
    try {
      setLoading(true);
  
      // Create user account
      const userCredential = await signup(formData.email, formData.password);
  
      // Create user profile with display name
      await createUserProfile(formData.displayName.trim());
  
      const user = userCredential.user;
  
      // Force refresh token
      if (user) {
        await user.getIdToken(true);
      }
  
      // Wait briefly for auth propagation
      await new Promise(resolve => setTimeout(resolve, 2000));
  
      // Test callable auth
      try {
        const result = await testCallable();
        if (!(result.data as any)?.hasAuth) {
          toast.error('Authentication not properly propagated. Try again shortly.');
          return;
        }
      } catch (err) {
        toast.error('Cloud function auth test failed.');
        return;
      }
  
      // Retry createUserProfile
      let retries = 0;
      const maxRetries = 5;
      while (retries < maxRetries) {
        try {
          await createUserProfile(formData.displayName.trim());
          break;
        } catch (err: any) {
          if (err.message.includes('authenticated') && retries < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 + 500 * retries));
            retries++;
          } else {
            throw err;
          }
        }
      }
  
      if (retries >= maxRetries) {
        throw new Error('Failed to create user profile after several attempts.');
      }
  
      toast.success('Welcome to RT1M! Your account has been created.');
      navigate('/dashboard');
    } catch (error: any) {
      const errorCode = error.code || error.message;
      const message = getFirebaseErrorMessage(errorCode);
  
      if (errorCode === 'auth/email-already-in-use' || errorCode === 'auth/invalid-email') {
        setErrors(prev => ({ ...prev, email: message }));
      } else if (errorCode === 'auth/weak-password') {
        setErrors(prev => ({ ...prev, password: message }));
      } else {
        toast.error(`Registration failed: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-surface-50 to-accent-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="xl" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-surface-900">
          Start your RT1M journey
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600">
          Join thousands on their road to $1,000,000
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow-card-hover sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              label="Full Name"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Enter your full name"
              error={errors.displayName}
            />

            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a strong password"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
            />

            <div className="space-y-2">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 rounded ${
                      errors.agreeToTerms ? 'border-error-500 focus:ring-error-500' : ''
                    }`}
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="agree-terms" className="text-sm text-surface-900">
                    I agree to the{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500 underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-error-600">{errors.agreeToTerms}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
              variant="secondary"
              disabled={loading || !formData.agreeToTerms}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-surface-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Sign in instead
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
} 