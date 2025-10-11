import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Truck,
  Package,
  Users,
  DollarSign,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  User,
  LogOut,
  Menu,
  X,
  Search,
  TrendingUp,
  Award,
  Zap,
  Target,
  Shield,
  Navigation,
  Activity,
  PieChart,
  FileText,
  Calendar,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  RefreshCw,
  Filter,
  Eye,
  Phone,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ExternalLink,
  MoreHorizontal,
  Share2
} from 'lucide-react';

interface NakliyeciSidebarProps {
  onLogout: () => void;
}

const NakliyeciSidebar: React.FC<NakliyeciSidebarProps> = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Ana Sayfa', href: '/nakliyeci/dashboard', icon: Truck },
    { name: 'Yeni Yük Ara', href: '/nakliyeci/jobs', icon: Search },
    { name: 'Tekliflerim', href: '/nakliyeci/offers', icon: MessageSquare },
    { name: 'Aktif Gönderiler', href: '/nakliyeci/shipments', icon: Package },
    { name: 'Şoför Yönetimi', href: '/nakliyeci/drivers', icon: Users },
    { name: 'Kazanç Raporu', href: '/nakliyeci/earnings', icon: DollarSign },
    { name: 'Analitik', href: '/nakliyeci/analytics', icon: BarChart3 },
    { name: 'Mesajlar', href: '/nakliyeci/messages', icon: MessageSquare },
    { name: 'Bildirimler', href: '/nakliyeci/notifications', icon: Bell },
    { name: 'Ayarlar', href: '/nakliyeci/settings', icon: Settings },
    { name: 'Yardım', href: '/nakliyeci/help', icon: HelpCircle },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-200"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-slate-700" />
        ) : (
          <Menu className="w-6 h-6 text-slate-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo and User Info */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">YolNet</h2>
                <p className="text-sm text-slate-600">Nakliyeci Panel</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">Ahmet Yılmaz</p>
                  <p className="text-xs text-slate-600">Hızlı Lojistik A.Ş.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive(item.href) ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-500" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NakliyeciSidebar;