import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Yükleniyor...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className='text-center'>
        <RefreshCw
          className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto mb-2`}
        />
        <p className='text-gray-600'>{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
