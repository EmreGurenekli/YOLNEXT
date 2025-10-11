import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';

interface CommissionData {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  carrierName: string;
  amount: number;
  commission: number;
  commissionRate: number;
  status: 'pending' | 'paid' | 'cancelled';
  date: string;
  paymentDate?: string;
}

interface CommissionTrackerProps {
  userType: 'carrier' | 'admin';
  data: CommissionData[];
  onFilter?: (filters: any) => void;
}

const CommissionTracker: React.FC<CommissionTrackerProps> = ({ userType, data, onFilter }) => {
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    minAmount: '',
    maxAmount: ''
  });

  const [stats, setStats] = useState({
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    thisMonth: 0,
    lastMonth: 0,
    growth: 0
  });

  useEffect(() => {
    calculateStats();
  }, [data, filters]);

  const calculateStats = () => {
    const filteredData = data.filter(item => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.minAmount && item.commission < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && item.commission > parseFloat(filters.maxAmount)) return false;
      return true;
    });

    const total = filteredData.reduce((sum, item) => sum + item.commission, 0);
    const paid = filteredData.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.commission, 0);
    const pending = filteredData.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.commission, 0);

    const now = new Date();
    const thisMonth = filteredData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }).reduce((sum, item) => sum + item.commission, 0);

    const lastMonth = filteredData.filter(item => {
      const itemDate = new Date(item.date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return itemDate.getMonth() === lastMonthDate.getMonth() && itemDate.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, item) => sum + item.commission, 0);

    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    setStats({
      totalCommission: total,
      paidCommission: paid,
      pendingCommission: pending,
      thisMonth,
      lastMonth,
      growth
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilter) onFilter(newFilters);
  };

  const exportData = () => {
    const csvContent = [
      ['Tarih', 'Gönderi No', 'Nakliyeci', 'Tutar', 'Komisyon', 'Durum'],
      ...data.map(item => [
        new Date(item.date).toLocaleDateString('tr-TR'),
        item.trackingNumber,
        item.carrierName,
        item.amount.toFixed(2),
        item.commission.toFixed(2),
        item.status === 'paid' ? 'Ödendi' : item.status === 'pending' ? 'Bekliyor' : 'İptal'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'komisyon-raporu.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Ödendi';
      case 'pending': return 'Bekliyor';
      case 'cancelled': return 'İptal';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Komisyon</p>
              <p className="text-2xl font-bold text-gray-900">
                ₺{stats.totalCommission.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ödenen</p>
              <p className="text-2xl font-bold text-green-600">
                ₺{stats.paidCommission.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">
                ₺{stats.pendingCommission.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bu Ay</p>
              <p className="text-2xl font-bold text-gray-900">
                ₺{stats.thisMonth.toFixed(2)}
              </p>
              <div className={`flex items-center text-sm ${
                stats.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.growth >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {Math.abs(stats.growth).toFixed(1)}%
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtreler:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Durumlar</option>
            <option value="paid">Ödendi</option>
            <option value="pending">Bekliyor</option>
            <option value="cancelled">İptal</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Tarihler</option>
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="year">Bu Yıl</option>
          </select>

          <input
            type="number"
            placeholder="Min Tutar"
            value={filters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
          />

          <input
            type="number"
            placeholder="Max Tutar"
            value={filters.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
          />

          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Komisyon Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Komisyon Geçmişi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gönderi No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nakliyeci
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Komisyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {item.trackingNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.carrierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₺{item.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₺{item.commission.toFixed(2)}
                    <span className="text-xs text-gray-500 ml-1">
                      ({item.commissionRate * 100}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionTracker;

