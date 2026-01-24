// JobsHeader.tsx
// Header component for Jobs page (nakliyeci) - displays title and description
// Used in: src/pages/nakliyeci/Jobs.tsx

import React from 'react';
import { Target } from 'lucide-react';

export default function JobsHeader() {
  return (
    <div className='text-center mb-8 sm:mb-12'>
      <div className='flex justify-center mb-4 sm:mb-6'>
        <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
          <Target className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
        </div>
      </div>
      <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
        İş{' '}
        <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
          İlanları
        </span>
      </h1>
      <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
        Açık gönderiler için teklif verin ve iş alın
      </p>
    </div>
  );
}












