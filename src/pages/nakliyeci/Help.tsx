import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import { createApiUrl } from '../../config/api';
import { safeJsonParse } from '../../utils/safeFetch';
import { useToast } from '../../contexts/ToastContext';
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

const NakliyeciHelp = () => {
  const { showToast } = useToast();
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
    { label: 'Ana Sayfa', href: '/nakliyeci/dashboard' },
    { label: 'Yardım ve Destek Merkezi', href: '/nakliyeci/help' },
  ];

  const quickActions = [
    {
      title: 'Açık İşler',
      description: 'Teklif verebileceğiniz açık işleri görüntüleyin',
      icon: Package,
      link: '/nakliyeci/jobs',
    },
    {
      title: 'Aktif İşlerim',
      description: 'Kabul ettiğiniz işleri yönetin ve takip edin',
      icon: Truck,
      link: '/nakliyeci/active-jobs',
    },
    {
      title: 'Tekliflerim',
      description: 'Verdiğiniz teklifleri görüntüleyin ve yönetin',
      icon: DollarSign,
      link: '/nakliyeci/offers',
    },
    {
      title: 'Rota Planlayıcısı',
      description: 'Akıllı rota planlama ile verimliliğinizi artırın',
      icon: MapPin,
      link: '/nakliyeci/route-planner',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Profil ve Belgeleri Tamamlayın',
      description: 'Firma bilgileri, araç/taşıyıcı detayları ve gerekli evrakları ekleyin',
      icon: Users,
    },
    {
      step: 2,
      title: 'Yük Pazarı’nı İnceleyin',
      description: 'Açık işleri filtreleyin, uygun yükleri bulun',
      icon: Package,
    },
    {
      step: 3,
      title: 'Teklif Verin',
      description: 'Fiyat ve teslimat planını belirleyip teklifinizi gönderin',
      icon: Star,
    },
    {
      step: 4,
      title: 'İşi Planlayın',
      description: 'Kazanılan işleri Aktif İşler’den yönetin, rota ve kaynak planı yapın',
      icon: MapPin,
    },
    {
      step: 5,
      title: 'Teslimat ve Kazanç',
      description: 'Süreç durumlarını güncelleyin, teslimatı tamamlayın ve kazanç/komisyon durumunuzu takip edin',
      icon: DollarSign,
    },
  ];

  const faqCategories = [
    {
      category: 'Başlangıç',
      icon: Info,
      items: [
        {
          question: 'Nakliyeci paneli ne işe yarar?',
          answer: 'Nakliyeci paneli, yük pazarındaki işleri bulup teklif vermenizi, kazandığınız işleri aktif süreçte yönetmenizi ve rota/operasyon planlaması yapmanızı sağlar.',
        },
        {
          question: 'Hesap oluşturmak ücretsiz mi?',
          answer: 'Hesap oluşturma ücretsizdir. Komisyon ve kazanç/hakediş detayları iş/süreç şartlarına göre değişebilir.',
        },
        {
          question: 'Hangi işler bana uygundur?',
          answer: 'Yük pazarı ekranından rota, tarih, araç tipi ve yük özelliklerine göre filtreleyerek size uygun işleri listeleyebilirsiniz.',
        },
      ],
    },
    {
      category: 'Yük Pazarı ve Teklif',
      icon: Package,
      items: [
        {
          question: 'Bir işe nasıl teklif veririm?',
          answer: 'Yük pazarından işi açıp teklif adımlarını tamamlayın. Fiyat, tahmini teslimat planı ve varsa şartlarınızı ekleyerek teklifinizi gönderin.',
        },
        {
          question: 'Teklif vermeden önce göndericiyle konuşabilir miyim?',
          answer: 'Evet. İş/ilan detayından mesajlaşarak yük detaylarını, teslimat şartlarını ve evrak ihtiyaçlarını netleştirebilirsiniz.',
        },
        {
          question: 'Fiyatı nasıl belirlemeliyim?',
          answer: 'Mesafe, yakıt, operasyon maliyetleri, araç tipi ve teslimat süresini dikkate alarak teklifinizi oluşturabilirsiniz. Teklif koşullarını açık yazmanız süreci hızlandırır.',
        },
        {
          question: 'İş kazanınca ne olur?',
          answer: 'Teklifiniz kabul edildiğinde iş, Aktif İşler bölümüne düşer. Buradan süreç adımlarını, mesajlaşmaları ve planlamayı yönetirsiniz.',
        },
      ],
    },
    {
      category: 'İş Yönetimi ve Takip',
      icon: DollarSign,
      items: [
        {
          question: 'İş durumlarını nasıl güncellerim?',
          answer: 'Aktif İşler ekranından ilgili işi açıp süreç adımlarına göre durum güncellemelerini yapabilirsiniz. Böylece hem siz hem gönderici süreci şeffaf şekilde takip eder.',
        },
        {
          question: 'Rota planlayıcı ne işe yarar?',
          answer: 'Akıllı rota ile birden fazla işi daha verimli planlayabilir, kilometre ve zaman optimizasyonu sağlayabilirsiniz.',
        },
        {
          question: 'Teslimat sonrası süreç nasıl ilerler?',
          answer: 'Teslimat tamamlandıktan sonra iş kapanır ve kazanç/komisyon süreçleri iş koşullarına göre ilerler. Detayları cüzdan ekranından takip edebilir; sorun yaşarsanız destek talebi oluşturabilirsiniz.',
        },
        {
          question: 'Evrak ve teslimat doğrulaması gerekiyor mu?',
          answer: 'Bazı işler için teslimat evrakı veya doğrulama gerekebilir. İlan/iş detayındaki talimatları takip edin.',
        },
      ],
    },
    {
      category: 'Kazanç ve Komisyon',
      icon: DollarSign,
      items: [
        {
          question: 'Komisyon ve kesintiler nasıl işler?',
          answer: 'Komisyon ve kesintiler iş türüne ve süreç koşullarına göre değişebilir. Net bilgi için sözleşme/iş detaylarını inceleyebilir veya destek talebi oluşturabilirsiniz.',
        },
        {
          question: 'Kazanç ne zaman görünür?',
          answer: 'Kazanç görünürlüğü teslimat doğrulaması ve süreç şartlarına göre değişebilir. Durumu ilgili iş veya cüzdan ekranından takip edebilirsiniz.',
        },
        {
          question: 'Fatura/evrak süreçlerini nasıl yönetirim?',
          answer: 'Kurumsal işler için evrak akışı gerekebilir. İş detayındaki evrak listesini takip ederek süreci tamamlayabilirsiniz.',
        },
      ],
    },
    {
      category: 'İptal ve Uyuşmazlık',
      icon: AlertCircle,
      items: [
        {
          question: 'İş iptal edilebilir mi?',
          answer: 'İş, taşıma başlamadan önce uygun durumdayken iptal edilebilir. Taşıma başladıktan sonra iptal koşulları değişebilir.',
        },
        {
          question: 'İptal/uyuşmazlık durumunda ne yapmalıyım?',
          answer: 'İş detayındaki kayıtlar (mesajlaşma, zaman çizelgesi) üzerinden inceleme yapılır. Destek talebi oluşturarak süreci hızlandırabilirsiniz.',
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
        const data = await safeJsonParse(response);
        const resolvedTickets = data?.data?.tickets || data?.data || data?.tickets || [];
        setTickets(Array.isArray(resolvedTickets) ? resolvedTickets : []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(createApiUrl('/api/support/categories'));
      if (response.ok) {
        const data = await safeJsonParse(response);
        const resolvedCategories = data?.data || data?.categories || [];
        setCategories(Array.isArray(resolvedCategories) ? resolvedCategories : []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.subject || !formData.description) {
      showProfessionalToast(showToast, 'REQUIRED_FIELDS', 'error');
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
        showProfessionalToast(showToast, 'SUPPORT_TICKET_CREATED', 'success');
        setFormData({
          category: '',
          priority: 'medium',
          subject: '',
          description: '',
          relatedShipmentId: '',
        });
        loadTickets();
      } else {
        const errorPayload = response.ok ? await safeJsonParse(response).catch(() => null) : null;
        showProfessionalToast(
          showToast,
          'OPERATION_FAILED',
          'error',
          errorPayload?.message || 'Destek talebi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
        );
      }
    } catch (error) {
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');
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
        <title>Yardım ve Destek Merkezi - Nakliyeci | YolNext</title>
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
                  className='w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
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

export default NakliyeciHelp;











