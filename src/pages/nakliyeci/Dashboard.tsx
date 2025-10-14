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
    totalEarnings: 0,
    thisMonthEarnings: 0,
    monthlyGrowth: 0,
    activeDrivers: 0,
    totalOffers: 0,
    acceptedOffers: 0
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
      totalShipments: 28,
      deliveredShipments: 24,
      pendingShipments: 3,
      successRate: 89,
      totalEarnings: 18500.25,
      thisMonthEarnings: 4200.75,
      monthlyGrowth: 22.5,
      activeDrivers: 5,
      totalOffers: 45,
      acceptedOffers: 28
    },
    recentShipments: [
      {
        id: '1',
        trackingNumber: 'YN001234567',
        status: 'in_transit',
        from: 'İstanbul, Şişli',
        to: 'Ankara, Çankaya',
        weight: '3.5 kg',
        value: '₺450',
        date: '2024-01-15',
        description: 'Elektronik eşya - Laptop',
        driver: 'Veli Özkan'
      },
      {
        id: '2',
        trackingNumber: 'YN001234568',
        status: 'delivered',
        from: 'İstanbul, Beşiktaş',
        to: 'İzmir, Bornova',
        weight: '150 kg',
        value: '₺1,200',
        date: '2024-01-14',
        description: 'Endüstriyel parça',
        driver: 'Mehmet Kaya'
      },
      {
        id: '3',
        trackingNumber: 'YN001234569',
        status: 'pending',
        from: 'İstanbul, Şişli',
        to: 'İzmir, Konak',
        weight: '8.5 kg',
        value: '₺320',
        date: '2024-01-16',
        description: 'Kişisel eşya',
        driver: 'Ali Demir'
      }
    ],
    recentOffers: [
      {
        id: '1',
        shipmentId: 'YN001234567',
        price: '₺450',
        deliveryTime: '2-3 gün',
        status: 'accepted',
        sender: 'Ahmet Yılmaz',
        route: 'İstanbul → Ankara'
      },
      {
        id: '2',
        shipmentId: 'YN001234568',
        price: '₺1,200',
        deliveryTime: '1-2 gün',
        status: 'pending',
        sender: 'ABC Lojistik A.Ş.',
        route: 'İstanbul → İzmir'
      },
      {
        id: '3',
        shipmentId: 'YN001234569',
        price: '₺320',
        deliveryTime: '3-4 gün',
        status: 'rejected',
        sender: 'Ahmet Yılmaz',
        route: 'İstanbul → İzmir'
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
      setUnreadCount(7);
      
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

  const getOfferStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getOfferStatusText = (status) => {
    switch (status) {
      case 'accepted':
        return 'Kabul Edildi';
      case 'pending':
        return 'Bekliyor';
      case 'rejected':
        return 'Reddedildi';
      default:
        return 'Bilinmiyor';
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
        <title>Dashboard - YolNet Nakliyeci</title>
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
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Merhaba {user?.firstName}! 👋
                    </h1>
                    <p className="text-slate-200 text-lg leading-relaxed">
                      Nakliye hizmetlerinize hoş geldiniz. 
                      <br />
                      <span className="text-blue-300 font-semibold">Güvenilir, hızlı ve karlı</span> işlerle büyüyün.
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
                <Link to="/nakliyeci/notifications" className="relative group">
                  <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110">
                    <Bell size={20} className="text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </Link>
                <Link to="/nakliyeci/loads">
                  <button className="bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl">
                    <Plus size={20} />
                    Yük Ara
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
            <div className="mt-1 text-xs text-slate-500">Nakliye gönderi sayısı</div>
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
                  <span className="text-xs text-blue-600 font-semibold">%{stats.successRate} başarı</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Teslim Edildi</div>
            <div className="mt-1 text-xs text-slate-500">Başarıyla teslim edilen</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.activeDrivers}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">Aktif şoförler</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Aktif Şoförler</div>
            <div className="mt-1 text-xs text-slate-500">Çalışan şoför sayısı</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">₺{stats.totalEarnings.toLocaleString()}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">₺{stats.thisMonthEarnings.toLocaleString()} bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Kazanç</div>
            <div className="mt-1 text-xs text-slate-500">Nakliye kazançları</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Teklif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOffers}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Verilen teklifler
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kabul Edilen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.acceptedOffers}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  %{Math.round((stats.acceptedOffers / stats.totalOffers) * 100)} kabul oranı
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingShipments}</p>
                <p className="text-sm text-yellow-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  İşlem bekliyor
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link
                to="/nakliyeci/loads"
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Yeni Yük Ara</span>
              </Link>
              <Link
                to="/nakliyeci/offers"
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Tekliflerim</span>
              </Link>
              <Link
                to="/nakliyeci/fleet"
                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Truck className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Filo Yönetimi</span>
              </Link>
              <Link
                to="/nakliyeci/earnings"
                className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <DollarSign className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">Kazanç Raporu</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Gönderiler</h3>
            <div className="space-y-3">
              {recentShipments.slice(0, 3).map((shipment) => (
                <div key={shipment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(shipment.status)}`}>
                      {getStatusIcon(shipment.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{shipment.trackingNumber}</p>
                      <p className="text-sm text-gray-600">{shipment.from} → {shipment.to}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{shipment.value}</p>
                    <p className="text-xs text-gray-500">{shipment.driver}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/nakliyeci/shipments"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-3"
            >
              <span className="text-sm font-medium">Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Teklifler</h3>
            <div className="space-y-3">
              {recentOffers.slice(0, 3).map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{offer.shipmentId}</p>
                      <p className="text-sm text-gray-600">{offer.route}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{offer.price}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOfferStatusColor(offer.status)}`}>
                      {getOfferStatusText(offer.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/nakliyeci/offers"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-3"
            >
              <span className="text-sm font-medium">Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Recent Shipments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Son Gönderiler</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gönderi No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Güzergah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şoför
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {shipment.trackingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.from} → {shipment.to}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.driver}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
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