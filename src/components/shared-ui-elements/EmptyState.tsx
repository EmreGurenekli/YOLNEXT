import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon | React.ReactElement;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className='w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-blue-100 to-slate-100 rounded-full flex items-center justify-center'>
        {React.isValidElement(icon) ? 
          icon : 
          React.createElement(icon as LucideIcon, { className: "w-10 h-10 text-blue-600" })
        }
      </div>
      <h3 className='text-xl font-bold text-gray-900 mb-3'>{title}</h3>
      <p className='text-gray-600 mb-6 max-w-md mx-auto leading-relaxed'>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className='px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-900 hover:to-slate-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105'
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;











