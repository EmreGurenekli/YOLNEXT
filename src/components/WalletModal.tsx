import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  Plus,
  Minus,
  CreditCard,
  History,
  DollarSign,
} from 'lucide-react';
import { createApiUrl } from '../config/api';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'transactions'>(
    'wallet'
  );

  useEffect(() => {
    if (isOpen) {
      loadWalletData();
    }
  }, [isOpen]);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      // Load balance
      const balanceResponse = await fetch(
        createApiUrl('/api/wallet/balance'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData.data.balance);
      }

      // Load transactions
      const transactionsResponse = await fetch(
        createApiUrl('/api/transactions'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Cüzdan verileri yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);

    if (!amount || amount <= 0) {
      alert('Geçerli bir miktar girin');
      return;
    }

    try {
      setIsDepositing(true);
      const token = localStorage.getItem('authToken');

      const intentRes = await fetch(createApiUrl('/api/wallet/topup/intent'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const intentJson = await intentRes.json().catch(() => null);
      if (!intentRes.ok || !intentJson?.success) {
        alert(intentJson?.message || 'Para yatırılamadı');
        return;
      }

      const provider = intentJson?.data?.provider;
      const providerIntentId = intentJson?.data?.providerIntentId;

      if (provider === 'mock' && providerIntentId) {
        const confirmRes = await fetch(createApiUrl('/api/wallet/topup/confirm'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ providerIntentId }),
        });

        const confirmJson = await confirmRes.json().catch(() => null);
        if (!confirmRes.ok || !confirmJson?.success) {
          alert(confirmJson?.message || 'Ödeme doğrulanamadı');
          return;
        }

        setDepositAmount('');
        loadWalletData(); // Reload transactions
        alert('Para başarıyla yatırıldı!');
        return;
      }

      alert('Ödeme adımı gerekli. Lütfen ödeme ekranını tamamlayın.');
    } catch (error) {
      console.error('Para yatırma sırasında hata:', error);
      alert('Para yatırılamadı');
    } finally {
      setIsDepositing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className='w-4 h-4 text-green-500' />;
      case 'withdrawal':
        return <Minus className='w-4 h-4 text-red-500' />;
      case 'commission':
        return <DollarSign className='w-4 h-4 text-blue-500' />;
      default:
        return <CreditCard className='w-4 h-4 text-gray-500' />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'commission':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
              <Wallet className='w-5 h-5 text-green-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Cüzdan</h2>
              <p className='text-sm text-gray-600'>
                Bakiye ve işlemlerinizi yönetin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'wallet'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cüzdan
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'transactions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            İşlemler
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {isLoading ? (
            <div className='flex justify-center items-center h-32'>
              <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            </div>
          ) : activeTab === 'wallet' ? (
            <div className='space-y-6'>
              {/* Balance Card */}
              <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-green-100 text-sm'>Toplam Bakiye</p>
                    <p className='text-3xl font-bold'>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <Wallet className='w-12 h-12 text-green-200' />
                </div>
              </div>

              {/* Deposit Form */}
              <div className='bg-gray-50 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Para Yatır
                </h3>
                <form onSubmit={handleDeposit} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Miktar (₺)
                    </label>
                    <input
                      type='number'
                      step='0.01'
                      min='0'
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                      placeholder='0.00'
                      required
                    />
                  </div>
                  <button
                    type='submit'
                    disabled={!depositAmount || isDepositing}
                    className='w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                  >
                    {isDepositing ? (
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <>
                        <Plus className='w-4 h-4' />
                        Para Yatır
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Info */}
              <div className='bg-blue-50 rounded-xl p-4'>
                <h4 className='font-semibold text-blue-900 mb-2'>Bilgi</h4>
                <ul className='text-sm text-blue-800 space-y-1'>
                  <li>• Teklif verirken %1 komisyon kesilir</li>
                  <li>• Komisyon sadece teklif kabul edildiğinde alınır</li>
                  <li>• Reddedilen tekliflerde komisyon alınmaz</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                İşlem Geçmişi
              </h3>

              {transactions.length === 0 ? (
                <div className='text-center text-gray-500 py-8'>
                  <History className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p>Henüz işlem yok</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'
                    >
                      <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center'>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium text-gray-900'>
                          {transaction.description}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {formatDateTime(transaction.created_at)}
                        </p>
                      </div>
                      <div
                        className={`font-semibold ${getTransactionColor(transaction.type)}`}
                      >
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
