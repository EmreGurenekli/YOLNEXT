// CorporateShipmentsTableRow.tsx
// Desktop table row component for Corporate Shipments page - displays shipment in table format
// Used in: src/pages/corporate/Shipments.tsx

import React from 'react';
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Shipment {
  id: number;
  title: string;
  trackingCode: string;
  from: string;
  to: string;
  status: string;
  carrier: string;
  carrierId?: number;
  rating: number;
  value: string;
  weight: number;
  volume: number;
  estimatedDelivery: string;
  statusText: string;
  progress: number;
  category: string;
  subCategory: string;
  hasRatedCarrier?: boolean;
  createdAt?: string;
}

interface CorporateShipmentsTableRowProps {
  shipment: Shipment;
  acceptedShipmentId?: string | number;
  onViewDetails: (shipmentId: number) => void;
  onTrack: (shipmentId: number) => void;
  onMessage: (shipment: Shipment) => void;
  onConfirmDelivery: (shipment: Shipment) => void;
  onRateCarrier: (shipment: Shipment) => void;
  onCancel: (shipment: Shipment) => void;
  isMessagingEnabled: (status: string) => boolean;
  canCancel: (status: string) => boolean;
  normalizeStatus: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusStyle: (status: string) => string;
}

export default function CorporateShipmentsTableRow({
  shipment,
  acceptedShipmentId,
  onViewDetails,
  onTrack,
  onMessage,
  onConfirmDelivery,
  onRateCarrier,
  onCancel,
  isMessagingEnabled,
  canCancel,
  normalizeStatus,
  getStatusIcon,
  getStatusStyle,
}: CorporateShipmentsTableRowProps) {
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

  return (
    <tr
      key={shipment.id}
      className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
    >
      <td className='py-4 px-4'>
        <div className='font-mono text-sm font-semibold text-slate-900'>
          {shipment.trackingCode}
        </div>
        <div className='text-xs text-slate-500'>
          {shipment.createdAt}
        </div>
        <div className='text-xs text-slate-500'>
          {shipment.title}
        </div>
      </td>
      <td className='py-4 px-4'>
        <div className='text-sm font-medium text-slate-900'>
          {shipment.from} → {shipment.to}
        </div>
        <div className='text-xs text-slate-500'>
          {displayCategory}
        </div>
      </td>
      <td className='py-4 px-4'>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            (acceptedShipmentId && (String(acceptedShipmentId) === String(shipment.id) || String(acceptedShipmentId) === shipment.trackingCode?.replace('YOL', '')))
              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
              : getStatusStyle(shipment.status)
          }`}
        >
          {getStatusIcon(shipment.status)}
          {(acceptedShipmentId && (String(acceptedShipmentId) === String(shipment.id) || String(acceptedShipmentId) === shipment.trackingCode?.replace('YOL', '')))
            ? 'Kabul Edildi'
            : shipment.statusText}
        </span>
      </td>
      <td className='py-4 px-4'>
        <div className='text-sm font-medium text-slate-900'>
          {shipment.carrier || 'Atanmamış'}
        </div>
        {shipment.carrier && (
          <div className='text-xs text-slate-500'>
            {shipment.rating}/5 ⭐
          </div>
        )}
      </td>
      <td className='py-4 px-4'>
        <div className='text-sm font-bold text-slate-900'>
          {shipment.value}
        </div>
        <div className='text-xs text-slate-500'>
          {shipment.weight} • {shipment.volume}
        </div>
        <div className='text-xs text-slate-500'>
          {shipment.estimatedDelivery}
        </div>
      </td>
      <td className='py-4 px-4'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => onViewDetails(shipment.id)}
            className='px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
          >
            Detay
          </button>
          {shipment.statusText !== 'Beklemede' && (
            <button
              onClick={() => onTrack(shipment.id)}
              className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
            >
              Takip
            </button>
          )}
          <button
            onClick={() => onMessage(shipment)}
            disabled={!isMessagingEnabled(shipment.status)}
            title={!isMessagingEnabled(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isMessagingEnabled(shipment.status)
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            Mesaj
          </button>
          {(normalizeStatus(shipment.status) === 'delivered' ||
            normalizeStatus(shipment.status) === 'completed') && (
            <>
              <button
                onClick={() => onConfirmDelivery(shipment)}
                className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
              >
                Onayla
              </button>
              {shipment.carrierId && !shipment.hasRatedCarrier && (
                <button
                  onClick={() => onRateCarrier(shipment)}
                  className='px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium rounded-lg transition-colors'
                >
                  Değerlendir
                </button>
              )}
            </>
          )}
          {canCancel(shipment.status) && (
            <button
              onClick={() => onCancel(shipment)}
              className='px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors'
            >
              İptal Et
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

