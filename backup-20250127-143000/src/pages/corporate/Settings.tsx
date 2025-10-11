import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
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
  Smartphone, 
  Monitor, 
  Moon, 
  Sun, 
  CheckCircle, 
  AlertCircle,
  Info,
  Trash2,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';

export default function CorporateSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Profile Settings
    companyName: 'Migros Ticaret A.Ş.',
    contactPerson: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@migros.com.tr',
    phone: '+90 212 555 0123',
    address: 'Atatürk Mahallesi, Turgut Özal Bulvarı No: 5, 34758 Ataşehir/İstanbul',
    taxNumber: '1234567890',
    website: 'www.migros.com.tr',
    industry: 'Perakende',
    employeeCount: '50000+',
    establishedYear: '1954',
    
    // Notification Settings
    emailNotifications: {
      newOffers: true,
      shipmentUpdates: true,
      deliveryConfirmations: true,
      paymentUpdates: true,
      systemAlerts: true,
      weeklyReports: true,
      monthlyReports: true
    },
    pushNotifications: {
      newOffers: true,
      shipmentUpdates: true,
      deliveryConfirmations: true,
      urgentAlerts: true,
      systemMaintenance: false
    },
    smsNotifications: {
      urgentAlerts: true,
      deliveryConfirmations: true,
      paymentConfirmations: true
    },
    
    // Privacy Settings
    dataSharing: {
      analytics: true,
      marketing: false,
      thirdParty: false,
      carrierData: true
    },
    profileVisibility: 'private',
    twoFactorAuth: true,
    
    // Payment Settings
    paymentMethods: {
      bankTransfer: true,
      creditCard: true,
      invoice: true,
      cash: false
    },
    autoPayment: false,
    paymentTerms: '30',
    currency: 'TRY',
    
    // Language & Region
    language: 'tr',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    currency: 'TRY',
    
    // Security Settings
    sessionTimeout: '30',
    loginAlerts: true,
    deviceManagement: true,
    apiAccess: false
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Ayarlar başarıyla kaydedildi!');
    } catch (error) {
      alert('Hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleDirectInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: <User size={20} /> },
    { id: 'notifications', label: 'Bildirimler', icon: <Bell size={20} /> },
    { id: 'privacy', label: 'Gizlilik', icon: <Shield size={20} /> },
    { id: 'payment', label: 'Ödeme', icon: <CreditCard size={20} /> },
    { id: 'language', label: 'Dil & Bölge', icon: <Globe size={20} /> },
    { id: 'security', label: 'Güvenlik', icon: <Key size={20} /> }
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Şirket Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Adı *</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleDirectInputChange('companyName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">İletişim Kişisi *</label>
            <input
              type="text"
              value={settings.contactPerson}
              onChange={(e) => handleDirectInputChange('contactPerson', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleDirectInputChange('email', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleDirectInputChange('phone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Adres *</label>
            <textarea
              value={settings.address}
              onChange={(e) => handleDirectInputChange('address', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vergi Numarası *</label>
            <input
              type="text"
              value={settings.taxNumber}
              onChange={(e) => handleDirectInputChange('taxNumber', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={settings.website}
              onChange={(e) => handleDirectInputChange('website', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sektör</label>
            <select
              value={settings.industry}
              onChange={(e) => handleDirectInputChange('industry', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Perakende">Perakende</option>
              <option value="Lojistik">Lojistik</option>
              <option value="Gıda">Gıda</option>
              <option value="Tekstil">Tekstil</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Otomotiv">Otomotiv</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Çalışan Sayısı</label>
            <select
              value={settings.employeeCount}
              onChange={(e) => handleDirectInputChange('employeeCount', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-1000">201-1000</option>
              <option value="1000+">1000+</option>
              <option value="50000+">50000+</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">E-posta Bildirimleri</h3>
        <div className="space-y-4">
          {Object.entries(settings.emailNotifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {key === 'newOffers' ? 'Yeni Teklifler' :
                   key === 'shipmentUpdates' ? 'Gönderi Güncellemeleri' :
                   key === 'deliveryConfirmations' ? 'Teslimat Onayları' :
                   key === 'paymentUpdates' ? 'Ödeme Güncellemeleri' :
                   key === 'systemAlerts' ? 'Sistem Uyarıları' :
                   key === 'weeklyReports' ? 'Haftalık Raporlar' :
                   'Aylık Raporlar'}
                </div>
                <div className="text-sm text-gray-500">
                  {key === 'newOffers' ? 'Nakliyecilerden gelen yeni teklifler için bildirim' :
                   key === 'shipmentUpdates' ? 'Gönderi durumu değişiklikleri için bildirim' :
                   key === 'deliveryConfirmations' ? 'Teslimat onayları için bildirim' :
                   key === 'paymentUpdates' ? 'Ödeme durumu güncellemeleri için bildirim' :
                   key === 'systemAlerts' ? 'Sistem uyarıları için bildirim' :
                   key === 'weeklyReports' ? 'Haftalık performans raporları için bildirim' :
                   'Aylık performans raporları için bildirim'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleInputChange('emailNotifications', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Bildirimleri</h3>
        <div className="space-y-4">
          {Object.entries(settings.pushNotifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {key === 'newOffers' ? 'Yeni Teklifler' :
                   key === 'shipmentUpdates' ? 'Gönderi Güncellemeleri' :
                   key === 'deliveryConfirmations' ? 'Teslimat Onayları' :
                   key === 'urgentAlerts' ? 'Acil Uyarılar' :
                   'Sistem Bakımı'}
                </div>
                <div className="text-sm text-gray-500">
                  {key === 'newOffers' ? 'Mobil cihazınıza anlık bildirim' :
                   key === 'shipmentUpdates' ? 'Gönderi durumu değişiklikleri için anlık bildirim' :
                   key === 'deliveryConfirmations' ? 'Teslimat onayları için anlık bildirim' :
                   key === 'urgentAlerts' ? 'Acil durumlar için anlık bildirim' :
                   'Sistem bakım duyuruları için bildirim'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleInputChange('pushNotifications', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Bildirimleri</h3>
        <div className="space-y-4">
          {Object.entries(settings.smsNotifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {key === 'urgentAlerts' ? 'Acil Uyarılar' :
                   key === 'deliveryConfirmations' ? 'Teslimat Onayları' :
                   'Ödeme Onayları'}
                </div>
                <div className="text-sm text-gray-500">
                  {key === 'urgentAlerts' ? 'Acil durumlar için SMS bildirimi' :
                   key === 'deliveryConfirmations' ? 'Teslimat onayları için SMS bildirimi' :
                   'Ödeme onayları için SMS bildirimi'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleInputChange('smsNotifications', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Veri Paylaşımı</h3>
        <div className="space-y-4">
          {Object.entries(settings.dataSharing).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {key === 'analytics' ? 'Analitik Veriler' :
                   key === 'marketing' ? 'Pazarlama Verileri' :
                   key === 'thirdParty' ? 'Üçüncü Taraf Paylaşımı' :
                   'Nakliyeci Verileri'}
                </div>
                <div className="text-sm text-gray-500">
                  {key === 'analytics' ? 'Platform performansını iyileştirmek için anonim veri paylaşımı' :
                   key === 'marketing' ? 'Pazarlama kampanyaları için veri paylaşımı' :
                   key === 'thirdParty' ? 'Üçüncü taraf hizmetlerle veri paylaşımı' :
                   'Nakliyecilerle gerekli veri paylaşımı'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleInputChange('dataSharing', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Güvenlik Ayarları</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">İki Faktörlü Kimlik Doğrulama</div>
              <div className="text-sm text-gray-500">Hesabınızı daha güvenli hale getirin</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => handleDirectInputChange('twoFactorAuth', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profil Görünürlüğü</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => handleDirectInputChange('profileVisibility', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="public">Herkese Açık</option>
              <option value="private">Özel</option>
              <option value="contacts">Sadece İletişimde Olanlar</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Yöntemleri</h3>
        <div className="space-y-4">
          {Object.entries(settings.paymentMethods).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {key === 'bankTransfer' ? 'Banka Havalesi' :
                   key === 'creditCard' ? 'Kredi Kartı' :
                   key === 'invoice' ? 'Fatura ile Ödeme' :
                   'Nakit Ödeme'}
                </div>
                <div className="text-sm text-gray-500">
                  {key === 'bankTransfer' ? 'Banka havalesi ile ödeme yapabilirsiniz' :
                   key === 'creditCard' ? 'Kredi kartı ile ödeme yapabilirsiniz' :
                   key === 'invoice' ? 'Fatura ile ödeme yapabilirsiniz' :
                   'Nakit ödeme yapabilirsiniz'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleInputChange('paymentMethods', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Ayarları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Otomatik Ödeme</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPayment}
                onChange={(e) => handleDirectInputChange('autoPayment', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Vadesi (Gün)</label>
            <select
              value={settings.paymentTerms}
              onChange={(e) => handleDirectInputChange('paymentTerms', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="0">Peşin</option>
              <option value="7">7 Gün</option>
              <option value="15">15 Gün</option>
              <option value="30">30 Gün</option>
              <option value="60">60 Gün</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
            <select
              value={settings.currency}
              onChange={(e) => handleDirectInputChange('currency', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TRY">Türk Lirası (₺)</option>
              <option value="USD">Amerikan Doları ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dil ve Bölge</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dil</label>
            <select
              value={settings.language}
              onChange={(e) => handleDirectInputChange('language', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Saat Dilimi</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleDirectInputChange('timezone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
              <option value="Europe/London">Londra (UTC+0)</option>
              <option value="Europe/Berlin">Berlin (UTC+1)</option>
              <option value="America/New_York">New York (UTC-5)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Formatı</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleDirectInputChange('dateFormat', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DD/MM/YYYY">GG/AA/YYYY</option>
              <option value="MM/DD/YYYY">AA/GG/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-AA-GG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Saat Formatı</label>
            <select
              value={settings.timeFormat}
              onChange={(e) => handleDirectInputChange('timeFormat', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="24">24 Saat</option>
              <option value="12">12 Saat (AM/PM)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Güvenlik Ayarları</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oturum Zaman Aşımı (Dakika)</label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => handleDirectInputChange('sessionTimeout', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="15">15 Dakika</option>
              <option value="30">30 Dakika</option>
              <option value="60">1 Saat</option>
              <option value="120">2 Saat</option>
              <option value="480">8 Saat</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Giriş Uyarıları</div>
              <div className="text-sm text-gray-500">Yeni cihazlardan giriş yapıldığında e-posta bildirimi</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.loginAlerts}
                onChange={(e) => handleDirectInputChange('loginAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Cihaz Yönetimi</div>
              <div className="text-sm text-gray-500">Aktif cihazları görüntüle ve yönet</div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Cihazları Görüntüle
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">API Erişimi</div>
              <div className="text-sm text-gray-500">Üçüncü taraf uygulamalar için API erişimi</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.apiAccess}
                onChange={(e) => handleDirectInputChange('apiAccess', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'payment':
        return renderPaymentSettings();
      case 'language':
        return renderLanguageSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <>
      <Helmet>
        <title>Ayarlar - YolNet Kargo</title>
        <meta name="description" content="Kurumsal hesap ayarları" />
      </Helmet>

      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
              <p className="text-gray-600">Hesap ve sistem ayarlarınızı yönetin</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
            <div className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </>
  );
}



