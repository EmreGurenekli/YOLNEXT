import React, { useState } from 'react';
import {
  Calculator,
  MapPin,
  Package,
  Truck,
  DollarSign,
  Info,
} from 'lucide-react';

interface CalculationResult {
  basePrice: number;
  distanceMultiplier: number;
  weightMultiplier: number;
  urgencyMultiplier: number;
  totalPrice: number;
  breakdown: {
    base: number;
    distance: number;
    weight: number;
    urgency: number;
  };
}

const CostCalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    weight: '',
    volume: '',
    category: '',
    urgency: 'normal',
    specialHandling: false,
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const categories = [
    { id: 'house_move', name: 'Ev Taşıma', basePrice: 500 },
    { id: 'furniture', name: 'Mobilya', basePrice: 300 },
    { id: 'electronics', name: 'Elektronik', basePrice: 200 },
    { id: 'documents', name: 'Doküman', basePrice: 50 },
    { id: 'vehicle', name: 'Araç', basePrice: 1000 },
    { id: 'other', name: 'Diğer', basePrice: 150 },
  ];

  const urgencyOptions = [
    { id: 'normal', name: 'Normal', multiplier: 1.0 },
    { id: 'urgent', name: 'Acil', multiplier: 1.5 },
    { id: 'express', name: 'Ekspres', multiplier: 2.0 },
  ];

  const calculateCost = async () => {
    setIsCalculating(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const selectedCategory = categories.find(
      cat => cat.id === formData.category
    );
    if (!selectedCategory) return;

    const basePrice = selectedCategory.basePrice;
    const weight = parseFloat(formData.weight) || 0;
    const volume = parseFloat(formData.volume) || 0;

    // Distance calculation (simplified)
    const distance = Math.random() * 500 + 50; // Simulated distance

    // Multipliers
    const distanceMultiplier = Math.max(1, distance / 100);
    const weightMultiplier = Math.max(1, weight / 10);
    const urgencyMultiplier =
      urgencyOptions.find(u => u.id === formData.urgency)?.multiplier || 1;

    // Additional costs
    const specialHandlingCost = formData.specialHandling ? basePrice * 0.2 : 0;

    const breakdown = {
      base: basePrice,
      distance: basePrice * (distanceMultiplier - 1),
      weight: basePrice * (weightMultiplier - 1),
      urgency: basePrice * (urgencyMultiplier - 1),
    };

    const totalPrice =
      basePrice * distanceMultiplier * weightMultiplier * urgencyMultiplier +
      specialHandlingCost;

    setResult({
      basePrice,
      distanceMultiplier,
      weightMultiplier,
      urgencyMultiplier,
      totalPrice,
      breakdown,
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
            <Calculator className='w-8 h-8 text-blue-600 mr-3' />
            <h1 className='text-3xl font-bold text-gray-900'>
              Maliyet Hesaplayıcı
            </h1>
          </div>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Gönderinizin maliyetini hesaplayın. Mesafe, ağırlık, kategori ve
            diğer faktörlere göre tahmini fiyat alın.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Form */}
          <div className='bg-white rounded-2xl shadow-xl p-8'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6'>
              Gönderi Bilgileri
            </h2>

            <div className='space-y-6'>
              {/* Route */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <MapPin className='w-4 h-4 inline mr-2' />
                    Nereden
                  </label>
                  <input
                    type='text'
                    value={formData.from}
                    onChange={e => handleInputChange('from', e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Alış şehri'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <MapPin className='w-4 h-4 inline mr-2' />
                    Nereye
                  </label>
                  <input
                    type='text'
                    value={formData.to}
                    onChange={e => handleInputChange('to', e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Teslim şehri'
                  />
                </div>
              </div>

              {/* Weight and Volume */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <Package className='w-4 h-4 inline mr-2' />
                    Ağırlık (kg)
                  </label>
                  <input
                    type='number'
                    value={formData.weight}
                    onChange={e => handleInputChange('weight', e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='0'
                    min='0'
                    step='0.1'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    <Package className='w-4 h-4 inline mr-2' />
                    Hacim (m³)
                  </label>
                  <input
                    type='number'
                    value={formData.volume}
                    onChange={e => handleInputChange('volume', e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='0'
                    min='0'
                    step='0.1'
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <Truck className='w-4 h-4 inline mr-2' />
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={e => handleInputChange('category', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>Kategori seçin</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} (₺{category.basePrice} başlangıç)
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  <DollarSign className='w-4 h-4 inline mr-2' />
                  Aciliyet
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {urgencyOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleInputChange('urgency', option.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.urgency === option.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='text-sm font-medium'>{option.name}</div>
                      <div className='text-xs text-gray-500'>
                        x{option.multiplier}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className='space-y-4'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='specialHandling'
                    checked={formData.specialHandling}
                    onChange={e =>
                      handleInputChange('specialHandling', e.target.checked)
                    }
                    className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <label
                    htmlFor='specialHandling'
                    className='ml-3 text-sm text-gray-700'
                  >
                    Özel Taşıma (+%20)
                  </label>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateCost}
                disabled={
                  !formData.from ||
                  !formData.to ||
                  !formData.category ||
                  isCalculating
                }
                className='w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-900 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center'
              >
                {isCalculating ? (
                  <>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                    Hesaplanıyor...
                  </>
                ) : (
                  <>
                    <Calculator className='w-5 h-5 mr-2' />
                    Maliyet Hesapla
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
                {/* Total Price */}
                <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200'>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-blue-600 mb-2'>
                      ₺
                      {result.totalPrice.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className='text-gray-600'>Tahmini Toplam Maliyet</div>
                  </div>
                </div>

                {/* Breakdown */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Maliyet Dağılımı
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Temel Fiyat</span>
                      <span className='font-medium'>
                        ₺{result.breakdown.base.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Mesafe Katkısı</span>
                      <span className='font-medium'>
                        ₺{result.breakdown.distance.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Ağırlık Katkısı</span>
                      <span className='font-medium'>
                        ₺{result.breakdown.weight.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                      <span className='text-gray-600'>Aciliyet Katkısı</span>
                      <span className='font-medium'>
                        ₺{result.breakdown.urgency.toFixed(2)}
                      </span>
                    </div>
                    {formData.specialHandling && (
                      <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                        <span className='text-gray-600'>Özel Taşıma</span>
                        <span className='font-medium'>
                          ₺{(result.totalPrice * 0.2).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <div className='flex items-start'>
                    <Info className='w-5 h-5 text-yellow-600 mr-3 mt-0.5' />
                    <div className='text-sm text-yellow-800'>
                      <p className='font-medium mb-1'>Önemli Not:</p>
                      <p>
                        Bu hesaplama tahminidir. Kesin fiyat, nakliyeci
                        teklifleri alındıktan sonra belirlenir.
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
                  Sol taraftaki formu doldurarak maliyet hesaplaması
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

export default CostCalculator;











