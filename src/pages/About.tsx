import React from 'react';
import Footer from '../components/common/Footer';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Truck, Users, Shield } from 'lucide-react';

const About = () => {
  return (
    <>
      <Helmet>
        <title>Hakkımızda - YolNext</title>
        <meta name='description' content="YolNext hakkında bilgi edinin. Türkiye'nin en büyük lojistik platformu." />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>Hakkımızda</h1>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              YolNext, Türkiye'nin en büyük ve güvenilir lojistik platformudur.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
            <div className='bg-white p-6 rounded-xl shadow-lg'>
              <Truck className='w-12 h-12 text-blue-600 mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Hızlı Taşıma</h3>
              <p className='text-gray-600'>Binlerce nakliyeci ile hızlı ve güvenli taşıma hizmeti.</p>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg'>
              <Shield className='w-12 h-12 text-green-600 mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Güvenli Platform</h3>
              <p className='text-gray-600'>Tüm işlemler güvenli ve şeffaf bir şekilde yönetilir.</p>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg'>
              <Users className='w-12 h-12 text-purple-600 mb-4' />
              <h3 className='text-xl font-semibold mb-2'>4 Kullanıcı Tipi</h3>
              <p className='text-gray-600'>Bireysel, Kurumsal, Nakliyeci ve Taşıyıcı için özel çözümler.</p>
            </div>
          </div>

          <div className='text-center'>
            <Link
              to='/'
              className='inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]'
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default About;



