import React, { useEffect, useState } from 'react';
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
  Star,
  Clock,
  DollarSign,
  Globe,
  AlertTriangle,
  X
} from 'lucide-react';
import YolNextLogo from '../components/common/yolnextLogo';
import { analytics } from '../services/analytics';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, demoLogin, getPanelRoute } = useAuth();
  const [abVariant] = useState(() => analytics.ab.getVariant('ab_landing_v1'));

  useEffect(() => {
    analytics.track('login_view', {
      ab: abVariant,
    });
  }, [abVariant]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Form validation
    if (!formData.email.trim()) {
      setError('E-posta adresi gereklidir');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Geçerli bir e-posta adresi giriniz');
      return;
    }

    if (!formData.password.trim()) {
      setError('Şifre gereklidir');
      return;
    }

    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Giriş işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }, 10000); // 10 seconds timeout

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        clearTimeout(timeoutId);
        analytics.track('login_complete', {
          ab: abVariant,
        });
        const role = (result as any)?.user?.role || (result as any)?.user?.panel_type || 'individual';
        const panelRoute = getPanelRoute(role);
        navigate(panelRoute);
      } else {
        clearTimeout(timeoutId);
        analytics.track('login_error', {
          ab: abVariant,
          reason: 'invalid_credentials',
        });
        setError('E-posta veya şifre hatalı');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      analytics.track('login_error', {
        ab: abVariant,
        reason: 'exception',
      });
      setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (userType: string) => {
    // Production kontrolü: Netlify'da PROD flag'i kullan
    const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production' || window.location.hostname !== 'localhost';
    if (isProduction) {
      setError('Hızlı giriş production ortamında devre dışı');
      return;
    }
    setIsLoading(true);
    setError('');
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Hızlı giriş işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }, 10000); // 10 seconds timeout

    try {
      const result = await demoLogin(userType);

      if (result.success) {
        clearTimeout(timeoutId);
        analytics.track('demo_login_complete', {
          ab: abVariant,
          userType,
        });
        // Kullanıcı tipine göre doğru panele yönlendir
        const routes: { [key: string]: string } = {
          individual: '/individual/dashboard',
          corporate: '/corporate/dashboard',
          nakliyeci: '/nakliyeci/dashboard',
          tasiyici: '/tasiyici/dashboard',
        };
        const panelRoute = routes[userType] || '/individual/dashboard';
        
        // Navigate to panel
        // Kısa bir gecikme ekleyerek state'in güncellenmesini bekle
        setTimeout(() => {
          navigate(panelRoute, { replace: true });
        }, 100);
      } else {
        clearTimeout(timeoutId);
        analytics.track('login_error', {
          ab: abVariant,
          userType,
          reason: 'demo_failed',
        });
        // Demo login failed - show error from result if available
        const errorMsg = (result as any)?.error || 'Hızlı giriş başarısız';
        setError(errorMsg);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      analytics.track('login_error', {
        ab: abVariant,
        userType,
        reason: 'demo_exception',
      });
      // Demo login error handled - log to console
      const errorMessage = err?.message || 'Bilinmeyen bir hata oluştu';
      console.error('Demo login exception:', err);
      setError(`Hızlı giriş yapılırken bir hata oluştu: ${errorMessage}`);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const userTypes = [
    {
      value: 'individual',
      label: 'Bireysel Gönderici',
      icon: <Users className='w-6 h-6' />,
    },
    {
      value: 'corporate',
      label: 'Kurumsal Gönderici',
      icon: <Building2 className='w-6 h-6' />,
    },
    {
      value: 'nakliyeci',
      label: 'Nakliyeci',
      icon: <Truck className='w-6 h-6' />,
    },
    {
      value: 'tasiyici',
      label: 'Taşıyıcı',
      icon: <Package className='w-6 h-6' />,
    },
  ];

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Giriş Yap - YolNext | Tamamen Ücretsiz Lojistik Platformu</title>
        <meta
          name='description'
          content='YolNext platformuna giriş yapın. %0 üyelik ücreti, sadece nakliyeci %1 komisyon öder. 4 kullanıcı tipi, 81 il kapsamı.'
        />
        <meta
          name='keywords'
          content='giriş yap, login, lojistik, kargo, ücretsiz, YolNext'
        />
      </Helmet>

      <div className='min-h-screen flex'>
        {/* Left Side - Branding */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10 flex flex-col justify-center px-12 text-white'>
            <div className='flex items-center justify-start mb-8'>
              <YolNextLogo variant='banner' size='lg' className='h-12' />
            </div>

            <h1 className='text-4xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
              Modern Lojistik Platformu
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
                  TAMAMEN ÜCRETSİZ
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
                <span className='text-slate-200'>53.000+ Kullanıcı</span>
              </div>
              <div className='flex items-center gap-3'>
                <Shield className='w-6 h-6 text-blue-400' />
                <span className='text-slate-200'>Yüksek Memnuniyet</span>
              </div>
              <div className='flex items-center gap-3'>
                <Clock className='w-6 h-6 text-yellow-400' />
                <span className='text-slate-200'>Hızlı Teslimat</span>
              </div>
              <div className='flex items-center gap-3'>
                <Globe className='w-6 h-6 text-green-400' />
                <span className='text-slate-200'>81 İl Kapsamı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className='w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white'>
          <div className='w-full max-w-md'>
            {/* Mobile Logo */}
            <div className='lg:hidden flex items-center justify-center mb-8'>
              <YolNextLogo variant='banner' size='md' className='h-10' />
            </div>

            <div className='text-center mb-8'>
              <h2 className='text-3xl font-bold text-gray-900 mb-2'>
                Hoş Geldiniz
              </h2>
              <p className='text-gray-600'>
                Hesabınıza giriş yapın veya hızlı giriş seçeneklerini kullanın
              </p>
            </div>

            {/* Demo Login Section - Sadece development'ta göster */}
            {(!import.meta.env.PROD && import.meta.env.MODE !== 'production' && window.location.hostname === 'localhost') && (
              <>
                <div className='mb-8'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Hızlı Giriş (Demo)
                  </h3>
                  <div className='grid grid-cols-2 gap-3'>
                    {userTypes.map(userType => (
                      <button
                        key={userType.value}
                        data-testid={`demo-${userType.value}`}
                        onClick={() => handleDemoLogin(userType.value)}
                        disabled={isLoading}
                        className='p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-300 hover:shadow-lg'
                      >
                        <div className='flex items-center justify-center mb-2'>
                          {userType.icon}
                        </div>
                        <div className='text-sm font-semibold'>
                          {userType.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className='relative mb-8'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white text-gray-500'>veya</span>
                  </div>
                </div>
              </>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className='space-y-6'>
              {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2'>
                  <AlertCircle className='w-5 h-5' />
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  E-posta Adresi
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    id='email'
                    name='email'
                    type='email'
                    required
                    autoComplete='email'
                    autoFocus
                    value={formData.email}
                    onChange={handleInputChange}
                    className='w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='ornek@email.com'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Şifre
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete='current-password'
                    value={formData.password}
                    onChange={handleInputChange}
                    className='w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='En az 8 karakter'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              >
                {isLoading ? (
                  <div className='flex items-center justify-center'>
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  <div className='flex items-center justify-center'>
                    Giriş Yap
                    <ArrowRight className='ml-2 w-5 h-5' />
                  </div>
                )}
              </button>

              <div className='text-center mt-4'>
                <Link
                  to='/forgot-password'
                  className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                >
                  Şifremi Unuttum
                </Link>
              </div>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-gray-600'>
                Hesabınız yok mu?{' '}
                <Link
                  to='/register'
                  className='text-blue-600 hover:text-blue-700 font-semibold'
                >
                  Hemen kayıt olun
                </Link>
              </p>
              {(!import.meta.env.PROD && import.meta.env.MODE !== 'production' && window.location.hostname === 'localhost') && (
                <p className='text-xs text-slate-500 mt-2'>
                  Demo giriş üretimde kapalıdır; test ortamında hızlı giriş yapabilirsiniz.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
