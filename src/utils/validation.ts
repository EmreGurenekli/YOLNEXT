export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRequired = (value: string | number | undefined | null): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validateNumeric = (value: string | number): boolean => {
  return !isNaN(Number(value));
};

export const validatePositiveNumber = (value: string | number): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

export const validateAddress = (address: string): boolean => {
  return address.trim().length >= 10;
};

export const validateWeight = (weight: string | number): boolean => {
  const num = Number(weight);
  return !isNaN(num) && num > 0 && num <= 50000;
};

export const validatePrice = (price: string | number): boolean => {
  const num = Number(price);
  return !isNaN(num) && num >= 0 && num <= 1000000;
};

export const shipmentValidationSchema = {
  title: (value: string) => {
    if (!validateRequired(value)) return 'Başlık zorunludur';
    if (!validateMinLength(value, 5)) return 'Başlık en az 5 karakter olmalıdır';
    if (!validateMaxLength(value, 100)) return 'Başlık en fazla 100 karakter olabilir';
    return null;
  },

  pickupAddress: (value: string) => {
    if (!validateRequired(value)) return 'Alış adresi zorunludur';
    if (!validateAddress(value)) return 'Alış adresi en az 10 karakter olmalıdır';
    return null;
  },

  deliveryAddress: (value: string) => {
    if (!validateRequired(value)) return 'Teslimat adresi zorunludur';
    if (!validateAddress(value)) return 'Teslimat adresi en az 10 karakter olmalıdır';
    return null;
  },

  weight: (value: string | number) => {
    if (!validateRequired(value)) return 'Ağırlık zorunludur';
    if (!validateWeight(value)) return 'Ağırlık 0-50000 kg arasında olmalıdır';
    return null;
  },

  price: (value: string | number) => {
    if (!validateRequired(value)) return 'Fiyat zorunludur';
    if (!validatePrice(value)) return 'Fiyat 0-1000000 TL arasında olmalıdır';
    return null;
  },

  pickupDate: (value: string) => {
    if (!validateRequired(value)) return 'Alış tarihi zorunludur';
    if (!validateDate(value)) return 'Geçerli bir tarih giriniz';
    if (!validateFutureDate(value)) return 'Alış tarihi gelecekte olmalıdır';
    return null;
  },
};

export const userValidationSchema = {
  fullName: (value: string) => {
    if (!validateRequired(value)) return 'Ad soyad zorunludur';
    if (!validateMinLength(value, 2)) return 'Ad soyad en az 2 karakter olmalıdır';
    if (!validateMaxLength(value, 50)) return 'Ad soyad en fazla 50 karakter olabilir';
    return null;
  },

  email: (value: string) => {
    if (!validateRequired(value)) return 'E-posta zorunludur';
    if (!validateEmail(value)) return 'Geçerli bir e-posta adresi giriniz';
    return null;
  },

  phone: (value: string) => {
    if (!validateRequired(value)) return 'Telefon numarası zorunludur';
    if (!validatePhone(value)) return 'Geçerli bir telefon numarası giriniz (05xxxxxxxxx)';
    return null;
  },

  password: (value: string) => {
    if (!validateRequired(value)) return 'Şifre zorunludur';
    const validation = validatePassword(value);
    if (!validation.isValid) return validation.errors[0];
    return null;
  },
};
