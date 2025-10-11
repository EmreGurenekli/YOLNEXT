import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Truck, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Settings,
  Shield,
  Activity
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCarriers: number;
  activeCarriers: number;
  totalShipments: number;
  completedShipments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingVerifications: number;
  systemAlerts: number;
}

interface AdminDashboardProps {
  stats: AdminStats;
  recentActivity: any[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    responseTime: number;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, recentActivity, systemHealth }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);

  const getSystemHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSystemHealthText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Sağlıklı';
      case 'warning': return 'Uyarı';
      case 'critical': return 'Kritik';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
              <p className="text-gray-600">Sistem yönetimi ve analitik</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSystemHealthColor(systemHealth.status)}`}>
                {getSystemHealthText(systemHealth.status)}
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Sistem Durumu */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sistem Durumu</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Uptime: {systemHealth.uptime}</span>
                <span>Response: {systemHealth.responseTime}ms</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Aktif Kullanıcılar</p>
                  <p className="text-xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Bugünkü Gönderiler</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalShipments}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Günlük Gelir</p>
                  <p className="text-xl font-bold text-gray-900">₺{stats.monthlyRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ana İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Kullanıcılar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12% bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nakliyeciler</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCarriers}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +8% bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gönderiler</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalShipments}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +15% bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">₺{stats.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +22% bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Uyarılar ve Bekleyen İşlemler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bekleyen Doğrulamalar</h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                {stats.pendingVerifications}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Nakliyeci Doğrulama</p>
                  <p className="text-xs text-gray-600">5 bekleyen başvuru</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800">İncele</button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Shield className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Kimlik Doğrulama</p>
                  <p className="text-xs text-gray-600">3 bekleyen başvuru</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800">İncele</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sistem Uyarıları</h3>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                {stats.systemAlerts}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Yüksek CPU Kullanımı</p>
                  <p className="text-xs text-gray-600">5 dakika önce</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800">Çöz</button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Veritabanı Yavaşlığı</p>
                  <p className="text-xs text-gray-600">10 dakika önce</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800">Çöz</button>
              </div>
            </div>
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">Tümünü Gör</button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

