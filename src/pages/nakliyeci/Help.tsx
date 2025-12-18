import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Truck,
  Package,
  MapPin,
  DollarSign,
  Shield,
  MessageCircle,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  Bell,
  BarChart3,
  Users,
  Settings,
  AlertCircle,
  Info,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Briefcase,
  UserPlus,
  FileCheck,
  Calendar,
  Route,
  Award,
  Filter,
  Navigation,
  TrendingDown,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const NakliyeciHelp = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/nakliyeci/dashboard' },
    { label: 'Yardım', href: '/nakliyeci/help' },
  ];

  const quickActions = [
    {
      title: 'Yük Pazarı',
      description: 'Açık gönderileri görüntüleyin ve teklif verin',
      icon: Package,
      link: '/nakliyeci/jobs',
    },
    {
      title: 'Aktif Yükler',
      description: 'Kabul edilen gönderilerinizi yönetin',
      icon: Truck,
      link: '/nakliyeci/active-shipments',
    },
    {
      title: 'Taşıyıcılarım',
      description: 'Taşıyıcılarınızı yönetin ve atama yapın',
      icon: Users,
      link: '/nakliyeci/drivers',
    },
    {
      title: 'Analitik',
      description: 'İş performansınızı analiz edin',
      icon: BarChart3,
      link: '/nakliyeci/analytics',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Hesap Oluşturun',
      description: 'Nakliyeci hesabı oluşturun ve doğrulayın',
      icon: Truck,
    },
    {
      step: 2,
      title: 'Açık Gönderileri İnceleyin',
      description: 'Yük Pazarından açık gönderileri görüntüleyin',
      icon: Package,
    },
    {
      step: 3,
      title: 'Teklif Verin',
      description: 'Uygun gönderiler için teklif oluşturun',
      icon: DollarSign,
    },
    {
      step: 4,
      title: 'Taşıyıcı Ata',
      description: 'Kabul edilen gönderileri taşıyıcılarınıza atayın',
      icon: UserPlus,
    },
    {
      step: 5,
      title: 'Takip ve Ödeme',
      description: 'Gönderileri takip edin ve ödemeleri alın',
      icon: DollarSign,
    },
  ];

  const faqCategories = [
    {
      category: 'Başlangıç',
      icon: Zap,
      items: [
        {
          question: 'Nakliyeci hesabı nasıl oluşturulur?',
          answer: 'Kayıt sayfasından "Nakliyeci" seçeneğini seçin. Şirket bilgilerinizi girin:\n• Şirket adı\n• Vergi numarası\n• Vergi dairesi\n• İletişim bilgileri\n• Yetkili kişi bilgileri\n\nBelgelerinizi yükleyin (vergi kayıt belgesi, taşımacılık belgesi vb.). Hesabınız doğrulandıktan sonra gönderilere teklif vermeye başlayabilirsiniz. Doğrulama genellikle 1-2 iş günü içinde tamamlanır.',
          keywords: ['hesap', 'nakliyeci', 'oluştur', 'kayıt', 'doğrulama'],
        },
        {
          question: 'Nakliyeci olmanın avantajları nelerdir?',
          answer: 'Nakliyeci olarak:\n• Açık gönderilere teklif verme\n• Taşıyıcı yönetimi ve atama\n• Detaylı analitik ve raporlama\n• Güvenli ödeme sistemi\n• Müşteri yönetimi ve iletişim\n• Rota planlama araçları\n• Performans takibi\n• Komisyon: Sadece %1 (platform ücreti)\n\nPlatform tamamen ücretsizdir, sadece tamamlanan gönderiler için %1 komisyon alınır.',
          keywords: ['avantaj', 'özellik', 'nakliyeci', 'fayda', 'komisyon'],
        },
        {
          question: 'Komisyon oranı nedir?',
          answer: 'YolNext platformu tamamlanan her gönderi için %1 komisyon alır. Bu komisyon:\n• Gönderi teslim edilip gönderici onay verdiğinde kesilir\n• Komisyon platform ücretidir\n\nKomisyon dışında hiçbir ücret yoktur. Platform kullanımı tamamen ücretsizdir.',
          keywords: ['komisyon', '%1', 'ücret', 'ödeme'],
        },
        {
          question: 'Hesap doğrulama süreci nasıl işler?',
          answer: 'Doğrulama süreci:\n1. Şirket bilgileriniz kontrol edilir\n2. Vergi numarası doğrulanır\n3. Yüklediğiniz belgeler incelenir (vergi kayıt belgesi, taşımacılık belgesi vb.)\n4. Doğrulama tamamlandığında e-posta ile bilgilendirilirsiniz\n\nDoğrulama genellikle 1-2 iş günü içinde tamamlanır. Doğrulama sonrası gönderilere teklif vermeye başlayabilirsiniz.',
          keywords: ['doğrulama', 'süreç', 'belge', 'onay'],
        },
      ],
    },
    {
      category: 'Teklif Verme',
      icon: DollarSign,
      items: [
        {
          question: 'Gönderilere nasıl teklif veririm?',
          answer: 'Yük Pazarı sayfasından açık gönderileri görüntüleyin:\n1. İlgilendiğiniz gönderiye tıklayın\n2. Gönderi detaylarını inceleyin (kategori, ağırlık, hacim, adresler, özel gereksinimler)\n3. "Teklif Ver" butonuna basın\n4. Fiyat, teslimat süresi ve özel notlarınızı girin\n5. Teklifi gönderin\n\nGönderici teklifinizi görüntüleyip kabul edebilir veya reddedebilir.',
          keywords: ['teklif', 'ver', 'nasıl', 'gönderi', 'fiyat'],
        },
        {
          question: 'Teklif fiyatını nasıl belirlemeliyim?',
          answer: 'Teklif fiyatını belirlerken şu faktörleri göz önünde bulundurun:\n• Mesafe (km)\n• Ağırlık ve hacim\n• Özel gereksinimler (kırılgan, soğuk zincir, acil vb.)\n• Yakıt maliyetleri\n• Araç ve işçilik maliyetleri\n• Kar marjı\n\nPlatform üzerinden benzer gönderilerin fiyatlarını inceleyerek rekabetçi bir fiyat belirleyebilirsiniz. Düşük fiyat daha fazla kabul şansı sağlar, ancak karlılığınızı da koruyun.',
          keywords: ['fiyat', 'belirle', 'hesapla', 'maliyet', 'kar'],
        },
        {
          question: 'Teklifimi nasıl düzenleyebilirim?',
          answer: 'Teklif verildikten sonra gönderici kabul etmeden önce:\n• Teklifinizi düzenleyebilirsiniz (fiyat, süre, notlar)\n• Teklifinizi iptal edebilirsiniz\n\nGönderici kabul ettikten sonra teklif değiştirilemez. Eğer değişiklik yapmanız gerekiyorsa, gönderici ile iletişime geçmeniz gerekir.',
          keywords: ['düzenle', 'değiştir', 'güncelle', 'iptal'],
        },
        {
          question: 'Kaç gönderiye teklif verebilirim?',
          answer: 'Sınırsız sayıda gönderiye teklif verebilirsiniz. Ancak:\n• Kabul edilen gönderileri zamanında teslim etmeniz önemlidir\n• Çok fazla teklif verip az kabul almak yerine, uygun gönderilere odaklanın\n• Teklif kabul oranınız performans puanınızı etkiler\n\nAktif gönderilerinizi yönetebilir ve kapasitenize göre teklif verebilirsiniz.',
          keywords: ['sınırsız', 'kaç', 'limit', 'kapasite'],
        },
        {
          question: 'Teklif kabul oranını nasıl artırabilirim?',
          answer: 'Teklif kabul oranını artırmak için:\n• Rekabetçi fiyatlar belirleyin\n• Hızlı teslimat süreleri sunun\n• Yüksek performans puanına sahip olun\n• Gönderici ile iletişime geçin ve sorularını yanıtlayın\n• Özel notlar ekleyerek profesyonelliğinizi gösterin\n• Zamanında teslimat yaparak güven oluşturun\n\nYüksek kabul oranı daha fazla iş ve daha iyi puan anlamına gelir.',
          keywords: ['kabul', 'oran', 'artır', 'başarı', 'performans'],
        },
        {
          question: 'Rota planlama nasıl çalışır?',
          answer: 'Rota Planlama sayfasından:\n• Birden fazla gönderiyi tek rotada birleştirebilirsiniz\n• Optimize edilmiş rota önerileri alabilirsiniz\n• Mesafe ve süre hesaplamaları yapabilirsiniz\n• Yakıt maliyetlerini hesaplayabilirsiniz\n\nRota planlama ile daha verimli çalışabilir ve maliyetlerinizi düşürebilirsiniz.',
          keywords: ['rota', 'planlama', 'optimize', 'mesafe'],
        },
      ],
    },
    {
      category: 'Taşıyıcı Yönetimi',
      icon: Users,
      items: [
        {
          question: 'Taşıyıcı nasıl eklenir?',
          answer: 'Taşıyıcılarım sayfasından:\n1. "Taşıyıcı Ekle" butonuna tıklayın\n2. Taşıyıcı bilgilerini girin (ad, soyad, telefon, e-posta)\n3. Araç bilgilerini girin (plaka, model, tip)\n4. Belgelerini yükleyin (ehliyet, ruhsat)\n5. Kaydedin\n\nTaşıyıcı hesabı oluşturulduktan sonra görevlere atayabilirsiniz. Taşıyıcı kendi hesabı ile giriş yapar ve görevlerini görüntüler.',
          keywords: ['taşıyıcı', 'ekle', 'yönet', 'araç'],
        },
        {
          question: 'Gönderiyi taşıyıcıya nasıl atarım?',
          answer: 'Aktif Yükler sayfasından:\n1. Gönderiyi seçin\n2. "Taşıyıcıya Ata" butonuna tıklayın\n3. Mevcut taşıyıcılarınızdan birini seçin\n4. Veya "Yeni İlan Oluştur" ile taşıyıcı pazarına ilan verin\n5. Atama yapın\n\nTaşıyıcı atandıktan sonra gönderi durumu güncellenir ve taşıyıcıya bildirim gönderilir.',
          keywords: ['ata', 'taşıyıcı', 'görev', 'ilan'],
        },
        {
          question: 'Taşıyıcı performansını nasıl takip ederim?',
          answer: 'Taşıyıcılarım sayfasından:\n• Her taşıyıcının istatistiklerini görüntüleyebilirsiniz\n• Tamamlanan görev sayısı\n• Ortalama puan\n• Tamamlanma oranı\n• Toplam kazanç\n• Son aktivite tarihi\n\nPerformans verilerine göre taşıyıcıları değerlendirebilir ve ödüllendirebilirsiniz.',
          keywords: ['performans', 'takip', 'istatistik', 'puan'],
        },
        {
          question: 'Taşıyıcı ile nasıl iletişim kurarım?',
          answer: 'Gönderi detay sayfasından taşıyıcı ile mesajlaşabilirsiniz:\n• Mesaj gönderebilirsiniz\n• Durum güncellemeleri isteyebilirsiniz\n• Sorularınızı sorabilirsiniz\n\nAyrıca telefon numarası üzerinden de iletişim kurabilirsiniz. Tüm mesajlaşmalar kayıt altına alınır.',
          keywords: ['iletişim', 'mesaj', 'taşıyıcı', 'sohbet'],
        },
        {
          question: 'Taşıyıcı pazarı nedir?',
          answer: 'Taşıyıcı pazarı, gönderilerinizi taşıyıcılara ilan vererek atama yapabileceğiniz bir sistemdir:\n• Gönderi için ilan oluşturun\n• Taşıyıcılar ilanı görüntüleyip başvurabilir\n• Başvuran taşıyıcılardan birini seçin\n• Atama yapın\n\nBu sistem ile daha geniş bir taşıyıcı havuzuna erişebilirsiniz.',
          keywords: ['pazar', 'ilan', 'başvuru', 'taşıyıcı'],
        },
      ],
    },
    {
      category: 'Gönderi Takibi',
      icon: MapPin,
      items: [
        {
          question: 'Gönderileri nasıl takip ederim?',
          answer: 'Aktif Yükler sayfasından tüm gönderilerinizin durumunu görebilirsiniz:\n• Beklemede: Teklif bekleniyor\n• Teklif Kabul Edildi: Gönderici teklifinizi kabul etti\n• Taşıyıcı Atandı: Gönderi taşıyıcıya atandı\n• Yola Çıktı: Taşıyıcı gönderiyi aldı ve yola çıktı\n• Teslimatta: Gönderi teslimat adresine yaklaştı\n• Teslim Edildi: Gönderi başarıyla teslim edildi\n\nCanlı takip özelliği ile taşıyıcının konumunu gerçek zamanlı takip edebilirsiniz.',
          keywords: ['takip', 'durum', 'canlı', 'konum'],
        },
        {
          question: 'Gönderi durumlarını nasıl güncellerim?',
          answer: 'Gönderi durumları genellikle taşıyıcı tarafından güncellenir:\n• Taşıyıcı gönderiyi aldığında: "Yola Çıktı"\n• Teslimat adresine yaklaştığında: "Teslimatta"\n• Teslim ettiğinde: "Teslim Edildi"\n\nAncak siz de gönderi detay sayfasından durum güncellemesi yapabilirsiniz. Durum güncellemeleri otomatik olarak göndericiye bildirilir.',
          keywords: ['durum', 'güncelle', 'taşıyıcı'],
        },
        {
          question: 'Canlı takip nasıl çalışır?',
          answer: 'Canlı takip özelliği ile:\n• Taşıyıcının gerçek zamanlı konumunu görebilirsiniz\n• Harita üzerinde gönderinin nerede olduğunu görebilirsiniz\n• Tahmini varış süresini görebilirsiniz\n• Rota bilgisini görebilirsiniz\n\nBu özellik taşıyıcı gönderiyi aldıktan sonra aktif olur. Taşıyıcının konum paylaşımı açık olmalıdır.',
          keywords: ['canlı takip', 'konum', 'harita', 'rota'],
        },
        {
          question: 'Teslimat nasıl onaylanır?',
          answer: 'Teslimat süreci:\n1. Taşıyıcı gönderiyi teslim eder\n2. Gönderici teslimatı kontrol eder\n3. Gönderici teslimatı onaylar\n4. Onay sonrası ödeme süreci başlar\n5. Ödeme gönderici ile anlaşmanıza göre yapılır (komisyon düşülür)\n\nGönderici onay vermezse, durum "Beklemede" olarak kalır ve iletişime geçmeniz gerekir.',
          keywords: ['teslimat', 'onay', 'gönderici', 'ödeme'],
        },
        {
          question: 'Gönderi gecikirse ne yapmalıyım?',
          answer: 'Gönderi gecikirse:\n1. Gönderici ile iletişime geçin ve durumu açıklayın\n2. Yeni teslimat tarihi belirleyin\n3. Gerekirse taşıyıcı ile iletişime geçin\n4. Sorun devam ederse destek ekibimizle iletişime geçin\n\nGecikme durumunda göndericiye bilgi vermeniz önemlidir. İletişim kurarak sorunları çözebilirsiniz.',
          keywords: ['gecikme', 'sorun', 'iletişim', 'tarih'],
        },
      ],
    },
    {
      category: 'Ödeme ve Komisyon',
      icon: DollarSign,
      items: [
        {
          question: 'Ödemeleri nasıl alırım?',
          answer: 'Tamamlanan gönderiler için ödemeler gönderici ile anlaşmanıza göre yapılır:\n• Gönderi teslim edilip gönderici onay verdiğinde\n• Ödeme süreci gönderici ile anlaşmanıza bağlıdır\n• Platform %1 komisyon alır\n\nÖdeme detayları gönderici ile görüşülerek belirlenir.',
          keywords: ['ödeme', 'al', 'gönderici', 'teslimat'],
        },
        {
          question: 'Komisyon ne zaman kesilir?',
          answer: 'Komisyon (%1) gönderi teslim edilip gönderici onay verdiğinde otomatik olarak kesilir:\n• Komisyon platform ücretidir\n• Komisyon gönderi fiyatı üzerinden hesaplanır\n\nKomisyon dışında hiçbir ücret yoktur. Platform kullanımı tamamen ücretsizdir.',
          keywords: ['komisyon', '%1', 'kes', 'ücret'],
        },
        {
          question: 'Fatura nasıl alırım?',
          answer: 'Tamamlanan gönderiler için otomatik olarak e-fatura oluşturulur:\n• Faturalar sayfasından tüm faturalarınızı görüntüleyebilirsiniz\n• Fatura detayları: gönderi bilgileri, gönderici bilgileri, ödeme bilgileri, tarih ve fiyat\n• Faturaları PDF olarak indirebilirsiniz\n• Fatura numarası ile takip edebilirsiniz\n\nFaturalar muhasebe sisteminize aktarılabilir.',
          keywords: ['fatura', 'e-fatura', 'indir', 'pdf'],
        },
        {
          question: 'Ödeme geçmişini nasıl görüntülerim?',
          answer: 'Ödeme geçmişi:\n• Gönderilerim sayfasından tamamlanan gönderilerinizi görebilirsiniz\n• Gönderi bazlı ödeme detayları\n• Komisyon kesintileri\n• Tarih ve tutar bilgileri\n\nAnalitik sayfasından toplu ödeme raporları alabilirsiniz.',
          keywords: ['ödeme', 'geçmiş', 'rapor', 'gönderi'],
        },
      ],
    },
    {
      category: 'Analitik ve Raporlama',
      icon: BarChart3,
      items: [
        {
          question: 'Hangi raporlar mevcuttur?',
          answer: 'Detaylı analitik ve raporlar:\n• Gönderi istatistikleri (toplam, kabul edilen, tamamlanan)\n• Kazanç analizleri (günlük, haftalık, aylık)\n• Taşıyıcı performans raporları\n• Kategori bazlı analizler\n• Zaman bazlı trendler\n• Teklif kabul oranı\n• Ortalama gönderi değeri\n• Toplam kazanç\n\nRaporları görsel grafikler ve tablolar halinde görüntüleyebilirsiniz.',
          keywords: ['rapor', 'analitik', 'istatistik', 'grafik'],
        },
        {
          question: 'Raporları nasıl dışa aktarırım?',
          answer: 'Raporları dışa aktarma:\n1. Analitik sayfasından istediğiniz raporu seçin\n2. Tarih aralığı belirleyin\n3. "Dışa Aktar" butonuna tıklayın\n4. Format seçin (CSV, Excel, PDF)\n5. İndirin\n\nÖzel tarih aralığı seçerek detaylı raporlar oluşturabilirsiniz.',
          keywords: ['dışa aktar', 'excel', 'csv', 'pdf'],
        },
        {
          question: 'Performans metrikleri nelerdir?',
          answer: 'Performans metrikleri:\n• Teklif kabul oranı\n• Ortalama gönderi değeri\n• Toplam kazanç\n• Tamamlanan gönderi sayısı\n• Ortalama puan\n• Taşıyıcı performansı\n• Kategori bazlı başarı oranı\n\nBu metrikler işinizi geliştirmenize yardımcı olur.',
          keywords: ['performans', 'metrik', 'başarı', 'oran'],
        },
      ],
    },
    {
      category: 'İptal ve Sorunlar',
      icon: AlertCircle,
      items: [
        {
          question: 'Teklifi iptal edebilir miyim?',
          answer: 'Gönderici kabul etmeden önce teklifinizi iptal edebilirsiniz:\n• Teklifler sayfasından teklifinizi seçin\n• "İptal Et" butonuna tıklayın\n• Onaylayın\n\nAncak kabul edilen teklifler için iptal koşulları gönderici ile anlaşmanıza bağlıdır. İptal durumunda gönderici ile iletişime geçmeniz gerekir.',
          keywords: ['iptal', 'teklif', 'vazgeç'],
        },
        {
          question: 'Gönderi iptal edilirse ne olur?',
          answer: 'Gönderi iptal edilirse:\n• Gönderici iptal ederse: İptal koşullarına göre iade yapılır\n• Siz iptal ederseniz: Gönderici ile anlaşmanız gerekir\n• İptal durumunda ödeme yapılmaz\n• İptal edilen gönderiler raporlarda görüntülenir\n\nİptal işlemi Gönderilerim sayfasından yapılır.',
          keywords: ['iptal', 'gönderi', 'iade', 'ödeme'],
        },
        {
          question: 'Sorun yaşarsam ne yapmalıyım?',
          answer: 'Herhangi bir sorun yaşarsanız:\n• Gönderi detay sayfasından gönderici ile iletişime geçin\n• Mesaj göndererek sorunu açıklayın\n• Destek ekibimizle iletişime geçin\n• Şikayet sayfasından sorununuzu bildirin\n\nTüm iletişimler kayıt altına alınır ve değerlendirilir.',
          keywords: ['sorun', 'şikayet', 'iletişim', 'destek'],
        },
        {
          question: 'Gönderi hasar gördüyse ne yapmalıyım?',
          answer: 'Gönderi hasar gördüyse:\n1. Hemen gönderici ile iletişime geçin\n2. Durumu bildirin\n3. Hasar fotoğrafları çekin\n4. Taşıyıcı ile iletişime geçin\n5. Destek ekibimizle iletişime geçin\n\nHasar durumunda sigorta kapsamı ve çözüm süreçleri değerlendirilir.',
          keywords: ['hasar', 'bozuk', 'sorun', 'sigorta'],
        },
      ],
    },
  ];

  const allFAQs = faqCategories.flatMap(cat => cat.items);

  const filteredFAQs = useMemo(() => {
    if (!searchTerm.trim()) {
      if (selectedCategory) {
        const category = faqCategories.find(cat => cat.category === selectedCategory);
        return category ? category.items : [];
      }
      return allFAQs;
    }

    const searchLower = searchTerm.toLowerCase();
    return allFAQs.filter(faq => {
      const questionMatch = faq.question.toLowerCase().includes(searchLower);
      const answerMatch = faq.answer.toLowerCase().includes(searchLower);
      const keywordMatch = faq.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower));
      return questionMatch || answerMatch || keywordMatch;
    });
  }, [searchTerm, selectedCategory, allFAQs, faqCategories]);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    setSearchTerm('');
    const categoryIndex = faqCategories.findIndex(cat => cat.category === category);
    if (categoryIndex !== -1) {
      const firstFAQIndex = faqCategories.slice(0, categoryIndex).reduce((acc, cat) => acc + cat.items.length, 0);
      setOpenFAQ(firstFAQIndex);
    }
  };

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Yardım ve Destek - Nakliyeci | YolNext</title>
        <meta name="description" content="YolNext nakliyeci yardım ve destek sayfası. Nakliyeciler için özel rehber ve SSS." />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                <Truck className='w-8 h-8 text-white' />
              </div>
              <div className='flex-1'>
                <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                  Nakliyeci Yardım Merkezi
                </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Nakliyeci olarak platformu nasıl kullanacağınız hakkında kapsamlı bilgiler. Sorularınızın cevaplarını burada bulabilirsiniz.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Sorunuzu yazın ve arayın... (örn: teklif nasıl verilir, taşıyıcı nasıl atanır)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedCategory(null);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 border border-white/20 bg-white/10 backdrop-blur-sm rounded-xl focus:border-white/40 focus:ring-2 focus:ring-white/20 outline-none transition-all text-white placeholder:text-slate-300"
                />
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-slate-300">
                  <strong>{filteredFAQs.length}</strong> sonuç bulundu
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group'
              >
                <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center mb-4'>
                  <Icon className='w-6 h-6 text-white' />
                </div>
                <h3 className='text-base font-semibold text-slate-900 mb-2'>
                  {action.title}
                </h3>
                <p className='text-sm text-slate-600 mb-4'>
                  {action.description}
                </p>
                <div className='flex items-center text-slate-900 font-medium text-sm group-hover:gap-2 transition-all'>
                  Başla <ArrowRight className='w-4 h-4 ml-1 group-hover:ml-2' />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Getting Started Guide */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
              <Zap className='w-6 h-6 text-white' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-slate-900'>Nakliyeci Kullanım Rehberi</h2>
              <p className='text-slate-600'>5 adımda nakliyeci olarak platformu kullanmaya başlayın</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            {guideSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className='relative'>
                  <div className='bg-slate-50 border border-gray-100 rounded-lg p-5 h-full'>
                    <div className='flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg mb-3 mx-auto'>
                      <Icon className='w-5 h-5 text-white' />
                    </div>
                    <div className='absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-slate-800 to-blue-900 text-white rounded-full flex items-center justify-center font-bold text-xs'>
                      {step.step}
                    </div>
                    <h3 className='text-sm font-semibold text-slate-900 mb-2 text-center'>
                      {step.title}
                    </h3>
                    <p className='text-xs text-slate-600 text-center'>
                      {step.description}
                    </p>
                  </div>
                  {index < guideSteps.length - 1 && (
                    <div className='hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2'>
                      <ArrowRight className='w-4 h-4 text-slate-400' />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6'>
          <div className='flex items-center gap-3 mb-6'>
            <FileText className='w-6 h-6 text-slate-900' />
            <h2 className='text-2xl font-bold text-slate-900'>Sık Sorulan Sorular</h2>
          </div>

          {!searchTerm && (
            <div className='mb-6'>
              <div className='flex flex-wrap gap-2'>
                {faqCategories.map((category, index) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.category;
                  return (
                    <button
                      key={index}
                      onClick={() => handleCategoryClick(category.category)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className='w-4 h-4' />
                      {category.category}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className='space-y-3'>
            {filteredFAQs.map((item, index) => {
              const isOpen = openFAQ === index;
              return (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-all'
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className='w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors'
                  >
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center'>
                          <Info className='w-4 h-4 text-slate-600' />
                        </div>
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-base font-semibold text-slate-900 mb-1'>
                          {item.question}
                        </h3>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className='w-5 h-5 text-slate-400 flex-shrink-0 ml-4' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-slate-400 flex-shrink-0 ml-4' />
                    )}
                  </button>
                  {isOpen && (
                    <div className='px-4 pb-4 pt-0 border-t border-gray-200'>
                      <div className='pl-11 pt-3'>
                        <p className='text-slate-600 leading-relaxed text-sm whitespace-pre-line'>{item.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {searchTerm && filteredFAQs.length === 0 && (
            <div className='text-center py-12'>
              <Search className='w-12 h-12 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-600 mb-2'>Aradığınız soru bulunamadı.</p>
              <p className='text-slate-500 text-sm'>Lütfen farklı bir arama terimi deneyin veya yukarıdaki kategorilere bakın.</p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-32 translate-x-32'></div>
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-24 -translate-x-24'></div>
          
          <div className='relative z-10 text-center'>
            <Shield className='w-12 h-12 mx-auto mb-4 text-white' />
            <h2 className='text-2xl font-bold mb-3'>Hala Yardıma İhtiyacınız mı Var?</h2>
            <p className='text-slate-200 mb-8 max-w-2xl mx-auto'>
              Sorularınız için bizimle iletişime geçebilirsiniz. Destek ekibimiz size yardımcı olmaktan mutluluk duyar.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Link
                to='/contact'
                className='bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-lg'
              >
                <MessageCircle className='w-5 h-5' />
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NakliyeciHelp;
