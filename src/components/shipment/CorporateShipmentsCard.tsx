// CorporateShipmentsCard.tsx
// Mobile card component for Corporate Shipments page - displays shipment in card format
// Used in: src/pages/corporate/Shipments.tsx

import React from 'react';
import { MapPin, Truck } from 'lucide-react';

interface Shipment {
  id: number;
  title: string;
  trackingCode: string;
  from: string;
  to: string;
  status: string;
  carrier: string;
  rating: number;
  value: string;
  estimatedDelivery: string;
  statusText: string;
  progress: number;
  createdAt: string;
}

interface CorporateShipmentsCardProps {
  shipment: Shipment;
  index: number;
  onViewDetails: (shipmentId: number) => void;
  onTrack: (shipmentId: number) => void;
  onMessage: (shipment: Shipment) => void;
  isMessagingEnabled: (status: string) => boolean;
  getStatusStyle: (status: string) => string;
  onShowTracking: (shipmentId: number) => void;
}

export default function CorporateShipmentsCard({
  shipment,
  index,
  onViewDetails,
  onTrack,
  onMessage,
  isMessagingEnabled,
  getStatusStyle,
  onShowTracking,
}: CorporateShipmentsCardProps) {
  return (
    <div
      key={`${shipment.id}-${shipment.trackingCode}-${index}`}
      className='bg-slate-50 rounded-xl p-4 border border-slate-200'
    >
      <div className='flex items-start justify-between mb-3'>
        <div>
          <div className='font-mono text-sm font-semibold text-slate-900'>
            {shipment.trackingCode}
          </div>
          <div className='text-xs text-slate-500'>
            {shipment.createdAt}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(shipment.status)}`}
        >
          {shipment.statusText}
        </span>
      </div>

      <div className='space-y-2 mb-4'>
        <div className='flex items-center gap-2'>
          <MapPin className='w-4 h-4 text-blue-500' />
          <span className='text-sm font-medium text-slate-900'>
            {shipment.from} → {shipment.to}
          </span>
        </div>
        <div className='text-xs text-slate-500'>{shipment.title}</div>

        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center'>
            <Truck className='w-3 h-3 text-white' />
          </div>
          <div>
            <div className='text-sm font-medium text-slate-900'>
              {shipment.carrier}
            </div>
            <div className='text-xs text-slate-500'>
              {shipment.rating}/5 ⭐
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div>
            <div className='text-sm font-bold text-slate-900'>
              {shipment.value}
            </div>
            <div className='text-xs text-slate-500'>
              {shipment.estimatedDelivery}
            </div>
          </div>
          <div className='text-right'>
            <div className='text-xs text-slate-500'>
              %{shipment.progress} tamamlandı
            </div>
          </div>
        </div>
      </div>

      <div className='flex gap-2'>
        <button
          onClick={() => onShowTracking(shipment)}
          className='flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
        >
          Takip Et
        </button>
        <button
          onClick={() => onViewDetails(shipment.id)}
          className='flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
        >
          Detay
        </button>
        <button
          onClick={() => onMessage(shipment)}
          disabled={!isMessagingEnabled(shipment.status)}
          title={!isMessagingEnabled(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            isMessagingEnabled(shipment.status)
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          Mesaj
        </button>
      </div>
    </div>
  );
}

