import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, Download, Calendar, Users } from 'lucide-react';

const DepartmentReporting: React.FC = () => {
  const reports = [
    {
      name: 'Aylık Lojistik Raporu',
      date: 'Ocak 2024',
      department: 'Lojistik',
      size: '2.5 MB',
    },
    {
      name: 'Departman Performance',
      date: 'Aralık 2023',
      department: 'Tüm Departmanlar',
      size: '1.8 MB',
    },
    {
      name: 'Maliyet Analizi',
      date: 'Q4 2023',
      department: 'Finans',
      size: '3.2 MB',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Departman Raporlama - Kurumsal Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Departman Raporları
          </h1>
          <p className='text-gray-600'>Departman bazlı detaylı raporlar</p>
        </div>

        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-lg font-semibold'>Son Raporlar</h2>
            <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2'>
              <Download className='w-4 h-4' />
              Yeni Rapor Oluştur
            </button>
          </div>

          <div className='space-y-3'>
            {reports.map((report, idx) => (
              <div
                key={idx}
                className='flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center'>
                    <FileText className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>{report.name}</h3>
                    <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-4 h-4' />
                        <span>{report.date}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Users className='w-4 h-4' />
                        <span>{report.department}</span>
                      </div>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <button className='px-4 py-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2'>
                  <Download className='w-4 h-4' />
                  İndir
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentReporting;
