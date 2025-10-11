import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X,
  Package,
  Star,
  Award,
  Shield,
  Settings,
  Bell,
  Eye,
  EyeOff,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  avatar?: string;
  stats: {
    totalShipments: number;
    completedShipments: number;
    totalSpent: number;
    averageRating: number;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'friends';
      showStats: boolean;
      showActivity: boolean;
    };
    appearance: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      timezone: string;
    };
  };
}

const IndividualProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Mock data
  const mockProfile: UserProfile = {
    id: '1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@email.com',
    phone: '+90 555 123 45 67',
    location: 'İstanbul, Türkiye',
    joinDate: '2023-01-15',
    avatar: '/avatar.jpg',
    stats: {
      totalShipments: 47,
      completedShipments: 42,
      totalSpent: 12500,
      averageRating: 4.8
    },
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true,
        marketing: false
      },
      privacy: {
        profileVisibility: 'public',
        showStats: true,
        showActivity: true
      },
      appearance: {
        theme: 'light',
        language: 'tr',
        timezone: 'Europe/Istanbul'
      }
    }
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setProfile(mockProfile);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = () => {
    setEditForm(profile || {});
    setEditing(true);
  };

  const handleSave = () => {
    if (profile) {
      setProfile({ ...profile, ...editForm });
      setEditing(false);
      setSuccessMessage('Profil başarıyla güncellendi!');
      setShowSuccessMessage(true);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({});
  };

  const handlePreferenceChange = (category: keyof UserProfile['preferences'], key: string, value: any) => {
    if (profile) {
      setProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          [category]: {
            ...profile.preferences[category],
            [key]: value
          }
        }
      });
    }
  };

  const breadcrumbItems = [
    { label: 'Profil', icon: <User className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Profil yükleniyor..." />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <EmptyState
            icon={<User className="w-12 h-12 text-slate-400" />}
            title="Profil Bulunamadı"
            description="Profil bilgileriniz yüklenemedi."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Profil - YolNet Bireysel</title>
        <meta name="description" content="Bireysel gönderici profil yönetimi" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Profil{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Yönetimi</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">Profil bilgilerinizi yönetin ve tercihlerinizi ayarlayın</p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Toplam Gönderi</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">{profile.stats.totalShipments}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Tamamlanan</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">{profile.stats.completedShipments}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Toplam Harcama</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">₺{profile.stats.totalSpent.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Ortalama Puan</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">{profile.stats.averageRating}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-4 sm:px-6">
              {[
                { id: 'profile', name: 'Profil Bilgileri', icon: <User className="w-4 h-4" /> },
                { id: 'preferences', name: 'Tercihler', icon: <Settings className="w-4 h-4" /> },
                { id: 'security', name: 'Güvenlik', icon: <Shield className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900">Kişisel Bilgiler</h3>
                  {!editing && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Ad Soyad
                        </label>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          E-posta
                        </label>
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Konum
                        </label>
                        <input
                          type="text"
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{profile.name}</p>
                          <p className="text-sm text-slate-500">Ad Soyad</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{profile.email}</p>
                          <p className="text-sm text-slate-500">E-posta</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{profile.phone}</p>
                          <p className="text-sm text-slate-500">Telefon</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{profile.location}</p>
                          <p className="text-sm text-slate-500">Konum</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-900">Bildirim Tercihleri</h3>
                <div className="space-y-4">
                  {Object.entries(profile.preferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {key === 'email' && 'E-posta Bildirimleri'}
                          {key === 'sms' && 'SMS Bildirimleri'}
                          {key === 'push' && 'Push Bildirimleri'}
                          {key === 'marketing' && 'Pazarlama Bildirimleri'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {key === 'email' && 'E-posta ile bildirim al'}
                          {key === 'sms' && 'SMS ile bildirim al'}
                          {key === 'push' && 'Push bildirim al'}
                          {key === 'marketing' && 'Pazarlama mesajları al'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePreferenceChange('notifications', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Görünüm Tercihleri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tema
                      </label>
                      <select
                        value={profile.preferences.appearance.theme}
                        onChange={(e) => handlePreferenceChange('appearance', 'theme', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="light">Açık</option>
                        <option value="dark">Koyu</option>
                        <option value="auto">Otomatik</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Dil
                      </label>
                      <select
                        value={profile.preferences.appearance.language}
                        onChange={(e) => handlePreferenceChange('appearance', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-900">Güvenlik Ayarları</h3>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-900 mb-2">Şifre Değiştir</h4>
                    <p className="text-sm text-slate-600 mb-3">Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin.</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Şifre Değiştir
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-900 mb-2">İki Faktörlü Kimlik Doğrulama</h4>
                    <p className="text-sm text-slate-600 mb-3">Hesabınızı ekstra güvenlik katmanı ile koruyun.</p>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      Etkinleştir
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-900 mb-2">Oturum Geçmişi</h4>
                    <p className="text-sm text-slate-600 mb-3">Hesabınıza giriş yapılan cihazları görüntüleyin.</p>
                    <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm">
                      Görüntüle
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <SuccessMessage
            message={successMessage}
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
      </div>
    </div>
  );
};

export default IndividualProfile;