// Step 3: Önizleme ve Yayınlama Component
// Extracted from CreateShipment.tsx for better code organization

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface CreateShipmentStep3Props {
  formData: any;
  errors: { [key: string]: string };
  isLoading: boolean;
  handleInputChange: (field: string, value: any) => void;
  handlePublish: () => void;
}

const mainCategories = [
  { id: 'house_move', name: 'Ev Taşınması' },
  { id: 'furniture_goods', name: 'Mobilya Taşıma' },
  { id: 'special_cargo', name: 'Özel Yük' },
  { id: 'other', name: 'Diğer' }
];

export default function CreateShipmentStep3({
  formData,
  errors,
  isLoading,
  handleInputChange,
  handlePublish,
}: CreateShipmentStep3Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Gönderi Özeti</h2>
        <p className="text-slate-600">Bilgilerinizi kontrol edin ve gönderiyi yayınlayın</p>
      </div>
      
      <div className="bg-slate-50 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Yük Bilgileri</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Kategori:</span>
                <span className="font-medium text-slate-900">
                  {mainCategories.find(c => c.id === formData.mainCategory)?.name}
                </span>
              </div>
              
              {/* Ev Taşınması Bilgileri */}
              {formData.mainCategory === 'house_move' && (
                <>
                  {formData.roomCount && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Oda Sayısı:</span>
                      <span className="font-medium text-slate-900">{formData.roomCount}</span>
                    </div>
                  )}
                  {formData.buildingType && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bina Tipi:</span>
                      <span className="font-medium text-slate-900">
                        {formData.buildingType === 'apartment' && 'Apartman Dairesi'}
                        {formData.buildingType === 'villa' && 'Villa'}
                        {formData.buildingType === 'residence' && 'Rezidans'}
                        {formData.buildingType === 'duplex' && 'Dubleks'}
                        {formData.buildingType === 'penthouse' && 'Penthouse'}
                        {formData.buildingType === 'other' && 'Diğer'}
                      </span>
                    </div>
                  )}
                  {formData.pickupFloor && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Toplama Katı:</span>
                      <span className="font-medium text-slate-900">{formData.pickupFloor}</span>
                    </div>
                  )}
                  {formData.deliveryFloor && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Teslimat Katı:</span>
                      <span className="font-medium text-slate-900">{formData.deliveryFloor}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Asansör:</span>
                    <span className="font-medium text-slate-900">
                      {(() => {
                        const parts = [];
                        if (formData.hasElevatorPickup) parts.push('Toplama var');
                        if (formData.hasElevatorDelivery) parts.push('Teslimat var');
                        if (parts.length === 0) return 'Yok';
                        return parts.join(', ');
                      })()}
                    </span>
                  </div>
                  {formData.needsPackaging && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ambalaj Hizmeti:</span>
                      <span className="font-medium text-slate-900">İsteniyor</span>
                    </div>
                  )}
                  {formData.specialItems && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Özel Eşyalar:</span>
                      <span className="font-medium text-slate-900">{formData.specialItems}</span>
                    </div>
                  )}
                </>
              )}

              {/* Mobilya Taşıma Bilgileri */}
              {formData.mainCategory === 'furniture_goods' && (
                <>
                  {formData.furniturePieces && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Parça Sayısı:</span>
                      <span className="font-medium text-slate-900">{formData.furniturePieces}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sökülmüş:</span>
                    <span className="font-medium text-slate-900">
                      {formData.isDisassembled ? 'Evet' : 'Hayır, monte'}
                    </span>
                  </div>
                  {formData.dimensions.length && formData.dimensions.width && formData.dimensions.height && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Boyut (En büyük parça):</span>
                      <span className="font-medium text-slate-900">
                        {formData.dimensions.length} x {formData.dimensions.width} x {formData.dimensions.height} cm
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Diğer ve Özel Yük Bilgileri */}
              {(formData.mainCategory === 'other' || formData.mainCategory === 'special_cargo') && (
                <>
                  {formData.weight && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ağırlık:</span>
                      <span className="font-medium text-slate-900">{formData.weight} kg</span>
                    </div>
                  )}
                  {formData.quantity && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Miktar:</span>
                      <span className="font-medium text-slate-900">{formData.quantity}</span>
                    </div>
                  )}
                  {formData.dimensions.length && formData.dimensions.width && formData.dimensions.height && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Boyut:</span>
                      <span className="font-medium text-slate-900">
                        {formData.dimensions.length} x {formData.dimensions.width} x {formData.dimensions.height} cm
                      </span>
                    </div>
                  )}
                </>
              )}
              {formData.specialRequirements && formData.specialRequirements.trim() && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Özel Gereksinimler:</span>
                  <span className="font-medium text-slate-900">
                    {formData.specialRequirements.split(',').filter(r => r.trim()).map(req => {
                      const reqMap: { [key: string]: string } = {
                        'fragile': 'Kırılgan',
                        'urgent': 'Acil',
                        'signature': 'İmzalı Teslimat',
                        'temperature': 'Soğuk Zincir',
                        'valuable': 'Değerli'
                      };
                      return reqMap[req.trim()] || req.trim();
                    }).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Adres Bilgileri</h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-600">Toplama:</span>
                <p className="font-medium text-slate-900 text-sm">{formData.pickupAddress}</p>
              </div>
              <div>
                <span className="text-slate-600">Teslimat:</span>
                <p className="font-medium text-slate-900 text-sm">{formData.deliveryAddress}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Toplama Tarihi:</span>
                <span className="font-medium text-slate-900">{formData.pickupDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Teslimat Tarihi:</span>
                <span className="font-medium text-slate-900">{formData.deliveryDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {errors.publish && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 mb-1">Hata!</h4>
              <p className="text-sm text-red-700">{errors.publish}</p>
              {errors.publish.includes('bağlanılamıyor') || errors.publish.includes('connection') || errors.publish.includes('Failed to fetch') ? (
                <p className="text-xs text-red-600 mt-2">
                  Sunucuya bağlanılamıyor. İnternet bağlantını kontrol et. 
                  Sorun devam ederse gönderi bilgilerinizi kontrol edip tekrar deneyin.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Önemli Bilgilendirme - Sorumluluk Reddi */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Önemli Bilgilendirme - Sorumluluk Reddi</h3>
            <div className="space-y-3 text-sm text-amber-800">
              <p className="font-semibold">
                YolNext bir pazaryeri platformudur. Hiçbir sorumluluk almaz.
              </p>
              <p>
                YolNext, göndericiler ve nakliyeciler arasında bağlantı kuran bir aracı platformdur. 
                Taşımacılık hizmetlerini bizzat sağlamaz ve sigorta hizmeti vermez.
              </p>
              <p className="font-medium">
                Tüm riskler gönderici ve nakliyeci arasındadır. Kaza, yangın, çalınma gibi durumlarda 
                taraflar arasında çözülmelidir. Platform sadece tarafları buluşturan bir aracıdır.
              </p>
              <p>
                <strong>Sigorta:</strong> İhtiyaç duyuyorsanız, kendi sigortanızı yaptırmak TAMAMEN sizin sorumluluğunuzdadır. 
                YolNext hiçbir sigorta hizmeti vermez.
              </p>
              <p>
                <Link to="/terms" target="_blank" className="text-amber-900 underline font-medium hover:text-amber-700">
                  Detaylı bilgi için Kullanım Koşulları&apos;nı inceleyebilirsiniz
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Yayınlama Tercihi</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="all"
              name="publishType"
              value="all"
              checked={formData.publishType === 'all'}
              onChange={(e) => handleInputChange('publishType', e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="all" className="ml-3 text-sm font-medium text-slate-700">
              Tüm nakliyecilere açık (Önerilen)
            </label>
          </div>
        </div>
      </div>

      {/* Yayınla Butonu */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handlePublish}
          disabled={isLoading}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
          }`}
        >
          {isLoading ? 'Yayınlanıyor...' : 'Gönderiyi Yayınla'}
        </button>
      </div>
    </div>
  );
}

