import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Star, 
  Edit, 
  Save, 
  X, 
  Camera,
  Shield,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function TasiyiciProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Profil verileri
  const [profileData, setProfileData] = useState({
    name: "Mehmet Yılmaz",
    email: "mehmet.yilmaz@email.com",
    phone: "+90 555 123 4567",
    location: "İstanbul, Türkiye",
    birthDate: "1985-03-15",
    licenseNumber: "B123456789",
    licenseDate: "2010-05-20",
    vehicleType: "Kamyon",
    vehiclePlate: "34 ABC 123",
    experience: "14 yıl",
    rating: 4.8,
    completedJobs: 156,
    memberSince: "2022-01-15",
    bio: "14 yıllık deneyimli taşıyıcı. Güvenilir ve profesyonel hizmet.",
    specialties: ["Ev Taşıma", "Ofis Taşıma", "Hammade Taşıma"],
    languages: ["Türkçe", "İngilizce"],
    availability: "7/24",
    emergencyContact: "+90 555 987 6543"
  });

  const handleSave = () => {
    // Profil kaydetme işlemi
    console.log('Profil kaydedildi:', profileData);
    setIsEditing(false);
    alert('Profil başarıyla güncellendi!');
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'personal', label: 'Kişisel Bilgiler', icon: User },
    { id: 'professional', label: 'Mesleki Bilgiler', icon: Award },
    { id: 'vehicle', label: 'Araç Bilgileri', icon: Shield },
    { id: 'preferences', label: 'Tercihler', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Profilim - Taşıyıcı Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profilim</h1>
          <p className="text-gray-600">Hesap bilgilerinizi yönetin ve güncelleyin</p>
        </div>

        {/* Profil Kartı */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                <p className="text-gray-600">{profileData.location}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-1" />
                    <span className="font-semibold">{profileData.rating}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-1" />
                    <span className="text-sm text-gray-600">{profileData.completedJobs} tamamlanan iş</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    İptal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Düzenle
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hakkımda</h3>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            ) : (
              <p className="text-gray-700">{profileData.bio}</p>
            )}
          </div>

          {/* Uzmanlık Alanları */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Uzmanlık Alanları</h3>
            <div className="flex flex-wrap gap-2">
              {profileData.specialties.map((specialty, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Menü */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Kişisel Bilgiler */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Konum</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.location}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={profileData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.birthDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Acil Durum İletişim</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.emergencyContact}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mesleki Bilgiler */}
            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ehliyet Numarası</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.licenseNumber}
                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.licenseNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ehliyet Tarihi</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={profileData.licenseDate}
                        onChange={(e) => handleInputChange('licenseDate', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.licenseDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deneyim</label>
                    <p className="text-gray-900">{profileData.experience}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Üyelik Tarihi</label>
                    <p className="text-gray-900">{profileData.memberSince}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diller</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.languages.map((language, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Araç Bilgileri */}
            {activeTab === 'vehicle' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Araç Tipi</label>
                    {isEditing ? (
                      <select
                        value={profileData.vehicleType}
                        onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Kamyon">Kamyon</option>
                        <option value="Tır">Tır</option>
                        <option value="Kamyonet">Kamyonet</option>
                        <option value="Minibüs">Minibüs</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{profileData.vehicleType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plaka</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.vehiclePlate}
                        onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.vehiclePlate}</p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">Araç Belgesi Gerekli</h3>
                      <p className="text-yellow-700 text-sm mt-1">
                        Araç belgelerinizi güncel tutmak için düzenli olarak kontrol edin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tercihler */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Müsaitlik</label>
                    {isEditing ? (
                      <select
                        value={profileData.availability}
                        onChange={(e) => handleInputChange('availability', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="7/24">7/24</option>
                        <option value="Hafta içi">Hafta içi</option>
                        <option value="Hafta sonu">Hafta sonu</option>
                        <option value="Esnek">Esnek</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{profileData.availability}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bildirim Tercihleri</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm text-gray-700">Yeni iş ilanları</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm text-gray-700">Mesaj bildirimleri</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm text-gray-700">Sistem güncellemeleri</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Güvenlik Uyarısı */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Güvenlik Bilgisi</h3>
              <p className="text-blue-800 text-sm">
                Profil bilgileriniz güvenli bir şekilde saklanmaktadır. 
                Şifrenizi düzenli olarak değiştirmeyi unutmayın.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}