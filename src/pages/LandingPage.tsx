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
  ArrowRight,
  Menu as MenuIcon,
  X as XIcon,
  BarChart2,
  Layers,
  MessageSquare,
  MapPin,
  Package,
  TrendingUp,
  Zap,
  Target,
  FileText,
  CreditCard,
  Bell,
  Map,
  Route,
  Award,
  Lock,
  Eye,
  Smartphone,
  Database,
  Server,
  ShoppingCart,
  Phone,
  Mail,
  ThumbsUp,
  TrendingDown,
  Percent,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import YolNextLogo from '../components/common/yolnextLogo';
import Footer from '../components/common/Footer';

const personaPanels = [
    {
      id: 'individual',
      title: 'Bireysel Gönderici',
      icon: Users,
    subtitle: 'Ev, ofis, özel gönderiler',
    promise: "Önemli ölçüde tasarruf, anlık teklif kıyaslama",
      features: [
      'Hızlı gönderi formu',
      'Tek ekranda teklif kıyaslama',
      'Canlı konum & teslimat akışı',
      'Mesajlaşma sistemi',
      'Cüzdan yönetimi',
      'Geçmiş siparişler',
      'Değerlendirme sistemi',
    ],
    stats: 'Binlerce aktif kullanıcı',
    cta: 'Bireysel Paneli Aç',
    pages: ['Dashboard', 'Gönderi Oluştur', 'Gönderilerim', 'Teklifler', 'Canlı Takip', 'Mesajlar', 'Cüzdan'],
    },
    {
      id: 'corporate',
      title: 'Kurumsal Gönderici',
      icon: Building2,
    subtitle: 'Tedarik zinciri, üretim, e-ticaret',
    promise: 'Merkezileştirilmiş operasyon ve verimli yönetim',
      features: [
      'Toplu gönderi sihirbazı',
      'Departman & yetki yönetimi',
      'Gerçek zamanlı KPI dashboard',
      'Analitik ve raporlama',
      'Ekip yönetimi',
      'İndirim yönetimi',
      'Müşteri yönetimi',
    ],
    stats: 'Yüzlerce şirket',
    cta: 'Kurumsal Demo Planla',
    pages: ['Dashboard', 'Gönderi Oluştur', 'Gönderilerim', 'Analitik', 'Raporlar', 'Ekip', 'Nakliyeciler', 'Ayarlar'],
    },
    {
      id: 'carrier',
      title: 'Nakliyeci',
    icon: Layers,
    subtitle: 'Filo sahipleri ve lojistik firmaları',
    promise: 'Sürekli iş akışı + %1 komisyon',
      features: [
      'Yük pazarı & anlık filtre',
      'Rota planlama aracı',
      'Filo & sürücü puanlaması',
      'Cüzdan + nakit akış yönetimi',
      'İlan yönetimi',
      'Taşıyıcı yönetimi',
      'Aktif yükler',
      'Tamamlanan yükler',
    ],
    stats: 'Yüzlerce nakliyeci',
    cta: 'Nakliyeci Hesabı Aç',
    pages: ['Dashboard', 'Yük Pazarı', 'Aktif Yükler', 'Tamamlanan Yükler', 'İlanlarım', 'Taşıyıcılarım', 'Cüzdan'],
    },
    {
      id: 'driver',
      title: 'Taşıyıcı',
      icon: Truck,
    subtitle: 'Sürücüler, sözleşmeli ekipler',
    promise: 'İş garantisi + haftalık ödeme',
      features: [
        'Konum bazlı iş önerileri',
      'Anında mesajlaşma',
      'Kazanç takibi & puan sistemi',
      'Destek hattı',
      'İş pazarı',
      'Aktif işler',
      'Tamamlanan işler',
      'Tekliflerim',
    ],
    stats: 'Binlerce taşıyıcı',
    cta: 'Taşıyıcı Paneline Katıl',
    pages: ['Dashboard', 'İş Pazarı', 'Aktif İşler', 'Tamamlanan İşler', 'Tekliflerim', 'Mesajlar', 'Ayarlar'],
  },
];

const platformFeatures = [
  {
    icon: MapPin,
    title: 'Konum Takibi',
    description: 'Gönderilerinizin konum bilgilerini takip edin. Her konum güncellemesi anında panelinizde görünür.',
  },
  {
    icon: MessageSquare,
    title: 'Anlık Mesajlaşma',
    description: 'Gönderici, nakliyeci ve taşıyıcı arasında panel içi mesajlaşma. Tüm iletişim kayıt altında.',
  },
  {
    icon: CreditCard,
    title: 'Cüzdan Sistemi',
    description: 'Güvenli ödeme altyapısı. Ödemeler otomatik dağıtılır, cüzdanınızdan kolayca para çekebilirsiniz.',
  },
  {
    icon: Route,
    title: 'Rota Planlama',
    description: 'Nakliyeciler için rota planlama aracı. Gönderilerinizi organize edin ve verimli rotalar oluşturun.',
  },
  {
    icon: BarChart2,
    title: 'Detaylı Analitik',
    description: 'Kurumsal göndericiler için KPI dashboard, departman bazlı raporlama ve Excel/PDF export.',
  },
  {
    icon: Bell,
    title: 'Gerçek Zamanlı Bildirimler',
    description: 'WebSocket ile anlık bildirimler. Teklif, teslimat, ödeme ve durum güncellemeleri anında.',
  },
  {
    icon: Shield,
    title: 'Güvenli Altyapı',
    description: 'KVKK uyumlu, SSL şifreli güvenlik. Tüm veriler Türkiye\'de saklanır.',
  },
  {
    icon: Smartphone,
    title: 'Mobil Uyumlu',
    description: 'Tüm paneller mobil cihazlarda mükemmel çalışır. Responsive tasarım ile her yerden erişim.',
  },
];

