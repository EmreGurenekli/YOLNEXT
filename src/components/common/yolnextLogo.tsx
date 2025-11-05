import React from 'react';
import { Truck } from 'lucide-react';

interface YolNextLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'normal' | 'banner';
}

const YolNextLogo: React.FC<YolNextLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'normal',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // Banner logo için resim boyutları
  const bannerSizeClasses = {
    sm: 'w-24 h-8',
    md: 'w-32 h-10',
    lg: 'w-48 h-12',
  };

  if (variant === 'banner') {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src='/img/Picsart_25-10-17_12-49-03-985.png'
          alt='YolNext Banner Logo'
          className={`${bannerSizeClasses[size]} object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center`}
      >
        <Truck
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7'} text-white`}
        />
      </div>
      {showText && (
        <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
          YolNext
        </span>
      )}
    </div>
  );
};

export default YolNextLogo;
