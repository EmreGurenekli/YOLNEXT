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
  Info,
  Package,
  Truck,
  Star,
  CreditCard,
  User,
  MapPin,
  Clock,
  Shield,
  Settings
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

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
    { id: 'all', name: 'Tümü', count: 0, icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'getting-started', name: 'Başlangıç', count: 5, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'shipments', name: 'Gönderiler', count: 8, icon: <Package className="w-4 h-4" /> },
    { id: 'offers', name: 'Teklifler', count: 6, icon: <Star className="w-4 h-4" /> },
    { id: 'tracking', name: 'Takip', count: 4, icon: <Truck className="w-4 h-4" /> },
    { id: 'payments', name: 'Ödemeler', count: 7, icon: <CreditCard className="w-4 h-4" /> },
    { id: 'account', name: 'Hesap', count: 5, icon: <User className="w-4 h-4" /> }
  ];

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'Gönderi nasıl oluştururum?',
      answer: 'Ana sayfada "Yeni Gönderi" butonuna tıklayarak gönderi oluşturabilirsiniz. Adım adım formu doldurarak gönderinizi oluşturabilir ve nakliyeci tekliflerini alabilirsiniz.',
      category: 'getting-started'
    },
    {
      id: '2',
      question: 'Teklifleri nasıl değerlendiririm?',
      answer: 'Teklifler sayfasında gelen teklifleri inceleyebilir, fiyat, teslimat süresi ve nakliyeci değerlendirmelerine göre karşılaştırabilirsiniz. Beğendiğiniz teklifi kabul edebilirsiniz.',
      category: 'offers'
    },
    {
      id: '3',
      question: 'Gönderimi nasıl takip ederim?',
      answer: 'Gönderilerim sayfasında gönderinizin durumunu takip edebilirsiniz. Nakliyeci tarafından güncellenen konum bilgilerini canlı olarak görebilirsiniz.',
      category: 'tracking'
    },
    {
      id: '4',
      question: 'Ödeme nasıl yaparım?',
      answer: 'Kabul ettiğiniz teklif için ödeme doğrudan nakliyeci ile yapılır. Platform sadece nakliyeciden %1 komisyon alır. Ödeme yöntemi (nakit, havale, fatura vb.) siz ve nakliyeci arasında belirlenir.',
      category: 'payments'
    },
    {
      id: '5',
      question: 'Hesabımı nasıl güncellerim?',
      answer: 'Profil sayfasından kişisel bilgilerinizi, iletişim bilgilerinizi ve tercihlerinizi güncelleyebilirsiniz.',
      category: 'account'
    },
    {
      id: '6',
      question: 'Gönderi iptal edebilir miyim?',
      answer: 'Gönderi henüz nakliyeciye atanmamışsa iptal edebilirsiniz. Atanmış gönderiler için nakliyeci ile iletişime geçmeniz gerekebilir.',
      category: 'shipments'
    },
    {
      id: '7',
      question: 'Nakliyeci ile nasıl iletişim kurarım?',
      answer: 'Mesajlar sayfasından nakliyeci ile doğrudan iletişim kurabilirsiniz. Ayrıca telefon ve e-posta bilgileri de sağlanmaktadır.',
      category: 'shipments'
    },
    {
      id: '8',
      question: 'Sigorta kapsamı nedir?',
      answer: 'Tüm gönderiler temel sigorta kapsamındadır. Değerli eşyalar için ek sigorta seçenekleri sunulmaktadır.',
      category: 'shipments'
    }
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: 'YolNet\'e Başlangıç Rehberi',
      description: 'YolNet platformunu nasıl kullanacağınızı öğrenin',
      category: 'getting-started',
      readTime: '5 dk',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: '2',
      title: 'Gönderi Oluşturma Adımları',
      description: 'Detaylı gönderi oluşturma rehberi',
      category: 'shipments',
      readTime: '8 dk',
      icon: <Package className="w-5 h-5" />
    },
    {
      id: '3',
      title: 'Teklif Değerlendirme Kriterleri',
      description: 'En iyi teklifi nasıl seçeceğinizi öğrenin',
      category: 'offers',
      readTime: '6 dk',
      icon: <Star className="w-5 h-5" />
    },
    {
      id: '4',
      title: 'Canlı Takip Özellikleri',
      description: 'Gönderinizi nasıl takip edeceğinizi öğrenin',
      category: 'tracking',
      readTime: '4 dk',
      icon: <Truck className="w-5 h-5" />
    },
    {
      id: '5',
      title: 'Güvenli Ödeme Yöntemleri',
      description: 'Ödeme seçenekleri ve güvenlik',
      category: 'payments',
      readTime: '7 dk',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: '6',
      title: 'Hesap Güvenliği',
      description: 'Hesabınızı nasıl koruyacağınızı öğrenin',
      category: 'account',
      readTime: '5 dk',
      icon: <Shield className="w-5 h-5" />
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

  const breadcrumbItems = [
    { label: 'Yardım', icon: <HelpCircle className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Yardım - YolNet Bireysel</title>
        <meta name="description" content="Bireysel gönderici yardım merkezi - SSS, rehberler ve destek" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Yardım{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Merkezi</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">Sorularınızın cevaplarını bulun ve destek alın</p>
        </div>

        {/* Search - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Sorunuzu arayın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Categories - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Kategoriler</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {category.icon}
                  <span className="text-sm font-medium text-slate-900">{category.name}</span>
                </div>
                <div className="text-xs text-slate-500">{category.count} makale</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">Telefon Desteği</h3>
            <p className="text-xs text-slate-600 mb-3">7/24 telefon desteği</p>
            <a href="tel:+905551234567" className="text-xs text-blue-600 hover:text-blue-900">
              +90 555 123 45 67
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">E-posta Desteği</h3>
            <p className="text-xs text-slate-600 mb-3">24 saat içinde yanıt</p>
            <a href="mailto:destek@yolnet.com" className="text-xs text-green-600 hover:text-green-900">
              destek@yolnet.com
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">Canlı Destek</h3>
            <p className="text-xs text-slate-600 mb-3">Anlık mesajlaşma</p>
            <button className="text-xs text-purple-600 hover:text-purple-900">
              Sohbet Başlat
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">Video Rehberler</h3>
            <p className="text-xs text-slate-600 mb-3">Görsel öğrenme</p>
            <button className="text-xs text-orange-600 hover:text-orange-900">
              Videoları İzle
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Sık Sorulan Sorular</h3>
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="Soru Bulunamadı"
                description="Arama kriterlerinize uygun soru bulunamadı."
              />
            ) : (
              filteredFAQs.map((faq) => (
                <div key={faq.id} className="border border-slate-200 rounded-lg">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-900">{faq.question}</h4>
                      {openFAQ === faq.id ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>
                  {openFAQ === faq.id && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-slate-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Articles Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Yardımcı Makaleler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={BookOpen}
                  title="Makale Bulunamadı"
                  description="Arama kriterlerinize uygun makale bulunamadı."
                />
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div key={article.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      {article.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 mb-1">{article.title}</h4>
                      <p className="text-xs text-slate-600 mb-2">{article.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{article.readTime}</span>
                        <button className="text-xs text-blue-600 hover:text-blue-900">
                          Oku
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualHelp;