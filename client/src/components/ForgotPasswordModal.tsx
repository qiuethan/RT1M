import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Modal, Button, Input } from './ui';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  // Email validation
  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) setEmailError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);

    if (emailValidationError) {
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      const errorCode = error.code || error.message;
      let errorMessage = 'An error occurred. Please try again.';
      
      switch (errorCode) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          setEmailError(errorMessage);
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          setEmailError(errorMessage);
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
          toast.error(errorMessage);
          break;
        default:
          toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setEmailSent(false);
    setLoading(false);
    onClose();
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail('');
    setEmailError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password" className="max-w-md">
      {!emailSent ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm text-surface-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              error={emailError}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Send Reset Email
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-surface-900 mb-2">
            Check Your Email
          </h3>
          
          <p className="text-sm text-surface-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Check your inbox and follow the instructions to reset your password.
          </p>
          
          <div className="space-y-3">
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
            
            <Button
              onClick={handleTryAgain}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
          </div>
          
          <p className="text-xs text-surface-500 mt-4">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>
      )}
    </Modal>
  );
}; 