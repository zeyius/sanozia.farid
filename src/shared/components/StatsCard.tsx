import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple';
}

const colorClasses = {
  green: {
    bg: 'from-green-50 to-green-100',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-900'
  },
  blue: {
    bg: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-900'
  },
  orange: {
    bg: 'from-orange-50 to-orange-100',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    text: 'text-orange-900'
  },
  red: {
    bg: 'from-red-50 to-red-100',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900'
  },
  purple: {
    bg: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    text: 'text-purple-900'
  }
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'blue' 
}: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`bg-gradient-to-br ${colors.bg} ${colors.border} border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && (
              <div className={`${colors.icon}`}>
                {icon}
              </div>
            )}
            <h3 className={`text-sm font-medium ${colors.text}/70`}>
              {title}
            </h3>
          </div>
          
          <div className="mb-1">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {value}
            </span>
          </div>
          
          {subtitle && (
            <p className={`text-xs ${colors.text}/60`}>
              {subtitle}
            </p>
          )}
        </div>

        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend.isPositive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <svg 
              className={`w-3 h-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}
