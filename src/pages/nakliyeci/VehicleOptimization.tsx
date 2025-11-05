import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Truck, TrendingUp, Fuel, Route } from 'lucide-react';

const NakliyeciVehicleOptimization: React.FC = () => {
  const optimizations = [
    {
      icon: Fuel,
      title: 'Yakıt Tasarrufu',
      value: '%23',
      description: 'Rota optimizasyonu ile',
    },
    {
      icon: Route,
      title: 'Mesafe Azaltma',
      value: '%18',
      description: 'Daha kısa yollar seçilerek',
    },
    {
      icon: TrendingUp,
      title: 'Zaman Kazanç',
      value: '%15',
      description: 'Verimli planlama ile',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Araç Optimizasyonu - Nakliyeci Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Araç Optimizasyonu
          </h1>
          <p className='text-gray-600'>Fleet yönetiminizi optimize edin</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
          {optimizations.map((opt, idx) => (
            <div
              key={idx}
              className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'
            >
              <opt.icon className='w-10 h-10 text-blue-600 mb-4' />
              <h3 className='font-semibold text-gray-900 mb-2'>{opt.title}</h3>
              <div className='text-3xl font-bold text-blue-600 mb-2'>
                {opt.value}
              </div>
              <p className='text-sm text-gray-600'>{opt.description}</p>
            </div>
          ))}
        </div>

        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold mb-4'>Öneriler</h2>
          <ul className='space-y-3'>
            {[
              'Rota optimizasyonu için AI öneriler',
              'Vites değişikliği zamanlamaları',
              'Bakım programı planlaması',
            ].map((item, idx) => (
              <li key={idx} className='flex items-center gap-3 text-gray-700'>
                <TrendingUp className='w-5 h-5 text-green-600' />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NakliyeciVehicleOptimization;
