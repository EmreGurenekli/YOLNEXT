import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Users, TrendingUp, TrendingDown, Filter, Download, Calendar, Building2 } from 'lucide-react';

interface DepartmentData {
  id: string;
  name: string;
  manager: string;
  employees: number;
  budget: number;
  spent: number;
  efficiency: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export default function DepartmentReporting() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const departments: DepartmentData[] = [
    {
      id: '1',
      name: 'Lojistik Departmanı',
      manager: 'Ahmet Yılmaz',
      employees: 25,
      budget: 150000,
      spent: 125000,
      efficiency: 83.3,
      trend: 'up',
      change: 12.5
    },
    {
      id: '2',
      name: 'Mali İşler',
      manager: 'Zeynep Kaya',
      employees: 8,
      budget: 50000,
      spent: 45000,
      efficiency: 90,
      trend: 'up',
      change: 8.3
    },
    {
      id: '3',
      name: 'İnsan Kaynakları',
      manager: 'Mehmet Demir',
      employees: 5,
      budget: 30000,
      spent: 28000,
      efficiency: 93.3,
      trend: 'stable',
      change: 0
    },
    {
      id: '4',
      name: 'Teknoloji',
      manager: 'Ayşe Özkan',
      employees: 12,
      budget: 80000,
      spent: 75000,
      efficiency: 93.8,
      trend: 'down',
      change: -5.2
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Departman Raporları - YolNet</title>
        <meta name="description" content="YolNet departman bazlı raporlama sistemi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Departman Raporları</h1>
            <p className="text-gray-600 mt-2">Departman bazlı performans ve maliyet analizi</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Filter size={20} />
              Filtrele
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download size={20} />
              Rapor İndir
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Departman</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tümü</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zaman Aralığı</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Aralığı</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Toplam Departman</h3>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Toplam Çalışan</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {departments.reduce((sum, dept) => sum + dept.employees, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Toplam Bütçe</h3>
                <p className="text-2xl font-bold text-gray-900">
                  ₺{departments.reduce((sum, dept) => sum + dept.budget, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Ortalama Verimlilik</h3>
                <p className="text-2xl font-bold text-gray-900">
                  %{Math.round(departments.reduce((sum, dept) => sum + dept.efficiency, 0) / departments.length)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map((department) => (
            <div key={department.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-600">Müdür: {department.manager}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(department.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(department.trend)}`}>
                    %{Math.abs(department.change)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Çalışan Sayısı</p>
                  <p className="text-xl font-semibold text-gray-900">{department.employees}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Verimlilik</p>
                  <p className={`text-xl font-semibold ${getEfficiencyColor(department.efficiency)}`}>
                    %{department.efficiency}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bütçe</span>
                  <span className="font-semibold text-gray-900">₺{department.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Harcanan</span>
                  <span className="font-semibold text-gray-900">₺{department.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kalan</span>
                  <span className="font-semibold text-green-600">
                    ₺{(department.budget - department.spent).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Bütçe Kullanımı</span>
                  <span>%{Math.round((department.spent / department.budget) * 100)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(department.spent / department.budget) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}