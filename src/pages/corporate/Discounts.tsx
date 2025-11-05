import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Percent,
  Award,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Info,
} from 'lucide-react';

interface Discount {
  id: number;
  name: string;
  description: string;
  percentage: number;
  startDate: string;
  endDate: string;
  minAmount: number;
  applicableShipments: string[];
}

const CorporateDiscounts: React.FC = () => {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      // API çağrısı yapılacak
      // TODO: Backend API entegrasyonu
      setDiscounts([]);
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActiveDiscount = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>İndirimler - Kurumsal Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            İndirimlerim
          </h1>
          <p className='text-gray-600'>
            Mevcut indirim fırsatlarınızı görüntüleyin
          </p>
        </div>

        {loading ? (
          <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Yükleniyor...</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {discounts.map(discount => (
              <div
                key={discount.id}
                className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                  isActiveDiscount(discount.endDate)
                    ? 'border-green-500'
                    : 'border-gray-200'
                }`}
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
                      <Percent className='w-6 h-6 text-white' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-900'>
                        {discount.name}
                      </h3>
                      {isActiveDiscount(discount.endDate) && (
                        <span className='text-xs text-green-600 flex items-center gap-1'>
                          <CheckCircle className='w-4 h-4' />
                          Aktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className='text-gray-600 text-sm mb-4'>
                  {discount.description}
                </p>

                <div className='bg-blue-50 rounded-lg p-3 mb-4'>
                  <div className='text-3xl font-bold text-blue-900 text-center'>
                    %{discount.percentage}
                  </div>
                  <div className='text-xs text-blue-700 text-center mt-1'>
                    İndirim
                  </div>
                </div>

                <div className='space-y-2 text-sm text-gray-600'>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    <span>
                      Geçerlilik:{' '}
                      {new Date(discount.startDate).toLocaleDateString('tr-TR')}{' '}
                      - {new Date(discount.endDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  {discount.minAmount > 0 && (
                    <div className='flex items-center gap-2'>
                      <DollarSign className='w-4 h-4' />
                      <span>
                        Min. Tutar: ₺{discount.minAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center gap-2'>
                    <Info className='w-4 h-4' />
                    <span>
                      Geçerli Gönderiler:{' '}
                      {discount.applicableShipments.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateDiscounts;
