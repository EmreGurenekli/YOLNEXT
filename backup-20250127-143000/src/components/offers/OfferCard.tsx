import React from 'react';
import { Truck, MapPin, Clock, Star, CheckCircle, X, MessageCircle } from 'lucide-react';

interface Offer {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierRating: number;
  carrierImage?: string;
  price: number;
  estimatedDelivery: string;
  vehicleType: string;
  capacity: number;
  distance: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface OfferCardProps {
  offer: Offer;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onMessage?: (offerId: string) => void;
  showActions?: boolean;
}

export default function OfferCard({
  offer,
  onAccept,
  onReject,
  onMessage,
  showActions = true
}: OfferCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      default:
        return 'Beklemede';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            {offer.carrierImage ? (
              <img
                src={offer.carrierImage}
                alt={offer.carrierName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <Truck className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{offer.carrierName}</h3>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{offer.carrierRating}</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(offer.status)}`}>
          {getStatusText(offer.status)}
        </span>
      </div>

      {/* Offer Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Fiyat</span>
          <span className="text-xl font-bold text-gray-900">₺{offer.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Tahmini Teslimat</span>
          <span className="text-sm font-medium text-gray-900">{offer.estimatedDelivery}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Araç Türü</span>
          <span className="text-sm font-medium text-gray-900">{offer.vehicleType}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Kapasite</span>
          <span className="text-sm font-medium text-gray-900">{offer.capacity} kg</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Mesafe</span>
          <span className="text-sm font-medium text-gray-900">{offer.distance} km</span>
        </div>
      </div>

      {/* Message */}
      {offer.message && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">{offer.message}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && offer.status === 'pending' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAccept(offer.id)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Kabul Et
          </button>
          <button
            onClick={() => onReject(offer.id)}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Reddet
          </button>
          <button
            onClick={() => onMessage(offer.id)}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Teklif Tarihi: {offer.createdAt.toLocaleDateString()}</span>
          <span>{offer.createdAt.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}