import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Truck,
  MapPin,
  DollarSign,
  Shield,
  MessageCircle,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  Bell,
  BarChart3,
  Users,
  Settings,
  AlertCircle,
  Info,
  Zap,
  Target,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Briefcase,
  User,
  Award,
  Route,
  Navigation,
  Calendar,
  FileCheck,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const TasiyiciHelp = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/tasiyici/dashboard' },
    { label: 'Yardım', href: '/tasiyici/help' },
  ];

  const quickActions = [
    {
      title: 'İş Pazarı',
      description: 'Açık ilanları görüntüleyin ve başvurun',
      icon: Briefcase,
      link: '/tasiyici/market',
    },
    {
      title: 'Aktif İşler',
      description: 'Atanmış görevlerinizi takip edin',
      icon: Truck,
      link: '/tasiyici/active-jobs',
    },
    {
      title: 'Ayarlar',
      description: 'Profil ve belgelerinizi yönetin',
      icon: Settings,
      link: '/tasiyici/settings',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Hesap Oluşturun',
      description: 'Taşıyıcı hesabı oluşturun ve belgelerinizi yükleyin',
      icon: User,
    },
    {
      step: 2,
      title: 'İş Pazarını İnceleyin',
      description: 'Açık ilanları görüntüleyin ve uygun işleri bulun',
      icon: Briefcase,
    },
    {
      step: 3,
      title: 'Başvuru Yapın',
      description: 'İlgilendiğiniz işlere başvuru yapın',
      icon: CheckCircle,
    },
    {
      step: 4,
      title: 'Görevi Tamamlayın',
      description: 'Atanan görevleri tamamlayın ve durum güncellemesi yapın',
      icon: Truck,
    },
  ];

  const faqCategories = [
    {
      category: 'Başlangıç',
      icon: Zap,
      items: [
        {
          question: 'Taşıyıcı hesabı nasıl oluşturulur?',
          answer: 'Kayıt sayfasından "Taşıyıcı" seçeneğini seçin. Kişisel bilgilerinizi girin ve belgelerinizi (ehliyet, ruhsat vb.) yükleyin. Hesabınız doğrulandıktan sonra işlere başvurmaya başlayabilirsiniz.',
        },
        {
          question: 'Taşıyıcı olmanın avantajları nelerdir?',
          answer: 'Esnek çalışma saatleri, çeşitli iş fırsatları, güvenli ödeme, performans bazlı kazanç ve nakliyeci ile doğrudan iletişim gibi avantajlar sunulmaktadır.',
        },
        {
          question: 'Hangi belgeler gereklidir?',
          answer: 'Ehliyet, araç ruhsatı ve kimlik belgesi gereklidir. Belgeleriniz doğrulandıktan sonra işlere başvurabilirsiniz.',
        },
      ],
    },
    {
      category: 'İş Başvurusu',
      icon: Briefcase,
      items: [
        {
          question: 'İşlere nasıl başvururum?',
          answer: 'İş Pazarı sayfasından açık ilanları görüntüleyin. İlgilendiğiniz işe tıklayın ve "Başvur" butonuna basın. Başvurunuz nakliyeciye iletilecektir.',
        },
        {
          question: 'Kaç işe aynı anda başvurabilirim?',
          answer: 'Aynı anda birden fazla işe başvurabilirsiniz. Ancak kabul edilen işleri zamanında tamamlamanız önemlidir.',
        },
        {
          question: 'Başvurumu iptal edebilir miyim?',
          answer: 'Nakliyeci kabul etmeden önce başvurunuzu iptal edebilirsiniz. Ancak kabul edilen başvurular için iptal koşulları nakliyeci ile anlaşmanıza bağlıdır.',
        },
        {
          question: 'Başvurum ne zaman kabul edilir?',
          answer: 'Nakliyeci başvurunuzu inceler ve kabul eder. Kabul edildiğinde size bildirim gönderilir.',
        },
      ],
    },
    {
      category: 'Görev Yönetimi',
      icon: Truck,
      items: [
        {
          question: 'Atanan görevleri nasıl görüntülerim?',
          answer: 'Aktif İşler sayfasından tüm atanmış görevlerinizi görüntüleyebilirsiniz. Görev detaylarına tıklayarak rota, adres ve özel gereksinimleri görebilirsiniz.',
        },
        {
          question: 'Görev durumunu nasıl güncellerim?',
          answer: 'Görev detay sayfasından durum güncellemesi yapabilirsiniz. "Yola Çıktı", "Teslimatta" ve "Teslim Edildi" gibi durumları seçebilirsiniz.',
        },
        {
          question: 'İş durumunu nasıl güncellerim?',
          answer: 'Aktif işler sayfasında veya iş detay sayfasında "Yükü Aldım", "Yoldayım" ve "Teslim Ettim" butonlarını kullanarak durumunuzu güncelleyebilirsiniz. İnternet olmasa bile butonlar çalışır, internet gelince otomatik gönderilir.',
        },
        {
          question: 'Görevi nasıl tamamlarım?',
          answer: 'Gönderiyi teslim ettikten sonra görev detay sayfasından "Teslim Edildi" durumunu seçin. Gönderici onayı sonrası ödeme süreci başlar.',
        },
      ],
    },
    {
      category: 'Belgeler ve Profil',
      icon: FileCheck,
      items: [
        {
          question: 'Belgelerimi nasıl güncellerim?',
          answer: 'Ayarlar sayfasından "Belgeler" sekmesine gidin. Yeni belge yüklemek için "Belge Ekle" butonuna tıklayın. Mevcut belgeleri güncelleyebilir veya silebilirsiniz.',
        },
        {
          question: 'Profil bilgilerimi nasıl düzenlerim?',
          answer: 'Ayarlar sayfasından "Profil" sekmesine gidin. Kişisel bilgilerinizi, iletişim bilgilerinizi ve araç bilgilerinizi güncelleyebilirsiniz.',
        },
        {
          question: 'Belge doğrulama süresi ne kadar?',
          answer: 'Belgeleriniz yüklendikten sonra 1-2 iş günü içinde doğrulanır. Doğrulama sonrası işlere başvurabilirsiniz.',
        },
      ],
    },
    {
      category: 'Performans ve Puan',
      icon: Award,
      items: [
        {
          question: 'Puan sistemi nasıl çalışır?',
          answer: 'Tamamlanan her görev için gönderici ve nakliyeci size puan verir. Ortalama puanınız profil sayfanızda görüntülenir ve yeni iş başvurularında önemlidir.',
        },
        {
          question: 'Puanımı nasıl yükseltebilirim?',
          answer: 'Görevleri zamanında tamamlayarak, müşteri memnuniyetine önem vererek ve profesyonel davranarak puanınızı yükseltebilirsiniz.',
        },
        {
          question: 'Performans raporlarını nasıl görüntülerim?',
          answer: 'Dashboard\'dan performans istatistiklerinizi görebilirsiniz. Tamamlanan görev sayısı, ortalama puan ve toplam kazanç gibi bilgileri görüntüleyebilirsiniz.',
        },
      ],
    },
    {
      category: 'Sorunlar ve İptal',
      icon: AlertCircle,
      items: [
        {
          question: 'Görevi iptal edebilir miyim?',
          answer: 'Kabul edilen görevler için iptal koşulları nakliyeci ile anlaşmanıza bağlıdır. Acil durumlarda nakliyeci ile iletişime geçerek iptal talebinde bulunabilirsiniz.',
        },
        {
          question: 'Sorun yaşarsam ne yapmalıyım?',
          answer: 'Herhangi bir sorun yaşarsanız görev detay sayfasından nakliyeci ile iletişime geçebilir veya destek ekibimizle iletişime geçebilirsiniz.',
        },
        {
          question: 'Gönderi hasar gördüyse ne yapmalıyım?',
          answer: 'Hemen nakliyeci ve gönderici ile iletişime geçin. Durumu bildirin ve fotoğraf çekin. Destek ekibimiz süreci yönetmenize yardımcı olacaktır.',
        },
      ],
    },
  ];

  const allFAQs = faqCategories.flatMap(cat => cat.items);

  const filteredFAQs = allFAQs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Yardım ve Destek - Taşıyıcı | YolNext</title>
        <meta name="description" content="YolNext taşıyıcı yardım ve destek sayfası. Taşıyıcılar için özel rehber ve SSS." />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                <Truck className='w-8 h-8 text-white' />
              </div>
              <div className='flex-1'>
                <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                  Taşıyıcı Yardım Merkezi
                </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Taşıyıcı olarak platformu nasıl kullanacağınız hakkında kapsamlı bilgiler. Sorularınızın cevaplarını burada bulabilirsiniz.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Sorunuzu arayın..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-white/40 focus:ring-2 focus:ring-white/20 outline-none transition-all text-white placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group'
              >
                <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
                  <Icon className='w-6 h-6 text-white' />
                </div>
                <h3 className='text-base font-semibold text-slate-900 mb-2'>
                  {action.title}
                </h3>
                <p className='text-sm text-slate-600 mb-4'>
                  {action.description}
                </p>
                <div className='flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all'>
                  Başla <ArrowRight className='w-4 h-4 ml-1 group-hover:ml-2' />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Getting Started Guide */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
              <Zap className='w-6 h-6 text-white' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-slate-900'>Taşıyıcı Kullanım Rehberi</h2>
              <p className='text-slate-600'>5 adımda taşıyıcı olarak platformu kullanmaya başlayın</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            {guideSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className='relative'>
                  <div className='bg-slate-50 border border-gray-100 rounded-lg p-5 h-full'>
                    <div className='flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg mb-3 mx-auto'>
                      <Icon className='w-5 h-5 text-white' />
                    </div>
                    <div className='absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-slate-800 to-blue-900 text-white rounded-full flex items-center justify-center font-bold text-xs'>
                      {step.step}
                    </div>
                    <h3 className='text-sm font-semibold text-slate-900 mb-2 text-center'>
                      {step.title}
                    </h3>
                    <p className='text-xs text-slate-600 text-center'>
                      {step.description}
                    </p>
                  </div>
                  {index < guideSteps.length - 1 && (
                    <div className='hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2'>
                      <ArrowRight className='w-4 h-4 text-slate-400' />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6'>
          <div className='flex items-center gap-3 mb-6'>
            <FileText className='w-6 h-6 text-slate-900' />
            <h2 className='text-2xl font-bold text-slate-900'>Sık Sorulan Sorular</h2>
          </div>

          {searchTerm ? (
            <div className='mb-4 text-slate-600 text-sm'>
              <strong>{filteredFAQs.length}</strong> sonuç bulundu
            </div>
          ) : (
            <div className='mb-6'>
              <div className='flex flex-wrap gap-2'>
                {faqCategories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const categoryIndex = faqCategories.findIndex(cat => cat.category === category.category);
                        const firstFAQIndex = faqCategories.slice(0, categoryIndex).reduce((acc, cat) => acc + cat.items.length, 0);
                        setOpenFAQ(firstFAQIndex);
                      }}
                      className='flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 border border-gray-200 transition-colors text-sm font-medium'
                    >
                      <Icon className='w-4 h-4' />
                      {category.category}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className='space-y-3'>
            {(searchTerm ? filteredFAQs : allFAQs).map((item, index) => {
              const isOpen = openFAQ === index;
              return (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-all'
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className='w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors'
                  >
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center'>
                          <Info className='w-4 h-4 text-slate-600' />
                        </div>
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-base font-semibold text-slate-900 mb-1'>
                          {item.question}
                        </h3>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className='w-5 h-5 text-slate-400 flex-shrink-0 ml-4' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-slate-400 flex-shrink-0 ml-4' />
                    )}
                  </button>
                  {isOpen && (
                    <div className='px-4 pb-4 pt-0 border-t border-gray-200'>
                      <div className='pl-11 pt-3'>
                        <p className='text-slate-600 leading-relaxed text-sm'>{item.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {searchTerm && filteredFAQs.length === 0 && (
            <div className='text-center py-12'>
              <Search className='w-12 h-12 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-600'>Aradığınız soru bulunamadı. Lütfen farklı bir arama terimi deneyin.</p>
            </div>
          )}
        </div>

        {/* Support Options */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
              <MessageCircle className='w-5 h-5 text-white' />
            </div>
            <h3 className='text-base font-semibold text-slate-900 mb-2'>Canlı Destek</h3>
            <p className='text-slate-600 mb-4 text-sm'>
              7/24 canlı destek hattımızdan anında yardım alın
            </p>
            <Link
              to='/contact'
              className='inline-flex items-center text-slate-900 font-medium text-sm hover:gap-2 transition-all'
            >
              Başlat <ArrowRight className='w-4 h-4 ml-1' />
            </Link>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
              <Mail className='w-5 h-5 text-white' />
            </div>
            <h3 className='text-base font-semibold text-slate-900 mb-2'>Email Desteği</h3>
            <p className='text-slate-600 mb-4 text-sm'>
              Sorularınızı email ile gönderin, 24 saat içinde yanıt alın
            </p>
            <a
              href='mailto:destek@yolnext.com'
              className='inline-flex items-center text-slate-900 font-medium text-sm hover:gap-2 transition-all'
            >
              Email Gönder <ArrowRight className='w-4 h-4 ml-1' />
            </a>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
              <Phone className='w-5 h-5 text-white' />
            </div>
            <h3 className='text-base font-semibold text-slate-900 mb-2'>Telefon Desteği</h3>
            <p className='text-slate-600 mb-4 text-sm'>
              Hafta içi 09:00-18:00 arası telefon desteği
            </p>
            <a
              href='tel:+905551234567'
              className='inline-flex items-center text-slate-900 font-medium text-sm hover:gap-2 transition-all'
            >
              Ara <ArrowRight className='w-4 h-4 ml-1' />
            </a>
          </div>
        </div>

        {/* Contact CTA */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-32 translate-x-32'></div>
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-24 -translate-x-24'></div>
          
          <div className='relative z-10 text-center'>
            <Shield className='w-12 h-12 mx-auto mb-4 text-white' />
            <h2 className='text-2xl font-bold mb-3'>Hala Yardıma İhtiyacınız mı Var?</h2>
            <p className='text-slate-200 mb-8 max-w-2xl mx-auto'>
              Sorularınız için bizimle iletişime geçebilirsiniz. Destek ekibimiz size yardımcı olmaktan mutluluk duyar.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Link
                to='/contact'
                className='bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-lg'
              >
                <MessageCircle className='w-5 h-5' />
                İletişime Geç
              </Link>
              <a
                href='mailto:destek@yolnext.com'
                className='bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20'
              >
                <Mail className='w-5 h-5' />
                Email Gönder
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasiyiciHelp;
