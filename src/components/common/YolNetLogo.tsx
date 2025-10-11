import React from 'react';
import { Truck } from 'lucide-react';

interface YolNetLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function YolNetLogo({ 
  className = '', 
  size = 'md', 
  showText = true 
}: YolNetLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-blue-600 rounded-lg p-1">
        <Truck className={`${sizeClasses[size]} text-white`} />
      </div>
      {showText && (
        <span className={`font-bold text-blue-600 ${textSizeClasses[size]}`}>
          YolNet
        </span>
      )}
    </div>
  );
}