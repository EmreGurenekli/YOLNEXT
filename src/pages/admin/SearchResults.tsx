import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { Search } from 'lucide-react';
import { getAdminBasePath } from '../../config/admin';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const SearchResults: React.FC = () => {
  const q = useQuery().get('q') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const res = await fetch(createApiUrl(`/api/admin/search?q=${encodeURIComponent(q)}`), {
          headers: { Authorization: `Bearer ${token || ''}`, 'Content-Type': 'application/json' },
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(payload?.message || `Arama başarısız (HTTP ${res.status})`);
        }
        setUsers(Array.isArray(payload?.data?.users) ? payload.data.users : []);
      } catch (e: any) {
        setError(e?.message || 'Arama başarısız');
      } finally {
        setLoading(false);
      }
    };

    if (q.trim()) load();
    else {
      setLoading(false);
      setUsers([]);
    }
  }, [q]);

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Arama - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Arama</h1>
          <p className='text-slate-600'>E-posta / telefon / kullanıcı ID / admin referansı</p>
        </div>

        <div className='card p-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              className='input pl-10'
              defaultValue={q}
              placeholder='Ara...'
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.currentTarget.value || '').trim();
                  navigate(`${getAdminBasePath()}/search?q=${encodeURIComponent(val)}`);
                }
              }}
            />
          </div>

          {error && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>{error}</div>
          )}

          {loading ? (
            <div className='mt-4 text-sm text-slate-600'>Yükleniyor...</div>
          ) : (
            <div className='mt-4'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kullanıcılar</div>
              {users.length === 0 ? (
                <div className='text-sm text-slate-600 mt-2'>Sonuç yok.</div>
              ) : (
                <div className='mt-3 space-y-2'>
                  {users.map((u, idx) => (
                    <div key={u?.id || idx} className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <div className='text-sm font-semibold text-slate-900'>{u.email || u.id}</div>
                          <div className='text-xs text-slate-600 mt-1'>Rol: {u.role || '-'}</div>
                        </div>
                        <div className='text-xs font-semibold text-slate-600'>ID: {String(u.id)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
