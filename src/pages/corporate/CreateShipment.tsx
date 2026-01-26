import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  Truck,
  MapPin,
  Check,
  ArrowLeft,
  ArrowRight,
  Send,
  Weight,
  Ruler,
  Palette,
  Thermometer,
  AlertTriangle,
  Cpu,
  Shirt,
  Car,
  Box,
  Star,
  Calendar,
  Clock,
  Plus,
  FileText,
  Factory,
  ShoppingCart,
  UtensilsCrossed,
  Hammer,
  Pill,
  Flame,
  Archive,
  Warehouse,
  Container,
  Snowflake,
  Package2,
  Printer,
  Settings,
  type LucideIcon
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { turkeyCities } from '../../data/turkey-cities-districts';
import CorporateCreateShipmentStep2 from '../../components/shipment/CorporateCreateShipmentStep2';
import CorporateCreateShipmentStep3 from '../../components/shipment/CorporateCreateShipmentStep3';
import { analytics } from '../../services/businessAnalytics';

// Shipment data interface
interface ShipmentData {
  title: string;
  description: string;
  productDescription?: string;
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
  volume?: number;
  dimensions: string | null;
  value?: number;
  specialRequirements: string;
  quantity?: number;
  price?: number;
  publishType?: string;
  targetNakliyeciId?: string | null;
  categoryData?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional properties
}

import { createApiUrl } from '../../config/api';

// Temporary workaround - direct API calls
const shipmentAPI = {
  create: async (data: ShipmentData) => {
    const apiUrl = createApiUrl('/api/shipments');
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      '';
    const normalizedToken = String(token || '').replace(/^Bearer\s+/i, '').trim();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': normalizedToken && normalizedToken !== 'null' && normalizedToken !== 'undefined' ? `Bearer ${normalizedToken}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = null;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = null;
      }

      const message =
        (errorData && (errorData.details || errorData.detail || errorData.error || errorData.message)) ||
        (errorText && errorText.trim() ? errorText.trim().slice(0, 500) : null) ||
        `HTTP error! status: ${response.status}`;

      throw new Error(message);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
    }
    
    return response.json();
  }
};

