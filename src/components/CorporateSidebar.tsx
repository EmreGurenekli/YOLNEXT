import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  HelpCircle, 
  MessageSquare,
  Truck,
  FileText,
  Users,
  Bell,
  Gift,
  BookOpen,
  PieChart,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import GlobalSearch from './common/GlobalSearch';

interface CorporateSidebarProps {
  onLogout: () => void;
}

const CorporateSidebar: React.FC<CorporateSidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        { name: 'Ana Sayfa', href: '/corporate/dashboard', icon: Building2 },
        { name: 'Gönderi Oluştur', href: '/corporate/create-shipment', icon: Plus },
        { name: 'Gönderilerim', href: '/corporate/shipments', icon: Package },
        { name: 'Teklifler', href: '/corporate/offers', icon: FileText },
        { name: 'Nakliyeciler', href: '/corporate/carriers', icon: Truck },
      ]
    },
    {
      title: 'Analiz & Raporlar',
      items: [
        { name: 'Analiz & Raporlar', href: '/corporate/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Destek',
      items: [
        { name: 'Mesajlar', href: '/corporate/messages', icon: MessageSquare },
        { name: 'Yardım', href: '/corporate/help', icon: HelpCircle },
      ]
    },
    {
      title: 'Hesap',
      items: [
        { name: 'Ayarlar', href: '/corporate/settings', icon: Settings },
      ]
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static top-0 left-0 z-50 h-full w-80 lg:w-64 
        bg-gradient-to-b from-slate-50 to-white shadow-xl 
        flex flex-col border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="border-b border-slate-200 bg-white overflow-hidden">
          <Link 
            to="/corporate/dashboard" 
            className="block focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img 
              src="/logo.svg" 
              alt="YolNet Logo" 
              className="w-full h-16 lg:h-24 object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* User Info */}
        <div className="p-3 lg:p-4 border-b border-slate-200">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-2 lg:p-3 transition-colors">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white font-bold text-sm lg:text-lg shadow-sm">
              <Building2 className="w-4 h-4 lg:w-6 lg:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs lg:text-sm font-bold text-slate-900 truncate">ABC Teknoloji A.Ş.</div>
              <div className="text-xs text-slate-500">Kurumsal Hesap</div>
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
          </div>
        </div>

        {/* Global Search */}
        <div className="p-3 lg:p-4 border-b border-slate-200">
          <GlobalSearch placeholder="Ara..." />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-4 lg:space-y-6 overflow-y-auto">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-2 lg:space-y-3">
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
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-2 lg:px-3 py-2 lg:py-3 text-xs lg:text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 ${isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-3 lg:p-4 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-2 lg:px-3 py-2 lg:py-3 text-xs lg:text-sm font-medium rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
          >
            <LogOut className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 text-slate-400 group-hover:text-red-600" />
            <span className="truncate">Çıkış Yap</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default CorporateSidebar;