import React, { useState } from 'react';
import { X, Menu, Home, Package, Truck, User, Settings, Bell, Search } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'individual' | 'corporate' | 'carrier' | 'logistics';
  currentPath: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, userType, currentPath }) => {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Ana Sayfa', icon: Home, href: `/${userType}/dashboard` },
      { id: 'search', label: 'Ara', icon: Search, href: `/${userType}/search` },
      { id: 'notifications', label: 'Bildirimler', icon: Bell, href: `/${userType}/notifications` },
    ];

    switch (userType) {
      case 'individual':
        return [
          ...baseItems,
          { id: 'shipments', label: 'Gönderilerim', icon: Package, href: '/individual/shipments' },
          { id: 'offers', label: 'Teklifler', icon: Package, href: '/individual/offers' },
          { id: 'carriers', label: 'Nakliyeciler', icon: Truck, href: '/individual/carriers' },
          { id: 'profile', label: 'Profil', icon: User, href: '/individual/profile' },
        ];
      case 'corporate':
        return [
          ...baseItems,
          { id: 'shipments', label: 'Gönderilerim', icon: Package, href: '/corporate/shipments' },
          { id: 'offers', label: 'Teklifler', icon: Package, href: '/corporate/offers' },
          { id: 'carriers', label: 'Nakliyeciler', icon: Truck, href: '/corporate/carriers' },
          { id: 'analytics', label: 'Analitik', icon: Package, href: '/corporate/analytics' },
          { id: 'profile', label: 'Profil', icon: User, href: '/corporate/profile' },
        ];
      case 'carrier':
        return [
          ...baseItems,
          { id: 'loads', label: 'Yükler', icon: Package, href: '/nakliyeci/loads' },
          { id: 'offers', label: 'Tekliflerim', icon: Package, href: '/nakliyeci/offers' },
          { id: 'shipments', label: 'Gönderiler', icon: Package, href: '/nakliyeci/shipments' },
          { id: 'fleet', label: 'Filo', icon: Truck, href: '/nakliyeci/fleet' },
          { id: 'earnings', label: 'Kazançlar', icon: Package, href: '/nakliyeci/earnings' },
          { id: 'profile', label: 'Profil', icon: User, href: '/nakliyeci/profile' },
        ];
      case 'logistics':
        return [
          ...baseItems,
          { id: 'jobs', label: 'İşler', icon: Package, href: '/tasiyici/jobs' },
          { id: 'active', label: 'Aktif İşler', icon: Package, href: '/tasiyici/active-jobs' },
          { id: 'completed', label: 'Tamamlanan', icon: Package, href: '/tasiyici/completed-jobs' },
          { id: 'earnings', label: 'Kazançlar', icon: Package, href: '/tasiyici/earnings' },
          { id: 'profile', label: 'Profil', icon: User, href: '/tasiyici/profile' },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const handleItemClick = (href: string) => {
    onClose();
    // Navigate to href
    window.location.href = href;
  };

  const toggleSubmenu = (itemId: string) => {
    setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menü</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-4">
            {menuItems.map((item) => {
              const isActive = currentPath === item.href;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="px-4 mt-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Hızlı İşlemler
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Package className="w-4 h-4" />
                <span className="text-sm">Yeni Gönderi</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-4 h-4" />
                <span className="text-sm">Hızlı Arama</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Bildirimler</span>
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Kullanıcı Adı</p>
                <p className="text-xs text-gray-500">
                  {userType === 'individual' ? 'Bireysel' :
                   userType === 'corporate' ? 'Kurumsal' :
                   userType === 'carrier' ? 'Nakliyeci' : 'Taşıyıcı'}
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="px-4 mt-4">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Ayarlar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;

