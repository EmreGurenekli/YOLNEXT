import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  Weight, 
  Ruler, 
  AlertTriangle, 
  Thermometer, 
  Shield, 
  Truck, 
  Users, 
  FileText, 
  Save, 
  ArrowLeft,
  Plus,
  X,
  Check,
  Info,
  Star,
  Building2,
  Target,
  Zap,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CorporatePageTemplate from './Template';

export default function CreateShipment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Temel Bilgiler
    shipmentType: '',
    priority: 'normal',
    deliveryType: 'door',
    insurance: 'none',
    
    // Yük Detayları
    category: '',
    subCategory: '',
    weight: '',
    volume: '',
    quantity: '',
    dimensions: { length: '', width: '', height: '' },
    specialRequirements: [] as string[],
    hazardousClass: '',
    
    // Güzergah Bilgileri
    pickupLocation: '',
    deliveryLocation: '',
    intermediateStops: [] as string[],
    pickupDate: '',
    pickupTime: '',
    deliveryDate: '',
    deliveryTime: '',
    specialInstructions: '',
    
    // Nakliyeci Seçimi
    carrierSelection: 'all',
    preferredCarriers: [] as string[],
    excludedCarriers: [] as string[],
    
    // Maliyet Bilgileri
    budgetLimit: '',
    paymentMethod: 'invoice',
    invoiceInfo: '',
    taxExemption: false
  });

  const [isSaving, setIsSaving] = useState(false);

  const steps = [
    { id: 1, title: 'Temel Bilgiler', icon: <FileText size={20} /> },
    { id: 2, title: 'Yük Detayları', icon: <Package size={20} /> },
    { id: 3, title: 'Güzergah', icon: <MapPin size={20} /> },
    { id: 4, title: 'Nakliyeci', icon: <Truck size={20} /> },
    { id: 5, title: 'Maliyet', icon: <DollarSign size={20} /> },
    { id: 6, title: 'Özet', icon: <Check size={20} /> }
  ];

  const shipmentTypes = [
    { value: 'cargo', label: 'Kargo', icon: <Package size={20} /> },
    { value: 'logistics', label: 'Lojistik', icon: <Truck size={20} /> },
    { value: 'cold_chain', label: 'Soğuk Zincir', icon: <Thermometer size={20} /> },
    { value: 'hazardous', label: 'Tehlikeli Madde', icon: <AlertTriangle size={20} /> },
    { value: 'fragile', label: 'Kırılabilir', icon: <Shield size={20} /> }
  ];

  const categories = [
    { value: 'food', label: 'Gıda', subcategories: ['Taze Gıda', 'Dondurulmuş', 'Konserve', 'İçecek'] },
    { value: 'textile', label: 'Tekstil', subcategories: ['Giyim', 'Ev Tekstili', 'Endüstriyel', 'Moda'] },
    { value: 'electronics', label: 'Elektronik', subcategories: ['Bilgisayar', 'Telefon', 'TV', 'Ev Aletleri'] },
    { value: 'chemical', label: 'Kimyasal', subcategories: ['Temizlik', 'Kozmetik', 'İlaç', 'Endüstriyel'] },
    { value: 'furniture', label: 'Mobilya', subcategories: ['Ev Mobilyası', 'Ofis', 'Bahçe', 'Antika'] },
    { value: 'automotive', label: 'Otomotiv', subcategories: ['Yedek Parça', 'Aksesuar', 'Lastik', 'Motor'] }
  ];

  const specialRequirements = [
    { id: 'cold', label: 'Soğuk Taşıma', icon: <Thermometer size={16} /> },
    { id: 'hot', label: 'Sıcak Taşıma', icon: <Thermometer size={16} /> },
    { id: 'fragile', label: 'Kırılabilir', icon: <Shield size={16} /> },
    { id: 'urgent', label: 'Acil', icon: <Zap size={16} /> },
    { id: 'secure', label: 'Güvenli', icon: <Shield size={16} /> },
    { id: 'oversized', label: 'Büyük Boyut', icon: <Ruler size={16} /> }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialRequirementToggle = (requirementId: string) => {
    setFormData(prev => ({
      ...prev,
      specialRequirements: prev.specialRequirements.includes(requirementId)
        ? prev.specialRequirements.filter(id => id !== requirementId)
        : [...prev.specialRequirements, requirementId]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Gönderi başarıyla oluşturuldu!');
      // Reset form or redirect
    } catch (error) {
      alert('Hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Gönderi Türü *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {shipmentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleInputChange('shipmentType', type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.shipmentType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {type.icon}
                      <span className="font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik Seviyesi *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Düşük</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teslimat Türü *</label>
                <select
                  value={formData.deliveryType}
                  onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="door">Kapıda Teslimat</option>
                  <option value="warehouse">Depo Teslimatı</option>
                  <option value="terminal">Terminal Teslimatı</option>
                  <option value="appointment">Randevulu Teslimat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sigorta Kapsamı</label>
              <select
                value={formData.insurance}
                onChange={(e) => handleInputChange('insurance', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">Sigorta Yok</option>
                <option value="partial">Kısmi Sigorta</option>
                <option value="full">Tam Sigorta</option>
                <option value="custom">Özel Sigorta</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Kategori *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleInputChange('category', category.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.category === category.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">{category.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {formData.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Alt Kategori *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {categories.find(c => c.value === formData.category)?.subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleInputChange('subCategory', sub)}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.subCategory === sub
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık (kg) *</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hacim (m³)</label>
                <input
                  type="number"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adet/Palet</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Boyutlar (cm)</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Uzunluk</label>
                  <input
                    type="number"
                    value={formData.dimensions.length}
                    onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, length: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Genişlik</label>
                  <input
                    type="number"
                    value={formData.dimensions.width}
                    onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, width: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Yükseklik</label>
                  <input
                    type="number"
                    value={formData.dimensions.height}
                    onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, height: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Özel Gereksinimler</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {specialRequirements.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => handleSpecialRequirementToggle(req.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.specialRequirements.includes(req.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {req.icon}
                      <span className="text-sm font-medium">{req.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {formData.shipmentType === 'hazardous' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tehlikeli Madde Sınıfı *</label>
                <select
                  value={formData.hazardousClass}
                  onChange={(e) => handleInputChange('hazardousClass', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seçiniz</option>
                  <option value="class1">Sınıf 1 - Patlayıcılar</option>
                  <option value="class2">Sınıf 2 - Gazlar</option>
                  <option value="class3">Sınıf 3 - Yanıcı Sıvılar</option>
                  <option value="class4">Sınıf 4 - Yanıcı Katılar</option>
                  <option value="class5">Sınıf 5 - Oksitleyiciler</option>
                  <option value="class6">Sınıf 6 - Zehirli Maddeler</option>
                  <option value="class7">Sınıf 7 - Radyoaktif</option>
                  <option value="class8">Sınıf 8 - Aşındırıcılar</option>
                  <option value="class9">Sınıf 9 - Diğer Tehlikeli</option>
                </select>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yükleme Noktası *</label>
                <input
                  type="text"
                  value={formData.pickupLocation}
                  onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adres, şehir"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teslimat Noktası *</label>
                <input
                  type="text"
                  value={formData.deliveryLocation}
                  onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adres, şehir"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yükleme Tarihi *</label>
                <input
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yükleme Saati *</label>
                <input
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teslimat Tarihi *</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teslimat Saati *</label>
                <input
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Özel Talimatlar</label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Özel talimatlarınızı yazın..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Nakliyeci Seçimi *</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
                  <input
                    type="radio"
                    name="carrierSelection"
                    value="all"
                    checked={formData.carrierSelection === 'all'}
                    onChange={(e) => handleInputChange('carrierSelection', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Tüm Nakliyecilere Yayınla</div>
                    <div className="text-sm text-gray-500">En iyi teklifleri almak için tüm nakliyecilere gönder</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
                  <input
                    type="radio"
                    name="carrierSelection"
                    value="contracted"
                    checked={formData.carrierSelection === 'contracted'}
                    onChange={(e) => handleInputChange('carrierSelection', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Sadece Anlaşmalı Nakliyeciler</div>
                    <div className="text-sm text-gray-500">Sadece sözleşmeli nakliyecilerinize gönder</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
                  <input
                    type="radio"
                    name="carrierSelection"
                    value="preferred"
                    checked={formData.carrierSelection === 'preferred'}
                    onChange={(e) => handleInputChange('carrierSelection', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Öncelikli Nakliyeciler</div>
                    <div className="text-sm text-gray-500">Belirli nakliyecileri öncelikli olarak seç</div>
                  </div>
                </label>
              </div>
            </div>

            {formData.carrierSelection === 'preferred' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Öncelikli Nakliyeciler</label>
                <div className="space-y-2">
                  {['Kargo Express A.Ş.', 'Hızlı Lojistik', 'Güvenli Taşımacılık'].map((carrier) => (
                    <label key={carrier} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <input type="checkbox" className="w-4 h-4 text-blue-600" />
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{carrier}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-500">4.8</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Engellenen Nakliyeciler</label>
              <div className="space-y-2">
                {['Mega Kargo', 'Hızlı Taşımacılık'].map((carrier) => (
                  <label key={carrier} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <input type="checkbox" className="w-4 h-4 text-red-600" />
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{carrier}</span>
                      <span className="text-sm text-red-500">Engellenmiş</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bütçe Limiti (₺)</label>
              <input
                type="number"
                value={formData.budgetLimit}
                onChange={(e) => handleInputChange('budgetLimit', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Şekli *</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="invoice">Fatura ile Ödeme</option>
                <option value="cash">Nakit Ödeme</option>
                <option value="card">Kredi Kartı</option>
                <option value="bank_transfer">Banka Havalesi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fatura Bilgileri</label>
              <textarea
                value={formData.invoiceInfo}
                onChange={(e) => handleInputChange('invoiceInfo', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Fatura adresi ve diğer bilgiler..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="taxExemption"
                checked={formData.taxExemption}
                onChange={(e) => handleInputChange('taxExemption', e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="taxExemption" className="text-sm font-medium text-gray-700">
                Vergi Muafiyeti Var
              </label>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Check className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Gönderi Özeti</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Gönderi Türü:</div>
                  <div className="text-gray-600">{shipmentTypes.find(t => t.value === formData.shipmentType)?.label}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Kategori:</div>
                  <div className="text-gray-600">{formData.category} - {formData.subCategory}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Ağırlık:</div>
                  <div className="text-gray-600">{formData.weight} kg</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Güzergah:</div>
                  <div className="text-gray-600">{formData.pickupLocation} → {formData.deliveryLocation}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Nakliyeci Seçimi:</div>
                  <div className="text-gray-600">
                    {formData.carrierSelection === 'all' ? 'Tüm Nakliyeciler' :
                     formData.carrierSelection === 'contracted' ? 'Anlaşmalı Nakliyeciler' :
                     'Öncelikli Nakliyeciler'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Bütçe:</div>
                  <div className="text-gray-600">₺{formData.budgetLimit || 'Belirtilmemiş'}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800 mb-1">Önemli Bilgi</div>
                  <div className="text-sm text-yellow-700">
                    Gönderiniz oluşturulduktan sonra nakliyecilerden teklifler almaya başlayacaksınız. 
                    En uygun teklifi seçerek gönderinizi başlatabilirsiniz.
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

  return (
    <CorporatePageTemplate
      title="Gönderi Oluştur"
      description="Gelişmiş gönderi oluşturma formu"
      icon={<Package className="w-6 h-6 text-white" />}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/corporate/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gönderi Oluştur</h1>
              <p className="text-gray-600">Gelişmiş gönderi oluşturma formu ile detaylı gönderi bilgileri girin</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.id 
                      ? 'bg-white/20' 
                      : 'bg-gray-200'
                  }`}>
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className="font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Geri
            </button>

            <div className="flex items-center gap-4">
              {currentStep < steps.length ? (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  İleri
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Gönderi Oluştur
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CorporatePageTemplate>
  );
}