const carriersAPI = {
  getCorporate: async () => {
    const apiUrl = createApiUrl('/api/carriers/corporate');
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      '';
    const normalizedToken = String(token || '').replace(/^Bearer\s+/i, '').trim();
    
    const response = await fetch(apiUrl, {
      headers: { 'Authorization': normalizedToken && normalizedToken !== 'null' && normalizedToken !== 'undefined' ? `Bearer ${normalizedToken}` : '' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
    }
    
    return response.json();
  }
};

// Kategori tanımlamaları - Her kategori için özel gereksinimler
interface CategoryConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  specialRequirements: string[];
}

export default function CreateShipment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlNakliyeciId = searchParams.get('nakliyeciId');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [nakliyeciler, setNakliyeciler] = useState<Array<{ id: string; companyName?: string; name?: string; fullName?: string; email?: string }>>([]);
  const [loadingNakliyeciler, setLoadingNakliyeciler] = useState(false);
  
  const [formData, setFormData] = useState({
    mainCategory: '',
    productDescription: '',
    unitType: '',
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
    publishType: urlNakliyeciId ? 'specific' : 'all',
    targetNakliyeciId: urlNakliyeciId || '', // Belirli nakliyeciye özel gönderi için
    // Sorumluluk reddi onayı (kabul etmeden yayınlanamaz)
    disclaimerAccepted: false,
    
    // Kategoriye özel alanlar
    // Endüstriyel & Ham Madde
    materialType: '',
    packagingType: '',
    isPalletized: false,
    palletCount: '', // Hem Endüstriyel hem Gıda için kullanılır
    
    // Gıda & İçecek
    requiresColdChain: false,
    temperatureSetpoint: '',
    expiryDate: '',
    hasCertification: false,
    
    // Kimyasal & Tehlikeli
    hazardClass: '',
    unNumber: '',
    hasMSDS: false,
    requiresSpecialPermit: false,
    
    // Soğutmalı
    coldChainRequired: false,
    
    // Büyük Boy & Makine
    loadingEquipment: '',
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
    
    // Araç ve Ekipman Gereksinimleri
    vehicleType: '', // 'refrigerated', 'open_truck', 'closed_truck', 'trailer_tent', 'trailer_frigorific', 'trailer_lowbed', 'van', 'kamyonet', 'kamyon'
    trailerType: '', // 'tenteli', 'frigorifik', 'lowbed', 'kapalı', 'açık', 'yok'
    requiresCrane: false,
    requiresForklift: false,
    requiresHydraulicLifter: false,
    heavyTonage: false, // 40+ ton
    heavyTonageAmount: '', // ton cinsinden
    oversizedLoad: false, // Geniş yük (özel izin gerektiren)
    oversizedDimensions: {
      length: '',
      width: '',
      height: '',
    },
    temperatureControl: false, // Soğutmalı araç için
    temperatureMin: '',
    temperatureMax: '',
  });

  // NOTE: This top stepper should match the individual create-shipment header.
  const steps = [
    { id: 1, title: 'Form Doldurma', subtitle: 'Yük Bilgileri', icon: <Package size={20} /> },
    { id: 2, title: 'Adres ve Tarih', subtitle: 'Adres Bilgileri', icon: <MapPin size={20} /> },
    { id: 3, title: 'Ön İzleme ve Yayınlama', subtitle: 'Yayınla & Önizleme', icon: <Send size={20} /> },
  ];

  // Kapsamlı Kurumsal Kategoriler
  const mainCategories: CategoryConfig[] = [
    {
      id: 'raw_materials',
      name: 'Ham Madde & Endüstriyel Mal',
      icon: Factory,
      description: 'Üretim için ham madde, endüstriyel malzemeler',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: [],
      specialRequirements: ['fragile', 'urgent', 'signature']
    },
    {
      id: 'retail_consumer',
      name: 'Perakende & Tüketim Malı',
      icon: ShoppingCart,
      description: 'Mağaza, perakende satış ürünleri',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['dimensions'],
      specialRequirements: ['fragile', 'valuable', 'signature']
    },
    {
      id: 'electronics_tech',
      name: 'Elektronik & Teknoloji',
      icon: Cpu,
      description: 'Elektronik cihazlar, teknoloji ürünleri',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['dimensions', 'isOriginalPackaging', 'requiresAntiStatic'],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'textile_apparel',
      name: 'Tekstil & Giyim',
      icon: Shirt,
      description: 'Tekstil ürünleri, giyim eşyaları',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: [],
      specialRequirements: ['signature']
    },
    {
      id: 'food_beverage',
      name: 'Gıda & İçecek',
      icon: UtensilsCrossed,
      description: 'Gıda ürünleri, içecekler, restoran malzemeleri',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['requiresColdChain', 'temperatureSetpoint', 'expiryDate', 'hasCertification'],
      specialRequirements: ['temperature', 'urgent', 'signature']
    },
    {
      id: 'furniture_home',
      name: 'Mobilya & Ev Eşyası',
      icon: Box,
      description: 'Mobilya, ev eşyaları, dekorasyon',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['dimensions', 'requiresAssembly'],
      specialRequirements: ['fragile', 'requiresSpecialVehicle']
    },
    {
      id: 'construction_materials',
      name: 'İnşaat Malzemeleri',
      icon: Hammer,
      description: 'İnşaat malzemeleri, yapı malzemeleri',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['materialQuantity', 'requiresWeatherProtection', 'requiresSpecialVehicle'],
      specialRequirements: ['requiresCrane', 'urgent']
    },
    {
      id: 'automotive_parts',
      name: 'Otomotiv Parçaları',
      icon: Car,
      description: 'Araç parçaları, yedek parça, aksesuar',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: [],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'medical_pharma',
      name: 'Medikal & İlaç',
      icon: Pill,
      description: 'Tıbbi malzemeler, ilaçlar, sağlık ürünleri',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['temperatureControlled', 'temperatureSetpoint', 'requiresPharmaLicense'],
      specialRequirements: ['temperature', 'urgent']
    },
    {
      id: 'chemical_hazardous',
      name: 'Kimyasal & Tehlikeli Madde',
      icon: Flame,
      description: 'Kimyasal maddeler, tehlikeli yükler',
      requiredFields: ['unitType', 'weight', 'quantity', 'hazardClass', 'unNumber', 'hasMSDS'],
      optionalFields: ['requiresSpecialPermit'],
      specialRequirements: ['urgent']
    },
    {
      id: 'documents_mail',
      name: 'Doküman & Önemli Kargo',
      icon: Archive,
      description: 'Önemli evraklar, belgeler, resmi kargo',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: [],
      specialRequirements: ['urgent', 'signature']
    },
    {
      id: 'warehouse_transfer',
      name: 'Depo Transferi',
      icon: Warehouse,
      description: 'Depo arası transfer, stok taşıma',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['warehouseType'],
      specialRequirements: ['urgent']
    },
    {
      id: 'bulk_cargo',
      name: 'Dökme Yük',
      icon: Container,
      description: 'Büyük miktarda dökme yük, toplu taşıma',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['bulkType', 'requiresCover'],
      specialRequirements: []
    },
    {
      id: 'refrigerated',
      name: 'Soğutmalı Yük',
      icon: Snowflake,
      description: 'Soğuk zincir gerektiren ürünler',
      requiredFields: ['unitType', 'weight', 'quantity', 'temperatureSetpoint'],
      optionalFields: [],
      specialRequirements: ['temperature', 'urgent']
    },
    {
      id: 'oversized',
      name: 'Büyük Boy Yük',
      icon: Package2,
      description: 'Büyük ebatlı yükler, makineler',
      requiredFields: ['unitType', 'weight', 'dimensions', 'loadingEquipment'],
      optionalFields: ['requiresSpecialVehicle', 'isFragile'],
      specialRequirements: ['requiresCrane', 'requiresSpecialVehicle']
    },
    {
      id: 'office_equipment',
      name: 'Ofis Ekipmanı',
      icon: Printer,
      description: 'Ofis mobilyası, ekipman, bilgisayar',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['dimensions', 'equipmentType', 'requiresAssembly'],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'machinery_equipment',
      name: 'Makine & Ekipman',
      icon: Settings,
      description: 'Endüstriyel makineler, ağır ekipman',
      requiredFields: ['unitType', 'weight', 'dimensions', 'loadingEquipment'],
      optionalFields: ['requiresSpecialVehicle', 'isFragile'],
      specialRequirements: ['requiresCrane', 'requiresSpecialVehicle']
    },
    {
      id: 'display_exhibition',
      name: 'Vitrin & Sergi Malzemesi',
      icon: Star,
      description: 'Fuarlar, sergiler, vitrin malzemeleri',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['dimensions', 'requiresAssembly'],
      specialRequirements: ['fragile', 'valuable']
    },
    {
      id: 'other',
      name: 'Diğer',
      icon: Package,
      description: 'Diğer kurumsal yükler',
      requiredFields: ['unitType', 'weight', 'quantity'],
      optionalFields: ['dimensions'],
      specialRequirements: []
    }
  ];

  const getCurrentCategory = () => {
    return mainCategories.find(cat => cat.id === formData.mainCategory);
  };

  const getUnitTypeOptions = (categoryId?: string) => {
    const all = [
      { value: 'koli', label: 'Koli' },
      { value: 'palet', label: 'Palet' },
      { value: 'adet', label: 'Adet' },
      { value: 'varil', label: 'Varil' },
      { value: 'bigbag', label: 'Bigbag' },
      { value: 'dokme', label: 'Dökme' },
      { value: 'askili', label: 'Askılı' },
    ];

    const allowedByCategory: Record<string, string[]> = {
      documents_mail: ['adet'],
      bulk_cargo: ['dokme', 'bigbag'],
      raw_materials: ['palet', 'koli', 'adet', 'varil', 'bigbag', 'dokme'],
      chemical_hazardous: ['varil', 'palet', 'koli', 'bigbag'],
      refrigerated: ['palet', 'koli', 'adet'],
      food_beverage: ['palet', 'koli', 'adet'],
      textile_apparel: ['koli', 'askili', 'palet'],
      oversized: ['palet', 'adet'],
      machinery_equipment: ['palet', 'adet'],
      warehouse_transfer: ['palet', 'koli'],
    };

    const allowed = categoryId ? allowedByCategory[categoryId] : undefined;
    if (!allowed) return all;
    return all.filter(o => allowed.includes(o.value));
  };

  // Load nakliyeciler (favori nakliyeciler) when component mounts or when publishType changes to 'specific'
  useEffect(() => {
    const loadNakliyeciler = async () => {
      if (formData.publishType === 'specific') {
        setLoadingNakliyeciler(true);
        try {
          // Get favori nakliyeciler from corporate carriers endpoint
          const result = await carriersAPI.getCorporate();
          if (result.success && result.data) {
            const carriers = result.data.carriers || result.data || [];
            setNakliyeciler(carriers);
          } else {
            setNakliyeciler([]);
          }
        } catch (error) {
          setNakliyeciler([]);
        } finally {
          setLoadingNakliyeciler(false);
        }
      }
    };

    loadNakliyeciler();
  }, [formData.publishType]);

  const handleInputChange = (field: string, value: string | number | boolean | object) => {
        setFormData(prev => {
      const newData: typeof prev = { ...prev, [field]: value };
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

  const handleDimensionsChange = (field: string, value: string) => {
    // Trim whitespace and ensure valid number input
    const trimmedValue = value.trim();
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: trimmedValue,
      },
    }));
    
    // Clear error when user starts typing
    if (errors.dimensions) {
      setErrors(prev => ({ ...prev, dimensions: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
        const newErrors: { [key: string]: string } = {};
    const currentCategory = getCurrentCategory();

    if (step === 1) {
      if (!formData.mainCategory) {
        newErrors.mainCategory = 'Kategori seçin (fiyatlandırma için gerekli)';
      }
            if (!formData.productDescription || formData.productDescription.trim() === '') {
        newErrors.productDescription = 'Yükü açıklayın (nakliyeciler anlayacak)';
      }

      if (!formData.unitType) {
        newErrors.unitType = 'Birim tipi seçin';
      }

      if (currentCategory) {
        // Kategoriye özel validasyon
        currentCategory.requiredFields.forEach(field => {
          if (field === 'weight') {
            if (!formData.weight || formData.weight.trim() === '') {
              newErrors.weight = 'Ağırlık girin (yaklaşık)';
            }
          }
          if (field === 'quantity') {
            if (!formData.quantity || formData.quantity.trim() === '') {
              newErrors.quantity = 'Miktar girin';
            }
          }
          if (field === 'unitType') {
            if (!formData.unitType) {
              newErrors.unitType = 'Birim tipi seçin';
            }
          }
          if (field === 'dimensions') {
            if (!formData.dimensions.length || !formData.dimensions.width || !formData.dimensions.height) {
              newErrors.dimensions = 'Boyutları girin (en-boy-yükseklik)';
            }
          }
          if (field === 'hazardClass' && !formData.hazardClass) {
            newErrors.hazardClass = 'Tehlike sınıfı seçin';
          }
          if (field === 'unNumber' && !formData.unNumber) {
            newErrors.unNumber = 'UN numarasını girin';
          }
          if (field === 'hasMSDS' && !formData.hasMSDS) {
            newErrors.hasMSDS = 'MSDS bilgisi belirtin';
          }
          if (field === 'temperatureSetpoint') {
            if (!formData.temperatureSetpoint || String(formData.temperatureSetpoint).trim() === '') {
              newErrors.temperatureSetpoint = 'Sıcaklık setpoint’i girin';
            }
          }
          if (field === 'loadingEquipment' && !formData.loadingEquipment) {
            newErrors.loadingEquipment = 'Yükleme ekipmanı seçin';
          }
        });

        // Cold-chain seçiliyse setpoint zorunlu (kategori fark etmeksizin)
        if (currentCategory.id === 'food_beverage' && formData.requiresColdChain) {
          if (!formData.temperatureSetpoint || String(formData.temperatureSetpoint).trim() === '') {
            newErrors.temperatureSetpoint = 'Soğuk zincir için sıcaklık setpoint gerekli';
          }
        }
      }
    } else if (step === 2) {
      if (!formData.pickupCity) {
        newErrors.pickupCity = 'Toplama ili seçin';
      }
      if (!formData.pickupDistrict) {
        newErrors.pickupDistrict = 'Toplama ilçesi seçin';
      }
      if (!formData.pickupAddress || formData.pickupAddress.trim() === '') {
        newErrors.pickupAddress = 'Toplama adresini girin';
      }
      if (!formData.deliveryCity) {
        newErrors.deliveryCity = 'Teslimat ili zorunludur';
      }
      if (!formData.deliveryDistrict) {
        newErrors.deliveryDistrict = 'Teslimat ilçesi zorunludur';
      }
      if (!formData.deliveryAddress || formData.deliveryAddress.trim() === '') {
        newErrors.deliveryAddress = 'Teslimat adresi zorunludur';
      }
      if (!formData.pickupDate) {
        newErrors.pickupDate = 'Toplama tarihi zorunludur';
      } else {
        const pickupDate = parseISODateStrict(formData.pickupDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!pickupDate) {
          newErrors.pickupDate = 'Geçersiz toplama tarihi. Lütfen geçerli bir tarih seçin.';
        }
        
        if (pickupDate && pickupDate < today) {
          newErrors.pickupDate = 'Toplama tarihi geçmiş bir tarih olamaz. Lütfen bugün veya ileri bir tarih seçin.';
        }
        
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 20);
        if (pickupDate && pickupDate > maxDate) {
          newErrors.pickupDate = 'Toplama tarihi bugünden en fazla 20 gün sonrası için olabilir. Lütfen daha yakın bir tarih seçin.';
        }
      }
      
      if (!formData.deliveryDate) {
        newErrors.deliveryDate = 'Teslimat tarihi zorunludur';
      } else {
        const deliveryDate = parseISODateStrict(formData.deliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!deliveryDate) {
          newErrors.deliveryDate = 'Geçersiz teslimat tarihi. Lütfen geçerli bir tarih seçin.';
        }
        
        if (deliveryDate && deliveryDate < today) {
          newErrors.deliveryDate = 'Teslimat tarihi geçmiş bir tarih olamaz. Lütfen bugün veya ileri bir tarih seçin.';
        }
        
        if (formData.pickupDate) {
          const pickupDate = parseISODateStrict(formData.pickupDate);
          if (pickupDate && deliveryDate && deliveryDate < pickupDate) {
            newErrors.deliveryDate = 'Teslimat tarihi toplama tarihinden önce olamaz.';
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
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    const isValid = validateStep(currentStep);
    if (!isValid) {
      return;
    }
    if (!formData.disclaimerAccepted) {
      setErrors((prev) => ({
        ...prev,
        disclaimerAccepted: 'Devam etmek için "Okudum, anladım ve kabul ediyorum" seçeneğini işaretleyin.',
      }));
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrors({ publish: 'Gönderi oluşturma işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.' });
    }, 30000); // 30 seconds timeout for shipment creation

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

      const shipmentData: ShipmentData = {
        title: currentCategory?.name || 'Kurumsal Gönderi',
        description: formData.productDescription || '',
        productDescription: formData.productDescription || '',
        category: formData.mainCategory,
        pickupCity: pickupLocation.city,
        pickupDistrict: pickupLocation.district,
        pickupAddress: formData.pickupAddress,
        pickupDate: formData.pickupDate,
        deliveryCity: deliveryLocation.city,
        deliveryDistrict: deliveryLocation.district,
        deliveryAddress: formData.deliveryAddress,
        deliveryDate: formData.deliveryDate,
        weight: parseFloat(formData.weight) || 0,
        quantity: parseInt(formData.quantity) || 1,
        dimensions: formData.dimensions.length && formData.dimensions.width && formData.dimensions.height
          ? `${formData.dimensions.length}x${formData.dimensions.width}x${formData.dimensions.height}`
          : null,
        specialRequirements: formData.specialRequirements || '',
        publishType: formData.publishType,
        targetNakliyeciId: formData.publishType === 'specific' ? formData.targetNakliyeciId : null,
        
        // Kategoriye özel veriler
        categoryData: {
          unitType: formData.unitType,
          materialType: formData.materialType,
          packagingType: formData.packagingType,
          isPalletized: formData.isPalletized,
          palletCount: formData.palletCount,
          requiresColdChain: formData.requiresColdChain,
          temperatureSetpoint: formData.temperatureSetpoint,
          coldChainRequired: formData.coldChainRequired,
          hazardClass: formData.hazardClass,
          unNumber: formData.unNumber,
          hasMSDS: formData.hasMSDS,
          expiryDate: formData.expiryDate,
          hasCertification: formData.hasCertification,
          requiresSpecialPermit: formData.requiresSpecialPermit,
          loadingEquipment: formData.loadingEquipment,
          requiresSpecialVehicle: formData.requiresSpecialVehicle,
          isFragile: formData.isFragile,
          warehouseType: formData.warehouseType,
          isBulkTransfer: formData.isBulkTransfer,
          bulkType: formData.bulkType,
          requiresCover: formData.requiresCover,
          isOriginalPackaging: formData.isOriginalPackaging,
          requiresAntiStatic: formData.requiresAntiStatic,
          materialQuantity: formData.materialQuantity,
          requiresWeatherProtection: formData.requiresWeatherProtection,
          equipmentType: formData.equipmentType,
          requiresAssembly: formData.requiresAssembly,
          requiresPharmaLicense: formData.requiresPharmaLicense,
          temperatureControlled: formData.temperatureControlled,
          
          // Araç ve Ekipman Gereksinimleri
          vehicleRequirements: {
            vehicleType: formData.vehicleType || null,
            trailerType: formData.trailerType || null,
            requiresCrane: formData.requiresCrane || false,
            requiresForklift: formData.requiresForklift || false,
            requiresHydraulicLifter: formData.requiresHydraulicLifter || false,
            heavyTonage: formData.heavyTonage || false,
            heavyTonageAmount: formData.heavyTonageAmount || null,
            oversizedLoad: formData.oversizedLoad || false,
            oversizedDimensions: formData.oversizedLoad ? {
              length: formData.oversizedDimensions.length || null,
              width: formData.oversizedDimensions.width || null,
              height: formData.oversizedDimensions.height || null,
            } : null,
            temperatureControl: formData.temperatureControl || false,
            temperatureMin: formData.temperatureMin || null,
            temperatureMax: formData.temperatureMax || null,
          }
        }
      };

      let response;
      try {
        response = await shipmentAPI.create(shipmentData);
        clearTimeout(timeoutId);
      } catch (networkError: unknown) {
        // Network error (backend not running, CORS, etc.)
        clearTimeout(timeoutId);
        setIsLoading(false);
        const errorMessage = networkError instanceof Error ? networkError.message : 'Bilinmeyen hata';
        setErrorMessage('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin ve birkaç dakika sonra tekrar deneyin.');
        setErrors({ publish: 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.' });
        return;
      }

      if (response.data?.success || response.success) {
        const createdShipment = (response as any)?.data?.shipment || (response as any)?.data || null;
        analytics.track('shipment_create_success', {
          shipmentId: createdShipment?.id || null,
          category: formData.mainCategory || null,
          publishType: formData.publishType || null,
        });

        setSuccessMessage(
          'Gönderiniz başarıyla yayınlandı! Nakliyecilerden teklifler almaya başlayacaksınız.'
        );
        setShowSuccessMessage(true);

        // Reset form
        setFormData({
          mainCategory: '',
          productDescription: '',
          unitType: '',
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
          disclaimerAccepted: false,
          // Kategoriye özel alanlar
          materialType: '',
          packagingType: '',
          isPalletized: false,
          palletCount: '',
          requiresColdChain: false,
          temperatureSetpoint: '',
          expiryDate: '',
          hasCertification: false,
          hazardClass: '',
          unNumber: '',
          hasMSDS: false,
          requiresSpecialPermit: false,
          coldChainRequired: false,
          loadingEquipment: '',
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
          vehicleType: '',
          trailerType: '',
          requiresCrane: false,
          requiresForklift: false,
          requiresHydraulicLifter: false,
          heavyTonage: false,
          heavyTonageAmount: '',
          oversizedLoad: false,
          oversizedDimensions: { length: '', width: '', height: '' },
          temperatureControl: false,
          temperatureMin: '',
          temperatureMax: '',
        });
        setCurrentStep(1);
        setErrors({});

        // Redirect to shipments page after 2 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/corporate/shipments');
        }, 2000);
      }
    } catch (error: unknown) {
      // Error handled and displayed to user via setErrors
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setErrorMessage(
        `Gönderi oluşturulurken bir hata oluştu: ${errorMessage}. Lütfen tekrar deneyin.`
      );
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const renderCategorySpecificFields = () => {
    const currentCategory = getCurrentCategory();
    if (!currentCategory) return null;

    const fields: JSX.Element[] = [];

    // Gıda & İçecek (minimal)
    if (currentCategory.id === 'food_beverage') {
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
            Soğuk Zincir Gerekli
          </label>
        </div>
      );

      if (formData.requiresColdChain) {
        fields.push(
          <div key="temperatureSetpoint" className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Thermometer className="w-4 h-4 inline mr-2" />
              Sıcaklık Setpoint (℃) *
            </label>
            <input
              type="text"
              value={formData.temperatureSetpoint}
              onChange={(e) => handleInputChange('temperatureSetpoint', e.target.value)}
              className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                errors.temperatureSetpoint ? 'border-red-500' : 'border-slate-200'
              }`}
              placeholder="Örn: 2-8 veya -18"
            />
            {errors.temperatureSetpoint && (
              <p className="mt-1 text-sm text-red-600">{errors.temperatureSetpoint}</p>
            )}
          </div>
        );
      }

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
        <div key="unNumber" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            UN Numarası *
          </label>
          <input
            type="text"
            value={formData.unNumber}
            onChange={(e) => handleInputChange('unNumber', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.unNumber ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Örn: UN 1203"
          />
          {errors.unNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.unNumber}</p>
          )}
        </div>
      );

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
            MSDS (Güvenlik Bilgi Formu) Mevcut
          </label>
          {errors.hasMSDS && (
            <p className="text-sm text-red-600">{errors.hasMSDS}</p>
          )}
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
            Özel İzin Gerekli
          </label>
        </div>
      );
    }

    // Soğutmalı Yük
    if (currentCategory.id === 'refrigerated') {
      fields.push(
        <div key="temperatureSetpoint" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Snowflake className="w-4 h-4 inline mr-2" />
            Sıcaklık Setpoint (℃) *
          </label>
          <input
            type="text"
            value={formData.temperatureSetpoint}
            onChange={(e) => handleInputChange('temperatureSetpoint', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.temperatureSetpoint ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Örn: -18, 2-8"
          />
          {errors.temperatureSetpoint && (
            <p className="mt-1 text-sm text-red-600">{errors.temperatureSetpoint}</p>
          )}
        </div>
      );
    }

    // Büyük Boy & Makine
    if (currentCategory.id === 'oversized' || currentCategory.id === 'machinery_equipment') {
      fields.push(
        <div key="loadingEquipment" className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Yükleme Ekipmanı *
          </label>
          <select
            value={formData.loadingEquipment}
            onChange={(e) => handleInputChange('loadingEquipment', e.target.value)}
            className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              errors.loadingEquipment ? 'border-red-500' : 'border-slate-200'
            }`}
          >
            <option value="">Seçiniz</option>
            <option value="manual">Manuel</option>
            <option value="forklift">Forklift</option>
            <option value="crane">Vinç</option>
          </select>
          {errors.loadingEquipment && (
            <p className="mt-1 text-sm text-red-600">{errors.loadingEquipment}</p>
          )}
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
            Özel Araç Gerekli (Düşük Tavanlı, Özel Platform vb.)
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
            Orijinal Ambalajında (opsiyonel)
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

  const renderVehicleRequirements = () => {
    const currentCategory = getCurrentCategory();
    if (!currentCategory) return null;

    // Sadece kurumsal kategoriler için göster (bireysel değil)
    const showVehicleRequirements = [
      'raw_materials', 'retail_consumer', 'electronics_tech', 'textile_apparel',
      'food_beverage', 'furniture_home', 'construction_materials', 'automotive_parts',
      'medical_pharma', 'chemical_hazardous', 'documents_mail', 'warehouse_transfer',
      'bulk_cargo', 'refrigerated', 'oversized', 'office_equipment',
      'machinery_equipment', 'display_exhibition', 'other'
    ].includes(currentCategory.id);

    if (!showVehicleRequirements) return null;

    return (
      <div className="space-y-6 mt-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" />
          Araç ve Ekipman Gereksinimleri
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Yükünüz için gerekli araç tipi ve ekipmanları belirtin. Bu bilgiler nakliyecilerin doğru teklif vermesini sağlar.
        </p>

        <div className="space-y-4">
          {/* Araç Tipi */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Araç Tipi
            </label>
            <select
              value={formData.vehicleType}
              onChange={(e) => handleInputChange('vehicleType', e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            >
              <option value="">Araç tipi seçiniz (opsiyonel)</option>
              <option value="van">Van</option>
              <option value="kamyonet">Kamyonet</option>
              <option value="kamyon">Kamyon</option>
              <option value="refrigerated">Soğutmalı Araç</option>
              <option value="open_truck">Açık Kasa Kamyon</option>
              <option value="closed_truck">Kapalı Kasa Kamyon</option>
            </select>
          </div>

          {/* Dorse Tipi (Kamyon seçildiğinde) */}
          {(formData.vehicleType === 'kamyon' || formData.vehicleType === 'open_truck' || formData.vehicleType === 'closed_truck') && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Dorse Tipi
              </label>
              <select
                value={formData.trailerType}
                onChange={(e) => handleInputChange('trailerType', e.target.value)}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              >
                <option value="">Dorse tipi seçiniz (opsiyonel)</option>
                <option value="tenteli">Tenteli Dorse</option>
                <option value="frigorific">Frigorifik Dorse</option>
                <option value="lowbed">Lowbed Dorse</option>
                <option value="kapalı">Kapalı Dorse</option>
                <option value="açık">Açık Dorse</option>
                <option value="yok">Dorse Gerekmiyor</option>
              </select>
            </div>
          )}

          {/* Soğutmalı Araç Detayları */}
          {formData.vehicleType === 'refrigerated' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="checkbox"
                  id="temperatureControl"
                  checked={formData.temperatureControl}
                  onChange={(e) => handleInputChange('temperatureControl', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="temperatureControl" className="text-sm font-semibold text-slate-700">
                  Sıcaklık Kontrolü Gerekli
                </label>
              </div>
              {formData.temperatureControl && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Minimum Sıcaklık (℃)
                    </label>
                    <input
                      type="number"
                      value={formData.temperatureMin}
                      onChange={(e) => handleInputChange('temperatureMin', e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="-18"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Maksimum Sıcaklık (℃)
                    </label>
                    <input
                      type="number"
                      value={formData.temperatureMax}
                      onChange={(e) => handleInputChange('temperatureMax', e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="4"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Özel Ekipmanlar */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Özel Ekipman Gereksinimleri
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requiresCrane"
                  checked={formData.requiresCrane}
                  onChange={(e) => handleInputChange('requiresCrane', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="requiresCrane" className="text-sm font-medium text-slate-700">
                  Vinç Gerekli
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requiresForklift"
                  checked={formData.requiresForklift}
                  onChange={(e) => handleInputChange('requiresForklift', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="requiresForklift" className="text-sm font-medium text-slate-700">
                  Forklift Gerekli
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requiresHydraulicLifter"
                  checked={formData.requiresHydraulicLifter}
                  onChange={(e) => handleInputChange('requiresHydraulicLifter', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="requiresHydraulicLifter" className="text-sm font-medium text-slate-700">
                  Hidrolik Kaldırıcı Gerekli
                </label>
              </div>
            </div>
          </div>

          {/* Ağır Tonaj */}
          <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="heavyTonage"
                checked={formData.heavyTonage}
                onChange={(e) => handleInputChange('heavyTonage', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="heavyTonage" className="text-sm font-semibold text-slate-700">
                Ağır Tonaj (40+ ton)
              </label>
            </div>
            {formData.heavyTonage && (
              <div className="mt-3 space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Toplam Ağırlık (ton)
                </label>
                <input
                  type="number"
                  value={formData.heavyTonageAmount}
                  onChange={(e) => handleInputChange('heavyTonageAmount', e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="45"
                  min="40"
                />
                <p className="text-xs text-amber-700">
                  ⚠️ 40 ton ve üzeri yükler için özel izin ve rota planlaması gerekebilir.
                </p>
              </div>
            )}
          </div>

          {/* Geniş Yük */}
          <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="oversizedLoad"
                checked={formData.oversizedLoad}
                onChange={(e) => handleInputChange('oversizedLoad', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="oversizedLoad" className="text-sm font-semibold text-slate-700">
                Geniş Yük (Özel İzin Gerektiren)
              </label>
            </div>
            {formData.oversizedLoad && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-red-700 font-semibold">
                  ⚠️ Geniş yükler için özel izin ve rota planlaması gereklidir. Boyutları belirtin:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">Uzunluk (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.oversizedDimensions.length}
                      onChange={(e) => {
                        const newDims = { ...formData.oversizedDimensions, length: e.target.value };
                        handleInputChange('oversizedDimensions', newDims);
                      }}
                      className="w-full p-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="12.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">Genişlik (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.oversizedDimensions.width}
                      onChange={(e) => {
                        const newDims = { ...formData.oversizedDimensions, width: e.target.value };
                        handleInputChange('oversizedDimensions', newDims);
                      }}
                      className="w-full p-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="3.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">Yükseklik (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.oversizedDimensions.height}
                      onChange={(e) => {
                        const newDims = { ...formData.oversizedDimensions, height: e.target.value };
                        handleInputChange('oversizedDimensions', newDims);
                      }}
                      className="w-full p-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="4.2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
                value={formData.mainCategory ?? ''}
                onChange={(e) => {
                  handleInputChange('mainCategory', e.currentTarget.value);
                  const nextCategoryId = e.currentTarget.value;
                  const allowed = getUnitTypeOptions(nextCategoryId).map(o => o.value);
                  if (formData.unitType && !allowed.includes(formData.unitType)) {
                    handleInputChange('unitType', '');
                  }
                  if (errors.mainCategory) {
                    setErrors(prev => ({ ...prev, mainCategory: '' }));
                  }
                }}
                onInput={(e) => {
                  handleInputChange('mainCategory', (e.currentTarget as HTMLSelectElement).value);
                }}
                className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 text-lg ${
                  errors.mainCategory ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              >
                <option value=''>Kategori seçiniz</option>
                {mainCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
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

                  <div className='space-y-2'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Birim Tipi *
                    </label>
                    <select
                      value={formData.unitType}
                      onChange={(e) => {
                        handleInputChange('unitType', e.target.value);
                        if ((errors as any).unitType) {
                          setErrors(prev => ({ ...prev, unitType: '' }));
                        }
                      }}
                      className={`w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                        (errors as any).unitType ? 'border-red-500' : 'border-gray-200'
                      } text-slate-900 caret-slate-900`}
                    >
                      <option value=''>Seçiniz</option>
                      {getUnitTypeOptions(formData.mainCategory).map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {(errors as any).unitType && (
                      <p className='mt-1 text-sm text-red-600'>{(errors as any).unitType}</p>
                    )}
                  </div>

                  {/* Genel ağırlık ve miktar alanları - Gıda & İçecek hariç */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {getCurrentCategory()?.requiredFields.includes('weight') && (
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        <Weight className='w-4 h-4 inline mr-2' />
                          Toplam Ağırlık (kg) *
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
                        Birim Sayısı *
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
                          min='0'
                          step='0.01'
                          value={formData.dimensions.length}
                          onChange={(e) => {
                            handleDimensionsChange('length', e.target.value);
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && !isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                              handleDimensionsChange('length', value);
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
                          min='0'
                          step='0.01'
                          value={formData.dimensions.width}
                          onChange={(e) => {
                            handleDimensionsChange('width', e.target.value);
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && !isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                              handleDimensionsChange('width', value);
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
                          min='0'
                          step='0.01'
                          value={formData.dimensions.height}
                          onChange={(e) => {
                            handleDimensionsChange('height', e.target.value);
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && !isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                              handleDimensionsChange('height', value);
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

                  {/* Araç ve Ekipman Gereksinimleri */}
                  {renderVehicleRequirements()}

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
                        const currentRequirements = formData.specialRequirements || '';
                        const requirementsList = currentRequirements ? currentRequirements.split(',').filter(r => r.trim()) : [];
                        const isSelected = requirementsList.includes(req.id);

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
                          <button
                            key={req.id}
                            type='button'
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
                            <div className='flex flex-col items-center text-center'>
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${getBgColorClass(req.color, isSelected)}`}
                              >
                                <IconComponent
                                  className={`w-4 h-4 ${
                                    isSelected ? 'text-white' : 'text-slate-600'
                                  }`}
                                />
                              </div>
                              <span
                                className={`text-xs font-medium ${getTextColorClass(req.color, isSelected)}`}
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
          <CorporateCreateShipmentStep2
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            setErrors={setErrors}
          />
        );

      case 3:
        return (
          <CorporateCreateShipmentStep3
            formData={formData}
            errors={errors}
            errorMessage={errorMessage}
            handleInputChange={handleInputChange}
            getCurrentCategory={getCurrentCategory}
            nakliyeciler={nakliyeciler}
            loadingNakliyeciler={loadingNakliyeciler}
          />
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

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='corporate.create-shipment'
            icon={Package}
            title='Kurumsal Gönderi Oluşturma İpucu'
            description='Kategoriye uygun alanları doğru doldurmak (ölçü, zaman penceresi, hassasiyet) daha hızlı teklif ve daha az iptal demektir. Gereksiz detay yerine net bilgi ver.'
            primaryAction={{ label: 'Yardım Merkezi', to: '/corporate/help' }}
            secondaryAction={{ label: 'Teklifler', to: '/corporate/offers' }}
          />
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

        {/* Step Indicator (same as individual) */}
        <div className='mb-8'>
          <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6'>
            {/* Desktop View */}
            <div className='hidden md:flex items-center justify-between'>
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className='flex flex-col items-center flex-1'>
                    <div
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full mb-3 transition-all duration-300 ${
                        currentStep === step.id
                          ? 'bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 text-white shadow-lg scale-110'
                          : currentStep > step.id
                            ? 'bg-gradient-to-br from-slate-700 to-blue-800 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check size={20} className='text-white' />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className='text-center'>
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          currentStep === step.id
                            ? 'text-slate-800'
                            : currentStep > step.id
                              ? 'text-gray-700'
                              : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div
                        className={`text-xs ${
                          currentStep === step.id
                            ? 'text-blue-600'
                            : currentStep > step.id
                              ? 'text-gray-600'
                              : 'text-gray-400'
                        }`}
                      >
                        {(step as any).subtitle || ''}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 mt-[-24px] transition-all duration-300 ${
                        currentStep > step.id
                          ? 'bg-gradient-to-r from-slate-800 to-blue-900'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile View */}
            <div className='md:hidden'>
              <div className='flex items-center justify-between mb-4'>
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className='flex flex-col items-center flex-1'>
                      <div
                        className={`relative flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-all duration-300 ${
                          currentStep === step.id
                            ? 'bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 text-white shadow-lg scale-110'
                            : currentStep > step.id
                              ? 'bg-gradient-to-br from-slate-700 to-blue-800 text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <Check size={18} className='text-white' />
                        ) : (
                          <div className='scale-75'>{step.icon}</div>
                        )}
                      </div>
                      <div className='text-center'>
                        <div
                          className={`text-xs font-semibold ${
                            currentStep === step.id
                              ? 'text-slate-800'
                              : currentStep > step.id
                                ? 'text-gray-700'
                                : 'text-gray-400'
                          }`}
                        >
                          {index + 1}. Adım
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 mt-[-20px] transition-all duration-300 ${
                          currentStep > step.id
                            ? 'bg-gradient-to-r from-slate-800 to-blue-900'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className='text-center mt-2'>
                <div
                  className={`text-sm font-semibold ${
                    currentStep === steps[0].id
                      ? 'text-slate-800'
                      : currentStep === steps[1].id
                        ? 'text-blue-700'
                        : 'text-indigo-700'
                  }`}
                >
                  {steps[currentStep - 1].title}
                </div>
                <div className='text-xs text-gray-600 mt-1'>
                  {(steps[currentStep - 1] as any).subtitle || ''}
                </div>
              </div>
            </div>
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
              disabled={isLoading || !formData.disclaimerAccepted}
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











