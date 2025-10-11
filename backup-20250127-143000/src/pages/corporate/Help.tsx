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
  Globe
} from 'lucide-react';

export default function CorporateHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

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
    alert('Canlı destek başlatılıyor...');
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const categories = [
    { id: 'getting-started', name: 'Başlangıç', icon: <Play size={20} />, color: 'blue' },
    { id: 'shipments', name: 'Gönderiler', icon: <Package size={20} />, color: 'green' },
    { id: 'carriers', name: 'Nakliyeciler', icon: <Truck size={20} />, color: 'orange' },
    { id: 'payments', name: 'Ödemeler', icon: <DollarSign size={20} />, color: 'purple' },
    { id: 'reports', name: 'Raporlar', icon: <BarChart3 size={20} />, color: 'indigo' },
    { id: 'account', name: 'Hesap', icon: <Users size={20} />, color: 'pink' },
    { id: 'security', name: 'Güvenlik', icon: <Shield size={20} />, color: 'red' },
    { id: 'technical', name: 'Teknik', icon: <Settings size={20} />, color: 'gray' }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'YolNet platformuna nasıl başlayabilirim?',
      answer: 'YolNet platformuna başlamak için önce hesabınızı oluşturmanız gerekiyor. Kayıt olduktan sonra şirket bilgilerinizi tamamlayın ve ilk gönderinizi oluşturun. Platform size adım adım rehberlik edecektir.',
      tags: ['başlangıç', 'kayıt', 'ilk adımlar']
    },
    {
      id: 2,
      category: 'shipments',
      question: 'Gönderi nasıl oluştururum?',
      answer: 'Gönderi oluşturmak için "Yeni Gönderi" butonuna tıklayın. 6 adımlı formu doldurun: Temel bilgiler, yük detayları, güzergah, nakliyeci seçimi, maliyet ve özet. Her adımda detaylı bilgiler girin.',
      tags: ['gönderi', 'oluşturma', 'form']
    },
    {
      id: 3,
      category: 'shipments',
      question: 'Gönderi durumunu nasıl takip ederim?',
      answer: 'Gönderilerim sayfasından aktif gönderilerinizi görebilirsiniz. Her gönderi için detaylı durum bilgisi, progress bar ve tahmini teslimat süresi gösterilir. Ayrıca gerçek zamanlı takip özelliği de mevcuttur.',
      tags: ['takip', 'durum', 'progress']
    },
    {
      id: 4,
      category: 'carriers',
      question: 'Nakliyeci nasıl seçerim?',
      answer: 'Gönderi oluştururken nakliyeci seçimi adımında 3 seçeneğiniz var: Tüm nakliyecilere yayınla, sadece anlaşmalı nakliyeciler, veya öncelikli nakliyeciler. Her seçenek için detaylı açıklamalar mevcuttur.',
      tags: ['nakliyeci', 'seçim', 'teklif']
    },
    {
      id: 5,
      category: 'carriers',
      question: 'Nakliyeci performansını nasıl değerlendiririm?',
      answer: 'Nakliyeci Yönetimi sayfasından tüm nakliyecilerinizin performansını görebilirsiniz. Puan, gönderi sayısı, zamanında teslimat oranı ve maliyet analizi gibi detaylı metrikler mevcuttur.',
      tags: ['performans', 'değerlendirme', 'metrik']
    },
    {
      id: 6,
      category: 'payments',
      question: 'Ödeme nasıl yapılır?',
      answer: 'Ödeme ayarlarınızda belirlediğiniz yöntemlerle ödeme yapabilirsiniz: Banka havalesi, kredi kartı, fatura ile ödeme veya nakit. Otomatik ödeme özelliği de mevcuttur.',
      tags: ['ödeme', 'fatura', 'kart']
    },
    {
      id: 7,
      category: 'reports',
      question: 'Raporları nasıl oluştururum?',
      answer: 'Raporlar sayfasından operasyonel, finansal ve stratejik raporlar oluşturabilirsiniz. Zaman aralığı, format ve kategori seçenekleri ile özelleştirilebilir raporlar alabilirsiniz.',
      tags: ['rapor', 'analiz', 'export']
    },
    {
      id: 8,
      category: 'account',
      question: 'Hesap bilgilerimi nasıl güncellerim?',
      answer: 'Ayarlar > Profil bölümünden şirket bilgilerinizi, iletişim bilgilerinizi ve diğer hesap ayarlarınızı güncelleyebilirsiniz. Değişiklikleri kaydetmeyi unutmayın.',
      tags: ['hesap', 'profil', 'güncelleme']
    },
    {
      id: 9,
      category: 'security',
      question: 'Hesabımı nasıl güvende tutarım?',
      answer: 'Güçlü şifre kullanın, iki faktörlü kimlik doğrulamayı aktifleştirin, oturum zaman aşımını ayarlayın ve şüpheli aktiviteleri takip edin. Güvenlik ayarlarından tüm güvenlik seçeneklerini yönetebilirsiniz.',
      tags: ['güvenlik', 'şifre', '2fa']
    },
    {
      id: 10,
      category: 'technical',
      question: 'Teknik sorun yaşıyorum, ne yapmalıyım?',
      answer: 'Teknik sorunlar için önce sayfayı yenileyin ve tarayıcı önbelleğini temizleyin. Sorun devam ederse destek ekibimizle iletişime geçin. Hata mesajlarını ekran görüntüsü ile birlikte paylaşın.',
      tags: ['teknik', 'hata', 'destek']
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      pink: 'bg-pink-100 text-pink-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <>
      <Helmet>
        <title>Yardım Merkezi - YolNet Kargo</title>
        <meta name="description" content="Kurumsal yardım ve destek merkezi" />
      </Helmet>

      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Yardım Merkezi</h1>
            <p className="text-xl text-gray-600">Size nasıl yardımcı olabiliriz?</p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Sorunuzu arayın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <button 
              onClick={handleCallSupport}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <Phone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-1">Telefon Desteği</div>
              <div className="text-sm text-gray-500">0850 555 01 23</div>
            </button>
            
            <button 
              onClick={handleEmailSupport}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <Mail className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-1">E-posta Desteği</div>
              <div className="text-sm text-gray-500">destek@yolnet.com</div>
            </button>
            
            <button 
              onClick={handleWhatsAppSupport}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-1">WhatsApp</div>
              <div className="text-sm text-gray-500">Canlı Destek</div>
            </button>
            
            <button 
              onClick={handleLiveChat}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
            >
              <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="font-semibold text-gray-900 mb-1">Canlı Sohbet</div>
              <div className="text-sm text-gray-500">Anında Yardım</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Kategoriler</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Tümü
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(categories.find(c => c.id === faq.category)?.color || 'gray')}`}>
                          {categories.find(c => c.id === faq.category)?.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{faq.question}</h3>
                          <div className="flex flex-wrap gap-1">
                            {faq.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {expandedItems.includes(faq.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedItems.includes(faq.id) && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <div className="pt-4">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          <div className="mt-4 flex items-center gap-4">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Bu cevap yararlı mıydı?
                            </button>
                            <div className="flex items-center gap-1">
                              <button className="p-1 text-gray-400 hover:text-yellow-500">
                                <Star className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-yellow-500">
                                <Star className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-yellow-500">
                                <Star className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-yellow-500">
                                <Star className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-yellow-500">
                                <Star className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sonuç bulunamadı</h3>
                  <p className="text-gray-500 mb-6">Arama kriterlerinize uygun soru bulunamadı</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Tümünü Göster
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ek Kaynaklar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Kullanım Kılavuzu</h3>
              </div>
              <p className="text-gray-600 mb-4">Detaylı platform kullanım kılavuzunu indirin</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                İndir
              </button>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-8 h-8 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Eğitim Videoları</h3>
              </div>
              <p className="text-gray-600 mb-4">Platform özelliklerini öğrenmek için videolar</p>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Play className="w-4 h-4" />
                İzle
              </button>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Topluluk</h3>
              </div>
              <p className="text-gray-600 mb-4">Diğer kullanıcılarla deneyim paylaşın</p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Katıl
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



