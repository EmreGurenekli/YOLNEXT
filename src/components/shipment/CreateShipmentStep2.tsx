// Step 2: Adres Bilgileri Component
// Extracted from CreateShipment.tsx for better code organization

import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { turkeyCities } from '../../data/turkey-cities-districts';

interface CreateShipmentStep2Props {
  formData: any;
  errors: { [key: string]: string };
  handleInputChange: (field: string, value: any) => void;
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

export default function CreateShipmentStep2({
  formData,
  errors,
  handleInputChange,
  setErrors,
}: CreateShipmentStep2Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Adres ve Tarih Bilgileri</h2>
        <p className="text-slate-600">Lütfen toplama ve teslimat adreslerinizi eksiksiz olarak giriniz. Doğru adres bilgileri, hızlı ve güvenli taşımacılık için kritik öneme sahiptir.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Toplama Adresi</h3>
              <p className="text-sm text-slate-600">Yükünüzün alınacağı tam adres bilgilerini giriniz</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pickupCity" className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  İl *
                </label>
                <select
                  id="pickupCity"
                  value={formData.pickupCity ?? ''}
                  onChange={(e) => {
                    handleInputChange('pickupCity', e.target.value);
                    handleInputChange('pickupDistrict', ''); // Reset district when city changes
                    if (errors.pickupCity) {
                      setErrors(prev => ({ ...prev, pickupCity: '' }));
                    }
                  }}
                  onInput={(e) => {
                    const next = (e.currentTarget as HTMLSelectElement).value;
                    handleInputChange('pickupCity', next);
                    handleInputChange('pickupDistrict', '');
                  }}
                  aria-label="Toplama ili"
                  aria-required="true"
                  aria-invalid={!!errors.pickupCity}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    errors.pickupCity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="">İl seçiniz</option>
                  {turkeyCities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.pickupCity && (
                  <p className="mt-2 text-sm text-red-600" role="alert">{errors.pickupCity}</p>
                )}
              </div>
              <div>
                <label htmlFor="pickupDistrict" className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  İlçe *
                </label>
                <select
                  id="pickupDistrict"
                  value={formData.pickupDistrict ?? ''}
                  onChange={(e) => {
                    handleInputChange('pickupDistrict', e.target.value);
                    if (errors.pickupDistrict) {
                      setErrors(prev => ({ ...prev, pickupDistrict: '' }));
                    }
                  }}
                  onInput={(e) => {
                    handleInputChange('pickupDistrict', (e.currentTarget as HTMLSelectElement).value);
                  }}
                  disabled={!formData.pickupCity}
                  aria-label="Toplama ilçesi"
                  aria-required="true"
                  aria-invalid={!!errors.pickupDistrict}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    !formData.pickupCity ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${
                    errors.pickupDistrict ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="">İlçe seçiniz</option>
                  {formData.pickupCity && turkeyCities.find(c => c.name === formData.pickupCity)?.districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                {errors.pickupDistrict && (
                  <p className="mt-2 text-sm text-red-600" role="alert">{errors.pickupDistrict}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="pickupAddress" className="block text-sm font-semibold text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Adres *
              </label>
              <textarea
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => {
                  handleInputChange('pickupAddress', e.target.value);
                  if (errors.pickupAddress) {
                    setErrors(prev => ({ ...prev, pickupAddress: '' }));
                  }
                }}
                rows={4}
                aria-label="Toplama adresi"
                aria-required="true"
                aria-invalid={!!errors.pickupAddress}
                aria-describedby={errors.pickupAddress ? 'pickupAddress-error' : undefined}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                  errors.pickupAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Mahalle, sokak, bina numarası, daire numarası ve varsa kat bilgisi gibi tüm detayları eksiksiz olarak giriniz..."
              />
              {errors.pickupAddress && (
                <p id="pickupAddress-error" className="mt-2 text-sm text-red-600" role="alert">{errors.pickupAddress}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="pickupDate" className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Toplama Tarihi *
              </label>
              <input
                id="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={(e) => {
                  handleInputChange('pickupDate', e.target.value);
                  if (errors.pickupDate) {
                    setErrors(prev => ({ ...prev, pickupDate: '' }));
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                aria-label="Toplama tarihi"
                aria-required="true"
                aria-invalid={!!errors.pickupDate}
                aria-describedby={errors.pickupDate ? 'pickupDate-error' : undefined}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                  errors.pickupDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              <p className="mt-1 text-xs text-slate-500">
                Takvimden seçin. Format \(YYYY-AA-GG\) — örn: 2026-01-24
              </p>
              {errors.pickupDate && (
                <p id="pickupDate-error" className="mt-2 text-sm text-red-600" role="alert">{errors.pickupDate}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Teslimat Adresi</h3>
              <p className="text-sm text-slate-600">Yükünüzün teslim edileceği tam adres bilgilerini giriniz</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryCity" className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  İl *
                </label>
                <select
                  id="deliveryCity"
                  value={formData.deliveryCity ?? ''}
                  onChange={(e) => {
                    handleInputChange('deliveryCity', e.target.value);
                    handleInputChange('deliveryDistrict', ''); // Reset district when city changes
                    if (errors.deliveryCity) {
                      setErrors(prev => ({ ...prev, deliveryCity: '' }));
                    }
                  }}
                  onInput={(e) => {
                    const next = (e.currentTarget as HTMLSelectElement).value;
                    handleInputChange('deliveryCity', next);
                    handleInputChange('deliveryDistrict', '');
                  }}
                  aria-label="Teslimat ili"
                  aria-required="true"
                  aria-invalid={!!errors.deliveryCity}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    errors.deliveryCity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                >
                  <option value="">İl seçiniz</option>
                  {turkeyCities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.deliveryCity && (
                  <p className="mt-2 text-sm text-red-600" role="alert">{errors.deliveryCity}</p>
                )}
              </div>
              <div>
                <label htmlFor="deliveryDistrict" className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  İlçe *
                </label>
                <select
                  id="deliveryDistrict"
                  value={formData.deliveryDistrict ?? ''}
                  onChange={(e) => {
                    handleInputChange('deliveryDistrict', e.target.value);
                    if (errors.deliveryDistrict) {
                      setErrors(prev => ({ ...prev, deliveryDistrict: '' }));
                    }
                  }}
                  onInput={(e) => {
                    handleInputChange('deliveryDistrict', (e.currentTarget as HTMLSelectElement).value);
                  }}
                  disabled={!formData.deliveryCity}
                  aria-label="Teslimat ilçesi"
                  aria-required="true"
                  aria-invalid={!!errors.deliveryDistrict}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    !formData.deliveryCity ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${
                    errors.deliveryDistrict ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                >
                  <option value="">İlçe seçiniz</option>
                  {formData.deliveryCity && turkeyCities.find(c => c.name === formData.deliveryCity)?.districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                {errors.deliveryDistrict && (
                  <p className="mt-2 text-sm text-red-600" role="alert">{errors.deliveryDistrict}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-semibold text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Adres *
              </label>
              <textarea
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) => {
                  handleInputChange('deliveryAddress', e.target.value);
                  if (errors.deliveryAddress) {
                    setErrors(prev => ({ ...prev, deliveryAddress: '' }));
                  }
                }}
                rows={4}
                aria-label="Teslimat adresi"
                aria-required="true"
                aria-invalid={!!errors.deliveryAddress}
                aria-describedby={errors.deliveryAddress ? 'deliveryAddress-error' : undefined}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                  errors.deliveryAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                placeholder="Mahalle, sokak, bina numarası, daire numarası ve varsa kat bilgisi gibi tüm detayları eksiksiz olarak giriniz..."
              />
              {errors.deliveryAddress && (
                <p id="deliveryAddress-error" className="mt-2 text-sm text-red-600" role="alert">{errors.deliveryAddress}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="deliveryDate" className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Teslimat Tarihi *
              </label>
              <input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => {
                  handleInputChange('deliveryDate', e.target.value);
                  if (errors.deliveryDate) {
                    setErrors(prev => ({ ...prev, deliveryDate: '' }));
                  }
                }}
                min={formData.pickupDate ? new Date(new Date(formData.pickupDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                aria-label="Teslimat tarihi"
                aria-required="true"
                aria-invalid={!!errors.deliveryDate}
                aria-describedby={errors.deliveryDate ? 'deliveryDate-error' : undefined}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                  errors.deliveryDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
              />
              <p className="mt-1 text-xs text-slate-500">
                Takvimden seçin. Format \(YYYY-AA-GG\) — örn: 2026-01-24
              </p>
              {errors.deliveryDate && (
                <p id="deliveryDate-error" className="mt-2 text-sm text-red-600" role="alert">{errors.deliveryDate}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












