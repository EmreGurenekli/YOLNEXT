import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  CheckCircle,
  HelpCircle,
  FileText,
  Users,
  BarChart,
} from 'lucide-react';

const CorporateGuide: React.FC = () => {
  const sections = [
    {
      icon: Users,
      title: 'Takım Yönetimi',
      items: [
        'Takım üyeleri ekleyin',
        'Yetki seviyelerini belirleyin',
        'Departman oluşturun',
      ],
    },
    {
      icon: FileText,
      title: 'Gönderi Oluşturma',
      items: [
        'Toplu gönderi ekleyin',
        'Şablon kullanın',
        'Otomatik fiyatlandırma',
      ],
    },
    {
      icon: BarChart,
      title: 'Raporlama',
      items: [
        'Detaylı analitikler',
        'Maliyet raporları',
        'Performance metrikleri',
      ],
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Kurumsal Kılavuz - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Kurumsal Kılavuz
          </h1>
          <p className='text-gray-600'>
            YolNext ile iş akışınızı optimize edin
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {sections.map((section, idx) => (
            <div
              key={idx}
              className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'
            >
              <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4'>
                <section.icon className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                {section.title}
              </h3>
              <ul className='space-y-2'>
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className='flex items-center gap-2 text-gray-600 text-sm'
                  >
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CorporateGuide;
