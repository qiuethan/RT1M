import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md'
}: CardProps) => {
  const baseClasses = 'bg-white rounded-lg border border-surface-200 transition-shadow';
  const hoverClasses = hover ? 'hover:shadow-card-hover cursor-pointer' : 'shadow-card';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Card; 