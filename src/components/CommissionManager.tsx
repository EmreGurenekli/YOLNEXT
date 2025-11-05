import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calculator,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Download,
  X,
} from 'lucide-react';
import { createApiUrl } from '../config/api';

interface Commission {
  id: number;
  shipment_id: number;
  price: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  status: 'calculated' | 'processed' | 'pending';
  created_at: string;
  processed_at?: string;
}

interface CommissionStats {
  by_status: Array<{
    status: string;
    count: number;
    total_commission: number;
    total_revenue: number;
    avg_rate: number;
  }>;
  totals: {
    total_commissions: number;
    total_commission_amount: number;
    total_revenue: number;
  };
  average_commission_rate: number;
}

interface CommissionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommissionManager({
  isOpen,
  onClose,
}: CommissionManagerProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'calculated' | 'processed' | 'pending'
  >('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadCommissions();
      loadStats();
    }
  }, [isOpen, filter, page]);

  const loadCommissions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${createApiUrl('/api/commissions/history')}?status=${filter}&page=${page}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setCommissions(result.data || []);
        setTotalPages(Math.ceil((result.pagination?.total || 0) / 20));
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl('/api/commissions/stats'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading commission stats:', error);
    }
  };

  const processCommission = async (commissionId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl('/api/commissions/process'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ commission_id: commissionId }),
        }
      );

      if (response.ok) {
        loadCommissions();
        loadStats();
      }
    } catch (error) {
      console.error('Error processing commission:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'calculated':
        return <Clock className='w-4 h-4 text-yellow-500' />;
      case 'pending':
        return <AlertCircle className='w-4 h-4 text-red-500' />;
      default:
        return <Clock className='w-4 h-4 text-gray-500' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed':
        return 'İşlendi';
      case 'calculated':
        return 'Hesaplandı';
      case 'pending':
        return 'Beklemede';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black bg-opacity-50'
        onClick={onClose}
      />

      {/* Panel */}
      <div className='absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <DollarSign className='w-6 h-6 text-green-600' />
            <h2 className='text-xl font-semibold text-gray-900'>
              Komisyon Yönetimi
            </h2>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg'
          >
            <X className='w-5 h-5 text-gray-600' />
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='p-6 bg-gray-50 border-b border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='bg-white p-4 rounded-lg shadow-sm'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Toplam Komisyon</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {formatCurrency(stats.totals.total_commission_amount)}
                    </p>
                  </div>
                  <DollarSign className='w-8 h-8 text-green-500' />
                </div>
              </div>

              <div className='bg-white p-4 rounded-lg shadow-sm'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Toplam Gelir</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {formatCurrency(stats.totals.total_revenue)}
                    </p>
                  </div>
                  <TrendingUp className='w-8 h-8 text-blue-500' />
                </div>
              </div>

              <div className='bg-white p-4 rounded-lg shadow-sm'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Ortalama Oran</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      %{(stats.average_commission_rate * 100).toFixed(1)}
                    </p>
                  </div>
                  <Calculator className='w-8 h-8 text-purple-500' />
                </div>
              </div>

              <div className='bg-white p-4 rounded-lg shadow-sm'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Toplam İşlem</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {stats.totals.total_commissions}
                    </p>
                  </div>
                  <History className='w-8 h-8 text-orange-500' />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center gap-4'>
            <Filter className='w-5 h-5 text-gray-600' />
            <div className='flex gap-2'>
              {(['all', 'calculated', 'processed', 'pending'] as const).map(
                status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'Tümü' : getStatusText(status)}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            </div>
          ) : commissions.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <DollarSign className='w-16 h-16 text-gray-300 mb-4' />
              <p className='text-gray-500 text-lg'>Komisyon kaydı bulunamadı</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {commissions.map(commission => (
                <div
                  key={commission.id}
                  className='bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        {getStatusIcon(commission.status)}
                        <span className='font-medium text-gray-900'>
                          Gönderi #{commission.shipment_id}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            commission.status === 'processed'
                              ? 'bg-green-100 text-green-800'
                              : commission.status === 'calculated'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getStatusText(commission.status)}
                        </span>
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
                        <div>
                          <p className='text-sm text-gray-600'>Toplam Tutar</p>
                          <p className='font-semibold text-gray-900'>
                            {formatCurrency(commission.price)}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm text-gray-600'>
                            Komisyon Oranı
                          </p>
                          <p className='font-semibold text-gray-900'>
                            %{(commission.commission_rate * 100).toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm text-gray-600'>
                            Komisyon Tutarı
                          </p>
                          <p className='font-semibold text-green-600'>
                            {formatCurrency(commission.commission_amount)}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm text-gray-600'>Net Tutar</p>
                          <p className='font-semibold text-gray-900'>
                            {formatCurrency(commission.net_amount)}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center justify-between mt-4'>
                        <div className='text-sm text-gray-500'>
                          Oluşturulma: {formatDate(commission.created_at)}
                        </div>
                        {commission.status === 'calculated' && (
                          <button
                            onClick={() => processCommission(commission.id)}
                            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
                          >
                            İşle
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='p-6 border-t border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600'>
                Sayfa {page} / {totalPages}
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className='px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Önceki
                </button>
                <button
                  onClick={() =>
                    setPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                  className='px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Sonraki
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
