import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  Package, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Plus, 
  Bell, 
  MessageSquare,
  TrendingUp,
  Truck,
  FileText,
  Settings,
  Star,
  Award,
  Users,
  MapPin
} from 'lucide-react';

const CorporateDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    successRate: 0,
    totalSpent: 0,
    thisMonthSpent: 0
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setStats({
      totalShipments: 1247,
      deliveredShipments: 1158,
      pendingShipments: 89,
      successRate: 92.8,
      totalSpent: 2450000,
      thisMonthSpent: 320000
    });
    setUnreadCount(5);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Kurumsal Panel - YolNet</title>
        <meta name="description" content="YolNet kurumsal panel ana sayfası" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero Section - Bireysel Panel ile Aynı Tasarım */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Merhaba {user?.name}! 👋
                    </h1>
                    <p className="text-slate-200 text-lg leading-relaxed">
                      Kurumsal nakliye operasyonlarınıza hoş geldiniz. 
                      <br />
                      <span className="text-blue-300 font-semibold">Profesyonel, güvenilir ve verimli</span> çözümlerimizle yanınızdayız.
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
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-4 py-2 shadow-lg">
                    <span className="text-white font-bold">%15 İndirim</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link to="/corporate/notifications" className="relative group">
                  <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110">
                    <Bell size={20} className="text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </Link>
                <Link to="/corporate/messages" className="relative group">
                  <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110">
                    <MessageSquare size={20} className="text-white" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid - Bireysel Panel ile Aynı Tasarım */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalShipments.toLocaleString()}</div>
                <div className="text-sm text-slate-600">Toplam Gönderi</div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-base">Bu ay: {stats.pendingShipments}</div>
            <div className="mt-1 text-sm text-slate-500">Oluşturduğunuz tüm gönderiler</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.deliveredShipments.toLocaleString()}</div>
                <div className="text-sm text-slate-600">Teslim Edildi</div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-base">%{stats.successRate} başarı oranı</div>
            <div className="mt-1 text-sm text-slate-500">Başarıyla tamamlanan gönderiler</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.pendingShipments}</div>
                <div className="text-sm text-slate-600">Beklemede</div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-base">Aktif gönderiler</div>
            <div className="mt-1 text-sm text-slate-500">Henüz tamamlanmamış gönderiler</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900 mb-1">₺{(stats.thisMonthSpent / 1000).toFixed(0)}K</div>
                <div className="text-sm text-slate-600">Aylık Harcama</div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-base">Toplam: ₺{(stats.totalSpent / 1000).toFixed(0)}K</div>
            <div className="mt-1 text-sm text-slate-500">Bu ay harcanan toplam tutar</div>
          </div>
        </div>

        {/* Hızlı İşlemler - Bireysel Panel ile Aynı Tasarım */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Hızlı İşlemler</h2>
              <p className="text-slate-600">Profesyonel hizmetlerimize hızlı erişim</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/corporate/create-shipment">
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

            <Link to="/corporate/shipments">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Gönderilerim</h3>
                  <p className="text-sm text-slate-600">Gönderileri görüntüle ve yönet</p>
                  <div className="mt-3 w-8 h-1 bg-emerald-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>

            <Link to="/corporate/carriers">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Nakliyeciler</h3>
                  <p className="text-sm text-slate-600">Nakliyeci yönetimi</p>
                  <div className="mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>

            <Link to="/corporate/analytics">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Analizler</h3>
                  <p className="text-sm text-slate-600">Detaylı raporlar</p>
                  <div className="mt-3 w-8 h-1 bg-amber-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Son Gönderiler Tablosu */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Son Gönderiler</h2>
              <p className="text-slate-600">En son oluşturulan gönderileriniz</p>
            </div>
            <Link to="/corporate/shipments" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              <Package className="w-4 h-4" />
              Tümünü Gör
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Gönderi No</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Rota</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nakliyeci</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Fiyat</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-mono text-sm font-semibold text-slate-900">#CORP-001</div>
                    <div className="text-xs text-slate-500">2 saat önce</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-900">İstanbul → Ankara</span>
                    </div>
                    <div className="text-xs text-slate-500">Mobilya, Eşya</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Teslim Edildi
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Truck className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Ahmet Kargo</div>
                        <div className="text-xs text-slate-500">4.8/5 ⭐</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm font-bold text-slate-900">₺1,250</div>
                    <div className="text-xs text-slate-500">2 gün teslimat</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors">
                        Detay
                      </button>
                      <button className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors">
                        Takip
                      </button>
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                        Mesaj
                      </button>
                    </div>
                  </td>
                </tr>
                
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-mono text-sm font-semibold text-slate-900">#CORP-002</div>
                    <div className="text-xs text-slate-500">5 saat önce</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-900">İzmir → Bursa</span>
                    </div>
                    <div className="text-xs text-slate-500">Ofis Mobilyası</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Yolda
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <Truck className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Hızlı Nakliyat</div>
                        <div className="text-xs text-slate-500">4.6/5 ⭐</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm font-bold text-slate-900">₺890</div>
                    <div className="text-xs text-slate-500">1 gün teslimat</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors">
                        Detay
                      </button>
                      <button className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors">
                        Takip
                      </button>
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                        Mesaj
                      </button>
                    </div>
                  </td>
                </tr>
                
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-mono text-sm font-semibold text-slate-900">#CORP-003</div>
                    <div className="text-xs text-slate-500">1 gün önce</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-900">Antalya → İstanbul</span>
                    </div>
                    <div className="text-xs text-slate-500">Kişisel Eşya</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Beklemede
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Truck className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Güvenli Taşıma</div>
                        <div className="text-xs text-slate-500">4.9/5 ⭐</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm font-bold text-slate-900">₺1,450</div>
                    <div className="text-xs text-slate-500">3 gün teslimat</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors">
                        Detay
                      </button>
                      <button className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors">
                        Takip
                      </button>
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                        Mesaj
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CorporateDashboard;
