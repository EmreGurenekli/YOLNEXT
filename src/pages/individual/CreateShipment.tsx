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
import { shipmentAPI } from '../../services/api';
import CreateShipmentStep1 from '../../components/shipment/CreateShipmentStep1';
import CreateShipmentStep2 from '../../components/shipment/CreateShipmentStep2';
import CreateShipmentStep3 from '../../components/shipment/CreateShipmentStep3';
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
      // Debug: Log formData to see what values are actually set (development only)
      if (import.meta.env.DEV) {
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
      }
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
          <CreateShipmentStep1
            formData={formData}
            handleInputChange={handleInputChange}
            handleDimensionsChange={handleDimensionsChange}
            errors={errors}
            setErrors={setErrors}
            mainCategories={mainCategories}
          />
        );

      case 2:
        return (
          <CreateShipmentStep2
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            setErrors={setErrors}
          />
        );

      case 3:
        return (
          <CreateShipmentStep3
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            handleInputChange={handleInputChange}
            handlePublish={handlePublish}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Helmet>
        <title>Gönderi Oluştur - YolNext</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/individual/dashboard' }, { label: 'Gönderi Oluştur', href: '/individual/create-shipment' }]} />
        {renderStepContent()}

        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={handlePrev}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Geri
            </button>
          )}
          {currentStep < steps.length && (
            <button
              onClick={handleNext}
              className={`flex items-center px-6 py-3 rounded-xl text-white transition-colors duration-200 ${
                isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } ml-auto`}
              disabled={isLoading}
            >
              İleri
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
          {currentStep === steps.length && (
            <button
              onClick={handlePublish}
              className={`flex items-center px-6 py-3 rounded-xl text-white transition-colors duration-200 ${
                isLoading ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              } ml-auto`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yayınlanıyor...
                </>
              ) : (
                <>
                  Gönderiyi Yayınla
                  <Send className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {showSuccessMessage && <SuccessMessage message={successMessage} />}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm text-center relative">
            <button onClick={() => setShowLimitModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-3">Limit Aşıldı!</h3>
            <p className="text-gray-600 mb-5">{limitMessage}</p>
            <button onClick={() => setShowLimitModal(false)} className="bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 transition-colors">
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}