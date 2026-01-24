// ActiveShipmentsFilters.tsx
// Filters component for ActiveShipments page (nakliyeci) - search and status filter
// Used in: src/pages/nakliyeci/ActiveShipments.tsx

import React from 'react';
import { Search } from 'lucide-react';

interface ActiveShipmentsFiltersProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export default function ActiveShipmentsFilters({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: ActiveShipmentsFiltersProps) {
  return (
    <div className='bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border border-gray-200 mb-4 sm:mb-6'>
      <div className='flex flex-col gap-3 sm:gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4' />
            <input
              type='text'
              placeholder='Yük ara...'
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className='w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
        </div>
        <div className='flex gap-2'>
          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
            className='flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='all'>Tümü</option>
            <option value='waiting_driver'>Taşıyıcı Bekliyor</option>
            <option value='active'>Aktif</option>
            <option value='delivered'>Tamamlanan</option>
            <option value='cancelled'>İptal Edilen</option>
          </select>
        </div>
      </div>
    </div>
  );
}












