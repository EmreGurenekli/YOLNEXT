import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ValidationMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ 
  type, 
  message, 
  className = '' 
}) => {
  const typeClasses = {
    error: 'text-red-600 bg-red-50 border-red-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const iconClasses = {
    error: 'text-red-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${typeClasses[type]} ${className}`}>
      <Icon className={`w-4 h-4 ${iconClasses[type]}`} />
      {message}
    </div>
  );
};

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`mt-1 ${className}`}>
      <ValidationMessage type="error" message={error} />
    </div>
  );
};

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      <FieldError error={error} />
    </div>
  );
};

// Validation rules
export const validationRules = {
  required: (value: string) => {
    if (!value || value.trim() === '') {
      return 'Bu alan zorunludur';
    }
    return null;
  },
  
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Geçerli bir e-posta adresi girin';
    }
    return null;
  },
  
  phone: (value: string) => {
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Geçerli bir telefon numarası girin';
    }
    return null;
  },
  
  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `En az ${min} karakter olmalıdır`;
    }
    return null;
  },
  
  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `En fazla ${max} karakter olmalıdır`;
    }
    return null;
  },
  
  numeric: (value: string) => {
    if (value && isNaN(Number(value))) {
      return 'Sadece sayı girin';
    }
    return null;
  },
  
  positive: (value: string) => {
    if (value && Number(value) <= 0) {
      return 'Pozitif bir değer girin';
    }
    return null;
  }
};

// Validation helper
export const validateField = (value: string, rules: Array<(value: string) => string | null>) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

