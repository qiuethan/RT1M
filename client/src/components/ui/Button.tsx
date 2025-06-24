import { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'accent' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  className = '' 
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-500',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white focus:ring-accent-500',
    error: 'bg-error-500 hover:bg-error-600 text-white focus:ring-error-500',
    outline: 'border border-surface-300 bg-white hover:bg-surface-50 text-surface-700 focus:ring-primary-500',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          variant={variant === 'outline' ? 'neutral' : 'white'} 
          showText={false} 
          className="-ml-1 mr-3" 
        />
      )}
      {children}
    </button>
  );
};

export default Button; 