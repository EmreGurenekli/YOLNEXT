import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Package,
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
  CreditCard,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const IndividualHelp = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/individual/dashboard' },
    { label: 'Yardım', href: '/individual/help' },
  ];

  const quickActions = [
    {
      title: 'Gönderi Oluştur',
      description: 'Yeni bir gönderi oluşturun ve nakliyecilerden teklif alın',
      icon: Package,
      link: '/individual/create-shipment',
    },
    {
      title: 'Gönderilerim',
      description: 'Gönderilerinizi takip edin ve yönetin',
      icon: Truck,
      link: '/individual/my-shipments',
    },
    {
      title: 'Teklifler',
      description: 'Gelen teklifleri görüntüleyin ve karşılaştırın',
      icon: DollarSign,
      link: '/individual/offers',
    },
    {
      title: 'Canlı Takip',
      description: 'Gönderilerinizi gerçek zamanlı takip edin',
      icon: MapPin,
      link: '/individual/live-tracking',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Hesap Oluşturun',
      description: 'Kayıt olun ve profil bilgilerinizi tamamlayın',
      icon: Users,
    },
    {
      step: 2,
      title: 'Gönderi Oluşturun',
      description: 'Kategori seçin, adres bilgilerini girin ve yayınlayın',
      icon: Package,
    },
    {
      step: 3,
      title: 'Teklifleri İnceleyin',
      description: 'Gelen teklifleri karşılaştırın ve en uygun olanı seçin',
      icon: Star,
    },
    {
      step: 4,
      title: 'Ödeme Yapın',
      description: 'Güvenli ödeme yöntemlerinden birini seçerek ödeme yapın',
      icon: CreditCard,
    },
    {
      step: 5,
      title: 'Takip Edin',
      description: 'Gönderinizi canlı takip edin ve teslim edilmesini bekleyin',
      icon: MapPin,
    },
  ];

  const faqCategories = [
    {
      category: 'Başlangıç',
      icon: Zap,
      items: [
        {
          question: 'YolNext nedir ve nasıl çalışır?',
          answer: 'YolNext, gönderici ve nakliyeci arasında köprü kuran bir lojistik platformudur. Gönderi oluşturur, nakliyecilerden teklif alır, en uygun teklifi seçer ve güvenli ödeme yaparsınız. Platform tüm süreci takip eder ve size bildirimler gönderir.',
        },
        {
          question: 'Hesap oluşturmak ücretsiz mi?',
          answer: 'Evet, YolNext tamamen ücretsizdir. Üyelik ücreti, gönderi ücreti veya gizli ücret yoktur. Sadece nakliyeci %1 komisyon öder, sizin için her şey ücretsizdir.',
        },
        {
          question: 'Hangi şehirlere gönderi yapabilirim?',
          answer: 'YolNext Türkiye\'nin 81 ilinde hizmet vermektedir. İstediğiniz şehirler arasında gönderi oluşturabilirsiniz.',
        },
      ],
    },
    {
      category: 'Gönderi Oluşturma',
      icon: Package,
      items: [
        {
          question: 'Gönderi nasıl oluştururum?',
          answer: 'Dashboard\'dan "Gönderi Oluştur" butonuna tıklayın. Kategori seçin (Ev Taşınması, Eşya Taşıma, vb.), toplama ve teslimat adreslerini girin, ağırlık ve hacim bilgilerini belirtin, özel gereksinimlerinizi ekleyin ve yayınlayın. Nakliyeciler size teklif göndermeye başlayacaktır.',
        },
        {
          question: 'Hangi kategorilerde gönderi oluşturabilirim?',
          answer: 'Ev taşınması, eşya taşıma, özel kargo, soğuk zincir ve diğer kategorilerde gönderi oluşturabilirsiniz. Her kategori için özel form alanları bulunmaktadır.',
        },
        {
          question: 'Gönderi fiyatını kim belirliyor?',
          answer: 'Fiyatı nakliyeciler belirler. Gönderinizi yayınladıktan sonra nakliyeciler size teklif gönderir. Size en uygun teklifi seçebilirsiniz.',
        },
        {
          question: 'Gönderi oluştururken hangi bilgiler gereklidir?',
          answer: 'Kategori, toplama ve teslimat adresleri, ağırlık, hacim, teslimat tarihi ve özel gereksinimler gereklidir. Bazı kategoriler için ek bilgiler istenebilir (örneğin ev taşınması için oda sayısı, asansör durumu vb.).',
        },
      ],
    },
    {
      category: 'Teklifler ve Ödeme',
      icon: DollarSign,
      items: [
        {
          question: 'Teklifleri nasıl görüntülerim?',
          answer: 'Gönderilerim sayfasından gönderinizi seçin ve "Teklifler" sekmesine bakın. Teklifleri fiyat, süre ve nakliyeci puanına göre karşılaştırabilirsiniz.',
        },
        {
          question: 'Teklif kabul etmeden önce nakliyeci ile konuşabilir miyim?',
          answer: 'Evet, gönderi detay sayfasından nakliyeci ile mesajlaşabilirsiniz. Sorularınızı sorabilir ve detayları netleştirebilirsiniz.',
        },
        {
          question: 'Ödeme nasıl yapılır?',
          answer: 'Teklifi kabul ettikten sonra ödeme ekranına yönlendirilirsiniz. Kredi kartı, havale veya cüzdan bakiyenizle ödeme yapabilirsiniz. Ödeme güvenli bir şekilde işlenir.',
        },
        {
          question: 'Ödeme ne zaman yapılır?',
          answer: 'Teklifi kabul ettiğinizde ödeme yapılır. Ancak ödeme, gönderi teslim edilene kadar nakliyeciye serbest bırakılmaz. Bu sayede hem siz hem de nakliyeci korunmuş olur.',
        },
      ],
    },
    {
      category: 'Takip ve Teslimat',
      icon: MapPin,
      items: [
        {
          question: 'Gönderimi nasıl takip ederim?',
          answer: 'Gönderilerim sayfasından gönderinizin durumunu görebilirsiniz. Ayrıca "Canlı Takip" sayfasından gerçek zamanlı konum takibi yapabilirsiniz. Gönderi durumu değiştiğinde bildirim alırsınız.',
        },
        {
          question: 'Gönderi durumları nelerdir?',
          answer: 'Beklemede: Teklif bekleniyor, Teklif Kabul Edildi: Nakliyeci seçildi, Yola Çıktı: Gönderi yola çıktı, Teslimatta: Teslim ediliyor, Teslim Edildi: Başarıyla teslim edildi.',
        },
        {
          question: 'Teslimat süresi ne kadar?',
          answer: 'Teslimat süresi şehirler arası mesafeye ve gönderi tipine bağlıdır. Genellikle 2-5 gün arasındadır. Nakliyeci teklifinde teslimat tarihini belirtir.',
        },
      ],
    },
    {
      category: 'İptal ve İade',
      icon: AlertCircle,
      items: [
        {
          question: 'Gönderim iptal edilebilir mi?',
          answer: 'Evet, gönderi henüz kabul edilmediyse (beklemede durumunda) iptal edebilirsiniz. Ancak kabul edilen gönderiler için iptal koşulları nakliyeci ile anlaşmanıza bağlıdır.',
        },
        {
          question: 'İptal edersem paramı geri alır mıyım?',
          answer: 'Beklemede durumundaki gönderiler için tam iade yapılır. Kabul edilen gönderiler için iptal durumunda %80 iade yapılır. Gönderi yola çıktıktan sonra iptal için özel durumlar değerlendirilir.',
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
        <title>Yardım ve Destek - Bireysel Gönderici | YolNext</title>
        <meta name="description" content="YolNext bireysel gönderici yardım ve destek sayfası. Sorularınızın cevaplarını burada bulabilirsiniz." />
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
                <HelpCircle className='w-8 h-8 text-white' />
              </div>
              <div className='flex-1'>
                <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                  Yardım ve Destek Merkezi
                </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Size nasıl yardımcı olabiliriz? Sorularınızın cevaplarını burada bulabilirsiniz.
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
              <h2 className='text-2xl font-bold text-slate-900'>Hızlı Başlangıç Rehberi</h2>
              <p className='text-slate-600'>5 adımda YolNext'i kullanmaya başlayın</p>
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

export default IndividualHelp;
