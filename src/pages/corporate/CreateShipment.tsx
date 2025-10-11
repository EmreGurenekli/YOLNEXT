import React, { useState } from 'react';
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
  Hash,
  Weight,
  Ruler,
  Palette,
  Thermometer,
  AlertTriangle,
  Building,
  Home,
  Cpu,
  Shirt,
  Smartphone,
  Car,
  Heart,
  Wheat,
  Gem,
  Layers,
  Box,
  Package2,
  Activity,
  Shield,
  Star,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Plus,
  Minus,
  FileText
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import { FormField, ValidationMessage } from '../../components/common/FormValidation';

export default function CreateShipment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [formData, setFormData] = useState({
    // Yük Bilgileri
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
    
    // Araç Taşımacılığı
    vehicleType: '',
    licensePlate: '',
    vehicleLength: '',
    vehicleWidth: '',
    
    // Paletli Yük
    palletCount: '',
    palletLength: '',
    palletWidth: '',
    palletHeight: '',
    
    // Gıda & Soğuk Zincir
    foodType: '',
    temperatureRange: '',
    
    // Kimyasal & İlaç
    chemicalType: '',
    hazardClass: '',
    
    // İnşaat & Yapı Malzemesi
    materialType: '',
    volume: '',
    
    // Mobilya & Ev Eşyası
    furnitureType: '',
    pieceCount: '',
    largestLength: '',
    largestWidth: '',
    largestHeight: '',
    disassemblyStatus: '',
    packagingStatus: '',
    fragile: false,
    antique: false,
    oversized: false,
    heavy: false,
    needsCare: false,
    valuable: false,
    
    // Endüstriyel & Makine
    machineType: '',
    
    // Tekstil & Giyim
    textileType: '',
    packageCount: '',
    
    // Elektronik & Teknoloji
    electronicsType: '',
    value: '',
    
    // Otomotiv & Yedek Parça
    autoPartType: '',
    vehicleBrand: '',
    
    // Tıbbi & Sağlık
    medicalType: '',
    temperatureRequirement: '',
    
    // Tarım & Hayvancılık
    agriculturalType: '',
    
    // Özel Yük
    specialType: '',
    insuranceRequired: '',
    
    // Adres Bilgileri
    pickupAddress: '',
    deliveryAddress: '',
    pickupDate: '',
    deliveryDate: '',
    contactPerson: '',
    phone: '',
    email: '',
    
    // Yayınlama Tercihi
    publishType: 'all', // all, contracted, preferred
    selectedCarriers: []
  });

  const steps = [
    { id: 1, title: 'Yük Bilgileri', icon: <Package size={20} /> },
    { id: 2, title: 'Adres Bilgileri', icon: <MapPin size={20} /> },
    { id: 3, title: 'Yayınla & Önizleme', icon: <Send size={20} /> }
  ];

  // Ana Kategoriler - Tüm sektörleri kapsayan genel kategoriler
  const mainCategories = [
    { id: 'vehicle', name: 'Araç Taşımacılığı' },
    { id: 'general_cargo', name: 'Genel Kargo' },
    { id: 'furniture', name: 'Mobilya & Ev Eşyası' },
    { id: 'industrial', name: 'Endüstriyel & Makine' },
    { id: 'food', name: 'Gıda & Soğuk Zincir' },
    { id: 'textile', name: 'Tekstil & Giyim' },
    { id: 'electronics', name: 'Elektronik & Teknoloji' },
    { id: 'construction', name: 'İnşaat & Yapı Malzemesi' },
    { id: 'chemical', name: 'Kimyasal & İlaç' },
    { id: 'agricultural', name: 'Tarım & Hayvancılık' },
    { id: 'automotive', name: 'Otomotiv & Yedek Parça' },
    { id: 'medical', name: 'Tıbbi & Sağlık' },
    { id: 'special', name: 'Özel Yük' },
    { id: 'other', name: 'Diğer' }
  ];

  // Nakliyeciler
  const carriers = [
    { id: '1', name: 'Kargo Express A.Ş.', rating: 4.8, type: 'contracted' },
    { id: '2', name: 'Hızlı Lojistik', rating: 4.6, type: 'contracted' },
    { id: '3', name: 'Güvenli Taşımacılık', rating: 4.9, type: 'preferred' },
    { id: '4', name: 'Mega Kargo', rating: 4.3, type: 'general' },
    { id: '5', name: 'Hızlı Taşımacılık', rating: 4.5, type: 'general' }
  ];

  const handleInputChange = (field: string, value: any) => {
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

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = () => {
    alert('Gönderiniz başarıyla yayınlandı! Nakliyecilerden teklifler almaya başlayacaksınız.');
  };

  const getSelectedCategory = () => {
    return mainCategories.find(cat => cat.id === formData.mainCategory);
  };

  const getCategoryPlaceholder = (categoryId: string) => {
    const placeholders = {
      vehicle: 'Araç detaylarını tarif edin. Örn: 2020 model Ford Transit, beyaz renk, 3500 kg ağırlık...',
      general_cargo: 'Paletli yük detaylarını tarif edin. Örn: 24 palet elektronik ürün, 120x80x180 cm palet ölçüleri...',
      food: 'Gıda ürünü detaylarını tarif edin. Örn: 50 kutu dondurulmuş pizza, -18°C soğuk zincir...',
      chemical: 'Kimyasal ürün detaylarını tarif edin. Örn: 100 şişe temizlik ürünü, tehlikeli madde sınıfı 8...',
      construction: 'İnşaat malzemesi detaylarını tarif edin. Örn: 50 torba çimento, 25 m³ hacim...',
      furniture: 'Mobilya detaylarını tarif edin. Örn: 3 parça yatak odası takımı, kırılabilir, sökülmüş...',
      industrial: 'Makine detaylarını tarif edin. Örn: 1 adet CNC tezgahı, 2000 kg ağırlık, hassas taşıma...',
      textile: 'Tekstil ürünü detaylarını tarif edin. Örn: 1000 adet tişört, 50 kutu paket, kuru taşıma...',
      electronics: 'Elektronik ürün detaylarını tarif edin. Örn: 50 adet laptop, kırılabilir, güvenli taşıma...',
      automotive: 'Otomotiv parça detaylarını tarif edin. Örn: 100 adet lastik, 4x4 SUV lastiği, 205/55R16...',
      medical: 'Tıbbi ürün detaylarını tarif edin. Örn: 50 kutu ilaç, 2-8°C soğuk zincir, acil taşıma...',
      agricultural: 'Tarım ürünü detaylarını tarif edin. Örn: 1000 kg buğday, çuval halinde, kuru depolama...',
      special: 'Özel yük detaylarını tarif edin. Örn: Sanat eseri, çok değerli, özel ambalaj, sigortalı...',
      other: 'Yükünüzü detaylı olarak tarif edin...'
    };
    return placeholders[categoryId as keyof typeof placeholders] || 'Yükünüzü detaylı olarak tarif edin...';
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
                onChange={(e) => handleInputChange('mainCategory', e.target.value)}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 text-lg"
              >
                <option value="">Kategori seçiniz</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.mainCategory && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Yük Açıklaması *
                    </label>
                    <textarea
                      value={formData.productDescription}
                      onChange={(e) => handleInputChange('productDescription', e.target.value)}
                      rows={3}
                      className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none"
                      placeholder={getCategoryPlaceholder(formData.mainCategory)}
                    />
                  </div>

                  {/* Araç Taşımacılığı */}
                  {formData.mainCategory === 'vehicle' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">Araç Bilgileri</h3>
                          <p className="text-sm text-blue-600">Taşınacak araç detayları</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Truck className="w-4 h-4 inline mr-2" />
                              Araç Türü *
                            </label>
                            <select
                              value={formData.vehicleType}
                              onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                            >
                              <option value="">Araç türü seçin</option>
                              <option value="truck">Kamyon</option>
                              <option value="trailer">Tır</option>
                              <option value="car">Otomobil</option>
                              <option value="motorcycle">Motosiklet</option>
                              <option value="bus">Otobüs</option>
                              <option value="van">Van</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Hash className="w-4 h-4 inline mr-2" />
                              Plaka Numarası *
                            </label>
                            <input
                              type="text"
                              value={formData.licensePlate}
                              onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                              placeholder="34 ABC 123"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Weight className="w-4 h-4 inline mr-2" />
                              Araç Ağırlığı (kg) *
                            </label>
                            <input
                              type="number"
                              value={formData.weight}
                              onChange={(e) => handleInputChange('weight', e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                              placeholder="3500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Ruler className="w-4 h-4 inline mr-2" />
                              Araç Boyu (m)
                            </label>
                            <input
                              type="number"
                              value={formData.vehicleLength}
                              onChange={(e) => handleInputChange('vehicleLength', e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                              placeholder="12"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Ruler className="w-4 h-4 inline mr-2" />
                              Araç Genişliği (m)
                            </label>
                            <input
                              type="number"
                              value={formData.vehicleWidth}
                              onChange={(e) => handleInputChange('vehicleWidth', e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                              placeholder="2.5"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Paletli Yük */}
                  {formData.mainCategory === 'general_cargo' && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-900">Palet Bilgileri</h3>
                          <p className="text-sm text-green-600">Paletli yük detayları ve ölçüleri</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Layers className="w-4 h-4 inline mr-2" />
                              Palet Sayısı *
                            </label>
                            <input
                              type="number"
                              value={formData.palletCount}
                              onChange={(e) => handleInputChange('palletCount', e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                              placeholder="24"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <Weight className="w-4 h-4 inline mr-2" />
                              Toplam Ağırlık (kg) *
                            </label>
                            <input
                              type="number"
                              value={formData.weight}
                              onChange={(e) => handleInputChange('weight', e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                              placeholder="1500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-4">
                            <Ruler className="w-4 h-4 inline mr-2" />
                            Palet Ölçüleri (cm)
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Uzunluk</label>
                              <input
                                type="number"
                                value={formData.palletLength}
                                onChange={(e) => handleInputChange('palletLength', e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                                placeholder="120"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Genişlik</label>
                              <input
                                type="number"
                                value={formData.palletWidth}
                                onChange={(e) => handleInputChange('palletWidth', e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                                placeholder="80"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Yükseklik</label>
                              <input
                                type="number"
                                value={formData.palletHeight}
                                onChange={(e) => handleInputChange('palletHeight', e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                                placeholder="180"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gıda & Soğuk Zincir */}
                  {formData.mainCategory === 'food' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gıda Türü *</label>
                          <select
                            value={formData.foodType}
                            onChange={(e) => handleInputChange('foodType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Gıda türü seçin</option>
                            <option value="fresh">Taze Gıda</option>
                            <option value="frozen">Dondurulmuş</option>
                            <option value="beverage">İçecek</option>
                            <option value="dairy">Süt Ürünleri</option>
                            <option value="meat">Et Ürünleri</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sıcaklık Aralığı *</label>
                          <select
                            value={formData.temperatureRange}
                            onChange={(e) => handleInputChange('temperatureRange', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Sıcaklık seçin</option>
                            <option value="frozen">-18°C (Dondurulmuş)</option>
                            <option value="cold">0-4°C (Soğuk)</option>
                            <option value="cool">4-8°C (Serin)</option>
                            <option value="ambient">Oda Sıcaklığı</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50 kutu, 20 palet"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kimyasal & İlaç */}
                  {formData.mainCategory === 'chemical' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Kimyasal Türü *</label>
                          <select
                            value={formData.chemicalType}
                            onChange={(e) => handleInputChange('chemicalType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Kimyasal türü seçin</option>
                            <option value="pharmaceutical">İlaç</option>
                            <option value="cosmetic">Kozmetik</option>
                            <option value="cleaning">Temizlik Ürünü</option>
                            <option value="industrial">Endüstriyel Kimyasal</option>
                            <option value="paint">Boya & Vernik</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tehlike Sınıfı *</label>
                          <select
                            value={formData.hazardClass}
                            onChange={(e) => handleInputChange('hazardClass', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Tehlike sınıfı seçin</option>
                            <option value="class1">Sınıf 1 - Patlayıcılar</option>
                            <option value="class2">Sınıf 2 - Gazlar</option>
                            <option value="class3">Sınıf 3 - Yanıcı Sıvılar</option>
                            <option value="class4">Sınıf 4 - Yanıcı Katılar</option>
                            <option value="class5">Sınıf 5 - Oksitleyiciler</option>
                            <option value="class6">Sınıf 6 - Zehirli Maddeler</option>
                            <option value="class7">Sınıf 7 - Radyoaktif</option>
                            <option value="class8">Sınıf 8 - Aşındırıcılar</option>
                            <option value="class9">Sınıf 9 - Diğer Tehlikeli</option>
                            <option value="none">Tehlikeli Değil</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50 kutu, 20 şişe"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* İnşaat & Yapı Malzemesi */}
                  {formData.mainCategory === 'construction' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Malzeme Türü *</label>
                          <select
                            value={formData.materialType}
                            onChange={(e) => handleInputChange('materialType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Malzeme türü seçin</option>
                            <option value="cement">Çimento</option>
                            <option value="concrete">Beton</option>
                            <option value="steel">Çelik</option>
                            <option value="brick">Tuğla</option>
                            <option value="sand">Kum</option>
                            <option value="gravel">Çakıl</option>
                            <option value="tile">Karo</option>
                            <option value="paint">Boya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar *</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50 torba, 20 ton, 100 m²"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="5000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hacim (m³)</label>
                          <input
                            type="number"
                            value={formData.volume}
                            onChange={(e) => handleInputChange('volume', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="25"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobilya & Ev Eşyası */}
                  {formData.mainCategory === 'furniture' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Mobilya Türü *</label>
                          <select
                            value={formData.furnitureType}
                            onChange={(e) => handleInputChange('furnitureType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Mobilya türü seçin</option>
                            <option value="bedroom">Yatak Odası</option>
                            <option value="living_room">Oturma Odası</option>
                            <option value="dining_room">Yemek Odası</option>
                            <option value="kitchen">Mutfak</option>
                            <option value="office">Ofis</option>
                            <option value="outdoor">Bahçe</option>
                            <option value="appliance">Beyaz Eşya</option>
                            <option value="decoration">Dekorasyon</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Parça Sayısı *</label>
                          <input
                            type="text"
                            value={formData.pieceCount}
                            onChange={(e) => handleInputChange('pieceCount', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="3 parça, 1 takım, 5 adet"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="1500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hacim (m³)</label>
                          <input
                            type="number"
                            value={formData.volume}
                            onChange={(e) => handleInputChange('volume', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="25"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">En Büyük Parça Boyutları (cm)</label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Uzunluk</label>
                            <input
                              type="number"
                              value={formData.largestLength}
                              onChange={(e) => handleInputChange('largestLength', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Genişlik</label>
                            <input
                              type="number"
                              value={formData.largestWidth}
                              onChange={(e) => handleInputChange('largestWidth', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Yükseklik</label>
                            <input
                              type="number"
                              value={formData.largestHeight}
                              onChange={(e) => handleInputChange('largestHeight', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="150"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sökülme Durumu *</label>
                          <select
                            value={formData.disassemblyStatus}
                            onChange={(e) => handleInputChange('disassemblyStatus', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Sökülme durumu seçin</option>
                            <option value="assembled">Monte Edilmiş</option>
                            <option value="disassembled">Sökülmüş</option>
                            <option value="partial">Kısmen Sökülmüş</option>
                            <option value="needs_disassembly">Sökülmesi Gerekiyor</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Paketleme Durumu *</label>
                          <select
                            value={formData.packagingStatus}
                            onChange={(e) => handleInputChange('packagingStatus', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Paketleme durumu seçin</option>
                            <option value="packaged">Paketlenmiş</option>
                            <option value="unpackaged">Paketlenmemiş</option>
                            <option value="needs_packaging">Paketlenmesi Gerekiyor</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Özel Taşıma Gereksinimleri</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.fragile}
                              onChange={(e) => handleInputChange('fragile', e.target.checked)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm">Kırılabilir</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.antique}
                              onChange={(e) => handleInputChange('antique', e.target.checked)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm">Antika</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.oversized}
                              onChange={(e) => handleInputChange('oversized', e.target.checked)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm">Büyük Boyut</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.heavy}
                              onChange={(e) => handleInputChange('heavy', e.target.checked)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm">Ağır</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.needsCare}
                              onChange={(e) => handleInputChange('needsCare', e.target.checked)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm">Özenli Taşıma</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.valuable}
                              onChange={(e) => handleInputChange('valuable', e.target.checked)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm">Değerli</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Endüstriyel & Makine */}
                  {formData.mainCategory === 'industrial' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Makine Türü *</label>
                          <select
                            value={formData.machineType}
                            onChange={(e) => handleInputChange('machineType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Makine türü seçin</option>
                            <option value="cnc">CNC Tezgahı</option>
                            <option value="press">Pres Makinesi</option>
                            <option value="lathe">Torna Tezgahı</option>
                            <option value="milling">Freze Tezgahı</option>
                            <option value="welding">Kaynak Makinesi</option>
                            <option value="generator">Jeneratör</option>
                            <option value="compressor">Kompresör</option>
                            <option value="pump">Pompa</option>
                            <option value="other">Diğer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="2000"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="1 adet, 2 makine"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hacim (m³)</label>
                          <input
                            type="number"
                            value={formData.volume}
                            onChange={(e) => handleInputChange('volume', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="15"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Boyutlar (cm)</label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Uzunluk</label>
                            <input
                              type="number"
                              value={formData.dimensions.length}
                              onChange={(e) => handleDimensionsChange('length', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="300"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Genişlik</label>
                            <input
                              type="number"
                              value={formData.dimensions.width}
                              onChange={(e) => handleDimensionsChange('width', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Yükseklik</label>
                            <input
                              type="number"
                              value={formData.dimensions.height}
                              onChange={(e) => handleDimensionsChange('height', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="250"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tekstil & Giyim */}
                  {formData.mainCategory === 'textile' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Türü *</label>
                          <select
                            value={formData.textileType}
                            onChange={(e) => handleInputChange('textileType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Ürün türü seçin</option>
                            <option value="clothing">Giyim</option>
                            <option value="fabric">Kumaş</option>
                            <option value="home_textile">Ev Tekstili</option>
                            <option value="industrial_textile">Endüstriyel Tekstil</option>
                            <option value="shoes">Ayakkabı</option>
                            <option value="accessories">Aksesuar</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar *</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="1000 adet, 50 kutu, 20 palet"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Paket Sayısı</label>
                          <input
                            type="number"
                            value={formData.packageCount}
                            onChange={(e) => handleInputChange('packageCount', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Elektronik & Teknoloji */}
                  {formData.mainCategory === 'electronics' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Elektronik Türü *</label>
                          <select
                            value={formData.electronicsType}
                            onChange={(e) => handleInputChange('electronicsType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Elektronik türü seçin</option>
                            <option value="computer">Bilgisayar & Laptop</option>
                            <option value="phone">Telefon & Tablet</option>
                            <option value="tv">TV & Monitör</option>
                            <option value="audio">Ses Sistemi</option>
                            <option value="camera">Kamera & Fotoğraf</option>
                            <option value="gaming">Oyun Konsolu</option>
                            <option value="appliance">Ev Aletleri</option>
                            <option value="industrial">Endüstriyel Elektronik</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar *</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50 adet, 20 kutu"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Değer (₺)</label>
                          <input
                            type="number"
                            value={formData.value}
                            onChange={(e) => handleInputChange('value', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Otomotiv & Yedek Parça */}
                  {formData.mainCategory === 'automotive' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Parça Türü *</label>
                          <select
                            value={formData.autoPartType}
                            onChange={(e) => handleInputChange('autoPartType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Parça türü seçin</option>
                            <option value="tire">Lastik</option>
                            <option value="engine">Motor Parçası</option>
                            <option value="brake">Fren Sistemi</option>
                            <option value="suspension">Süspansiyon</option>
                            <option value="body">Karoseri</option>
                            <option value="interior">İç Donanım</option>
                            <option value="electrical">Elektrik</option>
                            <option value="accessory">Aksesuar</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar *</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="100 adet, 4 lastik"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Araç Markası</label>
                          <input
                            type="text"
                            value={formData.vehicleBrand}
                            onChange={(e) => handleInputChange('vehicleBrand', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Toyota, BMW, Ford"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tıbbi & Sağlık */}
                  {formData.mainCategory === 'medical' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tıbbi Ürün Türü *</label>
                          <select
                            value={formData.medicalType}
                            onChange={(e) => handleInputChange('medicalType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Ürün türü seçin</option>
                            <option value="medicine">İlaç</option>
                            <option value="equipment">Tıbbi Cihaz</option>
                            <option value="supplies">Tıbbi Malzeme</option>
                            <option value="vaccine">Aşı</option>
                            <option value="blood">Kan Ürünleri</option>
                            <option value="organ">Organ</option>
                            <option value="sample">Numune</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar *</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50 kutu, 100 adet"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sıcaklık Gereksinimi</label>
                          <select
                            value={formData.temperatureRequirement}
                            onChange={(e) => handleInputChange('temperatureRequirement', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Sıcaklık seçin</option>
                            <option value="frozen">-20°C (Dondurulmuş)</option>
                            <option value="cold">2-8°C (Soğuk)</option>
                            <option value="cool">15-25°C (Serin)</option>
                            <option value="room">Oda Sıcaklığı</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tarım & Hayvancılık */}
                  {formData.mainCategory === 'agricultural' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Türü *</label>
                          <select
                            value={formData.agriculturalType}
                            onChange={(e) => handleInputChange('agriculturalType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Ürün türü seçin</option>
                            <option value="grain">Tahıl</option>
                            <option value="vegetable">Sebze</option>
                            <option value="fruit">Meyve</option>
                            <option value="livestock">Canlı Hayvan</option>
                            <option value="feed">Yem</option>
                            <option value="seed">Tohum</option>
                            <option value="fertilizer">Gübre</option>
                            <option value="equipment">Tarım Aleti</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar *</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="1000 kg, 50 çuval, 20 ton"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="5000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hacim (m³)</label>
                          <input
                            type="number"
                            value={formData.volume}
                            onChange={(e) => handleInputChange('volume', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="30"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Özel Yük */}
                  {formData.mainCategory === 'special' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Özel Yük Türü *</label>
                          <select
                            value={formData.specialType}
                            onChange={(e) => handleInputChange('specialType', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Yük türü seçin</option>
                            <option value="art">Sanat Eseri</option>
                            <option value="antique">Antika</option>
                            <option value="jewelry">Mücevher</option>
                            <option value="document">Değerli Evrak</option>
                            <option value="cash">Nakit</option>
                            <option value="weapon">Silah</option>
                            <option value="explosive">Patlayıcı</option>
                            <option value="radioactive">Radyoaktif</option>
                            <option value="other">Diğer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Değer (₺) *</label>
                          <input
                            type="number"
                            value={formData.value}
                            onChange={(e) => handleInputChange('value', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="100000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sigorta Gerekli</label>
                          <select
                            value={formData.insuranceRequired}
                            onChange={(e) => handleInputChange('insuranceRequired', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seçin</option>
                            <option value="yes">Evet</option>
                            <option value="no">Hayır</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Diğer kategoriler için genel alanlar */}
                  {!['vehicle', 'general_cargo', 'food', 'chemical', 'construction', 'furniture', 'industrial', 'textile', 'electronics', 'automotive', 'medical', 'agricultural', 'special'].includes(formData.mainCategory) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="1500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Miktar *</label>
                          <input
                            type="text"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50 kutu, 20 palet, 1 makine"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Özel Gereksinimler</label>
                    <select
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Gerekli değil</option>
                      <option value="cold_chain">Soğuk Zincir</option>
                      <option value="fragile">Kırılabilir</option>
                      <option value="urgent">Acil Teslimat</option>
                      <option value="hazardous">Tehlikeli Madde</option>
                      <option value="oversized">Büyük Boyut</option>
                      <option value="secure">Güvenli Taşıma</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Yükleme Noktası */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Yükleme Noktası</h3>
                  <p className="text-sm text-slate-600">Yükün alınacağı adres</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Adres *</label>
                    <textarea
                      value={formData.pickupAddress}
                      onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                      rows={3}
                      className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none"
                      placeholder="Tam adres bilgisi"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Yükleme Tarihi *</label>
                    <input
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                      className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Teslimat Noktası */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Teslimat Noktası</h3>
                  <p className="text-sm text-slate-600">Yükün teslim edileceği adres</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Adres *</label>
                    <textarea
                      value={formData.deliveryAddress}
                      onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      rows={3}
                      className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none"
                      placeholder="Tam adres bilgisi"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Teslimat Tarihi *</label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">İletişim Bilgileri</h3>
                <p className="text-sm text-slate-600">Gönderi ile ilgili iletişim detayları</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">İletişim Kişisi *</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700"
                    placeholder="Ad Soyad"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700"
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Yayınlama Tercihi */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Yayınlama Tercihi</h3>
                <p className="text-sm text-slate-600">Gönderinizi nasıl yayınlamak istediğinizi seçin</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 border border-slate-200 rounded-xl hover:border-amber-300 transition-colors">
                  <input
                    type="radio"
                    id="all"
                    name="publishType"
                    value="all"
                    checked={formData.publishType === 'all'}
                    onChange={(e) => handleInputChange('publishType', e.target.value)}
                    className="w-5 h-5 text-amber-600 mt-1"
                  />
                  <label htmlFor="all" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-slate-900 mb-1">Tüm Nakliyecilere Yayınla</div>
                    <div className="text-sm text-slate-600">En iyi teklifleri almak için tüm nakliyecilere gönder</div>
                  </label>
                </div>
                
                <div className="flex items-start space-x-4 p-4 border border-slate-200 rounded-xl hover:border-amber-300 transition-colors">
                  <input
                    type="radio"
                    id="contracted"
                    name="publishType"
                    value="contracted"
                    checked={formData.publishType === 'contracted'}
                    onChange={(e) => handleInputChange('publishType', e.target.value)}
                    className="w-5 h-5 text-amber-600 mt-1"
                  />
                  <label htmlFor="contracted" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-slate-900 mb-1">Sadece Anlaşmalı Nakliyeciler</div>
                    <div className="text-sm text-slate-600">Sadece sözleşmeli nakliyecilerinize gönder</div>
                  </label>
                </div>
                
                <div className="flex items-start space-x-4 p-4 border border-slate-200 rounded-xl hover:border-amber-300 transition-colors">
                  <input
                    type="radio"
                    id="preferred"
                    name="publishType"
                    value="preferred"
                    checked={formData.publishType === 'preferred'}
                    onChange={(e) => handleInputChange('publishType', e.target.value)}
                    className="w-5 h-5 text-amber-600 mt-1"
                  />
                  <label htmlFor="preferred" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-slate-900 mb-1">Öncelikli Nakliyeciler</div>
                    <div className="text-sm text-slate-600">Belirli nakliyecileri öncelikli olarak seç</div>
                  </label>
                </div>
              </div>
            </div>

            {/* Gönderi Önizleme */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Gönderi Önizleme</h3>
                <p className="text-sm text-slate-600">Gönderinizin nasıl görüneceğini kontrol edin</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-4">Yük Bilgileri</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Kategori:</span>
                        <span className="font-medium text-slate-900">{getSelectedCategory()?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Açıklama:</span>
                        <span className="font-medium text-slate-900">{formData.productDescription}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ağırlık:</span>
                        <span className="font-medium text-slate-900">{formData.weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Miktar:</span>
                        <span className="font-medium text-slate-900">{formData.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Boyutlar:</span>
                        <span className="font-medium text-slate-900">
                          {formData.dimensions.length}x{formData.dimensions.width}x{formData.dimensions.height} cm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Özel Gereksinimler:</span>
                        <span className="font-medium text-slate-900">
                          {formData.specialRequirements || 'Yok'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-4">Güzergah</h4>
                    <div className="space-y-4 text-sm">
                      <div>
                        <span className="text-slate-600 font-medium">Yükleme:</span>
                        <div className="font-medium text-slate-900 mt-1">{formData.pickupAddress}</div>
                        <div className="text-slate-500">{formData.pickupDate}</div>
                      </div>
                      <div>
                        <span className="text-slate-600 font-medium">Teslimat:</span>
                        <div className="font-medium text-slate-900 mt-1">{formData.deliveryAddress}</div>
                        <div className="text-slate-500">{formData.deliveryDate}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-4">İletişim</h4>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-slate-900">{formData.contactPerson}</div>
                      <div className="text-slate-600">{formData.phone}</div>
                      <div className="text-slate-600">{formData.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bilgi Kutusu */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-amber-600 text-lg">ℹ️</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-3">Nasıl Çalışır?</div>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p>1. <strong>Nakliyeciler</strong> yükünüzü görüp fiyat teklifi verecek</p>
                    <p>2. <strong>En uygun teklifi</strong> seçerek nakliyeciyi atayacaksınız</p>
                    <p>3. <strong>Nakliyeci</strong> aracını yönlendirip nokta atışı teslimat yapacak</p>
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
    { label: 'Gönderi Oluştur', icon: <Package className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Gönderi{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Oluşturun</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">3 adımda kolay gönderi oluşturma</p>
        </div>

        {/* Progress Steps Card - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all ${
                      currentStep >= step.id 
                        ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg' 
                        : 'bg-slate-100 text-slate-500'
                }`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.id 
                      ? 'bg-white/20' 
                      : 'bg-slate-200'
                  }`}>
                    {currentStep > step.id ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : step.icon}
                  </div>
                  <span className="font-medium text-sm sm:text-base">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 ${
                        currentStep > step.id ? 'bg-gradient-to-r from-slate-800 to-blue-900' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 md:p-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
            >
              İleri
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
            >
              <Send className="w-4 h-4 mr-2" />
              Yayınla
            </button>
          )}
        </div>

        {/* Success Message */}
        <SuccessMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onClose={() => setShowSuccessMessage(false)}
        />
      </div>
    </div>
  );
}