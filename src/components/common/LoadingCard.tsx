import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Yükleniyor...',
  description,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-slate-200 p-8 ${className}`}
    >
      <div className='flex flex-col items-center justify-center space-y-4'>
        <LoadingSpinner size='lg' />
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-slate-900 mb-2'>{title}</h3>
          {description && (
            <p className='text-sm text-slate-600'>{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingCard;
