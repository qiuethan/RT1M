interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'white';
  text?: string;
  className?: string;
  showText?: boolean;
}

const LoadingSpinner = ({ 
  size = 'md',
  variant = 'primary',
  text = 'Loading...',
  className = '',
  showText = true
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const variants = {
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-secondary-200 border-t-secondary-600',
    accent: 'border-accent-200 border-t-accent-600',
    neutral: 'border-surface-200 border-t-surface-600',
    white: 'border-white/20 border-t-white'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const textColors = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600', 
    accent: 'text-accent-600',
    neutral: 'text-surface-600',
    white: 'text-white'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Main spinner */}
        <div 
          className={`animate-spin rounded-full border-4 ${sizes[size]} ${variants[variant]}`}
        />
        {/* Secondary ring for dual effect */}
        <div 
          className={`absolute inset-0 animate-spin rounded-full border-4 border-transparent ${sizes[size]}`}
          style={{ 
            borderRightColor: variant === 'primary' ? '#10b981' : 
                              variant === 'secondary' ? '#f59e0b' :
                              variant === 'accent' ? '#8b5cf6' : 
                              variant === 'white' ? 'rgba(255,255,255,0.5)' : '#6b7280',
            animationDelay: '0.15s',
            animationDuration: '1s'
          }}
        />
      </div>
      {showText && (
        <p className={`mt-3 font-medium ${textSizes[size]} ${textColors[variant]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 