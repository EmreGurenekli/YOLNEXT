// Step 1: Yük Bilgileri Component
// Extracted from CreateShipment.tsx for better code organization

import React from 'react';
import {
  Package,
  Weight,
  Ruler,
  Thermometer,
  AlertTriangle,
  Star,
  Clock,
  Check,
  FileText,
} from 'lucide-react';

interface CreateShipmentStep1Props {
  formData: any;
  errors: { [key: string]: string };
  handleInputChange: (field: string, value: any) => void;
  handleDimensionsChange: (field: string, value: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  mainCategories: { id: string; name: string }[];
}

export default function CreateShipmentStep1({
  formData,
  errors,
  handleInputChange,
  handleDimensionsChange,
  setErrors,
  mainCategories,
}: CreateShipmentStep1Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-semibold text-slate-900 mb-4">
          <Package className="w-5 h-5 inline mr-2" />
          Ne taşıyacaksınız? (Kategori seçin - nakliyeciler size özel teklif verecek) *
        </label>
        <select
          value={formData.mainCategory ?? ''}
          onChangeCapture={(e) => {
            handleInputChange('mainCategory', (e.currentTarget as HTMLSelectElement).value);
          }}
          onChange={(e) => {
            handleInputChange('mainCategory', e.currentTarget.value);
            if (errors.mainCategory) {
              setErrors(prev => ({ ...prev, mainCategory: '' }));
            }
          }}
          onInput={(e) => {
            handleInputChange('mainCategory', (e.currentTarget as HTMLSelectElement).value);
          }}
          aria-label="Yük kategorisi seçin"
          aria-required="true"
          aria-invalid={!!errors.mainCategory}
          aria-describedby={errors.mainCategory ? 'mainCategory-error' : undefined}
          className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 text-lg min-h-[48px] ${
            errors.mainCategory ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
          }`}
        >
          <option value="">Seçin - doğru kategori = doğru fiyat</option>
          {mainCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.mainCategory && (
          <p id="mainCategory-error" className="mt-2 text-sm text-red-600" role="alert">{errors.mainCategory}</p>
        )}
      </div>

      {formData.mainCategory && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            {/* Yük Açıklaması - Her kategori için zorunlu */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 inline mr-2" />
                Yük Açıklaması *
              </label>
              <textarea
                value={formData.productDescription ?? ''}
                onChange={(e) => {
                  handleInputChange('productDescription', e.target.value);
                  if (errors.productDescription) {
                    setErrors(prev => ({ ...prev, productDescription: '' }));
                  }
                }}
                onInput={(e) => {
                  handleInputChange('productDescription', (e.currentTarget as HTMLTextAreaElement).value);
                }}
                rows={4}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                  errors.productDescription ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Taşınacak eşyalar hakkında detaylı bilgi verin (örn: 3+1 ev eşyası, büyük eşyalar: koltuk, yatak, buzdolabı)"
              />
              {errors.productDescription && (
                <p className="mt-2 text-sm text-red-600">{errors.productDescription}</p>
              )}
            </div>

            {/* Ev Taşınması Özel Alanları */}
            {formData.mainCategory === 'house_move' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Oda Sayısı *
                    </label>
                    <select
                      value={formData.roomCount ?? ''}
                      onChange={(e) => {
                        handleInputChange('roomCount', e.target.value);
                        if (errors.roomCount) {
                          setErrors(prev => ({ ...prev, roomCount: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                        errors.roomCount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      } text-slate-900 caret-slate-900`}
                    >
                      <option value="">Seçin</option>
                      <option value="1+0">1+0</option>
                      <option value="1+1">1+1</option>
                      <option value="2+1">2+1</option>
                      <option value="3+1">3+1</option>
                      <option value="4+1">4+1</option>
                      <option value="5+1">5+1</option>
                      <option value="6+1">6+1</option>
                      <option value="7+1">7+1</option>
                    </select>
                    {errors.roomCount && (
                      <p className="mt-2 text-sm text-red-600">{errors.roomCount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bina Tipi *
                    </label>
                    <select
                      value={formData.buildingType ?? ''}
                      onChange={(e) => {
                        handleInputChange('buildingType', e.target.value);
                        if (errors.buildingType) {
                          setErrors(prev => ({ ...prev, buildingType: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                        errors.buildingType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      } text-slate-900 caret-slate-900`}
                    >
                      <option value="">Seçin</option>
                      <option value="apartment">Apartman Dairesi</option>
                      <option value="villa">Villa</option>
                      <option value="residence">Rezidans</option>
                      <option value="duplex">Dubleks</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="other">Diğer</option>
                    </select>
                    {errors.buildingType && (
                      <p className="mt-2 text-sm text-red-600">{errors.buildingType}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Toplama Adresi Katı *
                    </label>
                    <input
                      type="text"
                      value={formData.pickupFloor}
                      onChange={(e) => {
                        handleInputChange('pickupFloor', e.target.value);
                        if (errors.pickupFloor) {
                          setErrors(prev => ({ ...prev, pickupFloor: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                        errors.pickupFloor ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      } text-slate-900 caret-slate-900`}
                      placeholder="Örn: Zemin, 1, 2, 3, Çatı katı"
                    />
                    {errors.pickupFloor && (
                      <p className="mt-2 text-sm text-red-600">{errors.pickupFloor}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teslimat Adresi Katı *
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryFloor}
                      onChange={(e) => {
                        handleInputChange('deliveryFloor', e.target.value);
                        if (errors.deliveryFloor) {
                          setErrors(prev => ({ ...prev, deliveryFloor: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                        errors.deliveryFloor ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      } text-slate-900 caret-slate-900`}
                      placeholder="Örn: Zemin, 1, 2, 3, Çatı katı"
                    />
                    {errors.deliveryFloor && (
                      <p className="mt-2 text-sm text-red-600">{errors.deliveryFloor}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Asansör Durumu *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.hasElevatorPickup}
                        onChange={(e) => handleInputChange('hasElevatorPickup', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Toplama adresinde asansör var</span>
                    </label>
                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.hasElevatorDelivery}
                        onChange={(e) => handleInputChange('hasElevatorDelivery', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Teslimat adresinde asansör var</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={formData.needsPackaging}
                      onChange={(e) => handleInputChange('needsPackaging', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Ambalaj ve paketleme hizmeti istiyorum</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Özel Eşyalar (Piano, Antika, Sanat Eseri vb.)
                  </label>
                  <textarea
                    value={formData.specialItems ?? ''}
                    onChange={(e) => handleInputChange('specialItems', e.target.value)}
                    rows={3}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Özel eşyalarınız varsa detaylı bilgi verin..."
                  />
                </div>
              </>
            )}

            {/* Mobilya Taşıma Özel Alanları */}
            {formData.mainCategory === 'furniture_goods' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobilya Parça Sayısı
                  </label>
                  <input
                    type="number"
                    value={formData.furniturePieces ?? ''}
                    onChange={(e) => handleInputChange('furniturePieces', e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Örn: 5"
                    min="1"
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={formData.isDisassembled}
                      onChange={(e) => handleInputChange('isDisassembled', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Mobilyalar sökülmüş durumda</span>
                  </label>
                </div>
              </>
            )}

            {/* Ağırlık ve Boyutlar - Ev Taşınması hariç */}
            {formData.mainCategory !== 'house_move' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Weight className="w-4 h-4 inline mr-2" />
                    Ağırlık (kg) *
                  </label>
                  <input
                    type="number"
                    value={formData.weight ?? ''}
                    onChange={(e) => {
                      handleInputChange('weight', e.target.value);
                      if (errors.weight) {
                        setErrors(prev => ({ ...prev, weight: '' }));
                      }
                    }}
                    onInput={(e) => {
                      handleInputChange('weight', (e.currentTarget as HTMLInputElement).value);
                    }}
                    className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                      errors.weight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    step="0.1"
                    min="0.1"
                  />
                  {errors.weight && (
                    <p className="mt-2 text-sm text-red-600">{errors.weight}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Package className="w-4 h-4 inline mr-2" />
                    Miktar
                  </label>
                  <input
                    type="number"
                    value={formData.quantity ?? ''}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    onInput={(e) => handleInputChange('quantity', (e.currentTarget as HTMLInputElement).value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    min="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    <Ruler className="w-4 h-4 inline mr-2" />
                    Boyutlar (cm) - Opsiyonel
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Uzunluk</label>
                      <input
                        type="number"
                        value={formData.dimensions.length}
                        onChange={(e) => handleDimensionsChange('length', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Genişlik</label>
                      <input
                        type="number"
                        value={formData.dimensions.width}
                        onChange={(e) => handleDimensionsChange('width', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Yükseklik</label>
                      <input
                        type="number"
                        value={formData.dimensions.height}
                        onChange={(e) => handleDimensionsChange('height', e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Özel Gereksinimler - Kategoriye göre filtrelenmiş */}
            {formData.mainCategory !== 'house_move' && (() => {
              const getRelevantRequirements = () => {
                switch (formData.mainCategory) {
                  case 'furniture_goods':
                    return [
                      { id: 'fragile', name: 'Kırılgan', icon: AlertTriangle, color: 'red' },
                      { id: 'signature', name: 'İmzalı Teslimat', icon: Check, color: 'blue' }
                    ];
                  case 'special_cargo':
                    return [
                      { id: 'fragile', name: 'Kırılgan', icon: AlertTriangle, color: 'red' },
                      { id: 'urgent', name: 'Acil', icon: Clock, color: 'orange' },
                      { id: 'temperature', name: 'Soğuk Zincir', icon: Thermometer, color: 'cyan' },
                      { id: 'valuable', name: 'Değerli', icon: Star, color: 'yellow' }
                    ];
                  default:
                    return [
                      { id: 'fragile', name: 'Kırılgan', icon: AlertTriangle, color: 'red' },
                      { id: 'urgent', name: 'Acil', icon: Clock, color: 'orange' },
                      { id: 'signature', name: 'İmzalı Teslimat', icon: Check, color: 'blue' }
                    ];
                }
              };

              const relevantRequirements = getRelevantRequirements();
              const selectedRequirements = formData.specialRequirements
                ? formData.specialRequirements.split(',').filter((r: string) => r.trim())
                : [];

              return (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Özel Gereksinimler
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {relevantRequirements.map((req) => {
                      const Icon = req.icon;
                      const isSelected = selectedRequirements.includes(req.id);
                      return (
                        <label
                          key={req.id}
                          className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              let newRequirements = [...selectedRequirements];
                              if (e.target.checked) {
                                newRequirements.push(req.id);
                              } else {
                                newRequirements = newRequirements.filter((r) => r !== req.id);
                              }
                              handleInputChange('specialRequirements', newRequirements.join(','));
                            }}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <Icon className={`w-5 h-5 ml-3 ${isSelected ? `text-${req.color}-600` : 'text-gray-400'}`} />
                          <span className={`ml-2 text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                            {req.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

