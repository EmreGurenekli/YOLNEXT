import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  Shield,
  FileText,
  Activity,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import YolNextLogo from '../shared-ui-elements/yolnextLogo';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminBasePath } from '../../config/admin';

interface AdminSidebarProps {
  onLogout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const base = getAdminBasePath();

  const menuSections = [
    {
      title: 'Merkez',
      items: [
        { name: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard },
        { name: 'Operasyon Masası', href: `${base}/ops`, icon: Shield },
      ],
    },
    {
      title: 'Yönetim',
      items: [
        { name: 'Kullanıcılar', href: `${base}/users`, icon: Users },
        { name: 'Vakalar', href: `${base}/cases`, icon: FileText },
        { name: 'Sistem', href: `${base}/system`, icon: Activity },
      ],
    },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <div className='lg:hidden fixed top-4 left-4 z-50'>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className='w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors'
          aria-label={isMobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:static top-0 left-0 z-50 h-full w-80 lg:w-64
          bg-gradient-to-b from-slate-50 to-white shadow-xl
          flex flex-col border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className='border-b border-gray-200 bg-white overflow-hidden flex items-center justify-center h-24 px-2'>
          <Link
            to={`${base}/ops`}
            className='block focus:outline-none flex items-center justify-center'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <YolNextLogo size='xl' variant='normal' showText={false} className='text-white' />
          </Link>
        </div>

        <div className='p-3 lg:p-4 border-b border-gray-200'>
          <div className='flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 lg:p-3 transition-colors'>
            <div className='w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white shadow-sm'>
              <Shield className='w-4 h-4 lg:w-6 lg:h-6' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-xs lg:text-sm font-bold text-slate-900 truncate'>
                {user?.fullName || user?.email || 'Admin'}
              </div>
              <div className='text-xs text-slate-500'>Yönetici</div>
            </div>
          </div>
        </div>

        <nav className='flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-4 lg:space-y-6 overflow-y-auto custom-scrollbar'>
          {menuSections.map(section => (
            <div key={section.title} className='space-y-2 lg:space-y-3'>
              <div className='px-2'>
                <h3 className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>
                  {section.title}
                </h3>
              </div>
              <div className='space-y-1'>
                {section.items.map(item => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-2 lg:px-3 py-2 lg:py-3 text-xs lg:text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 ${
                        isActive(item.href)
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className='flex-1 truncate'>{item.name}</span>
                    {isActive(item.href) && (
                      <div className='w-1.5 h-1.5 bg-white rounded-full flex-shrink-0'></div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className='p-3 lg:p-4 border-t border-gray-200'>
          <button
            onClick={onLogout}
            className='flex items-center w-full px-2 lg:px-3 py-2 lg:py-3 text-xs lg:text-sm font-medium rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors group'
          >
            <LogOut className='h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 text-slate-400 group-hover:text-red-600' />
            <span className='truncate'>Çıkış Yap</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;