const workflowSteps = [
  {
    step: 1,
    title: 'Gönderi Oluştur',
    description: 'Bireysel veya kurumsal panelden 3 adımlı form ile gönderi oluşturun. Kategori, adres, tarih ve özel gereksinimler.',
    icon: Package,
    color: 'blue',
  },
  {
    step: 2,
    title: 'Teklif Al',
    description: 'Nakliyeciler yük pazarından gönderinizi görür, fiyat ve mesaj ile teklif verir. Tek ekranda karşılaştırın.',
    icon: FileText,
    color: 'green',
  },
  {
    step: 3,
    title: 'Teklif Kabul Et',
    description: 'En uygun teklifi seçin, güvenli ödeme yapın. Nakliyeci gönderiyi alır ve taşıyıcıya atar.',
    icon: CheckCircle,
    color: 'purple',
  },
  {
    step: 4,
    title: 'Canlı Takip',
    description: 'Taşıyıcı konum güncellemeleri yapar. Konum bilgileri ile takip, bildirimler ve mesajlaşma.',
    icon: Map,
    color: 'orange',
  },
  {
    step: 5,
    title: 'Teslimat',
    description: 'Teslimat tamamlanır, onay verilir, değerlendirme yapılır. Ödemeler otomatik dağıtılır.',
    icon: Award,
    color: 'emerald',
  },
];

const categories = [
  { name: 'Ev Taşınması', icon: Building2, description: 'Oda sayısı, bina tipi, kat bilgileri ile detaylı taşıma' },
  { name: 'Soğuk Zincir', icon: Package, description: 'Soğuk zincir gerektiren ürünler için taşıma' },
  { name: 'Tehlikeli Madde', icon: Shield, description: 'Tehlikeli madde kategorisinde taşıma' },
  { name: 'E-Ticaret', icon: ShoppingCart, description: 'Toplu dağıtım, rota optimizasyonu, hızlı teslimat' },
  { name: 'Kurumsal Lojistik', icon: Truck, description: 'Tedarik zinciri, üretim, depo yönetimi' },
  { name: 'Özel Yük', icon: Layers, description: 'Ağır yük, özel boyut, özel gereksinimler' },
];

const advantages = [
  {
    icon: DollarSign,
    title: 'Tamamen Ücretsiz',
    description: 'Göndericiler için üyelik ve gönderi oluşturma tamamen ücretsiz. Sadece nakliyeciler kazançları üzerinden %1 sabit komisyon öder.',
    stat: '₺0',
  },
  {
    icon: Clock,
    title: 'Hızlı Operasyon',
    description: 'Hızlı teklif alma süreci. Hızlı teslimat seçenekleri ile ihtiyacınıza uygun zaman diliminde teslimat.',
    stat: 'Hızlı',
  },
  {
    icon: TrendingUp,
    title: 'Önemli Tasarruf',
    description: 'Geleneksel kargo firmalarına göre önemli ölçüde tasarruf. Şeffaf fiyatlandırma, rekabetçi teklifler.',
    stat: 'Tasarruf',
  },
  {
    icon: Eye,
    title: 'Tam Şeffaflık',
    description: 'Her adımda bilgi. Puan sistemi, yorumlar, belgeler, konum takibi. Hiçbir şey gizli değil.',
    stat: 'Tam',
  },
];

const caseStories = [
  {
    title: 'Ev Taşınması',
    category: 'Bireysel',
    impact: 'Önemli Tasarruf',
    detail: 'Bireysel gönderici birden fazla nakliyeciden teklif aldı. En uygun teklifi seçerek geleneksel yöntemlere göre önemli ölçüde tasarruf sağladı. Nakliyeci işi hızlıca taşıyıcıya atadı. Canlı takip ile tüm süreç şeffaf bir şekilde izlendi.',
    metrics: { offers: 'Çoklu teklif', tracking: 'Canlı takip', satisfaction: 'Yüksek memnuniyet' },
  },
  {
    title: 'Soğuk Zincir Taşımacılığı',
    category: 'Kurumsal',
    impact: 'Verimli Süreç',
    detail: 'Kurumsal gönderici soğuk zincir gereksinimlerini özel alanlarla bildirdi. Uygun nakliyeci seçildi ve özel gereksinimler karşılandı. Süreç verimli bir şekilde tamamlandı.',
    metrics: { quality: 'Özel gereksinimler', efficiency: 'Verimli süreç', reliability: 'Güvenilir teslimat' },
  },
  {
    title: 'E-Ticaret Dağıtımı',
    category: 'Nakliyeci',
    impact: 'Operasyon Verimliliği',
    detail: 'Nakliyeci rota planlaması aracını kullanarak birden fazla gönderiyi tek turda organize etti. Zaman ve yakıt tasarrufu sağlandı. Sürücüler düzenli ödeme aldı.',
    metrics: { planning: 'Rota optimizasyonu', efficiency: 'Zaman tasarrufu', payment: 'Düzenli ödeme' },
  },
];

