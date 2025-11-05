import React, { useState } from 'react';
import {
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ReportData {
  id: string;
  name: string;
  type: 'shipment' | 'financial' | 'performance' | 'user';
  period: string;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  metrics: {
    totalShipments: number;
    totalRevenue: number;
    averageDeliveryTime: number;
    customerSatisfaction: number;
    costSavings: number;
  };
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

const DetailedReporting: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const periods = [
    { id: '7days', name: 'Son 7 Gün', value: 7 },
    { id: '30days', name: 'Son 30 Gün', value: 30 },
    { id: '90days', name: 'Son 90 Gün', value: 90 },
    { id: '1year', name: 'Son 1 Yıl', value: 365 },
  ];

  const reportTypes = [
    { id: 'shipment', name: 'Gönderi Raporları', icon: Package, color: 'blue' },
    {
      id: 'financial',
      name: 'Mali Raporlar',
      icon: DollarSign,
      color: 'green',
    },
    {
      id: 'performance',
      name: 'Performans Raporları',
      icon: TrendingUp,
      color: 'purple',
    },
    { id: 'user', name: 'Kullanıcı Raporları', icon: Users, color: 'orange' },
  ];

  const reports: ReportData[] = [
    {
      id: '1',
      name: 'Aylık Gönderi Analizi',
      type: 'shipment',
      period: '30days',
      generatedAt: '2024-01-20T10:30:00Z',
      status: 'completed',
      metrics: {
        totalShipments: 1250,
        totalRevenue: 45000,
        averageDeliveryTime: 2.5,
        customerSatisfaction: 94,
        costSavings: 15,
      },
    },
    {
      id: '2',
      name: 'Mali Performans Raporu',
      type: 'financial',
      period: '30days',
      generatedAt: '2024-01-19T14:20:00Z',
      status: 'completed',
      metrics: {
        totalShipments: 980,
        totalRevenue: 38000,
        averageDeliveryTime: 2.8,
        customerSatisfaction: 92,
        costSavings: 18,
      },
    },
    {
      id: '3',
      name: 'Nakliyeci Performansı',
      type: 'performance',
      period: '90days',
      generatedAt: '2024-01-18T09:15:00Z',
      status: 'processing',
      metrics: {
        totalShipments: 0,
        totalRevenue: 0,
        averageDeliveryTime: 0,
        customerSatisfaction: 0,
        costSavings: 0,
      },
    },
  ];

  const chartData: ChartData[] = [
    { label: 'İstanbul', value: 450, color: '#3B82F6', trend: 'up' },
    { label: 'Ankara', value: 320, color: '#10B981', trend: 'up' },
    { label: 'İzmir', value: 280, color: '#F59E0B', trend: 'down' },
    { label: 'Bursa', value: 150, color: '#EF4444', trend: 'stable' },
    { label: 'Antalya', value: 120, color: '#8B5CF6', trend: 'up' },
  ];

  const generateReport = async (type: string) => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const downloadReport = (reportId: string) => {
    // Simulate download
    console.log(`Downloading report ${reportId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='w-4 h-4' />;
      case 'processing':
        return <RefreshCw className='w-4 h-4 animate-spin' />;
      case 'failed':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detaylı Raporlama
            </h1>
            <p className='text-gray-600 mt-2'>
              Kapsamlı analiz ve raporlar oluşturun
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
            <button className='bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center'>
              <Download className='w-4 h-4 mr-2' />
              Tümünü İndir
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Report Types */}
          <div className='lg:col-span-1'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              Rapor Türleri
            </h2>
            <div className='space-y-3'>
              {reportTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => generateReport(type.id)}
                    disabled={isGenerating}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedReport === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          type.color === 'blue'
                            ? 'bg-blue-100 text-blue-600'
                            : type.color === 'green'
                              ? 'bg-green-100 text-green-600'
                              : type.color === 'purple'
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        <Icon className='w-5 h-5' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {type.name}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Detaylı analiz raporu
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reports List */}
          <div className='lg:col-span-2'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              Mevcut Raporlar
            </h2>
            <div className='space-y-4'>
              {reports.map(report => (
                <div
                  key={report.id}
                  className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'
                >
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {report.name}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        {periods.find(p => p.id === report.period)?.name} •
                        {new Date(report.generatedAt).toLocaleDateString(
                          'tr-TR'
                        )}
                      </p>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusIcon(report.status)}
                        <span className='ml-1'>
                          {report.status === 'completed'
                            ? 'Tamamlandı'
                            : report.status === 'processing'
                              ? 'İşleniyor'
                              : 'Hatalı'}
                        </span>
                      </span>
                      {report.status === 'completed' && (
                        <button
                          onClick={() => downloadReport(report.id)}
                          className='p-2 text-gray-600 hover:text-gray-800'
                        >
                          <Download className='w-4 h-4' />
                        </button>
                      )}
                    </div>
                  </div>

                  {report.status === 'completed' && (
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-blue-600'>
                          {report.metrics.totalShipments}
                        </div>
                        <div className='text-xs text-gray-500'>Gönderi</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-green-600'>
                          ₺{report.metrics.totalRevenue.toLocaleString()}
                        </div>
                        <div className='text-xs text-gray-500'>Gelir</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-purple-600'>
                          {report.metrics.averageDeliveryTime}g
                        </div>
                        <div className='text-xs text-gray-500'>
                          Ort. Teslimat
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-orange-600'>
                          %{report.metrics.customerSatisfaction}
                        </div>
                        <div className='text-xs text-gray-500'>Memnuniyet</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div className='lg:col-span-1'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              Hızlı Analiz
            </h2>

            {/* Key Metrics */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
              <h3 className='font-semibold text-gray-900 mb-4'>
                Temel Metrikler
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Toplam Gönderi</span>
                  <span className='font-semibold text-gray-900'>1,250</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Aylık Gelir</span>
                  <span className='font-semibold text-green-600'>₺45,000</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Ort. Teslimat</span>
                  <span className='font-semibold text-blue-600'>2.5 gün</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>
                    Maliyet Tasarrufu
                  </span>
                  <span className='font-semibold text-purple-600'>%15</span>
                </div>
              </div>
            </div>

            {/* City Distribution */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h3 className='font-semibold text-gray-900 mb-4'>
                Şehir Dağılımı
              </h3>
              <div className='space-y-3'>
                {chartData.map((city, index) => (
                  <div
                    key={city.label}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center space-x-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: city.color }}
                      ></div>
                      <span className='text-sm text-gray-600'>
                        {city.label}
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className='text-sm font-semibold text-gray-900'>
                        {city.value}
                      </span>
                      {city.trend && (
                        <div
                          className={`flex items-center ${
                            city.trend === 'up'
                              ? 'text-green-600'
                              : city.trend === 'down'
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {city.trend === 'up' ? (
                            <TrendingUp className='w-3 h-3' />
                          ) : city.trend === 'down' ? (
                            <TrendingDown className='w-3 h-3' />
                          ) : (
                            <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className='mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Revenue Chart */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Gelir Trendi
              </h3>
              <div className='flex items-center space-x-2'>
                <BarChart3 className='w-5 h-5 text-gray-600' />
                <span className='text-sm text-gray-500'>Son 30 gün</span>
              </div>
            </div>
            <div className='h-64 flex items-center justify-center bg-gray-50 rounded-lg'>
              <div className='text-center'>
                <BarChart3 className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                <p className='text-gray-500'>Grafik yükleniyor...</p>
              </div>
            </div>
          </div>

          {/* Shipment Distribution */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Gönderi Dağılımı
              </h3>
              <div className='flex items-center space-x-2'>
                <PieChart className='w-5 h-5 text-gray-600' />
                <span className='text-sm text-gray-500'>Kategoriler</span>
              </div>
            </div>
            <div className='h-64 flex items-center justify-center bg-gray-50 rounded-lg'>
              <div className='text-center'>
                <PieChart className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                <p className='text-gray-500'>Grafik yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedReporting;
