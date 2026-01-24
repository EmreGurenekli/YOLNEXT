// MyShipmentsTableRow.tsx
// Desktop table row component for MyShipments page - displays shipment in table format
// Used in: src/pages/individual/MyShipments.tsx

import React from 'react';
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import CarrierInfoCard from '../../components/CarrierInfoCard';
import { getStatusInfo as getStatusInfoBase } from '../../utils/shipmentStatus';
import { Shipment } from '../../hooks/useMyShipments';

interface MyShipmentsTableRowProps {
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
}

export default function MyShipmentsTableRow({
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
}: MyShipmentsTableRowProps) {
  const getStatusInfo = (status: string) => {
    const baseInfo = getStatusInfoBase(status);
    let icon = AlertCircle;
    if (status === 'in_transit') icon = Truck;
    else if (status === 'preparing') icon = Package;
    else if (status === 'delivered' || status === 'completed' || status === 'offer_accepted' || status === 'accepted') icon = CheckCircle;
    else if (status === 'waiting' || status === 'waiting_for_offers') icon = Clock;
    
    return {
      ...baseInfo,
      icon,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Truck className='w-4 h-4' />;
      case 'preparing':
        return <Package className='w-4 h-4' />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className='w-4 h-4' />;
      case 'waiting':
        return <Clock className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  const getCategoryName = (cat: string) => {
    const categoryMap: { [key: string]: string } = {
      'house_move': 'Ev Taşınması',
      'furniture_goods': 'Mobilya Taşıma',
      'special_cargo': 'Özel Yük',
      'other': 'Diğer',
      'general': 'Genel Gönderi'
    };
    return categoryMap[cat] || cat;
  };

  const category = getCategoryName(shipment.category || '');
  const subCategory = shipment.subCategory ? getCategoryName(shipment.subCategory) : '';
  const displayCategory = !subCategory || subCategory === category ? category : `${category} - ${subCategory}`;

  return (
    <tr
      key={`${shipment.id}-${shipment.trackingCode}-${index}`}
      className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
    >
      <td className='py-4 px-4'>
        <div className='font-mono text-sm font-semibold text-slate-900'>
          {shipment.trackingCode}
        </div>
        <div className='text-xs text-slate-500'>
          {formatDate(shipment.createdAt, 'long')}
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
          {getStatusInfo(shipment.status).text}
        </span>
      </td>
      <td className='py-4 px-4'>
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
            className="max-w-xs"
          />
        ) : (
          <div className='text-sm font-medium text-slate-500'>
            Atanmamış
          </div>
        )}
      </td>
      <td className='py-4 px-4'>
        <div className='text-sm font-bold text-slate-900'>
          {shipment.price && Number(shipment.price) > 0 
            ? formatCurrency(shipment.price) 
            : <span className='text-slate-400 font-normal'>Teklif Bekleniyor</span>}
        </div>
        <div className='text-xs text-slate-500'>
          {shipment.volume && shipment.volume !== '0' && Number(shipment.volume) > 0 ? `${shipment.volume} m³` : ''}
        </div>
        <div className='text-xs text-slate-500'>
          {formatDate(shipment.estimatedDelivery, 'long')}
        </div>
      </td>
      <td className='py-4 px-4'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => onViewDetails(shipment.id)}
            className='px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
            aria-label={`${shipment.trackingCode} gönderisinin detaylarını görüntüle`}
          >
            Detay
          </button>
          {isTrackEnabled(shipment.status) && (
            <button
              onClick={() => onTrack(shipment.id)}
              className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
              aria-label={`${shipment.trackingCode} gönderisini takip et`}
            >
              Takip
            </button>
          )}
          <button
            onClick={() => onMessage(shipment)}
            disabled={!isMessagingEnabled(shipment.status)}
            title={!isMessagingEnabled(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
            aria-label={!isMessagingEnabled(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isMessagingEnabled(shipment.status)
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            Mesaj
          </button>
          {shipment.status === 'delivered' && (
            <button
              onClick={() => onConfirmDelivery(shipment)}
              className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
            >
              Onayla
            </button>
          )}
          {(shipment.status === 'completed') && shipment.carrierName && !shipment.rating && !isLocallyRated(shipment.id) && (
            <button
              onClick={() => onRateCarrier(shipment)}
              className='px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium rounded-lg transition-colors'
            >
              Değerlendir
            </button>
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












