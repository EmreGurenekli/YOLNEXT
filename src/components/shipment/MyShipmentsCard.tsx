// MyShipmentsCard.tsx
// Mobile card component for MyShipments page - displays shipment in card format
// Used in: src/pages/individual/MyShipments.tsx

import React from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import CarrierInfoCard from '../../components/CarrierInfoCard';

interface Shipment {
  id: string;
  title: string;
  from: string;
  to: string;
  status: 'preparing' | 'waiting' | 'waiting_for_offers' | 'offer_accepted' | 'accepted' | 'in_progress' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  createdAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  price: number;
  carrierName?: string;
  carrierId?: string;
  carrierPhone?: string;
  carrierEmail?: string;
  carrierCompany?: string;
  driverName?: string;
  driverId?: string;
  driverPhone?: string;
  driverEmail?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  trackingNumber?: string;
  description: string;
  category: string;
  weight: string;
  dimensions: string;
  specialRequirements: string[];
  trackingCode: string;
  subCategory: string;
  rating?: number;
  volume: string;
  pickupDate?: string;
  deliveryDate?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCity?: string;
  deliveryCity?: string;
  carrierRating?: number;
  carrierReviews?: number;
  carrierVerified?: boolean;
  completedJobs?: number;
  successRate?: number;
}

interface MyShipmentsCardProps {
  shipment: Shipment;
  index: number;
  onViewDetails: (shipmentId: string) => void;
  onTrack: (shipmentId: string) => void;
  onMessage: (shipment: Shipment) => void;
  onConfirmDelivery: (shipment: Shipment) => void;
  onRateCarrier: (shipment: Shipment) => void;
  onCancel: (shipment: Shipment) => void;
  isTrackEnabled: (status: Shipment['status']) => boolean;
  isMessagingEnabled: (status: Shipment['status']) => boolean;
  canCancel: (status: string) => boolean;
  isLocallyRated: (shipmentId: string) => boolean;
  getStatusInfo: (status: string) => { text: string; color: string; description?: string; icon?: any };
  getStatusIcon: (status: string) => React.ReactNode;
}

export default function MyShipmentsCard({
  shipment,
  index,
  onViewDetails,
  onTrack,
  onMessage,
  onConfirmDelivery,
  onRateCarrier,
  onCancel,
  isTrackEnabled,
  isMessagingEnabled,
  canCancel,
  isLocallyRated,
  getStatusInfo,
  getStatusIcon,
}: MyShipmentsCardProps) {
  const getCategoryName = (cat: string) => {
    const categoryMap: { [key: string]: string } = {
      'house_move': 'Ev Taşınması',
      'furniture_goods': 'Mobilya Taşıma',
      'special_cargo': 'Özel Yük',
      'other': 'Diğer'
    };
    return categoryMap[cat] || cat;
  };

  const category = getCategoryName(shipment.category || '');
  const subCategory = shipment.subCategory ? getCategoryName(shipment.subCategory) : '';
  const displayCategory = !subCategory || subCategory === category ? category : `${category} - ${subCategory}`;

  const statusInfo = getStatusInfo(shipment.status);

  return (
    <div
      key={`${shipment.id}-${shipment.trackingCode}-${index}`}
      className='bg-white rounded-2xl shadow-md border border-slate-200 mb-4'
    >
      <div className='p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='text-lg font-bold text-slate-900'>{shipment.trackingCode}</div>
          <div className='text-xs text-slate-500'>{formatDate(shipment.createdAt, 'long')}</div>
        </div>
        <div className='text-sm font-medium text-slate-900 mb-2'>{shipment.title}</div>
        <div className='text-xs text-slate-500'>{shipment.from} → {shipment.to}</div>
        <div className='text-xs text-slate-500'>
          {displayCategory}
        </div>
      </div>

      {/* Status */}
      <div className='px-4 mb-3'>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            shipment.status === 'delivered'
              ? 'bg-green-100 text-green-800'
              : shipment.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
              : shipment.status === 'in_transit'
                ? 'bg-blue-100 text-blue-800'
                : shipment.status === 'preparing'
                  ? 'bg-orange-100 text-orange-800'
                  : shipment.status === 'offer_accepted' || shipment.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {getStatusIcon(shipment.status)}
          {statusInfo.text}
        </span>
      </div>

      {/* Carrier */}
      <div className='px-4 mb-3'>
        {shipment.carrierId && shipment.carrierName ? (
          <CarrierInfoCard
            carrierId={String(shipment.carrierId)}
            carrierName={shipment.carrierName}
            companyName={shipment.carrierCompany}
            carrierRating={shipment.carrierRating || 0}
            carrierReviews={shipment.carrierReviews || 0}
            carrierVerified={shipment.carrierVerified || false}
            successRate={shipment.successRate || 0}
            completedJobs={shipment.completedJobs || 0}
            variant="compact"
            showMessaging={false}
            className="w-full"
          />
        ) : (
          <div className='text-sm font-medium text-slate-500'>
            Nakliyeci atanmamış
          </div>
        )}
      </div>

      {/* Price and Date */}
      <div className='px-4 mb-4'>
        <div className='text-lg font-bold text-slate-900 mb-1'>
          {formatCurrency(shipment.price)}
        </div>
        <div className='text-xs text-slate-500 space-y-1'>
          <div>Teslimat: {formatDate(shipment.estimatedDelivery, 'long')}</div>
          {shipment.volume && shipment.volume !== '0' && (
            <div>Hacim: {shipment.volume} m³</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className='px-4 pb-4'>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => onViewDetails(shipment.id)}
            className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
            aria-label={`${shipment.trackingCode} gönderisinin detaylarını görüntüle`}
          >
            Detay
          </button>
          {isTrackEnabled(shipment.status) && (
            <button
              onClick={() => onTrack(shipment.id)}
              className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
              aria-label={`${shipment.trackingCode} gönderisini takip et`}
            >
              Takip
            </button>
          )}
          <button
            onClick={() => onMessage(shipment)}
            disabled={!isMessagingEnabled(shipment.status)}
            className={`flex-1 min-w-[80px] min-h-[44px] px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center ${
              isMessagingEnabled(shipment.status)
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
            aria-label={!isMessagingEnabled(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
          >
            Mesaj
          </button>
        </div>

        {/* Additional Actions for Delivered */}
        {shipment.status === 'delivered' && (
          <div className='flex flex-wrap gap-2 mt-2'>
            <button
              onClick={() => onConfirmDelivery(shipment)}
              className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
              aria-label='Teslimatı onayla'
            >
              Onayla
            </button>
            {shipment.carrierName && !shipment.rating && !isLocallyRated(shipment.id) && (
              <button
                onClick={() => onRateCarrier(shipment)}
                className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
                aria-label='Nakliyeciyi değerlendir'
              >
                Değerlendir
              </button>
            )}
          </div>
        )}

        {/* Cancel Action */}
        {canCancel(shipment.status) && (
          <div className='mt-2'>
            <button
              onClick={() => onCancel(shipment)}
              className='w-full min-h-[44px] px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
              aria-label='Gönderiyi iptal et'
            >
              İptal Et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

