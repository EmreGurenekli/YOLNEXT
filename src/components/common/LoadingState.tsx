import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  type?: 'spinner' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  type = 'spinner', 
  size = 'md', 
  text = 'Yükleniyor...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderLoadingIcon = () => {
    switch (type) {
      case 'spinner':
        return <RefreshCw className={`${sizeClasses[size]} animate-spin text-slate-600`} />;
      case 'pulse':
        return <Loader2 className={`${sizeClasses[size]} animate-pulse text-slate-600`} />;
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={`w-2 h-2 bg-slate-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 bg-slate-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 bg-slate-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      default:
        return <RefreshCw className={`${sizeClasses[size]} animate-spin text-slate-600`} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="mb-4">
        {renderLoadingIcon()}
      </div>
      {text && (
        <p className={`text-slate-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingState;

