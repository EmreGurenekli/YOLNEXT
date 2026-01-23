// ActiveShipmentsHeader.tsx
// Header component for ActiveShipments page (nakliyeci) - displays title and description
// Used in: src/pages/nakliyeci/ActiveShipments.tsx

import React from 'react';
import { Package } from 'lucide-react';

export default function ActiveShipmentsHeader() {
  return (
    <div className='text-center mb-6 sm:mb-8 md:mb-12'>
      <div className='flex justify-center mb-3 sm:mb-4 md:mb-6'>
        <div className='w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg'>
          <Package className='w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white' />
        </div>
      </div>
      <h1 className='text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
        Aktif Yükler
      </h1>
      <p className='text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 px-2 sm:px-4'>
        Tüm gönderilerinizi tek ekranda görüntüleyin ve yönetin
      </p>
    </div>
  );
}

