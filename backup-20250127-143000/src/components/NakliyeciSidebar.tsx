import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  BarChart3, 
  Users, 
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
  Shield,
  Star
} from 'lucide-react';

interface NakliyeciSidebarProps {
  onLogout: () => void;
}

const NakliyeciSidebar: React.FC<NakliyeciSidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        { name: 'Ana Sayfa', href: '/nakliyeci/dashboard', icon: Truck },
        { name: 'Mevcut İşler', href: '/nakliyeci/loads', icon: Package },
        { name: 'Tekliflerim', href: '/nakliyeci/offers', icon: DollarSign },
        { name: 'Gönderilerim', href: '/nakliyeci/shipments', icon: MapPin },
      ]
    },
    {
      title: 'Araç & Filo',
      items: [
        { name: 'Filo Yönetimi', href: '/nakliyeci/fleet-management', icon: Truck },
        { name: 'Araç Optimizasyonu', href: '/nakliyeci/vehicle-optimization', icon: Route },
        { name: 'Yakıt Takibi', href: '/nakliyeci/fuel-tracking', icon: Fuel },
        { name: 'Bakım Takvimi', href: '/nakliyeci/maintenance', icon: Calendar },
      ]
    },
    {
      title: 'Analiz & Raporlar',
      items: [
        { name: 'Analitikler', href: '/nakliyeci/analytics', icon: BarChart3 },
        { name: 'Performans', href: '/nakliyeci/performance', icon: TrendingUp },
        { name: 'Raporlar', href: '/nakliyeci/reports', icon: FileText },
        { name: 'Kazanç Analizi', href: '/nakliyeci/earnings', icon: PieChart },
      ]
    },
    {
      title: 'Ekip & Müşteriler',
      items: [
        { name: 'Şoför Yönetimi', href: '/nakliyeci/drivers', icon: Users },
        { name: 'Müşteri Yönetimi', href: '/nakliyeci/customers', icon: Star },
        { name: 'Anlaşmalar', href: '/nakliyeci/agreements', icon: Shield },
        { name: 'Değerlendirmeler', href: '/nakliyeci/reviews', icon: Award },
      ]
    },
    {
      title: 'İletişim & Destek',
      items: [
        { name: 'Mesajlar', href: '/nakliyeci/messages', icon: MessageSquare },
        { name: 'Bildirimler', href: '/nakliyeci/notifications', icon: Bell },
        { name: 'Yardım & Rehber', href: '/nakliyeci/help', icon: HelpCircle },
      ]
    },
    {
      title: 'Hesap & Ayarlar',
      items: [
        { name: 'Profil & Ayarlar', href: '/nakliyeci/settings', icon: Settings },
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
        <Link to="/nakliyeci/dashboard" className="block focus:outline-none">
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
            <Truck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">Hızlı Nakliyat A.Ş.</div>
            <div className="text-xs text-slate-500">Nakliyeci Hesap</div>
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

export default NakliyeciSidebar;