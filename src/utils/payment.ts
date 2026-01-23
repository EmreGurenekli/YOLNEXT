// Payment utilities
export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  orderId: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  redirectUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'wallet';
  name: string;
  last4?: string;
  isDefault: boolean;
}

// Mock payment methods
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'credit_card',
    name: 'Visa **** 1234',
    last4: '1234',
    isDefault: true,
  },
  {
    id: '2',
    type: 'credit_card',
    name: 'Mastercard **** 5678',
    last4: '5678',
    isDefault: false,
  },
  {
    id: '3',
    type: 'bank_transfer',
    name: 'Banka Havalesi',
    isDefault: false,
  },
];

// Mock payment processing
export const processPayment = async (
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock validation
  if (paymentRequest.amount <= 0) {
    return {
      success: false,
      message: 'Geçersiz tutar',
    };
  }

  if (paymentRequest.amount > 100000) {
    return {
      success: false,
      message: 'Tutar limiti aşıldı (Max: 100,000 TL)',
    };
  }

  // Mock successful payment
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    transactionId,
    message: 'Ödeme başarıyla tamamlandı',
    redirectUrl: `/payment/success/${transactionId}`,
  };
};

// Mock payment verification
export const verifyPayment = async (
  transactionId: string
): Promise<boolean> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock verification (always returns true for demo)
  return transactionId.startsWith('TXN_');
};

// Mock refund
export const processRefund = async (
  transactionId: string,
  amount: number
): Promise<PaymentResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    success: true,
    transactionId: `REF_${Date.now()}`,
    message: `₺${amount} iade edildi`,
  };
};

// Format currency - Re-export from format.ts for backward compatibility
import { formatCurrency as formatCurrencyBase } from './format';
export const formatCurrency = (
  amount: number,
  currency: string = 'TRY'
): string => {
  return formatCurrencyBase(amount, currency);
};

// Validate payment amount
export const validatePaymentAmount = (
  amount: number
): { isValid: boolean; message?: string } => {
  if (amount <= 0) {
    return { isValid: false, message: "Tutar 0'dan büyük olmalıdır" };
  }

  if (amount > 100000) {
    return { isValid: false, message: 'Tutar limiti aşıldı (Max: 100,000 TL)' };
  }

  if (amount < 1) {
    return { isValid: false, message: "Minimum tutar 1 TL'dir" };
  }

  return { isValid: true };
};

// Calculate commission
export const calculateCommission = (
  amount: number,
  commissionRate: number = 0.01
): number => {
  return Math.round(amount * commissionRate * 100) / 100; // Round to 2 decimal places
};

// Calculate net amount
export const calculateNetAmount = (
  amount: number,
  commissionRate: number = 0.01
): number => {
  const commission = calculateCommission(amount, commissionRate);
  return Math.round((amount - commission) * 100) / 100;
};
