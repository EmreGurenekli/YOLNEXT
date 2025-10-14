import React from 'react';

interface LoadingStateProps {
  message?: string;
  text?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Yükleniyor...',
  text,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-600">{text || message}</p>
    </div>
  );
};

export default LoadingState;