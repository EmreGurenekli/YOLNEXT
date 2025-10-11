import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Bell, 
  HelpCircle, 
  MessageSquare,
  MapPin,
  DollarSign,
  Route,
  Fuel,
  Award,
  Calendar,
  FileText,
  PieChart,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';

interface TasiyiciSidebarProps {
  onLogout: () => void;
}

const TasiyiciSidebar: React.FC<TasiyiciSidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        { name: 'Ana Sayfa', href: '/tasiyici/dashboard', icon: User },
        { name: 'Mevcut İşler', href: '/tasiyici/jobs', icon: Package },
        { name: 'Aktif İşler', href: '/tasiyici/active-jobs', icon: Clock },
        { name: 'Tamamlanan İşler', href: '/tasiyici/completed-jobs', icon: CheckCircle },
      ]
    },
    {
      title: 'Kazanç & Finans',
      items: [
        { name: 'Kazançlarım', href: '/tasiyici/earnings', icon: DollarSign },
        { name: 'Ödemeler', href: '/tasiyici/payments', icon: FileText },
        { name: 'Vergi Raporları', href: '/tasiyici/tax-reports', icon: PieChart },
        { name: 'Hedefler', href: '/tasiyici/goals', icon: Award },
      ]
    },
    {
      title: 'Araç & Rota',
      items: [
        { name: 'Araç Bilgileri', href: '/tasiyici/vehicle', icon: Truck },
        { name: 'Rota Optimizasyonu', href: '/tasiyici/route-optimization', icon: Route },
        { name: 'Yakıt Takibi', href: '/tasiyici/fuel-tracking', icon: Fuel },
        { name: 'Bakım Takvimi', href: '/tasiyici/maintenance', icon: Calendar },
      ]
    },
    {
      title: 'Performans & Analiz',
      items: [
        { name: 'Performansım', href: '/tasiyici/performance', icon: BarChart3 },
        { name: 'İstatistikler', href: '/tasiyici/statistics', icon: TrendingUp },
        { name: 'Değerlendirmeler', href: '/tasiyici/reviews', icon: Star },
        { name: 'Başarılarım', href: '/tasiyici/achievements', icon: Award },
      ]
    },
    {
      title: 'İletişim & Destek',
      items: [
        { name: 'Mesajlar', href: '/tasiyici/messages', icon: MessageSquare },
        { name: 'Bildirimler', href: '/tasiyici/notifications', icon: Bell },
        { name: 'Yardım & Rehber', href: '/tasiyici/help', icon: HelpCircle },
      ]
    },
    {
      title: 'Hesap & Ayarlar',
      items: [
        { name: 'Profil & Ayarlar', href: '/tasiyici/settings', icon: Settings },
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
        <Link to="/tasiyici/dashboard" className="block focus:outline-none">
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
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">Ahmet Yılmaz</div>
            <div className="text-xs text-slate-500">Bireysel Taşıyıcı</div>
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

export default TasiyiciSidebar;