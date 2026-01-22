import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  role?: string;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled = false,
      children,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      role: buttonRole,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500 disabled:text-gray-500 disabled:cursor-not-allowed',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    );

    const renderIcon = () => {
      if (!icon) return null;
      return (
        <span 
          className="flex-shrink-0" 
          aria-hidden="true"
        >
          {icon}
        </span>
      );
    };

    const renderContent = () => {
      if (loading) {
        return (
          <>
            <span 
              className="animate-spin mr-2" 
              aria-hidden="true"
            >
              ⏳
            </span>
            <span aria-live="polite" aria-atomic="true">
              Yükleniyor...
            </span>
          </>
        );
      }

      if (icon && iconPosition === 'left') {
        return (
          <>
            {renderIcon()}
            <span className="ml-2">{children}</span>
          </>
        );
      }

      if (icon && iconPosition === 'right') {
        return (
          <>
            <span className="mr-2">{children}</span>
            {renderIcon()}
          </>
        );
      }

      return children;
    };

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        aria-busy={loading}
        role={buttonRole}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;