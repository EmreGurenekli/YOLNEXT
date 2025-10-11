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
  RotateCcw
} from 'lucide-react';

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
      showEmail: boolean;
      showPhone: boolean;
      showLocation: boolean;
    };
    appearance: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      timezone: string;
    };
    security: {
      twoFactor: boolean;
      loginAlerts: boolean;
      sessionTimeout: number;
    };
  };
}

const IndividualProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });

  // Mock data
  const mockProfile: UserProfile = {
    id: '1',
    name: 'Demo Bireysel',
    email: 'demo@example.com',
    phone: '+90 555 123 45 67',
    location: 'İstanbul, Türkiye',
    joinDate: '2024-01-01',
    stats: {
      totalShipments: 12,
      completedShipments: 10,
      totalSpent: 15600,
      averageRating: 4.8
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true,
        marketing: false
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        showLocation: true
      },
      appearance: {
        theme: 'light',
        language: 'tr',
        timezone: 'Europe/Istanbul'
      },
      security: {
        twoFactor: false,
        loginAlerts: true,
        sessionTimeout: 30
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(mockProfile);
      setEditData({
        name: mockProfile.name,
        email: mockProfile.email,
        phone: mockProfile.phone,
        location: mockProfile.location
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (profile) {
      setProfile({
        ...profile,
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        location: editData.location
      });
    }
    setIsEditing(false);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (profile) {
      setEditData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location
      });
    }
    setIsEditing(false);
  };

  const handlePreferenceChange = (section: keyof UserProfile['preferences'], key: string, value: any) => {
    if (profile) {
      setProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          [section]: {
            ...profile.preferences[section],
            [key]: value
          }
        }
      });
      setHasChanges(true);
    }
  };

  const handleSaveAll = () => {
    setHasChanges(false);
    // Save all changes logic here
  };

  const handleReset = () => {
    setProfile(mockProfile);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Profil yükleniyor...</h2>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tabs = [
    { id: 'profile', name: 'Profil Bilgileri', icon: User },
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'privacy', name: 'Gizlilik', icon: Shield },
    { id: 'appearance', name: 'Görünüm', icon: Sun },
    { id: 'security', name: 'Güvenlik', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Profil & Ayarlar - YolNet</title>
        <meta name="description" content="Profil bilgilerinizi ve ayarlarınızı yönetin" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Profil &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-700">
              Ayarlar
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kişisel bilgilerinizi ve tercihlerinizi yönetin
          </p>
        </div>

        {/* Save/Reset Buttons */}
        {hasChanges && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-800">Kaydedilmemiş değişiklikleriniz var</p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Sıfırla
                </button>
                <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Tümünü Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Kişisel Bilgiler</h2>
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Kaydet
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          İptal
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.phone}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Konum</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.location}
                            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.location}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Üyelik Tarihi</label>
                      <p className="text-gray-900">{new Date(profile.joinDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">İstatistikler</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{profile.stats.totalShipments}</div>
                      <div className="text-sm text-gray-600">Toplam Gönderi</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{profile.stats.completedShipments}</div>
                      <div className="text-sm text-gray-600">Tamamlanan</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{profile.stats.averageRating}</div>
                      <div className="text-sm text-gray-600">Ortalama Puan</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">₺{profile.stats.totalSpent.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Toplam Harcama</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Bildirim Ayarları</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-gray-900">E-posta Bildirimleri</p>
                        <p className="text-sm text-gray-600">Gönderi durumu ve önemli güncellemeler</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('notifications', 'email', !profile.preferences.notifications.email)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.preferences.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.preferences.notifications.email ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-gray-900">SMS Bildirimleri</p>
                        <p className="text-sm text-gray-600">Acil durumlar ve önemli güncellemeler</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('notifications', 'sms', !profile.preferences.notifications.sms)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.preferences.notifications.sms ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.preferences.notifications.sms ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-gray-900">Push Bildirimleri</p>
                        <p className="text-sm text-gray-600">Tarayıcı bildirimleri</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('notifications', 'push', !profile.preferences.notifications.push)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.preferences.notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.preferences.notifications.push ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-gray-900">Pazarlama E-postaları</p>
                        <p className="text-sm text-gray-600">Özel teklifler ve kampanyalar</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('notifications', 'marketing', !profile.preferences.notifications.marketing)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.preferences.notifications.marketing ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.preferences.notifications.marketing ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Gizlilik Ayarları</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profil Görünürlüğü</label>
                    <select
                      value={profile.preferences.privacy.profileVisibility}
                      onChange={(e) => handlePreferenceChange('privacy', 'profileVisibility', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="public">Herkese Açık</option>
                      <option value="private">Özel</option>
                      <option value="friends">Sadece Arkadaşlar</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-900">E-posta Adresini Göster</span>
                      </div>
                      <button
                        onClick={() => handlePreferenceChange('privacy', 'showEmail', !profile.preferences.privacy.showEmail)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile.preferences.privacy.showEmail ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-900">Telefon Numarasını Göster</span>
                      </div>
                      <button
                        onClick={() => handlePreferenceChange('privacy', 'showPhone', !profile.preferences.privacy.showPhone)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile.preferences.privacy.showPhone ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.privacy.showPhone ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-900">Konum Bilgisini Göster</span>
                      </div>
                      <button
                        onClick={() => handlePreferenceChange('privacy', 'showLocation', !profile.preferences.privacy.showLocation)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile.preferences.privacy.showLocation ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.privacy.showLocation ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <Sun className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Görünüm Ayarları</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                    <select
                      value={profile.preferences.appearance.theme}
                      onChange={(e) => handlePreferenceChange('appearance', 'theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Açık</option>
                      <option value="dark">Koyu</option>
                      <option value="auto">Otomatik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dil</label>
                    <select
                      value={profile.preferences.appearance.language}
                      onChange={(e) => handlePreferenceChange('appearance', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Saat Dilimi</label>
                    <select
                      value={profile.preferences.appearance.timezone}
                      onChange={(e) => handlePreferenceChange('appearance', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                      <option value="Europe/London">Londra (UTC+0)</option>
                      <option value="America/New_York">New York (UTC-5)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Güvenlik Ayarları</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">İki Faktörlü Kimlik Doğrulama</p>
                      <p className="text-sm text-gray-600">Hesabınızı ekstra güvenlik katmanı ile koruyun</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('security', 'twoFactor', !profile.preferences.security.twoFactor)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.preferences.security.twoFactor ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.preferences.security.twoFactor ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">Giriş Uyarıları</p>
                      <p className="text-sm text-gray-600">Yeni cihazlardan giriş yapıldığında bildirim alın</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('security', 'loginAlerts', !profile.preferences.security.loginAlerts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.preferences.security.loginAlerts ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.preferences.security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Oturum Zaman Aşımı (dakika)</label>
                    <select
                      value={profile.preferences.security.sessionTimeout}
                      onChange={(e) => handlePreferenceChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={15}>15 dakika</option>
                      <option value={30}>30 dakika</option>
                      <option value={60}>1 saat</option>
                      <option value={120}>2 saat</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4" />
                      Şifre Değiştir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualProfile;