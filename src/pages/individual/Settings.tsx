import React, { useState, useEffect } from 'react';
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
  FileText,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import Modal from '../../components/shared-ui-elements/Modal';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
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
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      birthDate: '',
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      jobAlerts: true,
      messageAlerts: true,
      paymentAlerts: true,
    },
    privacy: {
      showProfile: true,
      showLocation: false,
      allowMessages: true,
    },
    security: {
      twoFactor: false,
      biometric: false,
      sessionTimeout: 30,
    },
    preferences: {
      theme: 'light',
      language: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
    },
  });

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/individual/dashboard' },
    { label: 'Ayarlar', href: '/individual/settings' },
  ];

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'privacy', name: 'Gizlilik', icon: Shield },
    { id: 'security', name: 'Güvenlik', icon: Lock },
    { id: 'preferences', name: 'Tercihler', icon: Settings },
  ];

  const handleInputChange = (section: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement save logic
      setShowSuccessMessage(true);
      setSuccessMessage('Ayarlar başarıyla kaydedildi');
      showProfessionalToast(showToast, 'ACTION_COMPLETED', 'success');
    } catch (err: any) {
      showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.deleteAccount({ password });
      if (response.success) {
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/';
        }, 2000);
      } else {
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Hesap silme başarısız. Lütfen şifrenizi kontrol edin ve tekrar deneyin.'
      );
    } finally {
      setIsLoading(false);
    }
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
                        {error && (
                          <div className='mb-4 bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800'>
                            {error}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const password = window.prompt('Güvenlik için şifrenizi girin:');
                            if (password) {
                              handleDeleteAccount(password);
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











