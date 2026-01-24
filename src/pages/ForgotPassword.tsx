import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import YolNextLogo from '../components/shared-ui-elements/yolnextLogo';
import { authAPI } from '../services/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email) {
      setError('E-posta adresi gereklidir');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.forgotPassword(email);
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Bir hata oluştu');
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Şifre sıfırlama isteği gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12'>
      <Helmet>
        <title>Şifremi Unuttum - YolNext</title>
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
                  <Mail className='w-8 h-8 text-blue-600' />
                </div>
                <h1 className='text-2xl font-bold text-slate-900 mb-2'>
                  Şifremi Unuttum
                </h1>
                <p className='text-slate-600'>
                  E-posta adresinize şifre sıfırlama linki göndereceğiz
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
                  <label htmlFor='email' className='block text-sm font-medium text-slate-700 mb-2'>
                    E-posta Adresi
                  </label>
                  <input
                    type='email'
                    id='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
                    placeholder='ornek@email.com'
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 rounded-lg font-semibold hover:from-slate-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
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
                E-posta Gönderildi
              </h2>
              <p className='text-slate-600 mb-6'>
                Şifre sıfırlama linki <strong>{email}</strong> adresine gönderildi.
                <br />
                Lütfen e-posta kutunuzu kontrol edin.
              </p>
              <div className='space-y-3'>
                <Link
                  to='/login'
                  className='block w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 rounded-lg font-semibold hover:from-slate-700 hover:to-blue-800 transition text-center'
                >
                  Giriş Sayfasına Dön
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className='w-full text-slate-600 hover:text-slate-900 text-sm'
                >
                  Başka bir e-posta ile dene
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className='mt-6 text-center text-sm text-slate-600'>
          <p>
            E-postayı bulamadınız mı?{' '}
            <Link to='/contact' className='text-blue-600 hover:text-blue-700 font-medium'>
              Destek ekibimizle iletişime geçin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}










