// RoutePlannerCorridorLoads.tsx
// Corridor loads component for Route Planner page - displays loads available on the corridor
// Used in: src/pages/nakliyeci/RoutePlanner.tsx

import React from 'react';
import { Package, RefreshCw, MapPin, Weight, DollarSign, Truck } from 'lucide-react';

interface AvailableLoad {
  id: number;
  title: string;
  pickupAddress: string;
  deliveryAddress: string;
  weight: number;
  volume: number;
  price: number;
  deadline: string;
  distance: number;
  corridorDirection?: 'outbound' | 'backhaul' | null;
  corridorFromIndex?: number | null;
  corridorToIndex?: number | null;
  driver: {
    id: string;
    name: string;
    phone: string;
    email: string;
  } | null;
  shipper: {
    name: string;
    phone: string;
    email: string;
  };
}

interface RoutePlannerCorridorLoadsProps {
  corridor: { pickupCity: string | null; deliveryCity: string | null } | null;
  selectedDriverId: string | null;
  corridorLoads: AvailableLoad[];
  corridorLoading: boolean;
  onLoadClick?: (load: AvailableLoad) => void;
}

export default function RoutePlannerCorridorLoads({
  corridor,
  selectedDriverId,
  corridorLoads,
  corridorLoading,
  onLoadClick,
}: RoutePlannerCorridorLoadsProps) {
  if (!corridor || !selectedDriverId) {
    return (
      <div className='bg-slate-50 rounded-xl p-8 border-2 border-dashed border-slate-300 text-center'>
        <Truck className='w-16 h-16 mx-auto mb-4 text-slate-400' />
        <p className='text-slate-600 font-medium'>
          Bir taşıyıcı seçin, güzergah yükleri görüntülenecek
        </p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
      <div className='flex items-center gap-3 mb-4'>
        <Package className='w-6 h-6 text-slate-700' />
        <h2 className='text-xl font-bold text-slate-900'>Güzergah Yükleri</h2>
      </div>
      <p className='text-sm text-slate-600 mb-4'>
        Bu güzergahtaki yüklere teklif vererek taşıyıcınızın dolu gidip dolu gelmesini sağlayın.
      </p>
      {corridorLoading ? (
        <div className='flex items-center justify-center py-8'>
          <RefreshCw className='w-5 h-5 animate-spin text-slate-600' />
          <span className='ml-3 text-slate-600'>Yükler yükleniyor...</span>
        </div>
      ) : corridorLoads.length === 0 ? (
        <div className='text-center py-8 text-slate-500'>
          <Package className='w-12 h-12 mx-auto mb-3 text-slate-300' />
          <p className='text-base font-medium mb-1'>Bu güzergahta yük bulunamadı</p>
          <p className='text-sm'>Başka bir taşıyıcı seçebilir veya daha sonra tekrar kontrol edebilirsiniz.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {corridorLoads.map(load => (
            <div
              key={load.id}
              className='p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors'
            >
              <div className='flex items-start justify-between mb-2'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-medium text-slate-900 truncate'>{load.title}</h4>
                    {load.corridorDirection === 'outbound' && (
                      <span className='px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800'>
                        Gidiş
                      </span>
                    )}
                    {load.corridorDirection === 'backhaul' && (
                      <span className='px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800'>
                        Dönüş
                      </span>
                    )}
                  </div>
                </div>
                {onLoadClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadClick(load);
                    }}
                    className='px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors'
                  >
                    Teklif Ver
                  </button>
                )}
              </div>
              <div className='space-y-2 text-sm text-slate-600'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4' />
                  <span>{load.pickupAddress} → {load.deliveryAddress}</span>
                </div>
                <div className='flex items-center gap-4'>
                  <span className='flex items-center gap-1'>
                    <Weight className='w-4 h-4' />
                    {load.weight.toLocaleString()}kg
                  </span>
                  <span className='flex items-center gap-1'>
                    <DollarSign className='w-4 h-4' />₺
                    {load.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}












