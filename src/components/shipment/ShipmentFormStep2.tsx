// Step 2: Adres Bilgileri
import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { cities } from './constants/cities';

interface ShipmentFormStep2Props {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  errors: any;
  getError: (field: string) => string | null;
  shouldShowError: (field: string) => boolean;
}

export default function ShipmentFormStep2({
  formData,
  handleInputChange,
  errors,
  getError,
  shouldShowError,
}: ShipmentFormStep2Props) {
  // Get districts - handle both city ID and city name
  const getPickupDistricts = () => {
    if (!formData.pickupCity) return [];
    const city = cities.find(c => c.id === formData.pickupCity || c.name === formData.pickupCity);
    return city?.districts || [];
  };
  
  const getDeliveryDistricts = () => {
    if (!formData.deliveryCity) return [];
    const city = cities.find(c => c.id === formData.deliveryCity || c.name === formData.deliveryCity);
    return city?.districts || [];
  };
  
  const pickupDistricts = getPickupDistricts();
  const deliveryDistricts = getDeliveryDistricts();

  return (
    <div className='space-y-6'>
      {/* Toplama Adresi */}
      <div className='border-b pb-6'>
        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
          <MapPin className='w-5 h-5 text-blue-600' />
          Toplama Adresi
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Şehir *
            </label>
            <select
              value={formData.pickupCity}
              onChange={e => {
                const cityValue = e.target.value;
                handleInputChange('pickupCity', cityValue);
                handleInputChange('pickupDistrict', ''); // Reset district
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                shouldShowError('pickupCity')
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            >
              <option value=''>Şehir Seçin</option>
              {cities.map(city => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            {shouldShowError('pickupCity') && (
              <p className='mt-1 text-sm text-red-600'>{getError('pickupCity')}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              İlçe *
            </label>
            <select
              value={formData.pickupDistrict}
              onChange={e => handleInputChange('pickupDistrict', e.target.value)}
              disabled={!formData.pickupCity}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                shouldShowError('pickupDistrict')
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              } ${!formData.pickupCity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
            >
              <option value=''>İlçe Seçin</option>
              {pickupDistricts.map(district => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            {shouldShowError('pickupDistrict') && (
              <p className='mt-1 text-sm text-red-600'>{getError('pickupDistrict')}</p>
            )}
          </div>
        </div>

        <div className='mt-4'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Detaylı Adres *
          </label>
          <textarea
            value={formData.pickupAddress}
            onChange={e => handleInputChange('pickupAddress', e.target.value)}
            placeholder='Mahalle, sokak, bina no, daire no...'
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              shouldShowError('pickupAddress')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {shouldShowError('pickupAddress') && (
            <p className='mt-1 text-sm text-red-600'>{getError('pickupAddress')}</p>
          )}
        </div>

        <div className='mt-4'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            <Calendar className='w-4 h-4 inline mr-1' />
            Toplama Tarihi *
          </label>
          <input
            type='date'
            value={formData.pickupDate}
            onChange={e => handleInputChange('pickupDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              shouldShowError('pickupDate')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {shouldShowError('pickupDate') && (
            <p className='mt-1 text-sm text-red-600'>{getError('pickupDate')}</p>
          )}
        </div>
      </div>

      {/* Teslimat Adresi */}
      <div>
        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
          <MapPin className='w-5 h-5 text-green-600' />
          Teslimat Adresi
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Şehir *
            </label>
            <select
              value={formData.deliveryCity}
              onChange={e => {
                const cityValue = e.target.value;
                handleInputChange('deliveryCity', cityValue);
                handleInputChange('deliveryDistrict', ''); // Reset district
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                shouldShowError('deliveryCity')
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            >
              <option value=''>Şehir Seçin</option>
              {cities.map(city => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            {shouldShowError('deliveryCity') && (
              <p className='mt-1 text-sm text-red-600'>{getError('deliveryCity')}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              İlçe *
            </label>
            <select
              value={formData.deliveryDistrict}
              onChange={e => handleInputChange('deliveryDistrict', e.target.value)}
              disabled={!formData.deliveryCity}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                shouldShowError('deliveryDistrict')
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              } ${!formData.deliveryCity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
            >
              <option value=''>İlçe Seçin</option>
              {deliveryDistricts.map(district => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            {shouldShowError('deliveryDistrict') && (
              <p className='mt-1 text-sm text-red-600'>{getError('deliveryDistrict')}</p>
            )}
          </div>
        </div>

        <div className='mt-4'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Detaylı Adres *
          </label>
          <textarea
            value={formData.deliveryAddress}
            onChange={e => handleInputChange('deliveryAddress', e.target.value)}
            placeholder='Mahalle, sokak, bina no, daire no...'
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              shouldShowError('deliveryAddress')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {shouldShowError('deliveryAddress') && (
            <p className='mt-1 text-sm text-red-600'>{getError('deliveryAddress')}</p>
          )}
        </div>

        <div className='mt-4'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            <Calendar className='w-4 h-4 inline mr-1' />
            Teslimat Tarihi *
          </label>
          <input
            type='date'
            value={formData.deliveryDate}
            onChange={e => handleInputChange('deliveryDate', e.target.value)}
            min={formData.pickupDate || new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              shouldShowError('deliveryDate')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {shouldShowError('deliveryDate') && (
            <p className='mt-1 text-sm text-red-600'>{getError('deliveryDate')}</p>
          )}
        </div>
      </div>
    </div>
  );
}



