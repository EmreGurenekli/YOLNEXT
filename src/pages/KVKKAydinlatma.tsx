import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, FileText, Lock, Eye, Trash2, Download, AlertCircle } from 'lucide-react';
import { LEGAL_CONTACT } from '../config/legal';

const KVKKAydinlatma: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>KVKK Aydınlatma Metni - YolNext</title>
        <meta
          name='description'
          content='Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aydınlatma metni'
        />
      </Helmet>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'>
        <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 md:p-10'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='flex justify-center mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg'>
                <Shield className='w-8 h-8 text-white' />
              </div>
            </div>
            <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 mb-3'>
              KVKK Aydınlatma Metni
            </h1>
            <p className='text-slate-600 text-sm sm:text-base'>
              Kişisel Verilerin Korunması Kanunu (KVKK) m.10 gereği aydınlatma metni
            </p>
          </div>

          {/* Content */}
          <div className='prose prose-slate max-w-none space-y-6'>
            {/* Veri Sorumlusu */}
            <section className='bg-blue-50 rounded-lg p-6 border border-blue-200'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <FileText className='w-5 h-5 text-blue-600' />
                1. Veri Sorumlusu
              </h2>
              <div className='space-y-2 text-sm text-slate-700'>
                <p>
                  <strong>Şirket Unvanı:</strong> {LEGAL_CONTACT.companyName}
                </p>
                <p>
                  <strong>Vergi No:</strong> {LEGAL_CONTACT.taxNumber || '—'}
                </p>
                <p>
                  <strong>Vergi Dairesi:</strong> {LEGAL_CONTACT.taxOffice || '—'}
                </p>
                <p>
                  <strong>Ticaret Sicil No:</strong> {LEGAL_CONTACT.tradeRegistryNumber || '—'}
                </p>
                <p>
                  <strong>Mersis No:</strong> {LEGAL_CONTACT.mersis || '—'}
                </p>
                <p>
                  <strong>Adres:</strong> {LEGAL_CONTACT.address}
                </p>
                <p>
                  <strong>Telefon:</strong> {LEGAL_CONTACT.phone}
                </p>
                <p>
                  <strong>E-posta:</strong> {LEGAL_CONTACT.kvkkEmail}
                </p>
              </div>
            </section>

            {/* Toplanan Kişisel Veriler */}
            <section>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Eye className='w-5 h-5 text-blue-600' />
                2. Toplanan Kişisel Veriler
              </h2>
              <div className='space-y-3 text-sm text-slate-700'>
                <p>
                  YolNext platformu olarak, hizmetlerimizi sunabilmek için aşağıdaki kişisel
                  verileri toplamaktayız:
                </p>
                <ul className='list-disc pl-6 space-y-2'>
                  <li>
                    <strong>Kimlik Bilgileri:</strong> Ad, soyad, doğum tarihi, T.C. kimlik
                    numarası (nakliyeci ve taşıyıcılar için)
                  </li>
                  <li>
                    <strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, adres
                    bilgileri
                  </li>
                  <li>
                    <strong>Mali Bilgiler:</strong> Banka hesap bilgileri, fatura bilgileri,
                    ödeme geçmişi
                  </li>
                  <li>
                    <strong>Kurumsal Bilgiler:</strong> Şirket unvanı, vergi numarası, ticaret
                    sicil numarası (kurumsal kullanıcılar için)
                  </li>
                  <li>
                    <strong>Lokasyon Verileri:</strong> Gönderi toplama ve teslimat adresleri
                  </li>
                  <li>
                    <strong>Kullanım Verileri:</strong> Platform kullanım geçmişi, işlem
                    kayıtları, log dosyaları
                  </li>
                  <li>
                    <strong>Teknik Veriler:</strong> IP adresi, cihaz bilgileri, tarayıcı
                    bilgileri, çerez verileri
                  </li>
                </ul>
              </div>
            </section>

            {/* Veri İşleme Amaçları */}
            <section>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <FileText className='w-5 h-5 text-blue-600' />
                3. Veri İşleme Amaçları
              </h2>
              <div className='space-y-3 text-sm text-slate-700'>
                <p>Toplanan kişisel veriler aşağıdaki amaçlarla işlenmektedir:</p>
                <ul className='list-disc pl-6 space-y-2'>
                  <li>Platform hizmetlerinin sunulması ve yönetimi</li>
                  <li>Gönderi ve taşımacılık işlemlerinin gerçekleştirilmesi</li>
                  <li>Kullanıcı hesaplarının oluşturulması ve yönetimi</li>
                  <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
                  <li>Müşteri hizmetleri ve destek sağlanması</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                  <li>Güvenlik ve dolandırıcılık önleme</li>
                  <li>İstatistiksel analiz ve raporlama</li>
                  <li>Platform iyileştirmeleri ve geliştirmeleri</li>
                </ul>
              </div>
            </section>

            {/* Veri İşleme Hukuki Sebepleri */}
            <section>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Lock className='w-5 h-5 text-blue-600' />
                4. Veri İşleme Hukuki Sebepleri
              </h2>
              <div className='space-y-3 text-sm text-slate-700'>
                <p>
                  Kişisel verileriniz KVKK m.5 ve m.6 uyarınca aşağıdaki hukuki sebeplere dayanarak
                  işlenmektedir:
                </p>
                <ul className='list-disc pl-6 space-y-2'>
                  <li>
                    <strong>Açık Rıza:</strong> Pazarlama ve iletişim faaliyetleri için açık rızanız
                  </li>
                  <li>
                    <strong>Sözleşmenin Kurulması/İfası:</strong> Platform hizmetlerinin
                    sunulması için sözleşme gerekliliği
                  </li>
                  <li>
                    <strong>Yasal Yükümlülük:</strong> Vergi, muhasebe ve diğer yasal
                    yükümlülüklerin yerine getirilmesi
                  </li>
                  <li>
                    <strong>Meşru Menfaat:</strong> Platform güvenliği, dolandırıcılık önleme ve
                    hizmet kalitesinin artırılması
                  </li>
                </ul>
              </div>
            </section>

            {/* Veri Paylaşımı */}
            <section>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <AlertCircle className='w-5 h-5 text-blue-600' />
                5. Kişisel Verilerin Aktarılması
              </h2>
              <div className='space-y-3 text-sm text-slate-700'>
                <p>
                  Kişisel verileriniz, yukarıda belirtilen amaçlarla aşağıdaki üçüncü taraflarla
                  paylaşılabilir:
                </p>
                <ul className='list-disc pl-6 space-y-2'>
                  <li>
                    <strong>Hizmet Sağlayıcılar:</strong> Ödeme işlemleri, hosting, analitik
                    hizmetleri için teknik hizmet sağlayıcılar
                  </li>
                  <li>
                    <strong>Nakliyeci ve Taşıyıcılar:</strong> Gönderi işlemlerinin gerçekleştirilmesi
                    için platform üzerindeki nakliyeci ve taşıyıcılar
                  </li>
                  <li>
                    <strong>Yasal Otoriteler:</strong> Yasal yükümlülükler gereği ilgili kamu
                    kurum ve kuruluşları
                  </li>
                  <li>
                    <strong>İş Ortakları:</strong> Platform hizmetlerinin sunulması için gerekli
                    iş ortakları
                  </li>
                </ul>
                <p className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <strong>Önemli:</strong> Kişisel verileriniz yalnızca yukarıda belirtilen
                  amaçlar ve hukuki sebepler çerçevesinde, gerekli güvenlik önlemleri alınarak
                  paylaşılmaktadır.
                </p>
              </div>
            </section>

            {/* Veri Güvenliği */}
            <section>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Lock className='w-5 h-5 text-blue-600' />
                6. Veri Güvenliği
              </h2>
              <div className='space-y-3 text-sm text-slate-700'>
                <p>
                  Kişisel verilerinizin güvenliği için aşağıdaki teknik ve idari önlemler
                  alınmaktadır:
                </p>
                <ul className='list-disc pl-6 space-y-2'>
                  <li>SSL/TLS şifreleme protokolleri</li>
                  <li>Güvenli sunucu altyapısı ve veri merkezleri</li>
                  <li>Düzenli güvenlik denetimleri ve testleri</li>
                  <li>Erişim kontrolü ve yetkilendirme sistemleri</li>
                  <li>Yedekleme ve felaket kurtarma planları</li>
                  <li>Personel eğitimleri ve gizlilik taahhütleri</li>
                </ul>
              </div>
            </section>

            {/* KVKK Hakları */}
            <section>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Shield className='w-5 h-5 text-blue-600' />
                7. KVKK Kapsamındaki Haklarınız (KVKK m.11)
              </h2>
              <div className='space-y-3 text-sm text-slate-700'>
                <p>KVKK m.11 uyarınca aşağıdaki haklara sahipsiniz:</p>
                <ul className='list-disc pl-6 space-y-2'>
                  <li>
                    <strong>Bilgi Alma Hakkı:</strong> Kişisel verilerinizin işlenip işlenmediğini
                    öğrenme
                  </li>
                  <li>
                    <strong>Erişim Hakkı:</strong> İşlenen kişisel verilerinize erişim talep etme
                  </li>
                  <li>
                    <strong>Düzeltme Hakkı:</strong> Yanlış veya eksik verilerin düzeltilmesini
                    talep etme
                  </li>
                  <li>
                    <strong>Silme Hakkı:</strong> Kişisel verilerinizin silinmesini talep etme
                    (KVKK m.7)
                  </li>
                  <li>
                    <strong>İtiraz Hakkı:</strong> Kişisel verilerinizin işlenmesine itiraz etme
                  </li>
                  <li>
                    <strong>Veri Taşınabilirlik Hakkı:</strong> Verilerinizi başka bir platforma
                    aktarma
                  </li>
                </ul>
                <p className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <strong>Haklarınızı Kullanma:</strong> Yukarıdaki haklarınızı kullanmak için{' '}
                  <Link
                    to='/contact'
                    className='text-blue-600 hover:text-blue-700 underline font-medium'
                  >
                    İletişim
                  </Link>{' '}
                  sayfasından bizimle iletişime geçebilir veya{' '}
                  <Link
                    to='/individual/settings'
                    className='text-blue-600 hover:text-blue-700 underline font-medium'
                  >
                    Ayarlar
                  </Link>{' '}
                  sayfasından verilerinizi görüntüleyebilir/silebilirsiniz.
                </p>
              </div>
            </section>

            {/* Veri Saklama Süreleri */}
            <section>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <FileText className='w-5 h-5 text-blue-600' />
                8. Veri Saklama Süreleri
              </h2>
              <div className='space-y-3 text-sm text-slate-700'>
                <p>
                  Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca saklanmaktadır:
                </p>
                <ul className='list-disc pl-6 space-y-2'>
                  <li>
                    <strong>Hesap Verileri:</strong> Hesabınız aktif olduğu sürece ve hesap
                    silinene kadar
                  </li>
                  <li>
                    <strong>İşlem Kayıtları:</strong> Yasal saklama süreleri gereği (genellikle 10
                    yıl)
                  </li>
                  <li>
                    <strong>Mali Kayıtlar:</strong> Vergi mevzuatı gereği (genellikle 10 yıl)
                  </li>
                  <li>
                    <strong>Log Dosyaları:</strong> Güvenlik ve analiz amaçlı (maksimum 2 yıl)
                  </li>
                  <li>
                    <strong>Çerez Verileri:</strong> Çerez türüne göre (oturum çerezleri oturum
                    sonunda, kalıcı çerezler belirlenen süre boyunca)
                  </li>
                </ul>
              </div>
            </section>

            {/* İletişim */}
            <section className='bg-slate-50 rounded-lg p-6 border border-slate-200'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <AlertCircle className='w-5 h-5 text-blue-600' />
                9. İletişim
              </h2>
              <div className='space-y-2 text-sm text-slate-700'>
                <p>
                  KVKK kapsamındaki haklarınızı kullanmak veya sorularınız için bizimle iletişime
                  geçebilirsiniz:
                </p>
                <p>
                  <strong>E-posta:</strong> {LEGAL_CONTACT.kvkkEmail}
                </p>
                <p>
                  <strong>Adres:</strong> {LEGAL_CONTACT.address}
                </p>
                <p>
                  <strong>Telefon:</strong> {LEGAL_CONTACT.phone}
                </p>
              </div>
            </section>

            {/* Footer Links */}
            <div className='mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-4 justify-center'>
              <Link
                to='/privacy'
                className='text-sm text-blue-600 hover:text-blue-700 underline'
              >
                Gizlilik Politikası
              </Link>
              <Link to='/terms' className='text-sm text-blue-600 hover:text-blue-700 underline'>
                Kullanım Koşulları
              </Link>
              <Link
                to='/cookie-policy'
                className='text-sm text-blue-600 hover:text-blue-700 underline'
              >
                Çerez Politikası
              </Link>
              <Link to='/contact' className='text-sm text-blue-600 hover:text-blue-700 underline'>
                İletişim
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KVKKAydinlatma;
