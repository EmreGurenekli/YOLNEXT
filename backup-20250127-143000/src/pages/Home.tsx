import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  Truck, 
  Package, 
  Users, 
  Shield, 
  Star, 
  ArrowRight, 
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  MessageCircle,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react'

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Helmet>
        <title>YolNet Kargo Platform - Güvenilir Taşımacılık</title>
        <meta name="description" content="Gönderici, nakliyeci ve taşıyıcıları bir araya getiren modern kargo platformu. Güvenli, hızlı ve ekonomik çözümler." />
        <meta property="og:title" content="YolNet Kargo Platform - Güvenilir Taşımacılık" />
        <meta property="og:description" content="Gönderici, nakliyeci ve taşıyıcıları bir araya getiren modern kargo platformu. Güvenli, hızlı ve ekonomik çözümler." />
      </Helmet>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200/50">
        <div className="container-custom">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">YolNet Kargo</h1>
                <p className="text-sm text-gray-600 font-medium">Güvenilir Taşımacılık Platformu</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                Giriş Yap
              </Link>
              <Link 
                to="/register" 
                className="btn-primary flex items-center space-x-2"
              >
                <span>Kayıt Ol</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container-custom">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Kargo İşlerinizi
              <span className="block gradient-text animate-fade-in-up">
                Kolaylaştırın
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Gönderici, nakliyeci ve taşıyıcıları bir araya getiren modern platform. 
              <span className="font-semibold text-gray-800"> Güvenli, hızlı ve ekonomik</span> kargo çözümleri.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                to="/register" 
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 group"
              >
                <span>Hemen Başla</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <button className="btn-secondary text-lg px-8 py-4 flex items-center justify-center space-x-2 group">
                <span>Nasıl Çalışır?</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">10,000+</div>
                <div className="text-gray-600 font-medium">Aktif Kullanıcı</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">50,000+</div>
                <div className="text-gray-600 font-medium">Başarılı Gönderi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-gray-600 font-medium">Güvenilir Taşıyıcı</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">%99</div>
                <div className="text-gray-600 font-medium">Müşteri Memnuniyeti</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-200 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-300 rounded-full opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-float" style={{animationDelay: '3s'}}></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Neden YolNet Kargo?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern teknoloji ile kargo süreçlerinizi optimize edin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Kolay Gönderi</h3>
              <p className="text-gray-600 leading-relaxed">Birkaç tıkla gönderinizi oluşturun ve gerçek zamanlı takip edin</p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Güvenli Ödeme</h3>
              <p className="text-gray-600 leading-relaxed">Tüm ödemeleriniz güvenli şekilde korunur ve takip edilir</p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Geniş Ağ</h3>
              <p className="text-gray-600 leading-relaxed">Binlerce güvenilir taşıyıcı ile çalışın ve fiyat karşılaştırın</p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Kaliteli Hizmet</h3>
              <p className="text-gray-600 leading-relaxed">Değerlendirme sistemi ile en iyi hizmeti garanti edin</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-xl text-gray-600">
              3 basit adımda kargo sürecinizi başlatın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-bold text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Gönderi Oluştur</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Gönderi detaylarınızı girin, alıcı bilgilerini ekleyin ve fiyat belirleyin. 
                Sadece birkaç dakika sürer!
              </p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-bold text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Teklif Al</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Taşıyıcılar size teklifler gönderir, en uygun olanı seçin. 
                Fiyat ve süre karşılaştırması yapın.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-bold text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Takip Et</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Gönderinizi gerçek zamanlı olarak takip edin ve teslim alın. 
                Her adımda bilgilendirilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Kimler Kullanabilir?
            </h2>
            <p className="text-xl text-gray-600">
              Herkes için uygun çözümler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Individual Sender */}
            <Link to="/individual/dashboard" className="group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-blue-200">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Bireysel Gönderici</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Kişisel gönderilerinizi kolayca oluşturun ve takip edin. 
                  En uygun fiyatları bulun.
                </p>
                <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                  Başla
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>

            {/* Corporate Sender */}
            <Link to="/corporate/dashboard" className="group">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-green-200">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Kurumsal Gönderici</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Şirketinizin kargo ihtiyaçlarını profesyonelce yönetin. 
                  Toplu gönderi indirimleri.
                </p>
                <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700">
                  Başla
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>

            {/* Nakliyeci */}
            <Link to="/nakliyeci/dashboard" className="group">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-purple-200">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <Truck className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Nakliyeci</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Gönderileri yayınlayın ve taşıyıcılara atayın. 
                  Lojistik süreçlerinizi yönetin.
                </p>
                <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
                  Başla
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>

            {/* Taşıyıcı */}
            <Link to="/tasiyici/dashboard" className="group">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-orange-200">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <Truck className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Taşıyıcı</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  İşlere başvurun ve kargo taşıyarak kazanç elde edin. 
                  Esnek çalışma saatleri.
                </p>
                <div className="flex items-center text-orange-600 font-semibold group-hover:text-orange-700">
                  Başla
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="container-custom text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Kargo süreçlerinizi modernleştirin ve zamandan tasarruf edin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <span>Ücretsiz Kayıt Ol</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Giriş Yap</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">YolNet Kargo</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Güvenilir kargo taşımacılığı platformu. Gönderici, nakliyeci ve taşıyıcıları bir araya getiren modern çözümler.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                  <Facebook className="w-5 h-5 text-gray-400 hover:text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                  <Twitter className="w-5 h-5 text-gray-400 hover:text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                  <Instagram className="w-5 h-5 text-gray-400 hover:text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
                  <Linkedin className="w-5 h-5 text-gray-400 hover:text-white" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Hizmetler</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Bireysel Gönderi</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Kurumsal Çözümler</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Nakliye Hizmetleri</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Taşıyıcı Ağı</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">API Entegrasyonu</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Destek</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Yardım Merkezi</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">İletişim</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">SSS</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Geri Bildirim</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Teknik Destek</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Yasal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Kullanım Şartları</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Gizlilik Politikası</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Çerez Politikası</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">KVKK</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Sorumluluk Reddi</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-center md:text-left">
                &copy; 2024 YolNet Kargo. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>+90 212 555 0123</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>info@yolnetkargo.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home