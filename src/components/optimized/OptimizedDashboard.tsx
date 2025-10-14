import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { api } from '../../services/optimized-api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  completedShipments: number;
  totalOffers: number;
  pendingOffers: number;
  acceptedOffers: number;
  totalAgreements: number;
  pendingAgreements: number;
  completedAgreements: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}

interface RecentActivity {
  id: number;
  type: 'shipment' | 'offer' | 'agreement' | 'tracking';
  title: string;
  description: string;
  status: string;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  disabled?: boolean;
}

export default function OptimizedDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Memoized filtered activities
  const filteredActivities = useMemo(() => {
    if (!recentActivities.length) return [];
    
    return recentActivities.filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [recentActivities, searchTerm, filterStatus]);

  // Memoized quick actions based on user type
  const quickActions = useMemo((): QuickAction[] => {
    const baseActions: QuickAction[] = [
      {
        id: 'create-shipment',
        title: 'Gönderi Oluştur',
        description: 'Yeni gönderi oluştur',
        icon: <Plus className="w-6 h-6" />,
        action: () => window.location.href = '/individual/create-shipment',
        color: 'bg-blue-500 hover:bg-blue-600'
      },
      {
        id: 'view-shipments',
        title: 'Gönderilerim',
        description: 'Tüm gönderilerimi görüntüle',
        icon: <Package className="w-6 h-6" />,
        action: () => window.location.href = '/individual/shipments',
        color: 'bg-green-500 hover:bg-green-600'
      },
      {
        id: 'view-offers',
        title: 'Teklifler',
        description: 'Gelen teklifleri görüntüle',
        icon: <DollarSign className="w-6 h-6" />,
        action: () => window.location.href = '/individual/offers',
        color: 'bg-yellow-500 hover:bg-yellow-600'
      },
      {
        id: 'view-tracking',
        title: 'Takip',
        description: 'Gönderi takibi yap',
        icon: <Truck className="w-6 h-6" />,
        action: () => window.location.href = '/individual/tracking',
        color: 'bg-purple-500 hover:bg-purple-600'
      }
    ];

    if (user?.panel_type === 'nakliyeci') {
      baseActions.push({
        id: 'view-loads',
        title: 'Yeni İlanlar',
        description: 'Yeni yük ilanlarını görüntüle',
        icon: <Package className="w-6 h-6" />,
        action: () => window.location.href = '/nakliyeci/loads',
        color: 'bg-orange-500 hover:bg-orange-600'
      });
    }

    return baseActions;
  }, [user?.panel_type]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [shipments, offers, agreements, analytics] = await Promise.all([
        api.shipments.getShipments(),
        api.offers.getNakliyeciOffers(),
        api.agreements.getSenderAgreements(),
        api.analytics.getDashboardStats()
      ]);

      // Calculate stats
      const calculatedStats: DashboardStats = {
        totalShipments: shipments.length,
        activeShipments: shipments.filter((s: any) => ['accepted', 'in_transit'].includes(s.status)).length,
        completedShipments: shipments.filter((s: any) => s.status === 'delivered').length,
        totalOffers: offers.length,
        pendingOffers: offers.filter((o: any) => o.status === 'pending').length,
        acceptedOffers: offers.filter((o: any) => o.status === 'accepted').length,
        totalAgreements: agreements.length,
        pendingAgreements: agreements.filter((a: any) => a.status === 'pending').length,
        completedAgreements: agreements.filter((a: any) => a.status === 'completed').length,
        totalRevenue: analytics?.totalRevenue || 0,
        monthlyRevenue: analytics?.monthlyRevenue || 0,
        averageRating: analytics?.averageRating || 0
      };

      setStats(calculatedStats);

      // Generate recent activities
      const activities: RecentActivity[] = [
        ...shipments.slice(0, 5).map((shipment: any) => ({
          id: shipment.id,
          type: 'shipment' as const,
          title: shipment.title,
          description: `${shipment.from_location} → ${shipment.to_location}`,
          status: shipment.status,
          timestamp: shipment.created_at,
          priority: shipment.priority
        })),
        ...offers.slice(0, 3).map((offer: any) => ({
          id: offer.id + 1000,
          type: 'offer' as const,
          title: `Teklif: ₺${offer.price}`,
          description: offer.message || 'Teklif mesajı yok',
          status: offer.status,
          timestamp: offer.created_at,
          priority: 'normal' as const
        })),
        ...agreements.slice(0, 3).map((agreement: any) => ({
          id: agreement.id + 2000,
          type: 'agreement' as const,
          title: `Anlaşma: ₺${agreement.agreed_price}`,
          description: `Komisyon: ₺${agreement.commission_amount}`,
          status: agreement.status,
          timestamp: agreement.created_at,
          priority: 'high' as const
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentActivities(activities);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Dashboard verileri yüklenirken bir hata oluştu');
      toast.error('Dashboard verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Veriler güncellendi');
  }, [loadDashboardData]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Dashboard yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hata Oluştu</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Hoş geldin, {user?.name}</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Gönderi</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalShipments || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Gönderi</p>
              <p className="text-3xl font-bold text-green-600">{stats?.activeShipments || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Teklif</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.totalOffers || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aylık Gelir</p>
              <p className="text-3xl font-bold text-purple-600">₺{stats?.monthlyRevenue?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onClick={action.action}
              disabled={action.disabled}
              className={`p-4 rounded-lg text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
            >
              <div className="flex items-center space-x-3">
                {action.icon}
                <div className="text-left">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Son Aktiviteler</h2>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Beklemede</option>
                <option value="accepted">Onaylandı</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence>
            {filteredActivities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aktivite yok</h3>
                <p className="text-gray-600">Henüz aktivite bulunmuyor</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'shipment' ? 'bg-blue-100' :
                      activity.type === 'offer' ? 'bg-yellow-100' :
                      activity.type === 'agreement' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      {activity.type === 'shipment' && <Package className="w-5 h-5 text-blue-600" />}
                      {activity.type === 'offer' && <DollarSign className="w-5 h-5 text-yellow-600" />}
                      {activity.type === 'agreement' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {activity.type === 'tracking' && <Truck className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{activity.title}</h3>
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        activity.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

