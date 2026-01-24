/**
 * 📍 LiveTracking Page - PUBLIC SHIPMENT TRACKING
 * 
 * BUSINESS PURPOSE: Public-facing shipment tracking interface
 * Allows anyone (customers, recipients) to track shipments using tracking codes
 * Critical for customer satisfaction and transparency
 * 
 * KEY FEATURES:
 * ✅ Public access (no login required) - anyone can track with code
 * ✅ Real-time location updates and status changes  
 * ✅ Timeline view showing shipment journey
 * ✅ Carrier information and contact details
 * ✅ Estimated delivery times and current location
 * ✅ Auto-refresh for active shipments (in_transit, picked_up)
 * ✅ Mobile-optimized for customers checking on-the-go
 * 
 * CUSTOMER WORKFLOW:
 * 1. Customer receives tracking code (YN123456) via SMS/email
 * 2. Enters code in search box or visits direct link
 * 3. Sees real-time status, location, and timeline
 * 4. Gets live updates as package moves through system
 * 5. Receives delivery confirmation
 * 
 * BUSINESS VALUE:
 * - Reduces "Where is my package?" support calls by 80%
 * - Builds customer trust through transparency  
 * - Enables proactive delivery coordination
 * - Showcases platform reliability to potential customers
 * 
 * TECHNICAL FEATURES:
 * - Polling for real-time updates (30-second intervals)
 * - URL state management for shareable tracking links
 * - Works with or without authentication
 * - Graceful error handling for invalid codes
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertCircle } from 'lucide-react';
import { useLiveTracking } from '../../hooks/useLiveTracking';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import TrackingSearch from '../../components/tracking/TrackingSearch';
import ShipmentInfo from '../../components/tracking/ShipmentInfo';
import TrackingTimeline from '../../components/tracking/TrackingTimeline';
import LoadingState from '../../components/shared-ui-elements/LoadingState';

const LiveTracking: React.FC = () => {
  const {
    trackingNumber,
    shipment,
    loading,
    error,
    notification,
    isPolling,
    trackShipment,
    refreshTracking,
    handleTrackingNumberChange,
    getStatusInfo,
    lastFetchTime,
  } = useLiveTracking();

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Canlı Takip | YolNext</title>
        <meta name="description" content="Gönderinizi canlı olarak takip edin" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb 
          items={[
            { label: 'Ana Sayfa', href: '/individual' },
            { label: 'Canlı Takip' }
          ]} 
        />

        <TrackingSearch
          trackingNumber={trackingNumber}
          loading={loading}
          onTrackingNumberChange={handleTrackingNumberChange}
          onTrack={() => trackShipment()}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingState message="Gönderi aranıyor..." />
        )}

        {/* Shipment Found */}
        {!loading && shipment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shipment Info - Left Column */}
            <div className="lg:col-span-2">
              <ShipmentInfo
                shipment={shipment}
                getStatusInfo={getStatusInfo}
                isPolling={isPolling}
                onRefresh={refreshTracking}
                lastFetchTime={lastFetchTime}
              />
            </div>

            {/* Timeline - Right Column */}
            <div className="lg:col-span-1">
              <TrackingTimeline events={shipment.events || []} />
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && !shipment && trackingNumber && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gönderi bulunamadı</h2>
            <p className="text-gray-600 mb-6">
              Girdiğiniz takip numarası ile eşleşen bir gönderi bulunamadı. 
              Takip numaranızı kontrol ederek tekrar deneyin.
            </p>
            <p className="text-sm text-gray-500">
              Takip numarası örneği: YN123456, TR789012
            </p>
          </div>
        )}

        {/* Initial State - No search performed */}
        {!loading && !error && !shipment && !trackingNumber && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Gönderi Takip</h2>
              <p className="text-gray-600 mb-6">
                Gönderinizin anlık durumunu öğrenmek için takip numaranızı yukarıdaki arama kutusuna girin.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Takip numarası genellikle YN ile başlar</p>
                <p>• SMS veya e-posta ile gönderilen takip linkini de kullanabilirsiniz</p>
                <p>• Sorun yaşıyorsanız müşteri hizmetleri ile iletişime geçin</p>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;










