import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Settings,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  X,
  User,
  Truck,
  MapPin,
  Phone,
  Mail,
  Lock,
  Key,
  Smartphone,
  Globe,
  Moon,
  Sun,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Copy,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  FileText,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import Modal from '../../components/shared-ui-elements/Modal';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import { useAuth } from '../../contexts/AuthContext';
import { createApiUrl } from '../../config/api';
import { authAPI as authService } from '../../services/apiClient';
import { TOAST_MESSAGES, showProfessionalToast } from '../../utils/toastMessages';

// Temporary workaround
const kvkkAPI = {
  requestDataAccess: async () => {
    const response = await fetch(createApiUrl('/api/kvkk/data-access'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    return response.json();
  },
  deleteData: async () => {
    const response = await fetch(createApiUrl('/api/kvkk/delete-data'), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    return response.json();
  }
};
const authAPI = {
  deleteAccount: async (data: any) => {
    const response = await fetch(createApiUrl('/api/users/account'), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

interface SettingsData {
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    taxNumber: string;
    website: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    jobAlerts: boolean;
    messageAlerts: boolean;
    paymentAlerts: boolean;
    systemAlerts: boolean;
  };
  privacy: {
    showProfile: boolean;
    showLocation: boolean;
    showEarnings: boolean;
    allowMessages: boolean;
    showCompanyInfo: boolean;
  };
  security: {
    twoFactor: boolean;
    biometric: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    currency: string;
  };
  business: {
    commissionRate: number;
    autoAcceptJobs: boolean;
    maxDistance: number;
    workingHours: {
      start: string;
      end: string;
      days: string[];
    };
  };
}

interface NakliyeciStats {
  favoriteCount: number;
  badge: string;
  message: string;
}

export default function NakliyeciSettings() {
  const { showToast } = useToast();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [stats, setStats] = useState<NakliyeciStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [settings, setSettings] = useState<SettingsData>({
    company: {
      name: 'Hızlı Lojistik A.Ş.',
      email: 'info@hizlilojistik.com',
      phone: '+90 212 555 0123',
      address: 'İstanbul, Türkiye',
      taxNumber: '1234567890',
      website: 'www.hizlilojistik.com',
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      jobAlerts: true,
      messageAlerts: true,
      paymentAlerts: false,
      systemAlerts: true,
    },
    privacy: {
      showProfile: true,
      showLocation: false,
      showEarnings: false,
      allowMessages: true,
      showCompanyInfo: true,
    },
    security: {
      twoFactor: false,
      biometric: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
    preferences: {
      theme: 'light',
      language: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
    },
    business: {
      commissionRate: 1.0,
      autoAcceptJobs: false,
      maxDistance: 100,
      workingHours: {
        start: '08:00',
        end: '18:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      },
    },
  });

  const breadcrumbItems = [
    {
      label: 'Ana Sayfa',
      icon: <BarChart3 className='w-4 h-4' />,
      href: '/nakliyeci/dashboard',
    },
    { label: 'Ayarlar', icon: <Settings className='w-4 h-4' /> },
  ];

  const tabs = [
    { id: 'company', name: 'Şirket Bilgileri', icon: Building2 },
    { id: 'vehicles', name: 'Araçlar & Ekipmanlar', icon: Truck },
    { id: 'account', name: 'Hesap', icon: Shield },
  ];

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSuccessMessage('Ayarlar başarıyla kaydedildi');
      setShowSuccessMessage(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (
    section: keyof SettingsData,
    field: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleToggle = (section: keyof SettingsData, field: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !(prev[section] as any)[field],
      },
    }));
  };

  // Load nakliyeci stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user || user.role !== 'nakliyeci') {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(createApiUrl('/api/carriers/nakliyeci/stats'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user]);

  // Ensure we have nakliyeciCode on the user object - fetch profile if missing
  useEffect(() => {
    const ensureNakliyeciCode = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        if (!user || !user.nakliyeciCode) {
          const res = await fetch(createApiUrl('/api/users/profile'), {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          });

          if (res.ok) {
            const resp = await res.json();
            const profile = resp.data?.user || resp.user || resp.data || resp;
            const code = profile?.nakliyeciCode || profile?.nakliyecicode;
            if (code) {
              updateUser({ nakliyeciCode: code });
            }
          }
        }
      } catch (err) {
        // silent
      }
    };

    ensureNakliyeciCode();
  }, [user, updateUser]);

  // Social media share functions
  const shareToSocial = (platform: string) => {
    if (!user?.nakliyeciCode) return;

    const shareText = `YolNext platformunda nakliyeciyim! Kodum: ${user.nakliyeciCode} - Beni favorilerinize ekleyin ve birlikte çalışalım!`;
    const shareUrl = window.location.origin;
    
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyShareLink = () => {
    if (!user?.nakliyeciCode) return;
    
    const shareText = `YolNext platformunda nakliyeciyim! Kodum: ${user.nakliyeciCode} - Beni favorilerinize ekleyin ve birlikte çalışalım!`;
    const shareUrl = window.location.origin;
    const fullText = `${shareText}\n\n${shareUrl}`;
    
    navigator.clipboard.writeText(fullText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-50'>
        <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
          <LoadingState message='Ayarlar kaydediliyor...' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-50'>
      <Helmet>
        <title>Ayarlar - Nakliyeci Panel - YolNext</title>
        <meta name='description' content='Nakliyeci ayar yönetimi' />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
          <div className='flex items-center gap-3 mb-4 sm:mb-0'>
            <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg'>
              <Settings className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </div>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-slate-900'>
                Ayarlar
              </h1>
              <p className='text-sm text-slate-600'>
                Şirket ve uygulama ayarlarınızı yönetin
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button
              onClick={handleSave}
              className='flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium'
            >
              <Save className='w-4 h-4 sm:w-5 sm:h-5' />
              <span className='hidden sm:inline'>Kaydet</span>
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Settings Navigation */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200'>
              <nav className='p-4'>
                <ul className='space-y-2'>
                  {tabs.map(tab => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <tab.icon className='w-4 h-4' />
                        <span className='text-sm font-medium'>{tab.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className='lg:col-span-3'>
            <div className='bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200'>
              <div className='p-4 sm:p-6'>
                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Hesap
                    </h3>

                    <div className='bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm'>
                      <div className='flex items-center gap-2 mb-3'>
                        <FileText className='w-5 h-5 text-slate-900' />
                        <h4 className='text-sm font-semibold text-slate-900'>Yasal Belgeler</h4>
                      </div>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
                        <Link to='/terms' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Kullanım Koşulları
                        </Link>
                        <Link to='/privacy' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Gizlilik Politikası
                        </Link>
                        <Link to='/cookie-policy' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Çerez Politikası
                        </Link>
                        <button
                          type='button'
                          onClick={() => window.dispatchEvent(new Event('yolnext:cookie-preferences'))}
                          className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900 text-left'
                        >
                          Çerez Tercihleri
                        </button>
                        <Link to='/kvkk-aydinlatma' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          KVKK Aydınlatma Metni
                        </Link>
                        <Link to='/consumer-rights' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Tüketici Hakları
                        </Link>
                        <Link to='/distance-selling-contract' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Mesafeli Satış Sözleşmesi
                        </Link>
                      </div>
                    </div>

                    <div className='bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm'>
                      <div className='flex items-start gap-3'>
                        <AlertCircle className='w-5 h-5 text-amber-600 mt-0.5' />
                        <div className='space-y-1 text-sm text-slate-700'>
                          <p className='font-semibold text-slate-900'>Komisyon Bilgisi</p>
                          <p>
                            Teklif verirken komisyon blokesi, teklif kabul edildiğinde komisyon kesintisi için detaylara bakabilirsiniz.
                          </p>
                          <button
                            type='button'
                            onClick={() => (window.location.href = '/nakliyeci/offers')}
                            className='inline-flex items-center gap-1 text-blue-700 font-semibold underline hover:text-blue-800'
                          >
                            Detayları görüntüle
                            <ArrowRight className='w-3 h-3' />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm'>
                        <h4 className='text-sm font-semibold text-slate-900 mb-3'>
                          Güvenlik Ayarları
                        </h4>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Şirket Adı
                        </label>
                        <input
                          type='text'
                          value={settings.company.name}
                          onChange={e =>
                            handleInputChange('company', 'name', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                    </div>
                  </div>
                )}
                {/* Company Settings */}
                {activeTab === 'company' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Şirket Bilgileri
                    </h3>

                    <div className='bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm'>
                      <div className='flex items-center gap-2 mb-3'>
                        <FileText className='w-5 h-5 text-slate-900' />
                        <h4 className='text-sm font-semibold text-slate-900'>Yasal Belgeler</h4>
                      </div>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
                        <Link to='/terms' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Kullanım Koşulları
                        </Link>
                        <Link to='/privacy' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Gizlilik Politikası
                        </Link>
                        <Link to='/cookie-policy' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          Çerez Politikası
                        </Link>
                        <Link to='/kvkk-aydinlatma' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                          KVKK Aydınlatma Metni
                        </Link>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Şirket Adı
                        </label>
                        <input
                          type='text'
                          value={settings.company.name}
                          onChange={e =>
                            handleInputChange('company', 'name', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          E-posta
                        </label>
                        <input
                          type='email'
                          value={settings.company.email}
                          onChange={e =>
                            handleInputChange(
                              'company',
                              'email',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Telefon
                        </label>
                        <input
                          type='tel'
                          value={settings.company.phone}
                          onChange={e =>
                            handleInputChange(
                              'company',
                              'phone',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Vergi Numarası
                        </label>
                        <input
                          type='text'
                          value={settings.company.taxNumber}
                          onChange={e =>
                            handleInputChange(
                              'company',
                              'taxNumber',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Adres
                        </label>
                        <textarea
                          value={settings.company.address}
                          onChange={e =>
                            handleInputChange(
                              'company',
                              'address',
                              e.target.value
                            )
                          }
                          rows={3}
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Website
                        </label>
                        <input
                          type='url'
                          value={settings.company.website}
                          onChange={e =>
                            handleInputChange(
                              'company',
                              'website',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      {/* Nakliyeci Kodu - Premium Section */}
                      <div className='md:col-span-2'>
                        <div className='bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800 rounded-xl p-6 shadow-2xl border-2 border-blue-500/30 relative overflow-hidden'>
                          {/* Decorative elements */}
                          <div className='absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl'></div>
                          <div className='absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl'></div>
                          
                          <div className='relative z-10'>
                            {/* Header with badge */}
                            <div className='flex items-center justify-between mb-4'>
                              <div className='flex items-center gap-3'>
                                <div className='w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg'>
                                  <Sparkles className='w-6 h-6 text-white' />
                                </div>
                                <div>
                                  <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                                    Nakliyeci Kodunuz
                                    {stats && stats.favoriteCount > 0 && (
                                      <span className='px-2 py-1 bg-emerald-500/20 border border-emerald-400/50 rounded-lg text-emerald-300 text-sm font-semibold flex items-center gap-1'>
                                        <Star className='w-3 h-3 fill-emerald-400' />
                                        {stats.badge}
                                      </span>
                                    )}
                                  </h3>
                                  <p className='text-blue-200 text-sm mt-1'>
                                    Bu kodunuzu paylaşın, daha fazla iş fırsatı yakalayın!
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Code Display */}
                            <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20'>
                              <div className='flex items-center justify-between'>
                                <div className='flex-1'>
                                  <div className='text-xs text-blue-200 mb-1 font-medium'>Benzersiz Kodunuz</div>
                                  <div className='text-3xl font-mono font-bold text-white tracking-wider'>
                                    {user?.nakliyeciCode || 'Kod yükleniyor...'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (user?.nakliyeciCode) {
                                      navigator.clipboard.writeText(user.nakliyeciCode);
                                      setCopiedCode(true);
                                      setTimeout(() => setCopiedCode(false), 2000);
                                    }
                                  }}
                                  className='ml-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg transition-all duration-200 flex items-center gap-2 text-white font-medium shadow-lg hover:shadow-xl'
                                >
                                  {copiedCode ? (
                                    <>
                                      <CheckCircle className='w-5 h-5' />
                                      <span>Kopyalandı!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className='w-5 h-5' />
                                      <span>Kopyala</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Stats Card */}
                            {stats && (
                              <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20'>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center'>
                                      <Users className='w-5 h-5 text-white' />
                                    </div>
                                    <div>
                                      <div className='text-2xl font-bold text-white'>{stats.favoriteCount}</div>
                                      <div className='text-xs text-blue-200'>Kurumsal Kullanıcı</div>
                                    </div>
                                  </div>
                                  <div className='text-right'>
                                    <div className='text-sm text-blue-200 font-medium'>{stats.message}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Social Share Buttons */}
                            <div className='space-y-3'>
                              <div className='text-sm font-semibold text-white mb-2 flex items-center gap-2'>
                                <Share2 className='w-4 h-4' />
                                Sosyal Medyada Paylaş
                              </div>
                              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                                <button
                                  onClick={() => shareToSocial('facebook')}
                                  className='flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-900 hover:to-slate-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm'
                                >
                                  <Facebook className='w-4 h-4' />
                                  <span className='hidden sm:inline'>Facebook</span>
                                </button>
                                <button
                                  onClick={() => shareToSocial('twitter')}
                                  className='flex items-center justify-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm'
                                >
                                  <Twitter className='w-4 h-4' />
                                  <span className='hidden sm:inline'>Twitter</span>
                                </button>
                                <button
                                  onClick={() => shareToSocial('linkedin')}
                                  className='flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm'
                                >
                                  <Linkedin className='w-4 h-4' />
                                  <span className='hidden sm:inline'>LinkedIn</span>
                                </button>
                                <button
                                  onClick={() => shareToSocial('whatsapp')}
                                  className='flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm'
                                >
                                  <MessageCircle className='w-4 h-4' />
                                  <span className='hidden sm:inline'>WhatsApp</span>
                                </button>
                              </div>
                              <button
                                onClick={copyShareLink}
                                className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium'
                              >
                                <Copy className='w-4 h-4' />
                                Paylaşım Metnini Kopyala
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Vehicles & Equipment Settings */}
                {activeTab === 'vehicles' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Araçlar & Ekipmanlar
                    </h3>
                    <p className='text-sm text-slate-600'>
                      Sahip olduğunuz araç tipleri ve ekipmanları belirtin. Bu bilgiler göndericilerin doğru teklif vermesini sağlar.
                    </p>

                    <div className='bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6'>
                      {/* Araç Tipleri */}
                      <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-3'>
                          <Truck className='w-4 h-4 inline mr-2' />
                          Sahip Olduğunuz Araç Tipleri
                        </label>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                          {[
                            { id: 'van', label: 'Van' },
                            { id: 'kamyonet', label: 'Kamyonet' },
                            { id: 'kamyon', label: 'Kamyon' },
                            { id: 'refrigerated', label: 'Soğutmalı Araç' },
                            { id: 'open_truck', label: 'Açık Kasa Kamyon' },
                            { id: 'closed_truck', label: 'Kapalı Kasa Kamyon' },
                          ].map(vehicle => (
                            <div key={vehicle.id} className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id={`vehicle_${vehicle.id}`}
                                className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                              />
                              <label htmlFor={`vehicle_${vehicle.id}`} className='text-sm font-medium text-slate-700'>
                                {vehicle.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dorse Tipleri */}
                      <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-3'>
                          Sahip Olduğunuz Dorse Tipleri
                        </label>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                          {[
                            { id: 'tenteli', label: 'Tenteli Dorse' },
                            { id: 'frigorific', label: 'Frigorifik Dorse' },
                            { id: 'lowbed', label: 'Lowbed Dorse' },
                            { id: 'kapalı', label: 'Kapalı Dorse' },
                            { id: 'açık', label: 'Açık Dorse' },
                          ].map(trailer => (
                            <div key={trailer.id} className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id={`trailer_${trailer.id}`}
                                className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                              />
                              <label htmlFor={`trailer_${trailer.id}`} className='text-sm font-medium text-slate-700'>
                                {trailer.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Özel Ekipmanlar */}
                      <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-3'>
                          Sahip Olduğunuz Özel Ekipmanlar
                        </label>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                          {[
                            { id: 'crane', label: 'Vinç' },
                            { id: 'forklift', label: 'Forklift' },
                            { id: 'hydraulic_lifter', label: 'Hidrolik Kaldırıcı' },
                          ].map(equipment => (
                            <div key={equipment.id} className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id={`equipment_${equipment.id}`}
                                className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                              />
                              <label htmlFor={`equipment_${equipment.id}`} className='text-sm font-medium text-slate-700'>
                                {equipment.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ağır Tonaj Kapasitesi */}
                      <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-3'>
                          Ağır Tonaj Kapasitesi
                        </label>
                        <div className='flex items-center space-x-3'>
                          <input
                            type='checkbox'
                            id='heavy_tonage_capability'
                            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                          />
                          <label htmlFor='heavy_tonage_capability' className='text-sm font-medium text-slate-700'>
                            40+ ton taşıma kapasitesi
                          </label>
                        </div>
                        <p className='text-xs text-slate-500 mt-2 ml-7'>
                          Ağır tonajlı yükler için özel izin ve ekipman gereklidir.
                        </p>
                      </div>

                      {/* Geniş Yük Kapasitesi */}
                      <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-3'>
                          Geniş Yük Kapasitesi
                        </label>
                        <div className='flex items-center space-x-3'>
                          <input
                            type='checkbox'
                            id='oversized_capability'
                            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                          />
                          <label htmlFor='oversized_capability' className='text-sm font-medium text-slate-700'>
                            Geniş yük taşıma kapasitesi (özel izinli)
                          </label>
                        </div>
                        <p className='text-xs text-slate-500 mt-2 ml-7'>
                          Geniş yükler için özel izin ve rota planlaması gereklidir.
                        </p>
                      </div>

                      <div className='pt-4 border-t border-slate-200'>
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className='px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Hesap
                    </h3>

                    {/* Account Deletion */}
                    <div className='pt-2'>
                      <h3 className='text-lg font-semibold text-red-900 mb-4 flex items-center gap-2'>
                        <AlertCircle className='w-5 h-5' />
                        Tehlikeli Bölge
                      </h3>
                      <div className='bg-red-50 border-2 border-red-200 rounded-lg p-6'>
                        <h4 className='font-semibold text-red-900 mb-2'>Hesabı Sil</h4>
                        <p className='text-sm text-red-800 mb-4'>
                          Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          Tüm verileriniz silinecek ve hesabınıza bir daha erişemeyeceksiniz.
                        </p>
                        <button
                          onClick={async () => {
                            const confirmed = window.confirm(
                              'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!'
                            );
                            if (confirmed) {
                              const password = window.prompt('Güvenlik için şifrenizi girin:');
                              if (password) {
                                try {
                                  setIsLoading(true);
                                  const response = await authAPI.deleteAccount({ password, reason: 'Kullanıcı talebi' });
                                  if (response.success) {
                                    showProfessionalToast(showToast, 'ACTION_COMPLETED', 'success');
                                    setTimeout(() => {
                                      localStorage.clear();
                                      window.location.href = '/';
                                    }, 2000);
                                  } else {
                                    showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
                                  }
                                } catch (err: any) {
                                  showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
                                } finally {
                                  setIsLoading(false);
                                }
                              }
                            }
                          }}
                          disabled={isLoading}
                          className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {isLoading ? 'Siliniyor...' : 'Hesabımı Sil'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}










