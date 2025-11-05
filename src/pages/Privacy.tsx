import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock } from 'lucide-react';
import YolNextLogo from '../components/common/yolnextLogo';
import Footer from '../components/common/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Gizlilik Politikası - YolNext</title>
        <meta name="description" content="YolNext gizlilik politikası ve kişisel veri koruma" />
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <YolNextLogo />
            <span className="text-xl font-bold text-blue-600">YolNext</span>
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
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Gizlilik Politikası</h1>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Genel Bilgiler</h2>
              <p className="text-gray-700 mb-4">
                YolNext olarak, kişisel verilerinizin korunmasına büyük önem veriyoruz. 
                Bu gizlilik politikası, KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR 
                (Genel Veri Koruma Tüzüğü) uyumlu olarak hazırlanmıştır.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <strong>Veri Sorumlusu:</strong> YolNext Platform<br />
                    <strong>İletişim:</strong> destek@yolnext.com
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Toplanan Veriler</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1. Kimlik Bilgileri</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Ad, soyad</li>
                <li>E-posta adresi</li>
                <li>Telefon numarası</li>
                <li>TC Kimlik No (gerekli durumlarda)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2. İşletme Bilgileri</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Şirket adı</li>
                <li>Vergi numarası</li>
                <li>Adres bilgileri</li>
                <li>Lisans ve belge bilgileri</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3. Kullanım Verileri</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Platform kullanım istatistikleri</li>
                <li>IP adresi</li>
                <li>Tarayıcı bilgileri</li>
                <li>Çerez verileri</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Veri Kullanım Amaçları</h2>
              <p className="text-gray-700 mb-4">Kişisel verileriniz aşağıdaki amaçlarla kullanılır:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Platform hizmetlerinin sağlanması</li>
                <li>Gönderi ve nakliye işlemlerinin yönetimi</li>
                <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
                <li>Müşteri desteği ve iletişim</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Platform güvenliğinin sağlanması</li>
                <li>İyileştirme ve analiz çalışmaları</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Veri Paylaşımı</h2>
              <p className="text-gray-700 mb-4">
                Kişisel verileriniz, aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Hizmet sağlayıcılarımız (hosting, ödeme, SMS servisleri)</li>
                <li>Yasal zorunluluklar (mahkeme kararı, yasal yükümlülükler)</li>
                <li>Gönderi ve nakliye işlemleri için gerekli bilgi paylaşımı</li>
                <li>Açık rızanızla paylaşım</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Veri Güvenliği</h2>
              <p className="text-gray-700 mb-4">
                Verilerinizin güvenliği için şu önlemleri alıyoruz:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>SSL/TLS şifreleme</li>
                <li>Güvenli veritabanı yönetimi</li>
                <li>Düzenli güvenlik denetimleri</li>
                <li>Erişim kontrolü ve yetkilendirme</li>
                <li>Yedekleme ve felaket kurtarma planları</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Çerezler (Cookies)</h2>
              <p className="text-gray-700 mb-4">
                Platform, kullanıcı deneyimini iyileştirmek için çerezler kullanır:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Zorunlu Çerezler:</strong> Platform işlevselliği için gerekli</li>
                <li><strong>Performans Çerezleri:</strong> Kullanım analizi için</li>
                <li><strong>Fonksiyonel Çerezler:</strong> Kişiselleştirme için</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. KVKK Haklarınız</h2>
              <p className="text-gray-700 mb-4">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenen verileriniz hakkında bilgi talep etme</li>
                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içi/yurt dışı aktarılan üçüncü kişileri bilme</li>
                <li>Eksik veya yanlış verilerin düzeltilmesini isteme</li>
                <li>Kanunların öngördüğü süre içinde silinmesini veya yok edilmesini isteme</li>
                <li>Düzeltme, silme, yok etme işlemlerinin bildirilmesini isteme</li>
                <li>İşlenen verilerin münhasıran otomatik sistemler aracılığıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kanuna aykırı işlenmesi sebebiyle zarara uğrama halinde zararın giderilmesini talep etme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Veri Saklama Süresi</h2>
              <p className="text-gray-700 mb-4">
                Kişisel verileriniz, yasal saklama süreleri ve işleme amaçları doğrultusunda saklanır. 
                Amacın ortadan kalkması durumunda veriler silinir veya anonimleştirilir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Değişiklikler</h2>
              <p className="text-gray-700">
                Bu gizlilik politikası, yasal düzenlemelere uygun olarak güncellenebilir. 
                Önemli değişiklikler platform üzerinden duyurulur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. İletişim</h2>
              <p className="text-gray-700 mb-4">
                KVKK kapsamındaki haklarınızı kullanmak için:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> kvkk@yolnext.com<br />
                  <strong>Telefon:</strong> +90 (212) 123 45 67<br />
                  <strong>Adres:</strong> İstanbul, Türkiye
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

export default Privacy;
