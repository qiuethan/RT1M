import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'primary' | 'secondary' | 'accent' | 'glass';
}

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  variant = 'default'
}: CardProps) => {
  const baseClasses = 'rounded-xl border transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-large hover:-translate-y-1 cursor-pointer' : '';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'bg-white border-surface-200 shadow-soft',
    gradient: 'bg-gradient-to-br from-white via-white to-primary-50/30 border-primary-200/50 shadow-medium',
    primary: 'bg-gradient-to-br from-primary-50 to-primary-100/50 border-primary-200 shadow-medium',
    secondary: 'bg-gradient-to-br from-secondary-50 to-secondary-100/50 border-secondary-200 shadow-medium',
    accent: 'bg-gradient-to-br from-accent-50 to-accent-100/50 border-accent-200 shadow-medium',
    glass: 'bg-white/70 backdrop-blur-sm border-white/50 shadow-soft',
  };

  const classes = `${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Card; 