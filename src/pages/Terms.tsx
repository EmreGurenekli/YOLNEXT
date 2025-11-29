import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
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
                YolNext, lojistik ve kargo hizmetleri için SADECE BİR PAZARYERİ/ARACI PLATFORMdur. 
                Platform, göndericiler ve nakliyeciler arasında SADECE bağlantı kurar. 
                YolNext hiçbir taşımacılık hizmetini bizzat sağlamaz, hiçbir sigorta hizmeti vermez 
                ve hiçbir şekilde sorumluluk kabul etmez.
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
                <li><strong>Sigorta:</strong> İhtiyaç duyuyorsanız, kendi sigortanızı yaptırmak TAMAMEN sizin sorumluluğunuzdadır. YolNext hiçbir sigorta hizmeti vermez</li>
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
                <li>Yasal yükümlülüklerinizden siz sorumlusunuz</li>
                <li><strong>Sigorta:</strong> İhtiyaç duyuyorsanız, kendi sigortanızı yaptırmak TAMAMEN sizin sorumluluğunuzdadır. YolNext hiçbir sigorta hizmeti vermez</li>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sorumluluk Reddi ve Risk Uyarısı</h2>
              
              <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8 mb-6">
                <h3 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
                  <AlertTriangle className="w-8 h-8 mr-3" />
                  KRİTİK UYARI: YolNext SADECE BİR PAZARYERİ/ARACI PLATFORMUDUR
                </h3>
                <p className="text-red-800 font-bold text-lg mb-4">
                  YolNext, göndericiler ve nakliyeciler arasında bağlantı kuran SADECE BİR ARACI PLATFORMdur. 
                  YolNext, taşımacılık hizmetlerini BİZZAT SAĞLAMAZ, sigorta hizmeti VERMEZ, hiçbir taşımacılık 
                  işlemini GERÇEKLEŞTİRMEZ ve HİÇBİR ŞEKİLDE SORUMLULUK KABUL ETMEZ.
                </p>
                <p className="text-red-700 font-semibold">
                  Platformu kullanarak, YolNext'in hiçbir durumda sorumlu olmadığını ve tüm risklerin 
                  gönderici ve nakliyeci arasında olduğunu KESİN OLARAK kabul etmiş sayılırsınız.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1. Platform Sorumluluğu KESİNLİKLE YOKTUR</h3>
              <p className="text-gray-700 mb-4 font-bold text-lg">
                YolNext aşağıdaki TÜM durumlardan ve bunlarla sınırlı olmamak üzere HER TÜRLÜ durumdan 
                KESİNLİKLE, MUTLAK SUURETLE ve HİÇBİR ŞEKİLDE sorumlu değildir:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-4 font-semibold">
                <li><strong>Kaza, Yaralanma ve Ölüm:</strong> Taşımacılık sırasında veya platform kullanımı sırasında meydana gelen kazalar, yaralanmalar, ölümler, sakatlıklar, maddi ve manevi zararlardan YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Hırsızlık, Kayıp ve Çalınma:</strong> Gönderilerin çalınması, kaybolması, gasp edilmesi, zarar görmesi, yok edilmesi, tahrip edilmesinden YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Hasarlar ve Kırılmalar:</strong> Gönderilerin taşıma sırasında veya herhangi bir zamanda zarar görmesi, kırılması, bozulması, deforme olması, değer kaybetmesinden YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Gecikmeler ve Zaman Kayıpları:</strong> Teslimat gecikmeleri, zaman kayıpları, ticari kayıplar, fırsat maliyetlerinden YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Mali ve Ticari Kayıplar:</strong> Gönderilerin değer kaybı, ticari kayıplar, kar kayıpları, iş kayıpları, müşteri kayıplarından YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Yanlış Teslimat ve Hatalı Adres:</strong> Yanlış adrese teslim, eksik teslimat, fazla teslimat, yanlış kişiye teslimden YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Nakliyeci Davranışları ve Hizmet Kalitesi:</strong> Nakliyecinin davranışları, hizmet kalitesi, yasal uyumsuzlukları, sözleşme ihlalleri, ahlaksız davranışlarından YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Gönderici Davranışları ve Hataları:</strong> Göndericinin yanlış bilgi vermesi, yasaklı madde göndermesi, eksik bilgi vermesi, yanıltıcı bilgi vermesinden YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Üçüncü Taraf Hizmetleri:</strong> Ödeme sistemleri, gümrük, bankalar, kargo şirketleri, sigorta şirketleri gibi üçüncü taraf hizmetlerinden YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Teknik Sorunlar ve Sistem Hataları:</strong> Platformun teknik sorunları, sistem hataları, veri kayıpları, erişim sorunları, güvenlik açıklarından kaynaklanan zararlardan YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Sigorta ve Güvence:</strong> YolNext hiçbir sigorta hizmeti vermez, sigorta kontrolü yapmaz, sigorta önerisi yapmaz. Sigorta ile ilgili tüm sorumluluk kullanıcılara aittir. Sigorta eksikliğinden kaynaklanan zararlardan YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Yasal Uyumsuzluklar:</strong> Kullanıcıların yasal uyumsuzlukları, lisans eksiklikleri, belge eksiklikleri, vergi sorunlarından YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Anlaşmazlıklar ve Uyuşmazlıklar:</strong> Gönderici ve nakliyeci arasındaki anlaşmazlıklar, uyuşmazlıklar, sözleşme ihlalleri, tazminat talepleri, dava süreçlerinden YolNext KESİNLİKLE sorumlu değildir</li>
                <li><strong>Doğal Afetler ve Mücbir Sebepler:</strong> Deprem, sel, yangın, savaş, terör, salgın hastalık gibi mücbir sebeplerden kaynaklanan zararlardan YolNext KESİNLİKLE sorumlu değildir</li>
              </ul>
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mb-4">
                <p className="text-red-900 font-bold">
                  ⚠️ YOLNEXT HİÇBİR SİGORTA HİZMETİ VERMEZ. SİGORTA İLE İLGİLİ TÜM SORUMLULUK KULLANICILARA AİTTİR.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2. Kullanıcı Sorumluluğu (TAM SORUMLULUK)</h3>
              <p className="text-gray-700 mb-4 font-semibold">
                Platformu kullanarak, aşağıdakileri KESİN OLARAK kabul etmiş sayılırsınız:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-4 font-semibold">
                <li><strong>Göndericiler:</strong> Gönderilerinizi uygun şekilde paketlemek, doğru bilgi vermek, yasaklı madde göndermemek, gerekli sigortaları yaptırmak (eğer istiyorsanız), tüm riskleri üstlenmek TAMAMEN sizin sorumluluğunuzdadır</li>
                <li><strong>Nakliyeciler:</strong> Taşımacılık hizmetlerini yasalara uygun şekilde sağlamak, gerekli lisansları bulundurmak, gerekli sigortaları yaptırmak (eğer istiyorsanız), gönderileri güvenli şekilde taşımak, tüm riskleri üstlenmek TAMAMEN sizin sorumluluğunuzdadır</li>
                <li><strong>Her İki Taraf:</strong> Aranızdaki anlaşmalar, anlaşmazlıklar, uyuşmazlıklar, tazminat talepleri, dava süreçleri, sigorta işlemleri, tüm mali ve hukuki yükümlülükler TAMAMEN sizin sorumluluğunuzdadır</li>
                <li><strong>YolNext:</strong> Sadece bir aracı platformdur, hiçbir şekilde taraf değildir, hiçbir hizmeti bizzat sağlamaz, hiçbir sorumluluk kabul etmez</li>
                <li><strong>Sigorta:</strong> YolNext hiçbir sigorta hizmeti vermez. İhtiyaç duyuyorsanız, kendi sigortanızı yaptırmak TAMAMEN sizin sorumluluğunuzdadır. Sigorta eksikliğinden kaynaklanan tüm zararlar sizin sorumluluğunuzdadır</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3. Yasal Yükümlülükler</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Göndericiler: Gönderileriniz için gerekli tüm yasal yükümlülükleri yerine getirmek sizin sorumluluğunuzdadır</li>
                <li>Nakliyeciler: Yasal zorunluluklarınızı (lisans, vergi) yerine getirmek sizin sorumluluğunuzdadır</li>
                <li>YolNext, kullanıcıların yasal yükümlülüklerini kontrol etmez veya garanti etmez</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.4. Anlaşmazlıklar</h3>
              <p className="text-gray-700 mb-4">
                Gönderici ve nakliyeci arasındaki anlaşmazlıklar:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>YolNext tarafından çözülmez</li>
                <li>İlgili taraflar arasında çözülmelidir</li>
                <li>Gerekirse yasal yollara başvurulabilir</li>
                <li>YolNext hiçbir şekilde taraf olmaz ve sorumluluk kabul etmez</li>
              </ul>

              <div className="bg-red-100 border-4 border-red-500 rounded-lg p-8 mt-6">
                <p className="text-red-900 font-bold text-lg mb-4">
                  ⚠️⚠️⚠️ <strong>KRİTİK UYARI:</strong> Platformu kullanarak, YolNext'in yukarıda belirtilen TÜM durumlardan 
                  ve bunlarla sınırlı olmamak üzere HER TÜRLÜ durumdan KESİNLİKLE sorumlu olmadığını, 
                  YolNext'in sadece bir aracı platform olduğunu, hiçbir hizmeti bizzat sağlamadığını, 
                  hiçbir sigorta hizmeti vermediğini ve TÜM RİSKLERİN kullanıcılara ait olduğunu 
                  KESİN OLARAK kabul etmiş sayılırsınız.
                </p>
                <p className="text-red-800 font-semibold">
                  YolNext, gönderici ve nakliyeci arasında sadece bir bağlantı kurar. Aranızdaki tüm 
                  anlaşmalar, anlaşmazlıklar, zararlar, sigorta işlemleri, yasal yükümlülükler TAMAMEN 
                  sizin sorumluluğunuzdadır. YolNext hiçbir şekilde taraf değildir ve sorumluluk kabul etmez.
                </p>
              </div>
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
