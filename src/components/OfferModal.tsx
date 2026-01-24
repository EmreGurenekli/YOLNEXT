import React, { useState } from 'react';
import { X, Send, DollarSign, Calendar, MessageSquare } from 'lucide-react';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: any;
  onSubmit: (offerData: any) => void;
}

const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  shipment,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    price: '',
    message: '',
    estimatedDelivery: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        shipment_id: shipment.id,
        price: parseFloat(formData.price),
        message: formData.message,
        estimated_delivery: formData.estimatedDelivery,
      });

      // Reset form
      setFormData({
        price: '',
        message: '',
        estimatedDelivery: '',
      });

      onClose();
    } catch (error) {
      console.error('Teklif gönderme hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-md'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Teklif Ver</h2>
            <p className='text-sm text-gray-600'>
              #{shipment?.id} - {shipment?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {/* Price */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <DollarSign className='w-4 h-4 inline mr-1' />
              Teklif Fiyatı (₺)
            </label>
            <input
              type='number'
              step='0.01'
              min='0'
              value={formData.price}
              onChange={e =>
                setFormData({ ...formData, price: e.target.value })
              }
              className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='0.00'
              required
            />
          </div>

          {/* Estimated Delivery */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <Calendar className='w-4 h-4 inline mr-1' />
              Tahmini Teslimat Tarihi
            </label>
            <input
              type='date'
              value={formData.estimatedDelivery}
              onChange={e =>
                setFormData({ ...formData, estimatedDelivery: e.target.value })
              }
              className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <MessageSquare className='w-4 h-4 inline mr-1' />
              Mesaj (Opsiyonel)
            </label>
            <textarea
              value={formData.message}
              onChange={e =>
                setFormData({ ...formData, message: e.target.value })
              }
              className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              rows={3}
              placeholder='Göndericiye iletmek istediğiniz mesaj...'
            />
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              İptal
            </button>
            <button
              type='submit'
              disabled={
                isSubmitting || !formData.price || !formData.estimatedDelivery
              }
              className='flex-1 px-4 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-blue-900 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
            >
              {isSubmitting ? (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <>
                  <Send className='w-4 h-4' />
                  Teklif Gönder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferModal;











