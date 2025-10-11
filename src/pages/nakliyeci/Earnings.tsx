import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Filter, 
  BarChart3, 
  PieChart, 
  Activity,
  Truck,
  Package,
  Users,
  Clock,
  Target,
  Award
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';

const Earnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDriver, setSelectedDriver] = useState('all');

  // Mock data - Gerçek API'den gelecek
  const mockEarnings = {
    totalEarnings: 18500.25,
    thisMonthEarnings: 4200.75,
    lastMonthEarnings: 3800.50,
    growthRate: 10.5,
    totalTrips: 156,
    averageEarningsPerTrip: 118.59,
    topEarningDriver: {
      name: 'Ahmet Yılmaz',
      earnings: 5200.00,
      trips: 28
    },
    monthlyBreakdown: [
      { month: 'Ocak', earnings: 4200.75, trips: 28 },
      { month: 'Aralık', earnings: 3800.50, trips: 25 },
      { month: 'Kasım', earnings: 4100.25, trips: 27 },
      { month: 'Ekim', earnings: 3900.00, trips: 26 },
      { month: 'Eylül', earnings: 3600.75, trips: 24 },
      { month: 'Ağustos', earnings: 3300.50, trips: 22 }
    ],
    driverEarnings: [
      { name: 'Ahmet Yılmaz', earnings: 5200.00, trips: 28, percentage: 28.1 },
      { name: 'Mehmet Kaya', earnings: 3800.50, trips: 25, percentage: 20.5 },
      { name: 'Fatma Demir', earnings: 4500.25, trips: 30, percentage: 24.3 },
      { name: 'Ali Özkan', earnings: 2800.00, trips: 18, percentage: 15.1 },
      { name: 'Ayşe Yıldız', earnings: 2200.50, trips: 15, percentage: 11.9 }
    ],
    categoryBreakdown: [
      { category: 'Ev Eşyası', earnings: 8500.25, trips: 45, percentage: 45.9 },
      { category: 'Elektronik', earnings: 4200.50, trips: 28, percentage: 22.7 },
      { category: 'Ofis Mobilyası', earnings: 3200.00, trips: 22, percentage: 17.3 },
      { category: 'Kişisel Eşya', earnings: 2600.50, trips: 18, percentage: 14.1 }
    ],
    recentTransactions: [
      {
        id: '1',
        date: '2024-01-23',
        driver: 'Ahmet Yılmaz',
        route: 'İstanbul → Ankara',
        amount: 1200.00,
        status: 'completed',
        type: 'shipment'
      },
      {
        id: '2',
        date: '2024-01-23',
        driver: 'Fatma Demir',
        route: 'İzmir → Bursa',
        amount: 1800.50,
        status: 'completed',
        type: 'shipment'
      },
      {
        id: '3',
        date: '2024-01-22',
        driver: 'Mehmet Kaya',
        route: 'Ankara → İstanbul',
        amount: 950.25,
        status: 'pending',
        type: 'shipment'
      },
      {
        id: '4',
        date: '2024-01-22',
        driver: 'Ali Özkan',
        route: 'Bursa → İzmir',
        amount: 750.00,
        status: 'completed',
        type: 'shipment'
      }
    ]
  };

  useEffect(() => {
    const loadEarnings = async () => {
      setIsLoading(true);
      // Simüle edilmiş API çağrısı
      setTimeout(() => {
        setEarnings(mockEarnings);
        setIsLoading(false);
      }, 1000);
    };
    loadEarnings();
  }, [selectedPeriod, selectedDriver]);

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'completed': 'Tamamlandı',
      'pending': 'Beklemede',
      'cancelled': 'İptal Edildi'
    };
    return texts[status] || 'Bilinmiyor';
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Kazanç Raporu - YolNet Nakliyeci</title>
        <meta name="description" content="Nakliyeci kazanç analizi ve raporları" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[
            { name: 'Ana Sayfa', href: '/nakliyeci/dashboard' },
            { name: 'Kazanç Raporu', href: '/nakliyeci/earnings' }
          ]} />
          
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Kazanç Raporu
                  </h1>
                  <p className="text-slate-600 text-lg">
                    Detaylı kazanç analizi ve performans raporları
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="week">Bu Hafta</option>
                  <option value="month">Bu Ay</option>
                  <option value="quarter">Bu Çeyrek</option>
                  <option value="year">Bu Yıl</option>
                </select>
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Rapor İndir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  ₺{earnings.totalEarnings.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">Toplam Kazanç</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-semibold">+{earnings.growthRate}%</span>
              <span className="text-sm text-slate-500">geçen aya göre</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  ₺{earnings.thisMonthEarnings.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">Bu Ay</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Geçen ay: ₺{earnings.lastMonthEarnings.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {earnings.totalTrips}
                </div>
                <div className="text-sm text-slate-600">Toplam Gönderi</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Ortalama: ₺{earnings.averageEarningsPerTrip.toFixed(2)}/gönderi</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {earnings.topEarningDriver.trips}
                </div>
                <div className="text-sm text-slate-600">En Çok Kazanan</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{earnings.topEarningDriver.name}</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Earnings Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Aylık Kazanç Trendi</h3>
              <BarChart3 className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-4">
              {earnings.monthlyBreakdown.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">{month.month}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-900">₺{month.earnings.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{month.trips} gönderi</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Kategori Dağılımı</h3>
              <PieChart className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-4">
              {earnings.categoryBreakdown.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-sm font-medium text-slate-700">{category.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-900">₺{category.earnings.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{category.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Driver Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Şoför Performansı</h3>
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-4">
            {earnings.driverEarnings.map((driver, index) => (
              <div key={driver.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{driver.name}</div>
                    <div className="text-sm text-slate-500">{driver.trips} gönderi</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₺{driver.earnings.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">{driver.percentage}%</div>
                  </div>
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-slate-800 to-blue-900 h-2 rounded-full"
                      style={{ width: `${driver.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Son İşlemler</h3>
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Tarih</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Şoför</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Rota</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Tutar</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Durum</th>
                </tr>
              </thead>
              <tbody>
                {earnings.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 text-sm text-slate-900">{transaction.date}</td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-900">{transaction.driver}</td>
                    <td className="py-4 px-4 text-sm text-slate-600">{transaction.route}</td>
                    <td className="py-4 px-4 text-sm font-bold text-slate-900">₺{transaction.amount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
