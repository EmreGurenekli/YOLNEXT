import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BarChart3,
  Calendar,
  RefreshCw,
  TrendingUp,
  Truck,
  Star,
  DollarSign,
  Route,
  CheckCircle2,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import { createApiUrl } from '../../config/api';

type Period = '7days' | '30days' | '90days' | '1year';

type DashboardData = {
  totalShipments: number;
  deliveredShipments: number;
  totalEarnings: number;
  averageRating: number;
  successRate: number;
  monthlyGrowth: number;
  topRoutes: Array<{ fromCity: string; toCity: string; count: number }>;
  dailyShipments: Array<{ date: string; count: number }>;
};

type ShipmentsData = {
  totalShipments: number;
  byStatus: Array<{ status: string; count: number }>;
  monthlyTrend: Array<{ month: string; shipments: number; revenue: number }>;
};

type PerformanceData = {
  totalOffers: number;
  acceptedOffers: number;
  averageOffer: number;
  successRate: number;
  monthlyPerformance: Array<{ month: string; offers: number; accepted: number; averageOffer: number }>;
};

const getPeriodLabel = (p: Period) => {
  switch (p) {
    case '7days':
      return '7 Gün';
    case '30days':
      return '30 Gün';
    case '90days':
      return '90 Gün';
    case '1year':
      return '1 Yıl';
    default:
      return String(p);
  }
};

import { formatCurrency as formatCurrencyBase } from '../../utils/format';

const formatCurrency = (value: number) => {
  try {
    return formatCurrencyBase(value || 0, 'TRY');
  } catch {
    return `₺${Math.round(value || 0)}`;
  }
};

