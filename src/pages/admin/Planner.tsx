import React from 'react';
import { Helmet } from 'react-helmet-async';

const Planner: React.FC = () => {
  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Görevler - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Görevler</h1>
          <p className='text-slate-600'>Atama + öncelik + SLA</p>
        </div>

        <div className='card p-6'>
          <div className='text-sm text-slate-600'>
            Backend hazır olunca `/api/admin/tasks` ile listelenecek.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planner;
