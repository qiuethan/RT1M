interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const Logo = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}: LogoProps) => {
  const sizes = {
    sm: { container: 'h-8', text: 'text-lg', icon: 'h-6 w-6' },
    md: { container: 'h-10', text: 'text-xl', icon: 'h-8 w-8' },
    lg: { container: 'h-12', text: 'text-2xl', icon: 'h-10 w-10' },
    xl: { container: 'h-16', text: 'text-4xl', icon: 'h-12 w-12' },
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Icon with gradient and growth arrow */}
      <div className={`relative ${sizes[size].container} ${sizes[size].icon} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 via-secondary-500 to-accent-500 rounded-lg shadow-lg"></div>
        <div className="absolute inset-0.5 bg-white rounded-lg flex items-center justify-center">
          <svg
            className={`${sizes[size].icon} text-primary-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        {/* Sparkle effect */}
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${sizes[size].text} font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent leading-none`}>
            RT1M
          </h1>
          {(size === 'lg' || size === 'xl') && (
            <span className="text-xs text-surface-500 font-medium tracking-wide">
              Road to 1 Million
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo; 