import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Download,
  Calendar, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Package,
  Truck,
  Clock,
  CheckCircle
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface EarningsData {
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  averagePerJob: number;
  totalJobs: number;
  completedJobs: number;
  pendingPayments: number;
  lastPayment: string;
  nextPayment: string;
  growthRate: number;
  topMonth: string;
  topMonthEarnings: number;
}

interface EarningsHistory {
  id: number;
  date: string;
  amount: number;
  jobId: string;
  client: string;
  status: 'paid' | 'pending' | 'processing';
  type: 'job' | 'bonus' | 'penalty';
  description: string;
}

const generateMockEarningsHistory = (count: number): EarningsHistory[] => {
  const statuses = ['paid', 'pending', 'processing'];
  const types = ['job', 'bonus', 'penalty'];
  const clients = ['TechCorp A.Ş.', 'E-Ticaret Ltd.', 'Gıda A.Ş.', 'Lojistik Pro', 'Hızlı Kargo'];
  const descriptions = [
    'İş tamamlama ücreti',
    'Hızlı teslimat bonusu',
    'Müşteri memnuniyeti bonusu',
    'Gecikme cezası',
    'Acil iş ücreti'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    date: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    amount: Math.floor(Math.random() * 5000) + 500,
    jobId: `JOB-${1000 + i}`,
    client: clients[Math.floor(Math.random() * clients.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)] as any,
    type: types[Math.floor(Math.random() * types.length)] as any,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
  }));
};

