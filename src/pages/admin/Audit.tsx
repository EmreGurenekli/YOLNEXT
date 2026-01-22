import React from 'react';
import { Helmet } from 'react-helmet-async';

const Audit: React.FC = () => {
  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Audit - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Audit</h1>
          <p className='text-slate-600'>Kim ne yaptı (okuma ekranı)</p>
        </div>

        <div className='card p-6'>
          <div className='text-sm text-slate-600'>
            Backend hazır olunca `/api/admin/audit` ile listelenecek.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;
