import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { 
  Package, Truck, DollarSign, MapPin, Users, 
  FileText, ChevronDown, ChevronRight, Search,
  ArrowRight, Info, ChevronUp, AlertCircle,
  Shield, LifeBuoy, Plus,
  MessageSquare, AlertTriangle, Clock
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { createApiUrl } from '../../config/api';
import { showProfessionalToast } from '../../utils/toastMessages';

interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

interface SupportCategory {
  id: number;
  name: string;
  description?: string;
}

const IndividualHelp: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Ticket system states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    subject: '',
    description: '',
    relatedShipmentId: '',
  });

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/individual/dashboard' },
    { label: 'Yardım ve Destek Merkezi', href: '/individual/help' },
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
      title: 'Teklifleri Değerlendirin',
      description: 'Gelen teklifleri karşılaştırın, sorularınızı sorup en uygunu seçin',
      icon: DollarSign,
    },
    {
      step: 4,
      title: 'Mesajlaşma ile Netleştirin',
      description: 'Teklif detaylarını mesajlaşma ile netleştirip, uygun teklifi seçerek süreci başlatın',
      icon: MessageSquare,
    },
    {
      step: 5,
      title: 'Takip ve Teslimat',
      description: 'Durum değişikliklerini izleyin, teslimat tamamlandığında teyit verin',
      icon: MapPin,
    },
  ];

  const faqCategories = [
    {
      category: 'Başlangıç',
      icon: Info,
      items: [
        {
          question: 'YolNext nedir ve nasıl çalışır?',
          answer: 'YolNext, gönderi oluşturup nakliyecilerden teklif toplamanızı sağlayan bir lojistik platformudur. Gönderinizi yayınladıktan sonra teklifler gelir, siz uygun teklifi seçersiniz. Süreç boyunca durum güncellemelerini takip edebilirsiniz.',
        },
        {
          question: 'Hesap oluşturmak ücretsiz mü?',
          answer: 'Evet. Bireysel kullanıcılar için hesap oluşturma ve platformu kullanma ücretsizdir. Ücretlendirme, seçtiğiniz hizmete ve teklife göre yalnızca taşıma sürecinde oluşur.',
        },
        {
          question: 'Hangi şehirlere gönderi yapabilirim?',
          answer: 'YolNext üzerinden Türkiye genelinde gönderi oluşturabilirsiniz. Hizmet kapsamı, seçtiğiniz kategoriye ve nakliyeci uygunluğuna göre değişebilir.',
        },
      ],
    },
    {
      category: 'Gönderi Oluşturma',
      icon: Package,
      items: [
        {
          question: 'Gönderi nasıl oluştururum?',
          answer: 'Panelinizden “Gönderi Oluştur” adımına gidin. Kategori seçin, toplama ve teslimat adreslerini girin, tarih/ölçü bilgilerini ekleyin ve ilanı yayınlayın. Yayın sonrası nakliyeciler teklif göndermeye başlar.',
        },
        {
          question: 'Hangi kategorilerde gönderi oluşturabilirim?',
          answer: 'Platformda farklı taşıma türleri için kategoriler bulunur. Kategoriye göre istenen alanlar değişebilir (ör. ev taşıma, parça eşya, ticari yük vb.).',
        },
        {
          question: 'Gönderi fiyatını kim belirliyor?',
          answer: 'Fiyatı nakliyeciler teklif verirken belirler. Siz; fiyat, süre, puan ve koşulları karşılaştırıp uygun teklifi seçebilirsiniz.',
        },
        {
          question: 'Gönderi oluştururken hangi bilgiler gereklidir?',
          answer: 'Genellikle kategori, toplama/teslimat adresleri, tarih aralığı, yük bilgileri (ağırlık/hacim/özellik) ve varsa özel notlar gereklidir. Kategoriye göre ek bilgiler istenebilir.',
        },
      ],
    },
    {
      category: 'Teklifler ve Mesajlaşma',
      icon: DollarSign,
      items: [
        {
          question: 'Teklifleri nasıl görüntülerim?',
          answer: 'Gönderi detayına girerek teklifleri listeleyebilirsiniz. Teklifleri fiyat, tahmini süre ve nakliyeci puanına göre karşılaştırmak mümkündür.',
        },
        {
          question: 'Teklif kabul etmeden önce nakliyeci ile konuşabilir miyim?',
          answer: 'Evet. Teklif/ilan detayından mesajlaşarak sorularınızı iletebilir ve şartları netleştirebilirsiniz.',
        },
        {
          question: 'Teklifi seçince süreç nasıl başlar?',
          answer: 'Uygun teklifi seçtiğinizde gönderi süreci başlar ve gönderiniz ilgili nakliyeciyle eşleşir. Bu aşamada mesajlaşma üzerinden toplama/teslimat zamanı, yük detayları ve özel notlar netleştirilebilir.',
        },
        {
          question: 'Ücret nasıl belirlenir?',
          answer: 'Ücret, nakliyecilerin verdiği tekliflere göre oluşur. Teklifi seçmeden önce mesajlaşma ile şartları netleştirip karşılaştırma yaparak karar verebilirsiniz.',
        },
      ],
    },
    {
      category: 'Takip ve Teslimat',
      icon: MapPin,
      items: [
        {
          question: 'Gönderimi nasıl takip ederim?',
          answer: 'Gönderilerinizin durumunu panelinizden izleyebilirsiniz. Süreç adımlarında durum güncellemeleri ve bildirimler görünür.',
        },
        {
          question: 'Gönderi durumları nelerdir?',
          answer: 'Durumlar; teklif bekleniyor, teklif seçildi, taşıma başladı, teslimat aşamasında ve teslim edildi gibi adımlardan oluşur. Her aşama panelde görüntülenir.',
        },
        {
          question: 'Teslimat süresi ne kadar?',
          answer: 'Teslimat süresi mesafe, kategori ve nakliyecinin planına göre değişir. Teklif içerisinde tahmini süre bilgisi bulunur.',
        },
      ],
    },
    {
      category: 'İptal',
      icon: AlertCircle,
      items: [
        {
          question: 'Gönderim iptal edilebilir mi?',
          answer: 'Gönderi, taşıma başlamadan önce uygun durumdayken iptal edilebilir. Taşıma başladıktan sonra iptal koşulları değişebilir.',
        },
        {
          question: 'İptal sonrası süreç nasıl ilerler?',
          answer: 'İptal koşulları; iptal zamanı ve gönderinin hangi aşamada olduğuna göre değişebilir. Detay için ilgili gönderi kaydını inceleyebilir veya destek talebi oluşturabilirsiniz.',
        },
      ],
    },
  ];

  // Load tickets
  const loadTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(createApiUrl('/api/support/tickets'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const resolvedTickets = data?.data?.tickets || data?.data || data?.tickets || [];
        setTickets(Array.isArray(resolvedTickets) ? resolvedTickets : []);
      }
    } catch (error) {
      console.error('Ticket loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch(createApiUrl('/api/support/categories'));
      if (response.ok) {
        const data = await response.json();
        const resolvedCategories = data?.data || data?.categories || [];
        setCategories(Array.isArray(resolvedCategories) ? resolvedCategories : []);
      }
    } catch (error) {
      console.error('Category loading error:', error);
    }
  };

  // Handle ticket creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.subject || !formData.description) {
      showProfessionalToast(toast, 'REQUIRED_FIELDS', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const requestBody = new FormData();
      requestBody.append('category', formData.category);
      requestBody.append('priority', formData.priority);
      requestBody.append('subject', formData.subject);
      requestBody.append('description', formData.description);
      if (formData.relatedShipmentId) requestBody.append('relatedShipmentId', formData.relatedShipmentId);
      
      const response = await fetch(createApiUrl('/api/support/tickets'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: requestBody,
      });

      if (response.ok) {
        showProfessionalToast(toast, 'SUPPORT_TICKET_CREATED', 'success');
        setFormData({
          category: '',
          priority: 'medium',
          subject: '',
          description: '',
          relatedShipmentId: '',
        });
        loadTickets();
      } else {
        const errorPayload = await response.json().catch(() => null);
        showProfessionalToast(
          toast,
          'OPERATION_FAILED',
          'error',
          errorPayload?.message || 'Destek talebi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
        );
      }
    } catch (error) {
      showProfessionalToast(toast, 'NETWORK_ERROR', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadTickets();
  }, []);

  const openSupport = useCallback(() => {
    setIsSupportOpen(true);
    window.setTimeout(() => {
      document.getElementById('support-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      (document.getElementById('support-category') as HTMLSelectElement | null)?.focus();
    }, 50);
  }, []);

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
        <title>Yardım ve Destek Merkezi - Bireysel | YolNext</title>
        <meta name="description" content="YolNext Yardım ve Destek Merkezi - SSS, kapsamlı rehberler ve profesyonel destek talebi hizmetleri" />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          
          <div className='relative z-10 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20'>
              <LifeBuoy className='w-10 h-10 text-white' />
            </div>
            <h1 className='text-3xl sm:text-4xl font-bold mb-4'>YolNext Yardım ve Destek Merkezi</h1>
            <p className='text-slate-200 text-lg mb-8 max-w-3xl mx-auto'>
              Türkiye'nin lider lojistik platformunda size yardımcı olmak için buradayız. 
              Hızlı cevaplar, kapsamlı rehberler ve profesyonel destek hizmetlerimizden faydalanın.
            </p>
          </div>

          <div className='relative z-10 max-w-md mx-auto'>
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Sorunuzu arayın...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40'
              />
            </div>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
              <Info className='w-6 h-6 text-white' />
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

        {/* Quick Actions */}
        {false && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className='group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200'
            >
              <div className='flex flex-col items-center text-center space-y-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center transition-colors'>
                  <action.icon className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='font-semibold text-slate-900 mb-1'>{action.title}</h3>
                  <p className='text-sm text-slate-600'>{action.description}</p>
                </div>
                <div className='flex items-center gap-1 text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity'>
                  <span>Başla</span>
                  <ChevronRight className='w-4 h-4' />
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}

        {isSupportOpen && (
        <div
          id='support-section'
          className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-8 mb-8 text-white shadow-2xl'
        >
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-32 translate-x-32'></div>
          <div className='relative z-10 text-center mb-8'>
            <div className='w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <LifeBuoy className='w-8 h-8 text-white' />
            </div>
            <h2 className='text-3xl font-bold mb-3'>Profesyonel Destek Hizmeti</h2>
            <p className='text-slate-200 max-w-2xl mx-auto text-lg'>
              FAQ bölümünde aradığınızı bulamadınız mı? Uzman destek ekibimizden kişiselleştirilmiş yardım alın.
            </p>
          </div>

          <div className='relative z-10 grid md:grid-cols-2 gap-8'>
            <div className='space-y-4'>
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <MessageSquare className='w-6 h-6 text-slate-900' />
                  Mevcut Destek Talepleriniz ({tickets.length})
                </h3>
              
                {loading ? (
                  <div className='text-center py-8'>
                    <div className='animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3'></div>
                    <p className='text-slate-600'>Destek talepleri yükleniyor...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className='text-center py-8'>
                    <AlertTriangle className='w-12 h-12 text-slate-400 mx-auto mb-3' />
                    <h4 className='font-semibold text-slate-900 mb-2'>Henüz destek talebiniz bulunmuyor</h4>
                    <p className='text-slate-600'>İlk destek talebinizi oluşturarak başlayabilirsiniz.</p>
                  </div>
                ) : (
                  <div className='space-y-4 max-h-80 overflow-y-auto'>
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className='border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors'>
                        <div className='flex items-start justify-between mb-2'>
                          <h4 className='font-medium text-slate-900 text-sm'>{ticket.subject}</h4>
                          <span className='text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full'>
                            #{ticket.ticket_number}
                          </span>
                        </div>
                        <p className='text-slate-600 text-sm mb-2 line-clamp-2'>{ticket.description}</p>
                        <div className='flex items-center gap-2 text-xs text-slate-500'>
                          <Clock className='w-3 h-3' />
                          {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id='new-ticket-form' className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h3 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Plus className='w-5 h-5 text-slate-900' />
                Yeni Destek Talebi Oluştur
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-900 mb-2'>Kategori *</label>
                  <select
                    id='support-category'
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className='w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900'
                    required
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-900 mb-2'>Konu *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className='w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900'
                    placeholder="Destek talebinizin konusu"
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-900 mb-2'>Açıklama *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className='w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white text-slate-900'
                    placeholder="Sorununuzu detaylı olarak açıklayın"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  {loading ? (
                    <>
                      <div className='animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full'></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Plus className='w-4 h-4' />
                      Destek Talebi Oluştur
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        )}

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
              <button
                type='button'
                onClick={openSupport}
                className='bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-lg'
              >
                <Plus className='w-5 h-5' />
                Destek Talebi Oluştur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualHelp;
