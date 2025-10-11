import React from 'react';

interface YolNetLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
}

const YolNetLogo: React.FC<YolNetLogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = true,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const textColorClasses = {
    default: 'text-blue-600',
    white: 'text-white',
    dark: 'text-gray-900'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/logo.svg" 
        alt="YolNet Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} ${textColorClasses[variant]}`}>
          YolNet
        </span>
      )}
    </div>
  );
};

export default YolNetLogo;





