import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className='w-16 h-16 mx-auto mb-4 text-gray-400'>
        <Icon className='w-full h-full' />
      </div>
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h3>
      <p className='text-gray-600 mb-6 max-w-md mx-auto'>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
