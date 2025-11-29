import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Settings,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  X,
  User,
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
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsData {
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    jobAlerts: boolean;
    messageAlerts: boolean;
    paymentAlerts: boolean;
  };
  privacy: {
    showProfile: boolean;
    showLocation: boolean;
    allowMessages: boolean;
  };
  security: {
    twoFactor: boolean;
    biometric: boolean;
    sessionTimeout: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    currency: string;
  };
}

export default function IndividualSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: 'Kullanıcı',
      email: 'ahmet.yilmaz@email.com',
      phone: '+90 532 123 45 67',
      address: 'İstanbul, Türkiye',
      birthDate: '1985-03-15',
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      jobAlerts: true,
      messageAlerts: true,
      paymentAlerts: false,
    },
    privacy: {
      showProfile: true,
      showLocation: false,
      allowMessages: true,
    },
    security: {
      twoFactor: false,
      biometric: true,
      sessionTimeout: 30,
    },
    preferences: {
      theme: 'light',
      language: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
    },
  });

  // Update settings when user data is available
  useEffect(() => {
    if (user) {
      const fullName = user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'Kullanıcı');
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: fullName,
          email: user.email || prev.profile.email,
          phone: user.phone || prev.profile.phone,
          address: user.address || prev.profile.address,
        },
      }));
    }
  }, [user]);

  const breadcrumbItems = [
    {
      label: 'Ana Sayfa',
      icon: <BarChart3 className='w-4 h-4' />,
      href: '/individual/dashboard',
    },
    { label: 'Ayarlar', icon: <Settings className='w-4 h-4' /> },
  ];

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'privacy', name: 'Gizlilik', icon: Eye },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'preferences', name: 'Tercihler', icon: Globe },
  ];

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSuccessMessage('Ayarlar başarıyla kaydedildi!');
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
        <title>Ayarlar - Bireysel Panel - YolNext</title>
        <meta name='description' content='Bireysel ayar yönetimi' />
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
                Hesap ve uygulama ayarlarınızı yönetin
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
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Profil Bilgileri
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Ad Soyad
                        </label>
                        <input
                          type='text'
                          value={settings.profile.name}
                          onChange={e =>
                            handleInputChange('profile', 'name', e.target.value)
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
                          value={settings.profile.email}
                          onChange={e =>
                            handleInputChange(
                              'profile',
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
                          value={settings.profile.phone}
                          onChange={e =>
                            handleInputChange(
                              'profile',
                              'phone',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Doğum Tarihi
                        </label>
                        <input
                          type='date'
                          value={settings.profile.birthDate}
                          onChange={e =>
                            handleInputChange(
                              'profile',
                              'birthDate',
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
                          value={settings.profile.address}
                          onChange={e =>
                            handleInputChange(
                              'profile',
                              'address',
                              e.target.value
                            )
                          }
                          rows={3}
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Bildirim Ayarları
                    </h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-sm font-medium text-slate-900'>
                            E-posta Bildirimleri
                          </h4>
                          <p className='text-sm text-slate-600'>
                            Önemli güncellemeler için e-posta alın
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggle('notifications', 'email')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.email
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.email
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-sm font-medium text-slate-900'>
                            SMS Bildirimleri
                          </h4>
                          <p className='text-sm text-slate-600'>
                            Acil durumlar için SMS alın
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggle('notifications', 'sms')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.sms
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.sms
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-sm font-medium text-slate-900'>
                            İş Uyarıları
                          </h4>
                          <p className='text-sm text-slate-600'>
                            Yeni iş fırsatları hakkında bilgilendirilme
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleToggle('notifications', 'jobAlerts')
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.jobAlerts
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.jobAlerts
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Gizlilik Ayarları
                    </h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-sm font-medium text-slate-900'>
                            Profil Görünürlüğü
                          </h4>
                          <p className='text-sm text-slate-600'>
                            Diğer kullanıcılar profilinizi görebilir
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggle('privacy', 'showProfile')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.showProfile
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.showProfile
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-sm font-medium text-slate-900'>
                            Konum Paylaşımı
                          </h4>
                          <p className='text-sm text-slate-600'>
                            Gerçek zamanlı konumunuzu paylaşın
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleToggle('privacy', 'showLocation')
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.showLocation
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.showLocation
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {/* KVKK Veri Erişim Hakkı - Gizli yer */}
                      <div className='mt-8 pt-6 border-t border-slate-200'>
                        <div className='text-xs text-slate-400 space-y-2'>
                          <p className='text-[10px] leading-tight'>
                            KVKK m.11 gereği veri erişim ve silme haklarınız için:
                          </p>
                          <div className='flex gap-2'>
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('authToken');
                                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/kvkk/data-access`, {
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json',
                                    },
                                  });
                                  if (response.ok) {
                                    const data = await response.json();
                                    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `yolnext-veri-export-${new Date().toISOString().split('T')[0]}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    setSuccessMessage('Verileriniz indirildi');
                                    setShowSuccessMessage(true);
                                  } else {
                                    setSuccessMessage('Veri erişim hatası');
                                    setShowSuccessMessage(true);
                                  }
                                } catch (error) {
                                  setSuccessMessage('Veri erişim hatası');
                                  setShowSuccessMessage(true);
                                }
                              }}
                              className='text-[10px] text-slate-400 hover:text-slate-600 underline'
                            >
                              Verilerimi İndir
                            </button>
                            <span className='text-slate-300'>|</span>
                            <button
                              onClick={async () => {
                                if (!confirm('Tüm verileriniz silinecek. Bu işlem geri alınamaz. Emin misiniz?')) return;
                                if (!confirm('Son bir kez onaylayın: Tüm verileriniz kalıcı olarak silinecek. Devam edilsin mi?')) return;
                                try {
                                  const token = localStorage.getItem('authToken');
                                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/kvkk/delete-data`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json',
                                    },
                                  });
                                  const data = await response.json();
                                  if (response.ok) {
                                    alert('Verileriniz silindi. Çıkış yapılıyor...');
                                    localStorage.removeItem('authToken');
                                    localStorage.removeItem('user');
                                    window.location.href = '/login';
                                  } else {
                                    alert(data.message || 'Veri silme hatası');
                                  }
                                } catch (error) {
                                  alert('Veri silme hatası');
                                }
                              }}
                              className='text-[10px] text-slate-400 hover:text-red-600 underline'
                            >
                              Verilerimi Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Güvenlik Ayarları
                    </h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-sm font-medium text-slate-900'>
                            İki Faktörlü Kimlik Doğrulama
                          </h4>
                          <p className='text-sm text-slate-600'>
                            Hesabınızı ekstra güvenlik ile koruyun
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggle('security', 'twoFactor')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.security.twoFactor
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.security.twoFactor
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Oturum Zaman Aşımı (dakika)
                        </label>
                        <select
                          value={settings.security.sessionTimeout}
                          onChange={e =>
                            handleInputChange(
                              'security',
                              'sessionTimeout',
                              parseInt(e.target.value)
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value={15}>15 dakika</option>
                          <option value={30}>30 dakika</option>
                          <option value={60}>1 saat</option>
                          <option value={120}>2 saat</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Settings */}
                {activeTab === 'preferences' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Uygulama Tercihleri
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Tema
                        </label>
                        <select
                          value={settings.preferences.theme}
                          onChange={e =>
                            handleInputChange(
                              'preferences',
                              'theme',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='light'>Açık</option>
                          <option value='dark'>Koyu</option>
                          <option value='auto'>Otomatik</option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Dil
                        </label>
                        <select
                          value={settings.preferences.language}
                          onChange={e =>
                            handleInputChange(
                              'preferences',
                              'language',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='tr'>Türkçe</option>
                          <option value='en'>English</option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Saat Dilimi
                        </label>
                        <select
                          value={settings.preferences.timezone}
                          onChange={e =>
                            handleInputChange(
                              'preferences',
                              'timezone',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='Europe/Istanbul'>
                            İstanbul (UTC+3)
                          </option>
                          <option value='Europe/London'>Londra (UTC+0)</option>
                          <option value='America/New_York'>
                            New York (UTC-5)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Para Birimi
                        </label>
                        <select
                          value={settings.preferences.currency}
                          onChange={e =>
                            handleInputChange(
                              'preferences',
                              'currency',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='TRY'>₺ Türk Lirası</option>
                          <option value='USD'>$ Amerikan Doları</option>
                          <option value='EUR'>€ Euro</option>
                        </select>
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
