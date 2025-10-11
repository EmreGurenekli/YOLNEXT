import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Truck, 
  ArrowRight, 
  Users,
  Building2,
  CheckCircle,
  Package,
  Star,
  Shield,
  BarChart3,
  Globe,
  Phone,
  Mail,
  Menu,
  X,
  TrendingUp,
  Award,
  DollarSign,
  Target,
  Activity,
  FileText,
  Settings,
  MessageSquare,
  Bell,
  Calendar,
  Weight,
  Ruler,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Zap,
  Heart,
  Sparkles,
  Crown,
  Rocket,
  Lightbulb,
  Briefcase,
  PieChart,
  RefreshCw,
  UserCheck,
  CreditCard,
  MapPin,
  Clock,
  UserPlus,
  Plus,
  User
} from 'lucide-react'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { demoLogin, getPanelRoute } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleGetStarted = () => {
    navigate('/register')
  }

  const handleDemoLogin = () => {
    navigate('/login')
  }

  const handleDemoPanelLogin = async (userType: string) => {
    try {
      console.log('Demo panel login started for:', userType)
      const result = await demoLogin(userType)
      console.log('Demo login result:', result)
      if (result.success) {
        const panelRoute = getPanelRoute(userType)
        console.log('Panel route:', panelRoute)
        navigate(panelRoute)
      } else {
        console.error('Demo login failed')
        navigate('/login')
      }
    } catch (error) {
      console.error('Demo login error:', error)
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 20 ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">YolNet</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Özellikler</a>
              <a href="#solutions" className="text-gray-700 hover:text-blue-600 transition-colors">Çözümler</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">Nasıl Çalışır</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">Hakkımızda</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">İletişim</a>
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleDemoLogin}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Giriş Yap
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                Kayıt Ol
              </button>
            </div>

            {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
        </div>

          {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Özellikler</a>
                <a href="#solutions" className="text-gray-700 hover:text-blue-600 transition-colors">Çözümler</a>
                <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">Nasıl Çalışır</a>
                <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">Hakkımızda</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">İletişim</a>
                <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleDemoLogin}
                    className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors mb-2"
                >
                    Giriş Yap
                </button>
                <button
                  onClick={handleGetStarted}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                    Kayıt Ol
                </button>
              </div>
              </nav>
            </div>
          )}
          </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-32 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
              <Award className="w-4 h-4 mr-2" />
              Türkiye'nin Lider Lojistik Platformu
            </div>

            {/* Ana Başlık */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Lojistik İhtiyaçlarınız İçin
              <br />
              <span className="text-blue-600">Kapsamlı Çözümler</span>
            </h1>
            
            {/* Alt Başlık */}
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Bireysel kullanıcılardan kurumsal şirketlere kadar herkes için
              <br />
              <span className="text-gray-900 font-semibold">profesyonel lojistik hizmetleri</span>
            </p>

            {/* CTA Butonları */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Hemen Başlayın
              </button>
              <button
                onClick={handleDemoLogin}
                className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 transition-all duration-300"
              >
                Demo Giriş
              </button>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-gray-600 font-medium">Müşteri</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
                <div className="text-gray-600 font-medium">Gönderi</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">99%</div>
                <div className="text-gray-600 font-medium">Memnuniyet</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-gray-600 font-medium">Destek</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hoşgeldin Kartı ve Hızlı İşlemler - Bireysel Panel Tasarımı */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Hoşgeldin Kartı */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-12 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Hoşgeldiniz! 👋
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  Gönderilerinizi takip edin ve yeni gönderi oluşturun
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleGetStarted}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Yeni Gönderi Oluştur
                  </button>
                  <button
                    onClick={handleDemoLogin}
                    className="bg-white hover:bg-gray-50 text-blue-600 px-6 py-3 rounded-lg font-semibold border-2 border-blue-600 transition-all duration-300"
                  >
                    Demo Giriş
                  </button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Hızlı İşlemler - PROFESYONEL TASARIM */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Hızlı İşlemler</h2>
                  <p className="text-slate-600">Profesyonel hizmetlerimize hızlı erişim</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Link to="/individual/create-shipment">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Yeni Gönderi</h3>
                      <p className="text-sm text-slate-600">Profesyonel nakliye hizmeti</p>
                      <div className="mt-3 w-8 h-1 bg-blue-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>

                <Link to="/individual/shipments">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Gönderilerim</h3>
                      <p className="text-sm text-slate-600">Gönderileri görüntüle ve yönet</p>
                      <div className="mt-3 w-8 h-1 bg-emerald-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>

                <Link to="/individual/live-tracking">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Canlı Takip</h3>
                      <p className="text-sm text-slate-600">Gönderileri gerçek zamanlı takip et</p>
                      <div className="mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>

                <Link to="/individual/messages">
                  <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Mesajlar</h3>
                      <p className="text-sm text-slate-600">Müşteri hizmetleri ile iletişim</p>
                      <div className="mt-3 w-8 h-1 bg-amber-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">25</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">+2 bu ay</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-700 font-semibold text-sm">Toplam Gönderi</div>
              <div className="mt-1 text-xs text-slate-500">Aktif gönderi sayısı</div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">18</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">%85 başarı</span>
                  </div>
          </div>
        </div>
              <div className="text-slate-700 font-semibold text-sm">Teslim Edilen</div>
              <div className="mt-1 text-xs text-slate-500">Başarıyla teslim edilen</div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">5</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">İşlem bekliyor</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-700 font-semibold text-sm">Bekleyen</div>
              <div className="mt-1 text-xs text-slate-500">İşlem bekleyen gönderiler</div>
          </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">₺2,450</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-semibold">Bu ay: ₺650</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-700 font-semibold text-sm">Toplam Harcama</div>
              <div className="mt-1 text-xs text-slate-500">Toplam harcama tutarı</div>
            </div>
          </div>
        </div>
      </section>

      {/* Çözümlerimiz Bölümü */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Çözümlerimiz</h2>
            <p className="text-lg text-gray-600">Herkes için uygun çözümler</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Bireysel Kullanıcı */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Bireysel</h3>
                <p className="text-gray-600 mb-4">Kişisel gönderileriniz için</p>
                <button
                  onClick={() => handleDemoPanelLogin('individual')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Demo Panel
                </button>
              </div>
          </div>

            {/* Kurumsal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Kurumsal</h3>
                <p className="text-gray-600 mb-4">Şirket gönderileriniz için</p>
                <button
                  onClick={() => handleDemoPanelLogin('corporate')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Demo Panel
                </button>
                    </div>
                  </div>

            {/* Nakliyeci */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nakliyeci</h3>
                <p className="text-gray-600 mb-4">Lojistik firmaları için</p>
                <button
                  onClick={() => handleDemoPanelLogin('nakliyeci')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Demo Panel
                </button>
              </div>
            </div>

            {/* Taşıyıcı */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Taşıyıcı</h3>
                <p className="text-gray-600 mb-4">Araç sahipleri için</p>
                <button
                  onClick={() => handleDemoPanelLogin('tasiyici')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Demo Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">YolNet</h3>
              <p className="text-gray-400">Türkiye'nin lider lojistik platformu</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Ana Sayfa</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SSS</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">İletişim</h4>
              <div className="space-y-2 text-gray-400">
                <p>📞 +90 212 555 0123</p>
                <p>✉️ info@yolnet.com</p>
                <p>📍 İstanbul, Türkiye</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 YolNet. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage