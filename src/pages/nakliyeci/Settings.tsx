import React, { useState } from 'react';
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
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

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

export default function NakliyeciSettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'privacy', name: 'Gizlilik', icon: Eye },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'preferences', name: 'Tercihler', icon: Globe },
    { id: 'business', name: 'İş Ayarları', icon: DollarSign },
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
                {/* Company Settings */}
                {activeTab === 'company' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Şirket Bilgileri
                    </h3>
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

                {/* Business Settings */}
                {activeTab === 'business' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      İş Ayarları
                    </h3>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Komisyon Oranı (%)
                        </label>
                        <input
                          type='number'
                          min='0'
                          max='10'
                          step='0.1'
                          value={settings.business.commissionRate}
                          onChange={e =>
                            handleInputChange(
                              'business',
                              'commissionRate',
                              parseFloat(e.target.value)
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-sm font-medium text-slate-900'>
                            Otomatik İş Kabul
                          </h4>
                          <p className='text-sm text-slate-600'>
                            Uygun işleri otomatik olarak kabul et
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleToggle('business', 'autoAcceptJobs')
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.business.autoAcceptJobs
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.business.autoAcceptJobs
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Maksimum Mesafe (km)
                        </label>
                        <input
                          type='number'
                          min='10'
                          max='500'
                          value={settings.business.maxDistance}
                          onChange={e =>
                            handleInputChange(
                              'business',
                              'maxDistance',
                              parseInt(e.target.value)
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Çalışma Saatleri
                        </label>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-xs text-slate-500 mb-1'>
                              Başlangıç
                            </label>
                            <input
                              type='time'
                              value={settings.business.workingHours.start}
                              onChange={e =>
                                handleInputChange('business', 'workingHours', {
                                  ...settings.business.workingHours,
                                  start: e.target.value,
                                })
                              }
                              className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                            />
                          </div>
                          <div>
                            <label className='block text-xs text-slate-500 mb-1'>
                              Bitiş
                            </label>
                            <input
                              type='time'
                              value={settings.business.workingHours.end}
                              onChange={e =>
                                handleInputChange('business', 'workingHours', {
                                  ...settings.business.workingHours,
                                  end: e.target.value,
                                })
                              }
                              className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                            />
                          </div>
                        </div>
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
