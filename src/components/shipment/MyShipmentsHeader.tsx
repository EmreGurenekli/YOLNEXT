// MyShipmentsHeader.tsx
// Header component for MyShipments page - displays title and description
// Used in: src/pages/individual/MyShipments.tsx

import React from 'react';
import { Package } from 'lucide-react';

export default function MyShipmentsHeader() {
  return (
    <div className='text-center mb-12'>
      <div className='flex justify-center mb-6'>
        <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
          <Package className='w-8 h-8 text-white' />
        </div>
      </div>
      <h1 className='text-4xl md:text-5xl font-bold text-slate-900 mb-3'>
        Gönderilerinizi{' '}
        <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
          Takip Edin
        </span>
      </h1>
      <p className='text-lg text-slate-600'>
        Gönderilerinizin durumunu takip edin ve yönetin
      </p>
    </div>
  );
}

