import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  MapPin,
  Calendar,
  Clock,
  Truck,
  Eye,
  MessageSquare,
  Star,
  Filter,
  Search,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { shipmentAPI } from '../../services/api';
import { createApiUrl } from '../../config/api';

interface Shipment {
  id: string;
  title: string;
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  deliveryDate: string;
  weight: number;
  price: number;
  status: 'open' | 'in_progress' | 'completed';
  category: string;
  specialRequirements: string;
  userId: string;
  createdAt: string;
}

const OpenShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('open');

  // Demo veriler
  const demoShipments: Shipment[] = [
    {
      id: '1',
      title: 'Ev Taşınması',
      description:
        '3+1 ev taşınması - Yatak odası takımı, mutfak eşyaları, kırılabilir eşyalar var',
      pickupAddress:
        'Kadıköy, İstanbul - Moda Mahallesi, Bağdat Caddesi No:123',
      deliveryAddress:
        'Çankaya, Ankara - Kızılay Mahallesi, Atatürk Bulvarı No:456',
      pickupDate: '2024-11-01',
      deliveryDate: '2024-11-02',
      weight: 150,
      price: 0,
      status: 'open',
      category: 'house_move',
      specialRequirements: 'Kırılabilir eşyalar var, dikkatli taşıma gerekli',
      userId: 'user1',
      createdAt: '2024-10-25T10:00:00Z',
    },
    {
      id: '2',
      title: 'Mobilya Taşıma',
      description:
        'Büyük dolap, koltuk takımı, masa - Sökme ve takma hizmeti gerekli',
      pickupAddress:
        'Beşiktaş, İstanbul - Etiler Mahallesi, Nispetiye Caddesi No:789',
      deliveryAddress:
        'Konak, İzmir - Alsancak Mahallesi, Kıbrıs Şehitleri Caddesi No:321',
      pickupDate: '2024-11-03',
      deliveryDate: '2024-11-04',
      weight: 200,
      price: 0,
      status: 'open',
      category: 'furniture_goods',
      specialRequirements: 'Sökme-takma hizmeti, koruyucu sarma',
      userId: 'user2',
      createdAt: '2024-10-26T14:30:00Z',
    },
    {
      id: '3',
      title: 'Araç Taşıma',
      description:
        '2018 BMW 3 Serisi - Çalışır durumda, sigortalı taşıma gerekli',
      pickupAddress:
        'Şişli, İstanbul - Mecidiyeköy Mahallesi, Büyükdere Caddesi No:555',
      deliveryAddress:
        'Nilüfer, Bursa - Özlüce Mahallesi, Ertuğrul Caddesi No:777',
      pickupDate: '2024-11-05',
      deliveryDate: '2024-11-06',
      weight: 1500,
      price: 0,
      status: 'open',
      category: 'vehicle_transport',
      specialRequirements: 'Kapalı kamyon, sigorta şart',
      userId: 'user3',
      createdAt: '2024-10-27T09:15:00Z',
    },
    {
      id: '4',
      title: 'Ofis Taşınması',
      description:
        'Bilgisayarlar, yazıcılar, dosyalar - Elektronik eşyalar var',
      pickupAddress: 'Levent, İstanbul - Büyükdere Caddesi No:100',
      deliveryAddress: 'Çankaya, Ankara - Tunalı Hilmi Caddesi No:200',
      pickupDate: '2024-11-07',
      deliveryDate: '2024-11-08',
      weight: 100,
      price: 0,
      status: 'open',
      category: 'special_cargo',
      specialRequirements: 'Elektronik eşyalar, dikkatli taşıma',
      userId: 'user4',
      createdAt: '2024-10-28T16:45:00Z',
    },
    {
      id: '5',
      title: 'Antika Eşya Taşıma',
      description: 'Eski saat, tablo, vazo - Değerli antika eşyalar',
      pickupAddress:
        'Beyoğlu, İstanbul - Galata Mahallesi, Bankalar Caddesi No:50',
      deliveryAddress:
        'Konak, İzmir - Kemeraltı Mahallesi, Anafartalar Caddesi No:75',
      pickupDate: '2024-11-09',
      deliveryDate: '2024-11-10',
      weight: 50,
      price: 0,
      status: 'open',
      category: 'special_cargo',
      specialRequirements: 'Sigorta şart, özel paketleme',
      userId: 'user5',
      createdAt: '2024-10-29T11:20:00Z',
    },
  ];

  useEffect(() => {
    loadShipments();
  }, []);

  useEffect(() => {
    loadShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    filterShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipments, selectedStatus]);

  const loadShipments = async () => {
    try {
      setIsLoading(true);

      // Gerçek API çağrısı - search parametresi ile
      try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams();
        if (searchTerm && searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        
        const response = await fetch(
          `${createApiUrl('/api/shipments/open')}${params.toString() ? '?' + params.toString() : ''}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const shipmentsData = data.data || data.shipments || [];
          if (data.success) {
            setShipments(Array.isArray(shipmentsData) ? shipmentsData : []);
          } else {
            setShipments([]);
          }
        } else {
          setShipments([]);
        }
      } catch (error) {
        console.log('API hatası:', error);
        setShipments([]);
      }
    } catch (error) {
      console.error('Gönderiler yüklenirken hata:', error);
      setShipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Arama ve kategori backend'de yapıldığı için sadece status filtresi uygulanıyor
  const filterShipments = () => {
    let filtered = shipments;

    // Durum filtresi (client-side, çünkü backend sadece 'open' döndürüyor)
    if (selectedStatus && selectedStatus !== 'open') {
      filtered = filtered.filter(
        shipment => shipment.status === selectedStatus
      );
    }

    setFilteredShipments(filtered);
  };

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      house_move: 'Ev Taşınması',
      furniture_goods: 'Mobilya Taşıma',
      vehicle_transport: 'Araç Taşıma',
      special_cargo: 'Özel Yük',
      other: 'Diğer',
    };
    return categories[category] || 'Bilinmeyen';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'house_move':
        return '🏠';
      case 'furniture_goods':
        return '🪑';
      case 'vehicle_transport':
        return '🚗';
      case 'special_cargo':
        return '📦';
      default:
        return '📦';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Açık';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Bilinmeyen';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleOfferClick = (shipmentId: string) => {
    // Teklif verme sayfasına yönlendir
    window.location.href = `/nakliyeci/offer/${shipmentId}`;
  };

  const handleViewDetails = (shipmentId: string) => {
    // Gönderi detay sayfasına yönlendir
    window.location.href = `/nakliyeci/shipment/${shipmentId}`;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='w-8 h-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-slate-600'>Gönderiler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <Helmet>
        <title>Açık Gönderiler - YolNext Nakliyeci</title>
        <meta
          name='description'
          content='Açık gönderileri görüntüleyin ve teklif verin'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center'>
              <Package className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>
                Açık Gönderiler
              </h1>
              <p className='text-slate-600'>Mevcut gönderilere teklif verin</p>
            </div>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-slate-900'>
                    {filteredShipments.length}
                  </p>
                  <p className='text-sm text-slate-600'>Toplam Gönderi</p>
                </div>
              </div>
            </div>
            <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <Clock className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-slate-900'>
                    {filteredShipments.filter(s => s.status === 'open').length}
                  </p>
                  <p className='text-sm text-slate-600'>Açık Gönderi</p>
                </div>
              </div>
            </div>
            <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <Truck className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-slate-900'>
                    {
                      filteredShipments.filter(s => s.status === 'in_progress')
                        .length
                    }
                  </p>
                  <p className='text-sm text-slate-600'>Devam Eden</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Gönderi ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Tüm Kategoriler</option>
              <option value='house_move'>Ev Taşınması</option>
              <option value='furniture_goods'>Mobilya Taşıma</option>
              <option value='vehicle_transport'>Araç Taşıma</option>
              <option value='special_cargo'>Özel Yük</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='open'>Açık Gönderiler</option>
              <option value='in_progress'>Devam Eden</option>
              <option value='completed'>Tamamlanan</option>
            </select>

            {/* Filter Button */}
            <button className='min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors'>
              <Filter className='w-5 h-5' />
              Filtrele
            </button>
          </div>
        </div>

        {/* Shipments List */}
        <div className='space-y-4'>
          {filteredShipments.length === 0 ? (
            <div className='bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200'>
              <Package className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-slate-900 mb-2'>
                Gönderi Bulunamadı
              </h3>
              <p className='text-slate-600'>
                Arama kriterlerinize uygun gönderi bulunmuyor.
              </p>
            </div>
          ) : (
            filteredShipments.map(shipment => (
              <div
                key={shipment.id}
                data-testid={`shipment-card-${shipment.id}`}
                className='bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow'
              >
                <div className='flex flex-col lg:flex-row lg:items-start gap-6'>
                  {/* Left Content */}
                  <div className='flex-1'>
                    <div className='flex items-start gap-4 mb-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-2xl'>
                        {getCategoryIcon(shipment.category)}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h3 className='text-xl font-bold text-slate-900'>
                            {shipment.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}
                          >
                            {getStatusText(shipment.status)}
                          </span>
                        </div>
                        <p className='text-slate-600 mb-3'>
                          {shipment.description}
                        </p>

                        {/* Special Requirements */}
                        {shipment.specialRequirements && (
                          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4'>
                            <div className='flex items-center gap-2 mb-1'>
                              <AlertCircle className='w-4 h-4 text-amber-600' />
                              <span className='text-sm font-medium text-amber-800'>
                                Özel Gereksinimler
                              </span>
                            </div>
                            <p className='text-sm text-amber-700'>
                              {shipment.specialRequirements}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address Info */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div className='flex items-start gap-3'>
                        <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                          <MapPin className='w-4 h-4 text-green-600' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-slate-700 mb-1'>
                            Toplama Adresi
                          </p>
                          <p className='text-sm text-slate-600'>
                            {shipment.pickupAddress}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-3'>
                        <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                          <MapPin className='w-4 h-4 text-red-600' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-slate-700 mb-1'>
                            Teslimat Adresi
                          </p>
                          <p className='text-sm text-slate-600'>
                            {shipment.deliveryAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date Info */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div className='flex items-center gap-3'>
                        <Calendar className='w-5 h-5 text-blue-600' />
                        <div>
                          <p className='text-sm font-medium text-slate-700'>
                            Toplama Tarihi
                          </p>
                          <p className='text-sm text-slate-600'>
                            {formatDate(shipment.pickupDate)}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <Calendar className='w-5 h-5 text-purple-600' />
                        <div>
                          <p className='text-sm font-medium text-slate-700'>
                            Teslimat Tarihi
                          </p>
                          <p className='text-sm text-slate-600'>
                            {formatDate(shipment.deliveryDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className='flex items-center gap-3 mb-4'>
                      <Truck className='w-5 h-5 text-slate-600' />
                      <div>
                        <p className='text-sm font-medium text-slate-700'>
                          Tahmini Ağırlık
                        </p>
                        <p className='text-sm text-slate-600'>
                          {shipment.weight} kg
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className='flex flex-col gap-3 lg:w-48'>
                    <button
                      onClick={() => handleOfferClick(shipment.id)}
                      className='flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md'
                    >
                      <MessageSquare className='w-4 h-4' />
                      Teklif Ver
                    </button>
                    <button
                      onClick={() => handleViewDetails(shipment.id)}
                      className='flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors'
                    >
                      <Eye className='w-4 h-4' />
                      Detayları Gör
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenShipments;
