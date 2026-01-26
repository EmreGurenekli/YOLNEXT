import { useState } from 'react';
import { useFormValidation, commonValidationRules } from './useFormValidation';

export interface ShipmentFormData {
  mainCategory: string;
  productDescription: string;
  roomCount: string;
  floorInfo: string;
  elevatorAvailable: boolean;
  vehicleInfo: {
    brand: string;
    model: string;
    year: string;
    working: boolean;
  };
  value: string;
  specialHandling: string;
  specialRequirements: string;
  pickupAddress: string;
  pickupCity: string;
  pickupDistrict: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryDistrict: string;
  pickupDate: string;
  deliveryDate: string;
  price: string;
  weight: string;
  contactPerson: string;
  phone: string;
  email: string;
  publishType: string;
}

const initialFormData: ShipmentFormData = {
  mainCategory: '',
  productDescription: '',
  roomCount: '',
  floorInfo: '',
  elevatorAvailable: false,
  vehicleInfo: {
    brand: '',
    model: '',
    year: '',
    working: true,
  },
  value: '',
  specialHandling: '',
  specialRequirements: '',
  pickupAddress: '',
  pickupCity: '',
  pickupDistrict: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryDistrict: '',
  pickupDate: '',
  deliveryDate: '',
  price: '',
  weight: '',
  contactPerson: '',
  phone: '',
  email: '',
  publishType: 'all',
};

export function useShipmentForm() {
  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);

  const validationRules = {
    mainCategory: {
      required: true,
      message: 'Yük kategorisi seçimi zorunludur',
    },
    productDescription: commonValidationRules.description,
    pickupCity: commonValidationRules.city,
    pickupDistrict: commonValidationRules.district,
    pickupAddress: commonValidationRules.address,
    pickupDate: commonValidationRules.date,
    deliveryCity: commonValidationRules.city,
    deliveryDistrict: commonValidationRules.district,
    deliveryAddress: commonValidationRules.address,
    deliveryDate: {
      ...commonValidationRules.date,
      custom: (value: any) => {
        if (!value) return 'Teslim tarihi seçimi zorunludur';
        const deliveryDate = new Date(value);
        const pickupDate = new Date(formData.pickupDate);

        if (deliveryDate <= pickupDate) {
          return 'Teslim tarihi alış tarihinden sonra olmalıdır';
        }
        return null;
      },
    },
    contactPerson: commonValidationRules.name,
    phone: commonValidationRules.phone,
    email: commonValidationRules.email,
    price: commonValidationRules.price,
  };

  const {
    errors,
    validateForm,
    validateFieldOnBlur,
    clearError,
    hasError,
    getError,
    shouldShowError,
  } = useFormValidation(validationRules);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof ShipmentFormData];
        if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
          return {
            ...prev,
            [parent]: {
              ...(parentValue as Record<string, any>),
              [child]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    clearError(field);
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    errors,
    validateForm,
    validateFieldOnBlur,
    clearError,
    hasError,
    getError,
    shouldShowError,
    resetForm,
  };
}
