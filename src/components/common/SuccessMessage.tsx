import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  isVisible?: boolean;
  className?: string;
  onClose?: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  isVisible = true,
  className = '',
  onClose
}) => {
  if (!isVisible) return null;
  
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 flex items-center ${className}`}>
      <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
      <p className="text-green-800 flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;