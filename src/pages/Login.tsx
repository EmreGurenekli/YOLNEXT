import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import YolNetLogo from '../components/common/YolNetLogo';
import { 
  Truck, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Building2,
  Users,
  Package,
  Shield,
  Zap
} from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'individual'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, demoLogin, getPanelRoute } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        const panelRoute = getPanelRoute(formData.userType);
        navigate(panelRoute);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (userType: string) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await demoLogin(userType);
      
      if (result.success) {
        const panelRoute = getPanelRoute(userType);
        navigate(panelRoute);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Demo giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
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
      color: 'blue'
    },
    {
      value: 'corporate',
      label: 'Kurumsal',
      description: 'Büyük firmalar, fabrikalar',
      icon: <Building2 className="w-6 h-6" />,
      color: 'green'
    },
    {
      value: 'nakliyeci',
      label: 'Nakliyeci',
      description: 'Kargo firmaları',
      icon: <Truck className="w-6 h-6" />,
      color: 'orange'
    },
    {
      value: 'tasiyici',
      label: 'Taşıyıcı',
      description: 'Kamyoncu, şoförler',
      icon: <Package className="w-6 h-6" />,
      color: 'purple'
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

  return (
    <>
      <Helmet>
        <title>Giriş Yap - YolNet Kargo</title>
        <meta name="description" content="YolNet platformuna giriş yapın" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-col justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-8">
                  <YolNetLogo size="xl" variant="default" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Türkiye'nin En Gelişmiş Lojistik Platformu
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Bireysel ve kurumsal taşımacılık ihtiyaçlarınız için tek platform
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Gerçek zamanlı takip</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Güvenli ödeme</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Profesyonel ağ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">7/24 destek</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4 lg:hidden">
                  <Truck className="w-12 h-12 text-blue-600" />
                  <span className="ml-3 text-2xl font-bold text-gray-900">YolNet</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Giriş Yap</h2>
                <p className="text-gray-600 mt-2">Hesabınıza giriş yapın</p>
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
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta Adresi
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
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    Şifremi unuttum
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      Giriş Yap
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-3">Demo Hesaplar</h3>
                <div className="text-sm text-blue-700 mb-4">
                  <p><strong>E-posta:</strong> demo@yolnet.com</p>
                  <p><strong>Şifre:</strong> demo123</p>
                  <p className="text-xs mt-1 opacity-75">Aşağıdaki butonlara tıklayarak direkt panele giriş yapabilirsiniz</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDemoLogin('individual')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    Bireysel Panel
                  </button>
                  <button
                    onClick={() => handleDemoLogin('corporate')}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                  >
                    Kurumsal Panel
                  </button>
                  <button
                    onClick={() => handleDemoLogin('nakliyeci')}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs font-medium"
                  >
                    Nakliyeci Panel
                  </button>
                  <button
                    onClick={() => handleDemoLogin('tasiyici')}
                    className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-xs font-medium"
                  >
                    Taşıyıcı Panel
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Hesabınız yok mu?{' '}
                  <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Kayıt olun
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