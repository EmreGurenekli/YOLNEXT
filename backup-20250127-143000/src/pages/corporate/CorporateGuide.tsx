import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Building2, Users, BarChart3, Shield, CheckCircle, ArrowRight, Play, BookOpen } from 'lucide-react';

export default function CorporateGuide() {
  const features = [
    {
      icon: Building2,
      title: 'Kurumsal Yönetim',
      description: 'Çoklu kullanıcı desteği ile takımınızı organize edin',
      details: [
        'Departman bazlı yetkilendirme',
        'Rol ve izin yönetimi',
        'Merkezi gönderi yönetimi',
        'Ekip performans takibi'
      ]
    },
    {
      icon: BarChart3,
      title: 'Detaylı Analizler',
      description: 'Kapsamlı raporlama ve analiz araçları',
      details: [
        'Maliyet analizi ve optimizasyon',
        'Performans metrikleri',
        'Trend analizi',
        'Özelleştirilebilir raporlar'
      ]
    },
    {
      icon: Shield,
      title: 'Güvenlik ve Uyumluluk',
      description: 'Kurumsal güvenlik standartları',
      details: [
        'SSL şifreleme',
        'Veri güvenliği',
        'GDPR uyumluluğu',
        'Audit logları'
      ]
    },
    {
      icon: Users,
      title: 'Müşteri Desteği',
      description: '7/24 kurumsal müşteri desteği',
      details: [
        'Özel müşteri temsilcisi',
        'Hızlı çözüm süreçleri',
        'Öncelikli destek',
        'Eğitim ve danışmanlık'
      ]
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Hesap Oluşturun',
      description: 'Kurumsal hesabınızı oluşturun ve doğrulayın',
      icon: Building2,
      details: [
        'Şirket bilgilerinizi girin',
        'Vergi numarası doğrulaması',
        'İletişim bilgilerini tamamlayın',
        'Hesap onayı bekleyin'
      ]
    },
    {
      step: 2,
      title: 'Ekip Kurun',
      description: 'Departman yöneticilerinizi ekleyin',
      icon: Users,
      details: [
        'Kullanıcı rolleri tanımlayın',
        'Departman yapısını oluşturun',
        'Yetki seviyelerini belirleyin',
        'Ekip üyelerini davet edin'
      ]
    },
    {
      step: 3,
      title: 'Entegrasyon Yapın',
      description: 'Mevcut sistemlerinizi entegre edin',
      icon: CheckCircle,
      details: [
        'API entegrasyonu',
        'ERP bağlantısı',
        'Muhasebe sistemi entegrasyonu',
        'Test ve doğrulama'
      ]
    },
    {
      step: 4,
      title: 'Eğitim Alın',
      description: 'Ekibinizi eğitin ve başlayın',
      icon: BookOpen,
      details: [
        'Platform eğitimi',
        'Süreç eğitimi',
        'Raporlama eğitimi',
        'Destek süreçleri'
      ]
    }
  ];

  const benefits = [
    {
      title: 'Maliyet Tasarrufu',
      value: '%30',
      description: 'Ortalama lojistik maliyet tasarrufu'
    },
    {
      title: 'Verimlilik Artışı',
      value: '%40',
      description: 'Operasyonel verimlilik artışı'
    },
    {
      title: 'Zaman Tasarrufu',
      value: '%50',
      description: 'Gönderi yönetim süresi azalması'
    },
    {
      title: 'Müşteri Memnuniyeti',
      value: '%95',
      description: 'Müşteri memnuniyet oranı'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Kurumsal Rehber - YolNet</title>
        <meta name="description" content="YolNet kurumsal çözümler rehberi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kurumsal Çözümler Rehberi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            YolNet kurumsal çözümleri ile lojistik süreçlerinizi optimize edin ve maliyetlerinizi düşürün
          </p>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Kurumsal Özellikler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Kurulum Adımları
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Kurumsal Avantajlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{benefit.value}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Kurumsal Çözümlerinizi Keşfedin!</h2>
          <p className="text-xl mb-6">İlk ay %30 indirim + ücretsiz kurulum</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 text-lg">
              <Play size={20} />
              Demo Talep Et
            </button>
            <button className="bg-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-colors flex items-center gap-2 text-lg">
              <BookOpen size={20} />
              Detaylı Bilgi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}