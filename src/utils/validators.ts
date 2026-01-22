import { z } from 'zod';
import {
  User,
  Shipment,
  Offer,
  ApiResponse,
  ValidationResult,
  CreateShipmentForm,
} from '../types/api';

// Zod schemas for validation
export const UserSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['individual', 'corporate', 'nakliyeci', 'tasiyici']),
  phone: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  isVerified: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ShipmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  pickup_address: z.string().min(1),
  delivery_address: z.string().min(1),
  weight: z.number().positive(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  price: z.number().positive(),
  status: z.enum([
    'pending',
    'accepted',
    'in_transit',
    'delivered',
    'cancelled',
  ]),
  user_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const OfferSchema = z.object({
  id: z.string().min(1),
  shipment_id: z.string().min(1),
  nakliyeci_id: z.string().min(1),
  price: z.number().positive(),
  message: z.string().optional(),
  estimated_delivery: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string().optional(),
});

export const CreateShipmentFormSchema = z.object({
  mainCategory: z.string().min(1, 'Kategori seçimi zorunludur'),
  productDescription: z
    .string()
    .min(10, 'Ürün açıklaması en az 10 karakter olmalıdır'),
  weight: z.string().min(1, 'Ağırlık zorunludur'),
  quantity: z.string().min(1, 'Miktar zorunludur'),
  pickupAddress: z.string().min(10, 'Alış adresi en az 10 karakter olmalıdır'),
  deliveryAddress: z
    .string()
    .min(10, 'Teslimat adresi en az 10 karakter olmalıdır'),
  pickupDate: z.string().min(1, 'Alış tarihi zorunludur'),
  deliveryDate: z.string().min(1, 'Teslimat tarihi zorunludur'),
  price: z.string().min(1, 'Fiyat zorunludur'),
  contactPerson: z
    .string()
    .min(2, 'İletişim kişisi en az 2 karakter olmalıdır'),
  phone: z
    .string()
    .min(1, 'Telefon numarası zorunludur')
    .refine((value) => {
      const raw = String(value ?? '').trim();
      if (!raw) return false;
      const digits = raw.replace(/\D/g, '');
      let normalized = digits;
      if (normalized.startsWith('90')) normalized = normalized.slice(2);
      if (normalized.startsWith('0')) normalized = normalized.slice(1);
      if (normalized.length !== 10) return false;
      if (!normalized.startsWith('5')) return false;
      return true;
    }, 'Geçerli bir telefon numarası giriniz'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
});

// Validation functions
export const validateUser = (data: unknown): ValidationResult => {
  try {
    UserSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Doğrulama hatası' }],
    };
  }
};

export const validateShipment = (data: unknown): ValidationResult => {
  try {
    ShipmentSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Doğrulama hatası' }],
    };
  }
};

export const validateOffer = (data: unknown): ValidationResult => {
  try {
    OfferSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Doğrulama hatası' }],
    };
  }
};

export const validateApiResponse = (data: unknown): ValidationResult => {
  try {
    ApiResponseSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Doğrulama hatası' }],
    };
  }
};

export const validateCreateShipmentForm = (
  data: CreateShipmentForm
): ValidationResult => {
  try {
    CreateShipmentFormSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Doğrulama hatası' }],
    };
  }
};

// Type-safe API response parser
export const parseApiResponse = <T>(data: unknown): ApiResponse<T> | null => {
  const validation = validateApiResponse(data);

  if (!validation.isValid) {
    // Invalid API response - handled by error boundary
    return null;
  }

  return data as ApiResponse<T>;
};

// Safe data accessor
export const safeGet = <T>(obj: any, path: string, defaultValue: T): T => {
  try {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Type guards
export const isUser = (data: unknown): data is User => {
  return validateUser(data).isValid;
};

export const isShipment = (data: unknown): data is Shipment => {
  return validateShipment(data).isValid;
};

export const isOffer = (data: unknown): data is Offer => {
  return validateOffer(data).isValid;
};

export const isApiResponse = (data: unknown): data is ApiResponse => {
  return validateApiResponse(data).isValid;
};

// Utility functions
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePrice = (price: string): boolean => {
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  return priceRegex.test(price);
};

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateFutureDate = (date: string): boolean => {
  const dateObj = new Date(date);
  const now = new Date();
  return dateObj > now;
};