export default function TasiyiciEarnings() {
  const [earningsData] = useState<EarningsData>({
    totalEarnings: 125000,
    weeklyEarnings: 8500,
    monthlyEarnings: 32000,
    yearlyEarnings: 125000,
    averagePerJob: 2500,
    totalJobs: 50,
    completedJobs: 48,
    pendingPayments: 3500,
    lastPayment: '2024-01-15',
    nextPayment: '2024-01-22',
    growthRate: 12.5,
    topMonth: 'Aralık 2023',
    topMonthEarnings: 38000
  });

  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<EarningsHistory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setEarningsHistory(generateMockEarningsHistory(30));
      setIsLoading(false);
    }, 1000);
  }, []);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/tasiyici/dashboard' },
    { label: 'Kazançlarım', icon: <DollarSign className="w-4 h-4" /> }
  ];

  const filteredHistory = earningsHistory.filter(earning => {
    const matchesSearch = searchTerm === '' ||
      earning.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || earning.status === filterStatus;
    const matchesType = filterType === 'all' || earning.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusStyle = (status: EarningsHistory['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: EarningsHistory['status']) => {
    switch (status) {
      case 'paid': return 'Ödendi';
      case 'pending': return 'Beklemede';
      case 'processing': return 'İşleniyor';
      default: return 'Bilinmiyor';
    }
  };

  const getTypeStyle = (type: EarningsHistory['type']) => {
    switch (type) {
      case 'job': return 'bg-blue-100 text-blue-800';
      case 'bonus': return 'bg-green-100 text-green-800';
      case 'penalty': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeText = (type: EarningsHistory['type']) => {
    switch (type) {
      case 'job': return 'İş Ücreti';
      case 'bonus': return 'Bonus';
      case 'penalty': return 'Cezai İşlem';
      default: return 'Bilinmiyor';
    }
  };

  const handleViewDetails = (earning: EarningsHistory) => {
    setSelectedEarning(earning);
    setShowDetailModal(true);
  };

  const handleDownloadReport = () => {
    setSuccessMessage('Kazanç raporu indiriliyor...');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Kazanç verileri yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Kazançlarım - Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Taşıyıcı kazanç yönetimi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Kazançlarım</h1>
              <p className="text-sm text-slate-600">Gelir analizi ve ödeme takibi</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Rapor İndir</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filtreler</span>
            </button>
          </div>
        </div>

        {/* Earnings Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Kazanç</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">₺{earningsData.totalEarnings.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+%{earningsData.growthRate}</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bu Hafta</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">₺{earningsData.weeklyEarnings.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">+8.2%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bu Ay</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">₺{earningsData.monthlyEarnings.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+15.3%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bekleyen Ödeme</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">₺{earningsData.pendingPayments.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Sonraki: {earningsData.nextPayment}</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">İş Performansı</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
                    <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Toplam İş</span>
                <span className="font-medium">{earningsData.totalJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Tamamlanan</span>
                <span className="font-medium text-green-600">{earningsData.completedJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Başarı Oranı</span>
                <span className="font-medium text-green-600">%{Math.round((earningsData.completedJobs / earningsData.totalJobs) * 100)}</span>
                          </div>
                        </div>
                      </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Ortalama Kazanç</h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">İş Başına</span>
                <span className="font-medium">₺{earningsData.averagePerJob.toLocaleString()}</span>
                          </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Günlük Ortalama</span>
                <span className="font-medium">₺{Math.round(earningsData.weeklyEarnings / 7).toLocaleString()}</span>
                        </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Haftalık Ortalama</span>
                <span className="font-medium">₺{earningsData.weeklyEarnings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">En İyi Ay</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
                    <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Ay</span>
                <span className="font-medium">{earningsData.topMonth}</span>
                      </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Kazanç</span>
                <span className="font-medium text-green-600">₺{earningsData.topMonthEarnings.toLocaleString()}</span>
                      </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Büyüme</span>
                <span className="font-medium text-green-600">+%{earningsData.growthRate}</span>
                    </div>
                  </div>
                </div>
              </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                  placeholder="Kazanç ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                      />
                    </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="paid">Ödendi</option>
                      <option value="pending">Beklemede</option>
                <option value="processing">İşleniyor</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Türler</option>
                <option value="job">İş Ücreti</option>
                <option value="bonus">Bonus</option>
                <option value="penalty">Cezai İşlem</option>
              </select>
              
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Zamanlar</option>
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
                <option value="year">Bu Yıl</option>
                    </select>
                  </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterType('all');
                  setDateRange('all');
                  setShowFilters(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Filtreleri Temizle
              </button>
            </div>
                </div>
        )}

        {/* Earnings History */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Kazanç Geçmişi</h3>
          </div>
          <div className="p-4 sm:p-6">
            {filteredHistory.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Kazanç bulunamadı"
                description="Arama kriterlerinize uygun kazanç bulunamadı."
              />
            ) : (
                <div className="space-y-4">
                {filteredHistory.map((earning) => (
                  <div key={earning.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-slate-900">#{earning.jobId}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(earning.status)}`}>
                            {getStatusText(earning.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeStyle(earning.type)}`}>
                            {getTypeText(earning.type)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Müşteri</p>
                            <p className="text-sm font-medium text-slate-900">{earning.client}</p>
                        </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Tutar</p>
                            <p className="text-sm font-medium text-slate-900">₺{earning.amount.toLocaleString()}</p>
                      </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Tarih</p>
                            <p className="text-sm font-medium text-slate-900">{new Date(earning.date).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600">{earning.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(earning)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
                      </div>
                    </div>
                  </div>

      {/* Earning Detail Modal */}
      {showDetailModal && selectedEarning && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Kazanç Detayları: ${selectedEarning.jobId}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">İş Numarası</p>
                <p className="font-medium">{selectedEarning.jobId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="font-medium">{getStatusText(selectedEarning.status)}</p>
                    </div>
                  </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Müşteri</p>
                <p className="font-medium">{selectedEarning.client}</p>
                      </div>
              <div>
                <p className="text-sm text-slate-500">Tutar</p>
                <p className="font-medium">₺{selectedEarning.amount.toLocaleString()}</p>
                    </div>
                  </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Tür</p>
                <p className="font-medium">{getTypeText(selectedEarning.type)}</p>
                </div>
              <div>
                <p className="text-sm text-slate-500">Tarih</p>
                <p className="font-medium">{new Date(selectedEarning.date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Açıklama</p>
              <p className="font-medium">{selectedEarning.description}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Kapat
            </button>
        </div>
        </Modal>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}