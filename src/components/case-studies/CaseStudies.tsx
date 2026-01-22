import React, { useState } from 'react';
import {
  Star,
  Users,
  Truck,
  Package,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Filter,
  Search,
  XCircle,
} from 'lucide-react';

interface CaseStudy {
  id: number;
  title: string;
  company: string;
  category: string;
  challenge: string;
  solution: string;
  results: {
    costSavings: number;
    timeReduction: number;
    satisfaction: number;
  };
  image: string;
  tags: string[];
  featured: boolean;
}

const CaseStudies: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  const categories = [
    { id: 'all', name: 'Tümü', count: 12 },
    { id: 'ecommerce', name: 'E-ticaret', count: 4 },
    { id: 'manufacturing', name: 'Üretim', count: 3 },
    { id: 'retail', name: 'Perakende', count: 2 },
    { id: 'logistics', name: 'Lojistik', count: 3 },
  ];

  const caseStudies: CaseStudy[] = [
    {
      id: 1,
      title: 'E-ticaret Devinin Lojistik Optimizasyonu',
      company: 'TechStore Türkiye',
      category: 'ecommerce',
      challenge:
        'Günlük 10,000+ siparişin hızlı ve güvenli teslimatı. Müşteri memnuniyetinin düşmesi ve maliyetlerin artması.',
      solution:
        'YolNext platformu ile 50+ nakliyeci ağı kuruldu. Otomatik rota optimizasyonu ve gerçek zamanlı takip sistemi entegre edildi.',
      results: {
        costSavings: 35,
        timeReduction: 50,
        satisfaction: 95,
      },
      image: '/api/placeholder/400/250',
      tags: ['E-ticaret', 'Optimizasyon', 'Maliyet Tasarrufu'],
      featured: true,
    },
    {
      id: 2,
      title: 'Üretim Şirketinin Tedarik Zinciri Dönüşümü',
      company: 'MetalPro A.Ş.',
      category: 'manufacturing',
      challenge:
        'Hammadde tedarikinde gecikmeler ve yüksek lojistik maliyetleri. Tedarikçi çeşitliliğinin az olması.',
      solution:
        'Platform üzerinden geniş nakliyeci ağına erişim. Dinamik fiyatlandırma ve kalite garantili hizmet.',
      results: {
        costSavings: 28,
        timeReduction: 40,
        satisfaction: 92,
      },
      image: '/api/placeholder/400/250',
      tags: ['Üretim', 'Tedarik Zinciri', 'Kalite'],
      featured: true,
    },
    {
      id: 3,
      title: 'Perakende Zincirinin Dağıtım Ağı Genişletmesi',
      company: 'MarketChain',
      category: 'retail',
      challenge:
        'Yeni şehirlere genişleme sürecinde lojistik altyapı eksikliği. Hızlı ve güvenilir dağıtım ihtiyacı.',
      solution:
        'YolNext ile yerel nakliyeci ortaklıkları kuruldu. Merkezi yönetim sistemi ile tüm operasyonlar tek noktadan kontrol edildi.',
      results: {
        costSavings: 42,
        timeReduction: 60,
        satisfaction: 98,
      },
      image: '/api/placeholder/400/250',
      tags: ['Perakende', 'Genişleme', 'Merkezi Yönetim'],
      featured: false,
    },
    {
      id: 4,
      title: 'Lojistik Şirketinin Dijital Dönüşümü',
      company: 'FastLog Lojistik',
      category: 'logistics',
      challenge:
        'Geleneksel yöntemlerle müşteri memnuniyetinin düşmesi. Operasyonel verimliliğin artırılması ihtiyacı.',
      solution:
        'YolNext platformuna entegrasyon ile dijital süreçler. Otomatik iş akışları ve müşteri self-servis portalı.',
      results: {
        costSavings: 25,
        timeReduction: 35,
        satisfaction: 90,
      },
      image: '/api/placeholder/400/250',
      tags: ['Dijital Dönüşüm', 'Verimlilik', 'Müşteri Deneyimi'],
      featured: false,
    },
  ];

  const filteredCases = caseStudies.filter(caseStudy => {
    const matchesCategory =
      selectedCategory === 'all' || caseStudy.category === selectedCategory;
    const matchesSearch =
      caseStudy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseStudy.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseStudy.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const featuredCases = caseStudies.filter(caseStudy => caseStudy.featured);

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Başarı Hikayeleri
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            YolNext platformunu kullanan şirketlerin gerçek dönüşüm hikayelerini
            keşfedin. Nasıl maliyet tasarrufu sağladıklarını ve operasyonlarını
            nasıl optimize ettiklerini öğrenin.
          </p>
        </div>

        {/* Search and Filter */}
        <div className='bg-white rounded-2xl shadow-lg p-6 mb-8'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  placeholder='Vaka çalışması ara...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Cases */}
        <div className='mb-12'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Öne Çıkan Vakalar
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {featuredCases.map(caseStudy => (
              <div
                key={caseStudy.id}
                className='bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow'
              >
                <div className='h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center'>
                  <Package className='w-16 h-16 text-white' />
                </div>
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full'>
                      {
                        categories.find(cat => cat.id === caseStudy.category)
                          ?.name
                      }
                    </span>
                    <div className='flex items-center text-yellow-500'>
                      <Star className='w-4 h-4 fill-current' />
                      <span className='ml-1 text-sm font-medium'>
                        Öne Çıkan
                      </span>
                    </div>
                  </div>

                  <h3 className='text-xl font-bold text-gray-900 mb-2'>
                    {caseStudy.title}
                  </h3>
                  <p className='text-gray-600 mb-4'>{caseStudy.company}</p>

                  <div className='space-y-3 mb-6'>
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>
                        Zorluk:
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {caseStudy.challenge}
                      </p>
                    </div>
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>
                        Çözüm:
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {caseStudy.solution}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-3 gap-4 mb-6'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        %{caseStudy.results.costSavings}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Maliyet Tasarrufu
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        %{caseStudy.results.timeReduction}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Zaman Tasarrufu
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        %{caseStudy.results.satisfaction}
                      </div>
                      <div className='text-xs text-gray-500'>Memnuniyet</div>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-2 mb-4'>
                    {caseStudy.tags.map(tag => (
                      <span
                        key={tag}
                        className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedCase(caseStudy)}
                    className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center'
                  >
                    Detayları Gör
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Cases */}
        <div>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Tüm Vaka Çalışmaları
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredCases.map(caseStudy => (
              <div
                key={caseStudy.id}
                className='bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow'
              >
                <div className='h-32 bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center'>
                  <Truck className='w-8 h-8 text-white' />
                </div>
                <div className='p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded'>
                      {
                        categories.find(cat => cat.id === caseStudy.category)
                          ?.name
                      }
                    </span>
                    {caseStudy.featured && (
                      <Star className='w-4 h-4 text-yellow-500 fill-current' />
                    )}
                  </div>

                  <h3 className='font-bold text-gray-900 mb-1 text-sm'>
                    {caseStudy.title}
                  </h3>
                  <p className='text-gray-600 text-xs mb-3'>
                    {caseStudy.company}
                  </p>

                  <div className='flex justify-between text-xs text-gray-500 mb-3'>
                    <span>%{caseStudy.results.costSavings} tasarruf</span>
                    <span>%{caseStudy.results.satisfaction} memnuniyet</span>
                  </div>

                  <button
                    onClick={() => setSelectedCase(caseStudy)}
                    className='w-full text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors'
                  >
                    Detayları Gör →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Study Modal */}
        {selectedCase && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex justify-between items-start mb-6'>
                  <div>
                    <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                      {selectedCase.title}
                    </h2>
                    <p className='text-gray-600'>{selectedCase.company}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <XCircle className='w-6 h-6' />
                  </button>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Zorluk
                    </h3>
                    <p className='text-gray-600 mb-6'>
                      {selectedCase.challenge}
                    </p>

                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Çözüm
                    </h3>
                    <p className='text-gray-600 mb-6'>
                      {selectedCase.solution}
                    </p>
                  </div>

                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Sonuçlar
                    </h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg'>
                        <div className='flex items-center'>
                          <DollarSign className='w-5 h-5 text-green-600 mr-3' />
                          <span className='font-medium'>Maliyet Tasarrufu</span>
                        </div>
                        <span className='text-2xl font-bold text-green-600'>
                          %{selectedCase.results.costSavings}
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg'>
                        <div className='flex items-center'>
                          <Clock className='w-5 h-5 text-blue-600 mr-3' />
                          <span className='font-medium'>Zaman Tasarrufu</span>
                        </div>
                        <span className='text-2xl font-bold text-blue-600'>
                          %{selectedCase.results.timeReduction}
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-4 bg-purple-50 rounded-lg'>
                        <div className='flex items-center'>
                          <Users className='w-5 h-5 text-purple-600 mr-3' />
                          <span className='font-medium'>
                            Müşteri Memnuniyeti
                          </span>
                        </div>
                        <span className='text-2xl font-bold text-purple-600'>
                          %{selectedCase.results.satisfaction}
                        </span>
                      </div>
                    </div>

                    <div className='mt-6'>
                      <h4 className='font-semibold text-gray-900 mb-2'>
                        Etiketler
                      </h4>
                      <div className='flex flex-wrap gap-2'>
                        {selectedCase.tags.map(tag => (
                          <span
                            key={tag}
                            className='px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseStudies;
