import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Truck,
  Users,
  Building2,
  DollarSign,
  Clock,
  Shield,
  Star,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  Menu as MenuIcon,
  X as XIcon,
} from 'lucide-react';
import YolNextLogo from '../components/common/yolnextLogo';
import Footer from '../components/common/Footer';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('individual');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    try {
      setIsLoading(true);
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/register');
    } catch (error) {
      console.error('Kayıt sayfasına yönlendirme hatası:', error);
      // Error handling - kullanıcıya bilgi verilebilir
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/login');
    } catch (error) {
      console.error('Giriş sayfasına yönlendirme hatası:', error);
      // Error handling - kullanıcıya bilgi verilebilir
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeSelect = async (userType: string) => {
    try {
      setIsLoading(true);
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/register', { state: { userType } });
    } catch (error) {
      console.error('Kullanıcı tipi seçimi hatası:', error);
      // Error handling - kullanıcıya bilgi verilebilir
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    {
      id: 'individual',
      title: 'Bireysel Gönderici',
      icon: Users,
      color: 'blue',
      description: 'Kişisel eşyalarınızı güvenle gönderin',
      features: [
        'Gönderi oluşturma ve yönetimi',
        'Teklif alma ve değerlendirme',
        'Canlı takip ve bildirimler',
        'Sipariş geçmişi',
        'Mesajlaşma sistemi',
        'Profil yönetimi',
      ],
      advantages: [
        'Kolay gönderi oluşturma',
        'Çoklu teklif karşılaştırma',
        'Gerçek zamanlı takip',
        'Güvenli ödeme sistemi',
      ],
      stats: '25,000+ aktif kullanıcı',
      buttonText: 'Bireysel Hesap Oluştur',
    },
    {
      id: 'corporate',
      title: 'Kurumsal Gönderici',
      icon: Building2,
      color: 'green',
      description: 'İş süreçlerinizi optimize edin',
      features: [
        'Toplu gönderi yönetimi',
        'Ekip ve departman yönetimi',
        'Analitik raporlar ve dashboard',
        'Teklif yönetimi',
        'Mesajlaşma sistemi',
        'Takım yönetimi',
      ],
      advantages: [
        'Toplu gönderi indirimleri',
        'Detaylı analitik raporlar',
        'Ekip bazlı yönetim',
        'Gelişmiş dashboard',
      ],
      stats: '1,200+ şirket',
      buttonText: 'Kurumsal Hesap Oluştur',
    },
    {
      id: 'carrier',
      title: 'Nakliyeci',
      icon: Building2,
      color: 'purple',
      description: 'Taşımacılık şirketinizi büyütün',
      features: [
        'Açık gönderileri görüntüleme',
        'Teklif verme ve yönetimi',
        'Filo yönetimi ve takip',
        'Kazanç takibi',
        'Mesajlaşma sistemi',
        'Analitik raporlar',
      ],
      advantages: [
        'Sürekli iş fırsatları',
        'Filo yönetim sistemi',
        'Detaylı kazanç analizi',
        'Performans takibi',
      ],
      stats: '850+ şirket',
      buttonText: 'Nakliyeci Hesabı Oluştur',
    },
    {
      id: 'driver',
      title: 'Taşıyıcı',
      icon: Truck,
      color: 'orange',
      description: 'Esnek çalışma imkanları',
      features: [
        'Aktif iş yönetimi',
        'Kazanç takibi',
        'Konum güncelleme',
        'Tamamlanan işler',
        'Profil yönetimi',
        'Mesajlaşma sistemi',
      ],
      advantages: [
        'Esnek çalışma saatleri',
        'Haftalık kazanç takibi',
        'Konum bazlı iş önerileri',
        'Değerlendirme sistemi',
      ],
      stats: '3,500+ taşıyıcı',
      buttonText: 'Taşıyıcı Hesabı Oluştur',
    },
  ];

  const selectedUser =
    userTypes.find(user => user.id === selectedUserType) || userTypes[0];

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>
          YolNext - Türkiye'nin En Büyük Lojistik Platformu | 4 Kullanıcı Tipi
        </title>
        <meta
          name='description'
          content='YolNext ile lojistik ihtiyaçlarınızı karşılayın. Bireysel, kurumsal, nakliyeci ve taşıyıcılar için özel tasarlanmış platform. 81 ilde hizmet, rekabetçi fiyatlar, güvenli teslimat.'
        />
        <meta
          name='keywords'
          content='lojistik, kargo, taşımacılık, nakliye, gönderi, teslimat, bireysel, kurumsal, nakliyeci, taşıyıcı, YolNext'
        />
        <meta name='author' content='YolNext' />
        <meta
          property='og:title'
          content="YolNext - Türkiye'nin En Büyük Lojistik Platformu"
        />
        <meta
          property='og:description'
          content='4 farklı kullanıcı tipi için özel tasarlanmış, 81 ilde hizmet veren güvenilir lojistik platformu. Rekabetçi fiyatlarla hızlı teslimat.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://yolnext.com' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='YolNext - Lojistik Platformu' />
        <meta
          name='twitter:description'
          content='4 kullanıcı tipi, 81 il, rekabetçi fiyatlar. Lojistik ihtiyaçlarınız için tek platform.'
        />
        <link rel='canonical' href='https://yolnext.com' />
        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes count-up {
            from {
              opacity: 0;
              transform: scale(0.5);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
            opacity: 0;
          }
          
          .animate-count-up {
            animation: count-up 1s ease-out forwards;
            opacity: 0;
          }
          
          .delay-200 {
            animation-delay: 0.2s;
          }
          
          .delay-400 {
            animation-delay: 0.4s;
          }
          
          .delay-600 {
            animation-delay: 0.6s;
          }
          
          .delay-800 {
            animation-delay: 0.8s;
          }
          
          .delay-1000 {
            animation-delay: 1s;
          }
          
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
            }
            50% {
              box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
            }
          }
          
          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </Helmet>

      {/* 1. HEADER */}
      <header
        className='bg-white border-b border-gray-200 sticky top-0 z-50'
        role='banner'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <YolNextLogo variant='banner' className='text-gray-900 h-8' />
            <nav
              className='hidden md:flex space-x-8'
              role='navigation'
              aria-label='Ana menü'
            >
              <a
                href='#features'
                className='min-h-[44px] px-3 py-2 flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium'
                aria-label='Özellikler bölümüne git'
              >
                Özellikler
              </a>
              <a
                href='#panels'
                className='min-h-[44px] px-3 py-2 flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium'
                aria-label='Paneller bölümüne git'
              >
                Paneller
              </a>
              <a
                href='#contact'
                className='min-h-[44px] px-3 py-2 flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium'
                aria-label='İletişim bölümüne git'
              >
                İletişim
              </a>
            </nav>
            <div className='hidden md:flex items-center space-x-4'>
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className='min-h-[44px] px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                aria-label='Giriş yap'
              >
                {isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
              </button>
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className='min-h-[44px] bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300'
                aria-label='Ücretsiz hesap oluştur'
              >
                {isLoading ? 'Yükleniyor...' : 'Başla'}
              </button>
            </div>
            <div className='md:hidden'>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className='min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-900'
                aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <XIcon className='h-6 w-6' />
                ) : (
                  <MenuIcon className='h-6 w-6' />
                )}
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className='md:hidden border-t border-gray-200'>
            <div className='px-4 py-3 space-y-3'>
              <a
                href='#features'
                className='min-h-[44px] flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium px-2 py-2'
              >
                Özellikler
              </a>
              <a
                href='#panels'
                className='min-h-[44px] flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium px-2 py-2'
              >
                Paneller
              </a>
              <a
                href='#contact'
                className='min-h-[44px] flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium px-2 py-2'
              >
                İletişim
              </a>
              <div className='pt-3 border-t border-gray-200 space-y-2'>
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className='min-h-[44px] flex items-center text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed w-full text-left px-2 py-2'
                >
                  {isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
                </button>
                <button
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  className='min-h-[44px] bg-gradient-to-r from-slate-800 to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center px-3 py-2 rounded-lg w-full text-left'
                >
                  {isLoading ? 'Yükleniyor...' : 'Başla'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO BÖLÜMÜ - SADE VE PROFESYONEL */}
      <section className='py-24 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            {/* Sol Taraf - İçerik */}
            <div>
              <h1 className='text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight'>
                <span className='bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent'>
                  %40 Tasarruf
                </span>
                <br />
                ile Lojistikte
                <br />
                <span className='text-gray-900'>Yeni Çağ</span>
              </h1>

              <p className='text-xl text-gray-600 mb-8 max-w-2xl'>
                4 farklı kullanıcı tipi için özel tasarlanmış, 81 ilde hizmet
                veren güvenilir lojistik platformu
              </p>

              {/* Ücretsiz Kullanım Vurgusu */}
              <div className='bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-12'>
                <div className='flex items-center justify-center space-x-4'>
                  <div className='bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg'>
                    🎉 TAMAMEN ÜCRETSİZ
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-700'>
                      %0 Üyelik Ücreti
                    </div>
                    <div className='text-green-600'>
                      Sadece nakliyeci %1 komisyon öder
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex flex-col sm:flex-row gap-6 mb-16'>
                <button
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg'
                >
                  {isLoading ? '⏳ Yükleniyor...' : '🚀 Ücretsiz Başla'}
                </button>
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className='border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:text-gray-900 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:bg-gray-50'
                >
                  {isLoading ? '⏳ Yükleniyor...' : '🔑 Giriş Yap'}
                </button>
              </div>

              {/* Güven Göstergeleri */}
              <div className='flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 mb-8'>
                <div className='flex items-center gap-2'>
                  <Shield className='w-4 h-4 text-green-500' />
                  <span>SSL Güvenli</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  <span>30,550+ Kullanıcı</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Star className='w-4 h-4 text-yellow-500' />
                  <span>4.9/5 Puan</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Globe className='w-4 h-4 text-blue-500' />
                  <span>81 İl</span>
                </div>
              </div>

              {/* İstatistikler */}
              <div className='grid grid-cols-2 gap-8'>
                <div className='text-center'>
                  <div className='text-4xl font-bold text-gray-900 mb-2'>
                    30,550+
                  </div>
                  <div className='text-gray-600'>Kullanıcı</div>
                </div>
                <div className='text-center'>
                  <div className='text-4xl font-bold text-gray-900 mb-2'>
                    500,000+
                  </div>
                  <div className='text-gray-600'>Teslimat</div>
                </div>
                <div className='text-center'>
                  <div className='text-4xl font-bold text-gray-900 mb-2'>
                    %99.9
                  </div>
                  <div className='text-gray-600'>Memnuniyet</div>
                </div>
                <div className='text-center'>
                  <div className='text-4xl font-bold text-gray-900 mb-2'>
                    81
                  </div>
                  <div className='text-gray-600'>İl</div>
                </div>
              </div>
            </div>

            {/* Sağ Taraf - Banner Görseli */}
            <div className='relative animate-float'>
              <div
                className='w-full h-96 lg:h-[600px] rounded-2xl bg-cover bg-center shadow-2xl'
                style={{
                  backgroundImage: `url('/img/yolnext_web_sitesi_i_in_ana_sayfa_hero_banner__Bir_reklam_ajans_n_n_haz_rlad____gibi__her_detay___zen.png')`,
                }}
              >
                <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl'></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. YOLNEXT NEDİR? */}
      <section className='py-20 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16 animate-fade-in-up'>
            <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              <span className='bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent'>
                YolNext
              </span>{' '}
              Nedir?
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto'>
              Türkiye'nin ilk çok kullanıcılı lojistik platformu. 4 farklı
              kullanıcı tipini bir araya getirerek rekabetçi fiyatlarla hızlı ve
              güvenilir taşımacılık hizmeti sunan sistem.
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12'>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-200'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <Truck className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4'>
                Çoklu Kullanıcı Sistemi
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                Bireysel, kurumsal, nakliyeci ve şoförleri tek platformda
                buluşturan sistem
              </p>
            </div>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-400'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <Globe className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4'>
                81 İl Kapsamı
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                Türkiye genelinde kesintisiz hizmet ağı ve geniş taşıyıcı ağı
              </p>
            </div>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-600 sm:col-span-2 lg:col-span-1'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <Shield className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4'>
                Güvenli Platform
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                SSL şifreleme, güvenli ödeme sistemi ve sigortalı taşımacılık
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KULLANICI TİPLERİ - NAVİGASYON TAB'LARI */}
      <section
        id='panels'
        className='py-24 bg-gradient-to-br from-gray-50 to-blue-50'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16 animate-fade-in-up'>
            <h2 className='text-5xl md:text-6xl font-bold text-gray-900 mb-8'>
              Platformumuzu{' '}
              <span className='bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent'>
                Kimler
              </span>{' '}
              Kullanıyor?
            </h2>
            <p className='text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Her sektörden binlerce kullanıcı YolNext ile lojistik
              ihtiyaçlarını karşılıyor. Size uygun paneli seçin ve detayları
              görün.
            </p>
          </div>

          {/* Navigasyon Tab'ları */}
          <div
            className='flex flex-wrap justify-center gap-4 mb-12'
            role='tablist'
            aria-label='Kullanıcı tipleri seçimi'
          >
            {userTypes.map((userType, index) => (
              <button
                key={userType.id}
                onClick={() => setSelectedUserType(userType.id)}
                className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-up ${
                  selectedUserType === userType.id
                    ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg animate-pulse-glow'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                role='tab'
                aria-selected={selectedUserType === userType.id}
                aria-controls={`panel-${userType.id}`}
                aria-label={`${userType.title} panelini seç`}
              >
                <userType.icon className='w-6 h-6' aria-hidden='true' />
                <span>{userType.title}</span>
              </button>
            ))}
          </div>

          {/* Seçilen Panel Detayları */}
          <div
            className='bg-white rounded-3xl shadow-2xl overflow-hidden'
            role='tabpanel'
            id={`panel-${selectedUserType}`}
            aria-labelledby={`tab-${selectedUserType}`}
          >
            <div className='grid lg:grid-cols-2 gap-0'>
              {/* Sol Taraf - Genel Bilgiler */}
              <div className='p-12 bg-gradient-to-br from-gray-50 to-white'>
                <div className='flex items-center space-x-4 mb-8'>
                  <div className='w-16 h-16 bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center'>
                    <selectedUser.icon className='w-8 h-8 text-white' />
                  </div>
                  <div>
                    <h3 className='text-3xl font-bold text-gray-900'>
                      {selectedUser.title}
                    </h3>
                    <p className='text-gray-600 text-lg'>
                      {selectedUser.description}
                    </p>
                  </div>
                </div>

                <div className='mb-8'>
                  <h4 className='text-xl font-bold text-gray-900 mb-4'>
                    Özellikler
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {selectedUser.features.map((feature, index) => (
                      <div key={index} className='flex items-center'>
                        <CheckCircle className='w-5 h-5 text-green-500 mr-3 flex-shrink-0' />
                        <span className='text-gray-700'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='mb-8'>
                  <h4 className='text-xl font-bold text-gray-900 mb-4'>
                    Avantajlar
                  </h4>
                  <div className='space-y-3'>
                    {selectedUser.advantages.map((advantage, index) => (
                      <div key={index} className='flex items-start'>
                        <Star className='w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0' />
                        <span className='text-gray-700'>{advantage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-500'>
                    <span className='font-semibold text-gray-900'>
                      {selectedUser.stats}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUserTypeSelect(selectedUserType)}
                    disabled={isLoading}
                    className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg'
                  >
                    {isLoading ? '⏳ Yükleniyor...' : selectedUser.buttonText}
                  </button>
                </div>
              </div>

              {/* Sağ Taraf - Görsel/İstatistikler */}
              <div className='p-12 bg-gradient-to-br from-slate-800 to-blue-900 text-white'>
                <h4 className='text-2xl font-bold mb-8'>
                  Neden {selectedUser.title}?
                </h4>

                <div className='space-y-6'>
                  <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6'>
                    <h5 className='text-lg font-semibold mb-3'>
                      Kullanıcı Memnuniyeti
                    </h5>
                    <div className='flex items-center space-x-4'>
                      <div className='text-4xl font-bold'>%99.9</div>
                      <div className='text-white/80'>Memnuniyet oranı</div>
                    </div>
                    <div className='mt-2 text-white/70 text-sm'>
                      ⭐⭐⭐⭐⭐ 4.9/5 yıldız (2,500+ yorum)
                    </div>
                  </div>

                  <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6'>
                    <h5 className='text-lg font-semibold mb-3'>
                      Hizmet Kapsamı
                    </h5>
                    <div className='flex items-center space-x-4'>
                      <div className='text-4xl font-bold'>81</div>
                      <div className='text-white/80'>İl kapsamı</div>
                    </div>
                  </div>

                  <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6'>
                    <h5 className='text-lg font-semibold mb-3'>
                      Ücretsiz Kullanım
                    </h5>
                    <div className='flex items-center space-x-4'>
                      <div className='text-4xl font-bold'>%0</div>
                      <div className='text-white/80'>Üyelik ücreti</div>
                    </div>
                    <div className='mt-2 text-white/70 text-sm'>
                      Sadece nakliyeci %1 komisyon öder
                    </div>
                  </div>
                </div>

                <div className='mt-8 p-6 bg-white/5 rounded-2xl'>
                  <h5 className='text-lg font-semibold mb-3'>
                    Hızlı Başlangıç
                  </h5>
                  <div className='space-y-2 text-sm text-white/80'>
                    <div className='flex items-center'>
                      <span className='w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                        1
                      </span>
                      Hesap oluşturun
                    </div>
                    <div className='flex items-center'>
                      <span className='w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                        2
                      </span>
                      Profilinizi tamamlayın
                    </div>
                    <div className='flex items-center'>
                      <span className='w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mr-3'>
                        3
                      </span>
                      Hemen kullanmaya başlayın
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ANA FAYDALAR */}
      <section id='features' className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16 animate-fade-in-up'>
            <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              Neden{' '}
              <span className='bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent'>
                YolNext
              </span>
              ?
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto'>
              Her kullanıcı tipinin ihtiyacına özel tasarlanmış güçlü özellikler
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12'>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-200'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <DollarSign className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <h3 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-4'>
                Tamamen Ücretsiz
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                %0 üyelik ücreti, sadece nakliyeci %1 komisyon öder
              </p>
            </div>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-400'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <Clock className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <h3 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-4'>
                Hızlı Teslimat
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                Geniş taşıyıcı ağı ile hızlı ve güvenilir teslimat
              </p>
            </div>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-600'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <Globe className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <h3 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-4'>
                81 İl Kapsamı
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                Türkiye genelinde kesintisiz hizmet ağı
              </p>
            </div>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-800 sm:col-span-2 lg:col-span-1'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <Star className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <h3 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-4'>
                Yorum & Puan Sistemi
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                Güvenilir değerlendirme sistemi ile kaliteli hizmet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NASIL ÇALIŞIR? */}
      <section className='py-20 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16 animate-fade-in-up'>
            <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              Nasıl{' '}
              <span className='bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent'>
                Çalışır
              </span>
              ?
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto'>
              Sadece 3 adımda gönderinizi oluşturun ve teslimat alın
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12'>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-200'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <span className='text-2xl sm:text-3xl font-bold text-white'>
                  1
                </span>
              </div>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4'>
                Gönderi Oluştur
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                3 tıklama ile gönderi detaylarınızı girin
              </p>
            </div>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-400'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <span className='text-2xl sm:text-3xl font-bold text-white'>
                  2
                </span>
              </div>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4'>
                Teklif Al
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                Otomatik fiyat teklifleri alın ve seçin
              </p>
            </div>
            <div className='text-center group hover:scale-105 transition-all duration-300 animate-fade-in-up delay-600 sm:col-span-2 lg:col-span-1'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300'>
                <span className='text-2xl sm:text-3xl font-bold text-white'>
                  3
                </span>
              </div>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4'>
                Teslimat
              </h3>
              <p className='text-gray-600 text-base sm:text-lg'>
                2 günde kapınızda teslimat alın
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. KARŞILAŞTIRMA TABLOSU */}
      <section className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16 animate-fade-in-up'>
            <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
              Geleneksel Kargo vs{' '}
              <span className='bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent'>
                YolNext
              </span>
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto'>
              Neden YolNext'i tercih etmelisiniz? Karşılaştırın ve farkı görün
            </p>
          </div>

          <div className='bg-white rounded-3xl shadow-2xl overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900'>
                      Özellik
                    </th>
                    <th className='px-6 py-4 text-center text-sm font-semibold text-gray-500'>
                      Geleneksel Kargo
                    </th>
                    <th className='px-6 py-4 text-center text-sm font-semibold text-slate-800'>
                      YolNext
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  <tr>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Üyelik Ücreti
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-red-600 font-semibold'>
                      ₺50-200/ay
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-green-600 font-semibold'>
                      ₺0
                    </td>
                  </tr>
                  <tr className='bg-gray-50'>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Gönderi Ücreti
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-red-600 font-semibold'>
                      ₺25-50
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-green-600 font-semibold'>
                      ₺0
                    </td>
                  </tr>
                  <tr>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Teslimat Süresi
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-gray-600'>
                      3-7 gün
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-green-600 font-semibold'>
                      2 gün
                    </td>
                  </tr>
                  <tr className='bg-gray-50'>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Canlı Takip
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-red-600'>
                      ❌ Yok
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-green-600'>
                      ✅ Var
                    </td>
                  </tr>
                  <tr>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Teklif Karşılaştırma
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-red-600'>
                      ❌ Yok
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-green-600'>
                      ✅ Var
                    </td>
                  </tr>
                  <tr className='bg-gray-50'>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Yorum Sistemi
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-red-600'>
                      ❌ Yok
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-green-600'>
                      ✅ Var
                    </td>
                  </tr>
                  <tr>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      Müşteri Desteği
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-gray-600'>
                      Sınırlı
                    </td>
                    <td className='px-6 py-4 text-center text-sm text-green-600 font-semibold'>
                      7/24
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA BÖLÜMÜ */}
      <section className='py-20 bg-gradient-to-r from-slate-800 via-slate-900 to-blue-900'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-8'>
            Hemen <span className='text-blue-400'>Başlayın</span>
          </h2>
          <p className='text-lg sm:text-xl text-white/90 mb-8 max-w-3xl mx-auto'>
            Kayıt olun, gönderinizi oluşturun ve en uygun teklifi alın. Hiçbir
            ücret yok!
          </p>

          {/* Ücretsiz Kullanım Vurgusu */}
          <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-12 max-w-4xl mx-auto'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-white mb-2'>
                🎉 TAMAMEN ÜCRETSİZ KULLANIM
              </div>
              <div className='text-white/90 text-lg'>
                <span className='font-bold'>%0 üyelik ücreti</span> •
                <span className='font-bold'>%0 gönderi ücreti</span> •
                <span className='font-bold'>%0 gizli ücret</span>
              </div>
              <div className='text-white/80 text-sm mt-2'>
                Sadece nakliyeci %1 komisyon öder, diğer her şey ücretsiz!
              </div>
            </div>
          </div>
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className='bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-bold text-xl sm:text-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl mb-8'
          >
            {isLoading ? '⏳ Yükleniyor...' : '🚀 Ücretsiz Başla'}
          </button>
          <div className='flex flex-wrap justify-center items-center gap-6 text-blue-200 text-sm'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5' />
              <span>Kayıt ücretsiz</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5' />
              <span>Gizlilik korunur</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5' />
              <span>İstediğinizde çıkın</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <Footer />
    </div>
  );
};

export default LandingPage;
