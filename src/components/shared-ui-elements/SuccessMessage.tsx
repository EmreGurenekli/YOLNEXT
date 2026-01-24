import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  className?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  isVisible,
  onClose,
  duration = 5000,
  className = '',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div
        className={`bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg transition-all duration-300 ${
          isAnimating
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }`}
      >
        <div className='flex items-center'>
          <CheckCircle className='w-5 h-5 text-green-600 mr-3' />
          <p className='text-green-800 font-medium flex-1'>{message}</p>
          <button
            onClick={onClose}
            className='text-green-400 hover:text-green-600 transition-colors ml-3'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;











