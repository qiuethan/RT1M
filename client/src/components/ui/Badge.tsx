import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const Badge = ({ 
  children, 
  variant = 'neutral',
  size = 'md',
  className = '',
  onClick
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 border border-secondary-200',
    accent: 'bg-accent-100 text-accent-800 border border-accent-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    neutral: 'bg-surface-100 text-surface-700 border border-surface-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const Component = onClick ? 'button' : 'span';

  return (
    <Component className={classes} onClick={onClick} type={onClick ? 'button' : undefined}>
      {children}
    </Component>
  );
};

export default Badge; 