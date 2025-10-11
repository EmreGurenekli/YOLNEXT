import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Package, 
  CheckCircle,
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Plus, 
  Bell, 
  MessageSquare,
  TrendingUp,
  Truck,
  BarChart3,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    successRate: 0,
    totalSpent: 0,
    thisMonthSpent: 0
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [recentOffers, setRecentOffers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setStats({
      totalShipments: 47,
      deliveredShipments: 42,
      pendingShipments: 5,
      successRate: 89,
      totalSpent: 12500,
      thisMonthSpent: 3200
    });
    setUnreadCount(3);
    
    // Demo veriler - MyShipments sayfasından
    setRecentShipments([
      {
        id: '1',
        trackingCode: 'IND-2024-001',
        title: 'Ev Eşyası Taşıma',
        from: 'İstanbul, Kadıköy',
        to: 'Ankara, Çankaya',
        status: 'in_transit',
        createdAt: '2024-01-20',
        estimatedDelivery: '25.01.2024',
        price: 2500,
        carrierName: 'Hızlı Nakliyat',
        rating: 4.8,
        weight: '500 kg',
        volume: '12 m³',
        category: 'Ev Eşyası',
        subCategory: 'Daire Eşyası'
      },
      {
        id: '2',
        trackingCode: 'IND-2024-002',
        title: 'Ofis Mobilyası',
        from: 'İzmir, Konak',
        to: 'Bursa, Osmangazi',
        status: 'delivered',
        createdAt: '2024-01-15',
        estimatedDelivery: '18.01.2024',
        price: 1800,
        carrierName: 'Güvenli Taşıma',
        rating: 4.7,
        weight: '200 kg',
        volume: '4 m³',
        category: 'Ofis Mobilyası',
        subCategory: 'Mobilya'
      },
      {
        id: '3',
        trackingCode: 'IND-2024-003',
        title: 'Kişisel Eşyalar',
        from: 'Antalya, Muratpaşa',
        to: 'İstanbul, Beşiktaş',
        status: 'waiting',
        createdAt: '2024-01-22',
        estimatedDelivery: '28.01.2024',
        price: 1200,
        weight: '100 kg',
        volume: '1 m³',
        category: 'Kişisel Eşya',
        subCategory: 'Kişisel'
      },
      {
        id: '4',
        trackingCode: 'IND-2024-004',
        title: 'Elektronik Cihazlar',
        from: 'Ankara, Keçiören',
        to: 'İzmir, Karşıyaka',
        status: 'preparing',
        createdAt: '2024-01-23',
        estimatedDelivery: '30.01.2024',
        price: 900,
        weight: '50 kg',
        volume: '0.125 m³',
        category: 'Elektronik',
        subCategory: 'Bilgisayar'
      }
    ]);
    
    setRecentOffers([
      {
        id: '1',
        carrierName: 'Hızlı Kargo Ltd.',
        price: 1500,
        estimatedDays: 2,
        status: 'pending'
      }
    ]);
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Ana Sayfa - YolNet Bireysel</title>
        <meta name="description" content="YolNet bireysel panel ana sayfası" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                    <span className="text-white font-bold text-xl">YN</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Merhaba {user?.firstName}! 👋
                    </h1>
                    <p className="text-slate-200 text-lg leading-relaxed">
                      Profesyonel nakliye hizmetlerinize hoş geldiniz. 
                      <br />
                      <span className="text-blue-300 font-semibold">Güvenilir, hızlı ve ekonomik</span> çözümlerimizle yanınızdayız.
                    </p>
                  </div>
                </div>
                
                       <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                           <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                           <span className="text-slate-200 font-medium">Çevrimiçi</span>
                         </div>
                         <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                           <span className="text-slate-200 font-medium">{stats.totalShipments} Gönderi</span>
                         </div>
                       </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link to="/individual/notifications" className="relative group">
                  <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110">
                    <Bell size={20} className="text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </Link>
                       <Link to="/individual/create-shipment">
                         <button className="bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl">
                           <Plus size={20} />
                           Gönderi Oluştur
                         </button>
                       </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - ANA RENK: from-slate-800 to-blue-900 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">+12 bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Gönderi</div>
            <div className="mt-1 text-xs text-slate-500">Aktif gönderi sayısı</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.deliveredShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">+8 bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Teslim Edildi</div>
            <div className="mt-1 text-xs text-slate-500">Başarıyla teslim edilen</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.pendingShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">+2 bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Beklemede</div>
            <div className="mt-1 text-xs text-slate-500">İşlem bekleyen gönderiler</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.successRate}%</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">+5% bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Başarı Oranı</div>
            <div className="mt-1 text-xs text-slate-500">Teslimat başarı yüzdesi</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Hızlı İşlemler</h2>
                  <p className="text-slate-600">Profesyonel hizmetlerimize hızlı erişim</p>
                </div>
            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/individual/shipments/new">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Yeni Gönderi</h3>
                      <p className="text-sm text-slate-600">Profesyonel nakliye hizmeti</p>
                      <div className="mt-3 w-8 h-1 bg-blue-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>

                <Link to="/individual/shipments">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Gönderilerim</h3>
                      <p className="text-sm text-slate-600">Gönderileri görüntüle ve yönet</p>
                      <div className="mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>

                <Link to="/individual/live-tracking">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Canlı Takip</h3>
                      <p className="text-sm text-slate-600">Gönderileri gerçek zamanlı takip et</p>
                      <div className="mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>

                <Link to="/individual/messages">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Mesajlar</h3>
                      <p className="text-sm text-slate-600">Müşteri hizmetleri ile iletişim</p>
                      <div className="mt-3 w-8 h-1 bg-amber-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

        {/* Son Gönderiler - Tablo Tasarımı */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-6">
                    <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Son Gönderiler</h2>
              <p className="text-slate-600">Aktif gönderilerinizi takip edin</p>
                    </div>
            <Link to="/individual/shipments" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
              </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Gönderi No</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Rota</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Nakliyeci</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Fiyat</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.length > 0 ? recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm font-semibold text-slate-800">{shipment.trackingCode}</div>
                      <div className="text-xs text-slate-500">{shipment.createdAt}</div>
                      <div className="text-xs text-slate-500">{shipment.title}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">{shipment.from} → {shipment.to}</div>
                      <div className="text-xs text-slate-500">{shipment.category} - {shipment.subCategory}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        shipment.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {shipment.status === 'in_transit' ? <Truck className="w-3 h-3 mr-1" /> :
                         shipment.status === 'preparing' ? <Package className="w-3 h-3 mr-1" /> :
                         shipment.status === 'delivered' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                         <Clock className="w-3 h-3 mr-1" />}
                        {shipment.status === 'in_transit' ? 'Yolda' :
                         shipment.status === 'delivered' ? 'Teslim Edildi' :
                         shipment.status === 'preparing' ? 'Hazırlanıyor' : 'Teklif Bekliyor'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">{shipment.carrierName || 'Atanmamış'}</div>
                      {shipment.carrierName && shipment.rating && (
                        <div className="text-xs text-slate-500">{shipment.rating}/5 ⭐</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-bold text-blue-700">₺{shipment.price?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-slate-500">{shipment.weight} • {shipment.volume}</div>
                      <div className="text-xs text-slate-500">{shipment.estimatedDelivery}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors">
                          Detay
                        </button>
                        {shipment.status !== 'waiting' && (
                          <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors">
                            Takip
                          </button>
                        )}
                        <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                          Mesaj
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Gönderi bulunamadı</h3>
                      <p className="text-slate-500 mb-4">Henüz gönderiniz bulunmuyor.</p>
                      <Link to="/individual/shipments/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
                        <Plus className="w-4 h-4" />
                        İlk Gönderinizi Oluşturun
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;