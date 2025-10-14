import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  TrendingUp, 
  DollarSign, 
  Plus, 
  History, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  RefreshCw,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

const Balance = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Bakiye Yönetimi', icon: <DollarSign className="w-4 h-4" /> }
  ];

  // Mock data
  const [balanceData, setBalanceData] = useState({
    currentBalance: 1250.50,
    commissionRate: 1,
    totalCommissions: 185.00,
    pendingCommissions: 45.75,
    totalDeposits: 2000.00,
    totalWithdrawals: 750.00,
    monthlyEarnings: 4200.75
  });

  const [transactions] = useState([
    {
      id: 1,
      type: 'deposit',
      amount: 500.00,
      description: 'Para Yatırma',
      status: 'completed',
      date: '2024-01-15T14:30:00Z',
      reference: 'DEP-001234',
      method: 'Banka Havalesi'
    },
    {
      id: 2,
      type: 'commission',
      amount: -12.50,
      description: 'Komisyon - Teklif #YN001234',
      status: 'completed',
      date: '2024-01-15T16:45:00Z',
      reference: 'COM-001234',
      method: 'Otomatik'
    },
    {
      id: 3,
      type: 'commission',
      amount: -25.00,
      description: 'Komisyon - Teklif #YN001235',
      status: 'completed',
      date: '2024-01-14T10:20:00Z',
      reference: 'COM-001235',
      method: 'Otomatik'
    },
    {
      id: 5,
      type: 'deposit',
      amount: 1000.00,
      description: 'Para Yatırma',
      status: 'completed',
      date: '2024-01-12T11:30:00Z',
      reference: 'DEP-001233',
      method: 'Kredi Kartı'
    }
  ]);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setSuccessMessage('Lütfen geçerli bir miktar girin');
      setShowSuccessMessage(true);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setShowDepositModal(false);
      setDepositAmount('');
      setSuccessMessage(`₺${depositAmount} başarıyla hesabınıza yatırıldı!`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }, 1000);
  };


  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'commission':
        return <DollarSign className="w-4 h-4 text-orange-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-100';
      case 'commission':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Bekliyor';
      case 'failed':
        return 'Başarısız';
      default:
        return 'Bilinmiyor';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Bakiye bilgileri yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Bakiye Yönetimi - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Hesap bakiyesi ve komisyon yönetimi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Bakiye Yönetimi</h1>
              <p className="text-slate-600">Hesap bakiyenizi yönetin ve komisyon takibi yapın</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Para Yatır
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Balance */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4 text-slate-600" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {showBalance ? `₺${balanceData.currentBalance.toLocaleString()}` : '••••••'}
            </div>
            <div className="text-slate-600 font-medium">Mevcut Bakiye</div>
            <div className="text-sm text-slate-500 mt-1">Teklif verebilmek için</div>
          </div>

          {/* Commission Rate */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">%{balanceData.commissionRate}</div>
            <div className="text-slate-600 font-medium">Komisyon Oranı</div>
            <div className="text-sm text-slate-500 mt-1">Her teklif için</div>
          </div>

          {/* Total Commissions */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <History className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">₺{balanceData.totalCommissions.toLocaleString()}</div>
            <div className="text-slate-600 font-medium">Toplam Komisyon</div>
            <div className="text-sm text-slate-500 mt-1">Bu ay ödenen</div>
          </div>

          {/* Pending Commissions */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">₺{balanceData.pendingCommissions.toLocaleString()}</div>
            <div className="text-slate-600 font-medium">Bekleyen Komisyon</div>
            <div className="text-sm text-slate-500 mt-1">Henüz ödenmemiş</div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">İşlem Geçmişi</h2>
                <p className="text-slate-600">Tüm bakiye işlemleriniz</p>
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="İşlem ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tüm İşlemler</option>
                  <option value="deposit">Para Yatırma</option>
                  <option value="commission">Komisyon</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">İşlem</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Miktar</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Referans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{transaction.description}</div>
                          <div className="text-sm text-slate-500">{transaction.method}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}₺{Math.abs(transaction.amount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm text-slate-900">{getStatusText(transaction.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(transaction.date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                      {transaction.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deposit Modal */}
        <Modal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          title="Para Yatır"
          size="md"
        >
          <div className="space-y-6">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">Mevcut Bakiye</p>
                  <p className="text-2xl font-bold text-emerald-600">₺{balanceData.currentBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900">Hızlı Yatırım</h4>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                  onClick={() => setDepositAmount('100')}
                >
                  <div className="text-xl font-semibold text-slate-900">₺100</div>
                  <div className="text-xs text-slate-500">Hızlı yatırım</div>
                </button>
                <button 
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                  onClick={() => setDepositAmount('500')}
                >
                  <div className="text-xl font-semibold text-slate-900">₺500</div>
                  <div className="text-xs text-slate-500">Orta yatırım</div>
                </button>
                <button 
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                  onClick={() => setDepositAmount('1000')}
                >
                  <div className="text-xl font-semibold text-slate-900">₺1,000</div>
                  <div className="text-xs text-slate-500">Büyük yatırım</div>
                </button>
                <button 
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                  onClick={() => setDepositAmount('2000')}
                >
                  <div className="text-xl font-semibold text-slate-900">₺2,000</div>
                  <div className="text-xs text-slate-500">Maksimum yatırım</div>
                </button>
              </div>
              
              <div className="flex gap-3">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Özel miktar girin"
                  className="flex-1 p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button 
                  onClick={handleDeposit}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-200"
                >
                  Yatır
                </button>
              </div>
            </div>
          </div>
        </Modal>


        {/* Success Message */}
        {showSuccessMessage && (
          <SuccessMessage
            message={successMessage}
            isVisible={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Balance;


