import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, RefreshCw, Eye } from 'lucide-react';
import OfferCard from '../../components/offers/OfferCard';
import CreateOfferModal from '../../components/offers/CreateOfferModal';
import { apiClient } from '../../services/api';

export default function NakliyeciOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getNakliyeciOffers();
      setOffers(response);
    } catch (error) {
      console.error('Teklifler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async (offerData) => {
    try {
      await apiClient.createOffer(offerData);
      loadOffers();
    } catch (error) {
      console.error('Teklif oluşturulurken hata:', error);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await apiClient.acceptOffer(offerId);
      loadOffers();
    } catch (error) {
      console.error('Teklif onaylanırken hata:', error);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await apiClient.rejectOffer(offerId);
      loadOffers();
    } catch (error) {
      console.error('Teklif reddedilirken hata:', error);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.from_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.to_location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tekliflerim</h1>
          <p className="text-gray-600">Verdiğiniz teklifleri yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Teklif</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {offers.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Bekleyen</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {offers.filter(o => o.status === 'accepted').length}
          </div>
          <div className="text-sm text-gray-600">Onaylandı</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {offers.filter(o => o.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Reddedildi</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">
            {offers.length}
          </div>
          <div className="text-sm text-gray-600">Toplam</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Gönderi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="accepted">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
          <button
            onClick={loadOffers}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz teklif yok</h3>
          <p className="text-gray-600 mb-4">İlk teklifinizi vermek için yeni teklif oluşturun</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Teklif Ver
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onAccept={handleAcceptOffer}
              onReject={handleRejectOffer}
              showActions={false} // Nakliyeci can't accept/reject their own offers
            />
          ))}
        </div>
      )}

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        shipmentId={selectedShipment?.id || 1}
        shipmentTitle={selectedShipment?.title || 'Test Gönderi'}
        onSubmit={handleCreateOffer}
      />
    </div>
  );
}