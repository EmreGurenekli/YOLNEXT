// CorporateCreateShipmentStep3.tsx
// Step 3 component for Corporate CreateShipment page - Preview and Publish
// Used in: src/pages/corporate/CreateShipment.tsx

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CorporateCreateShipmentStep3Props {
  formData: any;
  errors: any;
  errorMessage?: string;
  handleInputChange: (field: string, value: any) => void;
  getCurrentCategory: () => any;
  nakliyeciler: any[];
  loadingNakliyeciler: boolean;
}

export default function CorporateCreateShipmentStep3({
  formData,
  errors,
  errorMessage,
  handleInputChange,
  getCurrentCategory,
  nakliyeciler,
  loadingNakliyeciler,
}: CorporateCreateShipmentStep3Props) {
  return (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-slate-900 mb-2'>
          Gönderi Özeti
        </h2>
        <p className='text-slate-600'>
          Bilgilerinizi kontrol edin ve gönderiyi yayınlayın
        </p>
      </div>

      <div className='bg-slate-50 rounded-xl p-6 space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              Yük Bilgileri
            </h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-slate-600'>Kategori:</span>
                <span className='font-medium text-slate-900'>
                  {getCurrentCategory()?.name}
                </span>
              </div>
              {formData.weight && (
                <div className='flex justify-between'>
                  <span className='text-slate-600'>Ağırlık:</span>
                  <span className='font-medium text-slate-900'>
                    {formData.weight} kg
                  </span>
                </div>
              )}
              {formData.quantity && (
                <div className='flex justify-between'>
                  <span className='text-slate-600'>Miktar:</span>
                  <span className='font-medium text-slate-900'>
                    {formData.quantity}
                  </span>
                </div>
              )}
              {formData.dimensions.length && formData.dimensions.width && formData.dimensions.height && (
                <div className='flex justify-between'>
                  <span className='text-slate-600'>Boyut:</span>
                  <span className='font-medium text-slate-900'>
                    {formData.dimensions.length} x {formData.dimensions.width} x {formData.dimensions.height} cm
                  </span>
                </div>
              )}
              {formData.specialRequirements && (
                <div className='flex justify-between'>
                  <span className='text-slate-600'>Özel Gereksinimler:</span>
                  <span className='font-medium text-slate-900'>
                    {formData.specialRequirements}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>
              Adres Bilgileri
            </h3>
            <div className='space-y-2'>
              <div>
                <span className='text-slate-600'>Toplama:</span>
                <p className='font-medium text-slate-900 text-sm'>
                  {formData.pickupAddress}
                </p>
              </div>
              <div>
                <span className='text-slate-600'>Teslimat:</span>
                <p className='font-medium text-slate-900 text-sm'>
                  {formData.deliveryAddress}
                </p>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-600'>Toplama Tarihi:</span>
                <span className='font-medium text-slate-900'>
                  {formData.pickupDate}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-600'>Teslimat Tarihi:</span>
                <span className='font-medium text-slate-900'>
                  {formData.deliveryDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {(errors.publish || errorMessage) && (
        <div className='bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <h4 className='font-bold text-red-800 mb-1'>Hata!</h4>
              <p className='text-sm text-red-700'>{errors.publish || errorMessage}</p>
              {(errors.publish || errorMessage)?.includes('bağlanılamıyor') || (errors.publish || errorMessage)?.includes('connection') || (errors.publish || errorMessage)?.includes('Failed to fetch') ? (
                <p className='text-xs text-red-600 mt-2'>
                  İnternet bağlantınızı kontrol edin. Sorun devam ederse destek ekibimizle iletişime geçebilirsiniz.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Önemli Bilgilendirme - Sorumluluk Reddi */}
      <div className='bg-amber-50 border-2 border-amber-300 rounded-xl p-6 space-y-3'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-amber-900 mb-3'>
              Önemli Bilgilendirme - Sorumluluk Reddi
            </h3>
            <div className='space-y-3 text-sm text-amber-800'>
              <p className='font-semibold'>
                YolNext bir pazaryeri platformudur. Hiçbir sorumluluk almaz.
              </p>
              <p>
                YolNext, göndericiler ve nakliyeciler arasında bağlantı kuran bir aracı platformdur. 
                Taşımacılık hizmetlerini bizzat sağlamaz ve sigorta hizmeti vermez.
              </p>
              <p className='font-medium'>
                Tüm riskler gönderici ve nakliyeci arasındadır. Kaza, yangın, çalınma gibi durumlarda 
                taraflar arasında çözülmelidir. Platform sadece tarafları buluşturan bir aracıdır.
              </p>
              <p>
                <strong>Sigorta:</strong> İhtiyaç duyuyorsanız, kendi sigortanızı yaptırmak TAMAMEN sizin sorumluluğunuzdadır. 
                YolNext hiçbir sigorta hizmeti vermez.
              </p>
              <p>
                <a
                  href='/terms'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-amber-900 underline font-medium hover:text-amber-700'
                >
                  Detaylı bilgi için Kullanım Koşulları&apos;nı inceleyebilirsiniz
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl p-6 border border-slate-200'>
        <h3 className='text-lg font-semibold text-slate-900 mb-4'>
          Yayınlama Tercihi
        </h3>
        <div className='space-y-4'>
          <div className='flex items-center'>
            <input
              type='radio'
              id='all'
              name='publishType'
              value='all'
              checked={formData.publishType === 'all'}
              onChange={(e) => {
                handleInputChange('publishType', e.target.value);
                handleInputChange('targetNakliyeciId', ''); // Reset nakliyeci selection
              }}
              className='w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500'
            />
            <label htmlFor='all' className='ml-3 text-sm font-medium text-slate-700'>
              Tüm nakliyecilere açık (Önerilen)
            </label>
          </div>
          <div className='flex items-start'>
            <input
              type='radio'
              id='specific'
              name='publishType'
              value='specific'
              checked={formData.publishType === 'specific'}
              onChange={(e) => handleInputChange('publishType', e.target.value)}
              className='w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1'
            />
            <div className='ml-3 flex-1'>
              <label htmlFor='specific' className='text-sm font-medium text-slate-700 block mb-2'>
                Belirli nakliyeciye özel (Favori nakliyecilerinizden seçin)
              </label>
              {formData.publishType === 'specific' && (
                <>
                  {loadingNakliyeciler ? (
                    <div className="text-sm text-slate-500 py-2">Favori nakliyeciler yükleniyor...</div>
                  ) : nakliyeciler.length === 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-amber-600 py-2">
                        Henüz favori nakliyeciniz yok. Önce favori nakliyecilerinize ekleyin.
                      </div>
                      <a
                        href="/corporate/carriers"
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Nakliyeciler sayfasına git →
                      </a>
                    </div>
                  ) : (
                    <select
                      value={formData.targetNakliyeciId}
                      onChange={(e) => handleInputChange('targetNakliyeciId', e.target.value)}
                      className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                      required={formData.publishType === 'specific'}
                    >
                      <option value=''>Favori nakliyeci seçin...</option>
                      {nakliyeciler.map((nakliyeci) => (
                        <option key={nakliyeci.id} value={nakliyeci.id}>
                          {nakliyeci.companyName || nakliyeci.name || nakliyeci.fullName} - {nakliyeci.email}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












