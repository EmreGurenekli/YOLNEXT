import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  DollarSign, 
  User, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  Menu, 
  X,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Bell,
  MapPin
} from 'lucide-react';

interface TasiyiciSidebarProps {
  onLogout: () => void;
}

const TasiyiciSidebar: React.FC<TasiyiciSidebarProps> = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/tasiyici/dashboard', icon: Truck },
    { name: 'İşler', href: '/tasiyici/jobs', icon: Package },
        { name: 'Mevcut İşler', href: '/tasiyici/current-jobs', icon: Clock },
    { name: 'Geçmiş İşler', href: '/tasiyici/job-history', icon: CheckCircle },
    { name: 'Konum Güncelle', href: '/tasiyici/location-update', icon: MapPin },
        { name: 'Kazançlarım', href: '/tasiyici/earnings', icon: DollarSign },
    { name: 'Bildirimler', href: '/tasiyici/notifications', icon: Bell },
        { name: 'Mesajlar', href: '/tasiyici/messages', icon: MessageSquare },
    { name: 'Profil', href: '/tasiyici/profile', icon: User },
    { name: 'Ayarlar', href: '/tasiyici/settings', icon: Settings },
    { name: 'Yardım', href: '/tasiyici/help', icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-slate-600" />
          ) : (
            <Menu className="w-6 h-6 text-slate-600" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">YolNet</h1>
                <p className="text-xs text-slate-500">Taşıyıcı Paneli</p>
              </div>
            </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-full flex items-center justify-center text-white font-bold">
                A
          </div>
              <div>
                <p className="font-medium text-slate-900">Ahmet Yılmaz</p>
                <p className="text-sm text-slate-500">Taşıyıcı Hesap</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Stats */}
          <div className="p-4 border-t border-slate-200">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">Bu Hafta</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">₺3,200</div>
              <div className="text-xs text-slate-500">Kazanç</div>
            </div>
          </div>

          {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
              <X className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>
    </div>
      </div>
    </>
  );
};

export default TasiyiciSidebar;