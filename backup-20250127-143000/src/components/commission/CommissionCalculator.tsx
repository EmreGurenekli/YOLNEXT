import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calculator, DollarSign, Percent, TrendingUp, Info } from 'lucide-react';

interface CommissionCalculation {
  shipmentValue: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  breakdown: {
    baseCommission: number;
    volumeDiscount: number;
    loyaltyDiscount: number;
    totalDiscount: number;
  };
}

export default function CommissionCalculator() {
  const [formData, setFormData] = useState({
    shipmentValue: 0,
    userType: 'individual',
    monthlyVolume: 0,
    loyaltyLevel: 'bronze'
  });

  const [calculation, setCalculation] = useState<CommissionCalculation | null>(null);

  const userTypes = [
    { value: 'individual', label: 'Bireysel', baseRate: 0.01 },
    { value: 'corporate', label: 'Kurumsal', baseRate: 0.008 },
    { value: 'nakliyeci', label: 'Nakliyeci', baseRate: 0.01 },
    { value: 'tasiyici', label: 'Taşıyıcı', baseRate: 0.01 }
  ];

  const loyaltyLevels = [
    { value: 'bronze', label: 'Bronz', discount: 0 },
    { value: 'silver', label: 'Gümüş', discount: 0.1 },
    { value: 'gold', label: 'Altın', discount: 0.2 },
    { value: 'platinum', label: 'Platin', discount: 0.3 }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateCommission = () => {
    const selectedUserType = userTypes.find(u => u.value === formData.userType);
    const selectedLoyalty = loyaltyLevels.find(l => l.value === formData.loyaltyLevel);
    
    if (!selectedUserType || !selectedLoyalty) return;

    const baseCommission = formData.shipmentValue * selectedUserType.baseRate;
    
    // Hacim indirimi
    let volumeDiscount = 0;
    if (formData.monthlyVolume >= 100) {
      volumeDiscount = baseCommission * 0.2; // %20 indirim
    } else if (formData.monthlyVolume >= 50) {
      volumeDiscount = baseCommission * 0.1; // %10 indirim
    }

    // Sadakat indirimi
    const loyaltyDiscount = baseCommission * selectedLoyalty.discount;
    
    const totalDiscount = volumeDiscount + loyaltyDiscount;
    const finalCommission = baseCommission - totalDiscount;
    const netAmount = formData.shipmentValue - finalCommission;

    setCalculation({
      shipmentValue: formData.shipmentValue,
      commissionRate: selectedUserType.baseRate,
      commissionAmount: finalCommission,
      netAmount,
      breakdown: {
        baseCommission,
        volumeDiscount,
        loyaltyDiscount,
        totalDiscount
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Komisyon Hesaplayıcı - YolNet</title>
        <meta name="description" content="YolNet komisyon hesaplayıcı ile komisyon maliyetinizi hesaplayın" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Komisyon Hesaplayıcı
          </h1>
          <p className="text-xl text-gray-600">
            YolNet komisyon maliyetinizi hesaplayın ve tasarruf fırsatlarını keşfedin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesaplama Bilgileri</h2>
            
            <div className="space-y-6">
              {/* Gönderi Değeri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Gönderi Değeri (₺)
                </label>
                <input
                  type="number"
                  value={formData.shipmentValue}
                  onChange={(e) => handleInputChange('shipmentValue', Number(e.target.value))}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kullanıcı Türü */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="w-4 h-4 inline mr-2" />
                  Kullanıcı Türü
                </label>
                <select
                  value={formData.userType}
                  onChange={(e) => handleInputChange('userType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {userTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} ({(type.baseRate * 100).toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Aylık Hacim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Aylık Gönderi Sayısı
                </label>
                <input
                  type="number"
                  value={formData.monthlyVolume}
                  onChange={(e) => handleInputChange('monthlyVolume', Number(e.target.value))}
                  placeholder="25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  50+ gönderi: %10 indirim, 100+ gönderi: %20 indirim
                </p>
              </div>

              {/* Sadakat Seviyesi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Info className="w-4 h-4 inline mr-2" />
                  Sadakat Seviyesi
                </label>
                <select
                  value={formData.loyaltyLevel}
                  onChange={(e) => handleInputChange('loyaltyLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {loyaltyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} ({(level.discount * 100).toFixed(0)}% indirim)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={calculateCommission}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Komisyon Hesapla
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesaplama Sonucu</h2>
            
            {calculation ? (
              <div className="space-y-6">
                {/* Toplam Komisyon */}
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₺{calculation.commissionAmount.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Toplam Komisyon</div>
                  <div className="text-sm text-gray-500 mt-1">
                    ({(calculation.commissionRate * 100).toFixed(1)}% oranında)
                  </div>
                </div>

                {/* Net Miktar */}
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ₺{calculation.netAmount.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Net Alacağınız</div>
                </div>

                {/* Detaylı Döküm */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Komisyon Dökümü</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temel Komisyon</span>
                      <span className="font-medium">₺{calculation.breakdown.baseCommission.toLocaleString()}</span>
                    </div>
                    {calculation.breakdown.volumeDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Hacim İndirimi</span>
                        <span className="font-medium">-₺{calculation.breakdown.volumeDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    {calculation.breakdown.loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Sadakat İndirimi</span>
                        <span className="font-medium">-₺{calculation.breakdown.loyaltyDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Toplam Komisyon</span>
                      <span>₺{calculation.commissionAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tasarruf Bilgisi */}
                {calculation.breakdown.totalDiscount > 0 && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">Tasarruf Sağladınız!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Toplam ₺{calculation.breakdown.totalDiscount.toLocaleString()} tasarruf sağladınız.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Komisyon hesaplamak için formu doldurun</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Komisyon Sistemi Hakkında</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Düşük Komisyon</h3>
              <p className="text-sm text-gray-600">Sadece %1 komisyon ile en düşük maliyet</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Hacim İndirimi</h3>
              <p className="text-sm text-gray-600">Daha fazla gönderi, daha az komisyon</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Info className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Şeffaf Fiyatlandırma</h3>
              <p className="text-sm text-gray-600">Gizli ücret yok, her şey açık</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}