import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  MessageSquare,
  Truck,
  FileText,
  Users,
  Gift,
  BookOpen,
  LifeBuoy,
  PieChart,
  TrendingUp,
  Menu,
  DollarSign,
  X,
  CheckCircle,
} from 'lucide-react';
import YolNextLogo from '../shared-ui-elements/yolnextLogo';
import { useNotificationBadgeCounts } from '../../hooks/useNotificationBadgeCounts';
import { useAuth } from '../../contexts/AuthContext';

interface CorporateSidebarProps {
  onLogout: () => void;
}

const CorporateSidebar: React.FC<CorporateSidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024); // Default desktop
  const { badgeCounts } = useNotificationBadgeCounts();
  const { user } = useAuth();

  // Dinamik window size takibi
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      // Eğer pencere genişlerse menüyü otomatik kapat
      if (width > 300) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // İlk değer

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dinamik breakpoint kontrolü - tamamen tarayıcı boyutuna göre
  // Sabit breakpoint yok, her zaman dinamik
  const shouldShowMobileMenu = windowWidth <= 300; // Sadece çok küçük ekranlarda hamburger menü

  // Debug için
  useEffect(() => {
    console.log('Window width:', windowWidth, 'shouldShowMobileMenu:', shouldShowMobileMenu);
  }, [windowWidth, shouldShowMobileMenu]);

  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        { name: 'Ana Sayfa', href: '/corporate/dashboard', icon: Building2 },
        { 
          name: 'Gönderi Oluştur', 
          href: '/corporate/create-shipment',
          icon: Plus,
        },
        { 
          name: 'Gönderilerim', 
          href: '/corporate/shipments', 
          icon: Package,
          badge: badgeCounts.pendingShipments > 0 ? badgeCounts.pendingShipments : undefined,
        },
        { 
          name: 'Teklifler', 
          href: '/corporate/offers', 
          icon: FileText,
          badge: badgeCounts.newOffers > 0 ? badgeCounts.newOffers : undefined,
        },
        { name: 'Nakliyeciler', href: '/corporate/carriers', icon: Truck },
      ],
    },
    {
      title: 'Analiz & Raporlar',
      items: [
        {
          name: 'Analiz & Raporlar',
          href: '/corporate/analytics',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'İletişim',
      items: [
        { 
          name: 'Mesajlar', 
          href: '/corporate/messages', 
          icon: MessageSquare,
          badge: badgeCounts.newMessages > 0 ? badgeCounts.newMessages : undefined,
        },
      ],
    },
    {
      title: 'Hesap & Ayarlar',
      items: [
        { name: 'Ayarlar', href: '/corporate/settings', icon: Settings },
        { name: 'Yardım ve Destek Merkezi', href: '/corporate/help', icon: LifeBuoy },
      ],
    },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile Menu Button - sadece çok küçük ekranlarda */}
      {shouldShowMobileMenu && (
        <div className='fixed top-4 left-4 z-50'>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className='w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors'
        >
          {isMobileMenuOpen ? (
            <X className='w-6 h-6' />
          ) : (
            <Menu className='w-6 h-6' />
          )}
        </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - tamamen dinamik genişlik */}
      <div
        className={`
        fixed top-0 left-0 z-50 h-full 
        bg-gradient-to-b from-slate-50 to-white shadow-xl 
        flex flex-col border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${!shouldShowMobileMenu ? 'translate-x-0' : ''}
      `}
        style={{ 
          width: shouldShowMobileMenu ? '320px' : `${Math.min(256, Math.max(200, windowWidth * 0.25))}px`
        }}
      >
        {/* Logo */}
        <div className='border-b border-slate-200 bg-white overflow-hidden flex items-center justify-between h-20 px-3'>
          <Link
            to='/corporate/dashboard'
            className='block focus:outline-none flex items-center justify-center'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <YolNextLogo size='xl' variant='normal' showText={false} className='text-white' />
          </Link>
        </div>

        {/* User Info */}
        <div className='p-3 lg:p-4 border-b border-slate-200'>
          <div className='flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-2 lg:p-3 transition-colors'>
            <div className='w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white font-bold text-sm lg:text-lg shadow-sm'>
              <Building2 className='w-4 h-4 lg:w-6 lg:h-6' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-xs lg:text-sm font-bold text-slate-900 truncate'>
                {user?.companyName || user?.firstName || user?.fullName?.split(' ')[0] || 'Kullan?c?'}
              </div>
              <div className='text-xs text-slate-500'>Kurumsal Hesap</div>
            </div>
            <div className='w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0'></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-4 lg:space-y-6 overflow-y-auto'>
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className='space-y-2 lg:space-y-3'>
              {/* Section Title */}
              <div className='px-2'>
                <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                  {section.title}
                </h3>
              </div>

              {/* Section Items */}
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
                      className={`h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 ${isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
                    />
                    <span className='flex-1 truncate'>{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                        isActive(item.href)
                          ? 'bg-white text-slate-800'
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {isActive(item.href) && !item.badge && (
                      <div className='w-1.5 h-1.5 bg-white rounded-full flex-shrink-0'></div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className='p-3 lg:p-4 border-t border-slate-200'>
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

export default CorporateSidebar;













