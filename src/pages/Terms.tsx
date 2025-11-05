import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import YolNextLogo from '../components/common/yolnextLogo';
import Footer from '../components/common/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Kullanım Koşulları - YolNext</title>
        <meta name="description" content="YolNext platform kullanım koşulları ve şartları" />
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
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Kullanım Koşulları</h1>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Genel Hükümler</h2>
              <p className="text-gray-700 mb-4">
                YolNext platformunu kullanarak, aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız. 
                Bu koşulları kabul etmiyorsanız, lütfen platformu kullanmayın.
              </p>
              <p className="text-gray-700">
                YolNext, lojistik ve kargo hizmetleri için bir aracı platformdur. Platform, 
                göndericiler ve nakliyeciler arasında bağlantı kurar.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Platform Kullanımı</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1. Kayıt ve Hesap</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Platformu kullanmak için kayıt olmanız gerekmektedir</li>
                <li>Doğru ve güncel bilgiler sağlamak sizin sorumluluğunuzdadır</li>
                <li>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz</li>
                <li>Hesabınızı başkalarıyla paylaşamazsınız</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2. Kullanıcı Sorumlulukları</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Yasalara ve düzenlemelere uygun hareket etmelisiniz</li>
                <li>Yanıltıcı veya yanlış bilgi vermemelisiniz</li>
                <li>Platformu kötüye kullanamazsınız</li>
                <li>Diğer kullanıcıların haklarına saygı göstermelisiniz</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Hizmet Şartları</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1. Göndericiler</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Gönderi bilgilerini doğru ve eksiksiz sağlamalısınız</li>
                <li>Yasaklı veya tehlikeli madde gönderemezsiniz</li>
                <li>Kabul edilen teklifler bağlayıcıdır</li>
                <li>Ödeme yükümlülüklerinizi zamanında yerine getirmelisiniz</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2. Nakliyeciler</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Verdiğiniz teklifler bağlayıcıdır</li>
                <li>Gönderileri zamanında ve güvenli şekilde teslim etmelisiniz</li>
                <li>Gerekli lisans ve belgeleriniz olmalıdır</li>
                <li>Sigorta ve yasal yükümlülüklerinizden siz sorumlusunuz</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Ödeme ve Fiyatlandırma</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Fiyatlar platform üzerinden belirlenir</li>
                <li>Komisyon oranları platform tarafından belirlenir</li>
                <li>Ödemeler platform üzerinden güvenli şekilde yapılır</li>
                <li>İptal ve iade koşulları platform politikalarına tabidir</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sorumluluk Reddi</h2>
              <p className="text-gray-700 mb-4">
                YolNext, nakliyeci ve gönderici arasındaki anlaşmalardan sorumlu değildir. 
                Platform sadece bir aracı hizmet sağlar.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Gönderi kayıplarından veya hasarlarından platform sorumlu değildir</li>
                <li>Nakliyeci ve gönderici arasındaki anlaşmazlıklardan platform sorumlu değildir</li>
                <li>Platform teknik sorunlardan kaynaklanan zararlardan sorumlu değildir</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Fikri Mülkiyet</h2>
              <p className="text-gray-700 mb-4">
                Platform üzerindeki tüm içerik, tasarım ve yazılım YolNext'e aittir. 
                İzinsiz kullanım yasaktır.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Hesap İptali</h2>
              <p className="text-gray-700 mb-4">
                Platform, aşağıdaki durumlarda hesabınızı askıya alabilir veya iptal edebilir:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Kullanım koşullarını ihlal ettiğinizde</li>
                <li>Yasadışı faaliyetlerde bulunduğunuzda</li>
                <li>Diğer kullanıcıları aldattığınızda</li>
                <li>Platformun güvenliğini tehdit ettiğinizde</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Değişiklikler</h2>
              <p className="text-gray-700">
                YolNext, bu kullanım koşullarını istediği zaman değiştirme hakkını saklı tutar. 
                Değişiklikler platform üzerinden duyurulur ve yayınlandığı tarihten itibaren geçerlidir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. İletişim</h2>
              <p className="text-gray-700 mb-4">
                Sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> destek@yolnext.com<br />
                  <strong>Telefon:</strong> +90 (212) 123 45 67<br />
                  <strong>Adres:</strong> İstanbul, Türkiye
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm">
                  Bu koşulları kabul ederek platformu kullanmaya başlayabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
