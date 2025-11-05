import React, { useEffect } from 'react';
import { XCircle, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ErrorToastProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  type = 'error',
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-5 h-5' />;
      case 'warning':
        return <AlertCircle className='w-5 h-5' />;
      case 'info':
        return <Info className='w-5 h-5' />;
      default:
        return <XCircle className='w-5 h-5' />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 animate-slide-in-right ${getStyles()} border-l-4 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}
    >
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0'>{getIcon()}</div>
        <div className='flex-1'>
          <p className='text-sm font-medium'>{message}</p>
        </div>
        <button
          onClick={onClose}
          className='flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors'
        >
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ErrorToast;
