import React from 'react';

interface YolNextLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
    xl: 'h-24 w-auto',
  };

  const textSizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const bannerSizeClasses = {
    sm: 'w-24 h-8',
    md: 'w-32 h-10',
    lg: 'w-48 h-12',
    xl: 'w-[280px] h-[70px]',
  };

  // PNG/JPG logo paths for different sizes
  const getLogoPath = (size: string, variant: string) => {
    // For now, use the original PNG for all sizes
    // Later, you can add optimized versions for each size
    if (variant === 'banner') {
      return '/img/yolnext-logo-original.png';
    }
    return '/img/yolnext-logo-original.png';
  };

  if (variant === 'banner') {
    // Banner aspect ratio: 3:1
    const bannerSizes = {
      sm: { width: '120px', height: '40px' },   // 3:1 ratio
      md: { width: '180px', height: '60px' },   // 3:1 ratio
      lg: { width: '240px', height: '80px' },   // 3:1 ratio
      xl: { width: '300px', height: '100px' },  // 3:1 ratio
    };
    const bannerSize = bannerSizes[size] || bannerSizes.md;
    
    // Extract height from className if provided (e.g., 'h-9', 'h-12')
    const heightMatch = className.match(/h-(\d+)/);
    const customHeight = heightMatch ? `${parseInt(heightMatch[1]) * 0.25}rem` : null;
    const calculatedWidth = customHeight ? `${parseFloat(customHeight) * 3}rem` : bannerSize.width;
    const finalHeight = customHeight || bannerSize.height;
    
    // Clean className - remove height classes but keep others
    const cleanClassName = className.replace(/h-\d+/g, '').trim();
    
    return (
      <div 
        className={`inline-flex items-center justify-center ${cleanClassName}`} 
        style={{ 
          width: calculatedWidth, 
          height: finalHeight
        }}
      >
        <img
          src={getLogoPath(size, 'banner')}
          alt='YolNext Banner Logo'
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            imageRendering: 'auto' as const,
            display: 'block'
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`} style={{ overflow: 'hidden' }}>
      <img
        src={getLogoPath(size, 'normal')}
        alt='YolNext Logo'
        className={`${sizeClasses[size]} object-contain`}
        style={{ 
          objectFit: 'contain',
          imageRendering: 'auto' as const,
        }}
      />
      {showText && (
        <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
          YolNext
        </span>
      )}
    </div>
  );
};

export default YolNextLogo;
