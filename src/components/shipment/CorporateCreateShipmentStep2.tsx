// CorporateCreateShipmentStep2.tsx
// Step 2 component for Corporate CreateShipment page - Address Information
// Used in: src/pages/corporate/CreateShipment.tsx

import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { turkeyCities } from '../../data/turkey-cities-districts';

interface CorporateCreateShipmentStep2Props {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  errors: any;
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

export default function CorporateCreateShipmentStep2({
  formData,
  handleInputChange,
  errors,
  setErrors,
}: CorporateCreateShipmentStep2Props) {
  return (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-slate-900 mb-2'>
          Adres & İletişim Bilgileri
        </h2>
        <p className='text-slate-600'>
          Toplama ve teslimat bilgilerini girin
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='space-y-4'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
              <MapPin className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-slate-900'>
                Toplama Adresi
              </h3>
              <p className='text-sm text-slate-600'>
                Gönderiyi nereden alacağız?
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  <MapPin className='w-4 h-4 inline mr-2' />
                  İl *
                </label>
                <select
                  value={formData.pickupCity}
                  onChange={(e) => {
                    handleInputChange('pickupCity', e.target.value);
                    handleInputChange('pickupDistrict', ''); // Reset district when city changes
                    if (errors.pickupCity) {
                      setErrors(prev => ({ ...prev, pickupCity: '' }));
                    }
                  }}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    errors.pickupCity ? 'border-red-500' : 'border-slate-200'
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
                  <p className="mt-1 text-sm text-red-600">{errors.pickupCity}</p>
                )}
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  <MapPin className='w-4 h-4 inline mr-2' />
                  İlçe *
                </label>
                <select
                  value={formData.pickupDistrict}
                  onChange={(e) => {
                    handleInputChange('pickupDistrict', e.target.value);
                    if (errors.pickupDistrict) {
                      setErrors(prev => ({ ...prev, pickupDistrict: '' }));
                    }
                  }}
                  disabled={!formData.pickupCity}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    !formData.pickupCity ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${
                    errors.pickupDistrict ? 'border-red-500' : 'border-slate-200'
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
                  <p className="mt-1 text-sm text-red-600">{errors.pickupDistrict}</p>
                )}
              </div>
            </div>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <MapPin className='w-4 h-4 inline mr-2' />
                Adres *
              </label>
              <textarea
                value={formData.pickupAddress}
                onChange={(e) => {
                  handleInputChange('pickupAddress', e.target.value);
                  if (errors.pickupAddress) {
                    setErrors(prev => ({ ...prev, pickupAddress: '' }));
                  }
                }}
                rows={4}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                  errors.pickupAddress ? 'border-red-500' : 'border-slate-200'
                }`}
                placeholder='Mahalle, sokak, bina no, daire no vb. detaylı adres bilgilerini girin...'
              />
              {errors.pickupAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.pickupAddress}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <Calendar className='w-4 h-4 inline mr-2' />
                Toplama Tarihi *
              </label>
              <input
                type='date'
                value={formData.pickupDate}
                onChange={(e) => {
                  handleInputChange('pickupDate', e.target.value);
                  if (errors.pickupDate) {
                    setErrors(prev => ({ ...prev, pickupDate: '' }));
                  }
                }}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                  errors.pickupDate ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.pickupDate && (
                <p className="mt-1 text-sm text-red-600">{errors.pickupDate}</p>
              )}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center'>
              <MapPin className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-slate-900'>
                Teslimat Adresi
              </h3>
              <p className='text-sm text-slate-600'>
                Gönderiyi nereye teslim edeceğiz?
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  <MapPin className='w-4 h-4 inline mr-2' />
                  İl *
                </label>
                <select
                  value={formData.deliveryCity}
                  onChange={(e) => {
                    handleInputChange('deliveryCity', e.target.value);
                    handleInputChange('deliveryDistrict', ''); // Reset district when city changes
                    if (errors.deliveryCity) {
                      setErrors(prev => ({ ...prev, deliveryCity: '' }));
                    }
                  }}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    errors.deliveryCity ? 'border-red-500' : 'border-slate-200'
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
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryCity}</p>
                )}
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  <MapPin className='w-4 h-4 inline mr-2' />
                  İlçe *
                </label>
                <select
                  value={formData.deliveryDistrict}
                  onChange={(e) => {
                    handleInputChange('deliveryDistrict', e.target.value);
                    if (errors.deliveryDistrict) {
                      setErrors(prev => ({ ...prev, deliveryDistrict: '' }));
                    }
                  }}
                  disabled={!formData.deliveryCity}
                  className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                    !formData.deliveryCity ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${
                    errors.deliveryDistrict ? 'border-red-500' : 'border-slate-200'
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
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryDistrict}</p>
                )}
              </div>
            </div>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <MapPin className='w-4 h-4 inline mr-2' />
                Adres *
              </label>
              <textarea
                value={formData.deliveryAddress}
                onChange={(e) => {
                  handleInputChange('deliveryAddress', e.target.value);
                  if (errors.deliveryAddress) {
                    setErrors(prev => ({ ...prev, deliveryAddress: '' }));
                  }
                }}
                rows={4}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                  errors.deliveryAddress ? 'border-red-500' : 'border-slate-200'
                }`}
                placeholder='Mahalle, sokak, bina no, daire no vb. detaylı adres bilgilerini girin...'
              />
              {errors.deliveryAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <Calendar className='w-4 h-4 inline mr-2' />
                Teslimat Tarihi *
              </label>
              <input
                type='date'
                value={formData.deliveryDate}
                onChange={(e) => {
                  handleInputChange('deliveryDate', e.target.value);
                  if (errors.deliveryDate) {
                    setErrors(prev => ({ ...prev, deliveryDate: '' }));
                  }
                }}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                  errors.deliveryDate ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.deliveryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.deliveryDate}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

