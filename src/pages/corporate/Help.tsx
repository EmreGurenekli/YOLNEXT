import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Building2,
  Package,
  Truck,
  FileText,
  DollarSign,
  Shield,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  CreditCard,
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
  Receipt,
  FileCheck,
  Calendar,
  TrendingDown,
  Globe,
  Award,
  Lock,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const CorporateHelp: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/corporate/dashboard' },
    { label: 'Yardım', href: '/corporate/help' },
  ];

  const quickActions = [
    {
      title: 'Gönderi Oluştur',
      description: 'Toplu gönderiler için gelişmiş form',
      icon: Package,
      link: '/corporate/create-shipment',
    },
    {
      title: 'Gönderilerim',
      description: 'Tüm gönderilerinizi yönetin',
      icon: Truck,
      link: '/corporate/shipments',
    },
    {
      title: 'Teklifler',
      description: 'Gelen teklifleri karşılaştırın',
      icon: DollarSign,
      link: '/corporate/offers',
    },
    {
      title: 'Analitik',
      description: 'Detaylı raporlar ve istatistikler',
      icon: BarChart3,
      link: '/corporate/analytics',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Hesap Oluşturun',
      description: 'Kurumsal hesap oluşturun ve doğrulayın',
      icon: Building2,
    },
    {
      step: 2,
      title: 'Gönderi Oluşturun',
      description: '19 kategori arasından seçin ve detayları girin',
      icon: Package,
    },
    {
      step: 3,
      title: 'Teklifleri İnceleyin',
      description: 'Gelen teklifleri karşılaştırın ve seçin',
      icon: Star,
    },
    {
      step: 4,
      title: 'Toplu Ödeme',
      description: 'Kurumsal ödeme yöntemleriyle ödeme yapın',
      icon: CreditCard,
    },
    {
      step: 5,
      title: 'Takip ve Raporlama',
      description: 'Gönderilerinizi takip edin ve raporlar alın',
      icon: BarChart3,
    },
  ];

  const faqCategories = [
    {
      category: 'Kurumsal Hesap',
      icon: Building2,
      items: [
        {
          question: 'Kurumsal hesap nasıl oluşturulur?',
          answer: 'Kayıt sayfasından "Kurumsal Gönderici" seçeneğini seçin. Şirket bilgilerinizi, vergi numarası ve vergi dairesi bilgilerinizi girin. Hesabınız doğrulandıktan sonra kurumsal özelliklerden faydalanabilirsiniz.',
        },
        {
          question: 'Kurumsal hesabın avantajları nelerdir?',
          answer: 'Toplu gönderi oluşturma, detaylı analitik ve raporlama, özel sözleşmeler, toplu faturalama, öncelikli destek ve özel indirimler gibi avantajlar sunulmaktadır.',
        },
        {
          question: 'Hesap doğrulama süreci nasıl işler?',
          answer: 'Şirket bilgileriniz ve vergi kayıt belgeniz kontrol edilir. Doğrulama genellikle 1-2 iş günü içinde tamamlanır. Doğrulama sonrası kurumsal özelliklere erişebilirsiniz.',
        },
      ],
    },
    {
      category: 'Gönderi Yönetimi',
      icon: Package,
      items: [
        {
          question: 'Toplu gönderi nasıl oluşturulur?',
          answer: 'Gönderi Oluştur sayfasından kategori seçin. 19 farklı kategori arasından ihtiyacınıza uygun olanı seçin. Her kategori için özel form alanları otomatik olarak görüntülenir. Gönderi bilgilerini doldurup yayınlayın.',
        },
        {
          question: 'Hangi kategoriler mevcuttur?',
          answer: 'Gıda Ürünleri, Soğuk Zincir, İnşaat Malzemeleri, Elektronik, Tekstil, Mobilya, Kimyasal, Tehlikeli Madde, Ev Eşyası, Ofis Eşyası, Makine, Otomotiv, Tarım Ürünleri, Hayvancılık, Eczacılık, Kargo, Belge, Diğer ve Özel Kargo kategorileri mevcuttur.',
        },
        {
          question: 'Ağırlık birimi ton mu?',
          answer: 'Evet, kurumsal gönderiler için ağırlık birimi tondur. Bu sayede daha büyük hacimli gönderiler için daha uygun hesaplama yapılır.',
        },
        {
          question: 'Gönderileri nasıl takip ederim?',
          answer: 'Gönderilerim sayfasından tüm gönderilerinizi görüntüleyebilir, durumlarını takip edebilir ve detaylarına erişebilirsiniz. Ayrıca analitik sayfasından toplu raporlar alabilirsiniz.',
        },
      ],
    },
    {
      category: 'Teklifler ve Ödeme',
      icon: DollarSign,
      items: [
        {
          question: 'Teklifleri nasıl karşılaştırırım?',
          answer: 'Teklifler sayfasından gelen tüm teklifleri görüntüleyebilirsiniz. Fiyat, teslimat süresi, nakliyeci puanı ve yorumlarına göre filtreleme yapabilir ve karşılaştırma yapabilirsiniz.',
        },
        {
          question: 'Kurumsal ödeme yöntemleri nelerdir?',
          answer: 'Kredi kartı, havale/EFT, kurumsal cüzdan ve fatura ödemesi seçenekleri mevcuttur. Fatura ödemesi için önceden anlaşma yapılması gerekebilir.',
        },
        {
          question: 'Toplu ödeme yapabilir miyim?',
          answer: 'Evet, birden fazla gönderi için toplu ödeme yapabilirsiniz. Gönderilerim sayfasından seçim yaparak toplu ödeme ekranına geçebilirsiniz.',
        },
        {
          question: 'Fatura nasıl alırım?',
          answer: 'Tamamlanan gönderiler için otomatik olarak e-fatura oluşturulur. Faturalar sayfasından tüm faturalarınızı görüntüleyebilir ve indirebilirsiniz.',
        },
      ],
    },
    {
      category: 'Analitik ve Raporlama',
      icon: BarChart3,
      items: [
        {
          question: 'Hangi raporlar mevcuttur?',
          answer: 'Gönderi istatistikleri, harcama analizleri, nakliyeci performans raporları, kategori bazlı analizler, zaman bazlı trendler ve karşılaştırmalı raporlar alabilirsiniz.',
        },
        {
          question: 'Raporları nasıl dışa aktarırım?',
          answer: 'Analitik sayfasından CSV veya Excel formatında raporları dışa aktarabilirsiniz. Özel tarih aralığı seçerek detaylı raporlar oluşturabilirsiniz.',
        },
        {
          question: 'Veriler ne kadar süre saklanır?',
          answer: 'Tüm gönderi verileri ve raporlar hesabınız aktif olduğu sürece saklanır. Geçmiş verilere istediğiniz zaman erişebilirsiniz.',
        },
      ],
    },
    {
      category: 'Sözleşmeler ve Faturalar',
      icon: FileText,
      items: [
        {
          question: 'Sözleşme nasıl oluşturulur?',
          answer: 'Teklif kabul edildikten sonra otomatik olarak dijital sözleşme oluşturulur. Sözleşmeler sayfasından tüm sözleşmelerinizi görüntüleyebilir ve indirebilirsiniz.',
        },
        {
          question: 'Fatura detayları nelerdir?',
          answer: 'Faturalarda gönderi detayları, nakliyeci bilgileri, ödeme bilgileri, tarih ve fiyat bilgileri yer alır. Fatura numarası ile takip edebilirsiniz.',
        },
        {
          question: 'Fatura düzenleme yapılabilir mi?',
          answer: 'Faturalar oluşturulduktan sonra düzenlenemez. Ancak iptal edilmiş gönderiler için iade faturası otomatik oluşturulur.',
        },
      ],
    },
    {
      category: 'İptal ve İade',
      icon: AlertCircle,
      items: [
        {
          question: 'Gönderi iptal edilebilir mi?',
          answer: 'Beklemede durumundaki gönderiler tamamen iptal edilebilir. Kabul edilen gönderiler için iptal koşulları nakliyeci ile anlaşmanıza bağlıdır ve %80 iade yapılır.',
        },
        {
          question: 'İade süreci nasıl işler?',
          answer: 'İptal edilen gönderiler için otomatik olarak iade işlemi başlatılır. Ödeme yönteminize göre 3-7 iş günü içinde iade tamamlanır.',
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
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Yardım ve Destek - Kurumsal Gönderici | YolNext</title>
        <meta name="description" content="YolNext kurumsal gönderici yardım ve destek sayfası. Kurumsal kullanıcılar için özel rehber ve SSS." />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                <Building2 className='w-8 h-8 text-white' />
              </div>
              <div className='flex-1'>
                <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                  Kurumsal Yardım Merkezi
          </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Kurumsal ihtiyaçlarınıza özel destek ve rehberlik. Sorularınızın cevaplarını burada bulabilirsiniz.
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
              <h2 className='text-2xl font-bold text-slate-900'>Kurumsal Kullanım Rehberi</h2>
              <p className='text-slate-600'>5 adımda kurumsal özellikleri kullanmaya başlayın</p>
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
            <h3 className='text-base font-semibold text-slate-900 mb-2'>Kurumsal Destek</h3>
            <p className='text-slate-600 mb-4 text-sm'>
              Özel kurumsal destek hattımızdan anında yardım alın
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
              href='mailto:kurumsal@yolnext.com'
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
              Hafta içi 09:00-18:00 arası kurumsal telefon desteği
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
              Kurumsal ihtiyaçlarınız için özel destek ekibimiz size yardımcı olmaktan mutluluk duyar.
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
                href='mailto:kurumsal@yolnext.com'
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

export default CorporateHelp;
