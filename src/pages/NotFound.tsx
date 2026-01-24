import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Search,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4'>
      <Helmet>
        <title>Sayfa Bulunamadı - YolNext</title>
        <meta name='description' content='Aradığınız sayfa bulunamadı' />
      </Helmet>

      <div className='max-w-2xl mx-auto text-center'>
        {/* 404 Icon */}
        <div className='mb-8'>
          <div className='w-32 h-32 mx-auto bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-lg'>
            <AlertTriangle className='w-16 h-16 text-red-600' />
          </div>
        </div>

        {/* Error Message */}
        <div className='mb-8'>
          <h1 className='text-6xl font-bold text-slate-900 mb-4'>404</h1>
          <h2 className='text-2xl font-semibold text-slate-700 mb-4'>
            Sayfa Bulunamadı
          </h2>
          <p className='text-lg text-slate-600 mb-6'>
            Üzgünüz, aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
          <Link
            to='/'
            className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-xl hover:from-blue-900 hover:to-slate-800 transition-colors font-medium'
          >
            <Home className='w-5 h-5' />
            Ana Sayfaya Dön
          </Link>

          <button
            onClick={() => window.history.back()}
            className='inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium'
          >
            <ArrowLeft className='w-5 h-5' />
            Geri Dön
          </button>
        </div>

        {/* Help Section */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
          <h3 className='text-lg font-semibold text-slate-900 mb-4'>
            Yardıma mı ihtiyacınız var?
          </h3>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <Link
              to='/help'
              className='flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors'
            >
              <HelpCircle className='w-8 h-8 text-slate-600 mb-2' />
              <span className='text-sm font-medium text-slate-700'>
                Yardım Merkezi
              </span>
            </Link>

            <Link
              to='/contact'
              className='flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors'
            >
              <Search className='w-8 h-8 text-slate-600 mb-2' />
              <span className='text-sm font-medium text-slate-700'>
                İletişim
              </span>
            </Link>

            <button
              onClick={() => window.location.reload()}
              className='flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors'
            >
              <RefreshCw className='w-8 h-8 text-slate-600 mb-2' />
              <span className='text-sm font-medium text-slate-700'>
                Sayfayı Yenile
              </span>
            </button>
          </div>
        </div>

        {/* Popular Links */}
        <div className='mt-8'>
          <h4 className='text-sm font-medium text-slate-600 mb-4'>
            Popüler Sayfalar:
          </h4>
          <div className='flex flex-wrap gap-2 justify-center'>
            <Link
              to='/individual/dashboard'
              className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors'
            >
              Bireysel Panel
            </Link>
            <Link
              to='/corporate/dashboard'
              className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors'
            >
              Kurumsal Panel
            </Link>
            <Link
              to='/nakliyeci/dashboard'
              className='px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors'
            >
              Nakliyeci Panel
            </Link>
            <Link
              to='/tasiyici/dashboard'
              className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors'
            >
              Taşıyıcı Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}











