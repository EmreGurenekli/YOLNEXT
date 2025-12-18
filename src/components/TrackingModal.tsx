import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  User,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { createApiUrl } from '../config/api';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    title: string;
    from_city: string;
    to_city: string;
    status: string;
  };
  currentUser: {
    id: string;
    name: string;
  };
}

interface TrackingUpdate {
  id: string;
  shipment_id: string;
  status: string;
  location: string;
  notes: string;
  updated_by: string;
  updated_by_name: string;
  created_at: string;
}

const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  shipment,
  currentUser,
}) => {
  const [updates, setUpdates] = useState<TrackingUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    status: '',
    location: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && shipment.id) {
      loadTrackingUpdates();
    }
  }, [isOpen, shipment.id]);

  const loadTrackingUpdates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        createApiUrl(`/api/shipments/${shipment.id}/tracking`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      } else {
        console.error('Failed to load tracking updates');
      }
    } catch (error) {
      console.error('Error loading tracking updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.status || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(
        createApiUrl(`/api/shipments/${shipment.id}/tracking`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUpdate),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUpdates(prev => [
          ...prev,
          {
            id: data.data.id,
            shipment_id: shipment.id,
            status: newUpdate.status,
            location: newUpdate.location,
            notes: newUpdate.notes,
            updated_by: currentUser.id,
            updated_by_name: currentUser.name,
            created_at: data.data.created_at,
          },
        ]);
        setNewUpdate({ status: '', location: '', notes: '' });
      } else {
        console.error('Failed to submit tracking update');
      }
    } catch (error) {
      console.error('Error submitting tracking update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className='w-5 h-5 text-yellow-500' />;
      case 'offer_accepted':
      case 'accepted':
        return <CheckCircle className='w-5 h-5 text-blue-500' />;
      case 'picked_up':
      case 'in_progress':
        return <Package className='w-5 h-5 text-orange-500' />;
      case 'in_transit':
        return <Truck className='w-5 h-5 text-blue-600' />;
      case 'delivered':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'completed':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      default:
        return <AlertCircle className='w-5 h-5 text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'offer_accepted':
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'offer_accepted':
      case 'accepted':
        return 'Kabul Edildi';
      case 'picked_up':
      case 'in_progress':
        return 'Alındı';
      case 'in_transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Gönderi Takibi</h2>
            <p className='text-sm text-gray-600'>
              #{shipment.id} - {shipment.title}
            </p>
            <p className='text-sm text-gray-500'>
              {shipment.from_city} → {shipment.to_city}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        <div className='flex-1 overflow-hidden flex'>
          {/* Tracking Updates */}
          <div className='flex-1 overflow-y-auto p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Takip Geçmişi
            </h3>

            {isLoading ? (
              <div className='flex justify-center items-center h-32'>
                <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
              </div>
            ) : updates.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                <Package className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                <p>Henüz takip güncellemesi yok</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {updates.map((update, index) => (
                  <div key={update.id} className='flex gap-4'>
                    <div className='flex flex-col items-center'>
                      <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center'>
                        {getStatusIcon(update.status)}
                      </div>
                      {index < updates.length - 1 && (
                        <div className='w-0.5 h-8 bg-gray-200 mt-2' />
                      )}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(update.status)}`}
                        >
                          {getStatusText(update.status)}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {formatDateTime(update.created_at)}
                        </span>
                      </div>
                      {update.location && (
                        <div className='flex items-center gap-1 text-sm text-gray-600 mb-1'>
                          <MapPin className='w-3 h-3' />
                          <span>{update.location}</span>
                        </div>
                      )}
                      {update.notes && (
                        <p className='text-sm text-gray-700'>{update.notes}</p>
                      )}
                      <div className='flex items-center gap-1 text-xs text-gray-500 mt-1'>
                        <User className='w-3 h-3' />
                        <span>{update.updated_by_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Update Form */}
          <div className='w-80 border-l border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Güncelleme Ekle
            </h3>

            <form onSubmit={handleSubmitUpdate} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Durum
                </label>
                <select
                  value={newUpdate.status}
                  onChange={e =>
                    setNewUpdate({ ...newUpdate, status: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  required
                >
                  <option value=''>Durum Seçin</option>
                  <option value='accepted'>Kabul Edildi</option>
                  <option value='picked_up'>Alındı</option>
                  <option value='in_transit'>Yolda</option>
                  <option value='delivered'>Teslim Edildi</option>
                  <option value='completed'>Tamamlandı</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Konum (Opsiyonel)
                </label>
                <input
                  type='text'
                  value={newUpdate.location}
                  onChange={e =>
                    setNewUpdate({ ...newUpdate, location: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Örn: İstanbul Depo'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={newUpdate.notes}
                  onChange={e =>
                    setNewUpdate({ ...newUpdate, notes: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  rows={3}
                  placeholder='Güncelleme notları...'
                />
              </div>

              <button
                type='submit'
                disabled={!newUpdate.status || isSubmitting}
                className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
              >
                {isSubmitting ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <>
                    <Clock className='w-4 h-4' />
                    Güncelleme Ekle
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;
