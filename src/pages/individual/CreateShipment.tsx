import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
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
  Star,
  Calendar,
  Clock,
  Plus,
  FileText,
  X
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import SuccessMessage from '../../components/common/SuccessMessage';
import { turkeyCities } from '../../data/turkey-cities-districts';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeTrackingCode } from '../../utils/trackingCode';

// Shipment data interface
interface ShipmentData {
  title: string;
  description: string;
  productDescription: string;
  category: string;
  pickupCity: string;
  pickupDistrict: string;
  pickupAddress: string;
  pickupDate: string;
  deliveryCity: string;
  deliveryDistrict: string;
  deliveryAddress: string;
  deliveryDate: string;
  weight: number;
  volume: number;
  dimensions: string | null;
  value: number;
  specialRequirements: string;
}

import { createApiUrl } from '../../config/api';

import { shipmentAPI } from '../../services/api.js';

export default function CreateShipment() {
  const navigate = useNavigate();
  const { token: authTokenFromContext } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
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
    pickupCity: '',
    pickupDistrict: '',
    pickupAddress: '',
    deliveryCity: '',
    deliveryDistrict: '',
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

  const parseISODateStrict = (value: string): Date | null => {
    const s = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [yStr, mStr, dStr] = s.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const day = parseInt(dStr, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    const dt = new Date(year, month - 1, day);
    if (!Number.isFinite(dt.getTime())) return null;
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  // Streamlined essential validation - Nakliyeci-style simplified checks
  const validateEssentialFields = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Only check truly essential fields to reduce friction
    if (!formData.mainCategory) {
      newErrors.mainCategory = 'Yük kategorisi seç';
    }
    if (!formData.productDescription?.trim()) {
      newErrors.productDescription = 'Yükünü kısaca açıkla (nakliyeciler anlayacak)';
    }
    if (!formData.pickupCity) {
      newErrors.pickupCity = 'Nereden alınacak? (il seç)';
    }
    if (!formData.deliveryCity) {
      newErrors.deliveryCity = 'Nereye gidecek? (il seç)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      // Step 1: Yük Bilgileri validasyonu
      if (!formData.mainCategory) {
        newErrors.mainCategory = 'Nakliyecilerin size doğru teklif verebilmesi için kategori seçimi çok önemli';
      }
      if (!formData.productDescription || formData.productDescription.trim() === '') {
        newErrors.productDescription = 'Nakliyeciler ne taşıyacak? Kısaca açıkla';
      }

      // Kategoriye göre özel validasyonlar
      if (formData.mainCategory === 'house_move') {
        if (!formData.roomCount) {
          newErrors.roomCount = 'Kaç odalı eviniz var? Bu bilgi fiyat için çok önemli';
        }
        if (!formData.buildingType) {
          newErrors.buildingType = 'Bina tipini belirtirseniz daha doğru fiyat alırsınız';
        }
        if (!formData.pickupFloor || formData.pickupFloor.trim() === '') {
          newErrors.pickupFloor = 'Hangi kattan alınacak? (Asansör varsa daha ucuz olabilir)';
        }
        if (!formData.deliveryFloor || formData.deliveryFloor.trim() === '') {
          newErrors.deliveryFloor = 'Hangi kata teslim edilecek? (Kat bilgisi fiyatı etkiler)';
        }
      } else if (formData.mainCategory === 'furniture_goods') {
        if (!formData.furniturePieces) {
          newErrors.furniturePieces = 'Kaç parça mobilya var? Bu fiyat için önemli';
        }
      } else if (formData.mainCategory === 'special_cargo') {
        if (!formData.weight || formData.weight.trim() === '') {
          newErrors.weight = 'Yaklaşık ağırlık çok önemli - nakliyeciler buna göre teklif verecek';
        }
      }
    } else if (step === 2) {
      // Step 2: Adres Bilgileri validasyonu
      if (!formData.pickupCity) {
        newErrors.pickupCity = 'Nereden alınacak? (il seç)';
      }
      if (!formData.pickupDistrict) {
        newErrors.pickupDistrict = 'İlçe seç (mesafe hesabı için gerekli)';
      }
      if (!formData.pickupAddress || formData.pickupAddress.trim() === '') {
        newErrors.pickupAddress = 'Tam adres önemli - nakliyeci nereye gelecek?';
      }
      if (!formData.deliveryCity) {
        newErrors.deliveryCity = 'Nereye gidecek? (il seç)';
      }
      if (!formData.deliveryDistrict) {
        newErrors.deliveryDistrict = 'İlçe seç (mesafe hesabı için gerekli)';
      }
      if (!formData.deliveryAddress || formData.deliveryAddress.trim() === '') {
        newErrors.deliveryAddress = 'Tam teslimat adresi - nakliyeci nereye gidecek?';
      }
      if (!formData.pickupDate) {
        newErrors.pickupDate = 'Ne zaman alınmasını istiyorsunuz?';
      } else {
        const pickupDate = parseISODateStrict(formData.pickupDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!pickupDate) {
          newErrors.pickupDate = 'Takvimden tarih seç';
        }
        
        // Geçmiş tarih kontrolü
        if (pickupDate && pickupDate < today) {
          newErrors.pickupDate = 'Geçmiş tarih seçemezsiniz - bugünden itibaren seçebilirsiniz';
        }
        
        // 20 gün sonrası kontrolü
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 20);
        if (pickupDate && pickupDate > maxDate) {
          newErrors.pickupDate = 'En fazla 20 gün sonrası için planlayabilirsiniz - daha yakın tarih seçin';
        }
        
        // Teslimat tarihi kontrolü
        if (formData.deliveryDate) {
          const deliveryDate = parseISODateStrict(formData.deliveryDate);
          if (!deliveryDate) {
            newErrors.deliveryDate = 'Takvimden tarih seç';
          } else if (pickupDate && deliveryDate < pickupDate) {
            newErrors.deliveryDate = 'Teslimat tarihi alım tarihinden önce olamaz';
          } else if (pickupDate) {
            const maxDeliveryDate = new Date(pickupDate);
            maxDeliveryDate.setDate(maxDeliveryDate.getDate() + 30);
            if (deliveryDate > maxDeliveryDate) {
              newErrors.deliveryDate = 'Teslimat tarihi alım tarihinden en fazla 30 gün sonra olabilir';
            }
          }
        }
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

  const handlePublish = async () => {
    // Streamlined validation - only check essential fields like Nakliyeci panel
    const essentialValid = validateEssentialFields();
    if (!essentialValid) {
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrors({ publish: 'Gönderi oluşturma işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.' });
    }, 30000); // 30 seconds timeout for shipment creation
    
    try {
      // Debug: Log formData to see what values are actually set
      console.log('🔍 DEBUG - FormData before API call:', {
        pickupCity: formData.pickupCity,
        pickupDistrict: formData.pickupDistrict,
        deliveryCity: formData.deliveryCity,
        deliveryDistrict: formData.deliveryDistrict,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate
      });

      // Use form data directly for city and district
      const pickupLocation = {
        city: formData.pickupCity || 'İstanbul',
        district: formData.pickupDistrict || ''
      };
      const deliveryLocation = {
        city: formData.deliveryCity || 'İstanbul',
        district: formData.deliveryDistrict || ''
      };

      const shipmentData = {
        title: `${pickupLocation.city} → ${deliveryLocation.city}`,
        description: formData.productDescription || '',
        productDescription: formData.productDescription || '',
        category: formData.mainCategory || 'general',
        pickupCity: pickupLocation.city,
        pickupDistrict: pickupLocation.district,
        pickupAddress: formData.pickupAddress,
        pickupDate: formData.pickupDate,
        deliveryCity: deliveryLocation.city,
        deliveryDistrict: deliveryLocation.district,
        deliveryAddress: formData.deliveryAddress,
        deliveryDate: formData.deliveryDate,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        volume: 0,
        dimensions: formData.dimensions.length && formData.dimensions.width && formData.dimensions.height
          ? `${formData.dimensions.length}x${formData.dimensions.width}x${formData.dimensions.height}`
          : null,
        value: 0,
        specialRequirements: (() => {
          // Combine button-selected requirements with form-specific requirements
          const buttonRequirements = formData.specialRequirements ? formData.specialRequirements.split(',').filter(r => r.trim()) : [];
          const formRequirements = [
            formData.roomCount ? `Oda Sayısı: ${formData.roomCount}` : null,
            formData.buildingType ? `Bina Tipi: ${formData.buildingType}` : null,
            formData.pickupFloor ? `Toplama Katı: ${formData.pickupFloor}` : null,
            formData.deliveryFloor ? `Teslimat Katı: ${formData.deliveryFloor}` : null,
            formData.hasElevatorPickup ? 'Toplama adresinde asansör var' : null,
            formData.hasElevatorDelivery ? 'Teslimat adresinde asansör var' : null,
            formData.needsPackaging ? 'Ambalaj ve paketleme hizmeti gerekli' : null,
            formData.specialItems || null,
          ].filter(Boolean);
          // Map button IDs to readable names
          const reqMap: { [key: string]: string } = {
            'fragile': 'Kırılgan',
            'urgent': 'Acil',
            'signature': 'İmzalı Teslimat',
            'temperature': 'Soğuk Zincir',
            'valuable': 'Değerli'
          };
          const mappedButtonReqs = buttonRequirements.map(r => reqMap[r.trim()] || r.trim()).filter(Boolean);
          return [...mappedButtonReqs, ...formRequirements].join(', ');
        })(),
      };

      // Use centralized API service
      const result = await shipmentAPI.create(shipmentData);
      
      clearTimeout(timeoutId);
      setIsLoading(false);
      
      // Verify success
      if (result.success && (result.data?.shipment || result.data?.id)) {
        const shipment = result.data?.shipment || result.data;
        const rawTracking =
          shipment?.trackingNumber ||
          shipment?.tracking_number ||
          shipment?.trackingnumber ||
          shipment?.trackingCode ||
          shipment?.tracking_code ||
          shipment?.trackingcode ||
          shipment?.shipmentCode ||
          shipment?.shipment_code ||
          shipment?.shipmentcode ||
          null;

        const trackingNumber = normalizeTrackingCode(rawTracking, shipment?.id);
        const trackingText = trackingNumber ? `Takip kodunuz: ${trackingNumber}` : '';
        // Professional but warm success feedback
        setSuccessMessage(`Gönderiniz başarıyla yayınlandı. ${trackingText ? trackingText + '. ' : ''}Nakliyecilerden teklifler gelmeye başlayacak. Ortalama bekleme süresi 5-15 dakikadır. 24 saat içinde teklif gelmezse otomatik bildirim alırsınız. Teklifler sayfasına yönlendiriliyorsunuz...`);
        setShowSuccessMessage(true);
        
        // Quick transition - direct to offers for immediate engagement
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/individual/offers');
        }, 2000);
      } else {
        throw new Error(result.message || 'Gönderi oluşturuldu ama bir sorun var - destek ile iletişime geç');
      }
      
      setTimeout(() => {
        // Reset form (only if not redirecting)
        setFormData({
          mainCategory: '',
          productDescription: '',
          weight: '',
          quantity: '',
          dimensions: { length: '', width: '', height: '' },
          specialRequirements: '',
          pickupCity: '',
          pickupDistrict: '',
          pickupAddress: '',
          deliveryCity: '',
          deliveryDistrict: '',
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
    } catch (error) {
      clearTimeout(timeoutId);
      setIsLoading(false);
      let errorMessage = 'Bir sorun oluştu - tekrar dene';
      if ((error as any)?.status === 429) {
        const dataMsg = (error as any)?.data?.message || (error as any)?.message;
        setLimitMessage(dataMsg || 'Günlük limit aşıldı. Lütfen yarın tekrar deneyin.');
        setShowLimitModal(true);
        setErrors(prev => ({ ...prev, publish: '' }));
        return;
      }
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
          errorMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
        }
      }
      
      setErrors({ publish: errorMessage });
      setSuccessMessage('');
      setShowSuccessMessage(false);
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
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
                      aria-label="Yük açıklaması"
                      aria-required="true"
                      aria-invalid={!!errors.productDescription}
                      aria-describedby={errors.productDescription ? 'productDescription-error' : undefined}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none min-h-[100px] ${
                        errors.productDescription ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder={
                        formData.mainCategory === 'special_cargo' 
                          ? 'Özel yükünüzü detaylı olarak tarif edin...'
                          : formData.mainCategory === 'house_move'
                          ? 'Taşınacak eşyalar ve özel durumlar (örn: Buzdolabı, çamaşır makinesi, yatak odası takımı)'
                          : formData.mainCategory === 'furniture_goods'
                          ? 'Mobilya tipleri ve özel durumlar...'
                          : 'Yükünüzü detaylı olarak tarif edin...'
                      }
                    />
                    {errors.productDescription && (
                      <p id="productDescription-error" className="mt-2 text-sm text-red-600" role="alert">{errors.productDescription}</p>
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
                            value={formData.roomCount ?? ''}
                            onChange={(e) => {
                              handleInputChange('roomCount', e.currentTarget.value);
                              if (errors.roomCount) {
                                setErrors(prev => ({ ...prev, roomCount: '' }));
                              }
                            }}
                            onInput={(e) => {
                              handleInputChange('roomCount', (e.currentTarget as HTMLSelectElement).value);
                            }}
                            className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                              errors.roomCount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                            } text-slate-900 caret-slate-900 relative z-10`}
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
                            value={formData.buildingType ?? ''}
                            onChange={(e) => {
                              handleInputChange('buildingType', e.currentTarget.value);
                              if (errors.buildingType) {
                                setErrors(prev => ({ ...prev, buildingType: '' }));
                              }
                            }}
                            onInput={(e) => {
                              handleInputChange('buildingType', (e.currentTarget as HTMLSelectElement).value);
                            }}
                            className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                              errors.buildingType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                            } text-slate-900 caret-slate-900 relative z-10`}
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
                          value={formData.specialItems}
                          onChange={(e) => handleInputChange('specialItems', e.target.value)}
                      rows={3}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md resize-none text-slate-900 caret-slate-900"
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
                        value={formData.furniturePieces ?? ''}
                        onChange={(e) => {
                          handleInputChange('furniturePieces', e.target.value);
                          if (errors.furniturePieces) {
                            setErrors(prev => ({ ...prev, furniturePieces: '' }));
                          }
                        }}
                        onInput={(e) => {
                          handleInputChange('furniturePieces', (e.currentTarget as HTMLInputElement).value);
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
                    
                    if (relevantRequirements.length === 0) return null;

                    // Color mapping for Tailwind classes
                    const getColorClasses = (color: string, isSelected: boolean) => {
                      const colorMap: { [key: string]: { border: string; bg: string; text: string } } = {
                        red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-900' },
                        orange: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-900' },
                        yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-900' },
                        blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-900' },
                        cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-900' },
                        purple: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-900' },
                        indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-900' },
                      };
                      const colors = colorMap[color] || colorMap.blue;
                      return isSelected 
                        ? `${colors.border} ${colors.bg}`
                        : 'border-slate-200 hover:border-slate-300 bg-white';
                    };

                    const getBgColorClass = (color: string, isSelected: boolean) => {
                      const colorMap: { [key: string]: string } = {
                        red: 'bg-red-500',
                        orange: 'bg-orange-500',
                        yellow: 'bg-yellow-500',
                        blue: 'bg-blue-500',
                        cyan: 'bg-cyan-500',
                        purple: 'bg-purple-500',
                        indigo: 'bg-indigo-500',
                      };
                      return isSelected ? (colorMap[color] || 'bg-blue-500') : 'bg-slate-100';
                    };

                    const getTextColorClass = (color: string, isSelected: boolean) => {
                      const colorMap: { [key: string]: string } = {
                        red: 'text-red-900',
                        orange: 'text-orange-900',
                        yellow: 'text-yellow-900',
                        blue: 'text-blue-900',
                        cyan: 'text-cyan-900',
                        purple: 'text-purple-900',
                        indigo: 'text-indigo-900',
                      };
                      return isSelected ? (colorMap[color] || 'text-blue-900') : 'text-slate-700';
                    };

                    return (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Özel Gereksinimler</h3>
                        <div className={`grid grid-cols-2 sm:grid-cols-3 ${relevantRequirements.length > 3 ? 'lg:grid-cols-6' : 'lg:grid-cols-3'} gap-3`}>
                          {relevantRequirements.map((req) => {
                        const IconComponent = req.icon;
                        const currentRequirements = formData.specialRequirements || '';
                        const requirementsList = currentRequirements ? currentRequirements.split(',').filter(r => r.trim()) : [];
                        const isSelected = requirementsList.includes(req.id);
                        
                        return (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => {
                              const current = (formData.specialRequirements || '').split(',').filter(r => r.trim());
                              const isSelectedNow = current.includes(req.id);
                              let newRequirements;
                              if (isSelectedNow) {
                                newRequirements = current.filter(r => r !== req.id);
                              } else {
                                newRequirements = [...current, req.id];
                              }
                              handleInputChange('specialRequirements', newRequirements.join(','));
                            }}
                            className={`p-4 rounded-lg border-2 transition-all duration-300 ${getColorClasses(req.color, isSelected)}`}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${getBgColorClass(req.color, isSelected)}`}>
                                <IconComponent className={`w-4 h-4 ${
                                  isSelected ? 'text-white' : 'text-slate-600'
                                }`} />
                              </div>
                              <span className={`text-xs font-medium ${getTextColorClass(req.color, isSelected)}`}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        İl *
                      </label>
                      <select
                        value={formData.pickupCity ?? ''}
                        onChange={(e) => {
                          handleInputChange('pickupCity', e.target.value);
                          handleInputChange('pickupDistrict', ''); // Reset district when city changes
                          if (errors.pickupCity) {
                            setErrors(prev => ({ ...prev, pickupCity: '' }));
                          }
                        }}
                        onInput={(e) => {
                          const next = (e.currentTarget as HTMLSelectElement).value;
                          handleInputChange('pickupCity', next);
                          handleInputChange('pickupDistrict', '');
                        }}
                        aria-label="Toplama ili"
                        aria-required="true"
                        aria-invalid={!!errors.pickupCity}
                        className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                          errors.pickupCity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      >
                        <option value="">İl seçiniz</option>
                        {turkeyCities.map((city) => (
                          <option key={city.id} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {errors.pickupCity && (
                        <p className="mt-2 text-sm text-red-600" role="alert">{errors.pickupCity}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        İlçe *
                      </label>
                      <select
                        value={formData.pickupDistrict ?? ''}
                        onChange={(e) => {
                          handleInputChange('pickupDistrict', e.target.value);
                          if (errors.pickupDistrict) {
                            setErrors(prev => ({ ...prev, pickupDistrict: '' }));
                          }
                        }}
                        onInput={(e) => {
                          handleInputChange('pickupDistrict', (e.currentTarget as HTMLSelectElement).value);
                        }}
                        disabled={!formData.pickupCity}
                        aria-label="Toplama ilçesi"
                        aria-required="true"
                        aria-invalid={!!errors.pickupDistrict}
                        className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                          !formData.pickupCity ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${
                          errors.pickupDistrict ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      >
                        <option value="">İlçe seçiniz</option>
                        {formData.pickupCity && turkeyCities.find(c => c.name === formData.pickupCity)?.districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      {errors.pickupDistrict && (
                        <p className="mt-2 text-sm text-red-600" role="alert">{errors.pickupDistrict}</p>
                      )}
                    </div>
                  </div>
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
                      aria-label="Toplama adresi"
                      aria-required="true"
                      aria-invalid={!!errors.pickupAddress}
                      aria-describedby={errors.pickupAddress ? 'pickupAddress-error' : undefined}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                        errors.pickupAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Mahalle, sokak, bina no, daire no vb. detaylı adres bilgilerini girin..."
                    />
                    {errors.pickupAddress && (
                      <p id="pickupAddress-error" className="mt-2 text-sm text-red-600" role="alert">{errors.pickupAddress}</p>
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
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      aria-label="Toplama tarihi"
                      aria-required="true"
                      aria-invalid={!!errors.pickupDate}
                      aria-describedby={errors.pickupDate ? 'pickupDate-error' : undefined}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                        errors.pickupDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {errors.pickupDate && (
                      <p id="pickupDate-error" className="mt-2 text-sm text-red-600" role="alert">{errors.pickupDate}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        İl *
                      </label>
                      <select
                        value={formData.deliveryCity ?? ''}
                        onChange={(e) => {
                          handleInputChange('deliveryCity', e.target.value);
                          handleInputChange('deliveryDistrict', ''); // Reset district when city changes
                          if (errors.deliveryCity) {
                            setErrors(prev => ({ ...prev, deliveryCity: '' }));
                          }
                        }}
                        onInput={(e) => {
                          const next = (e.currentTarget as HTMLSelectElement).value;
                          handleInputChange('deliveryCity', next);
                          handleInputChange('deliveryDistrict', '');
                        }}
                        aria-label="Teslimat ili"
                        aria-required="true"
                        aria-invalid={!!errors.deliveryCity}
                        className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                          errors.deliveryCity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">İl seçiniz</option>
                        {turkeyCities.map((city) => (
                          <option key={city.id} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {errors.deliveryCity && (
                        <p className="mt-2 text-sm text-red-600" role="alert">{errors.deliveryCity}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        İlçe *
                      </label>
                      <select
                        value={formData.deliveryDistrict ?? ''}
                        onChange={(e) => {
                          handleInputChange('deliveryDistrict', e.target.value);
                          if (errors.deliveryDistrict) {
                            setErrors(prev => ({ ...prev, deliveryDistrict: '' }));
                          }
                        }}
                        onInput={(e) => {
                          handleInputChange('deliveryDistrict', (e.currentTarget as HTMLSelectElement).value);
                        }}
                        disabled={!formData.deliveryCity}
                        aria-label="Teslimat ilçesi"
                        aria-required="true"
                        aria-invalid={!!errors.deliveryDistrict}
                        className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                          !formData.deliveryCity ? 'bg-gray-100 cursor-not-allowed' : ''
                        } ${
                          errors.deliveryDistrict ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">İlçe seçiniz</option>
                        {formData.deliveryCity && turkeyCities.find(c => c.name === formData.deliveryCity)?.districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      {errors.deliveryDistrict && (
                        <p className="mt-2 text-sm text-red-600" role="alert">{errors.deliveryDistrict}</p>
                      )}
                    </div>
                  </div>
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
                      placeholder="Mahalle, sokak, bina no, daire no vb. detaylı adres bilgilerini girin..."
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
                      min={formData.pickupDate ? new Date(new Date(formData.pickupDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
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
        <title>Yeni Gönderi - YolNext Bireysel</title>
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
            Adım adım gönderi oluşturun ve uygun fiyatlı teklifler alın.
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

        {/* Günlük limit modalı */}
        {showLimitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLimitModal(false)}></div>
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-[fadeIn_200ms_ease]">
              <button
                onClick={() => setShowLimitModal(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Kapat"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Günlük limit doldu</h3>
                  <p className="text-sm text-slate-600">Bireysel kullanıcılar günde en fazla 2 gönderi yayınlayabilir.</p>
                </div>
              </div>
              <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4">
                {limitMessage || 'Bugün için limit doldu. Yarın yeni bir gönderi oluşturabilirsiniz.'}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg shadow hover:shadow-lg transition-all"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
