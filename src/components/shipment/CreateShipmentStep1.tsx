// Step 1: Yük Bilgileri Component
// Extracted from CreateShipment.tsx for better code organization

import React, { useState, useEffect } from 'react';
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
  Info,
  ChevronDown,
  ChevronUp,
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
  const isSpecialCargo = formData.mainCategory === 'special_cargo';
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const requirementColorClass: Record<string, string> = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    cyan: 'text-cyan-600',
    yellow: 'text-yellow-600',
  };

  // Real-time validation
  const validateField = (field: string, value: any) => {
    let error = '';
    
    if (touchedFields.has(field)) {
      switch (field) {
        case 'mainCategory':
          if (!value) error = 'Lütfen bir kategori seçiniz';
          break;
        case 'productDescription':
          if (!value || value.trim().length < 10) {
            error = 'Lütfen en az 10 karakterlik açıklama giriniz';
          } else if (value.length > 1000) {
            error = 'Açıklama 1000 karakteri geçemez';
          }
          break;
        case 'roomCount':
          if (formData.mainCategory === 'house_move' && !value) {
            error = 'Oda sayısı seçimi zorunludur';
          }
          break;
        case 'buildingType':
          if (formData.mainCategory === 'house_move' && !value) {
            error = 'Bina tipi seçimi zorunludur';
          }
          break;
        case 'weight':
          if (isSpecialCargo && (!value || parseFloat(value) <= 0)) {
            error = 'Ağırlık 0\'dan büyük olmalıdır';
          } else if (value && parseFloat(value) > 50000) {
            error = 'Ağırlık 50000 kg\'ı geçemez';
          }
          break;
        case 'quantity':
          if (!value || parseInt(value) < 1) {
            error = 'Miktar 1\'den küçük olamaz';
          } else if (value && parseInt(value) > 1000) {
            error = 'Miktar 1000\'ü geçemez';
          }
          break;
        case 'pickupFloor':
          if (formData.mainCategory === 'house_move' && !value?.trim()) {
            error = 'Toplama adresi katı zorunludur';
          }
          break;
        case 'deliveryFloor':
          if (formData.mainCategory === 'house_move' && !value?.trim()) {
            error = 'Teslimat adresi katı zorunludur';
          }
          break;
      }
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const handleFieldChange = (field: string, value: any) => {
    handleInputChange(field, value);
    setTouchedFields(prev => new Set(prev).add(field));
    validateField(field, value);
    
    // Clear general error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-save form data
  useEffect(() => {
    const formDataString = JSON.stringify(formData);
    localStorage.setItem('shipmentDraft', formDataString);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('shipmentDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        // Only restore if no data exists yet
        if (!formData.mainCategory && draftData.mainCategory) {
          Object.keys(draftData).forEach(key => {
            if (key !== 'mainCategory' || draftData.mainCategory) {
              handleInputChange(key, draftData[key]);
            }
          });
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []); // Empty dependency array to run only once

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-semibold text-slate-900 mb-2">
          <Package className="w-5 h-5 inline mr-2 text-blue-600" />
          Yük Kategorisi *
        </label>
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Önemli:</strong> Doğru kategori seçimi, daha uygun ve daha hızlı teklif almanı sağlar.
              </p>
              <div className="mt-2 text-xs text-slate-600">
                💡 <strong>İpucu:</strong> Kategori seçimi, fiyat tekliflerini %30-40 oranında etkiler.
              </div>
            </div>
            <button
              onClick={() => setShowCategoryInfo(!showCategoryInfo)}
              className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
              aria-label="Kategori bilgisi"
            >
              {showCategoryInfo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {showCategoryInfo && (
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Neden önemli?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Nakliyeciler teklif hesaplamasını kategoriye göre yapar</li>
                    <li>Yanlış kategori, yanlış fiyat/uygunsuz tekliflere neden olabilir</li>
                    <li>Doğru kategori, daha hızlı ve daha fazla teklif almanızı sağlar</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        <select
          value={formData.mainCategory ?? ''}
          onChange={(e) => {
            handleFieldChange('mainCategory', e.target.value);
          }}
          onBlur={() => validateField('mainCategory', formData.mainCategory)}
          aria-label="Yük kategorisi seçin"
          aria-required="true"
          aria-invalid={!!fieldErrors.mainCategory || !!errors.mainCategory}
          aria-describedby={(fieldErrors.mainCategory || errors.mainCategory) ? 'mainCategory-error' : undefined}
          className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 text-lg min-h-[48px] ${
            (fieldErrors.mainCategory || errors.mainCategory) 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
          }`}
        >
          <option value="">Kategori seçiniz</option>
          {mainCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {(fieldErrors.mainCategory || errors.mainCategory) && (
          <p id="mainCategory-error" className="mt-2 text-sm text-red-600 flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {fieldErrors.mainCategory || errors.mainCategory}
          </p>
        )}
      </div>

      {formData.mainCategory && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            {/* Yük Açıklaması - Her kategori için zorunlu */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Yük Açıklaması *
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Taşınacak eşyalarınız hakkında detaylı bilgi veriniz. Bu bilgiler, nakliyecilerin size en doğru fiyat teklifini sunabilmesi için gereklidir.
              </p>
              <textarea
                value={formData.productDescription ?? ''}
                onChange={(e) => {
                  handleFieldChange('productDescription', e.target.value);
                }}
                onBlur={() => validateField('productDescription', formData.productDescription)}
                rows={4}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                  (fieldErrors.productDescription || errors.productDescription)
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Örnek: 3+1 daire eşyası, büyük eşyalar (koltuk takımı, yatak odası takımı, buzdolabı, çamaşır makinesi), küçük eşyalar (kutu, çanta vb.)"
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${
                  formData.productDescription?.length > 0 
                    ? 'text-gray-500' 
                    : 'text-gray-400'
                }`}>
                  {formData.productDescription?.length || 0} / 1000 karakter
                </span>
                {(fieldErrors.productDescription || errors.productDescription) && (
                  <span className="text-xs text-red-600">
                    {fieldErrors.productDescription || errors.productDescription}
                  </span>
                )}
              </div>
              {(fieldErrors.productDescription || errors.productDescription) && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {fieldErrors.productDescription || errors.productDescription}
                </p>
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
                    Asansör Durumu (opsiyonel)
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
                    Mobilya Parça Sayısı *
                  </label>
                  <input
                    type="number"
                    value={formData.furniturePieces ?? ''}
                    onChange={(e) => {
                      handleInputChange('furniturePieces', e.target.value);
                      if (errors.furniturePieces) {
                        setErrors((prev) => ({ ...prev, furniturePieces: '' }));
                      }
                    }}
                    className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                      errors.furniturePieces
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Örn: 5"
                    min="1"
                  />
                  {errors.furniturePieces && (
                    <p className="mt-2 text-sm text-red-600">{errors.furniturePieces}</p>
                  )}
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
                    Ağırlık (kg){isSpecialCargo ? ' *' : ' (opsiyonel)'}
                  </label>
                  <input
                    type="number"
                    value={formData.weight ?? ''}
                    onChange={(e) => {
                      handleFieldChange('weight', e.target.value);
                    }}
                    onBlur={() => validateField('weight', formData.weight)}
                    step="0.1"
                    min="0.1"
                    className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                      (fieldErrors.weight || errors.weight)
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${
                      formData.weight ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {formData.weight ? `${formData.weight} kg` : 'Ağırlık belirtilmemiş'}
                    </span>
                    {(fieldErrors.weight || errors.weight) && (
                      <span className="text-xs text-red-600">
                        {fieldErrors.weight || errors.weight}
                      </span>
                    )}
                  </div>
                  {(fieldErrors.weight || errors.weight) && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2" role="alert">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {fieldErrors.weight || errors.weight}
                    </p>
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
                    onChange={(e) => {
                      handleFieldChange('quantity', e.target.value);
                    }}
                    onBlur={() => validateField('quantity', formData.quantity)}
                    min="1"
                    className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                      fieldErrors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${
                      formData.quantity ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {formData.quantity ? `${formData.quantity} adet` : 'Miktar belirtilmemiş'}
                    </span>
                    {fieldErrors.quantity && (
                      <span className="text-xs text-red-600">
                        {fieldErrors.quantity}
                      </span>
                    )}
                  </div>
                  {fieldErrors.quantity && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2" role="alert">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {fieldErrors.quantity}
                    </p>
                  )}
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
                    Özel Gereksinimler (opsiyonel)
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
                          <Icon
                            className={`w-5 h-5 ml-3 ${
                              isSelected ? (requirementColorClass[req.color] || 'text-blue-600') : 'text-gray-400'
                            }`}
                          />
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












