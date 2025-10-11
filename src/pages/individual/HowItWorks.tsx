import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Minimize, RotateCcw, Download, Share2, ExternalLink, ChevronRight, ChevronDown, Search, Filter, SortAsc, SortDesc, Info, AlertCircle, CheckCircle, XCircle, Clock, Calendar, MapPin, Weight, DollarSign, Package, Truck, User, Phone, Mail, MessageSquare, Star, Award, Crown, Gift, Tag, Percent, Shield, Key, Bell, Settings, Eye, Globe, CreditCard, Smartphone, Monitor, Laptop, Tablet, Wifi, WifiOff, Battery, BatteryLow, Sun, Moon, Palette, Languages, RefreshCw, Plus, Minus, Copy, Bookmark, BookmarkCheck, MoreVertical } from 'lucide-react';
import { realApiService } from '../../services/realApi';
import { useNavigate } from 'react-router-dom';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  video?: string;
  duration?: string;
  tips: string[];
  requirements: string[];
  benefits: string[];
  order: number;
  category: 'shipment' | 'payment' | 'tracking' | 'communication' | 'safety' | 'account';
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'shipment' | 'payment' | 'account' | 'technical' | 'safety' | 'billing' | 'shipping' | 'returns' | 'refunds';
  isPopular: boolean;
  helpful: number;
  notHelpful: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  duration: string;
  category: 'tutorial' | 'demo' | 'explanation' | 'tips' | 'troubleshooting';
  isPopular: boolean;
  views: number;
  likes: number;
  createdAt: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'getting_started' | 'advanced' | 'troubleshooting' | 'best_practices' | 'security' | 'billing';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  isPopular: boolean;
  views: number;
  helpful: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const mockSteps: Step[] = [
  {
    id: 'step1',
    title: 'Gönderi Oluşturun',
    description: 'Gönderinizin detaylarını girin ve yayınlayın',
    icon: <Package className="w-8 h-8" />,
    image: '/images/create-shipment.jpg',
    video: '/videos/create-shipment.mp4',
    duration: '2-3 dakika',
    tips: [
      'Gönderi açıklamasını detaylı yazın',
      'Doğru ağırlık ve hacim bilgilerini girin',
      'Alıcı bilgilerini eksiksiz doldurun'
    ],
    requirements: [
      'Gönderi açıklaması',
      'Ağırlık ve hacim bilgileri',
      'Gönderici ve alıcı adresleri',
      'İletişim bilgileri'
    ],
    benefits: [
      'Hızlı gönderi oluşturma',
      'Otomatik fiyat hesaplama',
      'Güvenli bilgi paylaşımı'
    ],
    order: 1,
    category: 'shipment'
  },
  {
    id: 'step2',
    title: 'Teklifleri İnceleyin',
    description: 'Taşıyıcılardan gelen teklifleri değerlendirin',
    icon: <DollarSign className="w-8 h-8" />,
    image: '/images/review-offers.jpg',
    video: '/videos/review-offers.mp4',
    duration: '5-10 dakika',
    tips: [
      'Teklifleri fiyat ve süre açısından karşılaştırın',
      'Taşıyıcı değerlendirmelerini kontrol edin',
      'Mesajlarla ek bilgi alın'
    ],
    requirements: [
      'Teklif karşılaştırma',
      'Taşıyıcı değerlendirme',
      'Fiyat analizi'
    ],
    benefits: [
      'En uygun fiyatı bulma',
      'Güvenilir taşıyıcı seçimi',
      'Şeffaf fiyatlandırma'
    ],
    order: 2,
    category: 'shipment'
  },
  {
    id: 'step3',
    title: 'Teklifi Kabul Edin',
    description: 'Uygun teklifi seçin ve onaylayın',
    icon: <CheckCircle className="w-8 h-8" />,
    image: '/images/accept-offer.jpg',
    video: '/videos/accept-offer.mp4',
    duration: '1-2 dakika',
    tips: [
      'Teklif detaylarını son kez kontrol edin',
      'Ödeme yöntemini seçin',
      'Sözleşmeyi okuyun'
    ],
    requirements: [
      'Teklif onayı',
      'Ödeme yöntemi seçimi',
      'Sözleşme kabulü'
    ],
    benefits: [
      'Hızlı onay süreci',
      'Güvenli ödeme',
      'Yasal koruma'
    ],
    order: 3,
    category: 'payment'
  },
  {
    id: 'step4',
    title: 'Gönderinizi Takip Edin',
    description: 'Gönderinizin durumunu gerçek zamanlı takip edin',
    icon: <Truck className="w-8 h-8" />,
    image: '/images/track-shipment.jpg',
    video: '/videos/track-shipment.mp4',
    duration: 'Sürekli',
    tips: [
      'Takip kodunuzu kaydedin',
      'Bildirimleri açık tutun',
      'Düzenli olarak kontrol edin'
    ],
    requirements: [
      'Takip kodu',
      'İnternet bağlantısı',
      'Mobil uygulama veya web sitesi'
    ],
    benefits: [
      'Gerçek zamanlı takip',
      'Otomatik bildirimler',
      'Güvenli teslimat'
    ],
    order: 4,
    category: 'tracking'
  },
  {
    id: 'step5',
    title: 'Teslimatı Onaylayın',
    description: 'Gönderinizin teslim edildiğini onaylayın',
    icon: <Package className="w-8 h-8" />,
    image: '/images/confirm-delivery.jpg',
    video: '/videos/confirm-delivery.mp4',
    duration: '1 dakika',
    tips: [
      'Gönderiyi kontrol edin',
      'Hasarsız teslimatı onaylayın',
      'Taşıyıcıyı değerlendirin'
    ],
    requirements: [
      'Gönderi kontrolü',
      'Teslimat onayı',
      'Değerlendirme'
    ],
    benefits: [
      'Güvenli teslimat',
      'Kalite kontrolü',
      'Hizmet değerlendirmesi'
    ],
    order: 5,
    category: 'shipment'
  }
];

