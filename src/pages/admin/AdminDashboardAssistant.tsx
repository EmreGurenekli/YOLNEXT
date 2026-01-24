import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Clock, ArrowRight } from 'lucide-react';
import { createApiUrl } from '../../config/api';

const Assistant: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [briefing, setBriefing] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [critical, setCritical] = useState<any[]>([]);
  const [banRecommendations, setBanRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch(createApiUrl('/api/admin/planner/briefing'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = payload?.message || `Briefing yüklenemedi (HTTP ${res.status})`;
          throw new Error(msg);
        }
        const data = payload?.data || payload || {};
        setBriefing(data.briefing || null);
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setCritical(Array.isArray(data.critical) ? data.critical : []);
        setBanRecommendations(Array.isArray(data.banRecommendations) ? data.banRecommendations : []);
      } catch (e: any) {
        setError(e?.message || 'Briefing yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Asistan - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
              <Shield className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-slate-900'>Asistan</h1>
              <div className='text-sm text-slate-600'>07:00–18:00 çalışma planı</div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <div className='card p-6'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                    Sabah Briefing
                  </div>
                  <div className='text-lg font-bold text-slate-900 mt-1'>Bugün neler oldu?</div>
                  <div className='text-sm text-slate-600 mt-1'>
                    {loading
                      ? 'Yükleniyor...'
                      : error
                        ? 'Briefing yüklenemedi'
                        : briefing?.note || 'Hazır'}
                  </div>
                </div>
                <div className='flex items-center gap-2 text-xs font-semibold text-slate-600'>
                  <Clock className='w-4 h-4' />
                  07:00
                </div>
              </div>

              {error && (
                <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className='mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                    <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kullanıcı</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1'>
                      {briefing?.totals?.usersTotal ?? '-'}
                    </div>
                    <div className='text-xs text-slate-600 mt-1'>
                      24s: +{briefing?.last24h?.users ?? 0}
                    </div>
                  </div>
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                    <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Gönderi</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1'>
                      {briefing?.totals?.shipmentsTotal ?? '-'}
                    </div>
                    <div className='text-xs text-slate-600 mt-1'>
                      24s: +{briefing?.last24h?.shipments ?? 0}
                    </div>
                  </div>
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                    <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Teklif</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1'>
                      {briefing?.totals?.offersTotal ?? '-'}
                    </div>
                    <div className='text-xs text-slate-600 mt-1'>Toplam</div>
                  </div>
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                    <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Açık Şikayet</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1'>
                      {briefing?.openComplaints ?? 0}
                    </div>
                    <div className='text-xs text-slate-600 mt-1'>beklemede/inceleniyor</div>
                  </div>
                </div>
              )}
            </div>

            <div className='card p-6'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                Bugün Yapılacaklar
              </div>
              <div className='mt-3 space-y-3'>
                {!loading && tasks.length === 0 ? (
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-semibold text-slate-900'>Bugün görev yok</div>
                      <div className='text-xs text-slate-600 mt-1'>Otomatik görevler burada görünecek</div>
                    </div>
                    <ArrowRight className='w-4 h-4 text-slate-400' />
                  </div>
                ) : (
                  tasks.slice(0, 5).map((t, idx) => (
                    <div key={t?.id || idx} className='p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between'>
                      <div>
                        <div className='text-sm font-semibold text-slate-900'>
                          {t?.title || 'Görev'}
                        </div>
                        <div className='text-xs text-slate-600 mt-1'>
                          {t?.priority ? `Öncelik: ${t.priority}` : 'Öncelik: -'}
                        </div>
                      </div>
                      <ArrowRight className='w-4 h-4 text-slate-400' />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='card p-6'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                Kritikler
              </div>
              <div className='text-sm text-slate-600 mt-2'>
                {!loading && critical.length === 0 ? 'Kritik yok' : `Kritik: ${critical.length}`}
              </div>
            </div>

            <div className='card p-6'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Rol Dağılımı</div>
              <div className='mt-3 space-y-2'>
                {!loading && !error && briefing?.roleDistribution ? (
                  Object.entries(briefing.roleDistribution).map(([k, v]) => (
                    <div key={k} className='flex items-center justify-between text-sm'>
                      <div className='text-slate-700'>{k}</div>
                      <div className='font-semibold text-slate-900'>{String(v)}</div>
                    </div>
                  ))
                ) : (
                  <div className='text-sm text-slate-600'>Yükleniyor...</div>
                )}
              </div>
            </div>

            <div className='card p-6'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                Ban Önerileri
              </div>
              <div className='text-sm text-slate-600 mt-2'>
                Auto-ban yok. Öneri sayısı: {loading ? '-' : banRecommendations.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;











