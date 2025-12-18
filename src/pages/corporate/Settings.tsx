import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Save,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Building2,
  MapPin,
  Calendar,
  Users,
  Key,
  Lock,
  Upload,
  Download,
  RefreshCw,
  Clock,
  Truck,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Info,
  Camera,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { createApiUrl } from '../../config/api';
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

export default function CorporateSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Profile Settings
    companyName: 'ABC Teknoloji A.Ş.',
    contactPerson: 'Mehmet Demir',
    email: 'mehmet.demir@abcteknoloji.com',
    phone: '+90 212 555 0123',
    address:
      'Maslak Mahallesi, Büyükdere Caddesi No: 123, 34485 Sarıyer/İstanbul',
    taxNumber: '1234567890',
    website: 'www.abcteknoloji.com',
    industry: 'Teknoloji',
    employeeCount: '500-1000',
    establishedYear: '2010',
    companyLogo: '',

    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    shipmentUpdates: true,
    carrierMessages: true,
    systemAlerts: true,
    marketingEmails: false,

    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: '30',
    loginAlerts: true,

    // Preferences
    language: 'tr',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
    currency: 'TRY',
    theme: 'light',

    // Contact Preferences
    preferredContactTime: '09:00-18:00',
    contactMethod: 'email',
    emergencyContact: '+90 212 555 9999',

    // Shipment Preferences
    defaultShipmentType: 'general_cargo',
    defaultWeight: '1000',
    defaultVolume: '5',
    autoAcceptOffers: false,
    preferredCarriers: [],

    // Invoice Settings
    invoiceEmail: 'fatura@abcteknoloji.com',
    invoiceFormat: 'pdf',
    autoInvoice: true,
    taxIncluded: true,
  });

  const tabs = [
    { id: 'profile', name: 'Profil', icon: <User className='w-5 h-5' /> },
    { id: 'shipment', name: 'Gönderi', icon: <Truck className='w-5 h-5' /> },
    { id: 'invoice', name: 'Fatura', icon: <FileText className='w-5 h-5' /> },
  ];

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        handleInputChange('companyLogo', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfileTab = () => (
    <div className='space-y-8'>
      {/* Company Logo */}
      <div className='bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-200'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
            <Camera className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-slate-900'>Şirket Logosu</h3>
            <p className='text-slate-600'>Şirketinizin logosunu yükleyin</p>
          </div>
        </div>

        <div className='flex items-center gap-6'>
          <div className='w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden'>
            {settings.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt='Company Logo'
                className='w-full h-full object-cover'
              />
            ) : (
              <ImageIcon className='w-8 h-8 text-slate-400' />
            )}
          </div>

          <div className='flex-1'>
            <input
              type='file'
              accept='image/*'
              onChange={handleLogoUpload}
              className='hidden'
              id='logo-upload'
            />
            <label
              htmlFor='logo-upload'
              className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all cursor-pointer'
            >
              <Upload className='w-4 h-4' />
              Logo Yükle
            </label>
            <p className='text-sm text-slate-500 mt-2'>
              PNG, JPG veya SVG formatında, max 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className='bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-200'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
            <Building2 className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-slate-900'>
              Şirket Bilgileri
            </h3>
            <p className='text-slate-600'>
              Temel şirket bilgilerinizi güncelleyin
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Şirket Adı *
            </label>
            <input
              type='text'
              value={settings.companyName}
              onChange={e => handleInputChange('companyName', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              İletişim Kişisi *
            </label>
            <input
              type='text'
              value={settings.contactPerson}
              onChange={e => handleInputChange('contactPerson', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              E-posta *
            </label>
            <input
              type='email'
              value={settings.email}
              onChange={e => handleInputChange('email', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Telefon *
            </label>
            <input
              type='tel'
              value={settings.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2 md:col-span-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Adres *
            </label>
            <textarea
              value={settings.address}
              onChange={e => handleInputChange('address', e.target.value)}
              rows={3}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Vergi Numarası *
            </label>
            <input
              type='text'
              value={settings.taxNumber}
              onChange={e => handleInputChange('taxNumber', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Website
            </label>
            <input
              type='url'
              value={settings.website}
              onChange={e => handleInputChange('website', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className='bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-200'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
            <Info className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-slate-900'>İş Bilgileri</h3>
            <p className='text-slate-600'>
              Şirketinizin iş profilini tanımlayın
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Sektör *
            </label>
            <select
              value={settings.industry}
              onChange={e => handleInputChange('industry', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            >
              <option value='Teknoloji'>Teknoloji</option>
              <option value='Perakende'>Perakende</option>
              <option value='Üretim'>Üretim</option>
              <option value='Lojistik'>Lojistik</option>
              <option value='E-ticaret'>E-ticaret</option>
              <option value='Diğer'>Diğer</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Çalışan Sayısı
            </label>
            <select
              value={settings.employeeCount}
              onChange={e => handleInputChange('employeeCount', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            >
              <option value='1-10'>1-10</option>
              <option value='11-50'>11-50</option>
              <option value='51-200'>51-200</option>
              <option value='201-500'>201-500</option>
              <option value='500-1000'>500-1000</option>
              <option value='1000+'>1000+</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Kuruluş Yılı
            </label>
            <input
              type='number'
              value={settings.establishedYear}
              onChange={e =>
                handleInputChange('establishedYear', e.target.value)
              }
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 border-2 border-red-200 mt-8'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center'>
            <AlertCircle className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-red-900'>
              Tehlikeli Bölge
            </h3>
            <p className='text-red-700'>
              Hesap silme işlemi geri alınamaz
            </p>
          </div>
        </div>

        <div className='bg-white rounded-xl p-6 border-2 border-red-200'>
          <h4 className='font-semibold text-red-900 mb-2 text-lg'>Hesabı Sil</h4>
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
                        setIsSaving(true);
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
                        setIsSaving(false);
                      }
                    }
                  }
                }}
                disabled={isSaving}
            className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
              >
                {isSaving ? 'Siliniyor...' : 'Hesabımı Sil'}
              </button>
        </div>
      </div>
    </div>
  );

  // Removed renderNotificationsTab, renderSecurityTab, and renderPreferencesTab functions

  const renderShipmentTab = () => (
    <div className='space-y-8'>
      <div className='bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-200'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
            <Truck className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-slate-900'>
              Gönderi Tercihleri
            </h3>
            <p className='text-slate-600'>
              Varsayılan gönderi ayarlarınızı belirleyin
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Varsayılan Yük Türü
            </label>
            <select
              value={settings.defaultShipmentType}
              onChange={e =>
                handleInputChange('defaultShipmentType', e.target.value)
              }
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            >
              <option value='general_cargo'>Genel Kargo</option>
              <option value='vehicle'>Araç Taşımacılığı</option>
              <option value='furniture'>Mobilya & Ev Eşyası</option>
              <option value='food'>Gıda & Soğuk Zincir</option>
              <option value='chemical'>Kimyasal & İlaç</option>
              <option value='construction'>İnşaat & Yapı Malzemesi</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Varsayılan Ağırlık
            </label>
            <input
              type='number'
              value={settings.defaultWeight}
              onChange={e => handleInputChange('defaultWeight', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Varsayılan Hacim (m³)
            </label>
            <input
              type='number'
              value={settings.defaultVolume}
              onChange={e => handleInputChange('defaultVolume', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Otomatik Teklif Kabulü
            </label>
            <div className='flex items-center gap-3'>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.autoAcceptOffers}
                  onChange={e =>
                    handleInputChange('autoAcceptOffers', e.target.checked)
                  }
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-slate-800 peer-checked:to-blue-900"></div>
              </label>
              <span className='text-sm text-slate-600'>
                En uygun teklifi otomatik kabul et
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 border-2 border-red-200 mt-8'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center'>
            <AlertCircle className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-red-900'>
              Tehlikeli Bölge
            </h3>
            <p className='text-red-700'>
              Hesap silme işlemi geri alınamaz
            </p>
          </div>
        </div>

        <div className='bg-white rounded-xl p-6 border-2 border-red-200'>
          <h4 className='font-semibold text-red-900 mb-2 text-lg'>Hesabı Sil</h4>
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
                    setIsSaving(true);
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
                    setIsSaving(false);
                  }
                }
              }
            }}
            disabled={isSaving}
            className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
          >
            {isSaving ? 'Siliniyor...' : 'Hesabımı Sil'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderInvoiceTab = () => (
    <div className='space-y-8'>
      <div className='bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-200'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
            <FileText className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-slate-900'>
              Fatura Ayarları
            </h3>
            <p className='text-slate-600'>Fatura tercihlerinizi yönetin</p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Fatura E-posta Adresi
            </label>
            <input
              type='email'
              value={settings.invoiceEmail}
              onChange={e => handleInputChange('invoiceEmail', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            />
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Fatura Formatı
            </label>
            <select
              value={settings.invoiceFormat}
              onChange={e => handleInputChange('invoiceFormat', e.target.value)}
              className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
            >
              <option value='pdf'>PDF</option>
              <option value='xml'>XML</option>
              <option value='excel'>Excel</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              Otomatik Fatura
            </label>
            <div className='flex items-center gap-3'>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.autoInvoice}
                  onChange={e =>
                    handleInputChange('autoInvoice', e.target.checked)
                  }
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-slate-800 peer-checked:to-blue-900"></div>
              </label>
              <span className='text-sm text-slate-600'>
                Gönderi tamamlandığında otomatik fatura oluştur
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-semibold text-slate-700'>
              KDV Dahil
            </label>
            <div className='flex items-center gap-3'>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.taxIncluded}
                  onChange={e =>
                    handleInputChange('taxIncluded', e.target.checked)
                  }
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-slate-800 peer-checked:to-blue-900"></div>
              </label>
              <span className='text-sm text-slate-600'>
                Fiyatlarda KDV dahil göster
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 border-2 border-red-200 mt-8'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center'>
            <AlertCircle className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-red-900'>
              Tehlikeli Bölge
            </h3>
            <p className='text-red-700'>
              Hesap silme işlemi geri alınamaz
            </p>
          </div>
        </div>

        <div className='bg-white rounded-xl p-6 border-2 border-red-200'>
          <h4 className='font-semibold text-red-900 mb-2 text-lg'>Hesabı Sil</h4>
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
                    setIsSaving(true);
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
                    setIsSaving(false);
                  }
                }
              }
            }}
            disabled={isSaving}
            className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
          >
            {isSaving ? 'Siliniyor...' : 'Hesabımı Sil'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Hesap Ayarları - YolNext Kurumsal</title>
        <meta
          name='description'
          content='Kurumsal hesap ayarlarınızı yönetin'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          {/* Professional Header */}
          <div className='text-center mb-12'>
            <div className='flex justify-center mb-6'>
              <div className='w-20 h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center shadow-2xl'>
                <SettingsIcon className='w-10 h-10 text-white' />
              </div>
            </div>
            <h1 className='text-5xl md:text-6xl font-bold text-slate-900 mb-4'>
              Hesap{' '}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
                Ayarları
              </span>
            </h1>
            <p className='text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed'>
              Kurumsal hesap ayarlarınızı yönetin ve platformu ihtiyaçlarınıza
              göre özelleştirin
            </p>
          </div>

          {/* Main Content */}
          <div className='bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden'>
            {/* Professional Action Bar */}
            <div className='bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-8 py-6'>
              <div className='flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center'>
                <div className='flex items-center gap-4'>
                  <div>
                    <h2 className='text-2xl font-bold text-slate-900'>
                      Ayarlar Merkezi
                    </h2>
                    <p className='text-slate-600'>
                      Hesap ve platform ayarlarınızı yönetin
                    </p>
                  </div>
                  <div className='hidden lg:block w-px h-12 bg-slate-300'></div>
                  <div className='flex items-center gap-2 text-sm text-slate-500'>
                    <Clock className='w-4 h-4' />
                    Son güncelleme: {new Date().toLocaleString('tr-TR')}
                  </div>
                </div>

                <div className='flex flex-wrap gap-3'>
                  <button
                    onClick={handleReset}
                    className='flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors'
                  >
                    <RefreshCw className='w-4 h-4' />
                    Sıfırla
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className='flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
                  >
                    {isSaving ? (
                      <RefreshCw className='w-4 h-4 animate-spin' />
                    ) : (
                      <Save className='w-4 h-4' />
                    )}
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>

            <div className='flex'>
              {/* Sidebar */}
              <div className='w-80 border-r border-slate-200 bg-slate-50'>
                <nav className='p-6'>
                  <div className='space-y-2'>
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg'
                            : 'text-slate-700 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        {tab.icon}
                        <span className='font-medium'>{tab.name}</span>
                      </button>
                    ))}
                  </div>
                </nav>
              </div>

              {/* Content */}
              <div className='flex-1 p-8'>
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'shipment' && renderShipmentTab()}
                {activeTab === 'invoice' && renderInvoiceTab()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
