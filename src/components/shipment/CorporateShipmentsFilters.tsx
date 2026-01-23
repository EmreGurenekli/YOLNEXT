// CorporateShipmentsFilters.tsx
// Filters component for Corporate Shipments page - search, status filter, sort, and reset
// Used in: src/pages/corporate/Shipments.tsx

import React from 'react';
import { Search, X } from 'lucide-react';

interface CorporateShipmentsFiltersProps {
  searchTerm: string;
  filterStatus: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onReset: () => void;
}

export default function CorporateShipmentsFilters({
  searchTerm,
  filterStatus,
  sortBy,
  onSearchChange,
  onStatusFilterChange,
  onSortByChange,
  onReset,
}: CorporateShipmentsFiltersProps) {
  return (
    <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200 mb-6 sm:mb-8'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
          <input
            type='text'
            placeholder='Gönderi ara...'
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className='w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => onStatusFilterChange(e.target.value)}
          className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
        >
          <option value='all'>Tüm Durumlar</option>
          <option value='active'>Aktif Gönderiler</option>
          <option value='completed'>Tamamlanan</option>
          <option value='pending'>Beklemede</option>
        </select>

        <select
          value={sortBy}
          onChange={e => onSortByChange(e.target.value)}
          className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
        >
          <option value='date'>Tarihe Göre</option>
          <option value='status'>Duruma Göre</option>
          <option value='priority'>Önceliğe Göre</option>
          <option value='value'>Değere Göre</option>
        </select>

        <button
          onClick={onReset}
          className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base'
        >
          <X className='w-4 h-4' />
          Sıfırla
        </button>
      </div>
    </div>
  );
}

