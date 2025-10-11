import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Weight, 
  FileText, 
  Truck,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  Eye,
  Clock,
  Shield,
  Star,
  Zap,
  Car,
  Truck as TruckIcon,
  Box,
  Home,
  Building,
  Palette,
  Music,
  Gamepad2,
  Laptop,
  Shirt,
  Book,
  Camera,
  Heart,
  Gift,
  Briefcase,
  Wrench,
  TreePine,
  Utensils,
  Dumbbell,
  Car as CarIcon,
  Plane,
  Ship,
  Train
} from 'lucide-react'

const IndividualCreateShipment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  
  const [formData, setFormData] = useState({
    // Temel Bilgiler
    category: '',
    subCategory: '',
    
    // Gönderici Bilgileri
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    
    // Alıcı Bilgileri
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    
    // Gönderi Detayları
    packageType: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    value: '',
    description: '',
    deliveryDate: '',
    specialInstructions: '',
    insurance: false,
    
    // Araç Bilgileri (Kamyon/Tır için)
    vehicleType: '',
    vehicleModel: '',
    vehicleYear: '',
    licensePlate: '',
    
    // Eşya Detayları
    itemCondition: '',
    itemBrand: '',
    itemModel: '',
    itemColor: '',
    
    // Özel Gereksinimler
    specialHandling: false,
    fragile: false,
    hazardous: false,
    temperatureControlled: false,
    
    // Teslimat Tercihleri
    deliveryTime: '',
    deliveryMethod: '',
    signatureRequired: true,
    smsNotification: true,
    emailNotification: true
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ana Kategoriler
  const mainCategories = [
    {
      id: 'vehicle',
      name: 'Araç Taşımacılığı',
      description: 'Kamyon, tır, otomobil, motosiklet taşıma',
      icon: TruckIcon,
      color: 'from-blue-600 to-indigo-700',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'furniture',
      name: 'Ev Eşyası Taşıma',
      description: 'Mobilya, beyaz eşya, dekorasyon',
      icon: Home,
      color: 'from-emerald-600 to-teal-700',
      bgColor: 'from-emerald-50 to-teal-50'
    },
    {
      id: 'electronics',
      name: 'Elektronik Eşya',
      description: 'Bilgisayar, telefon, TV, ses sistemi',
      icon: Laptop,
      color: 'from-purple-600 to-pink-700',
      bgColor: 'from-purple-50 to-pink-50'
    },
    {
      id: 'personal',
      name: 'Kişisel Eşya',
      description: 'Giyim, kitap, müzik aleti, spor ekipmanı',
      icon: Shirt,
      color: 'from-orange-600 to-amber-700',
      bgColor: 'from-orange-50 to-amber-50'
    },
    {
      id: 'business',
      name: 'İş Ekipmanı',
      description: 'Ofis malzemesi, endüstriyel ekipman',
      icon: Briefcase,
      color: 'from-slate-600 to-gray-700',
      bgColor: 'from-slate-50 to-gray-50'
    },
    {
      id: 'special',
      name: 'Özel Eşya',
      description: 'Sanat eseri, antika, mücevher',
      icon: Star,
      color: 'from-rose-600 to-pink-700',
      bgColor: 'from-rose-50 to-pink-50'
    }
  ]

  // Alt Kategoriler
  const subCategories = {
    vehicle: [
      { id: 'truck', name: 'Kamyon', icon: TruckIcon, description: 'Kamyon taşıma hizmeti' },
      { id: 'tractor', name: 'Tır', icon: TruckIcon, description: 'Tır taşıma hizmeti' },
      { id: 'car', name: 'Otomobil', icon: Car, description: 'Otomobil taşıma hizmeti' },
      { id: 'motorcycle', name: 'Motosiklet', icon: Car, description: 'Motosiklet taşıma hizmeti' },
      { id: 'bicycle', name: 'Bisiklet', icon: Car, description: 'Bisiklet taşıma hizmeti' }
    ],
    furniture: [
      { id: 'living_room', name: 'Oturma Odası', icon: Home, description: 'Koltuk, masa, sehpa' },
      { id: 'bedroom', name: 'Yatak Odası', icon: Home, description: 'Yatak, gardırop, komodin' },
      { id: 'kitchen', name: 'Mutfak', icon: Utensils, description: 'Buzdolabı, fırın, masa' },
      { id: 'office', name: 'Ofis Mobilyası', icon: Building, description: 'Masa, sandalye, dolap' }
    ],
    electronics: [
      { id: 'computer', name: 'Bilgisayar', icon: Laptop, description: 'PC, laptop, tablet' },
      { id: 'tv', name: 'TV & Ses', icon: Music, description: 'Televizyon, hoparlör' },
      { id: 'phone', name: 'Telefon', icon: Phone, description: 'Cep telefonu, sabit telefon' },
      { id: 'camera', name: 'Kamera', icon: Camera, description: 'Fotoğraf makinesi, kamera' }
    ],
    personal: [
      { id: 'clothing', name: 'Giyim', icon: Shirt, description: 'Elbise, ayakkabı, aksesuar' },
      { id: 'books', name: 'Kitap', icon: Book, description: 'Kitap, dergi, belge' },
      { id: 'sports', name: 'Spor', icon: Dumbbell, description: 'Spor ekipmanı, alet' },
      { id: 'music', name: 'Müzik', icon: Music, description: 'Enstrüman, müzik aleti' }
    ],
    business: [
      { id: 'office', name: 'Ofis Malzemesi', icon: Building, description: 'Ofis ekipmanı' },
      { id: 'industrial', name: 'Endüstriyel', icon: Wrench, description: 'Makine, ekipman' },
      { id: 'medical', name: 'Tıbbi', icon: Heart, description: 'Tıbbi cihaz, ekipman' },
      { id: 'retail', name: 'Perakende', icon: Box, description: 'Mağaza ekipmanı' }
    ],
    special: [
      { id: 'art', name: 'Sanat Eseri', icon: Palette, description: 'Tablo, heykel, sanat' },
      { id: 'antique', name: 'Antika', icon: Star, description: 'Antika eşya, koleksiyon' },
      { id: 'jewelry', name: 'Mücevher', icon: Heart, description: 'Takı, mücevher' },
      { id: 'gift', name: 'Hediye', icon: Gift, description: 'Özel hediye, paket' }
    ]
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleDimensionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [name]: value
      }
    }))
  }

  const handleCategorySelect = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      subCategory: ''
    }))
    setSelectedCategory(categoryId)
    setCurrentStep(2)
  }

  const handleSubCategorySelect = (subCategoryId: string) => {
    setFormData(prev => ({
      ...prev,
      subCategory: subCategoryId
    }))
    setCurrentStep(3)
  }

  const generateTrackingCode = () => {
    const prefix = 'YN'
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}${timestamp}${random}`
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    // Temel validasyonlar
    if (!formData.category) {
      newErrors.category = 'Kategori seçiniz'
    }
    if (!formData.subCategory) {
      newErrors.subCategory = 'Alt kategori seçiniz'
    }
    if (!formData.senderName.trim()) {
      newErrors.senderName = 'Gönderici adı gereklidir'
    }
    if (!formData.senderPhone.trim()) {
      newErrors.senderPhone = 'Gönderici telefonu gereklidir'
    }
    if (!formData.senderAddress.trim()) {
      newErrors.senderAddress = 'Gönderici adresi gereklidir'
    }
    if (!formData.receiverName.trim()) {
      newErrors.receiverName = 'Alıcı adı gereklidir'
    }
    if (!formData.receiverPhone.trim()) {
      newErrors.receiverPhone = 'Alıcı telefonu gereklidir'
    }
    if (!formData.receiverAddress.trim()) {
      newErrors.receiverAddress = 'Alıcı adresi gereklidir'
    }
    if (!formData.weight) {
      newErrors.weight = 'Ağırlık gereklidir'
    }
    if (!formData.value) {
      newErrors.value = 'Değer gereklidir'
    }
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Teslimat tarihi gereklidir'
    }
    
    // Araç taşımacılığı için özel validasyonlar
    if (formData.category === 'vehicle') {
      if (!formData.vehicleType) {
        newErrors.vehicleType = 'Araç türü gereklidir'
      }
      if (!formData.licensePlate) {
        newErrors.licensePlate = 'Plaka numarası gereklidir'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate tracking number
      const trackingNumber = generateTrackingCode()
      setTrackingCode(trackingNumber)
      
      // Show success message
      alert(`Gönderi başarıyla oluşturuldu!\nTakip numarası: ${trackingNumber}`)
      
      // Reset form
      setFormData({
        category: '',
        subCategory: '',
        senderName: '',
        senderPhone: '',
        senderAddress: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        packageType: '',
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        value: '',
        description: '',
        deliveryDate: '',
        specialInstructions: '',
        insurance: false,
        vehicleType: '',
        vehicleModel: '',
        vehicleYear: '',
        licensePlate: '',
        itemCondition: '',
        itemBrand: '',
        itemModel: '',
        itemColor: '',
        specialHandling: false,
        fragile: false,
        hazardous: false,
        temperatureControlled: false,
        deliveryTime: '',
        deliveryMethod: '',
        signatureRequired: true,
        smsNotification: true,
        emailNotification: true
      })
      
      setCurrentStep(1)
      setSelectedCategory('')
      setShowPreview(false)
    } catch (error) {
      alert('Gönderi oluşturulurken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">🚛 YENİ TASARIM - Taşınacak Eşya Türünü Seçin</h2>
                <p className="text-slate-600 text-lg">Hangi tür eşya taşıyacağınızı belirleyin, size özel form alanları hazırlayalım</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mainCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br ${category.bgColor} border-2 border-transparent hover:border-slate-300`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{category.name}</h3>
                        <p className="text-slate-600 text-sm">{category.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Alt Kategori Seçin</h2>
                <p className="text-slate-600 text-lg">Daha spesifik bir kategori seçerek size en uygun hizmeti sunalım</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subCategories[selectedCategory as keyof typeof subCategories]?.map((subCategory) => {
                  const IconComponent = subCategory.icon
                  return (
                    <button
                      key={subCategory.id}
                      onClick={() => handleSubCategorySelect(subCategory.id)}
                      className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-transparent hover:border-slate-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{subCategory.name}</h3>
                        <p className="text-slate-600 text-sm">{subCategory.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Gönderici Bilgileri */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Gönderici Bilgileri</h2>
                    <p className="text-sm text-slate-600">Gönderiyi yapan kişi bilgileri</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Gönderici Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      name="senderName"
                      value={formData.senderName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      placeholder="Adınız ve soyadınız"
                    />
                    {errors.senderName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.senderName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon Numarası *
                    </label>
                    <input
                      type="tel"
                      name="senderPhone"
                      value={formData.senderPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      placeholder="+90 555 123 45 67"
                    />
                    {errors.senderPhone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.senderPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Gönderici Adresi *
                  </label>
                  <textarea
                    name="senderAddress"
                    value={formData.senderAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                    placeholder="Tam adres bilgisi"
                  />
                  {errors.senderAddress && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.senderAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Alıcı Bilgileri */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Alıcı Bilgileri</h2>
                    <p className="text-sm text-slate-600">Gönderinin ulaşacağı kişi bilgileri</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Alıcı Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      name="receiverName"
                      value={formData.receiverName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      placeholder="Alıcı adı soyadı"
                    />
                    {errors.receiverName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.receiverName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon Numarası *
                    </label>
                    <input
                      type="tel"
                      name="receiverPhone"
                      value={formData.receiverPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      placeholder="+90 555 123 45 67"
                    />
                    {errors.receiverPhone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.receiverPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Alıcı Adresi *
                  </label>
                  <textarea
                    name="receiverAddress"
                    value={formData.receiverAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                    placeholder="Tam adres bilgisi"
                  />
                  {errors.receiverAddress && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.receiverAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Eşya Detayları */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Eşya Detayları</h2>
                    <p className="text-sm text-slate-600">Taşınacak eşyanın detayları</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ağırlık (kg) *
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      placeholder="0.0"
                    />
                    {errors.weight && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.weight}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Değer (₺) *
                    </label>
                    <input
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      placeholder="0"
                    />
                    {errors.value && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.value}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Eşya Açıklaması
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                    placeholder="Eşya hakkında detaylı bilgi"
                  />
                </div>
              </div>
            </div>

            {/* Araç Bilgileri (Sadece araç taşımacılığı için) */}
            {formData.category === 'vehicle' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-700 rounded-xl flex items-center justify-center shadow-lg">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Araç Bilgileri</h2>
                      <p className="text-sm text-slate-600">Taşınacak araç detayları</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Araç Türü *
                      </label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                      >
                        <option value="">Araç türü seçiniz</option>
                        <option value="truck">Kamyon</option>
                        <option value="tractor">Tır</option>
                        <option value="car">Otomobil</option>
                        <option value="motorcycle">Motosiklet</option>
                        <option value="bicycle">Bisiklet</option>
                      </select>
                      {errors.vehicleType && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.vehicleType}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Plaka Numarası *
                      </label>
                      <input
                        type="text"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="34 ABC 123"
                      />
                      {errors.licensePlate && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.licensePlate}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Araç Modeli
                      </label>
                      <input
                        type="text"
                        name="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="Araç modeli"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Model Yılı
                      </label>
                      <input
                        type="number"
                        name="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="2020"
                        min="1900"
                        max="2024"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Teslimat Bilgileri */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-pink-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Teslimat Bilgileri</h2>
                    <p className="text-sm text-slate-600">Teslimat tarihi ve tercihleri</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Teslimat Tarihi *
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                    />
                    {errors.deliveryDate && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.deliveryDate}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Teslimat Saati
                    </label>
                    <select
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                    >
                      <option value="">Saat seçiniz</option>
                      <option value="morning">Sabah (08:00-12:00)</option>
                      <option value="afternoon">Öğleden Sonra (12:00-17:00)</option>
                      <option value="evening">Akşam (17:00-20:00)</option>
                      <option value="flexible">Esnek</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Özel Talimatlar
                  </label>
                  <textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                    placeholder="Teslimat için özel talimatlar"
                  />
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center">
                      <input
                        id="insurance"
                        name="insurance"
                        type="checkbox"
                        checked={formData.insurance}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-slate-300 rounded"
                      />
                      <label htmlFor="insurance" className="ml-3 block text-sm font-semibold text-slate-700">
                        Sigorta kapsamına dahil et
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-8">Gönderiniz değerinin %1'i oranında sigorta ücreti eklenecektir</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        id="signatureRequired"
                        name="signatureRequired"
                        type="checkbox"
                        checked={formData.signatureRequired}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-slate-300 rounded"
                      />
                      <label htmlFor="signatureRequired" className="ml-3 block text-sm font-semibold text-slate-700">
                        İmza gerekli
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="smsNotification"
                        name="smsNotification"
                        type="checkbox"
                        checked={formData.smsNotification}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-slate-300 rounded"
                      />
                      <label htmlFor="smsNotification" className="ml-3 block text-sm font-semibold text-slate-700">
                        SMS bildirimi
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-700 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Eye className="w-5 h-5" />
                Önizleme
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Gönderi Oluştur</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Gönderi Önizleme</h2>
                <p className="text-slate-600 text-lg">Gönderi detaylarınızı kontrol edin ve onaylayın</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sol Taraf - Gönderi Bilgileri */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Gönderi Bilgileri</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Kategori:</span>
                        <span className="font-semibold text-slate-900">
                          {mainCategories.find(c => c.id === formData.category)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Alt Kategori:</span>
                        <span className="font-semibold text-slate-900">
                          {subCategories[formData.category as keyof typeof subCategories]?.find(s => s.id === formData.subCategory)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ağırlık:</span>
                        <span className="font-semibold text-slate-900">{formData.weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Değer:</span>
                        <span className="font-semibold text-slate-900">₺{formData.value}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sigorta:</span>
                        <span className="font-semibold text-slate-900">
                          {formData.insurance ? 'Evet' : 'Hayır'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Gönderici</h3>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900">{formData.senderName}</p>
                      <p className="text-slate-600">{formData.senderPhone}</p>
                      <p className="text-sm text-slate-500">{formData.senderAddress}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Alıcı</h3>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900">{formData.receiverName}</p>
                      <p className="text-slate-600">{formData.receiverPhone}</p>
                      <p className="text-sm text-slate-500">{formData.receiverAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Sağ Taraf - Teslimat ve Özellikler */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Teslimat</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tarih:</span>
                        <span className="font-semibold text-slate-900">{formData.deliveryDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Saat:</span>
                        <span className="font-semibold text-slate-900">
                          {formData.deliveryTime || 'Belirtilmemiş'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">İmza:</span>
                        <span className="font-semibold text-slate-900">
                          {formData.signatureRequired ? 'Gerekli' : 'Gerekli değil'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {formData.category === 'vehicle' && (
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Araç Bilgileri</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tür:</span>
                          <span className="font-semibold text-slate-900">{formData.vehicleType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Plaka:</span>
                          <span className="font-semibold text-slate-900">{formData.licensePlate}</span>
                        </div>
                        {formData.vehicleModel && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Model:</span>
                            <span className="font-semibold text-slate-900">{formData.vehicleModel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Bildirimler</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${formData.smsNotification ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-slate-600">SMS Bildirimi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${formData.emailNotification ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-slate-600">E-posta Bildirimi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Gönderi Oluştur</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Helmet>
        <title>Yeni Gönderi Oluştur - YolNet</title>
        <meta name="description" content="Yeni gönderi oluşturun ve güvenli taşımacılık hizmetinden yararlanın." />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 rounded-3xl shadow-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-40 -translate-x-40"></div>
          
          <div className="relative z-10 px-8 py-8">
            <div className="flex items-center gap-6">
              <Link
                to="/individual/dashboard"
                className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  🚛 YENİ TASARIM - Profesyonel Gönderi Oluştur
                </h1>
                <p className="text-white/80 text-lg">Kamyon, tır, eşya taşımacılığı için güvenli ve profesyonel hizmet</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                  <span className="text-white/80 font-medium text-sm">Adım {currentStep}/4</span>
                </div>
                <div className="bg-emerald-500 rounded-2xl px-4 py-2 shadow-lg">
                  <span className="text-white font-bold text-sm">%20 İndirim</span>
                </div>
                {trackingCode && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                    <span className="text-white font-bold text-sm">Takip: {trackingCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Gönderi Oluşturma</h3>
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  currentStep >= 1 ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 1 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700' 
                      : 'bg-slate-200'
                  }`}>
                    <span className={`font-bold text-sm ${
                      currentStep >= 1 ? 'text-white' : 'text-slate-500'
                    }`}>1</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      currentStep >= 1 ? 'text-slate-900' : 'text-slate-600'
                    }`}>Kategori Seçimi</p>
                    <p className="text-sm text-slate-500">Taşınacak eşya türü</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  currentStep >= 2 ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 2 
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700' 
                      : 'bg-slate-200'
                  }`}>
                    <span className={`font-bold text-sm ${
                      currentStep >= 2 ? 'text-white' : 'text-slate-500'
                    }`}>2</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      currentStep >= 2 ? 'text-slate-900' : 'text-slate-600'
                    }`}>Detay Bilgileri</p>
                    <p className="text-sm text-slate-500">Eşya ve adres bilgileri</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  currentStep >= 3 ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 3 
                      ? 'bg-gradient-to-br from-orange-600 to-amber-700' 
                      : 'bg-slate-200'
                  }`}>
                    <span className={`font-bold text-sm ${
                      currentStep >= 3 ? 'text-white' : 'text-slate-500'
                    }`}>3</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      currentStep >= 3 ? 'text-slate-900' : 'text-slate-600'
                    }`}>Teslimat</p>
                    <p className="text-sm text-slate-500">Tarih ve tercihler</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  currentStep >= 4 ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 4 
                      ? 'bg-gradient-to-br from-purple-600 to-pink-700' 
                      : 'bg-slate-200'
                  }`}>
                    <span className={`font-bold text-sm ${
                      currentStep >= 4 ? 'text-white' : 'text-slate-500'
                    }`}>4</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      currentStep >= 4 ? 'text-slate-900' : 'text-slate-600'
                    }`}>Önizleme</p>
                    <p className="text-sm text-slate-500">Gönderi özeti</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndividualCreateShipment











