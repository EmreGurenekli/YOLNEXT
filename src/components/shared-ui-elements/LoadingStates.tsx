import React from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-blue-600`} />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-1/3" />
    </div>
  );
}

interface ProgressIndicatorProps {
  current: number;
  total: number;
  className?: string;
  showPercentage?: boolean;
  showSteps?: boolean;
  stepLabels?: string[];
}

export function ProgressIndicator({ 
  current, 
  total, 
  className = '', 
  showPercentage = true,
  showSteps = false,
  stepLabels = []
}: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {showSteps && (
        <div className="flex items-center justify-between text-sm">
          {Array.from({ length: total }).map((_, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                index < current 
                  ? 'bg-blue-600 text-white' 
                  : index === current 
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {index < current ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {stepLabels[index] && (
                <span className={`ml-2 text-xs ${
                  index <= current ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {stepLabels[index]}
                </span>
              )}
              {index < total - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  index < current ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded">
              {percentage}%
            </span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between text-xs text-gray-600">
        <span>Adım {current} / {total}</span>
        <span>{percentage}% tamamlandı</span>
      </div>
    </div>
  );
}

interface StatusMessageProps {
  type: 'loading' | 'success' | 'error' | 'warning';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function StatusMessage({ type, message, onDismiss, className = '' }: StatusMessageProps) {
  const typeConfig = {
    loading: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: Loader2,
      iconClass: 'text-blue-600 animate-spin',
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: CheckCircle,
      iconClass: 'text-green-600',
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: AlertCircle,
      iconClass: 'text-red-600',
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      icon: AlertCircle,
      iconClass: 'text-yellow-600',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex items-center p-4 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconClass}`} />
      <span className={`ml-3 text-sm font-medium ${config.textColor}`}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`ml-auto ${config.textColor} hover:opacity-75 transition-opacity`}
        >
          ×
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            action.variant === 'secondary'
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-configured loading states for common use cases
export const LoadingStates = {
  dashboard: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      <TableSkeleton rows={5} />
    </div>
  ),
  
  form: () => <FormSkeleton />,
  
  table: (rows = 5) => <TableSkeleton rows={rows} />,
  
  card: () => <CardSkeleton />,
  
  spinner: (text?: string) => <LoadingSpinner text={text} />,
};

export default LoadingStates;
