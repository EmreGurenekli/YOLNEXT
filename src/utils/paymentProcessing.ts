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

export { formatCurrency } from './format';

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

export const calculateCommission = (
  amount: number,
  commissionRate: number = 0.01
): number => {
  return Math.round(amount * commissionRate * 100) / 100;
};

export const calculateNetAmount = (
  amount: number,
  commissionRate: number = 0.01
): number => {
  const commission = calculateCommission(amount, commissionRate);
  return Math.round((amount - commission) * 100) / 100;
};
