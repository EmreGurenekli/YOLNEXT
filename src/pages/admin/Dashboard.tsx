import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Users, Package, Flag } from 'lucide-react';
import { createApiUrl } from '../../config/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({
    usersTotal: 0,
    shipmentsTotal: 0,
    offersTotal: 0,
    messagesTotal: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('authToken');
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
        setOverview({
          usersTotal: Number(row.usersTotal || 0),
          shipmentsTotal: Number(row.shipmentsTotal || 0),
          offersTotal: Number(row.offersTotal || 0),
          messagesTotal: Number(row.messagesTotal || 0),
        });
      } catch (e: any) {
        setError(e?.message || 'Admin overview yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const Card = ({ title, value, icon: Icon }: { title: string; value: string; icon: any }) => (
    <div className='card p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
            {title}
          </div>
          <div className='text-3xl font-bold text-slate-900 mt-2'>{value}</div>
        </div>
        <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center'>
          <Icon className='w-6 h-6 text-slate-800' />
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Dashboard - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Dashboard</h1>
          <p className='text-slate-600'>Sistem genel görünüm (grafik yok, ferah kartlar)</p>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='text-sm text-slate-600'>Yükleniyor...</div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card title='Toplam Kullanıcı' value={String(overview.usersTotal)} icon={Users} />
            <Card title='Toplam Gönderi' value={String(overview.shipmentsTotal)} icon={Package} />
            <Card title='Teklifler' value={String(overview.offersTotal)} icon={BarChart3} />
            <Card title='Mesajlar' value={String(overview.messagesTotal)} icon={Flag} />
          </div>
        )}

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='card p-6'>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Rol Dağılımı
            </div>
            <div className='text-sm text-slate-600 mt-2'>
              individual / corporate / nakliyeci / tasiyici
            </div>
          </div>
          <div className='card p-6'>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Bugün Olanlar
            </div>
            <div className='text-sm text-slate-600 mt-2'>Yeni kayıtlar, yeni şikayetler, yeni flag'ler</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
