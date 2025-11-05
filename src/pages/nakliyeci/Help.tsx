import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, MessageCircle, BookOpen, Video } from 'lucide-react';

const NakliyeciHelp: React.FC = () => {
  const helpSections = [
    {
      icon: BookOpen,
      title: 'Kullanım Kılavuzu',
      description: 'Detaylı platform rehberi',
      link: '/docs',
    },
    {
      icon: Video,
      title: 'Video Eğitimler',
      description: 'Adım adım video anlatımlar',
      link: '/videos',
    },
    {
      icon: MessageCircle,
      title: 'Canlı Destek',
      description: '7/24 chat desteği',
      link: '/support',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Yardım - Nakliyeci Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Yardım Merkezi
          </h1>
          <p className='text-gray-600'>Size nasıl yardımcı olabiliriz?</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {helpSections.map((section, idx) => (
            <div
              key={idx}
              className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer'
            >
              <section.icon className='w-12 h-12 text-blue-600 mb-4' />
              <h3 className='font-semibold text-gray-900 mb-2'>
                {section.title}
              </h3>
              <p className='text-gray-600 text-sm'>{section.description}</p>
            </div>
          ))}
        </div>

        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6'>
          <div className='flex items-center gap-3 mb-4'>
            <HelpCircle className='w-6 h-6 text-blue-600' />
            <h2 className='text-lg font-semibold'>Sık Sorulan Sorular</h2>
          </div>
          <div className='space-y-3'>
            {[
              'Nasıl gönderi oluştururum?',
              'Fiyat nasıl hesaplanır?',
              'Ödeme nasıl yapılır?',
            ].map((question, idx) => (
              <div
                key={idx}
                className='p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer'
              >
                <p className='font-medium text-gray-900'>{question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NakliyeciHelp;
