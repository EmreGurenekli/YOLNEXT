import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  CheckCircle,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import { createApiUrl } from '../../config/api';

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    companyName: user?.companyName || '',
    avatar: user?.avatar || '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(createApiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage('Profil başarıyla güncellendi');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      companyName: user?.companyName || '',
      avatar: user?.avatar || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return <LoadingState message='Kullanıcı bilgileri yükleniyor...' />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Profil - YolNext</title>
        <meta name='description' content='Kullanıcı profil sayfası' />
      </Helmet>

      <div className='max-w-4xl mx-auto p-6'>
        <Breadcrumb
          items={[
            { label: 'Ana Sayfa', href: '/individual/dashboard' },
            { label: 'Profil' },
          ]}
        />

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>
              Profil Bilgileri
            </h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-blue-900 hover:to-slate-800 transition-colors'
              >
                <Edit className='w-4 h-4' />
                Düzenle
              </button>
            ) : (
              <div className='flex gap-2'>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors'
                >
                  <Save className='w-4 h-4' />
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={handleCancel}
                  className='flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
                >
                  <X className='w-4 h-4' />
                  İptal
                </button>
              </div>
            )}
          </div>

          {successMessage && (
            <SuccessMessage
              message={successMessage}
              isVisible={!!successMessage}
              onClose={() => setSuccessMessage('')}
            />
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Avatar Section */}
            <div className='md:col-span-2 flex flex-col items-center mb-6'>
              <div className='relative'>
                <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center'>
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt='Avatar'
                      className='w-24 h-24 rounded-full object-cover'
                    />
                  ) : (
                    <User className='w-12 h-12 text-gray-400' />
                  )}
                </div>
                {isEditing && (
                  <button className='absolute bottom-0 right-0 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-full p-2 hover:from-blue-900 hover:to-slate-800 transition-colors'>
                    <Camera className='w-4 h-4' />
                  </button>
                )}
              </div>
              <h2 className='text-xl font-semibold text-gray-900 mt-4'>
                {formData.fullName || 'Ad Soyad'}
              </h2>
              <p className='text-gray-600'>{formData.email}</p>
            </div>

            {/* Personal Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                <User className='w-5 h-5' />
                Kişisel Bilgiler
              </h3>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Ad Soyad
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='fullName'
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                ) : (
                  <p className='text-gray-900'>
                    {formData.fullName || 'Belirtilmemiş'}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  E-posta
                </label>
                <div className='flex items-center gap-2'>
                  <Mail className='w-4 h-4 text-gray-400' />
                  <p className='text-gray-900'>{formData.email}</p>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Telefon
                </label>
                {isEditing ? (
                  <input
                    type='tel'
                    name='phone'
                    value={formData.phone}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                ) : (
                  <div className='flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-gray-400' />
                    <p className='text-gray-900'>
                      {formData.phone || 'Belirtilmemiş'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                Adres Bilgileri
              </h3>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Adres
                </label>
                {isEditing ? (
                  <textarea
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                ) : (
                  <div className='flex items-start gap-2'>
                    <MapPin className='w-4 h-4 text-gray-400 mt-1' />
                    <p className='text-gray-900'>
                      {formData.address || 'Belirtilmemiş'}
                    </p>
                  </div>
                )}
              </div>

              {user.panel_type === 'corporate' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Şirket Adı
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      name='companyName'
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  ) : (
                    <p className='text-gray-900'>
                      {formData.companyName || 'Belirtilmemiş'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className='mt-8 pt-6 border-t border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4'>
              <Shield className='w-5 h-5' />
              Güvenlik
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <h4 className='font-medium text-gray-900'>Şifre</h4>
                <p className='text-sm text-gray-600'>
                  Son güncelleme: 3 ay önce
                </p>
                <button className='mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium'>
                  Şifreyi Değiştir
                </button>
              </div>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <h4 className='font-medium text-gray-900'>
                  İki Faktörlü Doğrulama
                </h4>
                <p className='text-sm text-gray-600'>Aktif değil</p>
                <button className='mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium'>
                  Etkinleştir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}











