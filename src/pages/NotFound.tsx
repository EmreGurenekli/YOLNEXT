import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
      <Helmet>
        <title>404 - Sayfa Bulunamadı | YolNet</title>
        <meta name="description" content="Aradığınız sayfa bulunamadı" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Sayfa Bulunamadı</h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            <br />
            Lütfen URL'yi kontrol edin veya ana sayfaya dönün.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            Ana Sayfaya Dön
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Geri Dön
          </button>
        </div>

        {/* Search Suggestion */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-900">Aradığınızı Bulamadınız mı?</h3>
          </div>
          <p className="text-slate-600 mb-4">
            Aşağıdaki sayfalardan birini deneyebilirsiniz:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/individual/dashboard"
              className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-slate-900">Bireysel Panel</div>
              <div className="text-sm text-slate-600">Kişisel gönderilerinizi yönetin</div>
            </Link>
            
            <Link
              to="/corporate/dashboard"
              className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-slate-900">Kurumsal Panel</div>
              <div className="text-sm text-slate-600">Kurumsal gönderilerinizi yönetin</div>
            </Link>
            
            <Link
              to="/nakliyeci/dashboard"
              className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-slate-900">Nakliyeci Panel</div>
              <div className="text-sm text-slate-600">Nakliye işlerinizi yönetin</div>
            </Link>
            
            <Link
              to="/tasiyici/dashboard"
              className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-slate-900">Taşıyıcı Panel</div>
              <div className="text-sm text-slate-600">Taşıma işlerinizi yönetin</div>
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-slate-500">
          Sorun devam ederse, lütfen{' '}
          <Link to="/help" className="text-blue-600 hover:text-blue-800 font-medium">
            yardım sayfamızı
          </Link>{' '}
          ziyaret edin.
        </div>
      </div>
    </div>
  );
}





