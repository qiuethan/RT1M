interface ProgressBarProps {
  current: number;
  target: number;
  className?: string;
}

const ProgressBar = ({ current, target, className = '' }: ProgressBarProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isCompleted = percentage >= 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-surface-700">Progress to Goal</span>
        <span className={`text-sm font-bold ${isCompleted ? 'text-secondary-600' : 'text-primary-600'}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-surface-200 rounded-full h-3 relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface-100 to-surface-200"></div>
        
        {/* Progress bar with gradient */}
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out relative ${
            isCompleted 
              ? 'bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-600' 
              : 'bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600'
          }`}
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
        </div>
        
        {/* Celebration particles for completed goals */}
        {isCompleted && (
          <>
            <div className="absolute top-0 left-1/4 w-1 h-1 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute top-0 left-3/4 w-1 h-1 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </>
        )}
      </div>
      
      {isCompleted && (
        <div className="mt-2 flex items-center justify-center">
          <span className="text-xs font-medium text-secondary-600 bg-secondary-50 px-2 py-1 rounded-full">
            🎉 Goal Achieved!
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar; 