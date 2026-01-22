import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  HelpCircle,
  Package,
  Truck,
  MapPin,
  DollarSign,
  Shield,
  MessageCircle,
  FileText,
  LifeBuoy,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  AlertCircle,
  AlertTriangle,
  Info,
  Plus,
  Paperclip,
  X,
  MessageSquare,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { createApiUrl } from '../../config/api';
import { logger } from '../../utils/logger';
import { showProfessionalToast } from '../../utils/toastMessages';

// Ticket system interfaces
interface SupportTicket {
  id: number;
  ticket_number: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupportCategory {
  id: number;
  name: string;
  description: string;
}

const CorporateHelp = () => {
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
    { label: 'Ana Sayfa', href: '/corporate/dashboard' },
    { label: 'Yardım ve Destek Merkezi', href: '/corporate/help' },
  ];

  const quickActions = [
    {
      title: 'Toplu Gönderi Oluştur',
      description: 'Kurumsal gönderilerinizi toplu olarak oluşturun',
      icon: Package,
      link: '/corporate/create-shipment',
    },
    {
      title: 'Kurumsal Gönderiler',
      description: 'Şirket gönderilerinizi takip edin ve yönetin',
      icon: Truck,
      link: '/corporate/shipments',
    },
    {
      title: 'Kurumsal Teklifler',
      description: 'Şirket tekliflerinizi görüntüleyin ve yönetin',
      icon: DollarSign,
      link: '/corporate/offers',
    },
    {
      title: 'Kurumsal Analitik',
      description: 'Detaylı raporlar ve analitik verilerinizi görün',
      icon: MapPin,
      link: '/corporate/analytics',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Firma Profilini Tamamlayın',
      description: 'Şirket bilgilerinizi, vergi/fatura bilgilerinizi ve yetkili kişileri ekleyin',
      icon: Users,
    },
    {
      step: 2,
      title: 'Ekip ve Yetkileri Ayarlayın',
      description: 'Kullanıcı ekleyin, rol ve erişim yetkilerini tanımlayın',
      icon: Package,
    },
    {
      step: 3,
      title: 'Gönderi(leri) Oluşturun',
      description: 'Tekli veya toplu gönderi oluşturun; teslimat kriterlerini belirleyin',
      icon: Star,
    },
    {
      step: 4,
      title: 'Teklifleri Değerlendirin',
      description: 'Teklifleri karşılaştırın, gerekirse mesajlaşın ve uygun teklifi seçin',
      icon: MessageCircle,
    },
    {
      step: 5,
      title: 'Takip ve Raporlayın',
      description: 'Canlı takip, teslimat doğrulama ve rapor/analitik ekranlarıyla süreci yönetin',
      icon: MapPin,
    },
  ];