const faqItems = [
  {
    question: 'Gerçekten ücretsiz mi?',
    answer:
      'Evet! Bireysel ve kurumsal göndericiler için üyelik ve gönderi oluşturma tamamen ücretsizdir. Hiçbir gizli ücret yoktur. Sadece nakliyeciler kazançları üzerinden %1 sabit komisyon öder. Bu komisyon da sadece başarılı teslimatlar için geçerlidir.',
  },
  {
    question: 'Hangi belgeler gerekiyor?',
    answer:
      'Bireysel göndericiler için TC kimlik doğrulaması yeterlidir. Kurumsal göndericiler için vergi levhası ve imza sirküsü gerekir. Nakliyeci ve taşıyıcılar için yetki belgeleri, araç ruhsatları ve gerekli lisanslar yüklenir. Tüm belgeler güvenli şekilde saklanır.',
  },
  {
    question: 'Ödemeler nasıl yapılıyor?',
    answer:
      'Teklif kabul edildiğinde güvenli ödeme alınır (Iyzico entegrasyonu). Ödeme teslimat tamamlanana kadar güvende tutulur. Teslimat onaylandıktan sonra nakliyeci ve taşıyıcı payları otomatik olarak cüzdanlarına aktarılır. Para çekme işlemleri kısa sürede tamamlanır.',
  },
  {
    question: 'Canlı takip nasıl çalışıyor?',
    answer:
      'Taşıyıcı konum güncellemeleri yapar. Bu güncellemeler WebSocket ile anında gönderici paneline ulaşır. Konum bilgilerini takip edebilirsiniz.',
  },
  {
    question: 'Destek alabilir miyim?',
    answer:
      'Panel içi mesajlaşma 7/24 aktif. Telefon desteği hafta içi 09:00-18:00 saatleri arasında, e-posta desteği ise 24 saat içinde yanıtlanır. Hızlı yanıt süresi ile destek alırsınız.',
  },
  {
    question: 'Rota planlama nasıl çalışıyor?',
    answer:
      'Nakliyeciler için rota planlama aracı. Birden fazla gönderiyi organize ederek verimli rotalar oluşturabilirsiniz.',
  },
];

const trustPillars = [
  {
    icon: Shield,
    title: 'Tam Güven',
    description: 'KVKK uyumlu ve SSL güvencesiyle tüm veriler Türkiye sınırları içinde tutulur.',
  },
  {
    icon: CheckCircle,
    title: 'İşleyen Ekosistem',
    description: 'Bireysel → Nakliyeci → Taşıyıcı döngüsü tek panelde uçtan uca yönetilir.',
  },
  {
    icon: Star,
    title: 'Gerçek Yorumlar',
    description: 'Yüksek puanlı değerlendirmeler ve detaylı hizmet puanlaması ile güvenilir hizmet.',
  },
  {
    icon: Globe,
    title: '81 İl Kapsamı',
    description: '81 il, tüm ilçeler ve sınır kapıları dahil yaygın hizmet ağı.',
  },
];

const proofMetrics = [
  { title: 'Binlerce', description: 'Aktif kullanıcı', accent: 'text-blue-500' },
  { title: 'Yüzbinlerce', description: 'Tamamlanan teslimat', accent: 'text-emerald-500' },
  { title: 'Yüksek', description: 'Memnuniyet oranı', accent: 'text-amber-500' },
  { title: '81', description: 'İl kapsamı', accent: 'text-indigo-500' },
];

const testimonials = [
  {
    name: 'Ahmet Yılmaz',
    role: 'Bireysel Gönderici',
    location: 'İstanbul',
    rating: 5,
    comment: 'Ev taşınmamda birden fazla nakliyeciden teklif aldım. En uygun fiyatı buldum ve geleneksel yöntemlere göre önemli ölçüde tasarruf sağladım. Süreç çok şeffaftı.',
    savings: 'Tasarruf sağladı',
  },
  {
    name: 'Ayşe Demir',
    role: 'Kurumsal Gönderici',
    location: 'Ankara',
    rating: 5,
    comment: 'Şirketimiz için toplu gönderi yönetimi çok kolaylaştı. Raporlama özellikleri sayesinde maliyetlerimizi önemli ölçüde azalttık.',
    savings: 'Maliyet azalışı',
  },
  {
    name: 'Mehmet Kaya',
    role: 'Nakliyeci',
    location: 'İzmir',
    rating: 5,
    comment: 'Yük pazarı sayesinde sürekli iş buluyorum. %1 komisyon çok uygun. Düzenli gönderi alıyorum.',
    savings: 'Düzenli iş akışı',
  },
  {
    name: 'Ali Çelik',
    role: 'Taşıyıcı',
    location: 'Bursa',
    rating: 5,
    comment: 'Nakliyecilerden düzenli iş alıyorum. Ödemeler haftalık ve zamanında. Kazancım önemli ölçüde arttı.',
    savings: 'Artış gösterdi',
  },
];

const pricingComparison = [
  { feature: 'Üyelik Ücreti', traditional: 'Aylık ücret var', yolnext: '₺0', savings: 'Yıllık tasarruf' },
  { feature: 'Gönderi Başına Ücret', traditional: 'Her gönderide ücret', yolnext: '₺0', savings: 'Her gönderide' },
  { feature: 'Komisyon Oranı', traditional: 'Yüksek oran', yolnext: '%1', savings: 'Önemli fark' },
  { feature: 'Gizli Ücret', traditional: 'Var', yolnext: 'Yok', savings: 'Şeffaf' },
  { feature: 'Minimum Sipariş', traditional: 'Var', yolnext: 'Yok', savings: 'Esnek' },
];

