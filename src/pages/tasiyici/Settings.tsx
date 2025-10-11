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
  AlertCircle
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface SettingsData {
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
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
    showEarnings: boolean;
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
  vehicle: {
    type: string;
    plate: string;
    capacity: string;
    features: string[];
  };
}

export default function TasiyiciSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: 'Mehmet Kaya',
      email: 'mehmet.kaya@email.com',
      phone: '+90 532 123 45 67',
      address: 'İstanbul, Türkiye'
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      jobAlerts: true,
      messageAlerts: true,
      paymentAlerts: false
    },
    privacy: {
      showProfile: true,
      showLocation: false,
      showEarnings: false,
      allowMessages: true
    },
    security: {
      twoFactor: false,
      biometric: true,
      sessionTimeout: 30
    },
    preferences: {
      theme: 'light',
      language: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY'
    },
    vehicle: {
      type: 'Kamyon',
      plate: '34 ABC 123',
      capacity: '10 ton',
      features: ['GPS', 'Klima', 'Forklift']
    }
  });

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/tasiyici/dashboard' },
    { label: 'Ayarlar', icon: <Settings className="w-4 h-4" /> }
  ];

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'privacy', name: 'Gizlilik', icon: Eye },
    { id: 'security', name: 'Güvenlik', icon: Shield },
    { id: 'preferences', name: 'Tercihler', icon: Globe },
    { id: 'vehicle', name: 'Araç', icon: Truck }
  ];

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSuccessMessage('Ayarlar başarıyla kaydedildi!');
      setShowSuccessMessage(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (section: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleToggle = (section: keyof SettingsData, field: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field as keyof typeof prev[section]]
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Ayarlar kaydediliyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Ayarlar - Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Taşıyıcı ayar yönetimi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ayarlar</h1>
              <p className="text-sm text-slate-600">Hesap ve uygulama ayarlarınızı yönetin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Kaydet</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200">
              <nav className="p-4">
                <ul className="space-y-2">
                  {tabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{tab.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200">
              <div className="p-4 sm:p-6">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Profil Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                        <input
                          type="text"
                          value={settings.profile.name}
                          onChange={(e) => handleInputChange('profile', 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">E-posta</label>
                        <input
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
                        <input
                          type="tel"
                          value={settings.profile.phone}
                          onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Adres</label>
                        <input
                          type="text"
                          value={settings.profile.address}
                          onChange={(e) => handleInputChange('profile', 'address', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Bildirim Ayarları</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">E-posta Bildirimleri</h4>
                          <p className="text-sm text-slate-600">Önemli güncellemeler için e-posta alın</p>
                        </div>
                        <button
                          onClick={() => handleToggle('notifications', 'email')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.email ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">SMS Bildirimleri</h4>
                          <p className="text-sm text-slate-600">Acil durumlar için SMS alın</p>
                        </div>
                        <button
                          onClick={() => handleToggle('notifications', 'sms')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.sms ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.sms ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">İş Uyarıları</h4>
                          <p className="text-sm text-slate-600">Yeni iş fırsatları hakkında bilgilendirilme</p>
                        </div>
                        <button
                          onClick={() => handleToggle('notifications', 'jobAlerts')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications.jobAlerts ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.notifications.jobAlerts ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Gizlilik Ayarları</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">Profil Görünürlüğü</h4>
                          <p className="text-sm text-slate-600">Diğer kullanıcılar profilinizi görebilir</p>
                        </div>
                        <button
                          onClick={() => handleToggle('privacy', 'showProfile')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.showProfile ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.showProfile ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">Konum Paylaşımı</h4>
                          <p className="text-sm text-slate-600">Gerçek zamanlı konumunuzu paylaşın</p>
                        </div>
                        <button
                          onClick={() => handleToggle('privacy', 'showLocation')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.privacy.showLocation ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.privacy.showLocation ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Güvenlik Ayarları</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">İki Faktörlü Kimlik Doğrulama</h4>
                          <p className="text-sm text-slate-600">Hesabınızı ekstra güvenlik ile koruyun</p>
                        </div>
                        <button
                          onClick={() => handleToggle('security', 'twoFactor')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.security.twoFactor ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.security.twoFactor ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">Biyometrik Giriş</h4>
                          <p className="text-sm text-slate-600">Parmak izi veya yüz tanıma ile giriş</p>
                        </div>
                        <button
                          onClick={() => handleToggle('security', 'biometric')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.security.biometric ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.security.biometric ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Oturum Zaman Aşımı (dakika)</label>
                        <select
                          value={settings.security.sessionTimeout}
                          onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Uygulama Tercihleri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tema</label>
                        <select
                          value={settings.preferences.theme}
                          onChange={(e) => handleInputChange('preferences', 'theme', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="light">Açık</option>
                          <option value="dark">Koyu</option>
                          <option value="auto">Otomatik</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Dil</label>
                        <select
                          value={settings.preferences.language}
                          onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="tr">Türkçe</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Saat Dilimi</label>
                        <select
                          value={settings.preferences.timezone}
                          onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                          <option value="Europe/London">Londra (UTC+0)</option>
                          <option value="America/New_York">New York (UTC-5)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Para Birimi</label>
                        <select
                          value={settings.preferences.currency}
                          onChange={(e) => handleInputChange('preferences', 'currency', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="TRY">₺ Türk Lirası</option>
                          <option value="USD">$ Amerikan Doları</option>
                          <option value="EUR">€ Euro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vehicle Settings */}
                {activeTab === 'vehicle' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Araç Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Araç Tipi</label>
                        <select
                          value={settings.vehicle.type}
                          onChange={(e) => handleInputChange('vehicle', 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        >
                          <option value="Kamyon">Kamyon</option>
                          <option value="Kamyonet">Kamyonet</option>
                          <option value="Minibüs">Minibüs</option>
                          <option value="Van">Van</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Plaka</label>
                        <input
                          type="text"
                          value={settings.vehicle.plate}
                          onChange={(e) => handleInputChange('vehicle', 'plate', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kapasite</label>
                        <input
                          type="text"
                          value={settings.vehicle.capacity}
                          onChange={(e) => handleInputChange('vehicle', 'capacity', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Özellikler</label>
                        <div className="space-y-2">
                          {['GPS', 'Klima', 'Forklift', 'Vinç', 'Soğutma'].map((feature) => (
                            <label key={feature} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.vehicle.features.includes(feature)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInputChange('vehicle', 'features', [...settings.vehicle.features, feature]);
                                  } else {
                                    handleInputChange('vehicle', 'features', settings.vehicle.features.filter(f => f !== feature));
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-slate-700">{feature}</span>
                            </label>
                          ))}
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