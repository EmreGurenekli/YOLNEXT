import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Package, MapPin, Calendar, Truck, CheckCircle } from 'lucide-react';

interface Load {
  id: number;
  title: string;
  pickupLocation: string;
  deliveryLocation: string;
  date: string;
  status: string;
  vehicleType: string;
}

const NakliyeciLoads: React.FC = () => {
  const [loads, setLoads] = useState<Load[]>([]);

  useEffect(() => {
    // API çağrısı yapılacak
    // TODO: Backend API entegrasyonu
    setLoads([]);
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Yüklerim - Nakliyeci Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Aktif Yüklerim
          </h1>
          <p className='text-gray-600'>Yönetilen yük ve nakliyeleriniz</p>
        </div>

        <div className='space-y-4'>
          {loads.map(load => (
            <div
              key={load.id}
              className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {load.title}
                  </h3>
                  <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <MapPin className='w-4 h-4' />
                      <span>{load.pickupLocation}</span>
                      <span>→</span>
                      <span>{load.deliveryLocation}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar className='w-4 h-4' />
                      <span>
                        {new Date(load.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Truck className='w-4 h-4' />
                      <span>{load.vehicleType}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    load.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {load.status === 'active' ? 'Aktif' : 'Beklemede'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NakliyeciLoads;
