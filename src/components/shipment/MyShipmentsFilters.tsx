// MyShipmentsFilters.tsx
// Filters component for MyShipments page - search, status filter, sort, and reset
// Used in: src/pages/individual/MyShipments.tsx

import React from 'react';
import { Search, X } from 'lucide-react';

interface MyShipmentsFiltersProps {
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onReset: () => void;
}

export default function MyShipmentsFilters({
  searchTerm,
  statusFilter,
  sortBy,
  onSearchChange,
  onStatusFilterChange,
  onSortByChange,
  onReset,
}: MyShipmentsFiltersProps) {
  return (
    <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
          <input
            type='text'
            placeholder='Gönderi ara...'
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            aria-label='Gönderi ara'
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusFilterChange(e.target.value)}
          className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          aria-label='Durum filtresi'
        >
          <option value='all'>Tüm Durumlar</option>
          <option value='active'>Aktif Gönderiler</option>
          <option value='completed'>Tamamlanan</option>
          <option value='pending'>Beklemede</option>
        </select>

        <select
          value={sortBy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSortByChange(e.target.value)}
          className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          aria-label='Sıralama seçeneği'
        >
          <option value='date'>Tarihe Göre</option>
          <option value='status'>Duruma Göre</option>
          <option value='priority'>Önceliğe Göre</option>
          <option value='value'>Değere Göre</option>
        </select>

        <button
          onClick={onReset}
          className='min-h-[44px] px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'
          aria-label='Filtreleri sıfırla'
        >
          <X className='w-4 h-4' />
          Sıfırla
        </button>
      </div>
    </div>
  );
}












