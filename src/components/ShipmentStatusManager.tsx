import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Truck,
  MapPin,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import { createApiUrl } from '../config/api';

/**
 * BUSINESS ENTITY: Shipment lifecycle status change record
 * Tracks every status transition for compliance, analytics, and customer service
 * Critical for shipment timeline, dispute resolution, and performance metrics
 */
interface ShipmentStatusChangeRecord {
  id: number;                    // Unique status change record ID
  shipment_id: number;          // Affected shipment
  user_id: number;              // User who triggered the status change
  old_status: string;           // Previous shipment status
  new_status: string;
  notes: string;
  created_at: string;
  updated_by_name: string;
  user_type: string;
}

interface StatusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId?: number;
}

const statusConfig = {
  pending: {
    label: 'Beklemede',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
  },
  waiting_for_offers: {
    label: 'Teklif Bekliyor',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  offer_accepted: {
    label: 'Teklif Kabul Edildi',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'Hazırlanıyor',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Package,
  },
  in_transit: {
    label: 'Yolda',
    color: 'bg-blue-100 text-blue-800',
    icon: Truck,
  },
  delivered: {
    label: 'Teslim Edildi',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  completed: {
    label: 'Tamamlandı',
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'İptal Edildi',
    color: 'bg-red-100 text-red-800',
    icon: X,
  },
  // Backward-compatible aliases
  waiting: {
    label: 'Beklemede',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
  },
  preparing: {
    label: 'Hazırlanıyor',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Package,
  },
};

export default function StatusManager({
  isOpen,
  onClose,
  shipmentId,
}: StatusManagerProps) {
  const [statusHistory, setStatusHistory] = useState<ShipmentStatusChangeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && shipmentId) {
      loadStatusHistory();
    }
  }, [isOpen, shipmentId]);

  const loadStatusHistory = async () => {
    if (!shipmentId) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/shipments/${shipmentId}/status-history`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStatusHistory(result.data || []);
      }
    } catch (error) {
      console.error('Durum geçmişi yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!shipmentId || !newStatus) return;

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/shipments/${shipmentId}/status`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            notes: notes,
          }),
        }
      );

      if (response.ok) {
        setNewStatus('');
        setNotes('');
        loadStatusHistory();
      }
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const normalized = typeof status === 'string' ? status.trim().toLowerCase() : String(status);
    return (
      statusConfig[normalized as keyof typeof statusConfig] || {
        label: status,
        color: 'bg-gray-100 text-gray-800',
        icon: AlertCircle,
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusTransitionIcon = (oldStatus: string, newStatus: string) => {
    const oldS = typeof oldStatus === 'string' ? oldStatus.trim().toLowerCase() : String(oldStatus);
    const newS = typeof newStatus === 'string' ? newStatus.trim().toLowerCase() : String(newStatus);

    if (oldS === 'waiting_for_offers' && newS === 'offer_accepted') {
      return <CheckCircle className='w-4 h-4 text-blue-500' />;
    } else if (oldS === 'offer_accepted' && newS === 'in_progress') {
      return <Package className='w-4 h-4 text-yellow-500' />;
    } else if (oldS === 'in_progress' && newS === 'in_transit') {
      return <Truck className='w-4 h-4 text-blue-500' />;
    } else if (oldS === 'in_transit' && newS === 'delivered') {
      return <CheckCircle className='w-4 h-4 text-green-500' />;
    } else if (oldS === 'delivered' && newS === 'completed') {
      return <CheckCircle className='w-4 h-4 text-emerald-500' />;
    }

    if (oldS === 'waiting' && newS === 'preparing') {
      return <Package className='w-4 h-4 text-yellow-500' />;
    } else if (oldS === 'preparing' && newS === 'in_transit') {
      return <Truck className='w-4 h-4 text-blue-500' />;
    } else if (oldS === 'in_transit' && newS === 'delivered') {
      return <CheckCircle className='w-4 h-4 text-green-500' />;
    } else if (newS === 'cancelled') {
      return <X className='w-4 h-4 text-red-500' />;
    }
    return <Clock className='w-4 h-4 text-gray-500' />;
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black bg-opacity-50'
        onClick={onClose}
      />

      {/* Panel */}
      <div className='absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <Package className='w-6 h-6 text-blue-600' />
            <h2 className='text-xl font-semibold text-gray-900'>
              Durum Yönetimi
            </h2>
            {shipmentId && (
              <span className='text-sm text-gray-500'>
                Gönderi #{shipmentId}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg'
          >
            <X className='w-5 h-5 text-gray-600' />
          </button>
        </div>

        {/* Status Update Form */}
        {shipmentId && (
          <div className='p-6 border-b border-gray-200 bg-gray-50'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Durum Güncelle
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Yeni Durum
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>Durum seçin</option>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Durum değişikliği hakkında notlar...'
                />
              </div>

              <button
                onClick={updateStatus}
                disabled={!newStatus || isUpdating}
                className='w-full px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-blue-900 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isUpdating ? 'Güncelleniyor...' : 'Durumu Güncelle'}
              </button>
            </div>
          </div>
        )}

        {/* Status History */}
        <div className='flex-1 overflow-y-auto p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Durum Geçmişi
          </h3>

          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            </div>
          ) : statusHistory.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Clock className='w-16 h-16 text-gray-300 mb-4' />
              <p className='text-gray-500 text-lg'>Durum geçmişi bulunamadı</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {statusHistory.map((update, index) => {
                const oldConfig = getStatusConfig(update.old_status);
                const newConfig = getStatusConfig(update.new_status);
                const OldIcon = oldConfig.icon;
                const NewIcon = newConfig.icon;

                return (
                  <div
                    key={update.id}
                    className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='flex-shrink-0'>
                        {getStatusTransitionIcon(
                          update.old_status,
                          update.new_status
                        )}
                      </div>

                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${oldConfig.color}`}
                          >
                            {oldConfig.label}
                          </span>
                          <span className='text-gray-400'>→</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${newConfig.color}`}
                          >
                            {newConfig.label}
                          </span>
                        </div>

                        <div className='flex items-center gap-4 text-sm text-gray-600 mb-2'>
                          <div className='flex items-center gap-1'>
                            <User className='w-4 h-4' />
                            <span>{update.updated_by_name}</span>
                            <span className='text-gray-400'>•</span>
                            <span className='capitalize'>
                              {update.user_type}
                            </span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Calendar className='w-4 h-4' />
                            <span>{formatDate(update.created_at)}</span>
                          </div>
                        </div>

                        {update.notes && (
                          <div className='mt-2 p-3 bg-gray-50 rounded-lg'>
                            <div className='flex items-start gap-2'>
                              <MessageSquare className='w-4 h-4 text-gray-500 mt-0.5' />
                              <p className='text-sm text-gray-700'>
                                {update.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}











