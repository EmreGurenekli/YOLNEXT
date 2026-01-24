/**
 * 📦 MyShipments Page - CORE BUSINESS COMPONENT
 * 
 * PURPOSE: Main shipment management interface for individual users
 * This is where users spend most of their time - viewing, tracking, and managing their cargo shipments
 * 
 * BUSINESS FUNCTIONS:
 * ✅ View all user's shipments in paginated table/card format
 * ✅ Search shipments by title, tracking code, route
 * ✅ Filter by status (preparing, in_transit, delivered, etc.)
 * ✅ Sort by date, price, status
 * ✅ Real-time status updates and tracking
 * ✅ Direct actions: view details, message carrier, rate service
 * ✅ Export shipments to Excel for record-keeping
 * ✅ Responsive design: table on desktop, cards on mobile
 * 
 * USER WORKFLOW:
 * 1. User lands on this page after login
 * 2. Sees all their shipments with current status
 * 3. Can search/filter to find specific shipments
 * 4. Click to view details, track progress, or contact carrier
 * 5. Take actions like rating completed shipments
 * 
 * TECHNICAL ARCHITECTURE:
 * - Uses useMyShipments hook for data management
 * - Renders MyShipmentsModals for detailed interactions
 * - Responsive: MyShipmentsTableRow (desktop) + MyShipmentsCard (mobile)
 * - Real-time updates via polling in hook
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Package, Truck, Clock, CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate, sanitizeShipmentTitle } from '../../utils/format';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import { useAuth } from '../../contexts/AuthContext';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import Pagination from '../../components/shared-ui-elements/Pagination';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import MyShipmentsHeader from '../../components/shipment/MyShipmentsHeader';
import MyShipmentsFilters from '../../components/shipment/MyShipmentsFilters';
import MyShipmentsTableRow from '../../components/shipment/MyShipmentsTableRow';
import MyShipmentsCard from '../../components/shipment/MyShipmentsCard';
import MyShipmentsModals from '../../components/shipment/MyShipmentsModals';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { useMyShipments, Shipment } from '../../hooks/useMyShipments';
import { getStatusInfo as getStatusInfoBase } from '../../utils/shipmentStatus';

interface MyShipmentsProps {
  basePath?: string;
}

const MyShipments: React.FC<MyShipmentsProps> = ({ basePath = '/individual' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use custom hook for data management
  const {
    shipments,
    loading,
    pagination,
    notification,
    isCorporateView,
    searchTerm,
    statusFilter,
    sortBy,
    handleSearch,
    handleStatusFilter,
    handleSort,
    handlePageChange,
    refreshShipments,
    showNotification,
    toTrackingCode,
    setShipments,
  } = useMyShipments(basePath);

  // Modal states
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<{
    id: string;
    name: string;
    email: string;
    type: string;
  } | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [locallyRatedShipmentIds, setLocallyRatedShipmentIds] = useState<string[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Utility functions
  const getStatusInfo = (status: string) => getStatusInfoBase(status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Truck className='w-3 h-3 mr-1' />;
      case 'preparing':
        return <Package className='w-3 h-3 mr-1' />;
      case 'delivered':
      case 'completed':
      case 'offer_accepted': 
      case 'accepted':
        return <CheckCircle2 className='w-3 h-3 mr-1' />;
      case 'waiting':
      case 'waiting_for_offers':
        return <Clock className='w-3 h-3 mr-1' />;
      case 'cancelled':
        return <XCircle className='w-3 h-3 mr-1' />;
      default:
        return <AlertCircle className='w-3 h-3 mr-1' />;
    }
  };

  const isMessagingEnabledForShipment = (status: Shipment['status']) => {
    return [
      'offer_accepted',
      'accepted', 
      'in_progress',
      'picked_up',
      'in_transit',
      'delivered'
    ].includes(status);
  };

  const isProcessAssistantEnabledForShipment = (status: Shipment['status']) => {
    return [
      'preparing',
      'waiting',
      'waiting_for_offers'
    ].includes(status);
  };

  // Action handlers
  const handleViewDetails = async (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      setSelectedShipment(shipment);
      setShowDetailModal(true);
    }
  };

  const handleOpenMessaging = (shipment: Shipment) => {
    if (shipment.carrier_id && shipment.carrier_name) {
      setSelectedCarrier({
        id: shipment.carrier_id,
        name: shipment.carrier_name,
        email: shipment.carrier_email || '',
        type: shipment.carrier_type || 'nakliyeci'
      });
      setSelectedShipmentId(shipment.id);
      setShowMessagingModal(true);
      setShowDetailModal(false);
    }
  };

  const handleOpenRating = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowRatingModal(true);
    setShowDetailModal(false);
  };

  const handleCancelShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowCancelModal(true);
    setShowDetailModal(false);
  };

  const handleConfirmCancel = async () => {
    if (!selectedShipment) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/shipments/${selectedShipment.id}/cancel`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showNotification('success', 'Gönderi başarıyla iptal edildi');
        refreshShipments();
      } else {
        showNotification('error', 'Gönderi iptal edilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      showNotification('error', 'Gönderi iptal edilirken bir hata oluştu');
    } finally {
      setShowCancelModal(false);
      setSelectedShipment(null);
    }
  };

  const handleRatingSubmit = () => {
    if (selectedShipment) {
      setLocallyRatedShipmentIds(prev => [...prev, selectedShipment.id]);
      showNotification('success', 'Değerlendirme başarıyla gönderildi');
    }
    setShowRatingModal(false);
    setSelectedShipment(null);
  };


  // Component render
  if (!user) {
    return <div>Yetkilendirme hatası</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{isCorporateView ? 'Kurumsal Gönderiler' : 'Gönderilerim'} | YolNext</title>
        <meta name="description" content="Gönderilerinizi takip edin ve yönetin" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb 
          items={[
            { label: 'Ana Sayfa', href: isCorporateView ? '/corporate' : '/individual' },
            { label: isCorporateView ? 'Kurumsal Gönderiler' : 'Gönderilerim' }
          ]} 
        />

        <MyShipmentsHeader
          title={isCorporateView ? 'Kurumsal Gönderiler' : 'Gönderilerim'}
        />

        <MyShipmentsFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          sortBy={sortBy}
          onSearchChange={handleSearch}
          onStatusFilterChange={handleStatusFilter}
          onSortByChange={handleSort}
          onReset={() => {
            handleSearch('');
            handleStatusFilter('all');
            handleSort('created_at_desc');
          }}
        />

        {loading ? (
          <LoadingState message="Gönderiler yükleniyor..." />
        ) : shipments.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title="Gönderi bulunamadı"
            description={
              searchTerm || statusFilter !== 'all'
                ? 'Arama kriterlerinize uygun gönderi bulunamadı. Filtreleri temizleyip tekrar deneyin.'
                : 'Henüz hiç gönderi oluşturmamışsınız. İlk gönderinizi oluşturun.'
            }
            action={
              searchTerm || statusFilter !== 'all' ? {
                label: "Filtreleri Temizle",
                onClick: () => {
                  handleSearch('');
                  handleStatusFilter('all');
                }
              } : {
                label: "İlk Gönderinizi Oluşturun",
                onClick: () => navigate(isCorporateView ? '/corporate/create-shipment' : '/individual/create-shipment')
              }
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Desktop Table View */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
              {/* Tablo Başlığı ve Yeni Gönderi Butonu */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">📦 Gönderilerim</h3>
                  <p className="text-sm text-slate-600 mt-1">Gönderilerinizi yönetin ve takip edin</p>
                </div>
                <Link
                  to={isCorporateView ? '/corporate/create-shipment' : '/individual/create-shipment'}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-900 hover:to-slate-800 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Yeni Gönderi Oluştur
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-800">Gönderi No</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-800">Güzergah</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-800">Durum</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-800">Nakliyeci</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-800">Fiyat</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-800">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment, index) => {
                      // Map data to match MyShipmentsTableRow interface
                      const mappedShipment = {
                        ...shipment,
                        trackingCode: shipment.tracking_code || toTrackingCode(shipment.id),
                        createdAt: shipment.created_at,
                        estimatedDelivery: shipment.delivery_date || shipment.created_at,
                        carrierName: shipment.carrier_name,
                        carrierId: shipment.carrier_id,
                        carrierPhone: shipment.carrier_phone,
                        carrierEmail: shipment.carrier_email,
                        carrierCompany: shipment.carrier_company,
                        driverName: shipment.driver_name,
                        driverId: shipment.driver_id,
                        driverPhone: shipment.driver_phone,
                        driverEmail: shipment.driver_email,
                        vehiclePlate: shipment.vehicle_plate,
                        vehicleType: shipment.vehicle_type,
                        trackingNumber: shipment.tracking_number,
                        category: shipment.category || 'general',
                        subCategory: shipment.sub_category || '',
                        weight: shipment.weight?.toString() || '',
                        dimensions: shipment.dimensions || '',
                        specialRequirements: [],
                        rating: shipment.rating,
                        volume: shipment.volume?.toString() || '',
                        pickupDate: shipment.pickup_date,
                        deliveryDate: shipment.delivery_date,
                        pickupAddress: shipment.pickup_address,
                        deliveryAddress: shipment.delivery_address,
                        pickupCity: shipment.from,
                        deliveryCity: shipment.to,
                        carrierRating: shipment.carrier_rating,
                        carrierReviews: shipment.carrier_reviews,
                        carrierVerified: shipment.carrier_verified,
                        completedJobs: shipment.completed_jobs,
                        successRate: shipment.success_rate
                      } as any;
                      
                      return (
                        <MyShipmentsTableRow
                          key={shipment.id}
                          shipment={mappedShipment}
                          index={index}
                          onViewDetails={handleViewDetails}
                          onTrack={(id) => navigate(`/individual/live-tracking?shipment=${id}`)}
                          onMessage={handleOpenMessaging}
                          onConfirmDelivery={() => {}}
                          onRateCarrier={handleOpenRating}
                          onCancel={handleCancelShipment}
                          isTrackEnabled={(status) => ['in_transit', 'picked_up', 'delivered'].includes(status)}
                          isMessagingEnabled={isMessagingEnabledForShipment}
                          canCancel={(status) => ['preparing', 'waiting', 'waiting_for_offers'].includes(status)}
                          isLocallyRated={(id) => locallyRatedShipmentIds.includes(id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {shipments.map((shipment, index) => {
                // Map data to match MyShipmentsCard interface
                const mappedShipment = {
                  ...shipment,
                  trackingCode: shipment.tracking_code || toTrackingCode(shipment.id),
                  createdAt: shipment.created_at,
                  estimatedDelivery: shipment.delivery_date || shipment.created_at,
                  carrierName: shipment.carrier_name,
                  carrierId: shipment.carrier_id,
                  carrierPhone: shipment.carrier_phone,
                  carrierEmail: shipment.carrier_email,
                  carrierCompany: shipment.carrier_company,
                  category: shipment.category || 'general',
                  subCategory: shipment.sub_category || '',
                  weight: shipment.weight?.toString() || '',
                  dimensions: shipment.dimensions || '',
                  specialRequirements: [],
                  rating: shipment.rating,
                  volume: shipment.volume?.toString() || '',
                  carrierRating: shipment.carrier_rating,
                  carrierReviews: shipment.carrier_reviews,
                  carrierVerified: shipment.carrier_verified,
                  completedJobs: shipment.completed_jobs,
                  successRate: shipment.success_rate
                } as any;
                
                return (
                  <MyShipmentsCard
                    key={shipment.id}
                    shipment={mappedShipment}
                    index={index}
                    onViewDetails={handleViewDetails}
                    onTrack={(id) => navigate(`/individual/live-tracking?shipment=${id}`)}
                    onMessage={handleOpenMessaging}
                    onConfirmDelivery={() => {}}
                    onRateCarrier={handleOpenRating}
                    onCancel={handleCancelShipment}
                    isTrackEnabled={(status) => ['in_transit', 'picked_up', 'delivered'].includes(status)}
                    isMessagingEnabled={isMessagingEnabledForShipment}
                    canCancel={(status) => ['preparing', 'waiting', 'waiting_for_offers'].includes(status)}
                    isLocallyRated={(id) => locallyRatedShipmentIds.includes(id)}
                    getStatusInfo={getStatusInfo}
                    getStatusIcon={getStatusIcon}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
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

        {/* Modals */}
        <MyShipmentsModals
          showDetailModal={showDetailModal}
          selectedShipment={selectedShipment}
          onCloseDetailModal={() => setShowDetailModal(false)}
          onOpenMessaging={handleOpenMessaging}
          onOpenRating={handleOpenRating}
          onCancelShipment={handleCancelShipment}
          showMessagingModal={showMessagingModal}
          selectedCarrier={selectedCarrier}
          selectedShipmentId={selectedShipmentId}
          onCloseMessagingModal={() => setShowMessagingModal(false)}
          showRatingModal={showRatingModal}
          onCloseRatingModal={() => setShowRatingModal(false)}
          onRatingSubmit={handleRatingSubmit}
          showCancelModal={showCancelModal}
          onCloseCancelModal={() => setShowCancelModal(false)}
          onConfirmCancel={handleConfirmCancel}
          isMessagingEnabled={isMessagingEnabledForShipment}
          locallyRatedShipmentIds={locallyRatedShipmentIds}
        />

        <GuidanceOverlay 
          storageKey="myShipmentsGuide"
          icon={Package}
          title="Gönderi Yönetimi Rehberi"
          description="📋 Gönderilerinizi takip edin, durumları kontrol edin ve nakliyecilerle iletişime geçin. Detaylı bilgi için gönderilerin üzerine tıklayın!"
          primaryAction={{
            label: "Rehberi Başlat",
            to: "/individual/create-shipment"
          }}
          secondaryAction={{
            label: "Yeni Gönderi",
            to: "/individual/create-shipment"
          }}
        />

      </div>
    </div>
  );
};

export default MyShipments;