import React, { useState } from 'react';
import { X, Truck, DollarSign, Clock, MessageSquare } from 'lucide-react';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offerData: OfferData) => void;
  shipmentId: string;
  shipmentTitle?: string;
  shipmentDetails?: {
    from: string;
    to: string;
    weight: number;
    volume: number;
    distance: number;
  };
}

interface OfferData {
  price: number;
  estimatedDelivery: string;
  vehicleType: string;
  capacity: number;
  message: string;
}

export default function CreateOfferModal({
  isOpen,
  onClose,
  onSubmit,
  shipmentId,
  shipmentDetails
}: CreateOfferModalProps) {
  const [formData, setFormData] = useState<OfferData>({
    price: 0,
    estimatedDelivery: '',
    vehicleType: 'kamyon',
    capacity: 0,
    message: ''
  });

  const [errors, setErrors] = useState<Partial<OfferData>>({});

  const vehicleTypes = [
    { value: 'kamyon', label: 'Kamyon' },
    { value: 'kamyonet', label: 'Kamyonet' },
    { value: 'tir', label: 'Tır' },
    { value: 'minibus', label: 'Minibüs' }
  ];

  const handleInputChange = (field: keyof OfferData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<OfferData> = {};

    if (formData.price <= 0) {
      newErrors.price = 'Fiyat 0\'dan büyük olmalıdır';
    }

    if (!formData.estimatedDelivery) {
      newErrors.estimatedDelivery = 'Tahmini teslimat tarihi gereklidir';
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = 'Kapasite 0\'dan büyük olmalıdır';
    }

    if (shipmentDetails && formData.capacity < shipmentDetails.weight) {
      newErrors.capacity = 'Kapasite gönderi ağırlığından küçük olamaz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        price: 0,
        estimatedDelivery: '',
        vehicleType: 'kamyon',
        capacity: 0,
        message: ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Teklif Oluştur</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Shipment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Gönderi Detayları</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Kalkış:</span>
                  <p className="font-medium">{shipmentDetails.from}</p>
                </div>
                <div>
                  <span className="text-gray-600">Varış:</span>
                  <p className="font-medium">{shipmentDetails.to}</p>
                </div>
                <div>
                  <span className="text-gray-600">Ağırlık:</span>
                  <p className="font-medium">{shipmentDetails.weight} kg</p>
                </div>
                <div>
                  <span className="text-gray-600">Hacim:</span>
                  <p className="font-medium">{shipmentDetails.volume} m³</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Teklif Fiyatı (₺)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              {/* Estimated Delivery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Tahmini Teslimat Tarihi
                </label>
                <input
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estimatedDelivery ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.estimatedDelivery && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedDelivery}</p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-2" />
                  Araç Türü
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vehicleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-2" />
                  Araç Kapasitesi (kg)
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.capacity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Mesaj (Opsiyonel)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Göndericiye iletmek istediğiniz mesaj..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Teklif Gönder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}