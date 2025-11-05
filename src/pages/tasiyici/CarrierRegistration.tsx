import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Truck,
  Save,
  CheckCircle,
  AlertCircle,
  Phone,
  Hash,
  Weight,
  Car,
} from 'lucide-react';
import { createApiUrl } from '../../config/api';

export default function CarrierRegistration() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    vehicle_type: '',
    max_capacity: '',
    license_plate: '',
    phone: '',
    nakliyeci_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  interface Carrier {
    id: number;
    nakliyeci_name?: string;
    full_name?: string;
    email?: string;
    vehicle_type?: string;
    max_capacity?: string;
    license_plate?: string;
    phone?: string;
    nakliyeci_id?: string;
  }
  interface Nakliyeci {
    id: number;
    full_name: string;
    email: string;
  }
  const [existingCarrier, setExistingCarrier] = useState<Carrier | null>(null);
  const [nakliyeciler, setNakliyeciler] = useState<Nakliyeci[]>([]);

  useEffect(() => {
    loadNakliyeciler();
    checkExistingCarrier();
  }, []);

  const loadNakliyeciler = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl('/api/users/nakliyeciler'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNakliyeciler(data);
      }
    } catch (error) {
      console.error('Error loading nakliyeciler:', error);
    }
  };

  const checkExistingCarrier = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl('/api/carriers/my-carrier'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingCarrier(data);
        setIsRegistered(true);
        setFormData({
          vehicle_type: data.vehicle_type || '',
          max_capacity: data.max_capacity || '',
          license_plate: data.license_plate || '',
          phone: data.phone || '',
          nakliyeci_id: data.nakliyeci_id || '',
        });
      }
    } catch (error) {
      console.error('Error checking existing carrier:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.vehicle_type ||
      !formData.max_capacity ||
      !formData.license_plate
    ) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      const url = isRegistered
        ? createApiUrl('/api/carriers/update')
        : createApiUrl('/api/carriers/register');

      const method = isRegistered ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          isRegistered ? 'Bilgiler güncellendi!' : 'Taşıyıcı kaydı başarılı!'
        );
        setIsRegistered(true);
        if (!isRegistered) {
          setExistingCarrier(data.data);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Error submitting carrier registration:', error);
      alert('İşlem başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const vehicleTypes = [
    'Kamyon',
    'Tır',
    'Kamyonet',
    'Minibüs',
    'Otobüs',
    'Diğer',
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Taşıyıcı Kaydı - YolNext</title>
      </Helmet>

      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Truck className='w-8 h-8 text-blue-600' />
          </div>
          <h1 className='text-3xl font-bold text-gray-900'>
            {isRegistered ? 'Taşıyıcı Bilgileri' : 'Taşıyıcı Kaydı'}
          </h1>
          <p className='text-gray-600 mt-2'>
            {isRegistered
              ? 'Bilgilerinizi güncelleyin'
              : 'Taşıyıcı olarak kaydolun ve iş bulun'}
          </p>
        </div>

        {/* Status Card */}
        {isRegistered && existingCarrier && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
            <div className='flex items-center gap-3'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <div>
                <p className='font-medium text-green-900'>Kayıt Tamamlandı</p>
                <p className='text-sm text-green-700'>
                  Nakliyeci: {existingCarrier.nakliyeci_name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Vehicle Type */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Araç Tipi *
              </label>
              <select
                name='vehicle_type'
                value={formData.vehicle_type}
                onChange={handleInputChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                required
              >
                <option value=''>Araç tipi seçin</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Capacity */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Maksimum Kapasite (kg) *
              </label>
              <div className='relative'>
                <Weight className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='number'
                  name='max_capacity'
                  value={formData.max_capacity}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Örn: 5000'
                  required
                />
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Plaka *
              </label>
              <div className='relative'>
                <Hash className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='text'
                  name='license_plate'
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Örn: 34 ABC 123'
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Telefon
              </label>
              <div className='relative'>
                <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Örn: 0555 123 45 67'
                />
              </div>
            </div>

            {/* Nakliyeci Selection (only for new registrations) */}
            {!isRegistered && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nakliyeci Seçin
                </label>
                <select
                  name='nakliyeci_id'
                  value={formData.nakliyeci_id}
                  onChange={handleInputChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value=''>Nakliyeci seçin</option>
                  {nakliyeciler.map(nakliyeci => (
                    <option key={nakliyeci.id} value={nakliyeci.id}>
                      {nakliyeci.full_name} - {nakliyeci.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
            >
              {isLoading ? (
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <>
                  <Save className='w-5 h-5' />
                  {isRegistered ? 'Güncelle' : 'Kaydol'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 mt-0.5' />
            <div>
              <h3 className='font-medium text-blue-900'>Bilgi</h3>
              <p className='text-sm text-blue-700 mt-1'>
                Taşıyıcı olarak kaydolduktan sonra, seçtiğiniz nakliyeci size
                gönderi atamaları yapabilecek. Atamaları kabul edip
                reddedebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
