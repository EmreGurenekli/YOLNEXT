import React from 'react';
import { 
  Package, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Truck,
  Clock,
  Route,
  RefreshCw
} from 'lucide-react';
import { Shipment } from '../../hooks/useLiveTracking';
import CarrierInfoCard from '../CarrierInfoCard';

interface ShipmentInfoProps {
  shipment: Shipment;
  getStatusInfo: (status: string) => {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  };
  isPolling: boolean;
  onRefresh: () => void;
  lastFetchTime: number;
}

const ShipmentInfo: React.FC<ShipmentInfoProps> = ({
  shipment,
  getStatusInfo,
  isPolling,
  onRefresh,
  lastFetchTime,
}) => {
  const statusInfo = getStatusInfo(shipment.status);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getLastUpdateText = () => {
    if (!lastFetchTime) return '';
    
    const now = Date.now();
    const diffMs = now - lastFetchTime;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Az önce güncellendi';
    if (diffMinutes < 60) return `${diffMinutes} dakika önce güncellendi`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} saat önce güncellendi`;
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-xl border-2 ${statusInfo.borderColor} ${statusInfo.bgColor} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className={`w-6 h-6 ${statusInfo.color}`} />
            <h2 className="text-xl font-bold text-gray-900">{shipment.title}</h2>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            title="Bilgileri yenile"
          >
            <RefreshCw className={`w-5 h-5 ${isPolling ? 'animate-spin' : ''} ${statusInfo.color}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
              {statusInfo.label}
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Mevcut konum:</span>
                <span className="font-medium">{shipment.currentLocation}</span>
              </div>
              
              {shipment.estimatedDelivery && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Tahmini teslimat:</span>
                  <span className="font-medium">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Route className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Güzergah:</span>
              <span className="font-medium">{shipment.route.from} → {shipment.route.to}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Mesafe:</span>
              <span className="font-medium">{shipment.route.distance}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Süre:</span>
              <span className="font-medium">{shipment.route.duration}</span>
            </div>
          </div>
        </div>

        {lastFetchTime && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">{getLastUpdateText()}</p>
          </div>
        )}
      </div>

      {/* Shipment Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gönderi Detayları</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Takip No:</span>
              <span className="font-mono font-medium">{shipment.trackingCode || shipment.trackingNumber}</span>
            </div>
            
            {shipment.price && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Ücret:</span>
                <span className="font-medium">{formatPrice(shipment.price)}</span>
              </div>
            )}
            
            {shipment.createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Oluşturulma:</span>
                <span className="font-medium">
                  {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
          </div>

          <div>
            {shipment.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Açıklama</h4>
                <p className="text-sm text-gray-600">{shipment.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrier Info */}
      {shipment.carrier && (
        <CarrierInfoCard
          carrierName={shipment.carrier.name}
          carrierRating={shipment.carrier.rating}
          completedJobs={shipment.carrier.completedJobs}
          variant="detailed"
        />
      )}

      {/* Live Updates Notice */}
      {isPolling && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm text-blue-700 font-medium">
              Canlı takip aktif - Güncellemeler otomatik alınıyor
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentInfo;










