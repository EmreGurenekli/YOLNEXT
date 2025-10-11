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
  Activity
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
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard - YolNet</title>
      </Helmet>
      
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Ana Sayfa', icon: <Package className="w-4 h-4" /> },
            { label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> }
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Merhaba {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Kurumsal gönderilerinizi takip edin ve yeni gönderi oluşturun
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gönderi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalShipments}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +{stats.monthlyGrowth}% bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teslim Edilen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveredShipments}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  %{stats.successRate} başarı
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
                <p className="text-sm font-medium text-gray-600">Aktif Nakliyeci</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCarriers}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  Ortaklarınız
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Harcama</p>
                <p className="text-2xl font-bold text-gray-900">₺{stats.totalSpent.toFixed(2)}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ₺{stats.thisMonthSpent.toFixed(2)} bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
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
                to="/corporate/shipments/new"
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Yeni Gönderi Oluştur</span>
              </Link>
              <Link
                to="/corporate/offers"
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Teklifleri Görüntüle</span>
              </Link>
              <Link
                to="/corporate/carriers"
                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Truck className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Nakliyecileri Keşfet</span>
              </Link>
              <Link
                to="/corporate/analytics"
                className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">Analitik Raporlar</span>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(shipment.priority)}`}>
                      {getPriorityText(shipment.priority)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/corporate/shipments"
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
                      <Truck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{offer.carrierName}</p>
                      <p className="text-sm text-gray-600">{offer.deliveryTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{offer.price}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-500">{offer.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/corporate/offers"
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
                    Ağırlık
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öncelik
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
                      {shipment.weight}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(shipment.priority)}`}>
                        {getPriorityText(shipment.priority)}
                      </span>
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
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;