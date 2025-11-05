import React from 'react';
import Footer from '../components/common/Footer';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>İletişim - YolNext</title>
        <meta name='description' content="YolNext ile iletişime geçin. Sorularınız için bize ulaşın." />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>İletişim</h1>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçebilirsiniz.
            </p>
          </div>

          <div className='grid md:grid-cols-2 gap-8 mb-12'>
            <div className='bg-white p-8 rounded-xl shadow-lg'>
              <h2 className='text-2xl font-semibold mb-6'>İletişim Bilgileri</h2>
              
              <div className='space-y-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <Mail className='w-6 h-6 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>E-posta</h3>
                    <p className='text-gray-600'>info@yolnext.com</p>
                    <p className='text-gray-600'>destek@yolnext.com</p>
                  </div>
                </div>

                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <Phone className='w-6 h-6 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>Telefon</h3>
                    <p className='text-gray-600'>+90 (212) 555 0123</p>
                    <p className='text-gray-600'>7/24 Destek Hattı</p>
                  </div>
                </div>

                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-6 h-6 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>Adres</h3>
                    <p className='text-gray-600'>
                      YolNext Teknoloji A.Ş.<br />
                      İstanbul, Türkiye
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white p-8 rounded-xl shadow-lg'>
              <h2 className='text-2xl font-semibold mb-6'>Bize Mesaj Gönderin</h2>
              
              <form className='space-y-4'>
                <div>
                  <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
                    Ad Soyad
                  </label>
                  <input
                    type='text'
                    id='name'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Adınız ve soyadınız'
                  />
                </div>

                <div>
                  <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                    E-posta
                  </label>
                  <input
                    type='email'
                    id='email'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='ornek@email.com'
                  />
                </div>

                <div>
                  <label htmlFor='subject' className='block text-sm font-medium text-gray-700 mb-2'>
                    Konu
                  </label>
                  <input
                    type='text'
                    id='subject'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Mesaj konusu'
                  />
                </div>

                <div>
                  <label htmlFor='message' className='block text-sm font-medium text-gray-700 mb-2'>
                    Mesaj
                  </label>
                  <textarea
                    id='message'
                    rows={5}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                    placeholder='Mesajınızı buraya yazın...'
                  />
                </div>

                <button
                  type='submit'
                  className='w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 px-6 rounded-lg font-semibold hover:from-slate-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2'
                >
                  <Send className='w-5 h-5' />
                  Mesaj Gönder
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

