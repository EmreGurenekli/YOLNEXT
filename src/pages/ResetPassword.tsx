import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import YolNextLogo from '../components/common/yolnextLogo';
import { createApiUrl } from '../config/api';
// Temporary workaround
const authAPI = {
  resetPassword: async (token: string, password: string) => {
    const response = await fetch(createApiUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return response.json();
  }
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Geçersiz veya eksik token. Lütfen e-postanızdaki linki kullanın.');
    }
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Şifre en az bir büyük harf içermelidir';
    }
    if (!/[a-z]/.test(password)) {
      return 'Şifre en az bir küçük harf içermelidir';
    }
    if (!/[0-9]/.test(password)) {
      return 'Şifre en az bir rakam içermelidir';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Geçersiz token');
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.resetPassword(token, formData.password);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Şifre sıfırlama başarısız');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Şifre sıfırlama başarısız. Token geçersiz veya süresi dolmuş olabilir.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12'>
        <Helmet>
          <title>Geçersiz Token - YolNext</title>
        </Helmet>
        <div className='max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <AlertCircle className='w-8 h-8 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>Geçersiz Link</h2>
          <p className='text-slate-600 mb-6'>
            Bu link geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin.
          </p>
          <Link
            to='/forgot-password'
            className='inline-block bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 px-6 rounded-lg font-semibold hover:from-slate-700 hover:to-blue-800 transition'
          >
            Yeni Şifre Sıfırlama İsteği
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12'>
      <Helmet>
        <title>Şifre Sıfırla - YolNext</title>
        <meta name='description' content='YolNext şifre sıfırlama sayfası' />
      </Helmet>

      <div className='max-w-md w-full'>
        {/* Logo */}
        <div className='text-center mb-8'>
          <Link to='/'>
            <YolNextLogo variant='banner' size='lg' className='h-12 mx-auto' />
          </Link>
        </div>

        {/* Card */}
        <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-8'>
          {!success ? (
            <>
              <div className='text-center mb-6'>
                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Lock className='w-8 h-8 text-blue-600' />
                </div>
                <h1 className='text-2xl font-bold text-slate-900 mb-2'>
                  Yeni Şifre Belirle
                </h1>
                <p className='text-slate-600'>
                  Güvenliğiniz için güçlü bir şifre seçin
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                {error && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3'>
                    <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                    <p className='text-sm text-red-800'>{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor='password' className='block text-sm font-medium text-slate-700 mb-2'>
                    Yeni Şifre
                  </label>
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id='password'
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className='w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
                      placeholder='En az 8 karakter'
                      required
                      disabled={isLoading}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                    >
                      {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                    </button>
                  </div>
                  <p className='text-xs text-slate-500 mt-1'>
                    En az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam
                  </p>
                </div>

                <div>
                  <label htmlFor='confirmPassword' className='block text-sm font-medium text-slate-700 mb-2'>
                    Şifre Tekrar
                  </label>
                  <div className='relative'>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id='confirmPassword'
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className='w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
                      placeholder='Şifreyi tekrar girin'
                      required
                      disabled={isLoading}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                    >
                      {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                    </button>
                  </div>
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 rounded-lg font-semibold hover:from-slate-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoading ? 'Şifre Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
                </button>
              </form>

              <div className='mt-6 text-center'>
                <Link
                  to='/login'
                  className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition'
                >
                  <ArrowLeft className='w-4 h-4' />
                  Giriş sayfasına dön
                </Link>
              </div>
            </>
          ) : (
            <div className='text-center'>
              <div className='w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <CheckCircle className='w-8 h-8 text-emerald-600' />
              </div>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                Şifre Başarıyla Sıfırlandı
              </h2>
              <p className='text-slate-600 mb-6'>
                Yeni şifrenizle giriş yapabilirsiniz. 3 saniye sonra giriş sayfasına yönlendirileceksiniz.
              </p>
              <Link
                to='/login'
                className='inline-block bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 px-6 rounded-lg font-semibold hover:from-slate-700 hover:to-blue-800 transition'
              >
                Giriş Yap
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

