import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { createApiUrl } from '../../config/api';
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
  Copy,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
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
    };
    privacy: {
      showProfile: boolean;
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
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: 'Mehmet Kaya',
      email: 'mehmet.kaya@email.com',
      phone: '+90 532 123 45 67',
      address: 'İstanbul, Türkiye',
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      jobAlerts: true,
      messageAlerts: true,
    },
    privacy: {
      showProfile: true,
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
    vehicle: {
      type: 'Kamyon',
      plate: '34 ABC 123',
      capacity: '10 ton',
      features: ['Klima', 'Forklift'],
    },
  });

  const breadcrumbItems = [
    {
      label: 'Ana Sayfa',
      icon: <BarChart3 className='w-4 h-4' />,
      href: '/tasiyici/dashboard',
    },
    { label: 'Ayarlar', icon: <Settings className='w-4 h-4' /> },
  ];

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'vehicle', name: 'Araç', icon: Truck },
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

  // Ensure we have driverCode on the user object - fetch profile if missing
  useEffect(() => {
    const ensureDriverCode = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        if (!user || !user.driverCode) {
          const res = await fetch(createApiUrl('/api/users/profile'), {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          });

          if (res.ok) {
            const resp = await res.json();
            const profile = resp.data?.user || resp.user || resp.data || resp;
            const code = profile?.driverCode || profile?.drivercode;
            if (code) {
              updateUser({ driverCode: code });
            }
          }
        }
      } catch (err) {
        // silent
      }
    };

    ensureDriverCode();
  }, [user, updateUser]);

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
        <title>Ayarlar - Taşıyıcı Panel - YolNext</title>
        <meta name='description' content='Taşıyıcı ayar yönetimi' />
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

                    {/* Taşıyıcı Kodu */}
                    {(user?.driverCode || (user as any)?.drivercode) && (
                      <div className='bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-6 mb-6 border border-slate-700'>
                        <div className='flex items-center justify-between mb-4'>
                          <div>
                            <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                              <Key className='w-5 h-5' />
                              Taşıyıcı Kodunuz
                            </h3>
                            <p className='text-blue-200 text-sm mt-1'>
                              Bu kodunuzu nakliyecilerle paylaşın, daha fazla iş fırsatı yakalayın!
                            </p>
                          </div>
                        </div>

                        {/* Code Display */}
                        <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20'>
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='text-xs text-blue-200 mb-1 font-medium'>Benzersiz Kodunuz</div>
                              <div className='text-3xl font-mono font-bold text-white tracking-wider'>
                                {user?.driverCode || (user as any)?.drivercode || 'Kod yükleniyor...'}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const code = user?.driverCode || (user as any)?.drivercode;
                                if (code) {
                                  navigator.clipboard.writeText(code);
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
                      </div>
                    )}

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
                          Adres
                        </label>
                        <input
                          type='text'
                          value={settings.profile.address}
                          onChange={e =>
                            handleInputChange(
                              'profile',
                              'address',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div className='mt-8 pt-8 border-t border-red-200'>
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
                                    alert('Hesabınız başarıyla silindi. Çıkış yapılıyor...');
                                    localStorage.clear();
                                    window.location.href = '/';
                                  } else {
                                    alert(response.message || 'Hesap silme başarısız');
                                  }
                                } catch (err: any) {
                                  alert(err?.response?.data?.message || 'Hesap silme başarısız');
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


                {/* Vehicle Settings */}
                {activeTab === 'vehicle' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Araç Bilgileri
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Araç Tipi
                        </label>
                        <select
                          value={settings.vehicle.type}
                          onChange={e =>
                            handleInputChange('vehicle', 'type', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='Kamyon'>Kamyon</option>
                          <option value='Kamyonet'>Kamyonet</option>
                          <option value='Minibüs'>Minibüs</option>
                          <option value='Van'>Van</option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Plaka
                        </label>
                        <input
                          type='text'
                          value={settings.vehicle.plate}
                          onChange={e =>
                            handleInputChange(
                              'vehicle',
                              'plate',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Kapasite
                        </label>
                        <input
                          type='text'
                          value={settings.vehicle.capacity}
                          onChange={e =>
                            handleInputChange(
                              'vehicle',
                              'capacity',
                              e.target.value
                            )
                          }
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Özellikler
                        </label>
                        <div className='space-y-2'>
                          {['Klima', 'Forklift', 'Vinç', 'Soğutma'].map(
                            feature => (
                              <label
                                key={feature}
                                className='flex items-center'
                              >
                                <input
                                  type='checkbox'
                                  checked={settings.vehicle.features.includes(
                                    feature
                                  )}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      handleInputChange('vehicle', 'features', [
                                        ...settings.vehicle.features,
                                        feature,
                                      ]);
                                    } else {
                                      handleInputChange(
                                        'vehicle',
                                        'features',
                                        settings.vehicle.features.filter(
                                          f => f !== feature
                                        )
                                      );
                                    }
                                  }}
                                  className='mr-2'
                                />
                                <span className='text-sm text-slate-700'>
                                  {feature}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>

                      {/* Account Deletion */}
                      <div className='mt-8 pt-8 border-t border-red-200'>
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
                                      alert('Hesabınız başarıyla silindi. Çıkış yapılıyor...');
                                      localStorage.clear();
                                      window.location.href = '/';
                                    } else {
                                      alert(response.message || 'Hesap silme başarısız');
                                    }
                                  } catch (err: any) {
                                    alert(err?.response?.data?.message || 'Hesap silme başarısız');
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