import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText } from 'lucide-react';

const Cases: React.FC = () => {
  const [tab, setTab] = useState<'acik' | 'tum'>('acik');

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Vakalar - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-10'>
        <div className='mb-6 lg:mb-8 flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
              <FileText className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Vakalar</h1>
              <div className='text-sm text-slate-600 mt-1'>Şikayet / itiraz / inceleme dosyaları</div>
            </div>
          </div>
        </div>

        <div className='mb-5 flex flex-wrap gap-2'>
          <button
            className={
              'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
              (tab === 'acik'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
            }
            onClick={() => setTab('acik')}
          >
            Açık Vakalar
          </button>
          <button
            className={
              'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
              (tab === 'tum'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
            }
            onClick={() => setTab('tum')}
          >
            Tümü
          </button>
        </div>

        <div className='card p-6 lg:p-7'>
          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Durum</div>
          <div className='mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
            <div className='text-sm font-semibold text-slate-900'>Henüz bağlı değil</div>
            <div className='text-xs text-slate-600 mt-1'>
              Bu ekranı backend onayı sonrası gerçek “case management” olarak bağlayacağız.
            </div>
          </div>

          <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
            <div className='text-sm font-semibold text-slate-900'>Hedef akış</div>
            <div className='text-xs text-slate-600 mt-1'>
              pending/reviewing şikayetleri “vaka” olarak toplamak ve Operasyon Masası’ndaki inspector’a bağlamak.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cases;
