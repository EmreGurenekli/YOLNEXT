import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Package, ArrowRight } from 'lucide-react';

const MyShipmentsNew: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Gönderilerim - Bireysel Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Gönderilerim
          </h1>
          <p className='text-gray-600'>Tüm gönderilerinizi buradan yönetin</p>
        </div>

        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center'>
          <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Gönderilerinizi görüntülemek için
          </h3>
          <p className='text-gray-600 mb-6'>
            Ana gönderiler sayfasını kullanabilirsiniz
          </p>
          <Link
            to='/individual/shipments'
            className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Gönderilerime Git
            <ArrowRight className='w-5 h-5' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyShipmentsNew;
