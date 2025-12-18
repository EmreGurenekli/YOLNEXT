import React, { useState } from 'react';
import { Menu, X, Home, Package, Truck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MobileNavigationProps {
  userType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  onLogout: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  userType,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: `/${userType}/dashboard`, icon: Home },
    ];

    switch (userType) {
      case 'individual':
        return [
          ...baseItems,
          {
            name: 'Gönderi Oluştur',
            href: '/individual/create-shipment',
            icon: Package,
          },
          {
            name: 'Gönderilerim',
            href: '/individual/my-shipments',
            icon: Package,
          },
          { name: 'Teklifler', href: '/individual/offers', icon: Package },
        ];
      case 'corporate':
        return [
          ...baseItems,
          {
            name: 'Gönderi Oluştur',
            href: '/corporate/create-shipment',
            icon: Package,
          },
          { name: 'Gönderilerim', href: '/corporate/shipments', icon: Package },
          { name: 'Teklifler', href: '/corporate/offers', icon: Package },
        ];
      case 'nakliyeci':
        return [
          ...baseItems,
          {
            name: 'Yük Pazarı',
            href: '/nakliyeci/jobs',
            icon: Package,
          },
          { name: 'Tekliflerim', href: '/nakliyeci/offers', icon: Package },
          {
            name: 'Taşıyıcılarım',
            href: '/nakliyeci/drivers',
            icon: Truck,
          },
        ];
      case 'tasiyici':
        return [
          ...baseItems,
          {
            name: 'İş Pazarı',
            href: '/tasiyici/market',
            icon: Truck,
          },
          { name: 'Tekliflerim', href: '/tasiyici/my-offers', icon: Package },
          { name: 'Aktif İşler', href: '/tasiyici/active-jobs', icon: Package },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        aria-label='Toggle menu'
      >
        {isOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className='md:hidden fixed inset-0 z-50'>
          <div
            className='fixed inset-0 bg-black bg-opacity-50'
            onClick={() => setIsOpen(false)}
          />
          <div className='fixed top-0 right-0 h-full w-64 bg-white shadow-xl'>
            <div className='flex items-center justify-between p-4 border-b'>
              <h2 className='text-lg font-semibold text-gray-900'>Menü</h2>
              <button
                onClick={() => setIsOpen(false)}
                className='p-2 rounded-md text-gray-600 hover:text-gray-900'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <nav className='mt-4'>
              {navigationItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className='w-5 h-5 mr-3' />
                    {item.name}
                  </Link>
                );
              })}

              <div className='border-t mt-4 pt-4'>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className='flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors'
                >
                  <X className='w-5 h-5 mr-3' />
                  Çıkış Yap
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
