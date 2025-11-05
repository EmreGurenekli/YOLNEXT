import React from 'react';
import { Helmet } from 'react-helmet-async';

const CorporateHelp: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Yardım - Kurumsal Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Yardım Merkezi
          </h1>
          <p className='text-gray-600'>Bu sayfa geliştiriliyor...</p>
        </div>
      </div>
    </div>
  );
};

export default CorporateHelp;
