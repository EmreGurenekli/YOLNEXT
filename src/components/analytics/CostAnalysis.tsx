import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Filter,
  Download,
  Calendar,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

interface CostCategory {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  subcategories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
}

interface CostAnalysisData {
  totalCost: number;
  previousPeriodCost: number;
  costChange: number;
  costChangePercentage: number;
  categories: CostCategory[];
  monthlyTrend: {
    month: string;
    cost: number;
    savings: number;
  }[];
  recommendations: {
    id: string;
    title: string;
    description: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

const CostAnalysis: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>(
    'overview'
  );

  const periods = [
    { id: '7days', name: 'Son 7 Gün', value: 7 },
    { id: '30days', name: 'Son 30 Gün', value: 30 },
    { id: '90days', name: 'Son 90 Gün', value: 90 },
    { id: '1year', name: 'Son 1 Yıl', value: 365 },
  ];

  const analysisData: CostAnalysisData = {
    totalCost: 125000,
    previousPeriodCost: 140000,
    costChange: -15000,
    costChangePercentage: -10.7,
    categories: [
      {
        id: 'fuel',
        name: 'Yakıt',
        amount: 45000,
        percentage: 36,
        trend: 'down',
        color: '#3B82F6',
        subcategories: [
          { name: 'Dizel', amount: 30000, percentage: 66.7 },
          { name: 'Benzin', amount: 15000, percentage: 33.3 },
        ],
      },
      {
        id: 'maintenance',
        name: 'Bakım',
        amount: 25000,
        percentage: 20,
        trend: 'stable',
        color: '#10B981',
        subcategories: [
          { name: 'Rutin Bakım', amount: 15000, percentage: 60 },
          { name: 'Onarım', amount: 10000, percentage: 40 },
        ],
      },
      {
        id: 'personnel',
        name: 'Personel',
        amount: 35000,
        percentage: 28,
        trend: 'up',
        color: '#F59E0B',
        subcategories: [
          { name: 'Maaşlar', amount: 28000, percentage: 80 },
          { name: 'Sosyal Haklar', amount: 7000, percentage: 20 },
        ],
      },
      {
        id: 'insurance',
        name: 'Sigorta',
        amount: 10000,
        percentage: 8,
        trend: 'stable',
        color: '#EF4444',
        subcategories: [
          { name: 'Araç Sigortası', amount: 6000, percentage: 60 },
          { name: 'Kargo Sigortası', amount: 4000, percentage: 40 },
        ],
      },
      {
        id: 'other',
        name: 'Diğer',
        amount: 10000,
        percentage: 8,
        trend: 'down',
        color: '#8B5CF6',
        subcategories: [
          { name: 'Ofis Giderleri', amount: 5000, percentage: 50 },
          { name: 'İletişim', amount: 3000, percentage: 30 },
          { name: 'Diğer', amount: 2000, percentage: 20 },
        ],
      },
    ],
    monthlyTrend: [
      { month: 'Oca', cost: 120000, savings: 5000 },
      { month: 'Şub', cost: 135000, savings: 3000 },
      { month: 'Mar', cost: 140000, savings: 2000 },
      { month: 'Nis', cost: 130000, savings: 8000 },
      { month: 'May', cost: 125000, savings: 10000 },
      { month: 'Haz', cost: 120000, savings: 12000 },
    ],
    recommendations: [
      {
        id: '1',
        title: 'Yakıt Optimizasyonu',
        description:
          'Rota optimizasyonu ile yakıt tüketimini %15 azaltabilirsiniz',
        potentialSavings: 6750,
        priority: 'high',
      },
      {
        id: '2',
        title: 'Bakım Programı',
        description:
          'Önleyici bakım programı ile büyük onarım maliyetlerini önleyin',
        potentialSavings: 5000,
        priority: 'medium',
      },
      {
        id: '3',
        title: 'Sigorta Yeniden Değerlendirme',
        description:
          'Sigorta poliçelerinizi yeniden değerlendirerek %20 tasarruf sağlayın',
        potentialSavings: 2000,
        priority: 'low',
      },
    ],
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className='w-4 h-4 text-red-500' />;
      case 'down':
        return <ArrowDown className='w-4 h-4 text-green-500' />;
      default:
        return <Minus className='w-4 h-4 text-gray-500' />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Maliyet Analizi
            </h1>
            <p className='text-gray-600 mt-2'>
              Detaylı maliyet analizi ve optimizasyon önerileri
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
            <button className='bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center'>
              <Download className='w-4 h-4 mr-2' />
              Rapor İndir
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className='flex space-x-1 mb-8'>
          {[
            { id: 'overview', name: 'Genel Bakış', icon: BarChart3 },
            { id: 'detailed', name: 'Detaylı Analiz', icon: PieChart },
            { id: 'trends', name: 'Trend Analizi', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className='w-4 h-4 mr-2' />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <div className='space-y-8'>
            {/* Key Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Toplam Maliyet</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      ₺{analysisData.totalCost.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className='w-8 h-8 text-blue-600' />
                </div>
                <div className='mt-2 flex items-center'>
                  {getTrendIcon(analysisData.costChange < 0 ? 'down' : 'up')}
                  <span
                    className={`ml-1 text-sm font-medium ${
                      analysisData.costChange < 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    %{Math.abs(analysisData.costChangePercentage).toFixed(1)}
                  </span>
                  <span className='ml-1 text-sm text-gray-500'>
                    önceki döneme göre
                  </span>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Maliyet Tasarrufu</p>
                    <p className='text-2xl font-bold text-green-600'>
                      ₺{Math.abs(analysisData.costChange).toLocaleString()}
                    </p>
                  </div>
                  <Target className='w-8 h-8 text-green-600' />
                </div>
                <div className='mt-2 flex items-center'>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  <span className='ml-1 text-sm text-green-600 font-medium'>
                    Hedef aşıldı
                  </span>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>En Yüksek Kategori</p>
                    <p className='text-lg font-bold text-gray-900'>Yakıt</p>
                  </div>
                  <TrendingUp className='w-8 h-8 text-orange-600' />
                </div>
                <div className='mt-2'>
                  <span className='text-sm text-gray-500'>
                    %36 toplam maliyetin
                  </span>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Ortalama Aylık</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      ₺{Math.round(analysisData.totalCost / 6).toLocaleString()}
                    </p>
                  </div>
                  <Calculator className='w-8 h-8 text-purple-600' />
                </div>
                <div className='mt-2'>
                  <span className='text-sm text-gray-500'>
                    Son 6 ay ortalaması
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Categories */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Maliyet Kategorileri
              </h2>
              <div className='space-y-4'>
                {analysisData.categories.map(category => (
                  <div
                    key={category.id}
                    className='border border-gray-200 rounded-lg p-4'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-3'>
                        <div
                          className='w-4 h-4 rounded-full'
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <h3 className='font-semibold text-gray-900'>
                          {category.name}
                        </h3>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <span className='text-lg font-bold text-gray-900'>
                          ₺{category.amount.toLocaleString()}
                        </span>
                        <span className='text-sm text-gray-500'>
                          %{category.percentage}
                        </span>
                        <div className='flex items-center'>
                          {getTrendIcon(category.trend)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className='w-full bg-gray-200 rounded-full h-2 mb-3'>
                      <div
                        className='h-2 rounded-full'
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.color,
                        }}
                      ></div>
                    </div>

                    {/* Subcategories */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                      {category.subcategories.map(subcategory => (
                        <div
                          key={subcategory.name}
                          className='flex items-center justify-between text-sm'
                        >
                          <span className='text-gray-600'>
                            {subcategory.name}
                          </span>
                          <div className='flex items-center space-x-2'>
                            <span className='font-medium'>
                              ₺{subcategory.amount.toLocaleString()}
                            </span>
                            <span className='text-gray-500'>
                              %{subcategory.percentage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Mode */}
        {viewMode === 'detailed' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Cost Breakdown Chart */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Maliyet Dağılımı
              </h2>
              <div className='space-y-4'>
                {analysisData.categories.map(category => (
                  <div
                    key={category.id}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className='w-4 h-4 rounded-full'
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className='font-medium text-gray-900'>
                        {category.name}
                      </span>
                    </div>
                    <div className='flex items-center space-x-4'>
                      <span className='font-semibold'>
                        ₺{category.amount.toLocaleString()}
                      </span>
                      <span className='text-sm text-gray-500'>
                        %{category.percentage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Optimizasyon Önerileri
              </h2>
              <div className='space-y-4'>
                {analysisData.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className='border border-gray-200 rounded-lg p-4'
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-gray-900'>
                        {rec.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          rec.priority
                        )}`}
                      >
                        {rec.priority === 'high'
                          ? 'Yüksek'
                          : rec.priority === 'medium'
                            ? 'Orta'
                            : 'Düşük'}
                      </span>
                    </div>
                    <p className='text-sm text-gray-600 mb-3'>
                      {rec.description}
                    </p>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>
                        Potansiyel Tasarruf:
                      </span>
                      <span className='font-semibold text-green-600'>
                        ₺{rec.potentialSavings.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trends Mode */}
        {viewMode === 'trends' && (
          <div className='space-y-8'>
            {/* Monthly Trend Chart */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Aylık Maliyet Trendi
              </h2>
              <div className='h-64 flex items-center justify-center bg-gray-50 rounded-lg'>
                <div className='text-center'>
                  <BarChart3 className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                  <p className='text-gray-500'>Grafik yükleniyor...</p>
                </div>
              </div>
            </div>

            {/* Trend Data Table */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Aylık Detaylar
              </h2>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-3 px-4 font-semibold text-gray-800'>
                        Ay
                      </th>
                      <th className='text-left py-3 px-4 font-semibold text-gray-800'>
                        Maliyet
                      </th>
                      <th className='text-left py-3 px-4 font-semibold text-gray-800'>
                        Tasarruf
                      </th>
                      <th className='text-left py-3 px-4 font-semibold text-gray-800'>
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.monthlyTrend.map((month, index) => (
                      <tr
                        key={month.month}
                        className='border-b border-gray-100'
                      >
                        <td className='py-3 px-4 font-medium text-gray-900'>
                          {month.month}
                        </td>
                        <td className='py-3 px-4'>
                          ₺{month.cost.toLocaleString()}
                        </td>
                        <td className='py-3 px-4 text-green-600'>
                          ₺{month.savings.toLocaleString()}
                        </td>
                        <td className='py-3 px-4'>
                          {index > 0 && (
                            <div className='flex items-center'>
                              {month.cost <
                              analysisData.monthlyTrend[index - 1].cost ? (
                                <ArrowDown className='w-4 h-4 text-green-500' />
                              ) : (
                                <ArrowUp className='w-4 h-4 text-red-500' />
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostAnalysis;
