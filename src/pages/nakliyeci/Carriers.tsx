import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Truck, Star, Phone, Mail, MapPin } from 'lucide-react';

interface Carrier {
  id: number;
  name: string;
  rating: number;
  phone: string;
  email: string;
  location: string;
  totalShipments: number;
}

const NakliyeciCarriers: React.FC = () => {
  const [carriers, setCarriers] = useState<Carrier[]>([]);

  useEffect(() => {
    // API çağrısı yapılacak
    // TODO: Backend API entegrasyonu
    setCarriers([]);
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Nakliyeciler - Nakliyeci Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Ortak Nakliyeciler
          </h1>
          <p className='text-gray-600'>Network'ünüzdeki diğer nakliyeciler</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {carriers.map(carrier => (
            <div
              key={carrier.id}
              className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'
            >
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center'>
                  <Truck className='w-8 h-8 text-white' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>
                    {carrier.name}
                  </h3>
                  <div className='flex items-center gap-1'>
                    <Star className='w-4 h-4 text-yellow-500 fill-current' />
                    <span className='text-sm text-gray-600'>
                      {carrier.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div className='space-y-2 text-sm text-gray-600'>
                <div className='flex items-center gap-2'>
                  <Phone className='w-4 h-4' />
                  <span>{carrier.phone}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Mail className='w-4 h-4' />
                  <span>{carrier.email}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4' />
                  <span>{carrier.location}</span>
                </div>
                <div className='flex items-center gap-2 pt-2 border-t border-gray-200'>
                  <Truck className='w-4 h-4' />
                  <span className='font-medium'>
                    {carrier.totalShipments} gönderi
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NakliyeciCarriers;
