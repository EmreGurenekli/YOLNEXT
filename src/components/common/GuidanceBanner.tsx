import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

type Action = {
  label: string;
  to?: string;
  onClick?: () => void;
};

interface GuidanceBannerProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction: Action;
  secondaryAction?: Action;
  className?: string;
}

const GuidanceBanner: React.FC<GuidanceBannerProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  const renderAction = (action: Action, variant: 'primary' | 'secondary') => {
    const baseClass =
      variant === 'primary'
        ? 'inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg'
        : 'inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-all duration-200 border border-slate-200';

    if (action.to) {
      return (
        <Link to={action.to} className={baseClass} onClick={action.onClick}>
          {action.label}
        </Link>
      );
    }

    return (
      <button type='button' onClick={action.onClick} className={baseClass}>
        {action.label}
      </button>
    );
  };

  return (
    <div
      className={`w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5 shadow-sm ${className}`}
    >
      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <div className='flex items-start gap-3 flex-1'>
          {Icon && (
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-blue-900 text-white flex items-center justify-center shadow-sm flex-shrink-0'>
              <Icon className='w-5 h-5' />
            </div>
          )}
          <div className='min-w-0'>
            <div className='text-sm sm:text-base font-bold text-slate-900'>{title}</div>
            {description && (
              <div className='text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed'>
                {description}
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
          {secondaryAction && renderAction(secondaryAction, 'secondary')}
          {renderAction(primaryAction, 'primary')}
        </div>
      </div>
    </div>
  );
};

export default GuidanceBanner;
