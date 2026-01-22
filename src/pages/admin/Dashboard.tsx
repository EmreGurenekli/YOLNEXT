import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BarChart3,
  Users,
  Package,
  Flag,
  Truck,
  Clock,
  AlertTriangle,
  Coins,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { createApiUrl } from '../../config/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({
    totalUsers: 0,
    approvedCarriers: 0,
    totalShippers: 0,
    pendingCarriers: 0,

    activeListings: 0,
    activeShipments: 0,
    inTransitShipments: 0,
    totalShipments: 0,
    totalOffers: 0,

    todayCommission: 0,

    openFlags: 0,
    openComplaints: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch(createApiUrl('/api/admin/overview'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = payload?.message || `Admin overview yüklenemedi (HTTP ${res.status})`;
          throw new Error(msg);
        }
        const row = payload?.data || payload?.overview || payload || {};
        const stats = row.stats || row;
        setOverview({
          totalUsers: Number(stats.totalUsers || 0),
          approvedCarriers: Number(stats.approvedCarriers || 0),
          totalShippers: Number(stats.totalShippers || 0),
          pendingCarriers: Number(stats.pendingCarriers || 0),

          activeListings: Number(stats.activeListings || 0),
          activeShipments: Number(stats.activeShipments || 0),
          inTransitShipments: Number(stats.inTransitShipments || 0),
          totalShipments: Number(stats.totalShipments || 0),
          totalOffers: Number(stats.totalOffers || 0),

          todayCommission: Number(stats.todayCommission || 0),

          openFlags: Number(stats.openFlags || 0),
          openComplaints: Number(stats.openComplaints || 0),
        });
      } catch (e: any) {
        setError(e?.message || 'Admin overview yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatTL = (v: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v || 0);

  const kpiCards = useMemo(
    () => [
      { title: 'Toplam Kullanıcı', value: overview.totalUsers, icon: Users },
      { title: 'Onaylı Taşıyıcı', value: overview.approvedCarriers, icon: ShieldCheck },
      { title: 'Nakliyeci Sayısı', value: overview.totalShippers, icon: Truck },
      { title: 'Onay Bekleyen Taşıyıcı', value: overview.pendingCarriers, icon: Clock },
    ],
    [overview]
  );

  const opsCards = useMemo(
    () => [
      { title: 'Aktif İlan', value: overview.activeListings, icon: BarChart3 },
      { title: 'Yolda Taşıma', value: overview.inTransitShipments, icon: Activity },
      { title: 'Aktif Taşıma', value: overview.activeShipments, icon: Flag },
      { title: 'Toplam Gönderi', value: overview.totalShipments, icon: Package },
    ],
    [overview]
  );

  const riskCards = useMemo(
    () => [
      { title: 'Çözüm Bekleyen Anlaşmazlık', value: overview.openComplaints, icon: AlertTriangle },
      { title: 'Açık Flag', value: overview.openFlags, icon: Flag },
      { title: 'Teklifler', value: overview.totalOffers, icon: BarChart3 },
      { title: 'Bugün Komisyon', value: formatTL(overview.todayCommission), icon: Coins },
    ],
    [overview]
  );

  const Card = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) => (
    <div className='p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200'>
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-1'>
          <div className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>{title}</div>
          <div className='text-3xl font-bold text-slate-900'>{value}</div>
        </div>
        <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 text-white rounded-xl flex items-center justify-center shadow-inner'>
          <Icon className='w-6 h-6' />
        </div>
      </div>
    </div>
  );

  const StatRow = ({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' }) => (
    <div className='flex items-center justify-between py-2 border-b border-slate-100 last:border-0'>
      <div className='text-sm text-slate-600'>{label}</div>
      <div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
        {value}
        {trend === 'up' && <ArrowUpRight className='w-4 h-4 text-emerald-500' />}
        {trend === 'down' && <ArrowDownRight className='w-4 h-4 text-rose-500' />}
      </div>
    </div>
  );

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-50 via-white to-slate-50'>
      <Helmet>
        <title>Dashboard - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-10 space-y-6'>
        <div className='bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl border border-slate-900 relative overflow-hidden'>
          <div className='absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,#1e3a8a,transparent_38%),radial-gradient(circle_at_bottom_left,#1e40af,transparent_38%)]' />
          <div className='relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
            <div className='space-y-3 max-w-2xl'>
              <div className='inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider border border-white/15'>
                Yönetim Özeti
              </div>
              <h1 className='text-3xl lg:text-4xl font-bold'>YolNext Yönetim Kontrol Merkezi</h1>
              <p className='text-sm lg:text-base text-slate-200'>Gerçek zamanlı görünürlük, güven ve performans için optimize edilmiş kurumsal pano.</p>
            </div>
            <div className='bg-white/10 border border-white/20 rounded-2xl p-4 min-w-[220px] shadow-lg backdrop-blur'>
              <div className='text-xs uppercase tracking-wider text-slate-200 mb-1 font-semibold'>Finansal Nabız</div>
              <div className='text-3xl font-bold'>{formatTL(overview.todayCommission)}</div>
              <div className='text-xs text-slate-200 mt-1'>Bugün tahsil edilen platform komisyonu</div>
            </div>
          </div>
        </div>

        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 shadow-sm'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='text-sm text-slate-600'>Yükleniyor...</div>
        ) : (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
              {kpiCards.map(card => (
                <Card key={card.title} title={card.title} value={card.value} icon={card.icon} />
              ))}
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
              <div className='xl:col-span-2 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <div className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>Operasyon Akışı</div>
                    <div className='text-lg font-bold text-slate-900 mt-1'>Aktif iş yükü ve taşıma görünümü</div>
                  </div>
                  <div className='text-xs text-slate-500'>Gerçek zamanlı snapshot</div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
                  {opsCards.map(card => (
                    <Card key={card.title} title={card.title} value={card.value} icon={card.icon} />
                  ))}
                </div>
              </div>

              <div className='p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3'>
                <div>
                  <div className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>Risk & Alarm</div>
                  <div className='text-lg font-bold text-slate-900 mt-1'>Denetim ve güvenlik</div>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {riskCards.map(card => (
                    <Card key={card.title} title={card.title} value={card.value} icon={card.icon} />
                  ))}
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <div className='p-5 rounded-2xl bg-white border border-slate-100 shadow-sm'>
                <div className='flex items-center justify-between mb-3'>
                  <div>
                    <div className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>Kaynak Sağlığı</div>
                    <div className='text-lg font-bold text-slate-900 mt-1'>Platform kapasite özeti</div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <StatRow label='Taşıyıcılar' value={`${overview.approvedCarriers} aktif`} trend='up' />
                  <StatRow label='Nakliyeciler' value={`${overview.totalShippers} kayıtlı`} />
                  <StatRow label='Onay bekleyen' value={`${overview.pendingCarriers} süreçte`} trend='down' />
                </div>
              </div>

              <div className='p-5 rounded-2xl bg-white border border-slate-100 shadow-sm'>
                <div className='flex items-center justify-between mb-3'>
                  <div>
                    <div className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider'>Vaka & Bayrak</div>
                    <div className='text-lg font-bold text-slate-900 mt-1'>İnceleme gerektiren durumlar</div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <StatRow label='Açık flag' value={`${overview.openFlags}`} trend={overview.openFlags > 0 ? 'up' : undefined} />
                  <StatRow
                    label='Açık anlaşmazlık'
                    value={`${overview.openComplaints}`}
                    trend={overview.openComplaints > 0 ? 'up' : undefined}
                  />
                  <StatRow label='Toplam teklif' value={`${overview.totalOffers}`} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
