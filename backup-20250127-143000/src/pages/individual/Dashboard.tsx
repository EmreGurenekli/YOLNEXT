import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { 
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
  const [unreadCount, setUnreadCount] = useState(0);

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
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Ana Sayfa - YolNet</title>
        <meta name="description" content="YolNet bireysel panel ana sayfası" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero Section - KORUNAN TASARIM */}
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
                      Merhaba {user?.name}! 👋
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
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-4 py-2 shadow-lg">
                    <span className="text-white font-bold">%20 İndirim</span>
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
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-base shadow-lg hover:shadow-xl">
                    <Plus size={20} />
                    Gönderi Oluştur
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - SADE İKON KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-emerald-600 font-semibold">+12 bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Gönderi</div>
            <div className="mt-1 text-xs text-slate-500">Aktif gönderi sayısı</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.deliveredShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-emerald-600 font-semibold">+8 bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Teslim Edildi</div>
            <div className="mt-1 text-xs text-slate-500">Başarıyla teslim edilen</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.pendingShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-emerald-600 font-semibold">+2 bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Beklemede</div>
            <div className="mt-1 text-xs text-slate-500">İşlem bekleyen gönderiler</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.successRate}%</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-emerald-600 font-semibold">+5% bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Başarı Oranı</div>
            <div className="mt-1 text-xs text-slate-500">Teslimat başarı yüzdesi</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Full Width Column */}
          <div className="space-y-6">
            {/* Quick Actions - PROFESYONEL TASARIM */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Hızlı İşlemler</h2>
                  <p className="text-slate-600">Profesyonel hizmetlerimize hızlı erişim</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Link to="/individual/create-shipment">
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
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Gönderilerim</h3>
                      <p className="text-sm text-slate-600">Gönderileri görüntüle ve yönet</p>
                      <div className="mt-3 w-8 h-1 bg-emerald-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
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

            {/* Gelen Teklifler - KURUMSAL PROFESYONEL TASARIM */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Gelen Teklifler</h2>
                      <p className="text-xs text-slate-600">Nakliyecilerden gelen teklifler</p>
                    </div>
                    <div className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                      4 Teklif
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1 text-slate-700 bg-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500">
                      <option>Tüm Durumlar</option>
                      <option>Yeni</option>
                      <option>İnceleniyor</option>
                      <option>Onaylandı</option>
                    </select>
                    <Link to="/individual/offers" className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-medium hover:bg-slate-800 transition-colors">
                      Tümünü Gör
                    </Link>
                  </div>
                </div>
              </div>

              {/* Teklifler Listesi */}
              <div className="divide-y divide-gray-100">
                {/* Teklif 1 */}
                <div className="p-3 hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900">Ev Taşıma - 2+1 Daire</h3>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded">Yeni</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div>
                            <span className="text-sm font-medium text-slate-600">Nakliyeci</span>
                            <p className="text-slate-900 font-semibold text-sm">Ahmet Kargo</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Puan</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-900 font-semibold text-sm">4.8/5</span>
                              <span className="text-amber-500 text-sm">★</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Gönderim</span>
                            <p className="text-slate-700 text-sm">2 saat önce</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📍</span>
                            <span className="text-slate-700 text-sm">İstanbul → Ankara</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📦</span>
                            <span className="text-slate-700 text-sm">Mobilya, Eşya</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">🛡️</span>
                            <span className="text-slate-700 text-sm">Sigortalı</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600">Geçerlilik:</span>
                          <span className="text-sm font-medium text-slate-700">3 gün kaldı</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-slate-900 mb-1">₺1,250</p>
                      <p className="text-xs text-slate-600 mb-3">2 gün içinde teslimat</p>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition-colors">
                          Detayları Gör
                        </button>
                        <button className="px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors">
                          Kabul Et
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teklif 2 */}
                <div className="p-3 hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900">Ofis Eşyası Taşıma</h3>
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">İnceleniyor</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div>
                            <span className="text-sm font-medium text-slate-600">Nakliyeci</span>
                            <p className="text-slate-900 font-semibold text-sm">Hızlı Nakliyat</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Puan</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-900 font-semibold text-sm">4.6/5</span>
                              <span className="text-amber-500 text-sm">★</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Gönderim</span>
                            <p className="text-slate-700 text-sm">5 saat önce</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📍</span>
                            <span className="text-slate-700 text-sm">İzmir → Bursa</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📦</span>
                            <span className="text-slate-700 text-sm">Ofis Mobilyası</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">🛡️</span>
                            <span className="text-slate-700 text-sm">Sigortalı</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600">Geçerlilik:</span>
                          <span className="text-sm font-medium text-slate-700">2 gün kaldı</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-slate-900 mb-1">₺890</p>
                      <p className="text-xs text-slate-600 mb-3">1 gün içinde teslimat</p>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition-colors">
                          Detayları Gör
                        </button>
                        <button className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition-colors">
                          Soru Sor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teklif 3 */}
                <div className="p-3 hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900">Eşya Taşıma Hizmeti</h3>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded">Beklemede</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div>
                            <span className="text-sm font-medium text-slate-600">Nakliyeci</span>
                            <p className="text-slate-900 font-semibold text-sm">Güvenli Taşıma</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Puan</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-900 font-semibold text-sm">4.9/5</span>
                              <span className="text-amber-500 text-sm">★</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Gönderim</span>
                            <p className="text-slate-700 text-sm">1 gün önce</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📍</span>
                            <span className="text-slate-700 text-sm">Antalya → İstanbul</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📦</span>
                            <span className="text-slate-700 text-sm">Kişisel Eşya</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">🛡️</span>
                            <span className="text-slate-700 text-sm">Sigortalı</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600">Geçerlilik:</span>
                          <span className="text-sm font-medium text-slate-700">1 gün kaldı</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-slate-900 mb-1">₺1,450</p>
                      <p className="text-xs text-slate-600 mb-3">3 gün içinde teslimat</p>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition-colors">
                          Detayları Gör
                        </button>
                        <button className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition-colors">
                          Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teklif 4 */}
                <div className="p-3 hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900">Ev Eşyası Taşıma</h3>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded">Onaylandı</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div>
                            <span className="text-sm font-medium text-slate-600">Nakliyeci</span>
                            <p className="text-slate-900 font-semibold text-sm">Express Kargo</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Puan</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-900 font-semibold text-sm">4.7/5</span>
                              <span className="text-amber-500 text-sm">★</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Gönderim</span>
                            <p className="text-slate-700 text-sm">2 gün önce</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📍</span>
                            <span className="text-slate-700 text-sm">Ankara → İzmir</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">📦</span>
                            <span className="text-slate-700 text-sm">Ev Eşyası</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-sm">🛡️</span>
                            <span className="text-slate-700 text-sm">Sigortalı</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600">Durum:</span>
                          <span className="text-sm font-medium text-slate-700">✅ Onaylandı - 4 gün içinde teslimat</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-slate-900 mb-1">₺2,100</p>
                      <p className="text-xs text-slate-600 mb-3">4 gün içinde teslimat</p>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors">
                          Takip Et
                        </button>
                        <button className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition-colors">
                          İletişim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Performance and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Performance Card - KURUMSAL BEYAZ TASARIM */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-slate-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Performansınız</h2>
              <div className="text-4xl font-bold text-slate-900 mb-2">
                {stats.successRate}%
              </div>
              <p className="text-sm text-slate-600 mb-4">Başarı Oranı</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gray-800 h-2 rounded-full transition-all duration-1000" 
                  style={{width: `${stats.successRate}%`}}
                ></div>
              </div>
              <p className="text-sm text-slate-600">Bu ay performansınız mükemmel!</p>
            </div>
          </div>

          {/* Quick Stats - KURUMSAL BEYAZ TASARIM */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Hızlı İstatistikler</h2>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Değerlendirme</span>
                </div>
                <span className="font-semibold text-slate-900">4.8/5</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Başarılı Teslimat</span>
                </div>
                <span className="font-semibold text-slate-900">42</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Aktif Nakliyeci</span>
                </div>
                <span className="font-semibold text-slate-900">12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;