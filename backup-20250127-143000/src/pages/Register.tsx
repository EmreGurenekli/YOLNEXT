import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Building2, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Users,
  Package,
  Shield,
  Zap,
  MapPin,
  Calendar
} from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    userType: 'individual',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    taxNumber: '',
    address: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Kullanım şartlarını kabul etmelisiniz');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    } catch (err) {
      setError('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    {
      value: 'individual',
      label: 'Bireysel',
      description: 'Ev taşıma, kişisel gönderiler',
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
      features: ['Ev taşıma', 'Kişisel gönderiler', 'Basit takip']
    },
    {
      value: 'corporate',
      label: 'Kurumsal',
      description: 'Büyük firmalar, fabrikalar',
      icon: <Building2 className="w-6 h-6" />,
      color: 'green',
      features: ['Toplu gönderiler', 'Raporlama', 'Ekip yönetimi']
    },
    {
      value: 'nakliyeci',
      label: 'Nakliyeci',
      description: 'Kargo firmaları',
      icon: <Truck className="w-6 h-6" />,
      color: 'orange',
      features: ['Gönderi yönetimi', 'Müşteri takibi', 'Finansal raporlar']
    },
    {
      value: 'tasiyici',
      label: 'Taşıyıcı',
      description: 'Kamyoncu, şoförler',
      icon: <Package className="w-6 h-6" />,
      color: 'purple',
      features: ['İş fırsatları', 'Kazanç takibi', 'Profil yönetimi']
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300',
      green: isSelected ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300',
      orange: isSelected ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-300',
      purple: isSelected ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const selectedUserType = userTypes.find(type => type.value === formData.userType);

  return (
    <>
      <Helmet>
        <title>Kayıt Ol - YolNet Kargo</title>
        <meta name="description" content="YolNet platformuna kayıt olun" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-col justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-8">
                  <Truck className="w-16 h-16 text-blue-600" />
                  <span className="ml-4 text-4xl font-bold text-gray-900">YolNet</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Lojistik Dünyasına Hoş Geldiniz
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Türkiye'nin en gelişmiş lojistik platformuna katılın
                </p>
                
                <div className="grid grid-cols-1 gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Ücretsiz kayıt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Hızlı kurulum</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">7/24 destek</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Güvenli platform</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4 lg:hidden">
                  <Truck className="w-12 h-12 text-blue-600" />
                  <span className="ml-3 text-2xl font-bold text-gray-900">YolNet</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Kayıt Ol</h2>
                <p className="text-gray-600 mt-2">Hesabınızı oluşturun</p>
              </div>

              {/* User Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kullanıcı Tipi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {userTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, userType: type.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${getColorClasses(type.color, formData.userType === type.value)}`}
                    >
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <div className="text-left">
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs opacity-75">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Selected User Type Features */}
                {selectedUserType && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {selectedUserType.label} hesabı ile:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedUserType.features.map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Ad *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Adınız"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Soyadınız"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta Adresi *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ornek@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Numarası *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+90 555 123 45 67"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Corporate Information */}
                {(formData.userType === 'corporate' || formData.userType === 'nakliyeci') && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Şirket Adı *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          id="companyName"
                          name="companyName"
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="Şirket adınız"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Vergi Numarası *
                      </label>
                      <input
                        id="taxNumber"
                        name="taxNumber"
                        type="text"
                        required
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        placeholder="1234567890"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Adres *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Tam adresiniz"
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Şifre *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Şifre Tekrar *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
                    <a href="#" className="text-blue-600 hover:text-blue-700">Kullanım Şartları</a> ve{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700">Gizlilik Politikası</a>'nı okudum ve kabul ediyorum *
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Kayıt oluşturuluyor...
                    </>
                  ) : (
                    <>
                      Hesap Oluştur
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Zaten hesabınız var mı?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Giriş yapın
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}