import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Filter,
  DollarSign,
  Package,
  Truck,
  Users,
  Clock,
  Star
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  shipments: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
  };
  carriers: {
    total: number;
    active: number;
    rating: number;
  };
  trends: {
    daily: Array<{ date: string; value: number }>;
    weekly: Array<{ week: string; value: number }>;
    monthly: Array<{ month: string; value: number }>;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  userType: 'individual' | 'corporate' | 'carrier' | 'logistics' | 'admin';
  onExport?: (format: 'csv' | 'pdf' | 'excel') => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, userType, onExport }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const periods = [
    { value: '7d', label: 'Son 7 Gün' },
    { value: '30d', label: 'Son 30 Gün' },
    { value: '90d', label: 'Son 3 Ay' },
    { value: '1y', label: 'Son 1 Yıl' }
  ];

  const metrics = [
    { value: 'revenue', label: 'Gelir', icon: DollarSign, color: 'text-green-600' },
    { value: 'shipments', label: 'Gönderiler', icon: Package, color: 'text-blue-600' },
    { value: 'users', label: 'Kullanıcılar', icon: Users, color: 'text-purple-600' },
    { value: 'carriers', label: 'Nakliyeciler', icon: Truck, color: 'text-orange-600' }
  ];

  const getMetricData = (metric: string) => {
    switch (metric) {
      case 'revenue':
        return {
          value: data.revenue.total,
          growth: data.revenue.growth,
          label: 'Toplam Gelir',
          format: 'currency'
        };
      case 'shipments':
        return {
          value: data.shipments.total,
          growth: 15.2,
          label: 'Toplam Gönderi',
          format: 'number'
        };
      case 'users':
        return {
          value: data.users.total,
          growth: 8.7,
          label: 'Toplam Kullanıcı',
          format: 'number'
        };
      case 'carriers':
        return {
          value: data.carriers.total,
          growth: 12.3,
          label: 'Toplam Nakliyeci',
          format: 'number'
        };
      default:
        return { value: 0, growth: 0, label: '', format: 'number' };
    }
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
      case 'number':
        return value.toLocaleString('tr-TR');
      default:
        return value.toString();
    }
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitik Dashboard</h1>
          <p className="text-gray-600">İşletmenizin performansını takip edin</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onExport?.('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const metricData = getMetricData(metric.value);
          const GrowthIcon = getGrowthIcon(metricData.growth);
          
          return (
            <div key={metric.value} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  metric.color.replace('text-', 'bg-').replace('-600', '-100')
                }`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${getGrowthColor(metricData.growth)}`}>
                  <GrowthIcon className="w-4 h-4" />
                  {Math.abs(metricData.growth).toFixed(1)}%
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatValue(metricData.value, metricData.format)}
                </p>
                <p className="text-sm text-gray-600">{metricData.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gelir Trendi</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Günlük</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Grafik burada görünecek</p>
            </div>
          </div>
        </div>

        {/* Shipments Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gönderi Durumu</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Tamamlanan</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Grafik burada görünecek</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Aktivitesi</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Aktif Kullanıcılar</span>
              </div>
              <span className="font-semibold text-gray-900">{data.users.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Yeni Kullanıcılar</span>
              </div>
              <span className="font-semibold text-gray-900">{data.users.new}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-gray-600">Ortalama Oturum</span>
              </div>
              <span className="font-semibold text-gray-900">24 dk</span>
            </div>
          </div>
        </div>

        {/* Carrier Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nakliyeci Performansı</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">Aktif Nakliyeciler</span>
              </div>
              <span className="font-semibold text-gray-900">{data.carriers.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-gray-600">Ortalama Puan</span>
              </div>
              <span className="font-semibold text-gray-900">{data.carriers.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Tamamlanan Gönderi</span>
              </div>
              <span className="font-semibold text-gray-900">{data.shipments.completed}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Sağlığı</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Sistem Durumu</span>
              </div>
              <span className="font-semibold text-green-600">Sağlıklı</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Yanıt Süresi</span>
              </div>
              <span className="font-semibold text-gray-900">120ms</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Uptime</span>
              </div>
              <span className="font-semibold text-gray-900">99.9%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rapor İndir</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onExport?.('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => onExport?.('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => onExport?.('excel')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

