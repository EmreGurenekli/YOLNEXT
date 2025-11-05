import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart, TrendingUp, Truck, DollarSign } from 'lucide-react';

const NakliyeciAnalytics: React.FC = () => {
  const stats = [
    { label: 'Toplam Gönderi', value: '1,250', icon: Truck, color: 'blue' },
    {
      label: 'Tamamlanma Oranı',
      value: '94%',
      icon: TrendingUp,
      color: 'green',
    },
    { label: 'Ortalama Puan', value: '4.8', icon: BarChart, color: 'yellow' },
    {
      label: 'Toplam Kazanç',
      value: '₺125,000',
      icon: DollarSign,
      color: 'green',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Analitik - Nakliyeci Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Performans Analizi
          </h1>
          <p className='text-gray-600'>İş performansınızın detaylı analizi</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'
            >
              <div className='flex items-center justify-between mb-4'>
                <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
              </div>
              <div className='text-2xl font-bold text-gray-900'>
                {stat.value}
              </div>
              <div className='text-sm text-gray-600 mt-2'>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold mb-4'>Aylık Trend Analizi</h2>
          <div className='h-64 flex items-end justify-between gap-4'>
            {[65, 78, 82, 75, 88, 94, 98].map((height, idx) => (
              <div key={idx} className='flex-1 flex flex-col items-center'>
                <div
                  className='bg-blue-600 rounded-t-lg w-full'
                  style={{ height: `${height}%` }}
                ></div>
                <span className='text-xs text-gray-500 mt-2'>Ay {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NakliyeciAnalytics;
