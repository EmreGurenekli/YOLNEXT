import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Building2, Users, TrendingUp, DollarSign, CheckCircle, Star, ArrowRight } from 'lucide-react';

interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  results: {
    savings: number;
    efficiency: number;
    satisfaction: number;
    timeSaved: number;
  };
  testimonial: {
    author: string;
    position: string;
    content: string;
    rating: number;
  };
  image: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: 'migros',
    title: 'Migros Ticaret A.Ş.',
    company: 'Migros Ticaret A.Ş.',
    industry: 'Perakende',
    challenge: 'Migros, 50+ şehirdeki mağazalarına düzenli olarak ürün sevkiyatı yapıyordu. Geleneksel lojistik firmaları ile çalışırken yüksek maliyetler ve zaman kaybı yaşıyordu.',
    solution: 'YolNet platformu ile tüm sevkiyatlarını merkezi olarak yönetmeye başladı. Otomatik fiyat karşılaştırması ve gerçek zamanlı takip ile süreçleri optimize etti.',
    results: {
      savings: 35,
      efficiency: 40,
      satisfaction: 95,
      timeSaved: 60
    },
    testimonial: {
      author: 'Ahmet Yılmaz',
      position: 'Lojistik Müdürü',
      content: 'YolNet sayesinde lojistik maliyetlerimizi %35 azalttık. Gerçek zamanlı takip ve otomatik optimizasyon ile süreçlerimiz çok daha verimli hale geldi.',
      rating: 5
    },
    image: '/api/placeholder/400/300'
  },
  {
    id: 'ekol',
    title: 'Ekol Lojistik',
    company: 'Ekol Lojistik',
    industry: 'Lojistik',
    challenge: 'Ekol Lojistik, araçlarının boş dönüş oranını azaltmak ve daha fazla yük bulmak istiyordu. Geleneksel yöntemlerle yeterli yük bulamıyordu.',
    solution: 'YolNet platformu ile boş dönüşleri minimize etti. Şehir içi ve şehirler arası yükleri kolayca buldu ve araç doluluk oranını artırdı.',
    results: {
      savings: 25,
      efficiency: 50,
      satisfaction: 92,
      timeSaved: 45
    },
    testimonial: {
      author: 'Mehmet Demir',
      position: 'Operasyon Müdürü',
      content: 'YolNet ile araçlarımızın boş dönüş oranını %50 azalttık. Platform sayesinde sürekli yük bulabiliyoruz ve karlılığımız arttı.',
      rating: 5
    },
    image: '/api/placeholder/400/300'
  },
  {
    id: 'trendyol',
    title: 'Trendyol',
    company: 'Trendyol',
    industry: 'E-ticaret',
    challenge: 'Trendyol, hızlı büyüme ile birlikte lojistik kapasitesini artırmak zorundaydı. Mevcut lojistik firmaları yetersiz kalıyordu.',
    solution: 'YolNet platformu ile geniş bir nakliyeci ağına erişim sağladı. Dinamik fiyatlandırma ve otomatik atama ile lojistik süreçlerini optimize etti.',
    results: {
      savings: 30,
      efficiency: 45,
      satisfaction: 98,
      timeSaved: 70
    },
    testimonial: {
      author: 'Zeynep Kaya',
      position: 'Lojistik Direktörü',
      content: 'YolNet ile lojistik kapasitemizi 3 katına çıkardık. Platform sayesinde müşteri memnuniyetimiz %98\'e ulaştı.',
      rating: 5
    },
    image: '/api/placeholder/400/300'
  }
];

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Başarı Hikayeleri - YolNet</title>
        <meta name="description" content="YolNet ile başarıya ulaşan şirketlerin hikayeleri" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Başarı Hikayeleri
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            YolNet ile birlikte çalışan şirketlerin nasıl başarıya ulaştığını keşfedin
          </p>
        </div>

        {/* Case Studies */}
        <div className="space-y-12">
          {caseStudies.map((study, index) => (
            <div key={study.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{study.title}</h2>
                      <p className="text-gray-600">{study.industry}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Sorun</h3>
                      <p className="text-gray-600">{study.challenge}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Çözüm</h3>
                      <p className="text-gray-600">{study.solution}</p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">%{study.results.savings}</div>
                      <div className="text-sm text-green-700">Maliyet Tasarrufu</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">%{study.results.efficiency}</div>
                      <div className="text-sm text-blue-700">Verimlilik Artışı</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">%{study.results.satisfaction}</div>
                      <div className="text-sm text-purple-700">Müşteri Memnuniyeti</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">%{study.results.timeSaved}</div>
                      <div className="text-sm text-orange-700">Zaman Tasarrufu</div>
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(study.testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic">
                    "{study.testimonial.content}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{study.testimonial.author}</div>
                      <div className="text-sm text-gray-600">{study.testimonial.position}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Siz de Başarıya Ulaşın!</h2>
          <p className="text-xl mb-6">YolNet ile lojistik süreçlerinizi optimize edin</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 text-lg">
              <ArrowRight size={20} />
              Hemen Başlayın
            </button>
            <button className="bg-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-colors flex items-center gap-2 text-lg">
              <Building2 size={20} />
              Kurumsal Çözümler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}