import { Link, useLocation } from 'react-router-dom';
import { Home, Package, DollarSign, MessageSquare, User, Settings, LogOut, Plus, Bell, HelpCircle, Navigation } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        { name: 'Ana Sayfa', href: '/individual/dashboard', icon: Home },
        { name: 'Gönderi Oluştur', href: '/individual/create-shipment', icon: Plus },
        { name: 'Gönderilerim', href: '/individual/my-shipments', icon: Package },
        { name: 'Tekliflerim', href: '/individual/offers', icon: DollarSign },
      ]
    },
    {
      title: 'Takip & İletişim',
      items: [
        { name: 'Canlı Takip', href: '/individual/live-tracking', icon: Navigation },
        { name: 'Mesajlar', href: '/individual/messages', icon: MessageSquare },
        { name: 'Bildirimler', href: '/individual/notifications', icon: Bell },
      ]
    },
    {
      title: 'Hesap & Destek',
      items: [
        { name: 'Profil & Ayarlar', href: '/individual/profile', icon: User },
        { name: 'Yardım & Rehber', href: '/individual/help', icon: HelpCircle },
      ]
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="w-56 bg-gradient-to-b from-slate-50 to-white shadow-xl h-full flex flex-col border-r border-slate-200">
      {/* Logo */}
      <div className="border-b border-slate-200 bg-white overflow-hidden">
        <Link to="/individual/dashboard" className="block focus:outline-none">
          <img 
            src="/logo.svg" 
            alt="YolNet Logo" 
            className="w-full h-24 object-contain cursor-pointer"
          />
        </Link>
      </div>

      {/* User Info */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-2 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            D
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900">Demo Bireysel</div>
            <div className="text-xs text-slate-500">Bireysel Hesap</div>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-3">
                  {/* Section Title */}
                  <div className="px-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
            
            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`h-4 w-4 mr-3 ${isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="flex-1">{item.name}</span>
                  {isActive(item.href) && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onLogout || (() => {})}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;