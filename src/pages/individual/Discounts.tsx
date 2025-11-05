import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Tag } from 'lucide-react';

const IndividualDiscounts: React.FC = () => {
  const discounts = [
    { code: 'WELCOME10', discount: 10, desc: 'İlk siparişinize özel' },
    { code: 'BULK15', discount: 15, desc: '5+ gönderi için' },
    { code: 'FAST20', discount: 20, desc: 'Hızlı kargo tercih edenlere' },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>İndirimler - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            İndirim Kodları
          </h1>
          <p className='text-gray-600'>Mevcut indirim kodlarınızı kullanın</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {discounts.map((item, idx) => (
            <div
              key={idx}
              className='bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6'
            >
              <Tag className='w-12 h-12 mb-4' />
              <h3 className='text-2xl font-bold mb-2'>{item.code}</h3>
              <p className='text-blue-100 mb-4'>{item.desc}</p>
              <div className='text-4xl font-bold'>%{item.discount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndividualDiscounts;
