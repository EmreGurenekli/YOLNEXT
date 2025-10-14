import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  Truck, 
  Shield, 
  Clock, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Play,
  Users,
  Award,
  Zap,
  Heart,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronDown,
  Menu,
  X,
  TrendingUp,
  Target,
  BarChart3,
  MessageCircle,
  Headphones,
  Package,
  Building2,
  DollarSign,
  Eye,
  Lock,
  Smartphone,
  Laptop,
  Monitor
} from 'lucide-react'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activePanel, setActivePanel] = useState('individual')

  const handleGetStarted = () => {
    navigate('/register')
  }

  const handleDemoLogin = () => {
    navigate('/login')
  }

  const handleDemoPanelLogin = (panelType: string) => {
    // Demo login logic
    console.log(`Demo login for ${panelType}`)
    navigate('/login')
  }

  const panels = [
    {
      id: 'individual',
      title: 'Bireysel Gönderici',
      icon: Users,
      description: 'Kişisel gönderilerinizi kolayca yönetin',
      features: ['Gönderi Oluştur', 'Takip Et', 'Fiyat Karşılaştır'],
      stats: { users: '25,000+', savings: '₺2,500' },
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'corporate',
      title: 'Kurumsal Gönderici',
      icon: Building2,
      description: 'Şirketinizin lojistik ihtiyaçlarını yönetin',
      features: ['Toplu Gönderi', 'Ekip Yönetimi', 'Raporlama'],
      stats: { users: '5,000+', savings: '₺15,000' },
      color: 'from-purple-500 to-purple-700'
    },
    {
      id: 'nakliyeci',
      title: 'Nakliyeci',
      icon: Truck,
      description: 'Taşıma işlerinizi organize edin',
      features: ['İş Bul', 'Araç Yönetimi', 'Kazanç Takibi'],
      stats: { users: '15,000+', earnings: '₺8,000' },
      color: 'from-green-500 to-green-700'
    },
    {
      id: 'tasiyici',
      title: 'Taşıyıcı',
      icon: Package,
      description: 'Bireysel taşıma hizmetleri verin',
      features: ['İş Kabul Et', 'Konum Güncelle', 'Kazanç Görüntüle'],
      stats: { users: '8,000+', earnings: '₺5,000' },
      color: 'from-orange-500 to-orange-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
      <Helmet>
        <title>YolNet - Türkiye'nin En Gelişmiş Lojistik Platformu</title>
        <meta name="description" content="YolNet ile kargo maliyetlerinizi %40 azaltın, teslimat sürenizi 2 güne düşürün. 50,000+ mutlu müşteri, %99.9 başarı oranı." />
        <meta name="keywords" content="kargo, lojistik, taşımacılık, nakliye, gönderi, teslimat" />
        <meta property="og:title" content="YolNet - Türkiye'nin En Gelişmiş Lojistik Platformu" />
        <meta property="og:description" content="3x daha hızlı, 2x daha ucuz kargo ile sevdiklerinize güvenle gönderin." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yolnet.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YolNet - Türkiye'nin En Gelişmiş Lojistik Platformu" />
        <meta name="twitter:description" content="3x daha hızlı, 2x daha ucuz kargo ile sevdiklerinize güvenle gönderin." />
      </Helmet>

      {/* Header */}
      <header className="bg-slate-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Truck className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold text-white">YolNet</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#what-is" className="text-white hover:text-blue-300 px-3 py-2 text-sm font-medium">YolNet Nedir?</a>
              <a href="#panels" className="text-white hover:text-blue-300 px-3 py-2 text-sm font-medium">Paneller</a>
              <a href="#advantages" className="text-white hover:text-blue-300 px-3 py-2 text-sm font-medium">Avantajlar</a>
              <a href="#contact" className="text-white hover:text-blue-300 px-3 py-2 text-sm font-medium">İletişim</a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleDemoLogin}
                className="text-white hover:text-blue-300 px-3 py-2 text-sm font-medium"
              >
                Demo Giriş
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Hemen Başla
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-blue-300"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-700 border-t border-slate-600">
              <a href="#what-is" className="text-white hover:text-blue-300 block px-3 py-2 text-base font-medium">YolNet Nedir?</a>
              <a href="#panels" className="text-white hover:text-blue-300 block px-3 py-2 text-base font-medium">Paneller</a>
              <a href="#advantages" className="text-white hover:text-blue-300 block px-3 py-2 text-base font-medium">Avantajlar</a>
              <a href="#contact" className="text-white hover:text-blue-300 block px-3 py-2 text-base font-medium">İletişim</a>
              <div className="pt-4 pb-3 border-t border-slate-600">
                <button
                  onClick={handleDemoLogin}
                  className="text-white hover:text-blue-300 block px-3 py-2 text-base font-medium w-full text-left"
                >
                  Demo Giriş
                </button>
                <button
                  onClick={handleGetStarted}
                  className="bg-slate-700 hover:bg-slate-600 text-white block px-3 py-2 rounded-lg text-base font-medium w-full text-left mt-2"
                >
                  Hemen Başla
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with Banner */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Türkiye'nin{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                  En Hızlı
                </span>{' '}
                Lojistik Platformu
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-8">
                <strong>3x daha hızlı, 2x daha ucuz</strong> kargo ile sevdiklerinize güvenle gönderin. 
                <br />
                <span className="text-blue-400 font-semibold">İlk gönderiniz ücretsiz!</span>
              </p>

              {/* Social Proof */}
              <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex items-center text-slate-300">
                  <Users className="w-5 h-5 text-green-400 mr-2" />
                  <span className="font-semibold">50,000+ mutlu müşteri</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Award className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="font-semibold">%99.9 başarı oranı</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Clock className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="font-semibold">24 saat ortalama teslimat</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center">
                    Hemen Başla
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </span>
                </button>
                
                <button
                  onClick={handleDemoLogin}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-slate-600"
                >
                  <span className="flex items-center">
                    Demo Hesapları
                    <Play className="ml-2 w-5 h-5" />
                  </span>
                </button>
              </div>
            </div>

            {/* Right Side - Banner Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/img/YolNet_web_sitesi_i_in_ana_sayfa_hero_banner__Bir_reklam_ajans_n_n_haz_rlad____gibi__her_detay___zen.png" 
                  alt="YolNet Lojistik Platform" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* YolNet Nedir? Section */}
      <section id="what-is" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">YolNet</span> Nedir?
          </h2>
          <p className="text-2xl text-slate-300 mb-12 max-w-4xl mx-auto">
            Türkiye'nin en büyük lojistik platformu. Göndericiler ve taşıyıcıları buluşturan, 
            <span className="font-semibold text-blue-400"> akıllı eşleştirme</span> ile en uygun fiyatı sunan platform.
          </p>
          
          {/* How It Works */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">1. Gönderi Oluştur</h3>
              <p className="text-slate-300 text-lg">Gönderinizin detaylarını girin, platform otomatik olarak en uygun taşıyıcıları bulur.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">2. Teklifleri Karşılaştır</h3>
              <p className="text-slate-300 text-lg">Birden fazla taşıyıcıdan teklif alın, fiyat ve kaliteyi karşılaştırın.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">3. Güvenle Gönder</h3>
              <p className="text-slate-300 text-lg">Seçtiğiniz taşıyıcı ile anlaşın, gönderinizi güvenle teslim edin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Panel Avantajları Section */}
      <section id="panels" className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Panel</span> Avantajları
            </h2>
            <p className="text-2xl text-slate-300 mb-8 max-w-4xl mx-auto">
              Her kullanıcı tipine özel tasarlanmış paneller ile ihtiyaçlarınıza en uygun çözümü bulun
            </p>
          </div>

          {/* Panel Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {panels.map((panel) => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activePanel === panel.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {panel.title}
              </button>
            ))}
          </div>

          {/* Active Panel Display */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="flex items-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${panels.find(p => p.id === activePanel)?.color} rounded-2xl flex items-center justify-center mr-6`}>
                  {React.createElement(panels.find(p => p.id === activePanel)?.icon || Users, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2">
                    {panels.find(p => p.id === activePanel)?.title}
                  </h3>
                  <p className="text-slate-300 text-lg">
                    {panels.find(p => p.id === activePanel)?.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {panels.find(p => p.id === activePanel)?.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center text-green-400 font-semibold mb-1">
                    <Users className="w-4 h-4 mr-2" />
                    Kullanıcı Sayısı
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {panels.find(p => p.id === activePanel)?.stats.users}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center text-blue-400 font-semibold mb-1">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {activePanel === 'individual' || activePanel === 'corporate' ? 'Ortalama Tasarruf' : 'Ortalama Kazanç'}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {panels.find(p => p.id === activePanel)?.stats.savings || panels.find(p => p.id === activePanel)?.stats.earnings}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDemoPanelLogin(activePanel)}
                className={`w-full bg-gradient-to-r ${panels.find(p => p.id === activePanel)?.color} text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-lg`}
              >
                Ücretsiz Dene
              </button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-8 shadow-2xl">
                <h4 className="text-2xl font-bold text-white mb-6">Panel Özellikleri</h4>
                <div className="space-y-4">
                  <div className="flex items-center text-slate-300">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                    <span>Gerçek zamanlı takip</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                    <span>Akıllı eşleştirme</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <div className="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
                    <span>Güvenli ödeme</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <div className="w-3 h-3 bg-orange-400 rounded-full mr-3"></div>
                    <span>7/24 destek</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* YolNet Avantajları Section */}
      <section id="advantages" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">YolNet</span> Avantajları
          </h2>
          <p className="text-2xl text-slate-300 mb-12 max-w-4xl mx-auto">
            Geleneksel yöntemlere göre <span className="font-semibold text-green-400">₺2,500 tasarruf</span> edin ve lojistiğinizi dijitalleştirin.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group p-8 rounded-3xl border-2 bg-slate-800 border-slate-700 hover:border-green-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-3">
              <div className="mb-6">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">₺2,500 Ortalama Tasarruf</h3>
              <p className="text-slate-300 text-lg">Geleneksel yöntemlere göre her gönderide</p>
            </div>
            <div className="group p-8 rounded-3xl border-2 bg-slate-800 border-slate-700 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-3">
              <div className="mb-6">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">3 Dakikada Gönderi</h3>
              <p className="text-slate-300 text-lg">Kayıt olmadan bile gönderi oluşturun</p>
            </div>
            <div className="group p-8 rounded-3xl border-2 bg-slate-800 border-slate-700 hover:border-yellow-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-3">
              <div className="mb-6">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">%40 Daha Hızlı</h3>
              <p className="text-slate-300 text-lg">Akıllı algoritma ile en hızlı teslimat</p>
            </div>
            <div className="group p-8 rounded-3xl border-2 bg-slate-800 border-slate-700 hover:border-purple-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-3">
              <div className="mb-6">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Sıfır Komisyon</h3>
              <p className="text-slate-300 text-lg">İlk 10 gönderinizde komisyon yok</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Hemen Başlayın
          </h2>
          <p className="text-2xl text-blue-100 mb-8 max-w-4xl mx-auto">
            <span className="font-semibold">50,000+ kullanıcı</span> ile birlikte lojistik süreçlerinizi dijitalleştirin
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 px-10 py-5 rounded-2xl text-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105"
            >
              Ücretsiz Hesap Oluştur
            </button>
            <button className="border-2 border-white text-white px-10 py-5 rounded-2xl text-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300">
              <Phone className="w-6 h-6 mr-3 inline" />
              Ücretsiz Danışmanlık
            </button>
          </div>
          
          <div className="mt-12 text-blue-100">
            <p className="text-lg">✨ İlk 10 gönderinizde komisyon yok</p>
            <p className="text-lg">🛡️ 256-bit SSL güvenlik garantisi</p>
            <p className="text-lg">📞 7/24 müşteri desteği</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">YolNet</span>
              </div>
              <p className="text-slate-400 mb-4">
                Türkiye'nin en büyük lojistik platformu
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Şirket</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kariyer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Destek</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Durum</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-500">
            <p>&copy; 2024 YolNet. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;