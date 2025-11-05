import React, { useState } from 'react';
import {
  Calculator,
  Percent,
  DollarSign,
  TrendingUp,
  Info,
  Users,
} from 'lucide-react';

interface CommissionResult {
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  breakdown: {
    platformFee: number;
    processingFee: number;
    serviceFee: number;
  };
}

const CommissionCalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    amount: '',
    userType: 'individual',
    paymentMethod: 'credit_card',
    isPremium: false,
    volume: '',
  });

  const [result, setResult] = useState<CommissionResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const userTypes = [
    { id: 'individual', name: 'Bireysel', baseRate: 0.08 },
    { id: 'corporate', name: 'Kurumsal', baseRate: 0.06 },
    { id: 'carrier', name: 'Nakliyeci', baseRate: 0.05 },
    { id: 'driver', name: 'Taşıyıcı', baseRate: 0.03 },
  ];

  const paymentMethods = [
    { id: 'credit_card', name: 'Kredi Kartı', fee: 0.025 },
    { id: 'bank_transfer', name: 'Banka Havalesi', fee: 0.015 },
    { id: 'wallet', name: 'Cüzdan', fee: 0.01 },
    { id: 'cash', name: 'Nakit', fee: 0.02 },
  ];

  const calculateCommission = async () => {
    setIsCalculating(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const amount = parseFloat(formData.amount) || 0;
    const volume = parseFloat(formData.volume) || 0;

    if (amount <= 0) return;

    const selectedUserType = userTypes.find(
      type => type.id === formData.userType
    );
    const selectedPaymentMethod = paymentMethods.find(
      method => method.id === formData.paymentMethod
    );

    if (!selectedUserType || !selectedPaymentMethod) return;

    // Base commission rate
    let commissionRate = selectedUserType.baseRate;

    // Volume discount
    if (volume > 100) {
      commissionRate *= 0.8; // 20% discount for high volume
    } else if (volume > 50) {
      commissionRate *= 0.9; // 10% discount for medium volume
    }

    // Premium user discount
    if (formData.isPremium) {
      commissionRate *= 0.85; // 15% discount for premium users
    }

    // Payment method fee
    const paymentFee = amount * selectedPaymentMethod.fee;

    // Platform fees breakdown
    const platformFee = amount * commissionRate;
    const processingFee = paymentFee;
    const serviceFee = amount * 0.01; // 1% service fee

    const totalCommission = platformFee + processingFee + serviceFee;
    const netAmount = amount - totalCommission;

    setResult({
      baseAmount: amount,
      commissionRate: commissionRate * 100,
      commissionAmount: totalCommission,
      netAmount,
      breakdown: {
        platformFee,
        processingFee,
        serviceFee,
      },
    });

    setIsCalculating(false);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <Calculator className='w-8 h-8 text-green-600 mr-3' />
            <h1 className='text-3xl font-bold text-gray-900'>
              Komisyon Hesaplayıcı
            </h1>
          </div>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Platform komisyonlarını hesaplayın. Kullanıcı türü, ödeme yöntemi ve
            diğer faktörlere göre net kazancınızı görün.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Form */}
          <div className='bg-white rounded-2xl shadow-xl p-8'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6'>
              Hesaplama Bilgileri
            </h2>

            <div className='space-y-6'>
              {/* Amount */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <DollarSign className='w-4 h-4 inline mr-2' />
                  İşlem Tutarı (₺)
                </label>
                <input
                  type='number'
                  value={formData.amount}
                  onChange={e => handleInputChange('amount', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
                  placeholder='0.00'
                  min='0'
                  step='0.01'
                />
              </div>

              {/* User Type */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Users className='w-4 h-4 inline mr-2' />
                  Kullanıcı Türü
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  {userTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleInputChange('userType', type.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.userType === type.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='font-medium'>{type.name}</div>
                      <div className='text-sm text-gray-500'>
                        %{(type.baseRate * 100).toFixed(1)} komisyon
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Percent className='w-4 h-4 inline mr-2' />
                  Ödeme Yöntemi
                </label>
                <div className='space-y-2'>
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() =>
                        handleInputChange('paymentMethod', method.id)
                      }
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        formData.paymentMethod === method.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='flex justify-between items-center'>
                        <span className='font-medium'>{method.name}</span>
                        <span className='text-sm text-gray-500'>
                          %{(method.fee * 100).toFixed(1)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <TrendingUp className='w-4 h-4 inline mr-2' />
                  Aylık İşlem Hacmi (₺)
                </label>
                <input
                  type='number'
                  value={formData.volume}
                  onChange={e => handleInputChange('volume', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
                  placeholder='0'
                  min='0'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Yüksek hacimli kullanıcılar için indirim uygulanır
                </p>
              </div>

              {/* Premium */}
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='isPremium'
                  checked={formData.isPremium}
                  onChange={e =>
                    handleInputChange('isPremium', e.target.checked)
                  }
                  className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
                />
                <label
                  htmlFor='isPremium'
                  className='ml-3 text-sm text-gray-700'
                >
                  Premium Üyelik (%15 indirim)
                </label>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateCommission}
                disabled={
                  !formData.amount ||
                  parseFloat(formData.amount) <= 0 ||
                  isCalculating
                }
                className='w-full bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center'
              >
                {isCalculating ? (
                  <>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                    Hesaplanıyor...
                  </>
                ) : (
                  <>
                    <Calculator className='w-5 h-5 mr-2' />
                    Komisyon Hesapla
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className='bg-white rounded-2xl shadow-xl p-8'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6'>
              Hesaplama Sonucu
            </h2>

            {result ? (
              <div className='space-y-6'>
                {/* Net Amount */}
                <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200'>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-green-600 mb-2'>
                      ₺
                      {result.netAmount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className='text-gray-600'>Net Kazanç</div>
                  </div>
                </div>

                {/* Commission Summary */}
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h3 className='font-semibold text-gray-900 mb-3'>
                    Komisyon Özeti
                  </h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>İşlem Tutarı</span>
                      <span className='font-medium'>
                        ₺
                        {result.baseAmount.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Komisyon Oranı</span>
                      <span className='font-medium'>
                        %{result.commissionRate.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center text-red-600'>
                      <span>Toplam Komisyon</span>
                      <span className='font-medium'>
                        -₺
                        {result.commissionAmount.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Komisyon Dağılımı
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Platform Komisyonu</span>
                      <span className='font-medium'>
                        ₺{result.breakdown.platformFee.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Ödeme İşlem Ücreti</span>
                      <span className='font-medium'>
                        ₺{result.breakdown.processingFee.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Hizmet Ücreti</span>
                      <span className='font-medium'>
                        ₺{result.breakdown.serviceFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Savings Info */}
                {(formData.isPremium || parseFloat(formData.volume) > 50) && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-start'>
                      <Info className='w-5 h-5 text-blue-600 mr-3 mt-0.5' />
                      <div className='text-sm text-blue-800'>
                        <p className='font-medium mb-1'>İndirim Uygulandı!</p>
                        <p>
                          {formData.isPremium &&
                            'Premium üyelik indirimi uygulandı. '}
                          {parseFloat(formData.volume) > 50 &&
                            'Yüksek hacim indirimi uygulandı.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <div className='flex items-start'>
                    <Info className='w-5 h-5 text-yellow-600 mr-3 mt-0.5' />
                    <div className='text-sm text-yellow-800'>
                      <p className='font-medium mb-1'>Önemli Not:</p>
                      <p>
                        Komisyon oranları değişebilir. Güncel oranlar için
                        müşteri hizmetleri ile iletişime geçin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-12'>
                <Calculator className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  Hesaplama Yapın
                </h3>
                <p className='text-gray-500'>
                  Sol taraftaki formu doldurarak komisyon hesaplaması
                  yapabilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionCalculator;
