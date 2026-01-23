// RoutePlannerCorridorInfo.tsx
// Corridor info component for Route Planner page - displays active corridor information
// Used in: src/pages/nakliyeci/RoutePlanner.tsx

import React from 'react';
import { Route, AlertCircle, ArrowRight } from 'lucide-react';

interface Corridor {
  pickupCity: string | null;
  deliveryCity: string | null;
}

interface RoutePlannerCorridorInfoProps {
  corridor: Corridor | null;
  selectedDriverId: string | null;
}

export default function RoutePlannerCorridorInfo({
  corridor,
  selectedDriverId,
}: RoutePlannerCorridorInfoProps) {
  if (corridor && selectedDriverId) {
    return (
      <div className='bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-6 text-white shadow-lg'>
        <div className='flex items-center gap-3 mb-4'>
          <Route className='w-6 h-6 text-white' />
          <h3 className='text-lg font-bold'>Aktif Güzergah</h3>
        </div>
        <div className='bg-white bg-opacity-10 rounded-lg p-4'>
          <div className='flex items-center justify-center gap-3'>
            <div className='text-center'>
              <div className='text-xs text-blue-200 mb-1'>Başlangıç</div>
              <div className='text-lg font-bold'>
                {corridor.pickupCity || '—'}
              </div>
            </div>
            <ArrowRight className='w-5 h-5 text-white' />
            <div className='text-center'>
              <div className='text-xs text-blue-200 mb-1'>Hedef</div>
              <div className='text-lg font-bold'>
                {corridor.deliveryCity || '—'}
              </div>
            </div>
          </div>
        </div>
        <p className='text-xs text-blue-200 mt-3 text-center'>
          Bu güzergahtaki yükler aşağıda gösteriliyor
        </p>
      </div>
    );
  }

  if (selectedDriverId && !corridor) {
    return (
      <div className='bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200'>
        <div className='flex items-center gap-3 mb-2'>
          <AlertCircle className='w-6 h-6 text-yellow-600' />
          <h3 className='text-lg font-semibold text-yellow-900'>Güzergah Bulunamadı</h3>
        </div>
        <p className='text-sm text-yellow-800'>
          Bu taşıyıcının henüz aktif bir yükü yok. Taşıyıcıya bir yük atandığında güzergah otomatik olarak oluşacak.
        </p>
      </div>
    );
  }

  return null;
}

