import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  icon: any;
}

const IndividualHelp: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'Tümü', count: 0 },
    { id: 'getting-started', name: 'Başlangıç', count: 0 },
    { id: 'shipments', name: 'Gönderiler', count: 0 },
    { id: 'offers', name: 'Teklifler', count: 0 },
    { id: 'tracking', name: 'Takip', count: 0 },
    { id: 'payments', name: 'Ödemeler', count: 0 },
    { id: 'account', name: 'Hesap', count: 0 }
  ];

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'Nasıl gönderi oluşturabilirim?',
      answer: 'Ana sayfadan "Gönderi Oluştur" butonuna tıklayın. Gönderi detaylarını doldurun ve nakliyecilerin teklif vermesini bekleyin.',
      category: 'getting-started'
    },
    {
      id: '2',
      question: 'Teklifleri nasıl değerlendiririm?',
      answer: 'Tekliflerim sayfasından gelen teklifleri inceleyebilir, nakliyeci bilgilerini görüntüleyebilir ve kabul/reddet kararı verebilirsiniz.',
      category: 'offers'
    },
    {
      id: '3',
      question: 'Gönderimi nasıl takip edebilirim?',
      answer: 'Canlı Takip sayfasından gönderinizin anlık durumunu takip edebilir ve nakliyeci ile mesajlaşabilirsiniz.',
      category: 'tracking'
    },
    {
      id: '4',
      question: 'Ödeme nasıl yapılır?',
      answer: 'Gönderi kabul edildikten sonra güvenli ödeme sistemi ile kredi kartı veya banka kartı ile ödeme yapabilirsiniz.',
      category: 'payments'
    },
    {
      id: '5',
      question: 'Hesabımı nasıl güncelleyebilirim?',
      answer: 'Profil & Ayarlar sayfasından kişisel bilgilerinizi düzenleyebilir, tercihlerinizi değiştirebilirsiniz.',
      category: 'account'
    },
    {
      id: '6',
      question: 'Gönderi iptal edebilir miyim?',
      answer: 'Gönderi henüz kabul edilmediyse iptal edebilirsiniz. Kabul edildikten sonra nakliyeci ile iletişime geçmeniz gerekebilir.',
      category: 'shipments'
    },
    {
      id: '7',
      question: 'Fiyat nasıl belirlenir?',
      answer: 'Fiyatlar gönderi ağırlığı, mesafe, özel gereksinimler ve nakliyeci tekliflerine göre belirlenir. En uygun fiyatı seçebilirsiniz.',
      category: 'payments'
    },
    {
      id: '8',
      question: 'Sigorta kapsamı nedir?',
      answer: 'Gönderileriniz otomatik olarak temel sigorta kapsamındadır. Değerli eşyalar için ek sigorta alabilirsiniz.',
      category: 'shipments'
    },
    {
      id: '9',
      question: 'Teslimat süresi ne kadar?',
      answer: 'Teslimat süresi mesafeye ve nakliyeci seçimine göre değişir. Genellikle 1-3 gün arasındadır.',
      category: 'shipments'
    },
    {
      id: '10',
      question: 'Nakliyeci nasıl seçilir?',
      answer: 'Nakliyeciler puan, başarı oranı, fiyat ve özel hizmetlerine göre değerlendirilir. En uygun seçimi yapabilirsiniz.',
      category: 'offers'
    }
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: 'YolNet\'e Başlama Rehberi',
      description: 'Platformu nasıl kullanacağınızı öğrenin',
      category: 'getting-started',
      readTime: '5 dk',
      icon: BookOpen
    },
    {
      id: '2',
      title: 'Gönderi Oluşturma Adımları',
      description: 'Detaylı gönderi oluşturma rehberi',
      category: 'shipments',
      readTime: '3 dk',
      icon: BookOpen
    },
    {
      id: '3',
      title: 'Teklif Değerlendirme Kriterleri',
      description: 'En iyi teklifi nasıl seçeceğinizi öğrenin',
      category: 'offers',
      readTime: '4 dk',
      icon: BookOpen
    },
    {
      id: '4',
      title: 'Gönderi Takip Etme',
      description: 'Gönderinizi nasıl takip edeceğinizi öğrenin',
      category: 'tracking',
      readTime: '2 dk',
      icon: Video
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Yardım & Rehber - YolNet</title>
        <meta name="description" content="Yardım ve rehber sayfası" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Yardım &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-700">
              Rehber
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sorularınızın cevaplarını bulun ve platformu daha iyi kullanın
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Yardım ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Help */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Yardım</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Telefon Desteği</p>
                    <p className="text-sm text-gray-600">+90 850 123 45 67</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">E-posta Desteği</p>
                    <p className="text-sm text-gray-600">destek@yolnet.com</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Canlı Destek</p>
                    <p className="text-sm text-gray-600">7/24 online</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Popüler Konular</h2>
              <div className="space-y-2">
                {['Gönderi oluşturma', 'Teklif değerlendirme', 'Ödeme işlemleri', 'Hesap güvenliği'].map((topic, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors text-sm text-gray-700"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
                <p className="text-gray-600 mt-1">En çok merak edilen konular</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {openFAQ === faq.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {openFAQ === faq.id && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Articles Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Rehber Makaleleri</h2>
                <p className="text-gray-600 mt-1">Detaylı kullanım rehberleri</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => {
                    const IconComponent = article.icon;
                    return (
                      <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{article.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{article.readTime} okuma</span>
                              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                                Oku <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">İletişime Geçin</h2>
                <p className="text-gray-600 mt-1">Sorunuzu bulamadınız mı? Bize yazın</p>
              </div>
              <div className="p-6">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Adınızı girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="E-posta adresinizi girin"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Genel Soru</option>
                      <option>Teknik Sorun</option>
                      <option>Ödeme Sorunu</option>
                      <option>Hesap Sorunu</option>
                      <option>Diğer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Sorunuzu detaylı olarak açıklayın"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Mesaj Gönder
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualHelp;