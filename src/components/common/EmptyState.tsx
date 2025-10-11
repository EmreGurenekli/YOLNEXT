import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-16 h-16 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg font-medium hover:from-slate-900 hover:to-blue-950 transition-all shadow-lg"
        >
          {action.icon && <action.icon className="w-5 h-5" />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

