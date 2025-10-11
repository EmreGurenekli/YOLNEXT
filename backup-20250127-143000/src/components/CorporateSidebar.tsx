import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Package, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Bell, 
  HelpCircle, 
  MessageSquare,
  Truck,
  FileText,
  PieChart,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Shield,
  Award
} from 'lucide-react';

interface CorporateSidebarProps {
  onLogout: () => void;
}

const CorporateSidebar: React.FC<CorporateSidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        { name: 'Ana Sayfa', href: '/corporate/dashboard', icon: Building2 },
        { name: 'Gönderi Oluştur', href: '/corporate/create-shipment', icon: Plus },
        { name: 'Gönderilerim', href: '/corporate/shipments', icon: Package },
        { name: 'Nakliyeciler', href: '/corporate/carriers', icon: Truck },
      ]
    },
    {
      title: 'Analiz & Raporlar',
      items: [
        { name: 'Analitikler', href: '/corporate/analytics', icon: BarChart3 },
        { name: 'Raporlar', href: '/corporate/reports', icon: FileText },
        { name: 'Departman Raporları', href: '/corporate/department-reporting', icon: PieChart },
        { name: 'Performans', href: '/corporate/performance', icon: TrendingUp },
      ]
    },
    {
      title: 'Yönetim',
      items: [
        { name: 'Ekip Yönetimi', href: '/corporate/team', icon: Users },
        { name: 'İndirimler', href: '/corporate/discounts', icon: DollarSign },
        { name: 'Anlaşmalar', href: '/corporate/agreements', icon: Shield },
        { name: 'Takvim', href: '/corporate/calendar', icon: Calendar },
      ]
    },
    {
      title: 'İletişim & Destek',
      items: [
        { name: 'Mesajlar', href: '/corporate/messages', icon: MessageSquare },
        { name: 'Bildirimler', href: '/corporate/notifications', icon: Bell },
        { name: 'Yardım & Rehber', href: '/corporate/help', icon: HelpCircle },
        { name: 'Kurumsal Rehber', href: '/corporate/guide', icon: Award },
      ]
    },
    {
      title: 'Hesap & Ayarlar',
      items: [
        { name: 'Profil & Ayarlar', href: '/corporate/settings', icon: Settings },
      ]
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-50 to-white shadow-xl h-full flex flex-col border-r border-slate-200">
      {/* Logo */}
      <div className="border-b border-slate-200 bg-white overflow-hidden">
        <Link to="/corporate/dashboard" className="block focus:outline-none">
          <img 
            src="/logo.svg" 
            alt="YolNet Logo" 
            className="w-full h-24 object-contain cursor-pointer"
          />
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-3 transition-colors">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">ABC Teknoloji A.Ş.</div>
            <div className="text-xs text-slate-500">Kurumsal Hesap</div>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
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
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-700 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
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
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
        >
          <LogOut className="h-5 w-5 mr-3 text-slate-400 group-hover:text-red-600" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
};

export default CorporateSidebar;