const formatCompactNumber = (value: number) => {
  try {
    return new Intl.NumberFormat('tr-TR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value || 0);
  } catch {
    return String(value || 0);
  }
};

const NakliyeciAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30days');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [shipments, setShipments] = useState<ShipmentsData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  const breadcrumbItems = useMemo(
    () => [{ label: 'Analitik', icon: <BarChart3 className='w-4 h-4' /> }],
    []
  );

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      };

      const [dRes, sRes, pRes] = await Promise.all([
        fetch(createApiUrl(`/api/analytics/dashboard/nakliyeci?period=${encodeURIComponent(period)}`), { headers }),
        fetch(createApiUrl(`/api/analytics/shipments?period=${encodeURIComponent(period)}`), { headers }),
        fetch(createApiUrl(`/api/analytics/performance?period=${encodeURIComponent(period)}`), { headers }),
      ]);

      const dRaw = dRes.ok ? await dRes.json() : null;
      const sRaw = sRes.ok ? await sRes.json() : null;
      const pRaw = pRes.ok ? await pRes.json() : null;

      const dashboardData = dRaw?.data || dRaw || null;
      const shipmentsData = sRaw?.data || sRaw || null;
      const performanceData = pRaw?.data || pRaw || null;

      setDashboard(dashboardData);
      setShipments(shipmentsData);
      setPerformance(performanceData);
    } catch (e: any) {
      setError(e?.message || 'Analitik veriler yüklenemedi');
      setDashboard(null);
      setShipments(null);
      setPerformance(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  const dailyBars = dashboard?.dailyShipments || [];
  const maxDaily = Math.max(1, ...dailyBars.map(x => x.count || 0));

  if (isLoading && !dashboard && !shipments && !performance) {
    return <LoadingState message='Analitik veriler yükleniyor...' />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100'>
      <Helmet>
        <title>Analitik - Nakliyeci Panel - YolNext</title>
        <meta name='description' content='Nakliyeci performans analizi ve trend raporları' />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-7 mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
                  <BarChart3 className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>
                    Analitik{' '}
                    <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
                      Dashboard
                    </span>
                  </h1>
                  <p className='text-sm text-slate-600'>Gerçek verilerle performans ve trend takibi</p>
                </div>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
              <div className='flex items-center gap-2'>
                <Calendar className='w-4 h-4 text-slate-600' />
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value as Period)}
                  className='px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                >
                  <option value='7days'>7 Gün</option>
                  <option value='30days'>30 Gün</option>
                  <option value='90days'>90 Gün</option>
                  <option value='1year'>1 Yıl</option>
                </select>
              </div>
              <button
                onClick={load}
                disabled={isLoading}
                className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-60'
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>

          {error && (
            <div className='mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800'>
              {error}
            </div>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6'>
          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-slate-100 rounded-xl'>
                <Truck className='w-6 h-6 text-slate-800' />
              </div>
              <div className='text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg'>
                {getPeriodLabel(period)}
              </div>
            </div>
            <div className='text-3xl font-bold text-slate-900'>
              {formatCompactNumber(dashboard?.totalShipments || 0)}
            </div>
            <div className='text-sm text-slate-600 mt-1'>Toplam İş</div>
            <div className='mt-3 flex items-center gap-2 text-xs'>
              <TrendingUp className='w-4 h-4 text-emerald-600' />
              <span className='text-emerald-700 font-semibold'>%{dashboard?.monthlyGrowth ?? 0}</span>
              <span className='text-slate-500'>son 30 gün büyüme</span>
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-slate-100 rounded-xl'>
                <CheckCircle2 className='w-6 h-6 text-slate-800' />
              </div>
              <div className='text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg'>
                Tamamlanan
              </div>
            </div>
            <div className='text-3xl font-bold text-slate-900'>
              %{dashboard?.successRate ?? 0}
            </div>
            <div className='text-sm text-slate-600 mt-1'>Başarı Oranı</div>
            <div className='mt-3 text-xs text-slate-500'>
              {dashboard?.deliveredShipments || 0} teslim / {dashboard?.totalShipments || 0} toplam
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-slate-100 rounded-xl'>
                <Star className='w-6 h-6 text-slate-800' />
              </div>
              <div className='text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg'>
                Ortalama
              </div>
            </div>
            <div className='text-3xl font-bold text-slate-900'>
              {(dashboard?.averageRating ?? 0).toFixed(1)}
            </div>
            <div className='text-sm text-slate-600 mt-1'>Puan</div>
            <div className='mt-3 text-xs text-slate-500'>Son değerlendirmelerin ortalaması</div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-slate-100 rounded-xl'>
                <DollarSign className='w-6 h-6 text-slate-800' />
              </div>
              <div className='text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg'>
                Teslimatlar
              </div>
            </div>
            <div className='text-3xl font-bold text-slate-900'>
              {formatCurrency(dashboard?.totalEarnings || 0)}
            </div>
            <div className='text-sm text-slate-600 mt-1'>Toplam Kazanç</div>
            <div className='mt-3 text-xs text-slate-500'>Bu dönem teslim edilen işlerden</div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
          <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-6 lg:col-span-2'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
                  <BarChart3 className='w-5 h-5 text-white' />
                </div>
                <div>
                  <h2 className='text-lg font-bold text-slate-900'>14 Günlük Aktivite</h2>
                  <p className='text-sm text-slate-600'>Gün bazlı alınan/atanan işler</p>
                </div>
              </div>
            </div>

            <div className='h-56 flex items-end gap-2'>
              {dailyBars.length === 0 ? (
                <div className='text-sm text-slate-500'>Henüz veri yok - iş kabul edin</div>
              ) : (
                dailyBars.map((d, idx) => {
                  const height = Math.max(6, Math.round((d.count / maxDaily) * 100));
                  const label = d.date?.slice(5) || String(idx + 1);
                  return (
                    <div key={`${d.date}-${idx}`} className='flex-1 flex flex-col items-center'>
                      <div
                        className='w-full rounded-t-lg bg-gradient-to-t from-slate-800 to-blue-900'
                        style={{ height: `${height}%` }}
                        title={`${d.date}: ${d.count}`}
                      />
                      <div className='mt-2 text-[11px] text-slate-500'>{label}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center'>
                <Route className='w-5 h-5 text-slate-800' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-slate-900'>En Çok Rotalar</h2>
                <p className='text-sm text-slate-600'>Dönem bazlı</p>
              </div>
            </div>

            <div className='space-y-3'>
              {(dashboard?.topRoutes || []).length === 0 ? (
                <div className='text-sm text-slate-500'>Henüz veri yok - iş kabul edin</div>
              ) : (
                (dashboard?.topRoutes || []).map((r, idx) => (
                  <div key={`${r.fromCity}-${r.toCity}-${idx}`} className='flex items-center justify-between'>
                    <div className='text-sm text-slate-800 font-medium truncate pr-3'>
                      {r.fromCity || '-'} → {r.toCity || '-'}
                    </div>
                    <div className='text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg'>
                      {r.count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-6'>
            <h2 className='text-lg font-bold text-slate-900 mb-4'>Aylık Trend</h2>
            {(shipments?.monthlyTrend || []).length === 0 ? (
              <div className='text-sm text-slate-500'>Veri bulunamadı</div>
            ) : (
              <div className='space-y-3'>
                {(shipments?.monthlyTrend || []).slice(-8).map((m, idx) => (
                  <div key={`${m.month}-${idx}`} className='flex items-center justify-between'>
                    <div className='text-sm text-slate-700'>{m.month}</div>
                    <div className='flex items-center gap-3'>
                      <div className='text-xs text-slate-600'>{m.shipments} iş</div>
                      <div className='text-xs font-semibold text-slate-800'>{formatCurrency(m.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-6'>
            <h2 className='text-lg font-bold text-slate-900 mb-4'>Teklif Performansı</h2>
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div className='p-4 rounded-xl border border-slate-200 bg-slate-50'>
                <div className='text-xs text-slate-600 mb-1'>Toplam Teklif</div>
                <div className='text-xl font-bold text-slate-900'>{performance?.totalOffers || 0}</div>
              </div>
              <div className='p-4 rounded-xl border border-slate-200 bg-slate-50'>
                <div className='text-xs text-slate-600 mb-1'>Kabul</div>
                <div className='text-xl font-bold text-slate-900'>{performance?.acceptedOffers || 0}</div>
              </div>
            </div>

            <div className='flex items-center justify-between mb-3'>
              <div className='text-sm text-slate-700'>Kabul Oranı</div>
              <div className='text-sm font-semibold text-slate-900'>%{performance?.successRate ?? 0}</div>
            </div>
            <div className='w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4'>
              <div
                className='h-full bg-gradient-to-r from-slate-800 to-blue-900'
                style={{ width: `${Math.min(100, Math.max(0, performance?.successRate || 0))}%` }}
              />
            </div>

            <div className='text-xs text-slate-500'>Ortalama Teklif: {formatCurrency(performance?.averageOffer || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NakliyeciAnalytics;











