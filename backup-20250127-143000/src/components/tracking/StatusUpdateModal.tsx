import React, { useState } from 'react';
import { X, Truck, MapPin, Package, CheckCircle, AlertCircle } from 'lucide-react';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (statusData: StatusData) => void;
  shipmentId: string;
  currentStatus: string;
}

interface StatusData {
  status: string;
  location: string;
  description: string;
  estimatedDelivery?: string;
}

export default function StatusUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  shipmentId,
  currentStatus
}: StatusUpdateModalProps) {
  const [formData, setFormData] = useState<StatusData>({
    status: currentStatus,
    location: '',
    description: '',
    estimatedDelivery: ''
  });

  const [errors, setErrors] = useState<Partial<StatusData>>({});

  const statusOptions = [
    { value: 'gönderi-alındı', label: 'Gönderi Alındı', icon: Package },
    { value: 'yola-çıktı', label: 'Yola Çıktı', icon: Truck },
    { value: 'teslim-edildi', label: 'Teslim Edildi', icon: CheckCircle },
    { value: 'gecikme', label: 'Gecikme', icon: AlertCircle }
  ];

  const handleInputChange = (field: keyof StatusData, value: string) => {
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
    const newErrors: Partial<StatusData> = {};

    if (!formData.status) {
      newErrors.status = 'Durum seçimi gereklidir';
    }

    if (!formData.location) {
      newErrors.location = 'Konum bilgisi gereklidir';
    }

    if (!formData.description) {
      newErrors.description = 'Açıklama gereklidir';
    }

    if (formData.status === 'yola-çıktı' && !formData.estimatedDelivery) {
      newErrors.estimatedDelivery = 'Tahmini teslimat tarihi gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        status: currentStatus,
        location: '',
        description: '',
        estimatedDelivery: ''
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
            <h3 className="text-lg font-semibold text-gray-900">Durum Güncelle</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.status ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Durum seçin</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Konum
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mevcut konum"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Durum hakkında detaylı açıklama..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Estimated Delivery */}
              {formData.status === 'yola-çıktı' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahmini Teslimat Tarihi
                  </label>
                  <input
                    type="datetime-local"
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
              )}
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
                Güncelle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}