import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Truck,
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
  User,
  Award,
  Route,
  Navigation,
  Calendar,
  FileCheck,
  Filter,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';

const TasiyiciHelp = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/tasiyici/dashboard' },
    { label: 'Yardım', href: '/tasiyici/help' },
  ];

  const quickActions = [
    {
      title: 'İş Pazarı',
      description: 'Açık ilanları görüntüleyin ve başvurun',
      icon: Briefcase,
      link: '/tasiyici/market',
    },
    {
      title: 'Aktif İşler',
      description: 'Atanmış görevlerinizi takip edin',
      icon: Truck,
      link: '/tasiyici/active-jobs',
    },
    {
      title: 'Ayarlar',
      description: 'Profil ve belgelerinizi yönetin',
      icon: Settings,
      link: '/tasiyici/settings',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Hesap Oluşturun',
      description: 'Taşıyıcı hesabı oluşturun ve belgelerinizi yükleyin',
      icon: User,
    },
    {
      step: 2,
      title: 'İş Pazarını İnceleyin',
      description: 'Açık ilanları görüntüleyin ve uygun işleri bulun',
      icon: Briefcase,
    },
    {
      step: 3,
      title: 'Başvuru Yapın',
      description: 'İlgilendiğiniz işlere başvuru yapın',
      icon: CheckCircle,
    },
    {
      step: 4,
      title: 'Görevi Tamamlayın',
      description: 'Atanan görevleri tamamlayın ve durum güncellemesi yapın',
      icon: Truck,
    },
  ];

  const faqCategories = [
    {
      category: 'Başlangıç',
      icon: Zap,
      items: [
        {
          question: 'Taşıyıcı hesabı nasıl oluşturulur?',
          answer: 'Kayıt sayfasından "Taşıyıcı" seçeneğini seçin. Kişisel bilgilerinizi girin:\n• Ad, soyad\n• Telefon numarası\n• E-posta adresi\n• Adres bilgileri\n• Araç bilgileri (plaka, model, tip)\n\nBelgelerinizi yükleyin:\n• Ehliyet\n• Araç ruhsatı\n• Kimlik belgesi\n\nHesabınız doğrulandıktan sonra işlere başvurmaya başlayabilirsiniz. Doğrulama genellikle 1-2 iş günü içinde tamamlanır.',
          keywords: ['hesap', 'taşıyıcı', 'oluştur', 'kayıt', 'belge'],
        },
        {
          question: 'Taşıyıcı olmanın avantajları nelerdir?',
          answer: 'Taşıyıcı olarak:\n• Esnek çalışma saatleri\n• Çeşitli iş fırsatları\n• Güvenli ödeme sistemi\n• Performans bazlı kazanç\n• Nakliyeci ile doğrudan iletişim\n• Kolay görev yönetimi\n• Performans takibi ve puan sistemi\n• Düzenli iş fırsatları\n\nPlatform tamamen ücretsizdir. Ödemeler nakliyeci ile anlaşmanıza göre yapılır.',
          keywords: ['avantaj', 'özellik', 'taşıyıcı', 'fayda'],
        },
        {
          question: 'Hangi belgeler gereklidir?',
          answer: 'Zorunlu belgeler:\n• Ehliyet (geçerli)\n• Araç ruhsatı\n• Kimlik belgesi\n\nİsteğe bağlı belgeler:\n• Taşımacılık belgesi (varsa)\n• Sigorta belgesi\n• Araç fotoğrafları\n\nBelgeleriniz doğrulandıktan sonra işlere başvurabilirsiniz. Belgelerinizi Ayarlar sayfasından güncelleyebilirsiniz.',
          keywords: ['belge', 'ehliyet', 'ruhsat', 'kimlik', 'gerekli'],
        },
        {
          question: 'Belge doğrulama süresi ne kadar?',
          answer: 'Belgeleriniz yüklendikten sonra:\n• İlk kontrol: 24 saat içinde\n• Doğrulama: 1-2 iş günü içinde\n• Onay: E-posta ile bildirilir\n\nDoğrulama sonrası işlere başvurabilirsiniz. Belgelerinizde sorun varsa size bildirilir ve düzeltmeniz istenir.',
          keywords: ['doğrulama', 'süre', 'belge', 'onay'],
        },
      ],
    },
    {
      category: 'İş Başvurusu',
      icon: Briefcase,
      items: [
        {
          question: 'İşlere nasıl başvururum?',
          answer: 'İş Pazarı sayfasından açık ilanları görüntüleyin:\n1. İlgilendiğiniz işe tıklayın\n2. İş detaylarını inceleyin (rota, adres, özel gereksinimler, ödeme)\n3. "Başvur" butonuna basın\n4. Başvurunuz nakliyeciye iletilecektir\n\nNakliyeci başvurunuzu inceler ve kabul eder veya reddeder. Kabul edildiğinde size bildirim gönderilir.',
          keywords: ['başvuru', 'iş', 'ilan', 'nasıl'],
        },
        {
          question: 'Kaç işe aynı anda başvurabilirim?',
          answer: 'Aynı anda birden fazla işe başvurabilirsiniz. Ancak:\n• Kabul edilen işleri zamanında tamamlamanız önemlidir\n• Çok fazla başvuru yapıp az kabul almak yerine, uygun işlere odaklanın\n• Başvuru kabul oranınız performans puanınızı etkiler\n\nAktif işlerinizi yönetebilir ve kapasitenize göre başvuru yapabilirsiniz.',
          keywords: ['başvuru', 'kaç', 'sınırsız', 'limit'],
        },
        {
          question: 'Başvurumu iptal edebilir miyim?',
          answer: 'Nakliyeci kabul etmeden önce başvurunuzu iptal edebilirsiniz:\n• İş Pazarı sayfasından başvurduğunuz işi bulun\n• "Başvuruyu İptal Et" butonuna tıklayın\n• Onaylayın\n\nAncak kabul edilen başvurular için iptal koşulları nakliyeci ile anlaşmanıza bağlıdır. İptal etmek isterseniz nakliyeci ile iletişime geçmeniz gerekir.',
          keywords: ['iptal', 'başvuru', 'vazgeç'],
        },
        {
          question: 'Başvurum ne zaman kabul edilir?',
          answer: 'Başvuru süreci:\n1. Başvurunuz nakliyeciye iletilecektir\n2. Nakliyeci başvurunuzu inceler\n3. Kabul edildiğinde size bildirim gönderilir\n4. İş "Aktif İşler" sayfanıza eklenir\n\nKabul süresi nakliyeciye bağlıdır. Genellikle birkaç saat içinde yanıt alırsınız. Uzun süre yanıt gelmezse başka işlere başvurabilirsiniz.',
          keywords: ['kabul', 'süre', 'yanıt', 'bildirim'],
        },
        {
          question: 'Başvuru kabul oranını nasıl artırabilirim?',
          answer: 'Başvuru kabul oranını artırmak için:\n• Yüksek performans puanına sahip olun\n• Profil bilgilerinizi tam ve güncel tutun\n• Belgelerinizi eksiksiz yükleyin\n• Uygun işlere başvurun (araç tipinize, deneyiminize uygun)\n• Zamanında teslimat yaparak güven oluşturun\n• Nakliyeci ile iletişime geçin\n\nYüksek kabul oranı daha fazla iş ve daha iyi puan anlamına gelir.',
          keywords: ['kabul', 'oran', 'artır', 'başarı', 'performans'],
        },
      ],
    },
    {
      category: 'Görev Yönetimi',
      icon: Truck,
      items: [
        {
          question: 'Atanan görevleri nasıl görüntülerim?',
          answer: 'Aktif İşler sayfasından tüm atanmış görevlerinizi görüntüleyebilirsiniz:\n• Görev listesi\n• Görev durumları\n• Rota bilgileri\n• Adres bilgileri\n• Özel gereksinimler\n• Ödeme bilgileri\n\nGörev detaylarına tıklayarak tüm bilgileri görebilirsiniz. Harita üzerinde rota bilgisini görüntüleyebilirsiniz.',
          keywords: ['görev', 'aktif', 'görüntüle', 'liste'],
        },
        {
          question: 'Görev durumunu nasıl güncellerim?',
          answer: 'Görev durumunu güncelleme:\n1. Aktif İşler sayfasından görevi seçin\n2. Görev detay sayfasına gidin\n3. Durum butonlarını kullanın:\n   • "Yükü Aldım": Gönderiyi toplama adresinden aldınız\n   • "Yoldayım": Gönderi ile yola çıktınız\n   • "Teslim Ettim": Gönderiyi teslim ettiniz\n\nDurum güncellemeleri otomatik olarak nakliyeciye bildirilir. İnternet olmasa bile butonlar çalışır, internet gelince otomatik gönderilir.',
          keywords: ['durum', 'güncelle', 'yükü aldım', 'yoldayım', 'teslim ettim'],
        },
        {
          question: 'İnternet olmadan durum güncellemesi yapabilir miyim?',
          answer: 'Evet, internet olmadan da durum güncellemesi yapabilirsiniz:\n• Durum butonları offline modda çalışır\n• Güncellemeler yerel olarak kaydedilir\n• İnternet geldiğinde otomatik olarak gönderilir\n• Hiçbir bilgi kaybolmaz\n\nBu özellik sayesinde internet bağlantısı olmayan bölgelerde de çalışabilirsiniz.',
          keywords: ['offline', 'internet', 'yok', 'çalışır'],
        },
        {
          question: 'Görevi nasıl tamamlarım?',
          answer: 'Görevi tamamlama:\n1. Gönderiyi teslim adresine götürün\n2. Teslimatı gerçekleştirin\n3. Görev detay sayfasından "Teslim Ettim" butonuna basın\n4. Nakliyeci teslimat durumunu kontrol eder ve süreci kapatır\n\nGörev tamamlandıktan sonra ödeme süreci başlar. Ödeme nakliyeci ile anlaşmanıza göre yapılır.',
          keywords: ['tamamla', 'teslim', 'onay', 'ödeme'],
        },
        {
          question: 'Rota bilgisini nasıl görüntülerim?',
          answer: 'Rota bilgisi:\n• Görev detay sayfasından harita görüntüleyebilirsiniz\n• Toplama ve teslimat adresleri harita üzerinde gösterilir\n• Navigasyon uygulamanızı açabilirsiniz\n• Mesafe ve tahmini süre bilgisi görüntülenir\n\nHarita üzerinden direkt navigasyon başlatabilirsiniz.',
          keywords: ['rota', 'harita', 'navigasyon', 'adres'],
        },
        {
          question: 'Birden fazla görevi aynı anda yönetebilir miyim?',
          answer: 'Evet, birden fazla görevi aynı anda yönetebilirsiniz:\n• Aktif İşler sayfasından tüm görevlerinizi görüntüleyebilirsiniz\n• Her görev için ayrı durum güncellemesi yapabilirsiniz\n• Rota planlama ile birden fazla görevi optimize edebilirsiniz\n\nAncak görevleri zamanında tamamlamanız önemlidir. Geç teslimat performans puanınızı düşürür.',
          keywords: ['çoklu', 'birden fazla', 'yönet', 'rota'],
        },
      ],
    },
    {
      category: 'Belgeler ve Profil',
      icon: FileCheck,
      items: [
        {
          question: 'Belgelerimi nasıl güncellerim?',
          answer: 'Ayarlar sayfasından "Belgeler" sekmesine gidin:\n• Yeni belge yüklemek için "Belge Ekle" butonuna tıklayın\n• Mevcut belgeleri güncelleyebilir veya silebilirsiniz\n• Belge türünü seçin (ehliyet, ruhsat, kimlik vb.)\n• Belgeyi yükleyin\n• Kaydedin\n\nBelgeleriniz güncellendikten sonra tekrar doğrulanır. Doğrulama 1-2 iş günü sürer.',
          keywords: ['belge', 'güncelle', 'yükle', 'ayarlar'],
        },
        {
          question: 'Profil bilgilerimi nasıl düzenlerim?',
          answer: 'Ayarlar sayfasından "Profil" sekmesine gidin:\n• Kişisel bilgilerinizi güncelleyebilirsiniz (ad, soyad, telefon, e-posta)\n• İletişim bilgilerinizi düzenleyebilirsiniz\n• Araç bilgilerinizi güncelleyebilirsiniz (plaka, model, tip)\n• Adres bilgilerinizi düzenleyebilirsiniz\n\nProfil bilgileriniz nakliyecilerle paylaşılır, bu yüzden güncel tutmanız önemlidir.',
          keywords: ['profil', 'güncelle', 'düzenle', 'bilgi'],
        },
        {
          question: 'Araç bilgilerimi nasıl güncellerim?',
          answer: 'Ayarlar sayfasından "Araç" sekmesine gidin:\n• Araç plakasını güncelleyebilirsiniz\n• Araç modelini değiştirebilirsiniz\n• Araç tipini seçebilirsiniz (kamyon, kamyonet, tır vb.)\n• Araç fotoğrafları ekleyebilirsiniz\n• Ruhsat bilgilerini güncelleyebilirsiniz\n\nAraç bilgileriniz iş başvurularında görüntülenir.',
          keywords: ['araç', 'plaka', 'model', 'güncelle'],
        },
        {
          question: 'Belge süresi doldu, ne yapmalıyım?',
          answer: 'Belge süresi dolduğunda:\n1. Ayarlar sayfasından belgeyi güncelleyin\n2. Yeni belgeyi yükleyin\n3. Belge doğrulaması beklenir (1-2 iş günü)\n4. Doğrulama tamamlanana kadar yeni işlere başvurabilirsiniz, ancak bazı işler için belge gerekebilir\n\nBelgelerinizi süresi dolmadan önce güncellemeniz önerilir.',
          keywords: ['belge', 'süre', 'doldu', 'güncelle'],
        },
      ],
    },
    {
      category: 'Performans ve Puan',
      icon: Award,
      items: [
        {
          question: 'Puan sistemi nasıl çalışır?',
          answer: 'Puan sistemi:\n• Tamamlanan her görev için nakliyeci size puan verir (1-5 yıldız)\n• Ortalama puanınız profil sayfanızda görüntülenir\n• Yüksek puan daha fazla iş başvurusu kabul şansı sağlar\n• Puanlar görev tamamlandıktan sonra verilir\n\nPuanınız iş başvurularında önemlidir. Yüksek puanlı taşıyıcılar daha fazla iş alır.',
          keywords: ['puan', 'yıldız', 'performans', 'değerlendirme'],
        },
        {
          question: 'Puanımı nasıl yükseltebilirim?',
          answer: 'Puanınızı yükseltmek için:\n• Görevleri zamanında tamamlayın\n• Müşteri memnuniyetine önem verin\n• Profesyonel davranın\n• İletişim kurun\n• Gönderileri dikkatli taşıyın\n• Özel gereksinimlere dikkat edin\n• Sorun durumunda hemen iletişime geçin\n\nYüksek puan daha fazla iş ve daha iyi kazanç anlamına gelir.',
          keywords: ['puan', 'yükselt', 'artır', 'başarı'],
        },
        {
          question: 'Performans raporlarını nasıl görüntülerim?',
          answer: 'Ana Sayfa\'dan performans istatistiklerinizi görebilirsiniz:\n• Tamamlanan görev sayısı\n• Ortalama puan\n• Toplam kazanç\n• Başvuru kabul oranı\n• Aktif görev sayısı\n• Aylık kazanç grafiği\n\nBu bilgiler iş performansınızı değerlendirmenize yardımcı olur.',
          keywords: ['performans', 'rapor', 'istatistik', 'ana sayfa'],
        },
        {
          question: 'Puanım düşükse ne yapmalıyım?',
          answer: 'Puanınız düşükse:\n• Görevleri daha dikkatli tamamlayın\n• Müşteri iletişimini iyileştirin\n• Zamanında teslimat yapın\n• Sorun durumunda hemen iletişime geçin\n• Profesyonel davranın\n• Özel gereksinimlere dikkat edin\n\nZamanla puanınız yükselir. Yeni görevlerde daha iyi performans göstererek puanınızı artırabilirsiniz.',
          keywords: ['puan', 'düşük', 'artır', 'iyileştir'],
        },
      ],
    },
    {
      category: 'Ödeme ve Kazanç',
      icon: DollarSign,
      items: [
        {
          question: 'Ödemeleri nasıl alırım?',
          answer: 'Tamamlanan görevler için ödemeler nakliyeci tarafından yapılır:\n• Görev tamamlandıktan sonra\n• Nakliyeci süreci kapattıktan sonra\n• Ödeme tutarı görev başında belirtilir\n• Ödeme nakliyeci ile anlaşmanıza göre yapılır\n\nÖdeme detayları görev sayfasından görüntülenebilir.',
          keywords: ['ödeme', 'al', 'nakliyeci', 'görev'],
        },
        {
          question: 'Ödeme ne zaman yapılır?',
          answer: 'Ödeme zamanlaması:\n• Görev tamamlandıktan sonra\n• Nakliyeci süreci kapattıktan sonra\n• Nakliyeci ile anlaşmanıza göre\n• Genellikle 24 saat içinde\n\nÖdeme gecikirse nakliyeci ile iletişime geçebilir veya destek ekibimizle iletişime geçebilirsiniz.',
          keywords: ['ödeme', 'zaman', 'ne zaman', 'süre'],
        },
        {
          question: 'Ödeme geçmişini nasıl görüntülerim?',
          answer: 'Ödeme geçmişi:\n• Aktif İşler sayfasından tamamlanan görevlerinizi görebilirsiniz\n• Görev bazlı ödeme detayları\n• Tarih ve tutar bilgileri\n\nAna Sayfa\'dan toplam kazanç ve aylık kazanç grafiğini görebilirsiniz.',
          keywords: ['ödeme', 'geçmiş', 'rapor', 'görev'],
        },
      ],
    },
    {
      category: 'Sorunlar ve İptal',
      icon: AlertCircle,
      items: [
        {
          question: 'Görevi iptal edebilir miyim?',
          answer: 'Kabul edilen görevler için iptal koşulları nakliyeci ile anlaşmanıza bağlıdır:\n• Görevi henüz almadıysanız: Nakliyeci ile iletişime geçin\n• Görevi aldıysanız: Acil durumlarda nakliyeci ile iletişime geçerek iptal talebinde bulunabilirsiniz\n• İptal durumunda performans puanınız etkilenebilir\n\nİptal etmek isterseniz görev detay sayfasından nakliyeci ile iletişime geçin.',
          keywords: ['iptal', 'görev', 'vazgeç'],
        },
        {
          question: 'Sorun yaşarsam ne yapmalıyım?',
          answer: 'Herhangi bir sorun yaşarsanız:\n• Görev detay sayfasından nakliyeci ile iletişime geçin\n• Mesaj göndererek sorunu açıklayın\n• Acil durumlarda telefon ile iletişime geçin\n• Destek ekibimizle iletişime geçin\n• Şikayet sayfasından sorununuzu bildirin\n\nTüm iletişimler kayıt altına alınır ve değerlendirilir.',
          keywords: ['sorun', 'şikayet', 'iletişim', 'destek'],
        },
        {
          question: 'Gönderi hasar gördüyse ne yapmalıyım?',
          answer: 'Gönderi hasar gördüyse:\n1. Hemen nakliyeci ile iletişime geçin\n2. Durumu bildirin\n3. Hasar fotoğrafları çekin\n4. Görev detay sayfasından mesaj gönderin\n5. Destek ekibimizle iletişime geçin\n\nHasar durumunda çözüm süreçleri nakliyeci tarafından yönetilir. Dürüstlük ve hızlı iletişim önemlidir.',
          keywords: ['hasar', 'bozuk', 'sorun', 'sigorta'],
        },
        {
          question: 'Yanlış adrese gittim, ne yapmalıyım?',
          answer: 'Yanlış adrese gittiyseniz:\n1. Hemen nakliyeci ile iletişime geçin\n2. Doğru adresi öğrenin\n3. Gönderiyi doğru adrese teslim edin\n\nYanlış adres durumunda ek ücret talep edilemez. Doğru adrese teslim etmek sizin sorumluluğunuzdadır.',
          keywords: ['yanlış adres', 'hata', 'düzelt'],
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
        <title>Yardım ve Destek - Taşıyıcı | YolNext</title>
        <meta name="description" content="YolNext taşıyıcı yardım ve destek sayfası. Taşıyıcılar için özel rehber ve SSS." />
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
                  Taşıyıcı Yardım Merkezi
                </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Taşıyıcı olarak platformu nasıl kullanacağınız hakkında kapsamlı bilgiler. Sorularınızın cevaplarını burada bulabilirsiniz.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Sorunuzu yazın ve arayın... (örn: iş nasıl bulunur, görev nasıl tamamlanır)"
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
              <h2 className='text-2xl font-bold text-slate-900'>Taşıyıcı Kullanım Rehberi</h2>
              <p className='text-slate-600'>4 adımda taşıyıcı olarak platformu kullanmaya başlayın</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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

export default TasiyiciHelp;
