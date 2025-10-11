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
  MapPin,
  BarChart3,
  ArrowRight,
  Calendar,
  Weight,
  Ruler,
  Building2,
  Target,
  User,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Activity,
  X
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    successRate: 0,
    totalSpent: 0,
    thisMonthSpent: 0,
    monthlyGrowth: 0,
    activeCarriers: 0
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [recentOffers, setRecentOffers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Mock data - Gerçek API'den gelecek
  const mockData = {
    stats: {
      totalShipments: 45,
      deliveredShipments: 38,
      pendingShipments: 5,
      successRate: 92,
      totalSpent: 12500.75,
      thisMonthSpent: 3200.50,
      monthlyGrowth: 15.2,
      activeCarriers: 8
    },
    recentShipments: [
      {
        id: '1',
        trackingNumber: 'YN001234567',
        status: 'pending',
        from: 'İstanbul, Beşiktaş',
        to: 'Ankara, Çankaya',
        weight: '150 kg',
        value: '₺1,200',
        date: '2024-01-15',
        description: 'Endüstriyel parça - Motor',
        priority: 'high'
      },
      {
        id: '2',
        trackingNumber: 'YN001234568',
        status: 'in_transit',
        from: 'İstanbul, Beşiktaş',
        to: 'İzmir, Bornova',
        weight: '75 kg',
        value: '₺850',
        date: '2024-01-14',
        description: 'Elektronik ekipman',
        priority: 'normal'
      },
      {
        id: '3',
        trackingNumber: 'YN001234569',
        status: 'delivered',
        from: 'İstanbul, Beşiktaş',
        to: 'Bursa, Nilüfer',
        weight: '200 kg',
        value: '₺1,500',
        date: '2024-01-12',
        description: 'Makine parçaları',
        priority: 'normal'
      },
      {
        id: '4',
        trackingNumber: 'YN001234570',
        status: 'delivered',
        from: 'İstanbul, Beşiktaş',
        to: 'Antalya, Muratpaşa',
        weight: '50 kg',
        value: '₺650',
        date: '2024-01-10',
        description: 'Doküman ve belgeler',
        priority: 'low'
      }
    ],
    recentOffers: [
      {
        id: '1',
        carrierName: 'Hızlı Kargo Ltd.',
        price: '₺1,200',
        deliveryTime: '1-2 gün',
        rating: 4.5,
        status: 'pending',
        shipmentId: '1'
      },
      {
        id: '2',
        carrierName: 'Güvenilir Nakliye A.Ş.',
        price: '₺1,100',
        deliveryTime: '2-3 gün',
        rating: 4.2,
        status: 'accepted',
        shipmentId: '2'
      },
      {
        id: '3',
        carrierName: 'Express Lojistik',
        price: '₺1,350',
        deliveryTime: '1 gün',
        rating: 4.8,
        status: 'pending',
        shipmentId: '3'
      }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
    setIsLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats(mockData.stats);
      setRecentShipments(mockData.recentShipments);
      setRecentOffers(mockData.recentOffers);
      setUnreadCount(5);
      
      setIsLoading(false);
    };

    loadData();
  }, []);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'in_transit':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'in_transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'cancelled':
        return 'İptal';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük';
      default:
        return 'Normal';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Dashboard - YolNet</title>
        </Helmet>
        <div className="p-6">
          <Breadcrumb
            items={[
              { label: 'Ana Sayfa', icon: <Package className="w-4 h-4" /> },
              { label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> }
            ]}
          />
          <LoadingState text="Dashboard yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Dashboard - YolNet Kurumsal</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Professional Header - Mobile Optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Merhaba {user?.firstName}! 👋
                    </h1>
                    <p className="text-slate-200 text-lg leading-relaxed">
                      Kurumsal nakliye hizmetlerinize hoş geldiniz. 
                      <br />
                      <span className="text-blue-300 font-semibold">Profesyonel, güvenilir ve ekonomik</span> çözümlerimizle yanınızdayız.
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
                <Link to="/corporate/shipments/new">
                  <button className="bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl">
                    <Plus size={20} />
                    Gönderi Oluştur
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Ana Tasarım */}
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
                  <span className="text-xs text-blue-600 font-semibold">+{stats.monthlyGrowth}% bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Gönderi</div>
            <div className="mt-1 text-xs text-slate-500">Kurumsal gönderi sayısı</div>
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
                  <span className="text-xs text-blue-600 font-semibold">+{Math.round(stats.deliveredShipments * 0.15)} bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Teslim Edildi</div>
            <div className="mt-1 text-xs text-slate-500">Başarıyla teslim edilen</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.activeCarriers}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">Aktif ortaklar</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Aktif Nakliyeci</div>
            <div className="mt-1 text-xs text-slate-500">Çalışan ortaklarınız</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">₺{stats.totalSpent.toLocaleString()}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">₺{stats.thisMonthSpent.toLocaleString()} bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Harcama</div>
            <div className="mt-1 text-xs text-slate-500">Nakliye harcamaları</div>
          </div>
        </div>

        {/* Quick Actions - Ana Tasarım */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Hızlı İşlemler</h2>
              <p className="text-slate-600">Kurumsal hizmetlerimize hızlı erişim</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/corporate/shipments/new">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Yeni Gönderi</h3>
                  <p className="text-sm text-slate-600">Kurumsal gönderi oluştur</p>
                  <div className="mt-3 w-8 h-1 bg-blue-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>

            <Link to="/corporate/offers">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Teklifler</h3>
                  <p className="text-sm text-slate-600">Teklifleri görüntüle</p>
                  <div className="mt-3 w-8 h-1 bg-green-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
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
                  <p className="text-sm text-slate-600">Ortakları keşfet</p>
                  <div className="mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>

            <Link to="/corporate/analytics">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Analitik</h3>
                  <p className="text-sm text-slate-600">Raporları görüntüle</p>
                  <div className="mt-3 w-8 h-1 bg-orange-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>
          </div>
        </div>


        {/* Recent Shipments Table - Ana Tasarım */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Son Gönderiler</h2>
              <p className="text-slate-600">Kurumsal gönderilerinizi takip edin</p>
            </div>
            <Link to="/corporate/shipments" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Gönderi No</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Güzergah</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Ağırlık</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Tutar</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Öncelik</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Tarih</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm font-semibold text-slate-800">{shipment.trackingNumber}</div>
                      <div className="text-xs text-slate-500">{shipment.date}</div>
                      <div className="text-xs text-slate-500">{shipment.description}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {shipment.status === 'in_transit' ? <Truck className="w-3 h-3 mr-1" /> :
                         shipment.status === 'pending' ? <Clock className="w-3 h-3 mr-1" /> :
                         shipment.status === 'delivered' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                         <X className="w-3 h-3 mr-1" />}
                        {getStatusText(shipment.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">{shipment.from} → {shipment.to}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">{shipment.weight}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-bold text-blue-700">{shipment.value}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(shipment.priority)}`}>
                        {getPriorityText(shipment.priority)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-slate-500">{shipment.date}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors">
                          Detay
                        </button>
                        <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                          Mesaj
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <SuccessMessage
            message={successMessage}
            isVisible={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;