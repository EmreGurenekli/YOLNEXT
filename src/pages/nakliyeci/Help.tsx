import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  Video, 
  BookOpen, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  Building2,
  Truck,
  DollarSign,
  ArrowRight,
  Plus,
  Download,
  Star,
  Clock,
  User,
  Settings,
  Package,
  MapPin,
  Calendar,
  XCircle,
  Shield,
  Bell,
  MessageCircle,
  ExternalLink,
  Play,
  Download as DownloadIcon
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  isOpen: boolean;
  helpful: number;
  notHelpful: number;
}

interface Article {
  id: number;
  title: string;
  description: string;
  category: string;
  readTime: string;
  views: number;
  isNew: boolean;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ContactMethod {
  id: number;
  name: string;
  description: string;
  icon: any;
  contact: string;
  available: string;
  responseTime: string;
}

export default function NakliyeciHelp() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'Yardım', icon: <HelpCircle className="w-4 h-4" /> }
  ];

  const categories = [
    { id: 'all', name: 'Tümü', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'getting-started', name: 'Başlangıç', icon: <Play className="w-4 h-4" /> },
    { id: 'jobs', name: 'İşler', icon: <Package className="w-4 h-4" /> },
    { id: 'shipments', name: 'Gönderiler', icon: <Truck className="w-4 h-4" /> },
    { id: 'payments', name: 'Ödemeler', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'drivers', name: 'Şoförler', icon: <User className="w-4 h-4" /> },
    { id: 'settings', name: 'Ayarlar', icon: <Settings className="w-4 h-4" /> },
    { id: 'technical', name: 'Teknik', icon: <Settings className="w-4 h-4" /> }
  ];

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setFaqs([
        {
          id: 1,
          question: 'Nasıl iş teklifi gönderebilirim?',
          answer: 'İşler sayfasından mevcut gönderileri görüntüleyebilir ve "Teklif Gönder" butonuna tıklayarak teklifinizi oluşturabilirsiniz. Teklifiniz gönderici tarafından değerlendirilecek ve size bildirim gönderilecektir.',
          category: 'jobs',
          isOpen: false,
          helpful: 45,
          notHelpful: 2
        },
        {
          id: 2,
          question: 'Gönderi durumunu nasıl takip edebilirim?',
          answer: 'Gönderiler sayfasından aktif gönderilerinizi görüntüleyebilir ve detaylı takip bilgilerine ulaşabilirsiniz. Her gönderi için gerçek zamanlı konum ve durum güncellemeleri alırsınız.',
          category: 'shipments',
          isOpen: false,
          helpful: 38,
          notHelpful: 1
        },
        {
          id: 3,
          question: 'Ödemelerimi nasıl görüntüleyebilirim?',
          answer: 'Kazanç Raporu sayfasından tüm ödemelerinizi, komisyon detaylarını ve gelir analizlerinizi görüntüleyebilirsiniz. Aylık ve günlük raporlar da mevcuttur.',
          category: 'payments',
          isOpen: false,
          helpful: 52,
          notHelpful: 3
        },
        {
          id: 4,
          question: 'Şoför eklemek için ne yapmalıyım?',
          answer: 'Şoför Yönetimi sayfasından yeni şoför ekleyebilir, mevcut şoförlerin performanslarını takip edebilir ve görev atamaları yapabilirsiniz.',
          category: 'drivers',
          isOpen: false,
          helpful: 29,
          notHelpful: 1
        },
        {
          id: 5,
          question: 'Sistem gereksinimleri nelerdir?',
          answer: 'YolNet web uygulaması modern tarayıcılarda çalışır. Chrome, Firefox, Safari veya Edge tarayıcılarının güncel sürümlerini kullanmanızı öneririz.',
          category: 'technical',
          isOpen: false,
          helpful: 67,
          notHelpful: 5
        }
      ]);

      setArticles([
        {
          id: 1,
          title: 'Nakliyeci Olarak Başlangıç Rehberi',
          description: 'YolNet platformunda nakliyeci olarak nasıl başlayacağınızı öğrenin. Hesap kurulumundan ilk gönderinize kadar tüm adımlar.',
          category: 'getting-started',
          readTime: '10 dk',
          views: 1250,
          isNew: true,
          tags: ['başlangıç', 'rehber', 'kurulum'],
          difficulty: 'beginner'
        },
        {
          id: 2,
          title: 'İş Teklifi Verme Stratejileri',
          description: 'Başarılı iş teklifleri vermek için ipuçları ve stratejiler. Fiyatlandırma, zamanlama ve müşteri ilişkileri.',
          category: 'jobs',
          readTime: '15 dk',
          views: 890,
          isNew: false,
          tags: ['teklif', 'strateji', 'fiyatlandırma'],
          difficulty: 'intermediate'
        },
        {
          id: 3,
          title: 'Gönderi Takip Sistemi Kullanımı',
          description: 'Gelişmiş gönderi takip özelliklerini nasıl kullanacağınızı öğrenin. GPS takip, bildirimler ve raporlama.',
          category: 'shipments',
          readTime: '12 dk',
          views: 756,
          isNew: false,
          tags: ['takip', 'GPS', 'bildirimler'],
          difficulty: 'intermediate'
        },
        {
          id: 4,
          title: 'Şoför Performans Yönetimi',
          description: 'Şoförlerinizin performansını nasıl değerlendireceğiniz ve iyileştireceğiniz hakkında detaylı bilgiler.',
          category: 'drivers',
          readTime: '20 dk',
          views: 634,
          isNew: false,
          tags: ['şoför', 'performans', 'yönetim'],
          difficulty: 'advanced'
        },
        {
          id: 5,
          title: 'Güvenlik ve Güvenilirlik',
          description: 'Platform güvenliği, veri koruma ve güvenilir hizmet sunma konularında önemli bilgiler.',
          category: 'technical',
          readTime: '8 dk',
          views: 445,
          isNew: true,
          tags: ['güvenlik', 'güvenilirlik', 'veri koruma'],
          difficulty: 'beginner'
        }
      ]);

      setContactMethods([
        {
          id: 1,
          name: 'Canlı Destek',
          description: 'Anında yardım alın',
          icon: MessageCircle,
          contact: 'Destek Merkezi',
          available: '7/24',
          responseTime: 'Anında'
        },
        {
          id: 2,
          name: 'Telefon Desteği',
          description: 'Telefon ile iletişim',
          icon: Phone,
          contact: '+90 212 555 0123',
          available: '09:00 - 18:00',
          responseTime: '5 dakika'
        },
        {
          id: 3,
          name: 'E-posta Desteği',
          description: 'Detaylı sorularınız için',
          icon: Mail,
          contact: 'destek@yolnet.com',
          available: '7/24',
          responseTime: '2 saat'
        },
        {
          id: 4,
          name: 'Video Görüşme',
          description: 'Görüntülü destek',
          icon: Video,
          contact: 'Randevu Al',
          available: '09:00 - 17:00',
          responseTime: '1 gün'
        }
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    (selectedCategory === 'all' || faq.category === selectedCategory) &&
    (faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
     faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredArticles = articles.filter(article => 
    (selectedCategory === 'all' || article.category === selectedCategory) &&
    (article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     article.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleFaq = (id: number) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq
    ));
  };

  const handleFaqFeedback = (id: number, type: 'helpful' | 'notHelpful') => {
    setFaqs(faqs.map(faq => 
      faq.id === id 
        ? { 
            ...faq, 
            helpful: type === 'helpful' ? faq.helpful + 1 : faq.helpful,
            notHelpful: type === 'notHelpful' ? faq.notHelpful + 1 : faq.notHelpful
          }
        : faq
    ));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-700/50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Yardım içeriği yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
      <Helmet>
        <title>Yardım - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci yardım ve destek sistemi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Ana Tasarım Stili */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Yardım Merkezi</h1>
              <p className="text-sm text-slate-600">Sorularınızın cevaplarını bulun ve destek alın</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Canlı Destek</span>
            </button>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 backdrop-blur-sm text-white border border-slate-600 rounded-lg sm:rounded-xl hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Kılavuz İndir</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700/50 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Yardım arayın... (örn: iş teklifi, gönderi takip, ödeme)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white border-slate-800'
                    : 'bg-slate-800/50 backdrop-blur-sm text-white border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'
                }`}
              >
                {category.icon}
                <span className="text-xs font-medium text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{faqs.length}</div>
                <div className="text-sm text-slate-600">SSS</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{articles.length}</div>
                <div className="text-sm text-slate-600">Makale</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">7/24</div>
                <div className="text-sm text-slate-600">Canlı Destek</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">2 saat</div>
                <div className="text-sm text-slate-600">Ortalama Yanıt</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FAQs */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-slate-900">Sık Sorulan Sorular</h2>
                <p className="text-sm text-slate-600 mt-1">En çok sorulan sorular ve cevapları</p>
              </div>
              <div className="p-6">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Bu kategoride soru bulunamadı</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFaqs.map((faq) => (
                      <div key={faq.id} className="border border-slate-700/50 rounded-lg">
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
                        >
                          <span className="font-medium text-slate-900">{faq.question}</span>
                          {faq.isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        {faq.isOpen && (
                          <div className="px-4 pb-4 border-t border-slate-700/50">
                            <p className="text-slate-600 text-sm mt-3 mb-4">{faq.answer}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-slate-500">Bu cevap yardımcı oldu mu?</span>
                              <button
                                onClick={() => handleFaqFeedback(faq.id, 'helpful')}
                                className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Evet ({faq.helpful})
                              </button>
                              <button
                                onClick={() => handleFaqFeedback(faq.id, 'notHelpful')}
                                className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                              >
                                <XCircle className="w-3 h-3" />
                                Hayır ({faq.notHelpful})
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 mb-6">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-slate-900">İletişim</h2>
                <p className="text-sm text-slate-600 mt-1">Yardıma ihtiyacınız var mı?</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {contactMethods.map((method) => (
                    <div key={method.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                        <method.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{method.name}</h3>
                        <p className="text-xs text-slate-600">{method.description}</p>
                        <p className="text-xs text-slate-500">{method.contact}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{method.available}</p>
                        <p className="text-xs text-slate-400">{method.responseTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular Articles */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
              <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-slate-900">Popüler Makaleler</h2>
                <p className="text-sm text-slate-600 mt-1">En çok okunan yardım makaleleri</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {filteredArticles.slice(0, 3).map((article) => (
                    <div key={article.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm mb-1">{article.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{article.readTime}</span>
                          <span>•</span>
                          <span>{article.views} görüntüleme</span>
                          {article.isNew && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">Yeni</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Tüm Makaleleri Görüntüle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* All Articles */}
        <div className="mt-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-slate-900">Tüm Makaleler</h2>
              <p className="text-sm text-slate-600 mt-1">Detaylı yardım makaleleri ve rehberler</p>
            </div>
            <div className="p-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Bu kategoride makale bulunamadı</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article) => (
                    <div key={article.id} className="border border-slate-700/50 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900 text-sm">{article.title}</h3>
                            <p className="text-xs text-slate-500">{article.category}</p>
                          </div>
                        </div>
                        {article.isNew && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                            Yeni
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">{article.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                            {article.difficulty.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">{article.readTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{article.views}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {article.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg text-sm hover:shadow-lg transition-all duration-200">
                        Makaleyi Oku
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}