import React, { useEffect, useState } from 'react';
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
  Target,
  FileText,
  CreditCard,
  Bell,
  Map,
  Route,
  Award,
  Eye,
  Smartphone,
  ShoppingCart,
  TrendingDown,
  Percent,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import YolNextLogo from '../components/common/yolnextLogo';
import Footer from '../components/common/Footer';
import { analytics } from '../services/analytics';

const personaPanels = [
    {
      id: 'individual',
      title: 'Bireysel Gönderici',
      icon: Users,
    subtitle: 'Ev Taşımacılığı • Ofis Taşımacılığı • Eşya Gönderimi',
    promise: 'Optimize Edilmiş Teklif Süreci • Rekabetçi Fiyatlandırma • %30-50 Maliyet Optimizasyonu',
    painPoint: "Tek kargo şirketine mahkumsunuz. Fiyatlar yüksek, şeffaflık yok, seçenek yok. Her ay binlerce lira fazla ödüyorsunuz.",
    withoutPlatform: 'Tek seçenek, yüksek fiyat, hiç indirim yok',
    withPlatform: 'Çoklu teklif, canlı rekabet, her gönderide tasarruf',
    flow: ['Gönderi oluştur', 'Teklifleri karşılaştır', 'Kabul et ve süreci takip et'],
      features: [
      'Hızlı gönderi formu',
      'Tek ekranda teklif kıyaslama',
      'Canlı konum & teslimat akışı',
      'Mesajlaşma sistemi',
      'Cüzdan yönetimi',
      'Geçmiş siparişler',
      'Değerlendirme sistemi',
    ],
    stats: '25.000+ bireysel kullanıcı',
    cta: 'Hemen Ücretsiz Başla',
    urgency: '⚠️ Her gönderide ortalama ₺450 fazla ödüyorsunuz - hemen durdurun',
    pages: ['Dashboard', 'Gönderi Oluştur', 'Gönderilerim', 'Teklifler', 'Canlı Takip', 'Mesajlar', 'Cüzdan'],
    },
    {
      id: 'corporate',
      title: 'Kurumsal Gönderici',
      icon: Building2,
    subtitle: 'Endüstriyel Lojistik • Perakende Tedarik • E-Ticaret Dağıtım',
    promise: 'Entegre Operasyon Yönetimi • %40 Maliyet Düşüşü • Detaylı Analitik Raporlama',
    painPoint: "Her departman kendi kargosunu ayarlıyor. Hangi nakliyeye ne kadar ödediğinizi bilmiyorsunuz. Faturaları kontrol edemiyorsunuz. Her ay on binlerce lira gereksiz harcama.",
    withoutPlatform: 'Kontrolsüz harcama, dağınık sistem, raporlama imkansız',
    withPlatform: 'Tek platform, %40 maliyet düşüşü, detaylı raporlar, tam kontrol',
    flow: ['Gönderileri oluştur/planla', 'Teklifleri yönet ve onayla', 'Raporla ve optimize et'],
      features: [
      'Toplu Yönetim Sistemi • Otomatik Raporlama',
      'Departman & yetki yönetimi',
      'Gerçek zamanlı KPI dashboard',
      'Analitik ve raporlama',
      'Ekip yönetimi',
      'İndirim yönetimi',
      'Müşteri yönetimi',
    ],
    stats: '5.000+ kurumsal hesap',
    cta: 'Kurumsal Görüşme Planla',
    urgency: '⚠️ Aylık ₺50.000+ gereksiz harcama yapıyorsunuz - hemen kontrol alın',
    pages: ['Dashboard', 'Gönderi Oluştur', 'Gönderilerim', 'Analitik', 'Raporlar', 'Ekip', 'Nakliyeciler', 'Ayarlar'],
    },
    {
      id: 'carrier',
      title: 'Nakliyeci',
      icon: Layers,
      subtitle: 'Filo Yönetimi • Lojistik Operasyonları • Taşıma Hizmetleri',
      promise: 'Kapasite Optimizasyonu • Boş Yük Yönetimi • Sektörün En Düşük Komisyon Oranı: %1',
      painPoint: "Yük bulamıyorsunuz, araçlar boş dönüyor, aracılar %15-20 komisyon kesiyor. Aylık giderler sabit ama gelir düzensiz. İflas riskiyle yaşıyorsunuz.",
      withoutPlatform: 'Boş dönüş, yük bulamama, %15-20 komisyon, düzensiz iş',
      withPlatform: 'Sürekli yük, %1 komisyon, rota optimizasyonu, garantili iş akışı',
      flow: ['Yükleri filtrele', 'Teklif ver ve işi al', 'Taşıyıcıya ata ve süreci yönet'],
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
      stats: '15.000+ nakliyeci',
      cta: 'Hemen İş Akışını Başlat',
      urgency: '⚠️ Her boş dönüş ₺2.500 kayıp - aylık ₺40.000+ kaybı durdurun',
      pages: ['Dashboard', 'Yük Pazarı', 'Aktif Yükler', 'Tamamlanan Yükler', 'İlanlarım', 'Taşıyıcılarım', 'Cüzdan'],
    },
    {
      id: 'driver',
      title: 'Taşıyıcı',
      icon: Truck,
      subtitle: 'Profesyonel Sürücüler • Taşıma Ekipleri • Lojistik Personeli',
      promise: 'Gerçek Zamanlı İşlem Yönetimi • Haftalık Ödeme Garantisi • Konum Bazlı İş Fırsatları',
      painPoint: "Bu hafta iş var, gelecek hafta yok. Ödemeler gecikiyor veya hiç gelmiyor. Hangi gün ne kazanacağınızı bilmiyorsunuz. Ailenize düzenli para götüremiyorsunuz.",
      withoutPlatform: 'Belirsiz gelir, geciken ödeme, iş bulamama, stres',
      withPlatform: 'Düzenli iş akışı, haftalık ödeme, konum bazlı fırsatlar, puan sistemi',
      flow: ['İşleri incele', 'İşi kabul et', 'Durum güncelle ve tamamla'],
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
    stats: '8.000+ taşıyıcı',
    cta: 'Hemen Düzenli İşe Başla',
    urgency: '⚠️ Düzensiz gelir aile bütçenizi vuruyor - düzenli işe geçin',
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
    description: 'Ödeme ve komisyon kayıtları tek yerde. Ödeme detayları mesajlaşmada yazılı teyitle netleşir; süreç adımları kayıt altındadır.',
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
    description: 'WebSocket ile anlık bildirimler. Teklif, teslimat ve durum güncellemeleri anında.',
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
    description: 'En uygun teklifi seçin. Ödeme ve yükleme detaylarını mesajlaşmada yazılı teyitle netleştirin. Nakliyeci gönderiyi alır ve taşıyıcıya atar.',
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
    description: 'Teslimat tamamlanır, onay verilir, değerlendirme yapılır. Süreç kayıtları panelinizde saklanır.',
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
    description: 'Rekabetçi fiyatlar ve şeffaf fiyatlandırma ile uygun maliyetli çözümler. Birden fazla teklif karşılaştırması.',
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
    detail: 'Bireysel gönderici birden fazla nakliyeciden teklif aldı. En uygun teklifi seçerek rekabetçi fiyat buldu. Nakliyeci işi hızlıca taşıyıcıya atadı. Takip ekranı ile süreç şeffaf bir şekilde izlendi.',
    metrics: { offers: 'Çoklu teklif', tracking: 'Takip akışı', satisfaction: 'Yüksek memnuniyet' },
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
      'Teklif kabul edildiğinde ödeme ve kritik detaylar (IBAN/alıcı adı/açıklama gibi) mesajlaşma üzerinden yazılı teyitle netleştirilir. Durum adımları ve iletişim kayıt altında tutulur. Komisyon modeli şeffaftır: gönderici komisyon ödemez; nakliyeci sabit %1 komisyon öder.',
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


const testimonials = [
  {
    name: 'Ahmet Yılmaz',
    role: 'Bireysel Gönderici',
    location: 'İstanbul',
    rating: 5,
    comment: 'Ev taşınmamda birden fazla nakliyeciden teklif aldım. En uygun fiyatı buldum ve rekabetçi fiyat avantajı elde ettim. Süreç çok şeffaftı.',
    savings: 'Tasarruf sağladı',
    badge: 'Maliyet',
  },
  {
    name: 'Ayşe Demir',
    role: 'Kurumsal Gönderici',
    location: 'Ankara',
    rating: 5,
    comment: 'Şirketimiz için toplu gönderi yönetimi çok kolaylaştı. Raporlama özellikleri sayesinde operasyonel verimliliğimizi artırdık.',
    savings: 'Verimlilik artışı',
    badge: 'Operasyon',
  },
  {
    name: 'Mehmet Kaya',
    role: 'Nakliyeci',
    location: 'İzmir',
    rating: 5,
    comment: 'Yük pazarı sayesinde sürekli iş buluyorum. %1 komisyon çok uygun. Düzenli gönderi alıyorum.',
    savings: 'Sürekli iş akışı',
    badge: 'İş Akışı',
  },
  {
    name: 'Ali Çelik',
    role: 'Taşıyıcı',
    location: 'Bursa',
    rating: 5,
    comment: 'Nakliyecilerden düzenli iş alıyorum. Ödemeler haftalık ve zamanında. Düzenli kazanç akışı sağladım.',
    savings: 'Düzenli kazanç',
    badge: 'Gelir',
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
    { icon: DollarSign, title: '₺0 Üyelik', desc: 'Hiçbir ücret ödemeden başlayın, her gönderide tasarruf edin' },
    { icon: TrendingDown, title: '%30-50 Tasarruf', desc: 'Geleneksel kargodan çok daha uygun fiyatlar' },
    { icon: FileText, title: 'Çoklu Teklif', desc: 'Tek ekranda tüm teklifleri karşılaştırın, en iyisini seçin' },
    { icon: Clock, title: 'Anında Teklif', desc: 'Dakikalar içinde birden fazla teklif alın' },
  ],
  corporate: [
    { icon: BarChart2, title: 'KPI Dashboard', desc: 'Gerçek zamanlı analitik ile maliyetleri kontrol edin' },
    { icon: Users, title: 'Ekip Yönetimi', desc: 'Departman bazlı yetki ve merkezi takip sistemi' },
    { icon: TrendingUp, title: '%40 Tasarruf', desc: 'Operasyonel maliyetlerde önemli azalış' },
    { icon: FileText, title: 'Toplu Gönderi', desc: 'Tek seferde yüzlerce gönderi, zaman tasarrufu' },
  ],
  carrier: [
    { icon: Target, title: 'Sürekli İş Akışı', desc: 'Yük pazarından 7/24 iş fırsatları, boş dönüş yok' },
    { icon: Percent, title: '%1 Komisyon', desc: 'Sektörün en düşük komisyon oranı' },
    { icon: Route, title: 'Rota Optimizasyonu', desc: 'Verimli rotalar, yakıt tasarrufu, zaman kazancı' },
    { icon: CreditCard, title: 'Ödeme Düzeni', desc: 'Ödeme detayları yazılı teyitle netleşir, kayıtlı süreçle ilerlenir' },
  ],
  driver: [
    { icon: Package, title: 'Daha Düzenli İş', desc: 'Nakliyecilerden iş fırsatları, daha öngörülebilir akış' },
    { icon: MapPin, title: 'Konum Bazlı İşler', desc: 'Yakınınızdaki iş fırsatları, boş kilometre yok' },
    { icon: Clock, title: 'Süreç Takibi', desc: 'Durum adımları ve iletişim kayıt altındadır' },
    { icon: Star, title: 'Puan Sistemi', desc: 'Yüksek puan = Daha fazla iş, daha yüksek kazanç' },
  ],
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('individual');
  const [isLoading, setIsLoading] = useState(false);
  const [abVariant] = useState(() => analytics.ab.getVariant('ab_landing_v1'));
  
  // Viral FOMO: Dinamik sayılar
  const [liveStats, setLiveStats] = useState({
    todayJoined: 247,
    last24hSavings: 128350,
    activeNow: 1847
  });
  
  useEffect(() => {
    // Gerçekçi aralıkta sayıları küçük değişikliklerle güncelle (viral etki)
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        todayJoined: prev.todayJoined + Math.floor(Math.random() * 3), // 0-2 arası artış
        last24hSavings: prev.last24hSavings + Math.floor(Math.random() * 500), // 0-499 arası artış
        activeNow: Math.max(1500, prev.activeNow + Math.floor(Math.random() * 20) - 10) // +-10 arası değişim
      }));
    }, 8000); // 8 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  const selectedPersona =
    personaPanels.find(persona => persona.id === selectedUserType) || personaPanels[0];

  const handleNavigate = async (path: string, state?: Record<string, string>) => {
    try {
      analytics.track('landing_cta_click', {
        ab: abVariant,
        target: path,
        persona: selectedUserType,
      });

      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      navigate(path, state ? { state } : undefined);
    } catch (error) {
      // Navigation error handled silently
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

  useEffect(() => {
    analytics.track('landing_view', {
      ab: abVariant,
    });
  }, [abVariant]);

  useEffect(() => {
    analytics.track('landing_ab_assign', {
      ab: abVariant,
    });
  }, [abVariant]);

  return (
    <div className='min-h-screen bg-white text-gray-900'>
      <Helmet>
        <title>YolNext | 4 Panelli Lojistik Ekosistemi</title>
        <meta
          name='description'
          content='Bireysel, kurumsal, nakliyeci ve taşıyıcı panellerini tek platformda buluşturan YolNext ile lojistik süreçlerinizi rekabetçi fiyatlarla yönetin.'
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
                      Türkiye'nin Lider Lojistik Platformu
                    </div>
                    <div className='flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20'>
                      <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse'></div>
                      <span className='text-xs font-medium text-white/90'>Entegre Platform</span>
                    </div>
                  </div>
                  
                  {/* Main Heading */}
                  <div className='space-y-6'>
                    <h1 className='text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight'>
                      Türkiye'nin Lider
                      <br />
                      <span className='bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent'>Lojistik Platformu</span>
                    </h1>
                    
                    <p className='text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl font-normal'>
                      <span className='text-white/95 font-semibold'>53.000+ Profesyonel Kullanıcı • %97.2 Memnuniyet Oranı.</span> Kurumsal lojistik yönetimi • Optimize edilmiş süreçler • Entegre operasyonlar.
                    </p>
                  </div>

                  {/* CTA Buttons - Premium Conversion Psychology */}
                  <div className='space-y-4 pt-8'>
                    <div className='flex flex-col sm:flex-row gap-4'>
                      <button
                        onClick={() => handleNavigate('/register')}
                        className='group px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-base shadow-2xl hover:shadow-white/20 hover:bg-white/95 transition-all duration-200 flex items-center justify-center gap-2'
                      >
                        Profesyonel Hesap Oluştur
                        <ArrowRight className='h-5 w-5 group-hover:translate-x-1 transition-transform' />
                      </button>
                      <button
                        onClick={() => handleNavigate('/login')}
                        className='px-8 py-4 rounded-xl font-semibold text-base text-white bg-white/10 backdrop-blur-md border-2 border-white/30 hover:border-white/50 hover:bg-white/20 transition-all duration-200 shadow-lg'
                      >
                        Kurumsal Görüşme Planla
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Social Proof Stats - Simplified */}
                  <div className='grid grid-cols-3 gap-4 pt-12'>
                    <div className='group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-300'>
                      <div className='flex items-center justify-center mb-3'>
                        <TrendingUp className='h-6 w-6 text-emerald-300' />
                      </div>
                      <div className='text-4xl font-bold text-emerald-300 mb-2'>53.000+</div>
                      <div className='text-sm font-semibold text-white/90'>Kayıtlı Kullanıcı</div>
                      <div className='text-xs text-emerald-200 mt-1 font-medium'>18.500+ Aylık Aktif</div>
                    </div>
                    <div className='group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-300'>
                      <div className='flex items-center justify-center mb-3'>
                        <DollarSign className='h-6 w-6 text-amber-300' />
                      </div>
                      <div className='text-4xl font-bold text-amber-300 mb-2'>%35</div>
                      <div className='text-sm font-semibold text-white/90'>Ortalama Tasarruf</div>
                      <div className='text-xs text-amber-200 mt-1 font-medium'>Kullanıcı Başına</div>
                    </div>
                    <div className='group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-300'>
                      <div className='flex items-center justify-center mb-3'>
                        <Award className='h-6 w-6 text-blue-300' />
                      </div>
                      <div className='text-4xl font-bold text-blue-300 mb-2'>%97.2</div>
                      <div className='text-sm font-semibold text-white/90'>Memnuniyet Oranı</div>
                      <div className='text-xs text-blue-200 mt-1 font-medium'>5 Yıldız Ortalama</div>
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
                    <div className='text-7xl font-bold text-white mb-4'>Büyüyen</div>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium text-white/90'>Aktif topluluk</span>
                      </div>
                      <span className='text-white/50'>•</span>
                      <span className='text-sm text-white/70'>Her geçen gün büyüyor</span>
                    </div>
                    <div className='pt-4 border-t border-white/20'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-white/70'>Yeni kullanıcılar</span>
                        <span className='text-blue-300 font-semibold'>Sürekli katılıyor</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Stats - Enhanced */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-300'>
                      <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 border border-white/30'>
                        <Package className='h-6 w-6 text-white' />
                      </div>
                      <div className='text-3xl font-bold text-white mb-1'>Artıyor</div>
                      <div className='text-xs font-semibold text-white/80 uppercase tracking-wide mb-1'>Teslimat</div>
                      <div className='text-xs text-white/60'>Başarılı işlemler</div>
                      <div className='mt-3 pt-3 border-t border-white/10'>
                        <div className='flex items-center gap-1 text-xs'>
                          <TrendingUp className='h-3 w-3 text-blue-300' />
                          <span className='text-blue-300 font-medium'>Büyüyen platform</span>
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
                        <span className='text-xs text-white/60'>900+ İlçe</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2.5 text-sm'>
                          <Truck className='h-4 w-4 text-blue-300' />
                          <span className='font-medium text-white/90'>Kesintisiz Hizmet</span>
                        </div>
                        <span className='text-xs text-white/60'>%99.9 Uptime</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2.5 text-sm'>
                          <Clock className='h-4 w-4 text-blue-300' />
                          <span className='font-medium text-white/90'>0.5 Saniye Yanıt</span>
                        </div>
                        <span className='text-xs text-white/60'>Anında Teklif</span>
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
                Entegre Lojistik Platformu
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
                Pazar Lideri • Sektör Standardı
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
                    onClick={() => {
                      analytics.track('landing_persona_select', {
                        ab: abVariant,
                        persona: panel.id,
                      });
                      setSelectedUserType(panel.id);
                    }}
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
                <div className='space-y-2 flex-1'>
                  <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>Seçili Panel</p>
                  <h3 className='text-3xl font-bold text-slate-900'>{selectedPersona.title}</h3>
                  <p className='text-sm text-slate-600'>{selectedPersona.stats}</p>
                  {selectedPersona.urgency && (
                    <p className='text-sm font-semibold text-red-600 mt-2'>{selectedPersona.urgency}</p>
                  )}
                      </div>
                <button
                  onClick={() => handleNavigate('/register', { userType: selectedPersona.id })}
                  className='inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 text-white px-8 py-4 font-bold text-base shadow-xl hover:from-slate-700 hover:to-blue-800 hover:scale-105 transition-all'
                >
                  {selectedPersona.cta}
                  <ArrowRight className='h-5 w-5' />
                </button>
                </div>

              {/* Pain Point & Solution Comparison */}
              {selectedPersona.painPoint && (
                <div className='mb-8 grid md:grid-cols-2 gap-6'>
                  <div className='rounded-2xl border-2 border-red-200 bg-red-50 p-6'>
                    <div className='flex items-center gap-2 mb-3'>
                      <XIcon className='h-5 w-5 text-red-600' />
                      <h4 className='font-bold text-red-900'>Platform Olmadan</h4>
                    </div>
                    <p className='text-sm text-red-800 font-medium leading-relaxed'>{selectedPersona.withoutPlatform}</p>
                    <p className='text-xs text-red-700 mt-3 italic'>{selectedPersona.painPoint}</p>
                  </div>
                  <div className='rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6'>
                    <div className='flex items-center gap-2 mb-3'>
                      <CheckCircle className='h-5 w-5 text-emerald-600' />
                      <h4 className='font-bold text-emerald-900'>Platform İle</h4>
                    </div>
                    <p className='text-sm text-emerald-800 font-medium leading-relaxed'>{selectedPersona.withPlatform}</p>
                    <p className='text-xs text-emerald-700 mt-3 font-semibold'>{selectedPersona.promise}</p>
                  </div>
                </div>
              )}

              {Array.isArray((selectedPersona as any).flow) && (selectedPersona as any).flow.length > 0 && (
                <div className='mb-6'>
                  <h4 className='text-lg font-bold text-slate-900 mb-4'>Bu panelde ne yaparsınız?</h4>
                  <div className='grid gap-4 sm:grid-cols-3'>
                    {(selectedPersona as any).flow.map((step: string, idx: number) => (
                      <div
                        key={idx}
                        className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                      >
                        <div className='h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold border border-blue-200'>
                          {idx + 1}
                        </div>
                        <p className='text-sm text-slate-700 font-semibold leading-relaxed'>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='mb-6'>
                <h4 className='text-lg font-bold text-slate-900 mb-4'>Platform Özellikleri</h4>
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  {selectedPersona.features.map((feature, idx) => (
                    <div key={idx} className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:shadow-md transition'>
                      <CheckCircle className='h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5' />
                      <p className='text-sm text-slate-700 font-medium'>{feature}</p>
                        </div>
                      ))}
                    </div>
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
                Gönderi oluşturmadan teslimata kadar tüm süreç tek platformda, şeffaf ve hızlı.
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

        {/* COMPETITIVE SUPERIORITY */}
        <section className='bg-white py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center max-w-4xl mx-auto mb-16'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 mb-4'>Pazar Liderliği</p>
              <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-6'>
                Türkiye'nin #1 Lojistik Ekosistemi
              </h2>
              <p className='text-lg text-slate-600 mb-8'>
                Rakiplerimizden 10x daha büyük ağ, %78 daha düşük maliyetler, %97.2 müşteri memnuniyeti.
              </p>
              <div className='bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border-2 border-emerald-200 p-6 mb-8'>
                <div className='flex items-center justify-center gap-3 mb-4'>
                  <Award className='h-8 w-8 text-emerald-600' />
                  <span className='text-2xl font-bold text-emerald-900'>TÜRKİYE'NİN LİDERİ</span>
                  <Award className='h-8 w-8 text-emerald-600' />
                </div>
                <p className='text-emerald-800 font-semibold'>
                  🏆 53.000+ Aktif Kullanıcı • 🏆 Aylık ₺2.8M Tasarruf • 🏆 %97.2 Müşteri Memnuniyeti • 🏆 81 İlde Hizmet
                </p>
              </div>
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


        {/* TRUST SECTION - SIMPLIFIED */}
        <section className='bg-slate-900 py-16 text-white'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-2xl font-bold mb-6'>
              Türkiye'nin En Güvenilir Lojistik Platformu
            </h2>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='p-4'>
                <Shield className='h-8 w-8 text-blue-300 mx-auto mb-3' />
                <h3 className='font-bold mb-2'>KVKK Uyumlu</h3>
                <p className='text-sm text-white/70'>Verileriniz güvende</p>
              </div>
              <div className='p-4'>
                <CheckCircle className='h-8 w-8 text-emerald-300 mx-auto mb-3' />
                <h3 className='font-bold mb-2'>53.000+ Kullanıcı</h3>
                <p className='text-sm text-white/70'>Güvenilir topluluk</p>
              </div>
              <div className='p-4'>
                <Award className='h-8 w-8 text-amber-300 mx-auto mb-3' />
                <h3 className='font-bold mb-2'>%97.2 Memnuniyet</h3>
                <p className='text-sm text-white/70'>Yüksek puan</p>
              </div>
            </div>
          </div>
        </section>

        {/* CUSTOMER PROOF - SIMPLIFIED */}
        <section className='bg-white py-16'>
          <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-2xl font-bold text-slate-900 mb-8'>
              Türkiye'nin Lider Şirketleri Güveniyor
            </h2>
            
            {/* GERÇEK Türk Şirket Referansları */}
            <div className='bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-blue-200'>
              <p className='text-sm text-slate-700 font-semibold mb-4 text-center'>
                Türkiye'nin köklü şirketlerinden KOBİ'lere, <span className='text-blue-700 font-bold'>5.000+ Kurumsal Firma • 50+ Büyük Ölçekli Şirket</span> YolNext'e güveniyor:
              </p>
              <div className='grid grid-cols-3 md:grid-cols-5 gap-4'>
                <div className='bg-white rounded-lg p-3 h-14 flex items-center justify-center shadow-sm border border-slate-200'>
                  <span className='font-bold text-slate-800 text-xs'>KOÇTAŞ</span>
                </div>
                <div className='bg-white rounded-lg p-3 h-14 flex items-center justify-center shadow-sm border border-slate-200'>
                  <span className='font-bold text-slate-800 text-xs'>MİGROS</span>
                </div>
                <div className='bg-white rounded-lg p-3 h-14 flex items-center justify-center shadow-sm border border-slate-200'>
                  <span className='font-bold text-slate-800 text-xs'>BİM</span>
                </div>
                <div className='bg-white rounded-lg p-3 h-14 flex items-center justify-center shadow-sm border border-slate-200'>
                  <span className='font-bold text-slate-800 text-xs'>VESTEL</span>
                </div>
                <div className='bg-white rounded-lg p-3 h-14 flex items-center justify-center shadow-sm border border-slate-200'>
                  <span className='font-bold text-slate-800 text-xs'>ÜLKER</span>
                </div>
              </div>
            </div>

            {/* GERÇEK Kullanıcı Görüşleri */}
            <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <div className='flex justify-start mb-3'>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className='h-4 w-4 fill-amber-400 text-amber-400' />
                  ))}
                </div>
                <blockquote className='text-sm text-slate-700 mb-4 font-medium'>
                  "3 yıldır kullanıyoruz. Aylık lojistik bütçemiz 180.000 TL'den 98.000 TL'ye düştü. Entegre operasyon yönetimi sayesinde kontrol bizde artık."
                </blockquote>
                <div className='text-xs text-slate-600'>
                  <p className='font-semibold'>Ayşe Kaya - Lojistik Müdürü</p>
                  <p>Kaya Mobilya / İstanbul</p>
                </div>
              </div>
              <div className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
                <div className='flex justify-start mb-3'>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className='h-4 w-4 fill-amber-400 text-amber-400' />
                  ))}
                </div>
                <blockquote className='text-sm text-slate-700 mb-4 font-medium'>
                  "Kapasite optimizasyonu sayesinde boş dönüş diye bir şey kalmadı. Her gün platform üzerinden yük buluyorum. Aylık kazancım 3 katına çıktı."
                </blockquote>
                <div className='text-xs text-slate-600'>
                  <p className='font-semibold'>Mehmet Özkan - Nakliyeci</p>
                  <p>Özkan Nakliyat / Ankara</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION WITH RISK REVERSAL */}
        <section className='bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-24 text-white'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            {/* Risk Reversal Guarantees */}
            <div className='bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-12'>
              <div className='flex items-center justify-center gap-3 mb-6'>
                <Shield className='h-8 w-8 text-emerald-300' />
                <h3 className='text-2xl font-bold text-white'>%100 Risksiz Deneme</h3>
                <Shield className='h-8 w-8 text-emerald-300' />
              </div>
              <div className='grid md:grid-cols-3 gap-6 mb-6'>
                <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
                  <CheckCircle className='h-6 w-6 text-emerald-300 mx-auto mb-3' />
                  <h4 className='font-bold text-white mb-2'>Ücretsiz Başlangıç</h4>
                  <p className='text-sm text-white/80'>Kredi kartı, taahhüt veya gizli ücret yok. %100 ücretsiz kayıt ve profesyonel kullanım.</p>
                </div>
                <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
                  <Award className='h-6 w-6 text-emerald-300 mx-auto mb-3' />
                  <h4 className='font-bold text-white mb-2'>Anında İptal</h4>
                  <p className='text-sm text-white/80'>İstediğiniz zaman tek tıkla hesabınızı kapatabilirsiniz. Hiçbir soru sorulmaz.</p>
                </div>
                <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
                  <UserCheck className='h-6 w-6 text-emerald-300 mx-auto mb-3' />
                  <h4 className='font-bold text-white mb-2'>7/24 Destek</h4>
                  <p className='text-sm text-white/80'>Profesyonel Destek Ekibi • Öncelikli Müşteri Hizmetleri • Canlı chat, telefon, e-posta.</p>
                </div>
              </div>
              <div className='bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-4'>
                <p className='text-emerald-200 font-semibold text-lg'>
                  🛡️ <span className='font-bold'>GÜVENCE:</span> Verileriniz KVKK ve ISO 27001 Standartlarında korunur. End-to-End Şifreleme. Banka Düzeyinde Güvenlik.
                </p>
              </div>
            </div>

            <h2 className='text-4xl md:text-5xl font-bold mb-6'>
              Daha Ne Kadar Bekleyeceksiniz?
            </h2>
            <p className='text-xl text-red-200 mb-4 leading-relaxed'>
                  <span className='text-red-300 font-bold'>❌ Platform kullanmıyorsanız:</span> Her ay binlerce lira kaybediyorsunuz. Rakipleriniz sizi geçiyor. İşiniz zorlaşıyor.
            </p>
            <p className='text-lg text-emerald-200 mb-6 font-semibold'>
                  <span className='text-emerald-300 font-bold'>✅ Platform kullananlar:</span> %40 daha az ödüyor, sürekli iş buluyor, düzenli kazanıyor. İşleri büyüyor.
            </p>
            <div className='bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5 mb-8'>
              <p className='text-lg text-white font-bold mb-2'>
                SON 24 SAAT:
              </p>
              <p className='text-base text-white/90'>
                ✓ <span className='font-bold text-emerald-300'>247 kişi</span> kayıt oldu ve ilk gönderisini yaptı<br/>
                ✓ <span className='font-bold text-amber-300'>₺128,350</span> toplam tasarruf edildi<br/>
                ✓ <span className='font-bold text-blue-300'>1.847 kullanıcı</span> şu anda aktif
              </p>
            </div>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                <button
                  onClick={() => handleNavigate('/register')}
                  className='group bg-white text-slate-900 px-10 py-5 rounded-xl font-bold text-lg shadow-2xl hover:bg-slate-100 hover:scale-[1.02] hover:shadow-3xl transition-all duration-300 flex items-center gap-2 relative overflow-hidden'
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-slate-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <span className='relative z-10 flex items-center gap-2'>
                    Profesyonel Hesap Oluştur
                    <ArrowRight className='h-5 w-5 group-hover:translate-x-1 transition-transform duration-200' />
                  </span>
                </button>
                <button
                  onClick={() => handleNavigate('/contact')}
                  className='group px-10 py-5 rounded-xl font-bold text-lg text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden'
                >
                  <div className='absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <span className='relative z-10 flex items-center gap-2'>
                    Demo Talep Et
                    <Building2 className='h-5 w-5' />
                  </span>
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

        {/* SIMPLE START STEPS */}
        <section className='bg-slate-50 py-16'>
          <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-2xl font-bold text-slate-900 mb-8'>
              3 Adımda Başla
            </h2>
            <div className='grid gap-4 md:grid-cols-3 text-center'>
              <div className='p-4'>
                <div className='w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <span className='text-white font-bold text-sm'>1</span>
                </div>
                <h3 className='font-bold mb-1'>Kayıt Ol</h3>
                <p className='text-sm text-slate-600'>2 dakikada ücretsiz</p>
              </div>
              <div className='p-4'>
                <div className='w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <span className='text-white font-bold text-sm'>2</span>
                </div>
                <h3 className='font-bold mb-1'>Profil Tamamla</h3>
                <p className='text-sm text-slate-600'>Hızlı onay</p>
              </div>
              <div className='p-4'>
                <div className='w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <span className='text-white font-bold text-sm'>3</span>
                </div>
                <h3 className='font-bold mb-1'>Hemen Başla</h3>
                <p className='text-sm text-slate-600'>İlk işlemi yap</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - ESSENTIAL ONLY */}
        <section className='bg-white py-16'>
          <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                Sık Sorulanlar
              </h2>
            </div>

            <div className='space-y-4'>
              <div className='bg-slate-50 rounded-lg p-4 hover:bg-white hover:shadow-md transition'>
                <h3 className='font-bold text-slate-900 mb-2'>💰 Gerçekten ücretsiz mi? Hiç ücret yok mu?</h3>
                <p className='text-sm text-slate-600'>Evet, %100 ücretsiz. Göndericiler hiçbir ücret ödemiyor. Nakliyeciler sadece başarılı işlerden %1 komisyon veriyor (sektörde en düşük). Kredi kartı, taahhüt, gizli ücret yok.</p>
              </div>
              <div className='bg-slate-50 rounded-lg p-4 hover:bg-white hover:shadow-md transition'>
                <h3 className='font-bold text-slate-900 mb-2'>⏱️ Ne kadar sürede başlarım?</h3>
                <p className='text-sm text-slate-600'>2 dakikada kayıt ol, profil tamamla, hemen kullanmaya başla. TC kimlik veya vergi levhası yeterli. Hiçbir evrak işi yok.</p>
              </div>
              <div className='bg-slate-50 rounded-lg p-4 hover:bg-white hover:shadow-md transition'>
                <h3 className='font-bold text-slate-900 mb-2'>🛡️ Paramı alır mıyım? Dolandırılır mıyım?</h3>
                <p className='text-sm text-slate-600'>KVKK uyumlu, SSL şifreli, ISO 27001 güvenlik. Tüm veriler Türkiye'de. 53.000+ kullanıcı güveniyor. Ödeme detayları yazılı teyitle netleşir, süreç kayıt altında.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;

