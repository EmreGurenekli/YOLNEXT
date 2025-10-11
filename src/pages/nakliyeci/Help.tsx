import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  isOpen: boolean;
}

interface Article {
  id: number;
  title: string;
  description: string;
  category: string;
  readTime: string;
  views: number;
  isNew: boolean;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: 'Nasıl iş teklifi gönderebilirim?',
    answer: 'İşler sayfasından mevcut gönderileri görüntüleyebilir ve "Teklif Gönder" butonuna tıklayarak teklifinizi oluşturabilirsiniz. Teklifiniz gönderici tarafından değerlendirilecek ve size bildirim gönderilecektir.',
    category: 'İş Teklifleri',
    isOpen: false
  },
  {
    id: 2,
    question: 'Komisyon oranımı nasıl belirlerim?',
    answer: 'Ayarlar > İş Ayarları bölümünden komisyon oranınızı belirleyebilirsiniz. Platform %1 komisyon alır, siz de kendi komisyon oranınızı belirleyebilirsiniz.',
    category: 'Komisyon',
    isOpen: false
  },
  {
    id: 3,
    question: 'Taşıyıcıları nasıl yönetebilirim?',
    answer: 'Taşıyıcılar sayfasından mevcut taşıyıcılarınızı görüntüleyebilir, yeni taşıyıcı ekleyebilir ve performanslarını takip edebilirsiniz.',
    category: 'Taşıyıcı Yönetimi',
    isOpen: false
  },
  {
    id: 4,
    question: 'Filo yönetimi nasıl çalışır?',
    answer: 'Filo Yönetimi sayfasından araçlarınızı ekleyebilir, bakım takvimlerini oluşturabilir ve araç performanslarını analiz edebilirsiniz.',
    category: 'Filo Yönetimi',
    isOpen: false
  },
  {
    id: 5,
    question: 'Ödemelerimi nasıl takip edebilirim?',
    answer: 'Analizler sayfasından gelir raporlarınızı görüntüleyebilir, aylık/haftalık kazançlarınızı takip edebilir ve detaylı finansal raporlar alabilirsiniz.',
    category: 'Finansal Takip',
    isOpen: false
  },
  {
    id: 6,
    question: 'Müşterilerle nasıl iletişim kurabilirim?',
    answer: 'Mesajlar sayfasından müşterilerle doğrudan iletişim kurabilirsiniz. Ayrıca iş detaylarında müşteri telefon numarasına ulaşabilirsiniz.',
    category: 'İletişim',
    isOpen: false
  }
];

const articles: Article[] = [
  {
    id: 1,
    title: 'Nakliyeci Olarak Başlangıç Rehberi',
    description: 'YolNet platformunda nakliyeci olarak nasıl başlayacağınızı öğrenin.',
    category: 'Başlangıç',
    readTime: '8 dk',
    views: 2150,
    isNew: true
  },
  {
    id: 2,
    title: 'Etkili Teklif Stratejileri',
    description: 'Daha fazla iş kazanmak için etkili teklif verme teknikleri.',
    category: 'İş Teklifleri',
    readTime: '10 dk',
    views: 1890,
    isNew: false
  },
  {
    id: 3,
    title: 'Filo Optimizasyonu',
    description: 'Araçlarınızı en verimli şekilde nasıl kullanacağınızı öğrenin.',
    category: 'Filo Yönetimi',
    readTime: '12 dk',
    views: 3200,
    isNew: false
  },
  {
    id: 4,
    title: 'Müşteri İlişkileri Yönetimi',
    description: 'Müşteri memnuniyetini artırmak için ipuçları.',
    category: 'Müşteri İlişkileri',
    readTime: '7 dk',
    views: 1450,
    isNew: true
  },
  {
    id: 5,
    title: 'Finansal Raporlama',
    description: 'Gelir ve gider analizlerinizi nasıl yapacağınızı öğrenin.',
    category: 'Finansal Takip',
    readTime: '9 dk',
    views: 2100,
    isNew: false
  }
];

export default function NakliyeciHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [faqList, setFaqList] = useState<FAQ[]>(faqs);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/nakliyeci/dashboard' },
    { label: 'Yardım', icon: <HelpCircle className="w-4 h-4" /> }
  ];

  const categories = [
    'all',
    'İş Teklifleri',
    'Komisyon',
    'Taşıyıcı Yönetimi',
    'Filo Yönetimi',
    'Finansal Takip',
    'İletişim',
    'Müşteri İlişkileri',
    'Başlangıç'
  ];

  const filteredFaqs = faqList.filter(faq => {
    const matchesSearch = searchTerm === '' ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === '' ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id: number) => {
    setFaqList(faqList.map(faq => 
      faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq
    ));
  };

  const handleContactSubmit = () => {
    setSuccessMessage('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
    setShowSuccessMessage(true);
    setShowContactModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Yardım - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci yardım ve destek merkezi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Yardım Merkezi</h1>
              <p className="text-sm text-slate-600">Sorularınızın cevaplarını bulun</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">İletişim</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Yardım ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Help */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Hızlı Yardım</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Telefon Desteği</p>
                    <p className="text-xs text-slate-600">+90 212 555 0123</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                  <Mail className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">E-posta Desteği</p>
                    <p className="text-xs text-slate-600">destek@yolnet.com</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                  <MessageSquare className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Canlı Destek</p>
                    <p className="text-xs text-slate-600">7/24 online</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Yararlı Linkler</h3>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-900 py-2">Kullanım Kılavuzu</a>
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-900 py-2">Video Eğitimler</a>
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-900 py-2">API Dokümantasyonu</a>
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-900 py-2">Güncellemeler</a>
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-900 py-2">Gizlilik Politikası</a>
                <a href="#" className="block text-sm text-slate-600 hover:text-slate-900 py-2">Kullanım Şartları</a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Sık Sorulan Sorular</h3>
              </div>
              <div className="p-4 sm:p-6">
                {filteredFaqs.length === 0 ? (
                  <EmptyState
                    icon={HelpCircle}
                    title="Soru bulunamadı"
                    description="Arama kriterlerinize uygun soru bulunamadı."
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredFaqs.map((faq) => (
                      <div key={faq.id} className="border border-slate-200 rounded-lg">
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">{faq.question}</h4>
                            <p className="text-xs text-slate-500 mt-1">{faq.category}</p>
                          </div>
                          {faq.isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                        {faq.isOpen && (
                          <div className="px-4 pb-4">
                            <p className="text-sm text-slate-700">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Articles Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Yardımcı Makaleler</h3>
              </div>
              <div className="p-4 sm:p-6">
                {filteredArticles.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="Makale bulunamadı"
                    description="Arama kriterlerinize uygun makale bulunamadı."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => (
                      <div key={article.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-slate-900">{article.title}</h4>
                          {article.isNew && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Yeni</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mb-3">{article.description}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{article.readTime} okuma</span>
                          <span>{article.views} görüntüleme</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <Modal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          title="Destek Ekibiyle İletişim"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Konu</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500">
                <option>Genel Soru</option>
                <option>Teknik Destek</option>
                <option>Ödeme Sorunu</option>
                <option>Hesap Sorunu</option>
                <option>Filo Yönetimi</option>
                <option>Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mesaj</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Sorunuzu detaylı bir şekilde açıklayın..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleContactSubmit}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Gönder
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}