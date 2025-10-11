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
  Train,
  AlertTriangle,
  Bell,
  Monitor,
  Thermometer,
  Snowflake,
  Flame,
  AlertOctagon
} from 'lucide-react'

const NewCreateShipment: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  
  const [formData, setFormData] = useState({
    // Yük Kategorisi
    cargoType: 'genel',
    cargoCategory: '',
    
    // Gönderici Bilgileri
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    senderAddress: '',
    senderCity: '',
    senderLocationType: 'depo', // depo, fabrika, ofis, terminal
    forkliftRequired: false,
    
    // Alıcı Bilgileri
    receiverName: '',
    receiverPhone: '',
    receiverEmail: '',
    receiverAddress: '',
    receiverCity: '',
    receiverLocationType: 'depo', // depo, fabrika, ofis, terminal
    receiverForkliftRequired: false,
    
    // Yük Detayları
    weight: '',
    volume: '',
    quantity: '',
    palletCount: '',
    description: '',
    fragile: false,
    dangerousGoods: false,
    coldChain: false,
    temperature: '',
    
    // Tarih Bilgileri
    loadingDate: '',
    loadingTime: 'morning',
    deliveryDate: '',
    deliveryTime: 'morning',
    urgent: false,
    appointmentRequired: false,
    
    // Araç Gereksinimleri
    vehicleType: 'tir',
    specialVehicle: '',
    forkliftRequired: false,
    craneRequired: false,
    specialRequirements: '',
    
    // Lojistik Detayları
    insurance: false,
    insuranceValue: '',
    documentation: [],
    specialInstructions: '',
    
    // İletişim
    smsNotification: true,
    emailNotification: true
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isValidating, setIsValidating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Kurumsal Yük Kategorileri (Detaylı)
  const cargoTypes = [
    {
      id: 'genel',
      name: 'Genel Yük',
      description: 'Kutu, paket, sandık, palet',
      icon: Package,
      color: 'from-blue-600 to-indigo-700',
      categories: [
        { id: 'kutu', name: 'Kutu/Paket' },
        { id: 'sandik', name: 'Sandık' },
        { id: 'palet', name: 'Palet' },
        { id: 'diger', name: 'Diğer' }
      ]
    },
    {
      id: 'mobilya',
      name: 'Mobilya',
      description: 'Ev ve ofis mobilyaları',
      icon: Home,
      color: 'from-green-600 to-emerald-700',
      categories: [
        { id: 'koltuk', name: 'Koltuk Takımı' },
        { id: 'masa', name: 'Masa' },
        { id: 'dolap', name: 'Dolap' },
        { id: 'yatak', name: 'Yatak' }
      ]
    },
    {
      id: 'elektronik',
      name: 'Elektronik',
      description: 'Elektronik cihazlar',
      icon: Monitor,
      color: 'from-purple-600 to-pink-700',
      categories: [
        { id: 'tv', name: 'TV/Monitör' },
        { id: 'bilgisayar', name: 'Bilgisayar' },
        { id: 'beyaz_esya', name: 'Beyaz Eşya' },
        { id: 'diger_elektronik', name: 'Diğer' }
      ]
    },
    {
      id: 'endustriyel',
      name: 'Endüstriyel',
      description: 'Makine ve ekipman',
      icon: Wrench,
      color: 'from-orange-600 to-red-700',
      categories: [
        { id: 'makine', name: 'Makine' },
        { id: 'ekipman', name: 'Ekipman' },
        { id: 'malzeme', name: 'Malzeme' },
        { id: 'diger_endustriyel', name: 'Diğer' }
      ]
    },
    {
      id: 'gida',
      name: 'Gıda',
      description: 'Gıda ürünleri',
      icon: Utensils,
      color: 'from-yellow-600 to-amber-700',
      categories: [
        { id: 'taze', name: 'Taze Gıda' },
        { id: 'dondurulmus', name: 'Dondurulmuş' },
        { id: 'kuru', name: 'Kuru Gıda' },
        { id: 'diger_gida', name: 'Diğer' }
      ]
    },
    {
      id: 'tehlikeli',
      name: 'Tehlikeli Madde',
      description: 'Tehlikeli kimyasal maddeler',
      icon: AlertOctagon,
      color: 'from-red-600 to-rose-700',
      categories: [
        { id: 'kimyasal', name: 'Kimyasal' },
        { id: 'patlayici', name: 'Patlayıcı' },
        { id: 'yanici', name: 'Yanıcı' },
        { id: 'diger_tehlikeli', name: 'Diğer' }
      ]
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const generateTrackingCode = () => {
    const prefix = 'YN'
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}${timestamp}${random}`
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.cargoType) {
      newErrors.cargoType = 'Yük türü seçiniz'
    }
    if (!formData.cargoCategory) {
      newErrors.cargoCategory = 'Alt kategori seçiniz'
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
    if (!formData.senderCity) {
      newErrors.senderCity = 'Gönderici şehri gereklidir'
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
    if (!formData.receiverCity) {
      newErrors.receiverCity = 'Alıcı şehri gereklidir'
    }
    if (!formData.weight) {
      newErrors.weight = 'Ağırlık gereklidir'
    }
    if (!formData.volume) {
      newErrors.volume = 'Hacim gereklidir'
    }
    if (!formData.loadingDate) {
      newErrors.loadingDate = 'Yükleme tarihi gereklidir'
    }
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Teslimat tarihi gereklidir'
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
      setShowSuccess(true)
      
    } catch (error) {
      console.error('Error creating shipment:', error)
      alert('Gönderi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSuccessMessage = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-6 shadow-2xl">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Kurumsal Yük Taşıma Talebi Oluşturuldu!</h2>
        <p className="text-slate-600 text-lg mb-6">Talebiniz nakliyeciler tarafından değerlendirilecek</p>
        
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Takip Bilgileri</h3>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-2xl font-bold text-blue-600 mb-2">{trackingCode}</p>
            <p className="text-sm text-slate-600">Bu kodu kullanarak talebinizi takip edebilirsiniz</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              setShowSuccess(false)
              setTrackingCode('')
              setFormData({
                cargoType: 'genel',
                cargoCategory: '',
                senderName: '',
                senderPhone: '',
                senderEmail: '',
                senderAddress: '',
                senderCity: '',
                senderLocationType: 'depo',
                forkliftRequired: false,
                receiverName: '',
                receiverPhone: '',
                receiverEmail: '',
                receiverAddress: '',
                receiverCity: '',
                receiverLocationType: 'depo',
                receiverForkliftRequired: false,
                weight: '',
                volume: '',
                quantity: '',
                palletCount: '',
                description: '',
                fragile: false,
                dangerousGoods: false,
                coldChain: false,
                temperature: '',
                loadingDate: '',
                loadingTime: 'morning',
                deliveryDate: '',
                deliveryTime: 'morning',
                urgent: false,
                appointmentRequired: false,
                vehicleType: 'tir',
                specialVehicle: '',
                forkliftRequired: false,
                craneRequired: false,
                specialRequirements: '',
                insurance: false,
                insuranceValue: '',
                documentation: [],
                specialInstructions: '',
                smsNotification: true,
                emailNotification: true
              })
            }}
            className="px-8 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-all duration-200"
          >
            Yeni Talep Oluştur
          </button>
          <Link
            to="/corporate/shipments"
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            Taleplerimi Görüntüle
          </Link>
        </div>
      </div>
    )
  }

  const renderForm = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <Truck className="w-8 h-8 text-slate-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Kurumsal Yük Taşıma Talebi</h1>
                <p className="text-slate-300 text-lg">Profesyonel nakliye hizmetleri</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-800 rounded-lg px-4 py-2">
                <p className="text-slate-400 text-sm">Güvenli & Hızlı</p>
                <p className="text-white font-semibold">7/24 Takip</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Yük Kategorisi */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                Yük Türü Seçin
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cargoTypes.map((type) => {
                  const IconComponent = type.icon
                  const isSelected = formData.cargoType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, cargoType: type.id, cargoCategory: '' }))
                      }}
                      className={`p-5 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-lg ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                          : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-white/20' : 'bg-slate-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                        </div>
                        <div>
                          <h4 className={`font-bold text-base ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}>
                            {type.name}
                          </h4>
                          <p className={`text-sm ${
                            isSelected ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {formData.cargoType && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Alt Kategori</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {cargoTypes.find(t => t.id === formData.cargoType)?.categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, cargoCategory: category.id }))
                        }}
                        className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                          formData.cargoCategory === category.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-400'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gönderici Bilgileri */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Gönderici Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Ad Soyad *</label>
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="Adınız ve soyadınız"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">E-posta</label>
                  <input
                    type="email"
                    name="senderEmail"
                    value={formData.senderEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="ornek@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Şehir *</label>
                  <select
                    name="senderCity"
                    value={formData.senderCity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="">Şehir seçiniz</option>
                    <option value="istanbul">İstanbul</option>
                    <option value="ankara">Ankara</option>
                    <option value="izmir">İzmir</option>
                    <option value="bursa">Bursa</option>
                    <option value="antalya">Antalya</option>
                    <option value="adana">Adana</option>
                    <option value="konya">Konya</option>
                    <option value="gaziantep">Gaziantep</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Yükleme Noktası *</label>
                  <select
                    name="senderLocationType"
                    value={formData.senderLocationType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="depo">Depo</option>
                    <option value="fabrika">Fabrika</option>
                    <option value="ofis">Ofis</option>
                    <option value="terminal">Terminal</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="forkliftRequired"
                      checked={formData.forkliftRequired}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Forklift Gerekli</span>
                      <p className="text-xs text-slate-500">Yükleme için forklift gerekli</p>
                    </div>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Adres *</label>
                  <input
                    type="text"
                    name="senderAddress"
                    value={formData.senderAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="Mahalle, sokak, bina no"
                  />
                </div>
              </div>
            </div>

            {/* Alıcı Bilgileri */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                Alıcı Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Ad Soyad *</label>
                  <input
                    type="text"
                    name="receiverName"
                    value={formData.receiverName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="Alıcı adı ve soyadı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    name="receiverPhone"
                    value={formData.receiverPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">E-posta</label>
                  <input
                    type="email"
                    name="receiverEmail"
                    value={formData.receiverEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="ornek@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Şehir *</label>
                  <select
                    name="receiverCity"
                    value={formData.receiverCity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="">Şehir seçiniz</option>
                    <option value="istanbul">İstanbul</option>
                    <option value="ankara">Ankara</option>
                    <option value="izmir">İzmir</option>
                    <option value="bursa">Bursa</option>
                    <option value="antalya">Antalya</option>
                    <option value="adana">Adana</option>
                    <option value="konya">Konya</option>
                    <option value="gaziantep">Gaziantep</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Teslimat Noktası *</label>
                  <select
                    name="receiverLocationType"
                    value={formData.receiverLocationType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="depo">Depo</option>
                    <option value="fabrika">Fabrika</option>
                    <option value="ofis">Ofis</option>
                    <option value="terminal">Terminal</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="receiverForkliftRequired"
                      checked={formData.receiverForkliftRequired}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Forklift Gerekli</span>
                      <p className="text-xs text-slate-500">Teslimat için forklift gerekli</p>
                    </div>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Adres *</label>
                  <input
                    type="text"
                    name="receiverAddress"
                    value={formData.receiverAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="Mahalle, sokak, bina no"
                  />
                </div>
              </div>
            </div>

            {/* Yük Detayları */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Weight className="w-4 h-4 text-white" />
                </div>
                Yük Detayları
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Ağırlık (kg) *</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="0"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Hacim (m³) *</label>
                  <input
                    type="number"
                    name="volume"
                    value={formData.volume}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="0"
                    step="0.1"
                    min="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Adet</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="1"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Palet Sayısı</label>
                  <input
                    type="number"
                    name="palletCount"
                    value={formData.palletCount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-bold text-slate-900 mb-2">Yük Açıklaması</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50 focus:bg-white transition-all duration-200 resize-none"
                  placeholder="Yük hakkında detaylı bilgi"
                />
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="fragile"
                    checked={formData.fragile}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Kırılgan Eşya</span>
                    <p className="text-xs text-slate-500">Özel ambalajlama gerekir</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="dangerousGoods"
                    checked={formData.dangerousGoods}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Tehlikeli Madde</span>
                    <p className="text-xs text-slate-500">Özel taşıma gerekir</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="coldChain"
                    checked={formData.coldChain}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Soğuk Zincir</span>
                    <p className="text-xs text-slate-500">Soğutmalı araç gerekir</p>
                  </div>
                </label>
              </div>
              
              {formData.coldChain && (
                <div className="mt-4">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Sıcaklık (°C)</label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="Örn: -18"
                  />
                </div>
              )}
            </div>

            {/* Tarih Bilgileri */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Tarih Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Yükleme Tarihi *</label>
                  <input
                    type="date"
                    name="loadingDate"
                    value={formData.loadingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Yükleme Saati</label>
                  <select
                    name="loadingTime"
                    value={formData.loadingTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="morning">Sabah (09:00-12:00)</option>
                    <option value="afternoon">Öğleden Sonra (13:00-17:00)</option>
                    <option value="evening">Akşam (18:00-21:00)</option>
                    <option value="flexible">Esnek Saat</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Teslimat Tarihi *</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Teslimat Saati</label>
                  <select
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="morning">Sabah (09:00-12:00)</option>
                    <option value="afternoon">Öğleden Sonra (13:00-17:00)</option>
                    <option value="evening">Akşam (18:00-21:00)</option>
                    <option value="flexible">Esnek Saat</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="urgent"
                    checked={formData.urgent}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Acil Teslimat</span>
                    <p className="text-xs text-slate-500">Öncelikli işleme alınır</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="appointmentRequired"
                    checked={formData.appointmentRequired}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Randevu Gerekli</span>
                    <p className="text-xs text-slate-500">Önceden randevu alınmalı</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Araç Gereksinimleri */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                Araç Gereksinimleri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Araç Türü</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="tir">Tır</option>
                    <option value="kamyon">Kamyon</option>
                    <option value="kamyonet">Kamyonet</option>
                    <option value="van">Van</option>
                    <option value="furgon">Furgon</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Özel Araç</label>
                  <select
                    name="specialVehicle"
                    value={formData.specialVehicle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="">Seçiniz</option>
                    <option value="sogutmali">Soğutmalı</option>
                    <option value="acik_kasa">Açık Kasalı</option>
                    <option value="kapali_kasa">Kapalı Kasalı</option>
                    <option value="tanker">Tanker</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="forkliftRequired"
                      checked={formData.forkliftRequired}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Forklift Gerekli</span>
                      <p className="text-xs text-slate-500">Yükleme/boşaltma için</p>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="craneRequired"
                      checked={formData.craneRequired}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Vinç Gerekli</span>
                      <p className="text-xs text-slate-500">Ağır yükler için</p>
                    </div>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Özel Gereksinimler</label>
                  <input
                    type="text"
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all duration-200"
                    placeholder="Özel araç gereksinimleri"
                  />
                </div>
              </div>
            </div>

            {/* Lojistik Detayları */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                Lojistik Detayları
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="insurance"
                      checked={formData.insurance}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Sigorta Kapsamı</span>
                      <p className="text-xs text-slate-500">Gönderinizi sigorta kapsamına dahil edin</p>
                    </div>
                  </label>
                  
                  {formData.insurance && (
                    <div className="mt-4">
                      <label className="block text-sm font-bold text-slate-900 mb-2">Sigorta Değeri (₺)</label>
                      <input
                        type="number"
                        name="insuranceValue"
                        value={formData.insuranceValue}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 focus:bg-white transition-all duration-200"
                        placeholder="Sigorta değeri giriniz"
                        min="0"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Dokümantasyon</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Fatura', 'İrsaliye', 'Sözleşme', 'Diğer'].map((doc) => (
                      <label key={doc} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          name={`documentation_${doc.toLowerCase()}`}
                          className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-700">{doc}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Özel Talimatlar</label>
                  <textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 focus:bg-white transition-all duration-200 resize-none"
                    placeholder="Özel talimatlar ve notlar"
                  />
                </div>
              </div>
            </div>

            {/* İletişim Tercihleri */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                İletişim Tercihleri
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="smsNotification"
                    checked={formData.smsNotification}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-slate-700">SMS bildirimleri al</span>
                </label>
                
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    name="emailNotification"
                    checked={formData.emailNotification}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-slate-700">E-posta bildirimleri al</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-slate-900 rounded-lg p-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-lg hover:bg-slate-100 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Talep Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>Kurumsal Yük Taşıma Talebi Oluştur</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Helmet>
        <title>Kurumsal Yük Taşıma Talebi - YolNet</title>
        <meta name="description" content="Kurumsal kamyon/tır ile güvenli yük taşıma talebi oluşturun" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/corporate/dashboard"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Ana Sayfaya Dön</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {trackingCode && (
                <div className="bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200">
                  Takip: {trackingCode}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {showSuccess ? renderSuccessMessage() : renderForm()}
        </div>
      </div>
    </div>
  )
}

export default NewCreateShipment











