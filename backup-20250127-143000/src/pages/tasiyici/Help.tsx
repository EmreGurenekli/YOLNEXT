import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  HelpCircle, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  Video,
  FileText,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function TasiyiciHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const faqData = [
    {
      id: 1,
      category: 'getting-started',
      question: 'Nasıl iş başvurusu yapabilirim?',
      answer: 'İş İlanları sayfasından size uygun işleri bulabilir ve "Başvur" butonuna tıklayarak başvuru yapabilirsiniz. Başvuru yapmadan önce iş detaylarını dikkatlice okuyun.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'Profilimi nasıl tamamlayabilirim?',
      answer: 'Profil sayfasından kişisel bilgilerinizi, araç bilgilerinizi ve mesleki tercihlerinizi güncelleyebilirsiniz. Eksiksiz profil daha fazla iş fırsatı demektir.'
    },
    {
      id: 3,
      category: 'jobs',
      question: 'İş teklifimi nasıl takip edebilirim?',
      answer: 'Dashboard sayfasından aktif işlerinizi ve bekleyen tekliflerinizi takip edebilirsiniz. Her iş için detaylı bilgi ve ilerleme durumu görüntülenir.'
    },
    {
      id: 4,
      category: 'jobs',
      question: 'Müşteri ile nasıl iletişim kurabilirim?',
      answer: 'Mesajlar sayfasından müşterilerinizle doğrudan iletişim kurabilirsiniz. Ayrıca telefon ve video arama özellikleri de mevcuttur.'
    },
    {
      id: 5,
      category: 'payments',
      question: 'Kazançlarımı nasıl takip edebilirim?',
      answer: 'Kazançlarım sayfasından günlük, haftalık ve aylık kazançlarınızı takip edebilirsiniz. Detaylı analiz ve raporlar da mevcuttur.'
    },
    {
      id: 6,
      category: 'payments',
      question: 'Ödeme ne zaman yapılır?',
      answer: 'İş tamamlandıktan sonra müşteri onayı ile ödeme hesabınıza yansır. Genellikle 1-3 iş günü içinde gerçekleşir.'
    },
    {
      id: 7,
      category: 'technical',
      question: 'Uygulama çalışmıyor, ne yapmalıyım?',
      answer: 'Önce internet bağlantınızı kontrol edin. Sorun devam ederse uygulamayı yeniden başlatın. Hala çözülmezse destek ekibi ile iletişime geçin.'
    },
    {
      id: 8,
      category: 'technical',
      question: 'Bildirimler gelmiyor, neden?',
      answer: 'Ayarlar sayfasından bildirim tercihlerinizi kontrol edin. Ayrıca cihazınızın bildirim ayarlarının açık olduğundan emin olun.'
    }
  ];

  const categories = [
    { id: 'all', label: 'Tümü', icon: BookOpen },
    { id: 'getting-started', label: 'Başlangıç', icon: Star },
    { id: 'jobs', label: 'İş Yönetimi', icon: Clock },
    { id: 'payments', label: 'Ödemeler', icon: CheckCircle },
    { id: 'technical', label: 'Teknik', icon: HelpCircle }
  ];

  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleCall = () => {
    window.open('tel:+905551234567');
  };

  const handleEmail = () => {
    window.open('mailto:destek@yolnet.com');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/905551234567');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Yardım Merkezi - Taşıyıcı Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yardım Merkezi</h1>
          <p className="text-gray-600">Sorularınızın cevaplarını bulun ve destek alın</p>
        </div>

        {/* Arama */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Yardım ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Kategoriler */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SSS */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
                <p className="text-gray-600 mt-1">En çok merak edilen konular ve cevapları</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleExpanded(faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {expandedItems.includes(faq.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {expandedItems.includes(faq.id) && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-8">
                    <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sonuç bulunamadı</h3>
                    <p className="text-gray-600">Arama kriterlerinize uygun soru bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Yan Panel */}
          <div className="space-y-6">
            {/* Hızlı Erişim */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Erişim</h3>
              <div className="space-y-3">
                <a href="/tasiyici/jobs" className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">İş İlanları</span>
                </a>
                <a href="/tasiyici/earnings" className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">Kazançlarım</span>
                </a>
                <a href="/tasiyici/profile" className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Star className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-800 font-medium">Profilim</span>
                </a>
              </div>
            </div>

            {/* İletişim */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim</h3>
              <div className="space-y-4">
                <button
                  onClick={handleCall}
                  className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-green-800">Telefon</p>
                    <p className="text-sm text-green-600">+90 555 123 4567</p>
                  </div>
                </button>

                <button
                  onClick={handleEmail}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-blue-800">E-posta</p>
                    <p className="text-sm text-blue-600">destek@yolnet.com</p>
                  </div>
                </button>

                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-green-800">WhatsApp</p>
                    <p className="text-sm text-green-600">Hızlı destek</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Video Rehberler */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Rehberler</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Video className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Başlangıç Rehberi</p>
                    <p className="text-sm text-gray-600">5 dk</p>
                  </div>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Video className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">İş Başvurusu</p>
                    <p className="text-sm text-gray-600">3 dk</p>
                  </div>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Video className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Kazanç Takibi</p>
                    <p className="text-sm text-gray-600">4 dk</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Dokümantasyon */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokümantasyon</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Kullanım Kılavuzu</p>
                    <p className="text-sm text-gray-600">PDF</p>
                  </div>
                </a>
                <a href="#" className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">API Dokümantasyonu</p>
                    <p className="text-sm text-gray-600">Teknik</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Hala Yardıma İhtiyacınız Var mı?</h2>
            <p className="text-green-100 mb-6">
              Sorularınızın cevabını bulamadıysanız, 7/24 destek ekibimizle iletişime geçin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCall}
                className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Hemen Ara
              </button>
              <button
                onClick={handleWhatsApp}
                className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                WhatsApp'tan Yaz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