const mockFAQs: FAQ[] = [
  {
    id: 'FAQ001',
    question: 'Gönderi oluşturmak ücretsiz mi?',
    answer: 'Evet, gönderi oluşturmak tamamen ücretsizdir. Sadece kabul ettiğiniz teklif için ödeme yaparsınız. Platform kullanımı, gönderi oluşturma ve teklif alma işlemleri için herhangi bir ücret alınmaz.',
    category: 'general',
    isPopular: true,
    helpful: 45,
    notHelpful: 2,
    tags: ['ücretsiz', 'gönderi', 'oluşturma'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'FAQ002',
    question: 'Gönderim ne kadar sürede teslim edilir?',
    answer: 'Teslimat süresi gönderi türüne, mesafeye ve taşıyıcıya göre değişir. Genellikle 1-7 gün arasında teslim edilir. Express gönderiler için aynı gün teslimat seçeneği de mevcuttur.',
    category: 'shipment',
    isPopular: true,
    helpful: 38,
    notHelpful: 1,
    tags: ['teslimat', 'süre', 'hız'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'FAQ003',
    question: 'Ödeme nasıl yapabilirim?',
    answer: 'Ödeme doğrudan nakliyeci ile yapılır. Platform sadece nakliyeciden %1 komisyon alır. Ödeme yöntemi (nakit, havale, fatura vb.) siz ve nakliyeci arasında belirlenir.',
    category: 'payment',
    isPopular: true,
    helpful: 42,
    notHelpful: 3,
    tags: ['ödeme', 'güvenlik', 'kart'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'FAQ004',
    question: 'Gönderim güvenli mi?',
    answer: 'Evet, tüm gönderiler sigortalıdır ve güvenli taşıma standartlarına uygun olarak taşınır. Taşıyıcılar doğrulanmış ve güvenilir firmalardır. Ayrıca gönderiniz 7/24 takip edilebilir.',
    category: 'safety',
    isPopular: true,
    helpful: 50,
    notHelpful: 1,
    tags: ['güvenlik', 'sigorta', 'takip'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'FAQ005',
    question: 'Gönderimi iptal edebilir miyim?',
    answer: 'Gönderi henüz kabul edilmediyse iptal edebilirsiniz. Kabul edilen gönderiler için taşıyıcı ile iletişime geçmeniz gerekir. İptal koşulları gönderi türüne göre değişebilir.',
    category: 'shipment',
    isPopular: false,
    helpful: 28,
    notHelpful: 5,
    tags: ['iptal', 'gönderi', 'koşullar'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  }
];

const mockVideos: Video[] = [
  {
    id: 'VID001',
    title: 'Gönderi Oluşturma Rehberi',
    description: 'Adım adım gönderi oluşturma sürecini öğrenin',
    thumbnail: '/videos/thumbnails/create-shipment.jpg',
    url: '/videos/create-shipment.mp4',
    duration: '3:45',
    category: 'tutorial',
    isPopular: true,
    views: 1250,
    likes: 89,
    createdAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'VID002',
    title: 'Teklif Değerlendirme İpuçları',
    description: 'En uygun teklifi nasıl seçeceğinizi öğrenin',
    thumbnail: '/videos/thumbnails/review-offers.jpg',
    url: '/videos/review-offers.mp4',
    duration: '2:30',
    category: 'tips',
    isPopular: true,
    views: 890,
    likes: 67,
    createdAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'VID003',
    title: 'Güvenli Ödeme Yöntemleri',
    description: 'Güvenli ödeme yapmanın yollarını keşfedin',
    thumbnail: '/videos/thumbnails/secure-payment.jpg',
    url: '/videos/secure-payment.mp4',
    duration: '4:15',
    category: 'explanation',
    isPopular: false,
    views: 450,
    likes: 34,
    createdAt: '2024-07-01T00:00:00Z'
  }
];

const mockGuides: Guide[] = [
  {
    id: 'GUIDE001',
    title: 'Başlangıç Rehberi',
    description: 'Yolnet platformunu kullanmaya başlamak için temel bilgiler',
    content: 'Bu rehberde Yolnet platformunu nasıl kullanacağınızı öğreneceksiniz...',
    category: 'getting_started',
    difficulty: 'beginner',
    estimatedTime: '10 dakika',
    isPopular: true,
    views: 2100,
    helpful: 156,
    tags: ['başlangıç', 'rehber', 'temel'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'GUIDE002',
    title: 'Gelişmiş Takip Özellikleri',
    description: 'Gönderinizi daha detaylı takip etmenin yolları',
    content: 'Bu rehberde gelişmiş takip özelliklerini nasıl kullanacağınızı öğreneceksiniz...',
    category: 'advanced',
    difficulty: 'intermediate',
    estimatedTime: '15 dakika',
    isPopular: false,
    views: 780,
    helpful: 89,
    tags: ['takip', 'gelişmiş', 'özellikler'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  },
  {
    id: 'GUIDE003',
    title: 'Güvenlik En İyi Uygulamaları',
    description: 'Hesabınızı güvende tutmanın yolları',
    content: 'Bu rehberde hesap güvenliğinizi nasıl sağlayacağınızı öğreneceksiniz...',
    category: 'security',
    difficulty: 'beginner',
    estimatedTime: '8 dakika',
    isPopular: true,
    views: 1450,
    helpful: 112,
    tags: ['güvenlik', 'en iyi uygulamalar', 'hesap'],
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z'
  }
];

const getCategoryInfo = (category: string) => {
  switch (category) {
    case 'general': return { text: 'Genel', color: 'blue', icon: <Info className="w-4 h-4" /> };
    case 'shipment': return { text: 'Gönderi', color: 'green', icon: <Package className="w-4 h-4" /> };
    case 'payment': return { text: 'Ödeme', color: 'purple', icon: <DollarSign className="w-4 h-4" /> };
    case 'account': return { text: 'Hesap', color: 'orange', icon: <User className="w-4 h-4" /> };
    case 'technical': return { text: 'Teknik', color: 'red', icon: <Settings className="w-4 h-4" /> };
    case 'safety': return { text: 'Güvenlik', color: 'yellow', icon: <Shield className="w-4 h-4" /> };
    case 'billing': return { text: 'Faturalama', color: 'indigo', icon: <FileText className="w-4 h-4" /> };
    case 'shipping': return { text: 'Kargo', color: 'pink', icon: <Truck className="w-4 h-4" /> };
    case 'returns': return { text: 'İade', color: 'gray', icon: <Package className="w-4 h-4" /> };
    case 'refunds': return { text: 'İade', color: 'gray', icon: <DollarSign className="w-4 h-4" /> };
    default: return { text: 'Diğer', color: 'gray', icon: <Info className="w-4 h-4" /> };
  }
};

const getDifficultyInfo = (difficulty: Guide['difficulty']) => {
  switch (difficulty) {
    case 'beginner': return { text: 'Başlangıç', color: 'green' };
    case 'intermediate': return { text: 'Orta', color: 'orange' };
    case 'advanced': return { text: 'İleri', color: 'red' };
    default: return { text: 'Bilinmiyor', color: 'gray' };
  }
};

const getVideoCategoryInfo = (category: Video['category']) => {
  switch (category) {
    case 'tutorial': return { text: 'Eğitim', color: 'blue' };
    case 'demo': return { text: 'Demo', color: 'green' };
    case 'explanation': return { text: 'Açıklama', color: 'purple' };
    case 'tips': return { text: 'İpuçları', color: 'orange' };
    case 'troubleshooting': return { text: 'Sorun Giderme', color: 'red' };
    default: return { text: 'Diğer', color: 'gray' };
  }
};

const IndividualHowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('steps');
  const [steps, setSteps] = useState<Step[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchHowItWorksData = async () => {
      setLoading(true);
      try {
        // const response = await realApiService.getHowItWorksData();
        // if (response.success) {
        //   setSteps(response.data.steps);
        //   setFaqs(response.data.faqs);
        //   setVideos(response.data.videos);
        //   setGuides(response.data.guides);
        // } else {
        //   console.error('Failed to fetch how it works data:', response.message);
        //   setSteps(mockSteps);
        //   setFaqs(mockFAQs);
        //   setVideos(mockVideos);
        //   setGuides(mockGuides);
        // }
        setSteps(mockSteps);
        setFaqs(mockFAQs);
        setVideos(mockVideos);
        setGuides(mockGuides);
      } catch (error) {
        console.error('Error fetching how it works data:', error);
        setSteps(mockSteps);
        setFaqs(mockFAQs);
        setVideos(mockVideos);
        setGuides(mockGuides);
      } finally {
        setLoading(false);
      }
    };

    fetchHowItWorksData();
  }, []);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredVideos = videos.filter(video => {
    const matchesSearch = searchTerm === '' ||
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = searchTerm === '' ||
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleGuideToggle = (guideId: string) => {
    setExpandedGuide(expandedGuide === guideId ? null : guideId);
  };

  const handleVideoPlay = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const handleFAQHelpful = (faqId: string, isHelpful: boolean) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === faqId 
        ? { 
            ...faq, 
            helpful: isHelpful ? faq.helpful + 1 : faq.helpful,
            notHelpful: !isHelpful ? faq.notHelpful + 1 : faq.notHelpful
          }
        : faq
    ));
  };

  const handleGuideHelpful = (guideId: string, isHelpful: boolean) => {
    setGuides(prev => prev.map(guide => 
      guide.id === guideId 
        ? { 
            ...guide, 
            helpful: isHelpful ? guide.helpful + 1 : guide.helpful
          }
        : guide
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Nasıl çalışır verileri yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
        {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nasıl Çalışır?</h1>
            <p className="text-sm text-gray-600 mt-1">Platformu nasıl kullanacağınızı öğrenin</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md">
              <Download className="w-4 h-4 mr-2" /> Rehber İndir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Arama */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nasıl çalışır ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'steps', label: 'Adımlar', icon: <Package className="w-4 h-4" /> },
                { id: 'videos', label: 'Videolar', icon: <Play className="w-4 h-4" /> },
                { id: 'guides', label: 'Rehberler', icon: <BookOpen className="w-4 h-4" /> },
                { id: 'faq', label: 'Sık Sorulan Sorular', icon: <HelpCircle className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Kategori Filtresi */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Tümü
                </button>
                {['general', 'shipment', 'payment', 'account', 'technical', 'safety'].map((category) => {
                  const categoryInfo = getCategoryInfo(category);
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                        selectedCategory === category ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {categoryInfo.icon}
                      <span>{categoryInfo.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adımlar Tab */}
            {activeTab === 'steps' && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold text-gray-900">Gönderi Süreci</h3>
                <div className="space-y-6">
          {steps.map((step, index) => (
                    <div key={step.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="text-blue-600">
                              {step.icon}
                            </div>
                          </div>
                          <div className="text-center mt-2">
                            <span className="text-sm font-medium text-gray-900">Adım {step.order}</span>
                  </div>
                </div>
                <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h4>
                              <p className="text-gray-600 mb-2">{step.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {step.duration}
                                </span>
                                <span className="flex items-center">
                                  <Package className="w-4 h-4 mr-1" />
                                  {getCategoryInfo(step.category).text}
                                </span>
                              </div>
                            </div>
                            {step.image && (
                              <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
                                <img
                                  src={step.image}
                                  alt={step.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-2">İpuçları</h5>
                              <ul className="space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Gereksinimler</h5>
                              <ul className="space-y-1">
                                {step.requirements.map((requirement, reqIndex) => (
                                  <li key={reqIndex} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-green-500 mr-2">•</span>
                                    {requirement}
                                  </li>
                                ))}
                              </ul>
                  </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Avantajlar</h5>
                              <ul className="space-y-1">
                                {step.benefits.map((benefit, benefitIndex) => (
                                  <li key={benefitIndex} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-purple-500 mr-2">•</span>
                                    {benefit}
                      </li>
                    ))}
                  </ul>
                            </div>
                          </div>
                </div>
              </div>
            </div>
          ))}
        </div>
              </div>
            )}

            {/* Videolar Tab */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Eğitim Videoları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => {
                    const categoryInfo = getVideoCategoryInfo(video.category);

                    return (
                      <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <button
                              onClick={() => handleVideoPlay(video)}
                              className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
                            >
                              <Play className="w-8 h-8 text-white ml-1" />
                            </button>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {video.duration}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{video.title}</h4>
                            {video.isPopular && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Popüler
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {video.views}
                            </span>
                            <span className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {video.likes}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              categoryInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              categoryInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                              categoryInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                              categoryInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              categoryInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {categoryInfo.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rehberler Tab */}
            {activeTab === 'guides' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Detaylı Rehberler</h3>
                <div className="space-y-4">
                  {filteredGuides.map((guide) => {
                    const difficultyInfo = getDifficultyInfo(guide.difficulty);

                    return (
                      <div key={guide.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => handleGuideToggle(guide.id)}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900">{guide.title}</h4>
                              {guide.isPopular && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" />
                                  Popüler
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                difficultyInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                difficultyInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                difficultyInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {difficultyInfo.text}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{guide.estimatedTime}</span>
                              {expandedGuide === guide.id ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{guide.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {guide.views} görüntülenme
                            </span>
                            <span className="flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              {guide.helpful} yararlı
                            </span>
                          </div>
                        </button>
                        {expandedGuide === guide.id && (
                          <div className="px-4 pb-4 border-t border-gray-200">
                            <div className="pt-4">
                              <div className="prose max-w-none">
                                <p className="text-gray-700 leading-relaxed mb-4">{guide.content}</p>
                              </div>
                              <div className="flex items-center space-x-2 mt-4">
                                <button
                                  onClick={() => handleGuideHelpful(guide.id, true)}
                                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                                >
                                  <Star className="w-4 h-4 inline mr-1" />
                                  Yararlı
                                </button>
                                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200">
                                  <Download className="w-4 h-4 inline mr-1" />
                                  İndir
                                </button>
                                <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200">
                                  <Share2 className="w-4 h-4 inline mr-1" />
                                  Paylaş
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Sık Sorulan Sorular</h3>
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <HelpCircle className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-xl font-medium">Soru bulunamadı.</p>
                    <p className="text-sm mt-2">Farklı anahtar kelimeler deneyin.</p>
                  </div>
                ) : (
                  filteredFAQs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleFAQToggle(faq.id)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{faq.question}</h4>
                            {faq.isPopular && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Popüler
                              </span>
                            )}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {getCategoryInfo(faq.category).icon}
                              <span className="ml-1">{getCategoryInfo(faq.category).text}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {faq.helpful} yararlı
                            </span>
                            {expandedFAQ === faq.id ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-4 border-t border-gray-200">
                          <div className="pt-4">
                            <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleFAQHelpful(faq.id, true)}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                              >
                                <Star className="w-4 h-4 inline mr-1" />
                                Yararlı
                              </button>
                              <button
                                onClick={() => handleFAQHelpful(faq.id, false)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                              >
                                <XCircle className="w-4 h-4 inline mr-1" />
                                Yararsız
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{selectedVideo.title}</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
            </button>
              </div>
            </div>
            <div className="p-4">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full"
                  poster={selectedVideo.thumbnail}
                >
                  <source src={selectedVideo.url} type="video/mp4" />
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
              </div>
              <div className="mt-4">
                <p className="text-gray-700 mb-4">{selectedVideo.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedVideo.duration}
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {selectedVideo.views} görüntülenme
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    {selectedVideo.likes} beğeni
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualHowItWorks;