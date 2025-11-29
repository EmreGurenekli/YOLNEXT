import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  Truck,
  MapPin,
  Check,
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  Send,
  Weight,
  Ruler,
  Palette,
  Thermometer,
  AlertTriangle,
  Building,
  Cpu,
  Shirt,
  Car,
  Wheat,
  Gem,
  Layers,
  Box,
  Activity,
  Shield,
  Star,
  Calendar,
  Clock,
  User,
  Plus,
  FileText,
  Factory,
  ShoppingCart,
  UtensilsCrossed,
  Hammer,
  Wrench,
  Pill,
  Flame,
  Archive,
  Warehouse,
  Container,
  Snowflake,
  Package2,
  Printer,
  Settings
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import { shipmentAPI } from '../../services/api';

// Kategori tanımlamaları - Her kategori için özel gereksinimler
interface CategoryConfig {
  id: string;
  name: string;
  icon: any;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  specialRequirements: string[];
}

export default function CreateShipment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [nakliyeciler, setNakliyeciler] = useState<any[]>([]);
  const [loadingNakliyeciler, setLoadingNakliyeciler] = useState(false);
  
  const [formData, setFormData] = useState({
    mainCategory: '',
    productDescription: '',
    weight: '',
    quantity: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
    },
    specialRequirements: '',
    pickupAddress: '',
    pickupDistrict: '',
    pickupCity: '',
    deliveryAddress: '',
    deliveryDistrict: '',
    deliveryCity: '',
    pickupDate: '',
    deliveryDate: '',
    publishType: 'all',
    targetNakliyeciId: '', // Belirli nakliyeciye özel gönderi için
    
    // Kategoriye özel alanlar
    // Endüstriyel & Ham Madde
    materialType: '',
    packagingType: '',
    isPalletized: false,
    palletCount: '', // Hem Endüstriyel hem Gıda için kullanılır
    
    // Gıda & İçecek
    requiresColdChain: false,
    temperatureRange: '',
    expiryDate: '',
    hasCertification: false,
    productType: '', // 'food' veya 'beverage'
    boxCount: '', // Koli sayısı
    totalWeight: '', // Toplam ağırlık (kg)
    volume: '', // Hacim (litre) - içecekler için
    
    // Kimyasal & Tehlikeli
    hazardClass: '',
    hasMSDS: false,
    requiresSpecialPermit: false,
    
    // Soğutmalı
    coldChainRequired: false,
    temperature: '',
    
    // Büyük Boy & Makine
    requiresCrane: false,
    requiresSpecialVehicle: false,
    isFragile: false,
    
    // Depo Transferi
    warehouseType: '',
    isBulkTransfer: false,
    
    // Dökme Yük
    bulkType: '',
    requiresCover: false,
    
    // Elektronik & Teknoloji
    isOriginalPackaging: false,
    requiresAntiStatic: false,
    
    // İnşaat Malzemesi
    materialQuantity: '',
    requiresWeatherProtection: false,
    
    // Ofis Ekipmanı
    equipmentType: '',
    requiresAssembly: false,
    
    // Tıbbi & İlaç
    requiresPharmaLicense: false,
    temperatureControlled: false,
  });

  const steps = [
    { id: 1, title: 'Yük Bilgileri', icon: <Package size={20} /> },
    { id: 2, title: 'Adres Bilgileri', icon: <MapPin size={20} /> },
    { id: 3, title: 'Yayınla & Önizleme', icon: <Send size={20} /> },
  ];

  // Kapsamlı Kurumsal Kategoriler
  const mainCategories: CategoryConfig[] = [
    {
      id: 'raw_materials',
      name: 'Ham Madde & Endüstriyel Mal',
      icon: Factory,
      description: 'Üretim için ham madde, endüstriyel malzemeler',
      requiredFields: ['materialType', 'weight', 'quantity', 'isPalletized'],
      optionalFields: ['palletCount', 'packagingType'],
      specialRequirements: ['fragile', 'urgent', 'signature']
    },
    {
      id: 'retail_consumer',
      name: 'Perakende & Tüketim Malı',
      icon: ShoppingCart,
      description: 'Mağaza, perakende satış ürünleri',
      requiredFields: ['weight', 'quantity', 'dimensions'],
      optionalFields: ['packagingType'],
      specialRequirements: ['fragile', 'valuable', 'signature']
    },
    {
      id: 'electronics_tech',
      name: 'Elektronik & Teknoloji',
      icon: Cpu,
      description: 'Elektronik cihazlar, teknoloji ürünleri',
      requiredFields: ['weight', 'dimensions', 'isOriginalPackaging'],
      optionalFields: ['requiresAntiStatic'],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'textile_apparel',
      name: 'Tekstil & Giyim',
      icon: Shirt,
      description: 'Tekstil ürünleri, giyim eşyaları',
      requiredFields: ['weight', 'quantity'],
      optionalFields: ['packagingType'],
      specialRequirements: ['signature']
    },
    {
      id: 'food_beverage',
      name: 'Gıda & İçecek',
      icon: UtensilsCrossed,
      description: 'Gıda ürünleri, içecekler, restoran malzemeleri',
      requiredFields: ['productType', 'boxCount', 'totalWeight', 'requiresColdChain'],
      optionalFields: ['palletCount', 'volume', 'expiryDate', 'hasCertification', 'temperatureRange'],
      specialRequirements: ['temperature', 'urgent', 'signature']
    },
    {
      id: 'furniture_home',
      name: 'Mobilya & Ev Eşyası',
      icon: Box,
      description: 'Mobilya, ev eşyaları, dekorasyon',
      requiredFields: ['weight', 'dimensions', 'quantity'],
      optionalFields: ['requiresAssembly'],
      specialRequirements: ['fragile', 'requiresSpecialVehicle']
    },
    {
      id: 'construction_materials',
      name: 'İnşaat Malzemeleri',
      icon: Hammer,
      description: 'İnşaat malzemeleri, yapı malzemeleri',
      requiredFields: ['weight', 'materialQuantity', 'quantity'],
      optionalFields: ['requiresWeatherProtection', 'requiresSpecialVehicle'],
      specialRequirements: ['requiresCrane', 'urgent']
    },
    {
      id: 'automotive_parts',
      name: 'Otomotiv Parçaları',
      icon: Car,
      description: 'Araç parçaları, yedek parça, aksesuar',
      requiredFields: ['weight', 'quantity'],
      optionalFields: ['packagingType'],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'medical_pharma',
      name: 'Medikal & İlaç',
      icon: Pill,
      description: 'Tıbbi malzemeler, ilaçlar, sağlık ürünleri',
      requiredFields: ['weight', 'quantity', 'temperatureControlled', 'requiresPharmaLicense'],
      optionalFields: ['temperatureRange'],
      specialRequirements: ['temperature', 'urgent']
    },
    {
      id: 'chemical_hazardous',
      name: 'Kimyasal & Tehlikeli Madde',
      icon: Flame,
      description: 'Kimyasal maddeler, tehlikeli yükler',
      requiredFields: ['weight', 'hazardClass', 'hasMSDS', 'requiresSpecialPermit'],
      optionalFields: ['quantity'],
      specialRequirements: ['urgent']
    },
    {
      id: 'documents_mail',
      name: 'Doküman & Önemli Kargo',
      icon: Archive,
      description: 'Önemli evraklar, belgeler, resmi kargo',
      requiredFields: ['weight', 'quantity'],
      optionalFields: [],
      specialRequirements: ['urgent', 'signature']
    },
    {
      id: 'warehouse_transfer',
      name: 'Depo Transferi',
      icon: Warehouse,
      description: 'Depo arası transfer, stok taşıma',
      requiredFields: ['weight', 'quantity', 'warehouseType', 'isBulkTransfer'],
      optionalFields: ['palletCount'],
      specialRequirements: ['urgent']
    },
    {
      id: 'bulk_cargo',
      name: 'Dökme Yük',
      icon: Container,
      description: 'Büyük miktarda dökme yük, toplu taşıma',
      requiredFields: ['weight', 'bulkType', 'quantity'],
      optionalFields: ['requiresCover'],
      specialRequirements: []
    },
    {
      id: 'refrigerated',
      name: 'Soğutmalı Yük',
      icon: Snowflake,
      description: 'Soğuk zincir gerektiren ürünler',
      requiredFields: ['weight', 'quantity', 'coldChainRequired', 'temperature'],
      optionalFields: ['temperatureRange'],
      specialRequirements: ['temperature', 'urgent']
    },
    {
      id: 'oversized',
      name: 'Büyük Boy Yük',
      icon: Package2,
      description: 'Büyük ebatlı yükler, makineler',
      requiredFields: ['weight', 'dimensions', 'requiresCrane', 'requiresSpecialVehicle'],
      optionalFields: ['isFragile'],
      specialRequirements: ['requiresCrane', 'requiresSpecialVehicle']
    },
    {
      id: 'office_equipment',
      name: 'Ofis Ekipmanı',
      icon: Printer,
      description: 'Ofis mobilyası, ekipman, bilgisayar',
      requiredFields: ['weight', 'dimensions', 'equipmentType', 'quantity'],
      optionalFields: ['requiresAssembly'],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'machinery_equipment',
      name: 'Makine & Ekipman',
      icon: Settings,
      description: 'Endüstriyel makineler, ağır ekipman',
      requiredFields: ['weight', 'dimensions', 'requiresCrane', 'requiresSpecialVehicle'],
      optionalFields: ['isFragile'],
      specialRequirements: ['requiresCrane', 'requiresSpecialVehicle']
    },
    {
      id: 'display_exhibition',
      name: 'Vitrin & Sergi Malzemesi',
      icon: Star,
      description: 'Fuarlar, sergiler, vitrin malzemeleri',
      requiredFields: ['weight', 'dimensions', 'quantity'],
      optionalFields: ['requiresAssembly'],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'other',
      name: 'Diğer',
      icon: Package,
      description: 'Diğer kurumsal yükler',
      requiredFields: ['weight', 'quantity'],
      optionalFields: ['dimensions'],
      specialRequirements: []
    }
  ];

  const getCurrentCategory = () => {
    return mainCategories.find(cat => cat.id === formData.mainCategory);
  };

  // Load nakliyeciler (favori nakliyeciler) when component mounts or when publishType changes to 'specific'
  useEffect(() => {
    const loadNakliyeciler = async () => {
      if (formData.publishType === 'specific') {
        setLoadingNakliyeciler(true);
        try {
          const storedUser = localStorage.getItem('user');
          const userId = storedUser ? (JSON.parse(storedUser)?.id || '') : '';
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          
          // Get favori nakliyeciler from corporate carriers endpoint
          const response = await fetch(`${baseURL}/api/carriers/corporate`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json',
              'X-User-Id': userId
            }
          });

          if (response.ok) {
            const data = await response.json();
            setNakliyeciler(data.carriers || data.data || []);
          } else {
            console.log('Favori nakliyeciler yüklenemedi');
            setNakliyeciler([]);
          }
        } catch (error) {
          console.error('Error loading nakliyeciler:', error);
          setNakliyeciler([]);
        } finally {
          setLoadingNakliyeciler(false);
        }
      }
    };

    loadNakliyeciler();
  }, [formData.publishType]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDimensionsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: value,
      },
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    const currentCategory = getCurrentCategory();

    if (step === 1) {
      if (!formData.mainCategory) {
        newErrors.mainCategory = 'Kategori seçimi zorunludur';
      }
      if (!formData.productDescription || formData.productDescription.trim() === '') {
        newErrors.productDescription = 'Yük açıklaması zorunludur';
      }

      if (currentCategory) {
        // Kategoriye özel validasyon
        currentCategory.requiredFields.forEach(field => {
          if (field === 'weight' && (!formData.weight || formData.weight.trim() === '')) {
            newErrors.weight = 'Ağırlık zorunludur';
          }
          if (field === 'quantity' && (!formData.quantity || formData.quantity.trim() === '')) {
            newErrors.quantity = 'Miktar zorunludur';
          }
          if (field === 'dimensions') {
            if (!formData.dimensions.length || !formData.dimensions.width || !formData.dimensions.height) {
              newErrors.dimensions = 'Boyutlar zorunludur';
            }
          }
          if (field === 'materialType' && !formData.materialType) {
            newErrors.materialType = 'Malzeme tipi zorunludur';
          }
          if (field === 'hazardClass' && !formData.hazardClass) {
            newErrors.hazardClass = 'Tehlike sınıfı zorunludur';
          }
          if (field === 'temperature' && !formData.temperature) {
            newErrors.temperature = 'Sıcaklık bilgisi zorunludur';
          }
          if (field === 'temperatureRange' && formData.requiresColdChain && !formData.temperatureRange) {
            newErrors.temperatureRange = 'Soğuk zincir seçildiğinde sıcaklık aralığı zorunludur';
          }
          // Gıda & İçecek özel validasyonlar
          if (field === 'productType' && !formData.productType) {
            newErrors.productType = 'Ürün tipi zorunludur';
          }
          if (field === 'boxCount' && (!formData.boxCount || formData.boxCount.trim() === '')) {
            newErrors.boxCount = 'Koli sayısı zorunludur';
          }
          if (field === 'totalWeight' && formData.productType === 'food' && (!formData.totalWeight || formData.totalWeight.trim() === '')) {
            newErrors.totalWeight = 'Toplam ağırlık (kg) zorunludur';
          }
          if (field === 'volume' && formData.productType === 'beverage' && (!formData.volume || formData.volume.trim() === '')) {
            newErrors.volume = 'Toplam hacim (litre) zorunludur';
          }
        });
      }
    } else if (step === 2) {
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
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);

    try {
      const currentCategory = getCurrentCategory();
      
      // Prepare shipment data
      // Parse city from address if not provided separately
      const parseCityFromAddress = (address: string): { city: string; district: string } => {
        if (!address) return { city: 'İstanbul', district: '' };
        
        // If city is already provided in formData, use it
        // Otherwise try to parse from address string
        const parts = address.split(',').map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 2) {
          return { city: parts[0], district: parts[1] || '' };
        } else if (parts.length === 1) {
          return { city: parts[0], district: '' };
        }
        
        return { city: 'İstanbul', district: '' };
      };

      const pickupLocation = formData.pickupCity 
        ? { city: formData.pickupCity, district: formData.pickupDistrict || '' }
        : parseCityFromAddress(formData.pickupAddress);
      
      const deliveryLocation = formData.deliveryCity
        ? { city: formData.deliveryCity, district: formData.deliveryDistrict || '' }
        : parseCityFromAddress(formData.deliveryAddress);

      const shipmentData = {
        title: currentCategory?.name || 'Kurumsal Gönderi',
        description: formData.productDescription || '',
        category: formData.mainCategory,
        pickupCity: pickupLocation.city,
        pickupDistrict: pickupLocation.district,
        pickupAddress: formData.pickupAddress,
        pickupDate: formData.pickupDate,
        deliveryCity: deliveryLocation.city,
        deliveryDistrict: deliveryLocation.district,
        deliveryAddress: formData.deliveryAddress,
        deliveryDate: formData.deliveryDate,
        // Gıda & İçecek için özel hesaplama
        weight: formData.mainCategory === 'food_beverage' 
          ? (formData.productType === 'food' ? parseFloat(formData.totalWeight) || 0 : 0)
          : (parseFloat(formData.weight) || 0),
        quantity: formData.mainCategory === 'food_beverage'
          ? parseInt(formData.boxCount) || 0
          : (parseInt(formData.quantity) || 1),
        dimensions: formData.dimensions.length && formData.dimensions.width && formData.dimensions.height
          ? `${formData.dimensions.length}x${formData.dimensions.width}x${formData.dimensions.height}`
          : '',
        specialRequirements: formData.specialRequirements || '',
        price: 0,
        publishType: formData.publishType,
        targetNakliyeciId: formData.publishType === 'specific' ? formData.targetNakliyeciId : null,
        
        // Kategoriye özel veriler
        categoryData: {
          materialType: formData.materialType,
          isPalletized: formData.isPalletized,
          palletCount: formData.palletCount,
          requiresColdChain: formData.requiresColdChain,
          temperatureRange: formData.temperatureRange,
          coldChainRequired: formData.coldChainRequired,
          temperature: formData.temperature,
          hazardClass: formData.hazardClass,
          hasMSDS: formData.hasMSDS,
          // Gıda & İçecek özel alanlar
          productType: formData.productType,
          boxCount: formData.boxCount,
          totalWeight: formData.totalWeight,
          volume: formData.volume,
          expiryDate: formData.expiryDate,
          hasCertification: formData.hasCertification,
          requiresSpecialPermit: formData.requiresSpecialPermit,
          requiresCrane: formData.requiresCrane,
          requiresSpecialVehicle: formData.requiresSpecialVehicle,
          warehouseType: formData.warehouseType,
          bulkType: formData.bulkType,
          isOriginalPackaging: formData.isOriginalPackaging,
          requiresPharmaLicense: formData.requiresPharmaLicense,
          temperatureControlled: formData.temperatureControlled,
        }
      };

      let response;
      try {
        response = await shipmentAPI.create(shipmentData);
      } catch (networkError: any) {
        // Network error (backend not running, CORS, etc.)
        setIsLoading(false);
        setErrorMessage(`Backend sunucusuna bağlanılamıyor: ${networkError.message}. Lütfen backend'in çalıştığından emin olun (cd backend && node postgres-backend.js)`);
        setErrors({ publish: networkError.message || 'Backend sunucusuna bağlanılamıyor' });
        return;
      }

      if (response.data?.success || response.success) {
        setSuccessMessage(
          'Gönderiniz başarıyla yayınlandı! Nakliyecilerden teklifler almaya başlayacaksınız.'
        );
        setShowSuccessMessage(true);

        // Reset form
        setFormData({
          mainCategory: '',
          productDescription: '',
          weight: '',
          quantity: '',
          dimensions: { length: '', width: '', height: '' },
          specialRequirements: '',
          pickupAddress: '',
          pickupDistrict: '',
          pickupCity: '',
          deliveryAddress: '',
          deliveryDistrict: '',
          deliveryCity: '',
          pickupDate: '',
          deliveryDate: '',
          publishType: 'all',
          targetNakliyeciId: '',
          // Kategoriye özel alanlar
          materialType: '',
          packagingType: '',
          isPalletized: false,
          palletCount: '',
          requiresColdChain: false,
          temperatureRange: '',
          expiryDate: '',
          hasCertification: false,
          productType: '',
          boxCount: '',
          totalWeight: '',
          volume: '',
          hazardClass: '',
          hasMSDS: false,
          requiresSpecialPermit: false,
          coldChainRequired: false,
          temperature: '',
          requiresCrane: false,
          requiresSpecialVehicle: false,
          isFragile: false,
          warehouseType: '',
          isBulkTransfer: false,
          bulkType: '',
          requiresCover: false,
          isOriginalPackaging: false,
          requiresAntiStatic: false,
          materialQuantity: '',
          requiresWeatherProtection: false,
          equipmentType: '',
          requiresAssembly: false,
          requiresPharmaLicense: false,
          temperatureControlled: false,
        });
        setCurrentStep(1);
        setErrors({});

        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Gönderi oluşturma hatası:', error);
      setErrorMessage(
        'Gönderi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategorySpecificFields = () => {
    const currentCategory = getCurrentCategory();
    if (!currentCategory) return null;

    const fields: JSX.Element[] = [];

    // Endüstriyel & Ham Madde
    if (currentCategory.id === 'raw_materials') {
      fields.push(
        <div key="materialType" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Factory className="w-4 h-4 inline mr-2" />
            Malzeme Tipi *
          </label>
          <select
            value={formData.materialType}
            onChange={(e) => handleInputChange('materialType', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.materialType ? 'border-red-500' : 'border-slate-200'
            }`}
          >
            <option value="">Malzeme tipi seçiniz</option>
            <option value="metal">Metal</option>
            <option value="plastic">Plastik</option>
            <option value="wood">Ahşap</option>
            <option value="chemical">Kimyasal</option>
            <option value="textile">Tekstil</option>
            <option value="other">Diğer</option>
          </select>
          {errors.materialType && (
            <p className="mt-1 text-sm text-red-600">{errors.materialType}</p>
          )}
        </div>
      );

      fields.push(
        <div key="isPalletized" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPalletized"
            checked={formData.isPalletized}
            onChange={(e) => handleInputChange('isPalletized', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPalletized" className="text-sm font-medium text-slate-700">
            Paletlenmiş
          </label>
        </div>
      );

      if (formData.isPalletized) {
        fields.push(
          <div key="palletCount" className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Palet Sayısı
            </label>
            <input
              type="number"
              value={formData.palletCount}
              onChange={(e) => handleInputChange('palletCount', e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              placeholder="Örn: 10"
            />
          </div>
        );
      }
    }

    // Gıda & İçecek
    if (currentCategory.id === 'food_beverage') {
      // Ürün Tipi
      fields.push(
        <div key="productType" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <UtensilsCrossed className="w-4 h-4 inline mr-2" />
            Ürün Tipi *
          </label>
          <select
            value={formData.productType}
            onChange={(e) => handleInputChange('productType', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.productType ? 'border-red-500' : 'border-slate-200'
            }`}
          >
            <option value="">Ürün tipi seçiniz</option>
            <option value="food">Gıda Ürünü</option>
            <option value="beverage">İçecek</option>
          </select>
          {errors.productType && (
            <p className="mt-1 text-sm text-red-600">{errors.productType}</p>
          )}
        </div>
      );

      // Koli Sayısı
      fields.push(
        <div key="boxCount" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Package className="w-4 h-4 inline mr-2" />
            Koli Sayısı *
          </label>
          <input
            type="number"
            min="1"
            value={formData.boxCount}
            onChange={(e) => handleInputChange('boxCount', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.boxCount ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Örn: 50"
          />
          {errors.boxCount && (
            <p className="mt-1 text-sm text-red-600">{errors.boxCount}</p>
          )}
        </div>
      );

      // Palet Sayısı (opsiyonel)
      fields.push(
        <div key="palletCount" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Palette className="w-4 h-4 inline mr-2" />
            Palet Sayısı
          </label>
          <input
            type="number"
            min="0"
            value={formData.palletCount}
            onChange={(e) => handleInputChange('palletCount', e.target.value)}
            className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            placeholder="Örn: 5 (opsiyonel)"
          />
        </div>
      );

      // Toplam Ağırlık (kg) - Gıda için
      if (formData.productType === 'food') {
        fields.push(
          <div key="totalWeight" className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Weight className="w-4 h-4 inline mr-2" />
              Toplam Ağırlık (kg) *
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.totalWeight}
              onChange={(e) => handleInputChange('totalWeight', e.target.value)}
              className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                errors.totalWeight ? 'border-red-500' : 'border-slate-200'
              }`}
              placeholder="Örn: 250.5"
            />
            {errors.totalWeight && (
              <p className="mt-1 text-sm text-red-600">{errors.totalWeight}</p>
            )}
          </div>
        );
      }

      // Hacim (litre) - İçecek için
      if (formData.productType === 'beverage') {
        fields.push(
          <div key="volume" className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Toplam Hacim (litre) *
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.volume}
              onChange={(e) => handleInputChange('volume', e.target.value)}
              className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                errors.volume ? 'border-red-500' : 'border-slate-200'
              }`}
              placeholder="Örn: 500"
            />
            {errors.volume && (
              <p className="mt-1 text-sm text-red-600">{errors.volume}</p>
            )}
          </div>
        );
      }

      // Soğuk Zincir
      fields.push(
        <div key="requiresColdChain" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresColdChain"
            checked={formData.requiresColdChain}
            onChange={(e) => handleInputChange('requiresColdChain', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresColdChain" className="text-sm font-medium text-slate-700">
            Soğuk Zincir Gerekli *
          </label>
        </div>
      );

      if (formData.requiresColdChain) {
        fields.push(
          <div key="temperatureRange" className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Thermometer className="w-4 h-4 inline mr-2" />
              Sıcaklık Aralığı (℃)
            </label>
            <input
              type="text"
              value={formData.temperatureRange}
              onChange={(e) => handleInputChange('temperatureRange', e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              placeholder="Örn: 2-8°C veya -18°C"
            />
          </div>
        );
      }

      // Sertifika
      fields.push(
        <div key="hasCertification" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="hasCertification"
            checked={formData.hasCertification}
            onChange={(e) => handleInputChange('hasCertification', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="hasCertification" className="text-sm font-medium text-slate-700">
            Sertifikalı Ürün (Helal, Organik vb.)
          </label>
        </div>
      );
    }

    // Kimyasal & Tehlikeli
    if (currentCategory.id === 'chemical_hazardous') {
      fields.push(
        <div key="hazardClass" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Flame className="w-4 h-4 inline mr-2" />
            Tehlike Sınıfı *
          </label>
          <select
            value={formData.hazardClass}
            onChange={(e) => handleInputChange('hazardClass', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.hazardClass ? 'border-red-500' : 'border-slate-200'
            }`}
          >
            <option value="">Tehlike sınıfı seçiniz</option>
            <option value="class1">Sınıf 1 - Patlayıcılar</option>
            <option value="class2">Sınıf 2 - Gazlar</option>
            <option value="class3">Sınıf 3 - Alevlenir Sıvılar</option>
            <option value="class4">Sınıf 4 - Alevlenir Katılar</option>
            <option value="class5">Sınıf 5 - Oksitleyici</option>
            <option value="class6">Sınıf 6 - Zehirli</option>
            <option value="class7">Sınıf 7 - Radyoaktif</option>
            <option value="class8">Sınıf 8 - Aşındırıcı</option>
            <option value="class9">Sınıf 9 - Diğer Tehlikeli</option>
          </select>
          {errors.hazardClass && (
            <p className="mt-1 text-sm text-red-600">{errors.hazardClass}</p>
          )}
        </div>
      );

      fields.push(
        <div key="hasMSDS" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="hasMSDS"
            checked={formData.hasMSDS}
            onChange={(e) => handleInputChange('hasMSDS', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="hasMSDS" className="text-sm font-medium text-slate-700">
            MSDS (Güvenlik Bilgi Formu) Mevcut *
          </label>
        </div>
      );

      fields.push(
        <div key="requiresSpecialPermit" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresSpecialPermit"
            checked={formData.requiresSpecialPermit}
            onChange={(e) => handleInputChange('requiresSpecialPermit', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresSpecialPermit" className="text-sm font-medium text-slate-700">
            Özel İzin Gerekli *
          </label>
        </div>
      );
    }

    // Soğutmalı Yük
    if (currentCategory.id === 'refrigerated') {
      fields.push(
        <div key="coldChainRequired" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="coldChainRequired"
            checked={formData.coldChainRequired}
            onChange={(e) => handleInputChange('coldChainRequired', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="coldChainRequired" className="text-sm font-medium text-slate-700">
            Soğuk Zincir Gerekli *
          </label>
        </div>
      );

      fields.push(
        <div key="temperature" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Snowflake className="w-4 h-4 inline mr-2" />
            Sıcaklık (℃) *
          </label>
          <input
            type="text"
            value={formData.temperature}
            onChange={(e) => handleInputChange('temperature', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.temperature ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Örn: -18, 2-8, 0-4"
          />
          {errors.temperature && (
            <p className="mt-1 text-sm text-red-600">{errors.temperature}</p>
          )}
        </div>
      );
    }

    // Büyük Boy & Makine
    if (currentCategory.id === 'oversized' || currentCategory.id === 'machinery_equipment') {
      fields.push(
        <div key="requiresCrane" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresCrane"
            checked={formData.requiresCrane}
            onChange={(e) => handleInputChange('requiresCrane', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresCrane" className="text-sm font-medium text-slate-700">
            Vinç Gerekli *
          </label>
        </div>
      );

      fields.push(
        <div key="requiresSpecialVehicle" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresSpecialVehicle"
            checked={formData.requiresSpecialVehicle}
            onChange={(e) => handleInputChange('requiresSpecialVehicle', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresSpecialVehicle" className="text-sm font-medium text-slate-700">
            Özel Araç Gerekli (Düşük Tavanlı, Özel Platform vb.) *
          </label>
        </div>
      );

    }

    // Elektronik & Teknoloji
    if (currentCategory.id === 'electronics_tech') {
      fields.push(
        <div key="isOriginalPackaging" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isOriginalPackaging"
            checked={formData.isOriginalPackaging}
            onChange={(e) => handleInputChange('isOriginalPackaging', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isOriginalPackaging" className="text-sm font-medium text-slate-700">
            Orijinal Ambalajında *
          </label>
        </div>
      );

      fields.push(
        <div key="requiresAntiStatic" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresAntiStatic"
            checked={formData.requiresAntiStatic}
            onChange={(e) => handleInputChange('requiresAntiStatic', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresAntiStatic" className="text-sm font-medium text-slate-700">
            Anti-Statik Paketleme Gerekli
          </label>
        </div>
      );
    }

    // Depo Transferi
    if (currentCategory.id === 'warehouse_transfer') {
      fields.push(
        <div key="warehouseType" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Warehouse className="w-4 h-4 inline mr-2" />
            Depo Tipi *
          </label>
          <select
            value={formData.warehouseType}
            onChange={(e) => handleInputChange('warehouseType', e.target.value)}
            className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
          >
            <option value="">Depo tipi seçiniz</option>
            <option value="standard">Standart Depo</option>
            <option value="cold_storage">Soğuk Hava Deposu</option>
            <option value="hazardous">Tehlikeli Madde Deposu</option>
            <option value="bonded">Gümrük Deposu</option>
          </select>
        </div>
      );

      fields.push(
        <div key="isBulkTransfer" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isBulkTransfer"
            checked={formData.isBulkTransfer}
            onChange={(e) => handleInputChange('isBulkTransfer', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isBulkTransfer" className="text-sm font-medium text-slate-700">
            Toplu Transfer *
          </label>
        </div>
      );
    }

    // Dökme Yük
    if (currentCategory.id === 'bulk_cargo') {
      fields.push(
        <div key="bulkType" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Container className="w-4 h-4 inline mr-2" />
            Dökme Yük Tipi *
          </label>
          <select
            value={formData.bulkType}
            onChange={(e) => handleInputChange('bulkType', e.target.value)}
            className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
          >
            <option value="">Dökme yük tipi seçiniz</option>
            <option value="grain">Tahıl</option>
            <option value="mineral">Mineral</option>
            <option value="chemical">Kimyasal</option>
            <option value="construction">İnşaat Malzemesi</option>
            <option value="other">Diğer</option>
          </select>
        </div>
      );

      fields.push(
        <div key="requiresCover" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresCover"
            checked={formData.requiresCover}
            onChange={(e) => handleInputChange('requiresCover', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresCover" className="text-sm font-medium text-slate-700">
            Örtü/Konteyner Gerekli
          </label>
        </div>
      );
    }

    // Medikal & İlaç
    if (currentCategory.id === 'medical_pharma') {
      fields.push(
        <div key="requiresPharmaLicense" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresPharmaLicense"
            checked={formData.requiresPharmaLicense}
            onChange={(e) => handleInputChange('requiresPharmaLicense', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresPharmaLicense" className="text-sm font-medium text-slate-700">
            İlaç Lisansı Gerekli (Nakliyeci için) *
          </label>
        </div>
      );

      fields.push(
        <div key="temperatureControlled" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="temperatureControlled"
            checked={formData.temperatureControlled}
            onChange={(e) => handleInputChange('temperatureControlled', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="temperatureControlled" className="text-sm font-medium text-slate-700">
            Sıcaklık Kontrollü Taşıma Gerekli *
          </label>
        </div>
      );
    }

    // İnşaat Malzemesi
    if (currentCategory.id === 'construction_materials') {
      fields.push(
        <div key="materialQuantity" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Hammer className="w-4 h-4 inline mr-2" />
            Malzeme Miktarı *
          </label>
          <input
            type="text"
            value={formData.materialQuantity}
            onChange={(e) => handleInputChange('materialQuantity', e.target.value)}
            className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            placeholder="Örn: 10 ton çimento, 50 m² fayans"
          />
        </div>
      );

      fields.push(
        <div key="requiresWeatherProtection" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresWeatherProtection"
            checked={formData.requiresWeatherProtection}
            onChange={(e) => handleInputChange('requiresWeatherProtection', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresWeatherProtection" className="text-sm font-medium text-slate-700">
            Hava Koşullarından Koruma Gerekli
          </label>
        </div>
      );
    }

    // Ofis Ekipmanı
    if (currentCategory.id === 'office_equipment') {
      fields.push(
        <div key="equipmentType" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Printer className="w-4 h-4 inline mr-2" />
            Ekipman Tipi *
          </label>
          <select
            value={formData.equipmentType}
            onChange={(e) => handleInputChange('equipmentType', e.target.value)}
            className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
          >
            <option value="">Ekipman tipi seçiniz</option>
            <option value="furniture">Mobilya</option>
            <option value="computer">Bilgisayar</option>
            <option value="printer">Yazıcı</option>
            <option value="server">Sunucu</option>
            <option value="other">Diğer</option>
          </select>
        </div>
      );

      fields.push(
        <div key="requiresAssembly" className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="requiresAssembly"
            checked={formData.requiresAssembly}
            onChange={(e) => handleInputChange('requiresAssembly', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="requiresAssembly" className="text-sm font-medium text-slate-700">
            Montaj Gerekli
          </label>
        </div>
      );
    }

    return fields.length > 0 ? (
      <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">
          Kategoriye Özel Bilgiler
        </h4>
        {fields}
      </div>
    ) : null;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className='space-y-6'>
            <div>
              <label className='block text-lg font-semibold text-slate-900 mb-4'>
                <Package className='w-5 h-5 inline mr-2' />
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
                <option value=''>Kategori seçiniz</option>
                {mainCategories.map(category => {
                  const IconComponent = category.icon;
                  return (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                  );
                })}
              </select>
              {errors.mainCategory && (
                <p className="mt-2 text-sm text-red-600">{errors.mainCategory}</p>
              )}
              {formData.mainCategory && getCurrentCategory() && (
                <p className="mt-2 text-sm text-slate-600">
                  {getCurrentCategory()?.description}
                </p>
              )}
            </div>

            {formData.mainCategory && (
              <div className='space-y-6'>
                <div className='bg-gray-50 rounded-xl p-6 space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-3'>
                      <FileText className='w-4 h-4 inline mr-2' />
                      Yük Açıklaması *
                    </label>
                    <textarea
                      value={formData.productDescription}
                      onChange={(e) => {
                        handleInputChange('productDescription', e.target.value);
                        if (errors.productDescription) {
                          setErrors(prev => ({ ...prev, productDescription: '' }));
                        }
                      }}
                      rows={3}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                        errors.productDescription ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder='Yükünüzü detaylı olarak tarif edin...'
                    />
                    {errors.productDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.productDescription}</p>
                    )}
                  </div>

                  {/* Genel ağırlık ve miktar alanları - Gıda & İçecek hariç */}
                  {formData.mainCategory !== 'food_beverage' && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {getCurrentCategory()?.requiredFields.includes('weight') && (
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        <Weight className='w-4 h-4 inline mr-2' />
                          Ağırlık (ton) *
                      </label>
                      <input
                        type='number'
                          step="0.01"
                        value={formData.weight}
                          onChange={(e) => {
                            handleInputChange('weight', e.target.value);
                            if (errors.weight) {
                              setErrors(prev => ({ ...prev, weight: '' }));
                            }
                          }}
                          className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                            errors.weight ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder='2.5'
                      />
                        {errors.weight && (
                          <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
                        )}
                    </div>
                    )}
                    {getCurrentCategory()?.requiredFields.includes('quantity') && (
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        <Package className='w-4 h-4 inline mr-2' />
                        Miktar *
                      </label>
                      <input
                        type='number'
                        value={formData.quantity}
                          onChange={(e) => {
                            handleInputChange('quantity', e.target.value);
                            if (errors.quantity) {
                              setErrors(prev => ({ ...prev, quantity: '' }));
                            }
                          }}
                          className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                            errors.quantity ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder='1'
                      />
                        {errors.quantity && (
                          <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                        )}
                    </div>
                    )}
                  </div>
                  )}

                  {getCurrentCategory()?.requiredFields.includes('dimensions') && (
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-4'>
                      <Ruler className='w-4 h-4 inline mr-2' />
                        Boyutlar (cm) *
                        {errors.dimensions && (
                          <span className="ml-2 text-red-600 text-xs">({errors.dimensions})</span>
                        )}
                    </label>
                    <div className='grid grid-cols-3 gap-4'>
                      <div className='space-y-2'>
                        <label className='block text-xs font-medium text-gray-500 mb-1'>
                          Uzunluk
                        </label>
                        <input
                          type='number'
                          value={formData.dimensions.length}
                            onChange={(e) => {
                              handleDimensionsChange('length', e.target.value);
                              if (errors.dimensions) {
                                setErrors(prev => ({ ...prev, dimensions: '' }));
                              }
                            }}
                          className='w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md'
                          placeholder='30'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='block text-xs font-medium text-gray-500 mb-1'>
                          Genişlik
                        </label>
                        <input
                          type='number'
                          value={formData.dimensions.width}
                            onChange={(e) => {
                              handleDimensionsChange('width', e.target.value);
                              if (errors.dimensions) {
                                setErrors(prev => ({ ...prev, dimensions: '' }));
                              }
                            }}
                          className='w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md'
                          placeholder='20'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='block text-xs font-medium text-gray-500 mb-1'>
                          Yükseklik
                        </label>
                        <input
                          type='number'
                          value={formData.dimensions.height}
                            onChange={(e) => {
                              handleDimensionsChange('height', e.target.value);
                              if (errors.dimensions) {
                                setErrors(prev => ({ ...prev, dimensions: '' }));
                              }
                            }}
                          className='w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md'
                          placeholder='15'
                        />
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Kategoriye özel alanlar */}
                  {renderCategorySpecificFields()}

                  {/* Özel Gereksinimler */}
                  {getCurrentCategory() && getCurrentCategory()!.specialRequirements.length > 0 && (
                    <div className='space-y-4 mt-6'>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Özel Gereksinimler
                    </h3>
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
                      {[
                          ...(getCurrentCategory()!.specialRequirements.includes('fragile') ? [{
                          id: 'fragile',
                          name: 'Kırılgan',
                          icon: AlertTriangle,
                          color: 'red',
                          }] : []),
                          ...(getCurrentCategory()!.specialRequirements.includes('urgent') ? [{
                          id: 'urgent',
                          name: 'Acil',
                          icon: Clock,
                          color: 'orange',
                          }] : []),
                          ...(getCurrentCategory()!.specialRequirements.includes('signature') ? [{
                          id: 'signature',
                          name: 'İmzalı Teslimat',
                          icon: Check,
                          color: 'blue',
                          }] : []),
                          ...(getCurrentCategory()!.specialRequirements.includes('temperature') ? [{
                          id: 'temperature',
                          name: 'Soğuk Zincir',
                          icon: Thermometer,
                          color: 'cyan',
                          }] : []),
                          ...(getCurrentCategory()!.specialRequirements.includes('valuable') ? [{
                          id: 'valuable',
                          name: 'Değerli',
                          icon: Star,
                          color: 'yellow',
                          }] : []),
                          ...(getCurrentCategory()!.specialRequirements.includes('requiresCrane') ? [{
                            id: 'requiresCrane',
                            name: 'Vinç Gerekli',
                            icon: Settings,
                            color: 'purple',
                          }] : []),
                          ...(getCurrentCategory()!.specialRequirements.includes('requiresSpecialVehicle') ? [{
                            id: 'requiresSpecialVehicle',
                            name: 'Özel Araç',
                            icon: Truck,
                            color: 'indigo',
                          }] : []),
                      ].map(req => {
                        const IconComponent = req.icon;
                          const isSelected = formData.specialRequirements.includes(req.id);

                        return (
                          <button
                            key={req.id}
                            type='button'
                            onClick={() => {
                              const current = formData.specialRequirements
                                .split(',')
                                .filter(r => r.trim());
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
                            <div className='flex flex-col items-center text-center'>
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                  isSelected
                                    ? `bg-${req.color}-500`
                                    : 'bg-slate-100'
                                }`}
                              >
                                <IconComponent
                                  className={`w-4 h-4 ${
                                    isSelected ? 'text-white' : 'text-slate-600'
                                  }`}
                                />
                              </div>
                              <span
                                className={`text-xs font-medium ${
                                  isSelected
                                    ? `text-${req.color}-900`
                                    : 'text-slate-700'
                                }`}
                              >
                                {req.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className='space-y-6'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                Adres & İletişim Bilgileri
              </h2>
              <p className='text-slate-600'>
                Toplama ve teslimat bilgilerini girin
              </p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div className='space-y-4'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Toplama Adresi
                    </h3>
                    <p className='text-sm text-slate-600'>
                      Gönderiyi nereden alacağız?
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      <MapPin className='w-4 h-4 inline mr-2' />
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
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                        errors.pickupAddress ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder='Tam adres bilgilerini girin...'
                    />
                    {errors.pickupAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.pickupAddress}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      <Calendar className='w-4 h-4 inline mr-2' />
                      Toplama Tarihi *
                    </label>
                    <input
                      type='date'
                      value={formData.pickupDate}
                      onChange={(e) => {
                        handleInputChange('pickupDate', e.target.value);
                        if (errors.pickupDate) {
                          setErrors(prev => ({ ...prev, pickupDate: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                        errors.pickupDate ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.pickupDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.pickupDate}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900'>
                      Teslimat Adresi
                    </h3>
                    <p className='text-sm text-slate-600'>
                      Gönderiyi nereye teslim edeceğiz?
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      <MapPin className='w-4 h-4 inline mr-2' />
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
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none ${
                        errors.deliveryAddress ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder='Tam adres bilgilerini girin...'
                    />
                    {errors.deliveryAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      <Calendar className='w-4 h-4 inline mr-2' />
                      Teslimat Tarihi *
                    </label>
                    <input
                      type='date'
                      value={formData.deliveryDate}
                      onChange={(e) => {
                        handleInputChange('deliveryDate', e.target.value);
                        if (errors.deliveryDate) {
                          setErrors(prev => ({ ...prev, deliveryDate: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 ${
                        errors.deliveryDate ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.deliveryDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.deliveryDate}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        );

      case 3:
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
                          {formData.weight} ton
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
                        Backend sunucusu çalışmıyor olabilir. Lütfen backend'i başlatın: <code className='bg-red-100 px-1 rounded'>cd backend && node postgres-backend.js</code>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* ÖNEMLİ UYARI - Sorumluluk Reddi */}
            <div className='bg-red-50 border-2 border-red-300 rounded-xl p-6 space-y-4'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='w-6 h-6 text-red-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <h3 className='text-lg font-bold text-red-800 mb-3'>
                    ÖNEMLİ UYARI: Sorumluluk Reddi
                  </h3>
                  <div className='space-y-3 text-sm text-red-700'>
                    <p className='font-semibold'>
                      YolNext sadece bir aracı platformdur. Taşımacılık hizmetlerini bizzat sağlamaz ve hiçbir şekilde sorumluluk kabul etmez.
                    </p>
                    <ul className='list-disc pl-5 space-y-2'>
                      <li>
                        <strong>Kaza, yaralanma, ölüm:</strong> YolNext sorumlu değildir
                      </li>
                      <li>
                        <strong>Hırsızlık, kayıp, hasar:</strong> YolNext sorumlu değildir
                      </li>
                      <li>
                        <strong>Gecikme, yanlış teslimat:</strong> YolNext sorumlu değildir
                      </li>
                      <li>
                        <strong>Mali kayıplar:</strong> YolNext sorumlu değildir
                      </li>
                      <li>
                        <strong>Nakliyeci veya gönderici davranışları:</strong> YolNext sorumlu değildir
                      </li>
                    </ul>
                    <p className='font-semibold mt-3'>
                      Tüm riskler gönderici ve nakliyeci arasındadır.{' '}
                      <a
                        href='/terms'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-red-800 underline ml-1'
                      >
                        Detaylı bilgi için Kullanım Koşulları
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

      default:
        return null;
    }
  };

  const breadcrumbItems = [
    { label: 'Yeni Gönderi', icon: <Plus className='w-4 h-4' /> },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Yeni Gönderi - YolNext Kurumsal</title>
        <meta name='description' content='Kurumsal gönderi oluşturun' />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Plus className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Yeni{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Gönderi
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4'>
            Kurumsal nakliye ihtiyaçlarınız için kapsamlı kategori sistemi. 
            Her işletme türüne uygun özel form alanları.
          </p>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6'>
            <div className='mb-4 lg:mb-0'>
              <h2 className='text-lg sm:text-xl font-bold text-slate-900 mb-1'>
                Adım {currentStep} / {steps.length}
              </h2>
              <p className='text-sm sm:text-base text-slate-600'>
                {steps[currentStep - 1].title}
              </p>
            </div>
            <div className='w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              {steps[currentStep - 1].icon}
            </div>
          </div>

          <div className='flex flex-wrap gap-2 sm:gap-4'>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                    currentStep >= step.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className='w-3 h-3 sm:w-4 sm:h-4' />
                  ) : (
                    <span className='text-xs sm:text-sm font-bold'>
                      {step.id}
                    </span>
                  )}
                </div>
                <span className='hidden sm:block'>{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8'>
          {renderStepContent()}
        </div>

        <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5' />
            <span className='text-sm sm:text-base'>Geri</span>
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'
            >
              <span className='text-sm sm:text-base'>İleri</span>
              <ArrowRight className='w-4 h-4 sm:w-5 sm:h-5' />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? (
                <>
                  <div className='w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span className='text-sm sm:text-base'>Yayınlanıyor...</span>
                </>
              ) : (
                <>
                  <Send className='w-4 h-4 sm:w-5 sm:h-5' />
                  <span className='text-sm sm:text-base'>
                    Gönderiyi Yayınla
                  </span>
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
