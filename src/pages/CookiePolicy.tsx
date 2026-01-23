import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, Settings } from 'lucide-react';
import YolNextLogo from '../components/common/yolnextLogo';
import Footer from '../components/common/Footer';
import { LEGAL_CONTACT } from '../config/legal';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Çerez Politikası - YolNext</title>
        <meta name="description" content="YolNext çerez kullanım politikası" />
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center justify-start">
            <YolNextLogo variant='banner' size='md' showText={false} />
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ana Sayfaya Dön
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="flex items-center mb-8">
            <Cookie className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Çerez Politikası</h1>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Çerez Nedir?</h2>
              <p className="text-gray-700 mb-4">
                Çerezler, web sitelerini ziyaret ettiğinizde tarayıcınızda saklanan küçük metin dosyalarıdır. 
                Bu dosyalar, web sitesinin düzgün çalışmasını sağlar ve kullanıcı deneyimini iyileştirir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Çerez Türleri</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1. Zorunlu Çerezler</h3>
              <p className="text-gray-700 mb-4">
                Bu çerezler platformun temel işlevlerini sağlamak için gereklidir ve kapatılamaz.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Oturum Çerezleri:</strong> Giriş durumunu ve güvenliği sağlar</li>
                  <li><strong>Güvenlik Çerezleri:</strong> Güvenli bağlantı ve CSRF koruması</li>
                  <li><strong>Tercih Çerezleri:</strong> Kullanıcı ayarlarını hatırlar</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2. Performans Çerezleri</h3>
              <p className="text-gray-700 mb-4">
                Platform performansını analiz etmek ve iyileştirmek için kullanılır.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Analitik Çerezler:</strong> Kullanım istatistikleri</li>
                  <li><strong>Performans Çerezleri:</strong> Sayfa yükleme süreleri</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3. Fonksiyonel Çerezler</h3>
              <p className="text-gray-700 mb-4">
                Kullanıcı deneyimini kişiselleştirmek için kullanılır.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Dil Tercihi:</strong> Seçtiğiniz dil ayarı</li>
                  <li><strong>Tema Tercihi:</strong> Açık/koyu tema seçimi</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Çerez Yönetimi</h2>
              <p className="text-gray-700 mb-4">
                Çerez tercihlerinizi yönetmek için:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Settings className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 font-semibold mb-2">Tarayıcı Ayarları:</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                      <li>Chrome: Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
                      <li>Firefox: Seçenekler → Gizlilik ve Güvenlik → Çerezler</li>
                      <li>Safari: Tercihler → Gizlilik → Çerezler</li>
                      <li>Edge: Ayarlar → Gizlilik → Çerezler</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">
                <strong>Not:</strong> Çerezleri devre dışı bırakmak, platformun bazı özelliklerinin 
                çalışmamasına neden olabilir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Üçüncü Taraf Çerezler</h2>
              <p className="text-gray-700 mb-4">
                Platform, aşağıdaki üçüncü taraf hizmetleri kullanır:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Analitik (opsiyonel):</strong> Kullanım analizi (analitik çerezler, tercihlerinize göre etkinleştirilebilir)</li>
                <li><strong>Ödeme İşlemcileri:</strong> Güvenli ödeme için gerekli çerezler</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Çerez Saklama Süreleri</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Oturum Çerezleri:</strong> Tarayıcı kapatıldığında silinir</li>
                <li><strong>Kalıcı Çerezler:</strong> Belirlenen süre boyunca (max 1 yıl) saklanır</li>
                <li><strong>Tercih Çerezleri:</strong> Silinene kadar veya 1 yıl</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. İletişim</h2>
              <p className="text-gray-700 mb-4">
                Çerez politikası hakkında sorularınız için:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> {LEGAL_CONTACT.supportEmail}<br />
                  <strong>Telefon:</strong> {LEGAL_CONTACT.phone}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