const whyChoose = {
  individual: [
    { icon: DollarSign, title: '₺0 Üyelik', desc: 'Hiçbir ücret ödemeden başlayın' },
    { icon: TrendingDown, title: 'Önemli Tasarruf', desc: 'Geleneksel kargodan çok daha uygun' },
    { icon: FileText, title: 'Çoklu Teklif', desc: 'Tek ekranda tüm teklifleri karşılaştırın' },
    { icon: Clock, title: 'Hızlı Süreç', desc: 'Kısa sürede teklif alın' },
  ],
  corporate: [
    { icon: BarChart2, title: 'KPI Dashboard', desc: 'Gerçek zamanlı analitik ve raporlama' },
    { icon: Users, title: 'Ekip Yönetimi', desc: 'Departman bazlı yetki ve takip' },
    { icon: TrendingUp, title: 'Verimlilik Artışı', desc: 'Operasyonel verimlilik artışı' },
    { icon: FileText, title: 'Toplu Gönderi', desc: 'Tek seferde yüzlerce gönderi' },
  ],
  carrier: [
    { icon: Target, title: 'Sürekli İş', desc: 'Yük pazarından sürekli iş fırsatları' },
    { icon: Percent, title: '%1 Komisyon', desc: 'En düşük komisyon oranı' },
    { icon: Route, title: 'Rota Planlama', desc: 'Verimli rota organizasyonu' },
    { icon: CreditCard, title: 'Haftalık Ödeme', desc: 'Düzenli ve zamanında ödemeler' },
  ],
  driver: [
    { icon: Package, title: 'İş Garantisi', desc: 'Nakliyecilerden düzenli iş' },
    { icon: MapPin, title: 'Konum Bazlı', desc: 'Yakınınızdaki iş fırsatları' },
    { icon: Clock, title: 'Haftalık Ödeme', desc: 'Düzenli kazanç akışı' },
    { icon: Star, title: 'Puan Sistemi', desc: 'Yüksek puan = Daha fazla iş' },
  ],
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('individual');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPersona =
    personaPanels.find(persona => persona.id === selectedUserType) || personaPanels[0];

  const handleNavigate = async (path: string, state?: Record<string, string>) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      navigate(path, state ? { state } : undefined);
    } catch (error) {
      console.error('Navigasyon hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { label: 'Özellikler', href: '#features' },
    { label: 'Paneller', href: '#panels' },
    { label: 'İş Akışı', href: '#workflow' },
    { label: 'Kategoriler', href: '#categories' },
    { label: 'Vaka Analizleri', href: '#cases' },
    { label: 'SSS', href: '#faq' },
  ];

  return (
    <div className='min-h-screen bg-white text-gray-900'>
      <Helmet>
        <title>YolNext | Türkiye'nin 4 Panelli Lojistik Ekosistemi</title>
        <meta
          name='description'
          content='Bireysel, kurumsal, nakliyeci ve taşıyıcı panellerini tek platformda buluşturan YolNext ile lojistik süreçlerinizi önemli ölçüde tasarrufla yönetin.'
        />
        <link rel='canonical' href='https://yolnext.com' />
      </Helmet>

      <header className='sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between'>
          <div className='flex items-center space-x-8'>
            <YolNextLogo variant='banner' size='md' className='h-9' />
            <nav className='hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-700'>
              {menuItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  className='hover:text-slate-900 transition-colors duration-200'
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className='hidden md:flex items-center space-x-3'>
              <button
              onClick={() => handleNavigate('/login')}
                disabled={isLoading}
              className='px-5 py-2 rounded-xl font-semibold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50'
              >
                {isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
              </button>
              <button
              onClick={() => handleNavigate('/register')}
                disabled={isLoading}
              className='px-6 py-2 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition disabled:opacity-50'
              >
              {isLoading ? 'Hazırlanıyor...' : 'Ücretsiz Deneyin'}
              </button>
            </div>

              <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className='md:hidden p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition'
            aria-label='Menüyü aç/kapat'
            >
            {isMenuOpen ? <XIcon className='h-5 w-5' /> : <MenuIcon className='h-5 w-5' />}
              </button>
          </div>

        {isMenuOpen && (
          <div className='md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-6 space-y-4'>
            {menuItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className='block text-slate-700 font-medium hover:text-slate-900 transition'
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className='pt-4 border-t border-slate-200 flex flex-col gap-3'>
                <button
                onClick={() => handleNavigate('/login')}
                className='w-full border border-slate-200 bg-slate-50 rounded-xl py-3 font-semibold text-slate-700 hover:bg-slate-100 transition'
                >
                Giriş Yap
                </button>
                <button
                onClick={() => handleNavigate('/register')}
                className='w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-xl py-3 font-semibold hover:from-slate-700 hover:to-blue-800 shadow-lg transition'
                >
                Ücretsiz Deneyin
                </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION - Glassmorphism Design with Gradient Background */}
        <section id='hero' className='relative min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 overflow-hidden'>
          {/* Subtle Pattern Overlay */}
          <div className='absolute inset-0 opacity-10'>
            <div className='absolute inset-0' style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Gradient Orbs for Depth */}
          <div className='absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl'></div>
          <div className='absolute bottom-0 left-0 w-96 h-96 bg-slate-700/20 rounded-full blur-3xl'></div>

          <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='pt-32 lg:pt-40 pb-24 lg:pb-32'>
              <div className='grid lg:grid-cols-12 gap-12 lg:gap-16 items-center'>
                
                {/* Left Content */}
                <div className='lg:col-span-7 space-y-10'>
                  {/* Badge */}
                  <div className='inline-flex items-center gap-3 mb-8'>
                    <div className='px-4 py-2 bg-white/10 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-full border border-white/20 shadow-lg'>
                      Türkiye'nin En Büyük Lojistik Pazar Yeri
                    </div>
                    <div className='flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20'>
                      <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse'></div>
                      <span className='text-xs font-medium text-white/90'>Canlı</span>
                    </div>
                  </div>
                  
                  {/* Main Heading */}
                  <div className='space-y-6'>
                    <h1 className='text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight'>
                      Lojistik İşlerinizi
                      <br />
                      <span className='bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent'>Dijitalleştirin</span>
                    </h1>
                    
                    <p className='text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl font-normal'>
                      4 panelli ekosistem ile göndericiler, nakliyeciler ve taşıyıcılar tek platformda buluşuyor. 
                      <span className='block mt-2 text-white/90 font-medium'>
                        Önemli ölçüde tasarruf ile geleneksel kargodan çok daha uygun.
                      </span>
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className='flex flex-col sm:flex-row gap-4 pt-4'>
                    <button
                      onClick={() => handleNavigate('/register')}
                      className='group px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-base shadow-2xl hover:shadow-white/20 hover:bg-white/95 transition-all duration-200 flex items-center justify-center gap-2'
                    >
                      Ücretsiz Başla
                      <ArrowRight className='h-5 w-5 group-hover:translate-x-1 transition-transform' />
                    </button>
                    <button
                      onClick={() => handleNavigate('/login')}
                      className='px-8 py-4 rounded-xl font-semibold text-base text-white bg-white/10 backdrop-blur-md border-2 border-white/30 hover:border-white/50 hover:bg-white/20 transition-all duration-200 shadow-lg'
                    >
                      Giriş Yap
                    </button>
                  </div>

                  {/* Quick Stats - Glassmorphism Cards */}
                  <div className='grid grid-cols-3 gap-4 pt-12'>
                    <div className='bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300'>
                      <div className='text-4xl font-bold text-white mb-2'>₺0</div>
                      <div className='text-sm font-semibold text-white/90'>Üyelik Ücreti</div>
                      <div className='text-xs text-white/70 mt-1'>Tamamen ücretsiz</div>
                    </div>
                    <div className='bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300'>
                      <div className='text-4xl font-bold text-white mb-2'>Tasarruf</div>
                      <div className='text-sm font-semibold text-white/90'>Önemli Ölçüde</div>
                      <div className='text-xs text-white/70 mt-1'>Geleneksel yöntemlere göre</div>
                    </div>
                    <div className='bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300'>
                      <div className='text-4xl font-bold text-white mb-2'>Hızlı</div>
                      <div className='text-sm font-semibold text-white/90'>Teklif Süresi</div>
                      <div className='text-xs text-white/70 mt-1'>Kısa sürede teklif</div>
                    </div>
                  </div>
                </div>

                {/* Right Content - Glassmorphism Cards */}
                <div className='lg:col-span-5 space-y-6'>
                  {/* Main Stat Card - Enhanced */}
                  <div className='bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300'>
                    <div className='flex items-center gap-4 mb-6'>
                      <div className='w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg'>
                        <Users className='h-8 w-8 text-white' />
                      </div>
                      <div>
                        <div className='text-xs font-semibold text-white/80 uppercase tracking-wider mb-1'>Toplam Aktif</div>
                        <div className='text-sm font-medium text-white/90'>Kullanıcı Sayısı</div>
                      </div>
                    </div>
                    <div className='text-7xl font-bold text-white mb-4'>Binlerce</div>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium text-white/90'>Canlı veri</span>
                      </div>
                      <span className='text-white/50'>•</span>
                      <span className='text-sm text-white/70'>Gerçek zamanlı</span>
                    </div>
                    <div className='pt-4 border-t border-white/20'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-white/70'>Sürekli büyüyor</span>
                        <span className='text-blue-300 font-semibold'>Yeni kullanıcılar katılıyor</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Stats - Enhanced */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-300'>
                      <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 border border-white/30'>
                        <Package className='h-6 w-6 text-white' />
                      </div>
                      <div className='text-3xl font-bold text-white mb-1'>Yüzbinlerce</div>
                      <div className='text-xs font-semibold text-white/80 uppercase tracking-wide mb-1'>Teslimat</div>
                      <div className='text-xs text-white/60'>Tamamlanan işlem</div>
                      <div className='mt-3 pt-3 border-t border-white/10'>
                        <div className='flex items-center gap-1 text-xs'>
                          <TrendingUp className='h-3 w-3 text-blue-300' />
                          <span className='text-blue-300 font-medium'>Sürekli artış</span>
                        </div>
                      </div>
                    </div>
                    <div className='bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-300'>
                      <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 border border-white/30'>
                        <Star className='h-6 w-6 text-white fill-white' />
                      </div>
                      <div className='text-3xl font-bold text-white mb-1'>Yüksek</div>
                      <div className='text-xs font-semibold text-white/80 uppercase tracking-wide mb-1'>Memnuniyet</div>
                      <div className='text-xs text-white/60'>Kullanıcı puanı</div>
                      <div className='mt-3 pt-3 border-t border-white/10'>
                        <div className='flex items-center gap-1 text-xs'>
                          <Star className='h-3 w-3 text-amber-300 fill-amber-300' />
                          <span className='text-amber-300 font-medium'>Yüksek puan</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coverage Card - Enhanced */}
                  <div className='bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-xl'>
                    <div className='flex items-center gap-4 mb-4'>
                      <div className='w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center border border-white/30'>
                        <Globe className='h-7 w-7 text-white' />
                      </div>
                      <div>
                        <div className='text-3xl font-bold text-white'>81</div>
                        <div className='text-xs font-semibold text-white/80 uppercase tracking-wide'>İl Kapsamı</div>
                      </div>
                    </div>
                    <div className='space-y-3 pt-4 border-t border-white/20'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2.5 text-sm'>
                          <MapPin className='h-4 w-4 text-blue-300' />
                          <span className='font-medium text-white/90'>Tüm Türkiye</span>
                        </div>
                        <span className='text-xs text-white/60'>Tüm ilçeler</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2.5 text-sm'>
                          <Truck className='h-4 w-4 text-blue-300' />
                          <span className='font-medium text-white/90'>7/24 Hizmet</span>
                        </div>
                        <span className='text-xs text-white/60'>Kesintisiz</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2.5 text-sm'>
                          <Zap className='h-4 w-4 text-blue-300' />
                          <span className='font-medium text-white/90'>Anında İşlem</span>
                        </div>
                        <span className='text-xs text-white/60'>Gerçek zamanlı</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM FEATURES */}
        <section id='features' className='bg-white py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Platform Özellikleri</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Lojistik Süreçlerinizi Dijitalleştirin
              </h2>
              <p className='text-lg text-slate-600'>
                Modern teknoloji ile donatılmış platformumuz, tüm lojistik ihtiyaçlarınızı tek yerden yönetmenizi sağlar.
              </p>
              </div>

            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
              {platformFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className='group rounded-3xl border border-slate-200 bg-white p-6 hover:-translate-y-2 hover:shadow-xl transition-all duration-300'
                >
                  <div className='w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                    <feature.icon className='h-7 w-7 text-white' />
                  </div>
                  <h3 className='text-xl font-bold text-slate-900 mb-2'>{feature.title}</h3>
                  <p className='text-sm text-slate-600 leading-relaxed'>{feature.description}</p>
                </div>
                    ))}
          </div>
        </div>
      </section>

        {/* PANELS SECTION */}
        <section id='panels' className='bg-gradient-to-b from-white to-slate-50 py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>4 Panel</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Her Rol İçin Özel Tasarım
              </h2>
              <p className='text-lg text-slate-600'>
                Bireysel gönderici, kurumsal şirket, nakliyeci veya taşıyıcı - herkes için optimize edilmiş panel.
            </p>
          </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12'>
              {personaPanels.map(panel => {
                const isSelected = selectedUserType === panel.id;
                return (
                  <button
                    key={panel.id}
                    onClick={() => setSelectedUserType(panel.id)}
                    className={`rounded-3xl border p-6 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                      isSelected ? 'bg-blue-600' : 'bg-slate-100'
                    }`}>
                      <panel.icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-slate-900'}`} />
                  </div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-2 ${
                      isSelected ? 'text-blue-600' : 'text-slate-500'
                    }`}>
                      {panel.subtitle}
                    </p>
                    <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>
                      {panel.title}
                    </h3>
                    <p className={`text-sm mb-4 ${isSelected ? 'text-slate-700' : 'text-slate-600'}`}>
                      {panel.promise}
                    </p>
                    <p className={`text-xs font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                      {panel.stats}
                    </p>
                  </button>
                );
              })}
                </div>

            <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-xl'>
              <div className='flex flex-wrap items-start justify-between gap-6 mb-8'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>Seçili Panel</p>
                  <h3 className='text-3xl font-bold text-slate-900'>{selectedPersona.title}</h3>
                  <p className='text-sm text-slate-600'>{selectedPersona.stats}</p>
                      </div>
                <button
                  onClick={() => handleNavigate('/register', { userType: selectedPersona.id })}
                  className='inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 text-white px-6 py-3 font-semibold shadow-xl hover:from-slate-700 hover:to-blue-800 transition'
                >
                  {selectedPersona.cta}
                  <ArrowRight className='h-5 w-5' />
                </button>
                </div>

              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8'>
                {selectedPersona.features.map((feature, idx) => (
                  <div key={idx} className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:shadow-md transition'>
                    <CheckCircle className='h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5' />
                    <p className='text-sm text-slate-700 font-medium'>{feature}</p>
                      </div>
                    ))}
                  </div>

              <div className='pt-6 border-t border-slate-200'>
                <p className='text-sm font-semibold text-slate-700 mb-3'>Panel Sayfaları:</p>
                <div className='flex flex-wrap gap-2'>
                  {selectedPersona.pages.map((page, idx) => (
                    <span
                      key={idx}
                      className='px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200'
                    >
                      {page}
                    </span>
                  ))}
                </div>
              </div>
                </div>
                  </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id='workflow' className='bg-slate-900 py-24 text-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-300 mb-4'>İş Akışı</p>
              <h2 className='text-4xl md:text-5xl font-bold mb-6'>
                5 Adımda Tamamlanan Süreç
              </h2>
              <p className='text-lg text-white/70'>
                Gönderi oluşturma'dan teslimata kadar tüm süreç tek platformda, şeffaf ve hızlı.
            </p>
                  </div>

            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-5'>
              {workflowSteps.map((step, idx) => (
                <div key={idx} className='relative'>
                  {idx < workflowSteps.length - 1 && (
                    <div className='hidden lg:block absolute top-12 left-full w-full h-0.5 bg-white/20 -z-10' style={{ width: 'calc(100% - 3rem)' }}></div>
                  )}
                  <div className='rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur hover:bg-white/10 hover:-translate-y-2 transition-all duration-300'>
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white text-xl font-bold shadow-lg ${
                      step.color === 'blue' ? 'bg-blue-600' :
                      step.color === 'green' ? 'bg-green-600' :
                      step.color === 'purple' ? 'bg-purple-600' :
                      step.color === 'orange' ? 'bg-orange-600' :
                      'bg-emerald-600'
                    }`}>
                      {step.step}
              </div>
                    <h3 className='text-xl font-semibold mb-2'>{step.title}</h3>
                    <p className='text-sm text-white/70 leading-relaxed'>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section id='categories' className='bg-white py-24'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Kategoriler</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Her Tür Gönderi İçin Çözüm
              </h2>
              <p className='text-lg text-slate-600'>
                Ev taşınmasından soğuk zincire, tehlikeli maddelerden e-ticarete kadar tüm kategoriler.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {categories.map((category, idx) => (
                <div
                  key={idx}
                  className='rounded-3xl border border-slate-200 bg-white p-6 hover:-translate-y-2 hover:shadow-xl transition-all duration-300'
                >
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center mb-4'>
                    <category.icon className='h-6 w-6 text-white' />
                    </div>
                  <h3 className='text-xl font-bold text-slate-900 mb-2'>{category.name}</h3>
                  <p className='text-sm text-slate-600'>{category.description}</p>
                </div>
              ))}
                </div>
              </div>
        </section>

        {/* PRICING COMPARISON */}
        <section className='bg-gradient-to-b from-slate-50 to-white py-24'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Fiyatlandırma</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Geleneksel Yöntemler vs YolNext
              </h2>
              <p className='text-lg text-slate-600'>
                Şeffaf fiyatlandırma ile ne kadar tasarruf edeceğinizi görün.
              </p>
              </div>

            <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-xl overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50'>
                      <th className='text-left py-4 px-6 font-bold text-slate-900'>Özellik</th>
                      <th className='text-center py-4 px-6 font-bold text-slate-700'>Geleneksel Yöntemler</th>
                      <th className='text-center py-4 px-6 font-bold text-emerald-600'>YolNext</th>
                      <th className='text-center py-4 px-6 font-bold text-blue-600'>Tasarruf</th>
                  </tr>
                </thead>
                <tbody>
                    {pricingComparison.map((row, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className='py-4 px-6 font-semibold text-slate-900'>{row.feature}</td>
                        <td className='py-4 px-6 text-center text-slate-600'>{row.traditional}</td>
                        <td className='py-4 px-6 text-center font-bold text-emerald-600'>{row.yolnext}</td>
                        <td className='py-4 px-6 text-center font-semibold text-blue-600'>{row.savings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
          </div>
        </div>
      </section>

        {/* ADVANTAGES */}
        <section className='bg-white py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Avantajlar</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Neden YolNext?
              </h2>
          </div>

            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
              {advantages.map((advantage, idx) => (
                <div
                  key={idx}
                  className='rounded-3xl border border-slate-200 bg-white p-8 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 text-center'
                >
                  <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                    <advantage.icon className='h-8 w-8 text-white' />
              </div>
                  <div className='text-4xl font-bold text-blue-600 mb-2'>{advantage.stat}</div>
                  <h3 className='text-xl font-bold text-slate-900 mb-3'>{advantage.title}</h3>
                  <p className='text-sm text-slate-600 leading-relaxed'>{advantage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE BY USER TYPE */}
        <section className='bg-gradient-to-b from-white to-slate-50 py-24'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Size Özel</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Rolünüze Göre Avantajlar
              </h2>
              <p className='text-lg text-slate-600'>
                Her kullanıcı tipi için özel olarak tasarlanmış avantajlar.
              </p>
            </div>

            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
              {personaPanels.map((panel, panelIdx) => {
                const reasons = whyChoose[panel.id as keyof typeof whyChoose];
                return (
                  <div
                    key={panelIdx}
                    className='rounded-3xl border border-slate-200 bg-white p-6 hover:-translate-y-2 hover:shadow-xl transition-all duration-300'
                  >
                    <div className='flex items-center gap-3 mb-6'>
                      <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
                        <panel.icon className='h-6 w-6 text-white' />
                      </div>
                      <h3 className='text-xl font-bold text-slate-900'>{panel.title}</h3>
                    </div>
                    <div className='space-y-4'>
                      {reasons.map((reason, reasonIdx) => (
                        <div key={reasonIdx} className='flex items-start gap-3'>
                          <div className='w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0'>
                            <reason.icon className='h-5 w-5 text-blue-600' />
                          </div>
                          <div>
                            <h4 className='font-semibold text-slate-900 text-sm mb-1'>{reason.title}</h4>
                            <p className='text-xs text-slate-600'>{reason.desc}</p>
          </div>
              </div>
              ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

        {/* TRUST PILLARS */}
        <section className='bg-slate-900 py-24 text-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-300 mb-4'>Güven</p>
              <h2 className='text-4xl md:text-5xl font-bold mb-6'>
                Güvenilir ve Güvenli Platform
              </h2>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12'>
              {trustPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className='rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur hover:bg-white/10 hover:-translate-y-2 transition-all duration-300'
                >
                  <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10'>
                    <pillar.icon className='h-6 w-6 text-white' />
                  </div>
                  <h3 className='text-xl font-bold mb-2'>{pillar.title}</h3>
                  <p className='text-sm text-white/70'>{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CASE STUDIES */}
        <section id='cases' className='bg-white py-24'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Vaka Analizleri</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Gerçek Başarı Hikayeleri
              </h2>
              <p className='text-lg text-slate-600'>
                Platformumuzu kullanan kullanıcıların deneyimleri ve başarı hikayeleri.
              </p>
            </div>

            <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16'>
              {caseStories.map((story, idx) => (
                <div
                  key={idx}
                  className='rounded-3xl border border-slate-200 bg-white p-8 hover:-translate-y-2 hover:shadow-xl transition-all duration-300'
                >
                  <div className='flex items-center justify-between mb-4'>
                    <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold'>
                      {story.category}
                    </span>
                    <span className='text-2xl font-bold text-emerald-600'>{story.impact}</span>
                  </div>
                  <h3 className='text-xl font-bold text-slate-900 mb-3'>{story.title}</h3>
                  <p className='text-sm text-slate-600 mb-4 leading-relaxed'>{story.detail}</p>
                  <div className='pt-4 border-t border-slate-100'>
                    <div className='flex flex-wrap gap-2'>
                      {Object.entries(story.metrics).map(([key, value], i) => (
                        <span key={i} className='px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium'>
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* USER TESTIMONIALS */}
            <div className='text-center max-w-3xl mx-auto mb-12'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Kullanıcı Yorumları</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Kullanıcılarımız Ne Diyor?
              </h2>
              <p className='text-lg text-slate-600'>
                Türkiye'nin dört bir yanından gerçek kullanıcı deneyimleri.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className='rounded-3xl border border-slate-200 bg-white p-6 hover:-translate-y-2 hover:shadow-xl transition-all duration-300'
                >
                  <div className='flex items-center gap-1 mb-3'>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className='h-4 w-4 fill-amber-400 text-amber-400' />
                    ))}
                  </div>
                  <p className='text-sm text-slate-700 mb-4 leading-relaxed'>{testimonial.comment}</p>
                  <div className='pt-4 border-t border-slate-100'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-semibold text-slate-900'>{testimonial.name}</p>
                        <p className='text-xs text-slate-500'>{testimonial.role} • {testimonial.location}</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs font-semibold text-emerald-600'>{testimonial.savings}</p>
                        <p className='text-xs text-slate-500'>Tasarruf</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className='bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-24 text-white'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-4xl md:text-5xl font-bold mb-6'>
              4 Panelli Ekosisteme Katılın
            </h2>
            <p className='text-xl text-slate-200 mb-8 leading-relaxed'>
                  Kayıt tamamen ücretsiz, kredi kartı gerekmez, 2 dakikada kayıt olun. 
              <br />
                  Binlerce kullanıcı bu sistemi kullanıyor.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                <button
                  onClick={() => handleNavigate('/register')}
                className='bg-white text-slate-900 px-10 py-5 rounded-xl font-bold text-lg shadow-2xl hover:bg-slate-100 transition-all duration-300 flex items-center gap-2'
                >
                  Ücretsiz Kayıt Ol
                  <ArrowRight className='h-5 w-5' />
                </button>
                <button
                  onClick={() => handleNavigate('/contact')}
                className='px-10 py-5 rounded-xl font-bold text-lg text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300'
                >
                  Kurumsal Demo
                </button>
            </div>
            <div className='flex flex-wrap justify-center gap-8 mt-12 text-sm'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-emerald-400' />
                <span>Kayıt Ücretsiz</span>
              </div>
              <div className='flex items-center gap-2'>
                <Shield className='h-5 w-5 text-blue-400' />
                <span>Kredi Kartı Gerekmez</span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='h-5 w-5 text-cyan-400' />
                <span>2 Dakikada Kayıt Ol</span>
              </div>
          </div>
        </div>
      </section>

        {/* HOW TO START */}
        <section className='bg-gradient-to-b from-slate-50 to-white py-24'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Başlangıç</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Nasıl Başlarım?
              </h2>
              <p className='text-lg text-slate-600'>
                3 basit adımda YolNext ekosistemine katılın.
                </p>
          </div>

            <div className='grid gap-6 md:grid-cols-3'>
              <div className='rounded-3xl border border-slate-200 bg-white p-8 text-center'>
                <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <span className='text-2xl font-bold text-white'>1</span>
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>Ücretsiz Kayıt Ol</h3>
                <p className='text-sm text-slate-600 mb-4'>TC kimlik veya vergi numaranız ile 2 dakikada kayıt olun. Kredi kartı gerekmez.</p>
          <button
                  onClick={() => handleNavigate('/register')}
                  className='text-blue-600 font-semibold text-sm hover:text-blue-700 flex items-center gap-1 mx-auto'
          >
                  Kayıt Ol <ArrowRight className='h-4 w-4' />
          </button>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-8 text-center'>
                <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <span className='text-2xl font-bold text-white'>2</span>
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>Profilinizi Tamamlayın</h3>
                <p className='text-sm text-slate-600 mb-4'>Gerekli belgeleri yükleyin. Onay süreci hızlı bir şekilde tamamlanır.</p>
                <div className='flex items-center justify-center gap-1 text-slate-500 text-sm'>
                  <UserCheck className='h-4 w-4' />
                  <span>Hızlı Onay</span>
                </div>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-8 text-center'>
                <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <span className='text-2xl font-bold text-white'>3</span>
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>İlk İşleminizi Yapın</h3>
                <p className='text-sm text-slate-600 mb-4'>Gönderi oluşturun, teklif verin veya iş alın. Platform kullanıma hazır!</p>
                <div className='flex items-center justify-center gap-1 text-emerald-600 text-sm font-semibold'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Hemen Başla</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id='faq' className='bg-white py-24'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Sık Sorulanlar</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Merak Ettikleriniz
              </h2>
              <p className='text-lg text-slate-600'>
                4 panelli ekosistem hakkında en çok sorulan sorular ve detaylı cevapları.
              </p>
            </div>

            <div className='space-y-4'>
              {faqItems.map((item, idx) => (
                <details
                  key={idx}
                  className='group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm open:shadow-md open:border-blue-300 transition hover:-translate-y-1'
                >
                  <summary className='flex cursor-pointer items-center justify-between text-lg font-semibold text-slate-900'>
                    <span>{item.question}</span>
                    <div className='ml-4 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition-transform group-open:rotate-45'>
                      <span className='text-xl font-bold'>+</span>
            </div>
                  </summary>
                  <div className='mt-4 pt-4 border-t border-slate-100'>
                    <p className='text-sm text-slate-600 leading-relaxed'>{item.answer}</p>
            </div>
                </details>
              ))}
          </div>

            <div className='text-center mt-12'>
              <button
                onClick={() => handleNavigate('/contact')}
                className='inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 text-white px-6 py-3 font-semibold shadow-xl hover:from-slate-700 hover:to-blue-800 transition'
              >
                Daha Fazla Soru Sor
                <ArrowRight className='h-5 w-5' />
              </button>
            </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;

