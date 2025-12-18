import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Star,
  Calendar,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import { createApiUrl } from '../../config/api';

export default function CorporateAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedCarrier, setSelectedCarrier] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data from API
  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const period = selectedPeriod === '7days' ? '7' : selectedPeriod === '30days' ? '30' : selectedPeriod === '90days' ? '90' : '365';
      const response = await fetch(createApiUrl(`/api/analytics/dashboard/corporate?period=${period}`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const raw = await response.json();
      const serverData = raw?.data || raw || {};

      // Normalize backend verisini UI'nin beklediği forma çevir
      const normalized = {
        totalShipments: serverData.totalShipments ?? 0,
        totalRevenue: serverData.totalRevenue ?? serverData.revenue ?? 0,
        customerSatisfaction: serverData.customerSatisfaction ?? serverData.averageRating ?? 0,
        monthlyGrowth: serverData.monthlyGrowth ?? 0,
        revenueGrowth: serverData.revenueGrowth ?? 0,
        satisfactionImprovement: serverData.satisfactionImprovement ?? 0,
        chartData: serverData.chartData ?? serverData.monthlyTrend ?? [],
      };

      setAnalyticsData(normalized);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Analitik veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      // Set empty data on error
      setAnalyticsData({
        totalShipments: 0,
        totalRevenue: 0,
        customerSatisfaction: 0,
        monthlyGrowth: 0,
        revenueGrowth: 0,
        satisfactionImprovement: 0,
        chartData: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load carriers for filtering
  const loadCarriers = async () => {
    try {
      const response = await fetch(createApiUrl('/api/carriers/corporate'), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const carriersData =
          (Array.isArray(data.carriers) ? data.carriers : null) ||
          (Array.isArray(data.data) ? data.data : null) ||
          (Array.isArray(data.data?.carriers) ? data.data.carriers : null) ||
          [];
        setCarriers(carriersData);
      }
    } catch (error) {
      console.error('Error loading carriers:', error);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadCarriers();
  }, [selectedPeriod, selectedCarrier]);

  const breadcrumbItems = [
    { label: 'Analitik Dashboard', icon: <BarChart3 className='w-4 h-4' /> },
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <ArrowUp className='w-4 h-4' />
    ) : (
      <ArrowDown className='w-4 h-4' />
    );
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const handleExport = () => {
    // Export functionality
    const data = {
      period: selectedPeriod,
      carrier: selectedCarrier,
      analytics: analyticsData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100'>
      <Helmet>
        <title>Analitik Dashboard - YolNext Kargo</title>
        <meta
          name='description'
          content='Kurumsal analitik ve performans raporları'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {isLoading && !analyticsData && (
          <LoadingState message='Analitik veriler yükleniyor...' />
        )}

        {error && (
          <div className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
            {error}
          </div>
        )}

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <BarChart3 className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Analitik{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Dashboard
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            İş performansınızı takip edin ve veri odaklı kararlar alın
          </p>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 mb-6 sm:mb-8'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <Filter className='w-5 h-5 text-slate-600' />
              <span className='text-sm font-medium text-slate-700'>
                Filtreler
              </span>
            </div>

            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
              {/* Period Selector */}
              <div className='flex items-center gap-2'>
                <Calendar className='w-4 h-4 text-slate-600' />
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className='px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                >
                  <option value='7days'>7 Gün</option>
                  <option value='30days'>30 Gün</option>
                  <option value='90days'>90 Gün</option>
                  <option value='1year'>1 Yıl</option>
                </select>
              </div>

              {/* Carrier Selector */}
              <div className='flex items-center gap-2'>
                <Package className='w-4 h-4 text-slate-600' />
                <select
                  value={selectedCarrier}
                  onChange={e => setSelectedCarrier(e.target.value)}
                  className='px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                >
                  <option value='all'>Tüm Nakliyeciler</option>
                  {carriers.map(carrier => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2'>
                <button
                  onClick={loadAnalytics}
                  className='p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors'
                  title='Verileri Yenile'
                >
                  <RefreshCw className='w-4 h-4' />
                </button>
                <button
                  onClick={handleExport}
                  className='p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors'
                  title='Raporu İndir'
                >
                  <Download className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main KPI Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8'>
          {/* Toplam Gönderi */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-slate-100 rounded-lg'>
                <Package className='w-6 h-6 text-slate-700' />
              </div>
              <div className='flex items-center gap-1'>
                {getTrendIcon('up')}
                <span className='text-sm font-medium text-green-600'>
                  +{analyticsData?.monthlyGrowth}%
                </span>
              </div>
            </div>
            <div className='mb-2'>
              <h3 className='text-2xl font-bold text-slate-900'>
                {analyticsData?.totalShipments?.toLocaleString()}
              </h3>
              <p className='text-sm text-slate-600'>Toplam Gönderi</p>
            </div>
            <div className='text-xs text-slate-500'>
              Bu dönem tamamlanan gönderi sayısı
            </div>
          </div>

          {/* Toplam Gelir */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-slate-100 rounded-lg'>
                <DollarSign className='w-6 h-6 text-slate-700' />
              </div>
              <div className='flex items-center gap-1'>
                {getTrendIcon('up')}
                <span className='text-sm font-medium text-green-600'>
                  +{analyticsData?.revenueGrowth}%
                </span>
              </div>
            </div>
            <div className='mb-2'>
              <h3 className='text-2xl font-bold text-slate-900'>
                ₺{(analyticsData?.totalRevenue / 1000000).toFixed(1)}M
              </h3>
              <p className='text-sm text-slate-600'>Toplam Gelir</p>
            </div>
            <div className='text-xs text-slate-500'>
              Bu dönem nakliye geliri
            </div>
          </div>

          {/* Müşteri Memnuniyeti */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-slate-100 rounded-lg'>
                <Star className='w-6 h-6 text-slate-700' />
              </div>
              <div className='flex items-center gap-1'>
                {getTrendIcon('up')}
                <span className='text-sm font-medium text-green-600'>
                  +{analyticsData?.satisfactionImprovement}
                </span>
              </div>
            </div>
            <div className='mb-2'>
              <h3 className='text-2xl font-bold text-slate-900'>
                {analyticsData?.customerSatisfaction}/5
              </h3>
              <p className='text-sm text-slate-600'>Müşteri Memnuniyeti</p>
            </div>
            <div className='text-xs text-slate-500'>Ortalama müşteri puanı</div>
          </div>
        </div>

        {/* Summary Section */}
        <div className='bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-slate-200'>
          <div className='flex items-center gap-3 mb-6'>
            <BarChart3 className='w-6 h-6 text-slate-700' />
            <h2 className='text-xl font-bold text-slate-900'>Özet Bilgiler</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* En İyi Ay */}
            <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2 mb-2'>
                <TrendingUp className='w-5 h-5 text-green-600' />
                <h3 className='text-sm font-semibold text-green-800'>
                  En İyi Ay
                </h3>
              </div>
              {analyticsData?.chartData &&
              analyticsData.chartData.length > 0 ? (
                (() => {
                  const bestMonth = analyticsData.chartData.reduce(
                    (max: any, current: any) =>
                      current.shipments > max.shipments ? current : max
                  );
                  return (
                    <>
                      <p className='text-lg font-bold text-green-900'>
                        {bestMonth.month}
                      </p>
                      <p className='text-xs text-green-600'>
                        {bestMonth.shipments} gönderi, ₺
                        {(bestMonth.revenue / 1000).toFixed(0)}K gelir
                      </p>
                    </>
                  );
                })()
              ) : (
                <>
                  <p className='text-lg font-bold text-green-900'>-</p>
                  <p className='text-xs text-green-600'>Veri yok</p>
                </>
              )}
            </div>

            {/* Ortalama Performans */}
            <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='flex items-center gap-2 mb-2'>
                <BarChart3 className='w-5 h-5 text-blue-600' />
                <h3 className='text-sm font-semibold text-blue-800'>
                  Ortalama
                </h3>
              </div>
              {analyticsData?.chartData &&
              analyticsData.chartData.length > 0 ? (
                (() => {
                  const avgShipments = Math.round(
                    analyticsData.chartData.reduce(
                      (sum: number, item: any) => sum + item.shipments,
                      0
                    ) / analyticsData.chartData.length
                  );
                  const avgRevenue = Math.round(
                    analyticsData.chartData.reduce(
                      (sum: number, item: any) => sum + item.revenue,
                      0
                    ) / analyticsData.chartData.length
                  );
                  return (
                    <>
                      <p className='text-lg font-bold text-blue-900'>
                        {avgShipments} gönderi/ay
                      </p>
                      <p className='text-xs text-blue-600'>
                        ₺{(avgRevenue / 1000).toFixed(0)}K ortalama gelir
                      </p>
                    </>
                  );
                })()
              ) : (
                <>
                  <p className='text-lg font-bold text-blue-900'>-</p>
                  <p className='text-xs text-blue-600'>Veri yok</p>
                </>
              )}
            </div>

            {/* Büyüme Oranı */}
            <div className='p-4 bg-purple-50 rounded-lg border border-purple-200'>
              <div className='flex items-center gap-2 mb-2'>
                <TrendingUp className='w-5 h-5 text-purple-600' />
                <h3 className='text-sm font-semibold text-purple-800'>
                  Büyüme
                </h3>
              </div>
              <p className='text-lg font-bold text-purple-900'>
                {analyticsData?.monthlyGrowth > 0 ? '+' : ''}
                {analyticsData?.monthlyGrowth || 0}%
              </p>
              <p className='text-xs text-purple-600'>Aylık gönderi artışı</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
