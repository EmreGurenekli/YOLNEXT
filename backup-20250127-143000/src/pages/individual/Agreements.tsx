import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  RefreshCw, 
  Calendar, 
  User, 
  Building, 
  DollarSign, 
  MapPin, 
  Truck, 
  Shield, 
  Star, 
  Phone, 
  Mail, 
  MoreVertical, 
  ChevronDown, 
  ChevronRight, 
  FileCheck, 
  FileX, 
  FileClock, 
  FileSignature, 
  Archive, 
  Send, 
  MessageCircle, 
  Copy, 
  Share2
} from 'lucide-react';

interface Agreement {
  id: string;
  shipmentId: string;
  carrierId: string;
  carrierName: string;
  carrierCompany: string;
  carrierPhone: string;
  carrierEmail: string;
  status: 'draft' | 'pending' | 'signed' | 'active' | 'completed' | 'cancelled' | 'expired';
  title: string;
  description: string;
  price: number;
  terms: string[];
  specialConditions: string[];
  startDate: string;
  endDate: string;
  deliveryDate: string;
  fromLocation: string;
  toLocation: string;
  cargoType: string;
  weight: number;
  volume: number;
  insurance: boolean;
  tracking: boolean;
  paymentTerms: string;
  cancellationPolicy: string;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
  completedAt?: string;
  documents: string[];
  notes: string;
  isUrgent: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const IndividualAgreements: React.FC = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAgreements, setSelectedAgreements] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedAgreement, setExpandedAgreement] = useState<string | null>(null);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      
      // Mock data
      const mockAgreements: Agreement[] = [
        {
          id: '1',
          shipmentId: 'SHP001',
          carrierId: 'CAR001',
          carrierName: 'Ahmet Kaya',
          carrierCompany: 'Ahmet Kaya Nakliyat',
          carrierPhone: '+90 532 123 45 67',
          carrierEmail: 'ahmet@kayanakliyat.com',
          status: 'signed',
          title: 'Ev Eşyaları Taşıma Sözleşmesi',
          description: 'İstanbul\'dan Ankara\'ya ev eşyaları taşıma sözleşmesi',
          price: 2500,
          terms: [
            'Eşyalar güvenli şekilde taşınacak',
            'Sigorta kapsamında korunacak',
            'Anlık takip sağlanacak',
            'Zamanında teslimat yapılacak'
          ],
          specialConditions: [
            'Kırılabilir eşyalar özel ambalajlanacak',
            'Müşteri teslim sırasında hazır olacak',
            'Ek hizmetler için ayrı ücret alınacak'
          ],
          startDate: '2024-01-22',
          endDate: '2024-01-25',
          deliveryDate: '2024-01-25',
          fromLocation: 'İstanbul, Beşiktaş',
          toLocation: 'Ankara, Çankaya',
          cargoType: 'Ev Eşyası',
          weight: 150,
          volume: 25,
          insurance: true,
          tracking: true,
          paymentTerms: 'Teslimat sonrası ödeme',
          cancellationPolicy: '24 saat önceden iptal edilebilir',
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-01-21T14:30:00Z',
          signedAt: '2024-01-21T14:30:00Z',
          documents: ['sözleşme.pdf', 'kimlik.pdf', 'sigorta.pdf'],
          notes: 'Özel ambalajlama hizmeti dahil',
          isUrgent: false,
          priority: 'normal'
        },
        {
          id: '2',
          shipmentId: 'SHP002',
          carrierId: 'CAR002',
          carrierName: 'Fatma Demir',
          carrierCompany: 'Fatma Demir Lojistik',
          carrierPhone: '+90 533 987 65 43',
          carrierEmail: 'fatma@demirlogistik.com',
          status: 'active',
          title: 'Ofis Malzemeleri Taşıma Sözleşmesi',
          description: 'Büro eşyaları ve bilgisayar taşıma sözleşmesi',
          price: 1800,
          terms: [
            'Ekipmanlar korunaklı şekilde taşınacak',
            'Montaj hizmeti dahil',
            'Güvenli depolama sağlanacak'
          ],
          specialConditions: [
            'Bilgisayarlar özel koruma ile taşınacak',
            'Montaj için ek süre verilecek',
            'Test edilerek teslim edilecek'
          ],
          startDate: '2024-01-18',
          endDate: '2024-01-20',
          deliveryDate: '2024-01-20',
          fromLocation: 'İzmir, Konak',
          toLocation: 'Bursa, Osmangazi',
          cargoType: 'İş Yeri',
          weight: 80,
          volume: 15,
          insurance: true,
          tracking: false,
          paymentTerms: 'Peşin ödeme',
          cancellationPolicy: '48 saat önceden iptal edilebilir',
          createdAt: '2024-01-16T09:15:00Z',
          updatedAt: '2024-01-18T11:20:00Z',
          signedAt: '2024-01-17T16:45:00Z',
          documents: ['sözleşme.pdf', 'fatura.pdf'],
          notes: 'Montaj hizmeti dahil',
          isUrgent: true,
          priority: 'high'
        },
        {
          id: '3',
          shipmentId: 'SHP003',
          carrierId: 'CAR003',
          carrierName: 'Mehmet Yılmaz',
          carrierCompany: 'Mehmet Yılmaz Taşımacılık',
          carrierPhone: '+90 534 456 78 90',
          carrierEmail: 'mehmet@yilmaztasimacilik.com',
          status: 'completed',
          title: 'Kişisel Eşya Taşıma Sözleşmesi',
          description: 'Kıyafet ve kişisel eşya taşıma sözleşmesi',
          price: 800,
          terms: [
            'Eşyalar temiz şekilde taşınacak',
            'Hızlı teslimat yapılacak',
            'Güvenli paketleme sağlanacak'
          ],
          specialConditions: [
            'Kıyafetler askıda taşınacak',
            'Özel eşyalar ayrı paketlenecek'
          ],
          startDate: '2024-01-14',
          endDate: '2024-01-16',
          deliveryDate: '2024-01-16',
          fromLocation: 'Antalya, Muratpaşa',
          toLocation: 'İstanbul, Şişli',
          cargoType: 'Kişisel',
          weight: 30,
          volume: 8,
          insurance: false,
          tracking: true,
          paymentTerms: 'Teslimat sonrası ödeme',
          cancellationPolicy: '12 saat önceden iptal edilebilir',
          createdAt: '2024-01-14T16:45:00Z',
          updatedAt: '2024-01-16T18:30:00Z',
          signedAt: '2024-01-15T10:20:00Z',
          completedAt: '2024-01-16T18:30:00Z',
          documents: ['sözleşme.pdf', 'teslim.pdf'],
          notes: 'Müşteri memnuniyeti yüksek',
          isUrgent: false,
          priority: 'low'
        },
        {
          id: '4',
          shipmentId: 'SHP004',
          carrierId: 'CAR004',
          carrierName: 'Ayşe Özkan',
          carrierCompany: 'Ayşe Özkan Kargo',
          carrierPhone: '+90 535 234 56 78',
          carrierEmail: 'ayse@ozkankargo.com',
          status: 'pending',
          title: 'Elektronik Cihaz Taşıma Sözleşmesi',
          description: 'Bilgisayar ve elektronik eşya taşıma sözleşmesi',
          price: 1200,
          terms: [
            'Elektronik cihazlar özel koruma ile taşınacak',
            'Anti-statik ambalaj kullanılacak',
            'Test edilerek teslim edilecek'
          ],
          specialConditions: [
            'Sıcaklık kontrolü yapılacak',
            'Titreşim koruması sağlanacak',
            'Garanti belgeleri korunacak'
          ],
          startDate: '2024-01-22',
          endDate: '2024-01-24',
          deliveryDate: '2024-01-24',
          fromLocation: 'Ankara, Çankaya',
          toLocation: 'İzmir, Konak',
          cargoType: 'Özel',
          weight: 25,
          volume: 5,
          insurance: true,
          tracking: true,
          paymentTerms: 'Peşin ödeme',
          cancellationPolicy: '24 saat önceden iptal edilebilir',
          createdAt: '2024-01-17T13:20:00Z',
          updatedAt: '2024-01-19T10:15:00Z',
          documents: ['sözleşme.pdf'],
          notes: 'Hassas eşya taşıma',
          isUrgent: false,
          priority: 'normal'
        }
      ];

      setAgreements(mockAgreements);
    } catch (error) {
      console.error('Sözleşmeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      draft: { text: 'Taslak', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
      pending: { text: 'Beklemede', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' },
      signed: { text: 'İmzalandı', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
      active: { text: 'Aktif', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
      completed: { text: 'Tamamlandı', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
      cancelled: { text: 'İptal Edildi', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
      expired: { text: 'Süresi Doldu', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.draft;
  };

  const getPriorityInfo = (priority: string) => {
    const priorityMap = {
      low: { text: 'Düşük', color: 'text-gray-600', bg: 'bg-gray-100' },
      normal: { text: 'Normal', color: 'text-blue-600', bg: 'bg-blue-100' },
      high: { text: 'Yüksek', color: 'text-orange-600', bg: 'bg-orange-100' },
      urgent: { text: 'Acil', color: 'text-red-600', bg: 'bg-red-100' }
    };
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.normal;
  };

  const filteredAgreements = agreements.filter(agreement => {
    const matchesSearch = searchTerm === '' || 
      agreement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.carrierCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agreement.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedAgreements = [...filteredAgreements].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSelectAgreement = (agreementId: string) => {
    setSelectedAgreements(prev => 
      prev.includes(agreementId) 
        ? prev.filter(id => id !== agreementId)
        : [...prev, agreementId]
    );
  };

  const handleSignAgreement = (agreementId: string) => {
    setAgreements(agreements.map(agreement => 
      agreement.id === agreementId 
        ? { ...agreement, status: 'signed' as const, signedAt: new Date().toISOString() }
        : agreement
    ));
  };

  const handleCancelAgreement = (agreementId: string) => {
    setAgreements(agreements.map(agreement => 
      agreement.id === agreementId 
        ? { ...agreement, status: 'cancelled' as const }
        : agreement
    ));
  };

  const stats = {
    total: agreements.length,
    pending: agreements.filter(a => a.status === 'pending').length,
    signed: agreements.filter(a => a.status === 'signed').length,
    active: agreements.filter(a => a.status === 'active').length,
    completed: agreements.filter(a => a.status === 'completed').length,
    cancelled: agreements.filter(a => a.status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Sözleşmeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
        <div>
              <h1 className="text-3xl font-bold text-gray-900">Sözleşmelerim</h1>
              <p className="text-gray-600 mt-2">Tüm sözleşmelerinizi yönetin ve takip edin</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4 mr-2 inline" />
                Dışa Aktar
              </button>
              <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Beklemede</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
        </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileSignature className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">İmzalandı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.signed}</p>
              </div>
        </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
        </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tamamlandı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <FileX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">İptal</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
        </div>
      </div>

      {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
                  placeholder="Sözleşme ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
            
            <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Durumlar</option>
                <option value="draft">Taslak</option>
            <option value="pending">Beklemede</option>
                <option value="signed">İmzalandı</option>
                <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal Edildi</option>
                <option value="expired">Süresi Doldu</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Tarih (Yeni)</option>
                <option value="createdAt-asc">Tarih (Eski)</option>
                <option value="title-asc">Başlık (A-Z)</option>
                <option value="title-desc">Başlık (Z-A)</option>
                <option value="price-asc">Fiyat (Düşük)</option>
                <option value="price-desc">Fiyat (Yüksek)</option>
                <option value="status-asc">Durum (A-Z)</option>
                <option value="status-desc">Durum (Z-A)</option>
          </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtreler
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
        </div>
          </div>
        </div>

        {/* Agreements List */}
        <div className="space-y-6">
          {sortedAgreements.map((agreement) => {
            const statusInfo = getStatusInfo(agreement.status);
            const priorityInfo = getPriorityInfo(agreement.priority);
            const isSelected = selectedAgreements.includes(agreement.id);
            const isExpanded = expandedAgreement === agreement.id;

            return (
              <div
                key={agreement.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {agreement.carrierName.charAt(0)}
                        </div>
                        {agreement.isUrgent && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{agreement.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                            {priorityInfo.text}
                </span>
              </div>
                        <p className="text-gray-600 mb-2">{agreement.carrierName} - {agreement.carrierCompany}</p>
                        <p className="text-gray-500 text-sm mb-3">{agreement.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Başlangıç: {new Date(agreement.startDate).toLocaleDateString('tr-TR')}</span>
                </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{agreement.fromLocation} → {agreement.toLocation}</span>
                </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span>₺{agreement.price.toLocaleString()}</span>
                </div>
              </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border`}>
                        {statusInfo.text}
                      </span>
                      <button
                        onClick={() => handleSelectAgreement(agreement.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setExpandedAgreement(isExpanded ? null : agreement.id)}
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                        Detayları {isExpanded ? 'Gizle' : 'Göster'}
                      </button>
                      
                      {agreement.status === 'pending' && (
                        <button
                          onClick={() => handleSignAgreement(agreement.id)}
                          className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                        >
                          <FileSignature className="w-4 h-4 mr-1" />
                          İmzala
                        </button>
                      )}
                      
                      {agreement.status === 'signed' && (
                        <button
                          onClick={() => handleCancelAgreement(agreement.id)}
                          className="flex items-center text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FileX className="w-4 h-4 mr-1" />
                          İptal Et
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Terms and Conditions */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Sözleşme Şartları</h4>
                          <ul className="space-y-2">
                            {agreement.terms.map((term, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{term}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {agreement.specialConditions.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-gray-900 mb-2">Özel Şartlar</h5>
                              <ul className="space-y-1">
                                {agreement.specialConditions.map((condition, index) => (
                                  <li key={index} className="flex items-start text-sm text-gray-600">
                                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{condition}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Contact and Payment Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">İletişim ve Ödeme</h4>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-blue-500 mr-3" />
                              <span className="text-sm text-gray-600">{agreement.carrierPhone}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 text-green-500 mr-3" />
                              <span className="text-sm text-gray-600">{agreement.carrierEmail}</span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-purple-500 mr-3" />
                              <span className="text-sm text-gray-600">{agreement.paymentTerms}</span>
                            </div>
                            <div className="flex items-center">
                              <Shield className="w-4 h-4 text-red-500 mr-3" />
                              <span className="text-sm text-gray-600">
                                {agreement.insurance ? 'Sigorta Dahil' : 'Sigorta Dahil Değil'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Dokümanlar</h5>
                            <div className="space-y-1">
                              {agreement.documents.map((doc, index) => (
                                <div key={index} className="flex items-center text-sm text-gray-600">
                                  <FileText className="w-4 h-4 text-blue-500 mr-2" />
                                  <span>{doc}</span>
                                  <button className="ml-2 text-blue-600 hover:text-blue-800">
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {agreement.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">Notlar</h4>
                          <p className="text-sm text-gray-600">{agreement.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedAgreements.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sözleşme bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default IndividualAgreements;