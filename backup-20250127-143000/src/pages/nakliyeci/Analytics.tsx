import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  Calendar,
  Download,
  Filter,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const NakliyeciAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const analyticsData = {
    summary: {
      totalShipments: 156,
      completed: 142,
      inProgress: 12,
      cancelled: 2,
      totalRevenue: 45600,
      averageCost: 292,
      successRate: 91.0,
      activeCarriers: 15,
      totalClients: 23
    },
    trends: [
      { month: 'Ocak', shipments: 45, revenue: 13200, carriers: 12 },
      { month: 'Şubat', shipments: 52, revenue: 15200, carriers: 14 },
      { month: 'Mart', shipments: 48, revenue: 14000, carriers: 13 },
      { month: 'Nisan', shipments: 61, revenue: 17800, carriers: 15 },
      { month: 'Mayıs', shipments: 58, revenue: 16900, carriers: 14 },
      { month: 'Haziran', shipments: 67, revenue: 19500, carriers: 16 }
    ],
    carrierPerformance: [
      {
        name: 'Hızlı Kargo A.Ş.',
        shipments: 45,
        successRate: 95.6,
        rating: 4.8,
        revenue: 13500
      },
      {
        name: 'Güvenli Taşımacılık',
        shipments: 38,
        successRate: 92.1,
        rating: 4.6,
        revenue: 11400
      },
      {
        name: 'Özel Kargo Hizmetleri',
        shipments: 32,
        successRate: 96.9,
        rating: 4.9,
        revenue: 9600
      }
    ]
  }

  const periods = [
    { value: 'week', label: 'Son Hafta' },
    { value: 'month', label: 'Son Ay' },
    { value: 'quarter', label: 'Son 3 Ay' },
    { value: 'year', label: 'Son Yıl' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Nakliyeci Analitik - YolNet Kargo</title>
        <meta name="description" content="Detaylı analitik veriler ve performans metrikleri." />
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-custom">
          <div className="flex items-center py-4">
            <Link
              to="/nakliyeci/dashboard"
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nakliyeci Analitik</h1>
              <p className="text-sm text-gray-600">Detaylı analitik veriler ve performans metrikleri</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Toplam Gönderi</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.totalShipments}</p>
                <div className="flex items-center text-sm text-green-600 mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+15% bu ay</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Toplam Gelir</p>
                <p className="text-3xl font-bold text-gray-900">₺{analyticsData.summary.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center text-sm text-green-600 mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+22% bu ay</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Başarı Oranı</p>
                <p className="text-3xl font-bold text-gray-900">%{analyticsData.summary.successRate}</p>
                <div className="flex items-center text-sm text-green-600 mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+3% bu ay</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Aktif Taşıyıcı</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.activeCarriers}</p>
                <div className="flex items-center text-sm text-blue-600 mt-2">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{analyticsData.summary.totalClients} müşteri</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {periods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Rapor İndir</span>
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aylık Trend</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{trend.month}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{trend.shipments} gönderi</p>
                        <p className="text-xs text-gray-500">₺{trend.revenue.toLocaleString()}</p>
                      </div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(trend.shipments / 70) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Carrier Performance */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Taşıyıcı Performansı</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.carrierPerformance.map((carrier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{carrier.name}</p>
                        <p className="text-xs text-gray-500">{carrier.shipments} gönderi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">%{carrier.successRate}</p>
                      <p className="text-xs text-gray-500">₺{carrier.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detaylı İstatistikler</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Tamamlanan</h3>
                <p className="text-3xl font-bold text-green-600">{analyticsData.summary.completed}</p>
                <p className="text-sm text-gray-500">Gönderi</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Devam Eden</h3>
                <p className="text-3xl font-bold text-blue-600">{analyticsData.summary.inProgress}</p>
                <p className="text-sm text-gray-500">Gönderi</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">İptal Edilen</h3>
                <p className="text-3xl font-bold text-red-600">{analyticsData.summary.cancelled}</p>
                <p className="text-sm text-gray-500">Gönderi</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Ortalama Maliyet</h3>
                <p className="text-3xl font-bold text-purple-600">₺{analyticsData.summary.averageCost}</p>
                <p className="text-sm text-gray-500">Gönderi başına</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default NakliyeciAnalytics