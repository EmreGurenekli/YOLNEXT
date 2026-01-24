import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminBasePath } from '../../config/admin';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <AdminSidebar onLogout={handleLogout} />
      <div className='flex-1 flex flex-col min-w-0'>
        <div className='sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-200'>
          <div className='container-custom py-4'>
            <div className='flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4'>
              <div className='flex-1'>
                <div className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2'>
                  Komut Araması
                </div>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    className='input pl-10'
                    placeholder='email / userId / adminRef / shipmentId'
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const q = (e.currentTarget.value || '').trim();
                        if (!q) return;
                        navigate(`${getAdminBasePath()}/ops?focus=${encodeURIComponent(q)}`);
                      }
                    }}
                  />
                </div>
                <div className='text-xs text-slate-500 mt-2'>Enter: Operasyon Masası’nda odakla</div>
              </div>

              <div className='flex items-center justify-between lg:justify-end gap-3'>
                <div className='text-xs font-semibold text-gray-500 whitespace-nowrap'>07:00–18:00</div>
              </div>
            </div>
          </div>
        </div>

        <main className='flex-1'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;











