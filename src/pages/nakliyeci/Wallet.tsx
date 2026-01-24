import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Wallet as WalletIcon,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  CreditCard,
  History,
  AlertTriangle,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface CommissionTransaction {
  id: number;
  offerId: number;
  shipmentTitle: string;
  amount: number;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

interface WalletData {
  balance: number;
  pendingCommissions: number;
  totalCommissions: number;
  commissionRate: number;
}

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    pendingCommissions: 0,
    totalCommissions: 0,
    commissionRate: 1,
  });
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/nakliyeci/dashboard' },
    { label: 'Cüzdan', href: '/nakliyeci/wallet' },
  ];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId =
        user?.id || localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user') || '{}').id
          : null;
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl('/api/wallet/nakliyeci'),
        {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Cüzdan verileri yüklenemedi');
      }

      const data = await response.json();

      if (data.success) {
        // Backend format: { success: true, data: { balance, transactions } }
        const walletData = data.data || {};
        setWalletData({
          balance: walletData.balance || 0,
          pendingCommissions: walletData.pendingCommissions || 0,
          totalCommissions: walletData.totalCommissions || 0,
          commissionRate: walletData.commissionRate || 1,
        });
        setTransactions(walletData.transactions || data.transactions || []);
      } else {
        throw new Error(data.message || 'Cüzdan verileri yüklenemedi');
      }
    } catch (err) {
      console.error('Cüzdan verileri yüklenemedi:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Geçerli bir miktar girin');
      return;
    }

    try {
      setError(null);
      const token = localStorage.getItem('authToken');
      const amount = parseFloat(depositAmount);

      const intentRes = await fetch(createApiUrl('/api/wallet/topup/intent'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const intentJson = await intentRes.json().catch(() => null);
      if (!intentRes.ok || !intentJson?.success) {
        setError(intentJson?.message || 'Para yatırma işlemi başarısız');
        return;
      }

      const provider = intentJson?.data?.provider;
      const providerIntentId = intentJson?.data?.providerIntentId;

      if (provider === 'mock' && providerIntentId) {
        const confirmRes = await fetch(createApiUrl('/api/wallet/topup/confirm'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ providerIntentId }),
        });

        const confirmJson = await confirmRes.json().catch(() => null);
        if (!confirmRes.ok || !confirmJson?.success) {
          setError(confirmJson?.message || 'Ödeme doğrulanamadı');
          return;
        }

        setDepositAmount('');
        setShowDepositModal(false);
        loadWalletData();
        return;
      }

      setError('Ödeme adımı gerekli. Lütfen ödeme ekranını tamamlayın.');
    } catch (err) {
      console.error('Para yatırma hatası:', err);
      setError('Para yatırma işlemi başarısız');
    }
  };

  // Using format helpers from utils/format.ts
  const formatPrice = formatCurrency;
  const formatDate = formatDateTime;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-500' />;
      default:
        return <AlertCircle className='w-4 h-4 text-gray-500' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Bekliyor';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return <LoadingState message='Cüzdan verileri yükleniyor...' />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Cüzdan - Nakliyeci Paneli | YolNext</title>
        <meta
          name='description'
          content='Nakliyeci cüzdan yönetimi ve komisyon takibi'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <WalletIcon className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Cüzdan
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Bakiye yönetimi ve komisyon takibi
          </p>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='nakliyeci.wallet'
            isEmpty={!loading && transactions.length === 0}
            icon={WalletIcon}
            title='Cüzdan'
            description='Teklif verirken komisyon blokesini, teklif kabul edildiğinde komisyon kesintisini buradan takip edebilirsin. Yeni iş almak için “Yük Pazarı”na, aktif operasyon için “Aktif Yükler”e geç.'
            primaryAction={{
              label: 'Yük Pazarı',
              to: '/nakliyeci/jobs',
            }}
            secondaryAction={{
              label: 'Aktif Yükler',
              to: '/nakliyeci/active-shipments',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className='flex justify-center mb-8'>
          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button
              onClick={loadWalletData}
              className='flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors'
            >
              <RefreshCw className='w-4 h-4' />
              Yenile
            </button>
            <button
              onClick={() => setShowDepositModal(true)}
              className='flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium'
            >
              <CreditCard className='w-4 h-4 sm:w-5 sm:h-5' />
              <span className='hidden sm:inline'>Para Yatır</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-xl p-4 mb-4 sm:mb-6'>
            <div className='flex items-center'>
              <AlertCircle className='w-5 h-5 text-red-400 mr-2' />
              <p className='text-red-800'>{error}</p>
            </div>
          </div>
        )}

        {/* Wallet Overview */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* Current Balance */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-blue-100 rounded-lg'>
                <WalletIcon className='w-6 h-6 text-blue-600' />
              </div>
              <button
                onClick={loadWalletData}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <RefreshCw className='w-4 h-4 text-gray-500' />
              </button>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Mevcut Bakiye</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatPrice(walletData?.balance || 0)}
              </p>
            </div>
          </div>

          {/* Pending Commissions */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-yellow-100 rounded-lg'>
                <Clock className='w-6 h-6 text-yellow-600' />
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Bekleyen Komisyonlar</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatPrice(walletData?.pendingCommissions || 0)}
              </p>
            </div>
          </div>

          {/* Total Commissions */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-green-100 rounded-lg'>
                <TrendingDown className='w-6 h-6 text-green-600' />
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Toplam Komisyon</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatPrice(walletData?.totalCommissions || 0)}
              </p>
            </div>
          </div>

          {/* Commission Rate */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-purple-100 rounded-lg'>
                <Info className='w-6 h-6 text-purple-600' />
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-600 mb-1'>Komisyon Oranı</p>
              <p className='text-2xl font-bold text-gray-900'>
                %{walletData?.commissionRate || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Low Balance Warning */}
        {(walletData?.balance || 0) < 100 && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6'>
            <div className='flex items-center'>
              <AlertTriangle className='w-5 h-5 text-yellow-500 mr-2' />
              <div>
                <p className='text-yellow-800 font-medium'>
                  Düşük Bakiye Uyarısı
                </p>
                <p className='text-yellow-700 text-sm'>
                  Bakiyeniz düşük. Teklif verebilmek için cüzdanınıza para
                  yatırın.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Commission History */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
          <div className='p-4 sm:p-6 border-b border-gray-200'>
            <div className='flex items-center gap-3'>
              <History className='w-5 h-5 text-gray-600' />
              <h2 className='text-lg font-semibold text-gray-900'>
                Komisyon Geçmişi
              </h2>
            </div>
          </div>

          <div className='p-4 sm:p-6'>
            {transactions.length === 0 ? (
              <div className='min-h-[320px] lg:min-h-[50vh] flex items-center justify-center'>
                <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center w-full max-w-2xl'>
                  <EmptyState
                    icon={History}
                    title='Henüz komisyon işlemi yok'
                    description='Teklif verdiğinizde komisyon işlemleri burada görünecek'
                  />
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                {transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div className='flex items-center gap-4'>
                      {getStatusIcon(transaction.status)}
                      <div>
                        <p className='font-medium text-gray-900'>
                          {transaction.shipmentTitle}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {transaction.status === 'completed' &&
                          transaction.completedAt
                            ? formatDate(transaction.completedAt)
                            : formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold text-gray-900'>
                        -{formatPrice(transaction.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                      >
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-xl max-w-md w-full'>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Para Yatır
                </h3>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Yatırılacak Miktar (₺)
                    </label>
                    <input
                      type='number'
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder='0.00'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      min='1'
                      step='0.01'
                    />
                  </div>
                  <div className='flex gap-3'>
                    <button
                      onClick={() => setShowDepositModal(false)}
                      className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleDeposit}
                      className='flex-1 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-blue-900 hover:to-slate-800 transition-colors'
                    >
                      Yatır
                    </button>
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

export default Wallet;











