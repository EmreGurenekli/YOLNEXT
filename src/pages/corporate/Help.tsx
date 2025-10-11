import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  HelpCircle, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle, 
  FileText, 
  Video, 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Download, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Info,
  Play,
  Users,
  Settings,
  Truck,
  Package,
  DollarSign,
  BarChart3,
  Shield,
  Globe,
  RefreshCw,
  Bell,
  Calendar,
  Headphones,
  MessageSquare,
  Zap
} from 'lucide-react';

export default function CorporateHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCallSupport = () => {
    window.open('tel:+908505550123');
  };

  const handleEmailSupport = () => {
    window.open('mailto:destek@yolnet.com');
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/905551234567');
  };

  const handleLiveChat = () => {
    console.log('Canlı destek başlatılıyor...');
    // Canlı destek implementasyonu
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const categories = [
    { id: 'getting-started', name: 'Başlangıç', icon: <Play size={20} />, count: 5 },
    { id: 'shipments', name: 'Gönderiler', icon: <Package size={20} />, count: 8 },
    { id: 'carriers', name: 'Nakliyeciler', icon: <Truck size={20} />, count: 6 },
    { id: 'payments', name: 'Ödemeler', icon: <DollarSign size={20} />, count: 4 },
    { id: 'reports', name: 'Raporlar', icon: <BarChart3 size={20} />, count: 3 },
    { id: 'account', name: 'Hesap', icon: <Users size={20} />, count: 5 },
    { id: 'security', name: 'Güvenlik', icon: <Shield size={20} />, count: 4 },
    { id: 'technical', name: 'Teknik', icon: <Settings size={20} />, count: 6 }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'YolNet platformuna nasıl başlayabilirim?',
      answer: 'YolNet platformuna başlamak için önce hesabınızı oluşturmanız gerekiyor. Kayıt olduktan sonra şirket bilgilerinizi tamamlayın ve ilk gönderinizi oluşturun. Platform size adım adım rehberlik edecektir.',
      tags: ['başlangıç', 'kayıt', 'ilk adımlar'],
      helpful: 12,
      difficulty: 'Kolay'
    },
    {
      id: 2,
      category: 'shipments',
      question: 'Gönderi nasıl oluştururum?',
      answer: 'Gönderi oluşturmak için "Yeni Gönderi" butonuna tıklayın. 3 adımlı formu doldurun: Yük bilgileri, adres ve iletişim bilgileri, yayınlama tercihi. Her adımda detaylı bilgiler girin.',
      tags: ['gönderi', 'oluşturma', 'form'],
      helpful: 18,
      difficulty: 'Kolay'
    },
    {
      id: 3,
      category: 'shipments',
      question: 'Gönderi durumunu nasıl takip ederim?',
      answer: 'Gönderilerim sayfasından aktif gönderilerinizi görebilirsiniz. Her gönderi için detaylı durum bilgisi, progress bar ve tahmini teslimat süresi gösterilir. Ayrıca gerçek zamanlı takip özelliği de mevcuttur.',
      tags: ['takip', 'durum', 'progress'],
      helpful: 15,
      difficulty: 'Orta'
    },
    {
      id: 4,
      category: 'carriers',
      question: 'Nakliyeci nasıl seçerim?',
      answer: 'Gönderi oluştururken nakliyeci seçimi adımında 3 seçeneğiniz var: Tüm nakliyecilere yayınla, sadece anlaşmalı nakliyeciler, veya öncelikli nakliyeciler. Her seçenek için detaylı açıklamalar mevcuttur.',
      tags: ['nakliyeci', 'seçim', 'teklif'],
      helpful: 22,
      difficulty: 'Orta'
    },
    {
      id: 5,
      category: 'carriers',
      question: 'Nakliyeci performansını nasıl değerlendiririm?',
      answer: 'Nakliyeci Yönetimi sayfasından tüm nakliyecilerinizin performansını görebilirsiniz. Puan, gönderi sayısı, zamanında teslimat oranı ve maliyet analizi gibi detaylı metrikler mevcuttur.',
      tags: ['performans', 'değerlendirme', 'metrik'],
      helpful: 9,
      difficulty: 'İleri'
    },
    {
      id: 6,
      category: 'payments',
      question: 'Ödeme nasıl yapılır?',
      answer: 'Gönderici ile nakliyeci arasında ödeme doğrudan yapılır. Platform sadece nakliyeciden %1 komisyon alır. Ödeme yöntemi (banka havalesi, nakit, fatura vb.) taraflar arasında belirlenir.',
      tags: ['ödeme', 'komisyon', 'direkt'],
      helpful: 14,
      difficulty: 'Kolay'
    },
    {
      id: 7,
      category: 'reports',
      question: 'Raporları nasıl oluştururum?',
      answer: 'Analiz & Raporlar sayfasından operasyonel, finansal ve stratejik raporlar oluşturabilirsiniz. Zaman aralığı, format ve kategori seçenekleri ile özelleştirilebilir raporlar alabilirsiniz.',
      tags: ['rapor', 'analiz', 'export'],
      helpful: 7,
      difficulty: 'İleri'
    },
    {
      id: 8,
      category: 'account',
      question: 'Hesap bilgilerimi nasıl güncellerim?',
      answer: 'Ayarlar > Profil bölümünden şirket bilgilerinizi, iletişim bilgilerinizi ve diğer hesap ayarlarınızı güncelleyebilirsiniz. Değişiklikleri kaydetmeyi unutmayın.',
      tags: ['hesap', 'profil', 'güncelleme'],
      helpful: 11,
      difficulty: 'Kolay'
    },
    {
      id: 9,
      category: 'security',
      question: 'Hesabımı nasıl güvende tutarım?',
      answer: 'Güçlü şifre kullanın, iki faktörlü kimlik doğrulamayı aktifleştirin, oturum zaman aşımını ayarlayın ve şüpheli aktiviteleri takip edin. Güvenlik ayarlarından tüm güvenlik seçeneklerini yönetebilirsiniz.',
      tags: ['güvenlik', 'şifre', '2fa'],
      helpful: 16,
      difficulty: 'Orta'
    },
    {
      id: 10,
      category: 'technical',
      question: 'Teknik sorun yaşıyorum, ne yapmalıyım?',
      answer: 'Teknik sorunlar için önce sayfayı yenileyin ve tarayıcı önbelleğini temizleyin. Sorun devam ederse destek ekibimizle iletişime geçin. Hata mesajlarını ekran görüntüsü ile birlikte paylaşın.',
      tags: ['teknik', 'hata', 'destek'],
      helpful: 13,
      difficulty: 'Orta'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const supportOptions = [
    {
      title: 'Canlı Destek',
      description: '7/24 canlı destek hattımız',
      icon: <Headphones className="w-6 h-6" />,
      action: handleLiveChat,
      available: true,
      responseTime: 'Anında'
    },
    {
      title: 'Telefon Desteği',
      description: '0850 555 01 23',
      icon: <Phone className="w-6 h-6" />,
      action: handleCallSupport,
      available: true,
      responseTime: '7/24'
    },
    {
      title: 'E-posta Desteği',
      description: 'destek@yolnet.com',
      icon: <Mail className="w-6 h-6" />,
      action: handleEmailSupport,
      available: true,
      responseTime: '2 saat'
    },
    {
      title: 'WhatsApp',
      description: 'Hızlı mesajlaşma',
      icon: <MessageSquare className="w-6 h-6" />,
      action: handleWhatsAppSupport,
      available: true,
      responseTime: 'Anında'
    }
  ];

  const quickActions = [
    {
      title: 'Hızlı Başlangıç Rehberi',
      description: 'Platforma hızlıca başlayın',
      icon: <Zap className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: 'Video Eğitimler',
      description: 'Görsel öğrenme materyalleri',
      icon: <Video className="w-5 h-5" />,
      color: 'green'
    },
    {
      title: 'PDF Kılavuzu',
      description: 'Detaylı kullanım kılavuzu',
      icon: <FileText className="w-5 h-5" />,
      color: 'orange'
    },
    {
      title: 'Sık Sorulan Sorular',
      description: 'En çok merak edilen konular',
      icon: <HelpCircle className="w-5 h-5" />,
      color: 'purple'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Yardım & Destek - YolNet Kurumsal</title>
        <meta name="description" content="YolNet platformu kullanım kılavuzu ve destek hizmetleri" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Professional Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center shadow-2xl">
                <HelpCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
              Yardım &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Destek</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              YolNet platformunu en iyi şekilde kullanmanız için kapsamlı destek ve rehberlik
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Professional Action Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-8 py-6">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Destek Merkezi</h2>
                    <p className="text-slate-600">Sorularınızın cevaplarını bulun ve destek alın</p>
                  </div>
                  <div className="hidden lg:block w-px h-12 bg-slate-300"></div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    Son güncelleme: {new Date().toLocaleString('tr-TR')}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Yenile
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                    <Settings className="w-4 h-4" />
                    Ayarlar
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Search Section */}
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Sorunuzu yazın veya anahtar kelime arayın..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-12">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Hızlı Erişim</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300 group text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        action.color === 'blue' ? 'bg-gradient-to-br from-slate-800 to-blue-900 text-white' :
                        action.color === 'green' ? 'bg-gradient-to-br from-slate-800 to-blue-900 text-white' :
                        action.color === 'orange' ? 'bg-gradient-to-br from-slate-800 to-blue-900 text-white' :
                        'bg-gradient-to-br from-slate-800 to-blue-900 text-white'
                      } group-hover:scale-110 transition-transform duration-300`}>
                        {action.icon}
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-sm text-slate-600">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Support Options */}
              <div className="mb-12">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Destek Seçenekleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {supportOptions.map((option, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                      onClick={option.action}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {option.title}
                          </h4>
                          <p className="text-sm text-slate-600">{option.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          option.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {option.available ? 'Mevcut' : 'Müsait Değil'}
                        </span>
                        <span className="text-xs text-slate-500">{option.responseTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Categories */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Kategoriler</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-medium">Tümü</span>
                      </div>
                      <span className="text-sm opacity-75">{faqs.length}</span>
                    </button>
                    
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          selectedCategory === category.id
                            ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {category.icon}
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm opacity-75">{category.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQs */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedCategory === 'all' ? 'Tüm Sorular' : categories.find(c => c.id === selectedCategory)?.name}
                    </h3>
                    <span className="text-sm text-slate-500">{filteredFaqs.length} soru</span>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        <button
                          onClick={() => toggleExpanded(faq.id)}
                          className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900 pr-4">{faq.question}</h4>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Star className="w-4 h-4 text-amber-500" />
                                <span>{faq.helpful}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                faq.difficulty === 'Kolay' ? 'bg-emerald-100 text-emerald-700' :
                                faq.difficulty === 'Orta' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {faq.difficulty}
                              </span>
                              {expandedItems.includes(faq.id) ? (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3">
                            {faq.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </button>
                        
                        {expandedItems.includes(faq.id) && (
                          <div className="px-6 pb-6 border-t border-slate-200 bg-slate-50">
                            <div className="pt-4">
                              <p className="text-slate-700 leading-relaxed mb-4">{faq.answer}</p>
                              <div className="flex items-center gap-4">
                                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                  <CheckCircle className="w-4 h-4" />
                                  Bu cevap yardımcı oldu
                                </button>
                                <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-700 font-medium">
                                  <ExternalLink className="w-4 h-4" />
                                  Detaylı rehber
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {filteredFaqs.length === 0 && (
                    <div className="text-center py-12">
                      <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Sonuç bulunamadı</h3>
                      <p className="text-slate-500">Arama terimlerinizi değiştirmeyi deneyin</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}