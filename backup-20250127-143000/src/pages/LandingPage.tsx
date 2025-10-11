import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Building2
} from 'lucide-react'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const testimonials = [
    {
      name: "Ahmet Yılmaz",
      company: "Migros Ticaret A.Ş.",
      role: "Lojistik Müdürü",
      content: "YolNet ile kargo maliyetlerimiz %40 azaldı, teslimat süremiz 2 güne düştü. Harika bir platform!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Fatma Demir",
      company: "E-ticaret Girişimcisi",
      role: "Kurucu",
      content: "Artık müşterilerime 24 saat içinde teslimat garantisi verebiliyorum. YolNet sayesinde!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Mehmet Kaya",
      company: "Nakliyeci",
      role: "Araç Sahibi",
      content: "Araçlarımı %90 kapasite ile çalıştırıyorum. YolNet ile gelirim 3 katına çıktı!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    }
  ]

  const features = [
    {
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: "3x Daha Hızlı Teslimat",
      description: "Akıllı rota optimizasyonu ile ortalama 24 saat teslimat",
      benefit: "Zaman tasarrufu"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "100% Güvenli",
      description: "Sigortalı taşımacılık ve 7/24 takip sistemi",
      benefit: "Güvenlik garantisi"
    },
    {
      icon: <Clock className="w-8 h-8 text-orange-600" />,
      title: "7/24 Destek",
      description: "Anlık müşteri hizmetleri ve acil durum desteği",
      benefit: "Kesintisiz hizmet"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: "Anında Fiyat",
      description: "Gerçek zamanlı fiyatlandırma ve anında teklif",
      benefit: "Şeffaf fiyatlandırma"
    }
  ]

  const stats = [
    { number: "50,000+", label: "Mutlu Müşteri", icon: <Users className="w-6 h-6" /> },
    { number: "99.9%", label: "Başarı Oranı", icon: <Award className="w-6 h-6" /> },
    { number: "24 Saat", label: "Ortalama Teslimat", icon: <Clock className="w-6 h-6" /> },
    { number: "7/24", label: "Müşteri Desteği", icon: <Phone className="w-6 h-6" /> }
  ]

  const benefits = [
    {
      title: "Bireysel Kullanıcılar",
      description: "Sevdiklerinize güvenle gönderin",
      features: ["Ücretsiz paketleme", "Sigorta dahil", "Anlık takip", "7/24 destek"],
      cta: "Bireysel Hesap Aç",
      color: "blue"
    },
    {
      title: "Kurumsal Müşteriler",
      description: "İşinizi büyütün, maliyetlerinizi düşürün",
      features: ["Toplu gönderim", "Özel fiyatlar", "Raporlama", "API entegrasyonu"],
      cta: "Kurumsal Hesap Aç",
      color: "green"
    },
    {
      title: "Nakliyeci",
      description: "Araçlarınızı dolu çalıştırın",
      features: ["Yük bulma", "Rota optimizasyonu", "Güvenli ödeme", "Müşteri yönetimi"],
      cta: "Nakliyeci Ol",
      color: "purple"
    },
    {
      title: "Taşıyıcı",
      description: "Esnek çalışma, düzenli gelir",
      features: ["İş seçme", "Esnek saatler", "Hızlı ödeme", "Sosyal güvence"],
      cta: "Taşıyıcı Ol",
      color: "orange"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleGetStarted = () => {
    navigate('/register')
  }

  const handleDemoLogin = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Truck className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-2xl font-bold text-gray-900">YolNet</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Özellikler</a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Faydalar</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Yorumlar</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Fiyatlar</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">İletişim</a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleDemoLogin}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                Demo Giriş
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Hemen Başla
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a href="#features" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">Özellikler</a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">Faydalar</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">Yorumlar</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">Fiyatlar</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">İletişim</a>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <button
                  onClick={handleDemoLogin}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium w-full text-left"
                >
                  Demo Giriş
                </button>
                <button
                  onClick={handleGetStarted}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-base font-medium transition-colors w-full mt-2"
                >
                  Hemen Başla
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Türkiye'nin{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                En Hızlı
              </span>{' '}
              Kargo Platformu
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              <strong>3x daha hızlı, 2x daha ucuz</strong> kargo ile sevdiklerinize güvenle gönderin. 
              <br />
              <span className="text-blue-600 font-semibold">İlk gönderiniz ücretsiz!</span>
            </p>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-semibold">50,000+ mutlu müşteri</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Award className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold">%99.9 başarı oranı</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                <span className="font-semibold">24 saat ortalama teslimat</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
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
                className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200"
              >
                <span className="flex items-center">
                  Demo Hesapları
                  <Play className="ml-2 w-5 h-5" />
                </span>
              </button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Ücretsiz deneme</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Para iade garantisi</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>7/24 müşteri desteği</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>SSL güvenlik</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-green-50/50"></div>
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden YolNet?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Türkiye'nin en gelişmiş kargo platformu ile zaman, para ve enerji tasarrufu yapın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 text-center">
                  {feature.description}
                </p>
                <div className="text-center">
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    {feature.benefit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Herkes İçin YolNet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bireysel kullanıcıdan büyük şirketlere, herkes için özel çözümler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {benefit.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {benefit.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleGetStarted}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                    benefit.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    benefit.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                    benefit.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {benefit.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Müşterilerimiz Ne Diyor?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Binlerce mutlu müşterimizin deneyimlerini keşfedin
            </p>
          </div>

          <div className="relative">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-xl text-gray-700 mb-8 italic">
                  "{testimonials[activeTestimonial].content}"
                </blockquote>
                
                <div className="flex items-center justify-center">
                  <img
                    src={testimonials[activeTestimonial].avatar}
                    alt={testimonials[activeTestimonial].name}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-gray-600">
                      {testimonials[activeTestimonial].role}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonials[activeTestimonial].company}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Hemen Başlayın, İlk Gönderiniz Ücretsiz!
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Binlerce mutlu müşterimiz gibi siz de YolNet'in avantajlarından yararlanın. 
            Risk yok, sadece fayda var!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center">
                Hemen Başla
                <ArrowRight className="ml-2 w-5 h-5" />
              </span>
            </button>
            
            <button
              onClick={handleDemoLogin}
              className="bg-transparent hover:bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-white transition-all duration-300"
            >
              <span className="flex items-center">
                Demo Hesapları
                <Play className="ml-2 w-5 h-5" />
              </span>
            </button>
          </div>

          <div className="mt-8 text-blue-100 text-sm">
            <p>✅ Ücretsiz deneme • ✅ Para iade garantisi • ✅ 7/24 destek</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Truck className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-2xl font-bold">YolNet</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Türkiye'nin en gelişmiş kargo platformu. Hızlı, güvenli ve uygun fiyatlı 
                taşımacılık çözümleri ile yanınızdayız.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Hızlı Linkler</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#benefits" className="text-gray-400 hover:text-white transition-colors">Faydalar</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Yorumlar</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Fiyatlar</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">İletişim</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-400">
                  <Phone className="w-4 h-4 mr-2" />
                  +90 212 555 0123
                </li>
                <li className="flex items-center text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  info@yolnet.com
                </li>
                <li className="flex items-center text-gray-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  İstanbul, Türkiye
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 YolNet. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage