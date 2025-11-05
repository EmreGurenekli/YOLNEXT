import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Building2,
  Truck,
  UserCheck,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle,
  Shield,
  Clock,
  Globe,
  Star,
  AlertTriangle,
  Loader2,
  XCircle,
} from 'lucide-react';
import YolNextLogo from '../components/common/yolnextLogo';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'verifying' | 'verified' | 'rejected'
  >('pending');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeType, setCodeType] = useState<'email' | 'phone' | null>(null);
  const [formData, setFormData] = useState({
    // Temel bilgiler (tüm kullanıcılar için)
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'individual',

    // Kurumsal bilgiler (Kurumsal Gönderici + Nakliyeci)
    companyName: '',
    taxNumber: '',
    companyAddress: '',
    companyPhone: '',

    // Nakliyeci özel bilgiler
    licenseNumber: '',
    vehicleCount: '',
    serviceAreas: '',

    // Taşıyıcı özel bilgiler (kaldırıldı: driverLicenseNumber, vehicleType, vehiclePlate, experienceYears)

    // Bireysel özel bilgiler
    address: '',
    city: '',
    district: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Gerçek zamanlı doğrulama
    if (name === 'email' && value) {
      verifyEmail(value).then(isValid => {
        if (!isValid) {
          setError('Geçersiz e-posta formatı');
        } else {
          setError('');
        }
      });
    }

    if (name === 'phone' && value) {
      verifyPhoneNumber(value).then(isValid => {
        if (!isValid) {
          setError('Geçersiz telefon numarası formatı');
        } else {
          setError('');
        }
      });
    }

    if (name === 'taxNumber' && value) {
      verifyTaxNumber(value).then(isValid => {
        if (!isValid) {
          setError('Geçersiz vergi numarası');
        } else {
          setError('');
        }
      });
    }

    // Kaldırıldı: driverLicenseNumber validation
    if (false && name === 'driverLicenseNumber' && value) {
      verifyDriverLicense(value).then(isValid => {
        if (!isValid) {
          setError('Geçersiz ehliyet numarası (11 haneli olmalı)');
        } else {
          setError('');
        }
      });
    }
  };

  // Her kullanıcı tipi için gerekli alanları belirle
  const getRequiredFields = (userType: string) => {
    const baseFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'password',
      'confirmPassword',
    ];

    switch (userType) {
      case 'individual':
        return [...baseFields, 'address', 'city', 'district'];
      case 'corporate':
        return [
          ...baseFields,
          'companyName',
          'taxNumber',
          'companyAddress',
          'companyPhone',
        ];
      case 'nakliyeci':
        return [
          ...baseFields,
          'companyName',
          'taxNumber',
          'companyAddress',
          'companyPhone',
          'licenseNumber',
          'vehicleCount',
          'serviceAreas',
        ];
      case 'tasiyici':
        return [
          ...baseFields,
          // Kaldırıldı: 'driverLicenseNumber', 'vehicleType', 'vehiclePlate', 'experienceYears',
          'address',
          'city',
        ];
      default:
        return baseFields;
    }
  };

  // Evrak doğrulama fonksiyonları
  const verifyTaxNumber = async (taxNumber: string) => {
    // 1. Format kontrolü
    if (taxNumber.length !== 10) return false;

    // 2. Algoritma kontrolü
    const digits = taxNumber.split('').map(Number);
    const checkDigit = digits[9];
    const sum = digits.slice(0, 9).reduce((acc, digit, index) => {
      const temp = (digit + (9 - index)) % 10;
      return acc + (temp === 0 ? 0 : (temp * Math.pow(2, 9 - index)) % 9);
    }, 0);

    const isValidFormat = (10 - (sum % 10)) % 10 === checkDigit;
    if (!isValidFormat) return false;

    // 3. GERÇEK DOĞRULAMA - API çağrısı (şirket adı ile)
    try {
      const response = await fetch('/api/verify/tax-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxNumber,
          companyName: formData.companyName,
        }),
      });

      const result = await response.json();

      if (result.isValid && result.companyInfo) {
        // Gerçek şirket bilgilerini göster
        setVerificationMessage(
          `✅ Doğrulandı: ${result.companyInfo.unvan} - ${result.companyInfo.adres}`
        );
      } else if (result.verificationDetails) {
        // Doğrulama detaylarını göster
        const { maliye, ticaret } = result.verificationDetails;
        if (maliye && ticaret) {
          setVerificationMessage(
            `❌ Doğrulama başarısız: Maliye: ${maliye.found ? '✅' : '❌'}, Ticaret: ${ticaret.active ? '✅' : '❌'}`
          );
        }
      }

      return result.isValid; // API'den gelen gerçek sonuç
    } catch (error) {
      console.error('Vergi numarası doğrulama hatası:', error);
      return false; // API hatası durumunda güvenli tarafta kal
    }
  };

  const verifyDriverLicense = async (licenseNumber: string) => {
    // 1. Format kontrolü
    if (!/^\d{11}$/.test(licenseNumber)) return false;

    // 2. GERÇEK DOĞRULAMA - API çağrısı (ad-soyad ile)
    try {
      const response = await fetch('/api/verify/driver-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const result = await response.json();

      if (result.isValid && result.driverInfo) {
        // Gerçek sürücü bilgilerini göster
        setVerificationMessage(
          `✅ Doğrulandı: ${result.driverInfo.ad} ${result.driverInfo.soyad} - ${result.driverInfo.ehliyetSinifi}`
        );
      } else if (result.verificationDetails) {
        // Doğrulama detaylarını göster
        const { icisleri, nvi } = result.verificationDetails;
        if (icisleri && nvi) {
          setVerificationMessage(
            `❌ Doğrulama başarısız: İçişleri: ${icisleri.found ? '✅' : '❌'}, NVI: ${nvi.found ? '✅' : '❌'}`
          );
        }
      }

      return result.isValid; // API'den gelen gerçek sonuç
    } catch (error) {
      console.error('Ehliyet doğrulama hatası:', error);
      return false;
    }
  };

  const verifyPhoneNumber = async (phone: string) => {
    // 1. Format kontrolü
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^(\+90|0)?[5][0-9]{9}$/.test(cleanPhone)) return false;

    // 2. GERÇEK DOĞRULAMA - SMS doğrulama
    try {
      const response = await fetch('/api/verify/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const result = await response.json();

      if (result.requiresCode) {
        setShowCodeInput(true);
        setCodeType('phone');
        setVerificationMessage(
          'Telefon numaranıza SMS doğrulama kodu gönderildi'
        );
        return false; // Kod gerekli, henüz doğrulanmadı
      }

      return result.isValid; // SMS doğrulama sonucu
    } catch (error) {
      console.error('Telefon doğrulama hatası:', error);
      return false;
    }
  };

  const verifyEmail = async (email: string) => {
    // 1. Format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // 2. GERÇEK DOĞRULAMA - E-posta doğrulama
    try {
      const response = await fetch('/api/verify/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.requiresCode) {
        setShowCodeInput(true);
        setCodeType('email');
        setVerificationMessage('E-posta adresinize doğrulama kodu gönderildi');
        return false; // Kod gerekli, henüz doğrulanmadı
      }

      return result.isValid; // E-posta doğrulama sonucu
    } catch (error) {
      console.error('E-posta doğrulama hatası:', error);
      return false;
    }
  };

  // Doğrulama kodu kontrolü
  const verifyCode = async () => {
    if (!verificationCode || !codeType) return false;

    try {
      const endpoint =
        codeType === 'email'
          ? '/api/verify/email/verify-code'
          : '/api/verify/phone/verify-code';
      const data =
        codeType === 'email'
          ? { email: formData.email, code: verificationCode }
          : { phone: formData.phone, code: verificationCode };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.isValid) {
        setShowCodeInput(false);
        setCodeType(null);
        setVerificationCode('');
        setVerificationStatus('verified');
        setVerificationMessage(
          `${codeType === 'email' ? 'E-posta' : 'Telefon'} doğrulandı!`
        );
        return true;
      } else {
        setError(result.error || 'Geçersiz doğrulama kodu');
        return false;
      }
    } catch (error) {
      console.error('Kod doğrulama hatası:', error);
      setError('Kod doğrulama sırasında hata oluştu');
      return false;
    }
  };

  // Evrak doğrulama sistemi
  const verifyDocuments = async () => {
    setVerificationStatus('verifying');
    setVerificationMessage('Evraklar doğrulanıyor...');

    try {
      const errors = [];

      // E-posta doğrulama
      if (!(await verifyEmail(formData.email))) {
        errors.push('Geçersiz e-posta formatı');
      }

      // Telefon doğrulama
      if (!(await verifyPhoneNumber(formData.phone))) {
        errors.push('Geçersiz telefon numarası formatı');
      }

      // Kullanıcı tipine göre özel doğrulamalar
      if (
        formData.userType === 'corporate' ||
        formData.userType === 'nakliyeci'
      ) {
        if (!(await verifyTaxNumber(formData.taxNumber))) {
          errors.push('Geçersiz vergi numarası');
        }
      }

      // Kaldırıldı: Driver license verification for tasiyici
      // if (formData.userType === 'tasiyici') {
      //   if (!(await verifyDriverLicense(formData.driverLicenseNumber))) {
      //     errors.push('Geçersiz ehliyet numarası (11 haneli olmalı)');
      //   }
      // }

      if (errors.length > 0) {
        setVerificationStatus('rejected');
        setVerificationMessage(`Doğrulama hatası: ${errors.join(', ')}`);
        return false;
      }

      setVerificationStatus('verified');
      setVerificationMessage('Tüm evraklar doğrulandı!');
      return true;
    } catch (error) {
      setVerificationStatus('rejected');
      setVerificationMessage('Doğrulama sırasında hata oluştu');
      return false;
    }
  };

  // Form validasyonu
  const validateForm = () => {
    const requiredFields = getRequiredFields(formData.userType);
    const missingFields = requiredFields.filter(
      field => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      setError(
        `Lütfen tüm gerekli alanları doldurun: ${missingFields.join(', ')}`
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setVerificationStatus('pending');

    // Form validasyonu
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    // Evrak doğrulama
    const isVerified = await verifyDocuments();
    if (!isVerified) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(formData);

      if (result.success && result.user) {
        // Redirect based on user type
        switch (formData.userType) {
          case 'individual':
            navigate('/individual/dashboard');
            break;
          case 'corporate':
            navigate('/corporate/dashboard');
            break;
          case 'nakliyeci':
            navigate('/nakliyeci/dashboard');
            break;
          case 'tasiyici':
            navigate('/tasiyici/dashboard');
            break;
          default:
            navigate('/individual/dashboard');
        }
      } else {
        setError(result.error || 'Kayıt başarısız');
      }
    } catch (error: any) {
      setError('Kayıt başarısız. Lütfen tekrar deneyin.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Kayıt Ol - YolNext | Tamamen Ücretsiz Lojistik Platformu</title>
        <meta
          name='description'
          content='YolNext platformuna ücretsiz kayıt olun. %0 üyelik ücreti, sadece nakliyeci %1 komisyon öder. 4 kullanıcı tipi, 81 il kapsamı.'
        />
        <meta
          name='keywords'
          content='kayıt ol, register, lojistik, kargo, ücretsiz, YolNext'
        />
      </Helmet>

      <div className='min-h-screen flex'>
        {/* Left Side - Branding */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10 flex flex-col justify-center px-12 text-white'>
            <div className='flex items-center mb-8'>
              <YolNextLogo variant='banner' className='text-white h-12' />
            </div>

            <h1 className='text-4xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
              YolNext Ailesine Katılın
            </h1>

            <p className='text-xl text-slate-200 mb-8 leading-relaxed'>
              4 farklı kullanıcı tipi için özel tasarlanmış, 81 ilde hizmet
              veren
              <br />
              <span className='text-blue-300 font-semibold'>
                tamamen ücretsiz
              </span>{' '}
              lojistik platformu.
            </p>

            {/* Ücretsiz Kullanım Vurgusu */}
            <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-white mb-2'>
                  🎉 TAMAMEN ÜCRETSİZ
                </div>
                <div className='text-white/90 text-lg'>
                  <span className='font-bold'>%0 üyelik ücreti</span> •
                  <span className='font-bold'>%0 gönderi ücreti</span> •
                  <span className='font-bold'>%0 gizli ücret</span>
                </div>
                <div className='text-white/80 text-sm mt-2'>
                  Sadece nakliyeci %1 komisyon öder, diğer her şey ücretsiz!
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-6'>
              <div className='flex items-center gap-3'>
                <CheckCircle className='w-6 h-6 text-green-400' />
                <span className='text-slate-200'>30,550+ Kullanıcı</span>
              </div>
              <div className='flex items-center gap-3'>
                <Shield className='w-6 h-6 text-blue-400' />
                <span className='text-slate-200'>%99.9 Memnuniyet</span>
              </div>
              <div className='flex items-center gap-3'>
                <Clock className='w-6 h-6 text-yellow-400' />
                <span className='text-slate-200'>2 Gün Teslimat</span>
              </div>
              <div className='flex items-center gap-3'>
                <Globe className='w-6 h-6 text-green-400' />
                <span className='text-slate-200'>81 İl Kapsamı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className='w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white'>
          <div className='w-full max-w-md'>
            {/* Mobile Logo */}
            <div className='lg:hidden flex items-center justify-center mb-8'>
              <YolNextLogo variant='banner' className='text-gray-900 h-10' />
            </div>

            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Hesap Oluştur
              </h1>
              <p className='text-gray-600'>
                YolNext platformuna ücretsiz katılın
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Error Message */}
              {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              {/* Evrak Doğrulama Durumu */}
              {verificationStatus !== 'pending' && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
                    verificationStatus === 'verified'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : verificationStatus === 'verifying'
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {verificationStatus === 'verified' && (
                    <CheckCircle className='w-5 h-5' />
                  )}
                  {verificationStatus === 'verifying' && (
                    <Loader2 className='w-5 h-5 animate-spin' />
                  )}
                  {verificationStatus === 'rejected' && (
                    <XCircle className='w-5 h-5' />
                  )}
                  {verificationMessage}
                </div>
              )}

              {/* Doğrulama Kodu Girişi */}
              {showCodeInput && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-blue-900 mb-2'>
                    {codeType === 'email' ? 'E-posta' : 'SMS'} Doğrulama Kodu
                  </h4>
                  <p className='text-sm text-blue-700 mb-3'>
                    {codeType === 'email'
                      ? `${formData.email} adresine gönderilen 6 haneli kodu girin`
                      : `${formData.phone} numarasına gönderilen 6 haneli kodu girin`}
                  </p>
                  <div className='flex gap-2'>
                    <label htmlFor='verificationCode' className='sr-only'>
                      Doğrulama Kodu
                    </label>
                    <input
                      id='verificationCode'
                      type='text'
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value)}
                      placeholder='123456'
                      aria-label='Doğrulama Kodu'
                      className='flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                      maxLength={6}
                    />
                    <button
                      type='button'
                      onClick={verifyCode}
                      disabled={verificationCode.length !== 6}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700'
                    >
                      Doğrula
                    </button>
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      setShowCodeInput(false);
                      setCodeType(null);
                      setVerificationCode('');
                    }}
                    className='mt-2 text-xs text-blue-600 hover:text-blue-800'
                  >
                    İptal
                  </button>
                </div>
              )}

              {/* User Type Selection */}
              <div className='space-y-3'>
                <label className='text-gray-700 text-sm font-medium'>
                  Kullanıcı Tipi
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() =>
                      setFormData(prev => ({ ...prev, userType: 'individual' }))
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                      formData.userType === 'individual'
                        ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className='w-4 h-4' />
                    Bireysel
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setFormData(prev => ({ ...prev, userType: 'corporate' }))
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                      formData.userType === 'corporate'
                        ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Building2 className='w-4 h-4' />
                    Kurumsal
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setFormData(prev => ({ ...prev, userType: 'nakliyeci' }))
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                      formData.userType === 'nakliyeci'
                        ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Truck className='w-4 h-4' />
                    Nakliyeci
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setFormData(prev => ({ ...prev, userType: 'tasiyici' }))
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                      formData.userType === 'tasiyici'
                        ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <UserCheck className='w-4 h-4' />
                    Taşıyıcı
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-gray-700 text-sm font-medium'>
                    Ad
                  </label>
                  <input
                    type='text'
                    name='firstName'
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Adınız'
                    required
                  />
                </div>
                <div>
                  <label htmlFor='lastName' className='text-gray-700 text-sm font-medium'>
                    Soyad
                  </label>
                  <input
                    id='lastName'
                    type='text'
                    name='lastName'
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Soyadınız'
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor='email' className='text-gray-700 text-sm font-medium'>
                  E-posta
                </label>
                <input
                  id='email'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='ornek@email.com'
                  required
                  aria-label='E-posta adresi'
                />
              </div>

              <div>
                <label htmlFor='phone' className='text-gray-700 text-sm font-medium'>
                  Telefon
                </label>
                <input
                  id='phone'
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='+90 555 123 4567'
                  required
                  aria-label='Telefon numarası'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label htmlFor='password' className='text-gray-700 text-sm font-medium'>
                    Şifre
                  </label>
                  <input
                    id='password'
                    type='password'
                    name='password'
                    value={formData.password}
                    onChange={handleInputChange}
                    className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='••••••••'
                    required
                    aria-label='Şifre'
                  />
                </div>
                <div>
                  <label htmlFor='confirmPassword' className='text-gray-700 text-sm font-medium'>
                    Şifre Tekrar
                  </label>
                  <input
                    id='confirmPassword'
                    type='password'
                    name='confirmPassword'
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='••••••••'
                    required
                    aria-label='Şifre tekrar'
                  />
                </div>
              </div>

              {/* Bireysel Gönderici Alanları */}
              {formData.userType === 'individual' && (
                <>
                  <div>
                    <label className='text-gray-700 text-sm font-medium'>
                      Adres
                    </label>
                    <textarea
                      name='address'
                      value={formData.address}
                      onChange={handleInputChange}
                      className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Tam adresinizi girin'
                      rows={3}
                      required
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Şehir
                      </label>
                      <input
                        type='text'
                        name='city'
                        value={formData.city}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='İstanbul'
                        required
                      />
                    </div>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        İlçe
                      </label>
                      <input
                        type='text'
                        name='district'
                        value={formData.district}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Kadıköy'
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Kurumsal Gönderici Alanları */}
              {formData.userType === 'corporate' && (
                <>
                  <div>
                    <label className='text-gray-700 text-sm font-medium'>
                      Şirket Adı
                    </label>
                    <input
                      type='text'
                      name='companyName'
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Şirket Adı'
                      required
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Vergi Numarası
                      </label>
                      <input
                        type='text'
                        name='taxNumber'
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='1234567890'
                        required
                      />
                    </div>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Şirket Telefonu
                      </label>
                      <input
                        type='tel'
                        name='companyPhone'
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='+90 212 123 4567'
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className='text-gray-700 text-sm font-medium'>
                      Şirket Adresi
                    </label>
                    <textarea
                      name='companyAddress'
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Şirket adresini girin'
                      rows={3}
                      required
                    />
                  </div>
                </>
              )}

              {/* Nakliyeci Alanları */}
              {formData.userType === 'nakliyeci' && (
                <>
                  <div>
                    <label className='text-gray-700 text-sm font-medium'>
                      Şirket Adı
                    </label>
                    <input
                      type='text'
                      name='companyName'
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Nakliye Şirketi Adı'
                      required
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Vergi Numarası
                      </label>
                      <input
                        type='text'
                        name='taxNumber'
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='1234567890'
                        required
                      />
                    </div>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Şirket Telefonu
                      </label>
                      <input
                        type='tel'
                        name='companyPhone'
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='+90 212 123 4567'
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className='text-gray-700 text-sm font-medium'>
                      Şirket Adresi
                    </label>
                    <textarea
                      name='companyAddress'
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Şirket adresini girin'
                      rows={3}
                      required
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Nakliye Lisans No
                      </label>
                      <input
                        type='text'
                        name='licenseNumber'
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='NL123456789'
                        required
                      />
                    </div>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Araç Sayısı
                      </label>
                      <input
                        type='number'
                        name='vehicleCount'
                        value={formData.vehicleCount}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='5'
                        min='1'
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className='text-gray-700 text-sm font-medium'>
                      Hizmet Verilen Bölgeler
                    </label>
                    <input
                      type='text'
                      name='serviceAreas'
                      value={formData.serviceAreas}
                      onChange={handleInputChange}
                      className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='İstanbul, Ankara, İzmir (virgülle ayırın)'
                      required
                    />
                  </div>
                </>
              )}

              {/* Taşıyıcı Alanları */}
              {formData.userType === 'tasiyici' && (
                <>
                  <div>
                    <label className='text-gray-700 text-sm font-medium'>
                      Adres
                    </label>
                    <textarea
                      name='address'
                      value={formData.address}
                      onChange={handleInputChange}
                      className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Tam adresinizi girin'
                      rows={3}
                      required
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        Şehir
                      </label>
                      <input
                        type='text'
                        name='city'
                        value={formData.city}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='İstanbul'
                        required
                      />
                    </div>
                    <div>
                      <label className='text-gray-700 text-sm font-medium'>
                        İlçe
                      </label>
                      <input
                        type='text'
                        name='district'
                        value={formData.district}
                        onChange={handleInputChange}
                        className='w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Kadıköy'
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isLoading}
                className='w-full bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2'
              >
                {isLoading ? (
                  <div className='flex items-center'>
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                    Oluşturuluyor...
                  </div>
                ) : (
                  <>
                    Hesap Oluştur
                    <ArrowRight className='w-5 h-5' />
                  </>
                )}
              </button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-gray-600'>
                Zaten hesabınız var mı?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className='text-blue-600 hover:text-blue-700 font-semibold'
                >
                  Giriş Yap
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;