// RoutePlannerDriverSelector.tsx
// Driver selector component for Route Planner page - displays driver list and allows selection
// Used in: src/pages/nakliyeci/RoutePlanner.tsx

import React from 'react';
import { Truck, RefreshCw } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  code?: string;
  city?: string;
  district?: string;
  status?: 'available' | 'busy';
  activeJobs?: number;
}

interface Corridor {
  pickupCity: string | null;
  deliveryCity: string | null;
}

interface RoutePlannerDriverSelectorProps {
  drivers: Driver[];
  driversLoading: boolean;
  selectedDriverId: string | null;
  corridor: Corridor | null;
  onDriverClick: (driverId: string) => void;
}

export default function RoutePlannerDriverSelector({
  drivers,
  driversLoading,
  selectedDriverId,
  corridor,
  onDriverClick,
}: RoutePlannerDriverSelectorProps) {
  return (
    <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
      <div className='flex items-center gap-3 mb-4'>
        <Truck className='w-6 h-6 text-slate-700' />
        <h2 className='text-xl font-bold text-slate-900'>Taşıyıcı Seçin</h2>
      </div>
      <p className='text-sm text-slate-600 mb-4'>
        Bir taşıyıcı seçin, sistem otomatik olarak o taşıyıcının güzergahındaki yükleri gösterecek.
      </p>
      {driversLoading ? (
        <div className='flex items-center justify-center py-8'>
          <RefreshCw className='w-5 h-5 animate-spin text-slate-600' />
          <span className='ml-2 text-slate-600'>Taşıyıcılar yükleniyor...</span>
        </div>
      ) : drivers.length === 0 ? (
        <div className='text-center py-8 text-slate-500'>
          <Truck className='w-12 h-12 mx-auto mb-3 text-slate-300' />
          <p className='text-sm'>Henüz taşıyıcı bulunmuyor</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {drivers.map(driver => (
            <div
              key={driver.id}
              onClick={() => onDriverClick(driver.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDriverId === driver.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='font-semibold text-slate-900 mb-1'>
                    {driver.name || driver.email || driver.phone || driver.id}
                  </div>
                  {driver.code && (
                    <div className='text-xs text-slate-500 mb-1'>Kod: {driver.code}</div>
                  )}
                  {driver.status && (
                    <div className={`text-xs font-medium ${
                      driver.status === 'available' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {driver.status === 'available' ? '✓ Müsait' : '⚠ Meşgul'}
                    </div>
                  )}
                </div>
                {corridor && selectedDriverId === driver.id && (
                  <div className='ml-3 px-3 py-1 bg-gradient-to-r from-slate-800 to-blue-900 text-white text-xs font-medium rounded-full'>
                    Aktif
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}












