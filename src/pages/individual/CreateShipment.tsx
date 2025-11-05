import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  MapPin, 
  Check,
  ArrowLeft,
  ArrowRight,
  Send,
  Weight,
  Ruler,
  Thermometer,
  AlertTriangle,
  Shield,
  Star,
  Calendar,
  Clock,
  Plus,
  FileText
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import SuccessMessage from '../../components/common/SuccessMessage';

export default function CreateShipment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    mainCategory: '',
    productDescription: '',
    weight: '',
    quantity: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    specialRequirements: '',
    pickupAddress: '',
    deliveryAddress: '',
    pickupDate: '',
    deliveryDate: '',
    publishType: 'all',
    // Ev Taşınması için
    roomCount: '',
    pickupFloor: '',
    deliveryFloor: '',
    buildingType: '',
    hasElevatorPickup: false,
    hasElevatorDelivery: false,
    needsPackaging: false,
    specialItems: '',
    // Mobilya Taşıma için
    furniturePieces: '',
    isDisassembled: false
  });

  const steps = [
    { id: 1, title: 'Yük Bilgileri', icon: <Package size={20} /> },
    { id: 2, title: 'Adres Bilgileri', icon: <MapPin size={20} /> },
    { id: 3, title: 'Yayınla & Önizleme', icon: <Send size={20} /> }
  ];

  const mainCategories = [
    { id: 'house_move', name: 'Ev Taşınması' },
    { id: 'furniture_goods', name: 'Mobilya Taşıma' },
    { id: 'special_cargo', name: 'Özel Yük' },
    { id: 'other', name: 'Diğer' }
  ];


  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDimensionsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      // Step 1: Yük Bilgileri validasyonu
      if (!formData.mainCategory) {
        newErrors.mainCategory = 'Kategori seçimi zorunludur';
      }
      if (!formData.productDescription || formData.productDescription.trim() === '') {
        newErrors.productDescription = 'Yük açıklaması zorunludur';
      }

      // Kategoriye göre özel validasyonlar
      if (formData.mainCategory === 'house_move') {
        if (!formData.roomCount) {
          newErrors.roomCount = 'Oda sayısı zorunludur';
        }
        if (!formData.buildingType) {
          newErrors.buildingType = 'Bina tipi zorunludur';
        }
        if (!formData.pickupFloor || formData.pickupFloor.trim() === '') {
          newErrors.pickupFloor = 'Toplama katı zorunludur';
        }
        if (!formData.deliveryFloor || formData.deliveryFloor.trim() === '') {
          newErrors.deliveryFloor = 'Teslimat katı zorunludur';
        }
      } else if (formData.mainCategory === 'furniture_goods') {
        if (!formData.furniturePieces) {
          newErrors.furniturePieces = 'Parça sayısı zorunludur';
        }
      } else if (formData.mainCategory === 'special_cargo') {
        if (!formData.weight || formData.weight.trim() === '') {
          newErrors.weight = 'Ağırlık zorunludur';
        }
      }
    } else if (step === 2) {
      // Step 2: Adres Bilgileri validasyonu
      if (!formData.pickupAddress || formData.pickupAddress.trim() === '') {
        newErrors.pickupAddress = 'Toplama adresi zorunludur';
      }
      if (!formData.deliveryAddress || formData.deliveryAddress.trim() === '') {
        newErrors.deliveryAddress = 'Teslimat adresi zorunludur';
      }
      if (!formData.pickupDate) {
        newErrors.pickupDate = 'Toplama tarihi zorunludur';
      }
      if (!formData.deliveryDate) {
        newErrors.deliveryDate = 'Teslimat tarihi zorunludur';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = () => {
    // Tüm adımları validate et
    if (!validateStep(1) || !validateStep(2)) {
      // Hatalar gösterildi, yayınlama yapma
      setCurrentStep(1); // İlk hataya geri dön
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Gönderiniz başarıyla yayınlandı! Nakliyecilerden teklifler almaya başlayacaksınız.');
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setFormData({
          mainCategory: '',
          productDescription: '',
          weight: '',
          quantity: '',
          dimensions: { length: '', width: '', height: '' },
          specialRequirements: '',
          pickupAddress: '',
          deliveryAddress: '',
          pickupDate: '',
          deliveryDate: '',
          publishType: 'all',
          roomCount: '',
          pickupFloor: '',
          deliveryFloor: '',
          buildingType: '',
          hasElevatorPickup: false,
          hasElevatorDelivery: false,
          needsPackaging: false,
          specialItems: '',
          furniturePieces: '',
          isDisassembled: false
        });
        setCurrentStep(1);
        setShowSuccessMessage(false);
        setErrors({});
      }, 3000);
    }, 2000);
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-4">
                <Package className="w-5 h-5 inline mr-2" />
                Hangi tür yük taşıyacaksınız? *
              </label>
              <select
                value={formData.mainCategory}
                onChange={(e) => {
                  handleInputChange('mainCategory', e.target.value);
                  if (errors.mainCategory) {
                    setErrors(prev => ({ ...prev, mainCategory: '' }));
                  }
                }}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 text-lg ${
                  errors.mainCategory ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              >
                <option value="">Kategori seçiniz</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.mainCategory && (
                <p className="mt-2 text-sm text-red-600">{errors.mainCategory}</p>
              )}
            </div>

            {formData.mainCategory && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  {/* Yük Açıklaması - Her kategori için zorunlu */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      <FileText className="w-4 h-4 inline mr-2" />
                      {formData.mainCategory === 'special_cargo' ? 'Detaylı Açıklama *' : 'Yük Açıklaması *'}
                    </label>
                      <textarea
                      value={formData.productDescription}
                      onChange={(e) => {
                        handleInputChange('productDescription', e.target.value);
                        if (errors.productDescription) {
                          setErrors(prev => ({ ...prev, productDescription: '' }));
                        }
                      }}
                      rows={formData.mainCategory === 'special_cargo' ? 5 : 3}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                        errors.productDescription ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder={
                        formData.mainCategory === 'special_cargo' 
                          ? 'Özel yükünüzü detaylı olarak tarif edin. Ne taşınacak, özel gereksinimler neler?'
                          : formData.mainCategory === 'house_move'
                          ? 'Taşınacak eşyalar, özel durumlar, ek bilgiler (örn: Buzdolabı, çamaşır makinesi, yatak odası takımı vb.)'
                          : formData.mainCategory === 'furniture_goods'
                          ? 'Mobilya tipleri, özel durumlar...'
                          : 'Yükünüzü detaylı olarak tarif edin...'
                      }
                    />
                    {errors.productDescription && (
                      <p className="mt-2 text-sm text-red-600">{errors.productDescription}</p>
                    )}
                  </div>

                  {/* Ev Taşınması - Özel Alanlar */}
                  {formData.mainCategory === 'house_move' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Oda Sayısı *
                          </label>
                          <select
                            value={formData.roomCount}
                            onChange={(e) => {
                              handleInputChange('roomCount', e.target.value);
                              if (errors.roomCount) {
                                setErrors(prev => ({ ...prev, roomCount: '' }));
                              }
                            }}
                            className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                              errors.roomCount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Seçiniz</option>
                            <option value="1">1 Oda</option>
                            <option value="1+1">1+1</option>
                            <option value="2">2 Oda</option>
                            <option value="2+1">2+1</option>
                            <option value="3">3 Oda</option>
                            <option value="3+1">3+1</option>
                            <option value="4">4 Oda</option>
                            <option value="4+1">4+1</option>
                            <option value="5+">5+ Oda</option>
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
                            value={formData.buildingType}
                            onChange={(e) => {
                              handleInputChange('buildingType', e.target.value);
                              if (errors.buildingType) {
                                setErrors(prev => ({ ...prev, buildingType: '' }));
                              }
                            }}
                            className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                              errors.buildingType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Seçiniz</option>
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
                            }`}
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
                            }`}
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
                          value={formData.specialItems}
                          onChange={(e) => handleInputChange('specialItems', e.target.value)}
                          rows={3}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md resize-none"
                          placeholder="Varsa özel eşyalarınızı belirtin (piano, antika, sanat eseri, kırılgan değerli eşyalar vb.)"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mobilya Taşıma - Özel Alanlar */}
                  {formData.mainCategory === 'furniture_goods' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Parça Sayısı *
                        </label>
                        <input
                          type="number"
                          value={formData.furniturePieces}
                          onChange={(e) => {
                            handleInputChange('furniturePieces', e.target.value);
                            if (errors.furniturePieces) {
                              setErrors(prev => ({ ...prev, furniturePieces: '' }));
                            }
                          }}
                          className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                            errors.furniturePieces ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          min="1"
                        />
                        {errors.furniturePieces && (
                          <p className="mt-2 text-sm text-red-600">{errors.furniturePieces}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sökülmüş mü?
                        </label>
                        <select
                          value={formData.isDisassembled ? 'yes' : 'no'}
                          onChange={(e) => handleInputChange('isDisassembled', e.target.value === 'yes')}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        >
                          <option value="no">Hayır, monte</option>
                          <option value="yes">Evet, sökülmüş</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                          <Ruler className="w-4 h-4 inline mr-2" />
                          En Büyük Parça Boyutları (cm) - Opsiyonel
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

                  {/* Diğer ve Özel Yük - Standart Alanlar */}
                  {(formData.mainCategory === 'other' || formData.mainCategory === 'special_cargo') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Weight className="w-4 h-4 inline mr-2" />
                          Ağırlık (kg) *
                        </label>
                        <input
                          type="number"
                          value={formData.weight}
                          onChange={(e) => {
                            handleInputChange('weight', e.target.value);
                            if (errors.weight) {
                              setErrors(prev => ({ ...prev, weight: '' }));
                            }
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
                          value={formData.quantity}
                          onChange={(e) => handleInputChange('quantity', e.target.value)}
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

                  {/* Özel Gereksinimler - Sigorta hariç, kategoriye göre filtrelenmiş */}
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
                    
                    if (relevantRequirements.length === 0) return null;

                    return (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Özel Gereksinimler</h3>
                        <div className={`grid grid-cols-2 sm:grid-cols-3 ${relevantRequirements.length > 3 ? 'lg:grid-cols-6' : 'lg:grid-cols-3'} gap-3`}>
                          {relevantRequirements.map((req) => {
                        const IconComponent = req.icon;
                        const isSelected = formData.specialRequirements.includes(req.id);
                        
                        return (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => {
                              const current = formData.specialRequirements.split(',').filter(r => r.trim());
                              const isSelected = current.includes(req.id);
                              let newRequirements;
                              if (isSelected) {
                                newRequirements = current.filter(r => r !== req.id);
                              } else {
                                newRequirements = [...current, req.id];
                              }
                              handleInputChange('specialRequirements', newRequirements.join(','));
                            }}
                            className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                              isSelected
                                ? `border-${req.color}-500 bg-${req.color}-50`
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                isSelected ? `bg-${req.color}-500` : 'bg-slate-100'
                              }`}>
                                <IconComponent className={`w-4 h-4 ${
                                  isSelected ? 'text-white' : 'text-slate-600'
                                }`} />
                              </div>
                              <span className={`text-xs font-medium ${
                                isSelected ? `text-${req.color}-900` : 'text-slate-700'
                              }`}>
                                {req.name}
                              </span>
                            </div>
                          </button>
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

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Adres & İletişim Bilgileri</h2>
              <p className="text-slate-600">Toplama ve teslimat bilgilerini girin</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Toplama Adresi</h3>
                    <p className="text-sm text-slate-600">Gönderiyi nereden alacağız?</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Adres *
                    </label>
                    <textarea
                      value={formData.pickupAddress}
                      onChange={(e) => {
                        handleInputChange('pickupAddress', e.target.value);
                        if (errors.pickupAddress) {
                          setErrors(prev => ({ ...prev, pickupAddress: '' }));
                        }
                      }}
                      rows={4}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                        errors.pickupAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Tam adres bilgilerini girin..."
                    />
                    {errors.pickupAddress && (
                      <p className="mt-2 text-sm text-red-600">{errors.pickupAddress}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Toplama Tarihi *
                    </label>
                    <input
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => {
                        handleInputChange('pickupDate', e.target.value);
                        if (errors.pickupDate) {
                          setErrors(prev => ({ ...prev, pickupDate: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                        errors.pickupDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {errors.pickupDate && (
                      <p className="mt-2 text-sm text-red-600">{errors.pickupDate}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Teslimat Adresi</h3>
                    <p className="text-sm text-slate-600">Gönderiyi nereye teslim edeceğiz?</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Adres *
                    </label>
                    <textarea
                      value={formData.deliveryAddress}
                      onChange={(e) => {
                        handleInputChange('deliveryAddress', e.target.value);
                        if (errors.deliveryAddress) {
                          setErrors(prev => ({ ...prev, deliveryAddress: '' }));
                        }
                      }}
                      rows={4}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                        errors.deliveryAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                      placeholder="Tam adres bilgilerini girin..."
                    />
                    {errors.deliveryAddress && (
                      <p className="mt-2 text-sm text-red-600">{errors.deliveryAddress}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Teslimat Tarihi *
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => {
                        handleInputChange('deliveryDate', e.target.value);
                        if (errors.deliveryDate) {
                          setErrors(prev => ({ ...prev, deliveryDate: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                        errors.deliveryDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                    {errors.deliveryDate && (
                      <p className="mt-2 text-sm text-red-600">{errors.deliveryDate}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
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
                            {formData.hasElevatorPickup ? 'Toplama var' : 'Toplama yok'}
                            {formData.hasElevatorPickup !== formData.hasElevatorDelivery && ' / '}
                            {formData.hasElevatorDelivery ? 'Teslimat var' : 'Teslimat yok'}
                            {!formData.hasElevatorPickup && !formData.hasElevatorDelivery && 'Yok'}
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
                          {formData.specialRequirements.split(',').filter(r => r.trim() && r.trim() !== 'insurance').map(req => {
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
          </div>
        );

      default:
        return null;
    }
  };

  const breadcrumbItems = [
    { label: 'Yeni Gönderi', icon: <Plus className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Yeni Gönderi - YolNet Bireysel</title>
        <meta name="description" content="Bireysel gönderi oluşturun" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Yeni{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Gönderi</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
            Adım adım gönderi oluşturun. Profesyonel nakliye hizmetlerimizle güvenle taşıyın.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                Adım {currentStep} / {steps.length}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                {steps[currentStep - 1].title}
              </p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              {steps[currentStep - 1].icon}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                  currentStep >= step.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold">{step.id}</span>
                  )}
                </div>
                <span className="hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          {renderStepContent()}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Geri</span>
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="text-sm sm:text-base">İleri</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">Yayınlanıyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Gönderiyi Yayınla</span>
                </>
              )}
            </button>
          )}
        </div>

        {showSuccessMessage && (
          <SuccessMessage
            message={successMessage}
            isVisible={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
      </div>
    </div>
  );
}