  const faqCategories = [
    {
      category: 'Başlangıç',
      icon: Info,
      items: [
        {
          question: 'YolNext Kurumsal nasıl çalışır?',
          answer: 'YolNext Kurumsal, şirketlerin gönderilerini tek panelden yönetmesini sağlayan B2B lojistik platformudur. Gönderi oluşturur, teklif toplar, ekip içinde rol/yetki yönetimi ile süreci koordine eder ve teslimat sürecini raporlayarak takip edersiniz.',
        },
        {
          question: 'Hesap oluşturmak ücretsiz mi?',
          answer: 'Kurumsal hesap oluşturma ücretsizdir. Ücretlendirme, gönderiniz için alınan tekliflere ve seçtiğiniz taşıma hizmetine göre değişebilir.',
        },
        {
          question: 'Şirket içinde birden fazla kullanıcı ekleyebilir miyim?',
          answer: 'Evet. Kurumsal panelde ekip üyeleri ekleyebilir, görev ve yetkilendirmeleri belirleyerek gönderi ve teklif süreçlerini ekip içinde yönetebilirsiniz.',
        },
      ],
    },
    {
      category: 'Gönderi Oluşturma',
      icon: Package,
      items: [
        {
          question: 'Gönderi nasıl oluştururum?',
          answer: 'Kurumsal panelden "Gönderi Oluştur" adımına gidin. Kategori/taşıma tipi, toplama ve teslimat adresleri, tarih aralığı ve yük detaylarını girip yayınlayın. Yayın sonrası nakliyeciler teklif göndermeye başlar.',
        },
        {
          question: 'Toplu gönderi oluşturabilir miyim?',
          answer: 'Evet. Birden fazla gönderiyi toplu şekilde oluşturup yönetebilirsiniz. Süreçleri tek panelden izleyebilir ve ekip içinde iş paylaşımı yapabilirsiniz.',
        },
        {
          question: 'Gönderi fiyatını kim belirler?',
          answer: 'Fiyatı nakliyeciler teklif verirken belirler. Siz fiyat, koşul ve SLA’lara göre teklifleri karşılaştırıp seçim yapabilirsiniz.',
        },
        {
          question: 'Gönderi oluştururken hangi bilgiler gereklidir?',
          answer: 'Kategori/taşıma tipi, adresler, tarih aralığı, yük detayı (ağırlık/hacim/paketleme) ve varsa özel talimatlar gereklidir. Kurumsal gönderilerde fatura/irsaliye gibi süreç bilgileri de istenebilir.',
        },
      ],
    },
    {
      category: 'Teklifler ve Mesajlaşma',
      icon: DollarSign,
      items: [
        {
          question: 'Teklifleri nasıl görüntülerim?',
          answer: 'Gönderi detayından teklifleri görüntüleyebilirsiniz. Teklifleri fiyat, süre, kapasite ve performans kriterlerine göre karşılaştırabilirsiniz.',
        },
        {
          question: 'Teklif kabul etmeden önce nakliyeci ile görüşebilir miyim?',
          answer: 'Evet. Teklif detayından mesajlaşarak şartları netleştirebilir, teslimat şartlarını ve evrak ihtiyaçlarını konuşabilirsiniz.',
        },
        {
          question: 'Teklifi seçince süreç nasıl başlar?',
          answer: 'Uygun teklifi seçtiğinizde süreç başlar ve ilgili nakliyeciyle eşleşirsiniz. Bu aşamada mesajlaşma üzerinden teslimat kriterleri, zamanlama, evrak ihtiyaçları ve operasyon detayları netleştirilebilir.',
        },
        {
          question: 'Ücret/teklif detaylarını nasıl netleştiririm?',
          answer: 'Teklif detaylarını mesajlaşma üzerinden netleştirebilir; fiyat, teslimat planı, paketleme/evrak koşulları ve SLA beklentilerinizi yazılı şekilde teyit edebilirsiniz.',
        },
      ],
    },
    {
      category: 'Takip ve Teslimat',
      icon: MapPin,
      items: [
        {
          question: 'Gönderimi nasıl takip ederim?',
          answer: 'Kurumsal panelde gönderi durumlarını ve teslimat adımlarını takip edebilirsiniz. Canlı takip ve bildirimler ile süreç boyunca görünürlük sağlanır.',
        },
        {
          question: 'Gönderi durumları nelerdir?',
          answer: 'Genellikle teklif bekleniyor, teklif seçildi, yükleme, yolda, teslimat ve teslim edildi gibi adımlar bulunur. Her adım panelde görüntülenir.',
        },
        {
          question: 'Teslimat süresi ne kadar?',
          answer: 'Teslimat süresi mesafe, taşıma tipi ve nakliyecinin planına göre değişir. Teklif içerisinde tahmini süre ve teslimat planı yer alır.',
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
          answer: 'İptal koşulları; iptal zamanı, anlaşma şartları ve gönderinin hangi aşamada olduğuna göre değişebilir. Detay için ilgili gönderi kaydını inceleyebilir veya destek talebi oluşturabilirsiniz.',
        },
      ],
    },
  ];


