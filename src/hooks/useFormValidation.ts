import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string | null;
}

export interface FormData {
  [key: string]: any;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rule = rules[name];
      if (!rule) return null;

      // Required validation
      if (
        rule.required &&
        (!value || (typeof value === 'string' && value.trim() === ''))
      ) {
        return rule.message || `${name} alanı zorunludur`;
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return null;
      }

      // Min length validation
      if (
        rule.minLength &&
        typeof value === 'string' &&
        value.length < rule.minLength
      ) {
        return (
          rule.message || `${name} en az ${rule.minLength} karakter olmalıdır`
        );
      }

      // Max length validation
      if (
        rule.maxLength &&
        typeof value === 'string' &&
        value.length > rule.maxLength
      ) {
        return (
          rule.message ||
          `${name} en fazla ${rule.maxLength} karakter olmalıdır`
        );
      }

      // Pattern validation
      if (
        rule.pattern &&
        typeof value === 'string' &&
        !rule.pattern.test(value)
      ) {
        return rule.message || `${name} geçerli bir format değil`;
      }

      // Custom validation
      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [rules]
  );

  const validateForm = useCallback(
    (formData: FormData): boolean => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      Object.keys(rules).forEach(fieldName => {
        const error = validateField(fieldName, formData[fieldName]);
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [rules, validateField]
  );

  const validateFieldOnBlur = useCallback(
    (name: string, value: any) => {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
      setTouched(prev => ({
        ...prev,
        [name]: true,
      }));
    },
    [validateField]
  );

  const clearError = useCallback((name: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: null,
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasError = useCallback(
    (name: string): boolean => {
      return !!errors[name];
    },
    [errors]
  );

  const getError = useCallback(
    (name: string): string | null => {
      return errors[name] || null;
    },
    [errors]
  );

  const isFieldTouched = useCallback(
    (name: string): boolean => {
      return !!touched[name];
    },
    [touched]
  );

  const shouldShowError = useCallback(
    (name: string): boolean => {
      return isFieldTouched(name) && hasError(name);
    },
    [isFieldTouched, hasError]
  );

  return {
    errors,
    touched,
    validateField,
    validateForm,
    validateFieldOnBlur,
    clearError,
    clearAllErrors,
    hasError,
    getError,
    isFieldTouched,
    shouldShowError,
  };
};

// Common validation rules
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Geçerli bir e-posta adresi girin',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message:
      'Şifre en az 8 karakter, büyük harf, küçük harf ve rakam içermelidir',
  },
  phone: {
    required: true,
    pattern: /^(\+90|0)?[5][0-9]{9}$/,
    message: 'Geçerli bir telefon numarası girin (örn: 0555 123 45 67)',
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
    message: 'Ad sadece harf içerebilir (2-50 karakter)',
  },
  companyName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Şirket adı 2-100 karakter arasında olmalıdır',
  },
  taxNumber: {
    required: true,
    pattern: /^[0-9]{10}$/,
    message: 'Vergi numarası 10 haneli olmalıdır',
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: 'Adres 10-200 karakter arasında olmalıdır',
  },
  city: {
    required: true,
    message: 'Şehir seçimi zorunludur',
  },
  district: {
    required: true,
    message: 'İlçe seçimi zorunludur',
  },
  weight: {
    required: true,
    custom: (value: any) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return "Ağırlık 0'dan büyük bir sayı olmalıdır";
      }
      if (num > 10000) {
        return "Ağırlık 10.000 kg'dan fazla olamaz";
      }
      return null;
    },
  },
  volume: {
    custom: (value: any) => {
      if (!value) return null;
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return "Hacim 0'dan büyük bir sayı olmalıdır";
      }
      if (num > 100) {
        return "Hacim 100 m³'den fazla olamaz";
      }
      return null;
    },
  },
  price: {
    required: true,
    custom: (value: any) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return "Fiyat 0'dan büyük bir sayı olmalıdır";
      }
      if (num > 1000000) {
        return "Fiyat 1.000.000 TL'den fazla olamaz";
      }
      return null;
    },
  },
  date: {
    required: true,
    custom: (value: any) => {
      if (!value) return 'Tarih seçimi zorunludur';
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        return 'Tarih bugünden önce olamaz';
      }
      return null;
    },
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: 'Açıklama 10-500 karakter arasında olmalıdır',
  },
};
