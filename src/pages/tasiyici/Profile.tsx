import React, { useState } from 'react';
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
  Camera, 
  Truck, 
  Award, 
  Star,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  vehicleType: string;
  vehiclePlate: string;
  experience: number;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  bio: string;
  specialties: string[];
  documents: {
    id: string;
    name: string;
    type: string;
    status: 'verified' | 'pending' | 'rejected';
    uploadDate: string;
  }[];
}

export default function TasiyiciProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Mehmet Kaya',
    email: 'mehmet.kaya@email.com',
    phone: '+90 532 123 45 67',
    address: 'İstanbul, Türkiye',
    birthDate: '1985-03-15',
    licenseNumber: 'B123456789',
    licenseType: 'B Sınıfı',
    licenseExpiry: '2025-03-15',
    vehicleType: 'Kamyon',
    vehiclePlate: '34 ABC 123',
    experience: 8,
    rating: 4.8,
    totalJobs: 156,
    completedJobs: 152,
    joinDate: '2020-01-15',
    status: 'active',
    bio: '8 yıllık deneyimli taşıyıcı. Güvenli ve zamanında teslimat konusunda uzman.',
    specialties: ['Ev Eşyası Taşıma', 'Ofis Taşıma', 'Elektronik Ürünler', 'Hassas Kargo'],
    documents: [
      {
        id: '1',
        name: 'Ehliyet',
        type: 'Kimlik',
        status: 'verified',
        uploadDate: '2024-01-01'
      },
      {
        id: '2',
        name: 'Kimlik Belgesi',
        type: 'Kimlik',
        status: 'verified',
        uploadDate: '2024-01-01'
      },
      {
        id: '3',
        name: 'Araç Ruhsatı',
        type: 'Araç',
        status: 'verified',
        uploadDate: '2024-01-02'
      },
      {
        id: '4',
        name: 'Sigorta Poliçesi',
        type: 'Araç',
        status: 'pending',
        uploadDate: '2024-01-10'
      }
    ]
  });

  const [editData, setEditData] = useState<ProfileData>(profileData);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/tasiyici/dashboard' },
    { label: 'Profil', icon: <User className="w-4 h-4" /> }
  ];

  const handleEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setProfileData(editData);
      setIsEditing(false);
      setSuccessMessage('Profil başarıyla güncellendi!');
      setShowSuccessMessage(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'suspended': return 'Askıya Alındı';
      default: return 'Bilinmiyor';
    }
  };

  const getDocumentStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Doğrulandı';
      case 'pending': return 'Beklemede';
      case 'rejected': return 'Reddedildi';
      default: return 'Bilinmiyor';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-slate-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Profil güncelleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Profil - Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Taşıyıcı profil yönetimi" />
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
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Profil</h1>
              <p className="text-sm text-slate-600">Kişisel bilgilerinizi yönetin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Düzenle</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all duration-200 text-sm font-medium"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Kaydet</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-300 transition-all duration-200 text-sm font-medium"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">İptal</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-blue-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {profileData.name.charAt(0)}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <Camera className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{profileData.name}</h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {renderStars(profileData.rating)}
                  </div>
                  <span className="text-sm text-slate-600">({profileData.rating}/5)</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(profileData.status)}`}>
                  {getStatusText(profileData.status)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Araç</p>
                    <p className="font-medium">{profileData.vehicleType} - {profileData.vehiclePlate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Deneyim</p>
                    <p className="font-medium">{profileData.experience} yıl</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Tamamlanan İş</p>
                    <p className="font-medium">{profileData.completedJobs}/{profileData.totalJobs}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Kişisel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">E-posta</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Doğum Tarihi</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{new Date(profileData.birthDate).toLocaleDateString('tr-TR')}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Adres</label>
                  {isEditing ? (
                    <textarea
                      value={editData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Mesleki Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ehliyet Numarası</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.licenseNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ehliyet Sınıfı</label>
                  {isEditing ? (
                    <select
                      value={editData.licenseType}
                      onChange={(e) => handleInputChange('licenseType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    >
                      <option value="B Sınıfı">B Sınıfı</option>
                      <option value="C Sınıfı">C Sınıfı</option>
                      <option value="D Sınıfı">D Sınıfı</option>
                    </select>
                  ) : (
                    <p className="text-slate-900">{profileData.licenseType}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ehliyet Bitiş Tarihi</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.licenseExpiry}
                      onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{new Date(profileData.licenseExpiry).toLocaleDateString('tr-TR')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Araç Plakası</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.vehiclePlate}
                      onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.vehiclePlate}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hakkımda</label>
                  {isEditing ? (
                    <textarea
                      value={editData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Uzmanlık Alanları</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Belgeler</h3>
                <button className="text-sm text-slate-600 hover:text-slate-900">Yeni Belge Yükle</button>
              </div>
              <div className="space-y-3">
                {profileData.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-sm text-slate-600">{doc.type} • {new Date(doc.uploadDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusStyle(doc.status)}`}>
                        {getDocumentStatusText(doc.status)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDocumentModal(true);
                        }}
                        className="p-1 text-slate-600 hover:text-slate-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Detail Modal */}
      {showDocumentModal && selectedDocument && (
        <Modal
          isOpen={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
          title={`Belge Detayları: ${selectedDocument.name}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Belge Adı</p>
                <p className="font-medium">{selectedDocument.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tür</p>
                <p className="font-medium">{selectedDocument.type}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="font-medium">{getDocumentStatusText(selectedDocument.status)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Yükleme Tarihi</p>
                <p className="font-medium">{new Date(selectedDocument.uploadDate).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowDocumentModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Kapat
            </button>
          </div>
        </Modal>
      )}

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