import { ReactNode } from 'react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'accent' | 'error';
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'primary' 
}: StatCardProps) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    secondary: 'text-secondary-600 bg-secondary-50',
    accent: 'text-accent-600 bg-accent-50',
    error: 'text-error-600 bg-error-50',
  };

  return (
    <Card hover className="transition-all duration-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-surface-500">{title}</p>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              <svg
                className={`w-4 h-4 mr-1 ${
                  trend.isPositive ? 'text-secondary-500' : 'text-error-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={trend.isPositive ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'}
                />
              </svg>
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-secondary-600' : 'text-error-600'
              }`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard; 