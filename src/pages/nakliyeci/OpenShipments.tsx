import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  Search, 
  Filter, 
  Eye,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  Weight,
  DollarSign,
  Star,
  Truck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

export default function OpenShipments() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWeight, setFilterWeight] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Package className="w-4 h-4" /> },
    { label: 'Açık İlanlar', icon: <Package className="w-4 h-4" /> }
  ];

  // Mock data - Gerçek API'den gelecek
  const [openShipments] = useState([
    {
      id: '1',
      trackingNumber: 'YN001234567',
      sender: 'TechCorp A.Ş.',
      from: 'İstanbul, Şişli',
      to: 'Ankara, Çankaya',
      weight: '3.5 kg',
      volume: '0.5 m³',
      category: 'Elektronik',
      description: 'Laptop ve aksesuarları',
      pickupDate: '2024-01-20',
      deliveryDate: '2024-01-22',
      specialRequirements: 'Kırılgan, Sigorta',
      contactPerson: 'Ahmet Yılmaz',
      phone: '+90 555 123 4567',
      email: 'ahmet@techcorp.com',
      estimatedPrice: '₺450-600',
      publishedAt: '2024-01-15T10:30:00Z',
      offerCount: 3,
      isUrgent: false
    },
    {
      id: '2',
      trackingNumber: 'YN001234568',
      sender: 'E-Ticaret Ltd.',
      from: 'İstanbul, Beşiktaş',
      to: 'İzmir, Bornova',
      weight: '150 kg',
      volume: '2.5 m³',
      category: 'E-ticaret',
      description: 'Elektronik ürünler - 50 adet',
      pickupDate: '2024-01-18',
      deliveryDate: '2024-01-20',
      specialRequirements: 'Acil, Sigorta',
      contactPerson: 'Fatma Demir',
      phone: '+90 555 987 6543',
      email: 'fatma@eticaret.com',
      estimatedPrice: '₺1,200-1,500',
      publishedAt: '2024-01-15T14:20:00Z',
      offerCount: 7,
      isUrgent: true
    },
    {
      id: '3',
      trackingNumber: 'YN001234569',
      sender: 'Gıda A.Ş.',
      from: 'Bursa, Nilüfer',
      to: 'Antalya, Muratpaşa',
      weight: '500 kg',
      volume: '8 m³',
      category: 'Gıda',
      description: 'Taze meyve ve sebzeler',
      pickupDate: '2024-01-19',
      deliveryDate: '2024-01-21',
      specialRequirements: 'Soğuk Zincir, Acil',
      contactPerson: 'Mehmet Öz',
      phone: '+90 555 456 7890',
      email: 'mehmet@gida.com',
      estimatedPrice: '₺800-1,000',
      publishedAt: '2024-01-15T16:45:00Z',
      offerCount: 2,
      isUrgent: false
    }
  ]);

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredShipments = openShipments.filter(shipment => {
    const matchesSearch = 
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || shipment.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (shipment: any) => {
    setSelectedShipment(shipment);
    setShowShipmentModal(true);
  };

  const handleMakeOffer = (shipment: any) => {
    setSelectedShipment(shipment);
    setOfferPrice('');
    setOfferNotes('');
    setShowOfferModal(true);
  };

  const handleSubmitOffer = () => {
    if (!offerPrice) {
      setSuccessMessage('Lütfen teklif fiyatı girin');
      setShowSuccessMessage(true);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setShowOfferModal(false);
      setSuccessMessage('Teklifiniz başarıyla gönderildi!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }, 1000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Elektronik':
        return 'bg-blue-100 text-blue-800';
      case 'E-ticaret':
        return 'bg-green-100 text-green-800';
      case 'Gıda':
        return 'bg-orange-100 text-orange-800';
      case 'Doküman':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <LoadingState text="Açık ilanlar yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Açık İlanlar - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Açık gönderi ilanları" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Açık İlanlar</h1>
              <p className="text-gray-600">Gönderi taleplerine teklif verin</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam İlan</p>
                <p className="text-2xl font-bold text-gray-900">{openShipments.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acil İlanlar</p>
                <p className="text-2xl font-bold text-red-600">
                  {openShipments.filter(s => s.isUrgent).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Teklif</p>
                <p className="text-2xl font-bold text-green-600">₺850</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="İlan ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="Elektronik">Elektronik</option>
                <option value="E-ticaret">E-ticaret</option>
                <option value="Gıda">Gıda</option>
                <option value="Doküman">Doküman</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {filteredShipments.length === 0 ? (
          <EmptyState
            icon={Package}
            title="İlan bulunamadı"
            description="Arama kriterlerinize uygun ilan bulunamadı."
          />
        ) : (
          <div className="space-y-4">
            {filteredShipments.map((shipment) => (
              <div key={shipment.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-medium text-blue-600">#{shipment.trackingNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(shipment.category)}`}>
                        {shipment.category}
                      </span>
                      {shipment.isUrgent && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Acil
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3" />
                        <span>{shipment.offerCount} teklif</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Gönderen</p>
                        <p className="text-sm font-medium text-gray-900">{shipment.sender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Güzergah</p>
                        <p className="text-sm font-medium text-gray-900">{shipment.from} → {shipment.to}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ağırlık / Hacim</p>
                        <p className="text-sm font-medium text-gray-900">{shipment.weight} / {shipment.volume}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tahmini Fiyat</p>
                        <p className="text-sm font-medium text-gray-900">{shipment.estimatedPrice}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Açıklama</p>
                      <p className="text-sm text-gray-900">{shipment.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Toplama: {new Date(shipment.pickupDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Teslimat: {new Date(shipment.deliveryDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight className="w-3 h-3" />
                        <span>{shipment.specialRequirements}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(shipment)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMakeOffer(shipment)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Teklif Ver</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shipment Detail Modal */}
      {showShipmentModal && selectedShipment && (
        <Modal
          isOpen={showShipmentModal}
          onClose={() => setShowShipmentModal(false)}
          title="İlan Detayları"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Takip Numarası</p>
                <p className="font-medium">{selectedShipment.trackingNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kategori</p>
                <p className="font-medium">{selectedShipment.category}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Gönderen</p>
                <p className="font-medium">{selectedShipment.sender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Güzergah</p>
                <p className="font-medium">{selectedShipment.from} → {selectedShipment.to}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ağırlık / Hacim</p>
                <p className="font-medium">{selectedShipment.weight} / {selectedShipment.volume}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tahmini Fiyat</p>
                <p className="font-medium">{selectedShipment.estimatedPrice}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Açıklama</p>
              <p className="font-medium">{selectedShipment.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Özel Gereksinimler</p>
              <p className="font-medium">{selectedShipment.specialRequirements}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Toplama Tarihi</p>
                <p className="font-medium">{new Date(selectedShipment.pickupDate).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teslimat Tarihi</p>
                <p className="font-medium">{new Date(selectedShipment.deliveryDate).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">İletişim Kişisi</p>
                <p className="font-medium">{selectedShipment.contactPerson}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefon</p>
                <p className="font-medium">{selectedShipment.phone}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Offer Modal */}
      {showOfferModal && selectedShipment && (
        <Modal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          title="Teklif Ver"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">İlan Bilgileri</h3>
              <p className="text-sm text-gray-600">#{selectedShipment.trackingNumber} - {selectedShipment.from} → {selectedShipment.to}</p>
              <p className="text-sm text-gray-600">{selectedShipment.weight} / {selectedShipment.volume}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teklif Fiyatı (₺) *
              </label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Örn: 450"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                value={offerNotes}
                onChange={(e) => setOfferNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Teklifiniz hakkında notlar..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowOfferModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSubmitOffer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Teklif Gönder
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onClose={() => setShowSuccessMessage(false)}
        />
      )}
    </div>
  );
}

