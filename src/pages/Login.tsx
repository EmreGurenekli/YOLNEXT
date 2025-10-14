import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Zap,
  Star,
  Clock,
  DollarSign
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
      label: 'Bireysel Gönderici',
      description: 'Ev taşıma, kişisel gönderiler',
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
      features: ['Ev Taşınması', 'Kişisel Gönderiler', 'Fiyat Karşılaştırma'],
      stats: { users: '25,000+', savings: '₺2,500' }
    },
    {
      value: 'corporate',
      label: 'Kurumsal Gönderici',
      description: 'Şirket gönderileri, toplu taşıma',
      icon: <Building2 className="w-6 h-6" />,
      color: 'purple',
      features: ['Toplu Gönderi', 'Ekip Yönetimi', 'Raporlama'],
      stats: { users: '5,000+', savings: '₺15,000' }
    },
    {
      value: 'nakliyeci',
      label: 'Nakliyeci',
      description: 'Kargo firmaları, lojistik şirketleri',
      icon: <Truck className="w-6 h-6" />,
      color: 'green',
      features: ['İş Bul', 'Araç Yönetimi', 'Kazanç Takibi'],
      stats: { users: '15,000+', earnings: '₺8,000' }
    },
    {
      value: 'tasiyici',
      label: 'Taşıyıcı',
      description: 'Kamyoncu, şoförler',
      icon: <Package className="w-6 h-6" />,
      color: 'orange',
      features: ['İş Kabul Et', 'Konum Güncelle', 'Kazanç Görüntüle'],
      stats: { users: '8,000+', earnings: '₺5,000' }
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-slate-300 text-slate-600 hover:border-blue-300',
      purple: isSelected ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-slate-300 text-slate-600 hover:border-purple-300',
      green: isSelected ? 'bg-green-100 border-green-300 text-green-700' : 'border-slate-300 text-slate-600 hover:border-green-300',
      orange: isSelected ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-slate-300 text-slate-600 hover:border-orange-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
      <Helmet>
        <title>Giriş Yap - YolNet</title>
        <meta name="description" content="YolNet platformuna giriş yapın" />
      </Helmet>

      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <span className="ml-4 text-3xl font-bold">YolNet</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Türkiye'nin En Gelişmiş Lojistik Platformu
            </h1>
            
            <p className="text-xl text-slate-200 mb-8 leading-relaxed">
              Bireysel ve kurumsal taşımacılık ihtiyaçlarınız için tek platform. 
              <br />
              <span className="text-blue-300 font-semibold">Güvenilir, hızlı ve ekonomik</span> çözümlerimizle yanınızdayız.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-slate-200">50,000+ Mutlu Müşteri</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-400" />
                <span className="text-slate-200">%99.9 Başarı Oranı</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-400" />
                <span className="text-slate-200">24 Saat Teslimat</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span className="text-slate-200">₺2,500 Tasarruf</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold text-white">YolNet</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz</h2>
              <p className="text-slate-300">Hesabınıza giriş yapın veya demo hesapları deneyin</p>
            </div>

            {/* Demo Login Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Demo Hesapları</h3>
              <div className="grid grid-cols-2 gap-3">
                {userTypes.map((userType) => (
                  <button
                    key={userType.value}
                    onClick={() => handleDemoLogin(userType.value)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                      userType.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800' :
                      userType.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800' :
                      userType.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800' :
                      'bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800'
                    } text-white`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      {userType.icon}
                    </div>
                    <div className="text-sm font-semibold">{userType.label}</div>
                    <div className="text-xs opacity-90">{userType.stats.users}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900 text-slate-400">veya</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-slate-200 mb-2">
                  Kullanıcı Tipi
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {userTypes.map((userType) => (
                    <option key={userType.value} value={userType.value}>
                      {userType.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Giriş Yap
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </div>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                Hesabınız yok mu?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Hemen kayıt olun
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}