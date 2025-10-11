import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calculator, Package, MapPin, Clock, DollarSign, Truck, Weight, Ruler } from 'lucide-react';

interface CostCalculation {
  distance: number;
  weight: number;
  volume: number;
  vehicleType: string;
  priority: string;
  insurance: boolean;
  totalCost: number;
  breakdown: CostBreakdown;
}

interface CostBreakdown {
  baseCost: number;
  distanceCost: number;
  weightCost: number;
  volumeCost: number;
  priorityCost: number;
  insuranceCost: number;
  commission: number;
}

export default function CostCalculator() {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    distance: 0,
    weight: 0,
    volume: 0,
    vehicleType: 'kamyon',
    priority: 'normal',
    insurance: false
  });

  const [calculation, setCalculation] = useState<CostCalculation | null>(null);

  const vehicleTypes = [
    { value: 'kamyon', label: 'Kamyon', baseRate: 2.5 },
    { value: 'kamyonet', label: 'Kamyonet', baseRate: 2.0 },
    { value: 'tir', label: 'Tır', baseRate: 3.0 },
    { value: 'minibus', label: 'Minibüs', baseRate: 1.8 }
  ];

  const priorities = [
    { value: 'normal', label: 'Normal', multiplier: 1.0 },
    { value: 'hizli', label: 'Hızlı', multiplier: 1.5 },
    { value: 'acil', label: 'Acil', multiplier: 2.0 }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateCost = () => {
    const selectedVehicle = vehicleTypes.find(v => v.value === formData.vehicleType);
    const selectedPriority = priorities.find(p => p.value === formData.priority);
    
    if (!selectedVehicle || !selectedPriority) return;

    const baseCost = 100; // Temel ücret
    const distanceCost = formData.distance * selectedVehicle.baseRate;
    const weightCost = formData.weight * 0.5; // kg başına 0.5 TL
    const volumeCost = formData.volume * 2; // m³ başına 2 TL
    const priorityCost = (baseCost + distanceCost) * (selectedPriority.multiplier - 1);
    const insuranceCost = formData.insurance ? (baseCost + distanceCost) * 0.1 : 0;
    const commission = (baseCost + distanceCost + weightCost + volumeCost + priorityCost + insuranceCost) * 0.01;

    const totalCost = baseCost + distanceCost + weightCost + volumeCost + priorityCost + insuranceCost + commission;

    const breakdown: CostBreakdown = {
      baseCost,
      distanceCost,
      weightCost,
      volumeCost,
      priorityCost,
      insuranceCost,
      commission
    };

    setCalculation({
      ...formData,
      totalCost,
      breakdown
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Maliyet Hesaplayıcı - YolNet</title>
        <meta name="description" content="YolNet maliyet hesaplayıcı ile taşıma maliyetinizi hesaplayın" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Maliyet Hesaplayıcı
          </h1>
          <p className="text-xl text-gray-600">
            Taşıma maliyetinizi hesaplayın ve en uygun fiyatı bulun
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gönderi Bilgileri</h2>
            
            <div className="space-y-6">
              {/* Kalkış ve Varış */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Kalkış Şehri
                  </label>
                  <input
                    type="text"
                    value={formData.from}
                    onChange={(e) => handleInputChange('from', e.target.value)}
                    placeholder="İstanbul"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Varış Şehri
                  </label>
                  <input
                    type="text"
                    value={formData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    placeholder="Ankara"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mesafe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="w-4 h-4 inline mr-2" />
                  Mesafe (km)
                </label>
                <input
                  type="number"
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', Number(e.target.value))}
                  placeholder="450"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ağırlık ve Hacim */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Weight className="w-4 h-4 inline mr-2" />
                    Ağırlık (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                    placeholder="2500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="w-4 h-4 inline mr-2" />
                    Hacim (m³)
                  </label>
                  <input
                    type="number"
                    value={formData.volume}
                    onChange={(e) => handleInputChange('volume', Number(e.target.value))}
                    placeholder="45"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Araç Türü */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-2" />
                  Araç Türü
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vehicleTypes.map((vehicle) => (
                    <option key={vehicle.value} value={vehicle.value}>
                      {vehicle.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Öncelik */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Öncelik
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sigorta */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="insurance"
                  checked={formData.insurance}
                  onChange={(e) => handleInputChange('insurance', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="insurance" className="ml-2 text-sm font-medium text-gray-700">
                  Sigorta dahil
                </label>
              </div>

              <button
                onClick={calculateCost}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Maliyet Hesapla
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesaplama Sonucu</h2>
            
            {calculation ? (
              <div className="space-y-6">
                {/* Toplam Maliyet */}
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₺{calculation.totalCost.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Toplam Taşıma Maliyeti</div>
                </div>

                {/* Detaylı Döküm */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Maliyet Dökümü</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temel Ücret</span>
                      <span className="font-medium">₺{calculation.breakdown.baseCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mesafe Ücreti</span>
                      <span className="font-medium">₺{calculation.breakdown.distanceCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ağırlık Ücreti</span>
                      <span className="font-medium">₺{calculation.breakdown.weightCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hacim Ücreti</span>
                      <span className="font-medium">₺{calculation.breakdown.volumeCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Öncelik Ücreti</span>
                      <span className="font-medium">₺{calculation.breakdown.priorityCost.toLocaleString()}</span>
                    </div>
                    {calculation.breakdown.insuranceCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sigorta</span>
                        <span className="font-medium">₺{calculation.breakdown.insuranceCost.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Komisyon (%1)</span>
                      <span className="font-medium">₺{calculation.breakdown.commission.toLocaleString()}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Toplam</span>
                      <span>₺{calculation.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Tasarruf Bilgisi */}
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">Tasarruf Fırsatı</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Bu gönderi için ortalama %15-20 tasarruf sağlayabilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Maliyet hesaplamak için formu doldurun</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}