  // Ticket system functions
  const loadTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(createApiUrl('/api/support/tickets'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const resolvedTickets = data?.data?.tickets || data?.data || data?.tickets || [];
        setTickets(Array.isArray(resolvedTickets) ? resolvedTickets : []);
      }
    } catch (error) {
      logger.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(createApiUrl('/api/support/categories'));
      if (response.ok) {
        const data = await response.json();
        const resolvedCategories = data?.data || data?.categories || [];
        setCategories(Array.isArray(resolvedCategories) ? resolvedCategories : []);
      }
    } catch (error) {
      logger.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.subject || !formData.description) {
      showProfessionalToast(toast, 'REQUIRED_FIELDS', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const formDataObj = new FormData();
      
      formDataObj.append('category', formData.category);
      formDataObj.append('priority', formData.priority);
      formDataObj.append('subject', formData.subject);
      formDataObj.append('description', formData.description);
      
      if (formData.relatedShipmentId) {
        formDataObj.append('relatedShipmentId', formData.relatedShipmentId);
      }

      const response = await fetch(createApiUrl('/api/support/tickets'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
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
        <title>Yardım ve Destek Merkezi - Kurumsal | YolNext</title>
        <meta name="description" content="YolNext Yardım ve Destek Merkezi - SSS, kapsamlı rehberler ve profesyonel destek talebi hizmetleri" />
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
                  YolNext Yardım ve Destek Merkezi
                </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Türkiye'nin lider lojistik platformunda size yardımcı olmak için buradayız. 
                  Hızlı cevaplar, kapsamlı rehberler ve profesyonel destek hizmetlerimizden faydalanın.
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
        {false && (
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
        )}

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

        {false && (
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6'>
            <div className='flex items-center gap-3 mb-4'>
              <FileText className='w-6 h-6 text-slate-900' />
              <h2 className='text-2xl font-bold text-slate-900'>Yasal Belgeler</h2>
            </div>
            <p className='text-slate-600 text-sm mb-4'>
              Kullanım Koşulları, Gizlilik Politikası, Çerez Politikası ve KVKK Aydınlatma Metni’ne buradan ulaşabilirsiniz.
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
              <Link to='/terms' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                Kullanım Koşulları
              </Link>
              <Link to='/privacy' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                Gizlilik Politikası
              </Link>
              <Link to='/cookie-policy' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                Çerez Politikası
              </Link>
              <button
                type='button'
                onClick={() => window.dispatchEvent(new Event('yolnext:cookie-preferences'))}
                className='bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900 text-left'
              >
                Çerez Tercihleri
              </button>
              <Link to='/kvkk-aydinlatma' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                KVKK Aydınlatma Metni
              </Link>
              <Link to='/consumer-rights' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                Tüketici Hakları
              </Link>
              <Link to='/distance-selling-contract' target='_blank' className='bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:bg-white transition-colors text-sm font-semibold text-slate-900'>
                Mesafeli Satış Sözleşmesi
              </Link>
            </div>
          </div>
        )}

        {/* Support Options */}
        {false && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
              <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
                <MessageCircle className='w-5 h-5 text-white' />
              </div>
              <h3 className='text-base font-semibold text-slate-900 mb-2'>Canlı Destek</h3>
              <p className='text-slate-600 mb-4 text-sm'>
                7/24 canlı destek hattımızdan anında yardım alın
              </p>
              <button
                type='button'
                onClick={openSupport}
                className='inline-flex items-center text-slate-900 font-medium text-sm hover:gap-2 transition-all'
              >
                Başlat <ArrowRight className='w-4 h-4 ml-1' />
              </button>
            </div>

            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
              <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
                <Mail className='w-5 h-5 text-white' />
              </div>
              <h3 className='text-base font-semibold text-slate-900 mb-2'>Email Desteği</h3>
              <p className='text-slate-600 mb-4 text-sm'>
                Sorularınızı email ile gönderin, 24 saat içinde yanıt alın
              </p>
              <button
                type='button'
                onClick={openSupport}
                className='inline-flex items-center text-slate-900 font-medium text-sm hover:gap-2 transition-all'
              >
                E-posta ile Destek <ArrowRight className='w-4 h-4 ml-1' />
              </button>
            </div>

            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
              <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
                <Phone className='w-5 h-5 text-white' />
              </div>
              <h3 className='text-base font-semibold text-slate-900 mb-2'>Telefon Desteği</h3>
              <p className='text-slate-600 mb-4 text-sm'>
                Hafta içi 09:00-18:00 arası telefon desteği
              </p>
              <button
                type='button'
                onClick={openSupport}
                className='inline-flex items-center text-slate-900 font-medium text-sm hover:gap-2 transition-all'
              >
                Destek Talebi Oluştur <ArrowRight className='w-4 h-4 ml-1' />
              </button>
            </div>
          </div>
        )}

        {/* Professional Support Section */}
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
            {/* Existing Tickets */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
              <h3 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <MessageSquare className='w-5 h-5 text-slate-900' />
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
                  {Array.isArray(tickets) && tickets.map((ticket) => (
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

            {/* Create New Ticket */}
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

export default CorporateHelp;


