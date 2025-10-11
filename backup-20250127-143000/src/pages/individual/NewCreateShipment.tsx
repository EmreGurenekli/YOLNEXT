import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { realApiService } from '../../services/realApi'
import { ShipmentRequest } from '../../types/shipment'
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Truck,
  User,
  CheckCircle,
  Bell,
  Shield,
  Save
} from 'lucide-react'

const NewCreateShipment: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [formData, setFormData] = useState({
    // Temel Gönderi Bilgileri
    cargoType: 'ev_esyasi' as 'ev_esyasi' | 'kisisel' | 'ciftci' | 'is_yeri' | 'ozel',
    description: '',
    estimatedValue: '',
    
    // Gönderici Bilgileri (Basit)
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    senderCity: '',
    senderDistrict: '',
    
    // Alıcı Bilgileri (Basit)
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverCity: '',
    receiverDistrict: '',
    
    // Tarih Tercihi
    preferredDate: '',
    timePreference: 'herhangi' as 'herhangi' | 'sabah' | 'ogleden_sonra' | 'aksam',
    
    // Özel Notlar
    specialInstructions: '',
    
    // Onaylar
    termsAccepted: false,
    privacyAccepted: false
  })

  const cargoTypes = [
    { 
      value: 'ev_esyasi', 
      label: 'Ev Eşyası', 
      description: 'Mobilya, beyaz eşya, kişisel eşyalar',
      icon: '🏠'
    },
    { 
      value: 'kisisel', 
      label: 'Kişisel Eşya', 
      description: 'Kıyafet, kitap, küçük eşyalar',
      icon: '👕'
    },
    { 
      value: 'ciftci', 
      label: 'Çiftçi Ürünleri', 
      description: 'Tarım ürünleri, hayvancılık',
      icon: '🌾'
    },
    { 
      value: 'is_yeri', 
      label: 'İş Yeri Eşyası', 
      description: 'Ofis eşyaları, mağaza malzemeleri',
      icon: '🏢'
    },
    { 
      value: 'ozel', 
      label: 'Özel Gönderi', 
      description: 'Hediye, özel paketler',
      icon: '🎁'
    }
  ]

  const timePreferences = [
    { value: 'herhangi', label: 'Herhangi Bir Saat' },
    { value: 'sabah', label: 'Sabah (08:00-12:00)' },
    { value: 'ogleden_sonra', label: 'Öğleden Sonra (12:00-17:00)' },
    { value: 'aksam', label: 'Akşam (17:00-20:00)' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {
    const required = [
      'description', 'senderName', 'senderPhone', 'senderAddress', 'senderCity',
      'receiverName', 'receiverPhone', 'receiverAddress', 'receiverCity',
      'preferredDate', 'termsAccepted', 'privacyAccepted'
    ]
    
    return required.every(field => {
      const value = formData[field as keyof typeof formData]
      return value !== '' && value !== false
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Lütfen tüm gerekli alanları doldurun')
      return
    }

    setIsSubmitting(true)

    try {
      const shipmentData = {
        cargoType: formData.cargoType,
        description: formData.description,
        estimatedValue: parseFloat(formData.estimatedValue) || 0,
        sender: {
          name: formData.senderName,
          phone: formData.senderPhone,
          email: '',
          address: formData.senderAddress,
          city: formData.senderCity,
          district: formData.senderDistrict,
          postalCode: '',
          locationType: 'ev' as const
        },
        receiver: {
          name: formData.receiverName,
          phone: formData.receiverPhone,
          email: '',
          address: formData.receiverAddress,
          city: formData.receiverCity,
          district: formData.receiverDistrict,
          postalCode: '',
          locationType: 'ev' as const
        },
        schedule: {
          loadingDate: formData.preferredDate,
          loadingTime: '',
          deliveryDate: formData.preferredDate,
          deliveryTime: '',
          loadingWindow: '09:00-18:00',
          deliveryWindow: '09:00-18:00',
          flexibleDelivery: true,
          maxWaitTime: '60'
        },
        transport: {
          vehicleType: 'van' as const,
          weight: 0,
          volume: 0,
          insurance: false,
          packaging: false,
          loading: false,
          unloading: false,
          loadingFloor: '0',
          unloadingFloor: '0',
          loadingAccess: 'normal',
          unloadingAccess: 'normal',
          loadingInstructions: '',
          unloadingInstructions: ''
        },
        payment: {
          method: 'kredi_karti' as const,
          codAmount: '0',
          insurance: false,
          insuranceValue: '0'
        },
        communication: {
          smsNotification: true,
          emailNotification: false,
          phoneNotification: false,
          whatsappNotification: false,
          frequency: 'normal' as const,
          preferredTime: '09:00-18:00'
        },
        security: {
          signatureRequired: false,
          idVerification: false,
          photoTracking: false,
          gpsTracking: false
        },
        notes: {
          specialInstructions: formData.specialInstructions,
          deliveryNotes: '',
          loadingNotes: ''
        },
        privacy: {
          gdprConsent: false,
          termsAccepted: formData.termsAccepted,
          privacyAccepted: formData.privacyAccepted
        }
      }

      const response = await realApiService.createShipment(shipmentData)
      if (response.success && response.data) {
        setTrackingCode(response.data.shipment.trackingCode)
        setShowSuccess(true)
      } else {
        throw new Error(response.error || 'Gönderi oluşturulamadı')
      }
    } catch (error) {
      console.error('Gönderi oluşturma hatası:', error)
      alert('Gönderi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => (
    <div className="space-y-6">
      {/* Güven Göstergeleri */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Güvenli Ödeme</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Güvenli Teslimat</span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">7/24 Takip</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">50,000+</div>
            <div className="text-sm text-gray-600">Mutlu Müşteri</div>
          </div>
        </div>
      </div>

      {/* Yük Detayları */}
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <Package className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Yük Detayları</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kargo Tipi *</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {cargoTypes.map((type) => (
                <label key={type.value} className="relative">
                  <input
                    type="radio"
                    name="cargoType"
                    value={type.value}
                    checked={formData.cargoType === type.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    formData.cargoType === type.value 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-sm text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Gönderinizin detaylarını yazın..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Değer (₺)</label>
              <input
                type="number"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gönderici Bilgileri */}
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Gönderici Bilgileri</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
              <input
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
              <input
                type="tel"
                name="senderPhone"
                value={formData.senderPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
              <textarea
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                <input
                  type="text"
                  name="senderCity"
                  value={formData.senderCity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                <input
                  type="text"
                  name="senderDistrict"
                  value={formData.senderDistrict}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alıcı Bilgileri */}
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Alıcı Bilgileri</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
              <input
                type="text"
                name="receiverName"
                value={formData.receiverName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
              <input
                type="tel"
                name="receiverPhone"
                value={formData.receiverPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
              <textarea
                name="receiverAddress"
                value={formData.receiverAddress}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                <input
                  type="text"
                  name="receiverCity"
                  value={formData.receiverCity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                <input
                  type="text"
                  name="receiverDistrict"
                  value={formData.receiverDistrict}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarih ve Notlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Tarih Tercihi</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tercih Edilen Tarih *</label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zaman Tercihi</label>
              <select
                name="timePreference"
                value={formData.timePreference}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timePreferences.map((time) => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border shadow-sm">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Özel Notlar</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Özel Talimatlar</label>
            <textarea
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Özel talimatlarınızı yazın..."
            />
          </div>
        </div>
      </div>

      {/* Onaylar */}
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <div className="flex items-center mb-4">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Onaylar</h3>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <div className="text-sm">
              <span className="font-medium text-gray-900">Kullanım Şartları</span>
              <p className="text-gray-600">YolNet kullanım şartlarını kabul ediyorum.</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name="privacyAccepted"
              checked={formData.privacyAccepted}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <div className="text-sm">
              <span className="font-medium text-gray-900">Gizlilik Politikası</span>
              <p className="text-gray-600">Kişisel verilerimin işlenmesini kabul ediyorum.</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gönderi Oluşturuldu!</h2>
          <p className="text-gray-600 mb-4">
            Gönderiniz başarıyla oluşturuldu. Takip kodu:
          </p>
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <code className="text-lg font-mono text-blue-600">{trackingCode}</code>
          </div>
          <div className="space-y-3">
            <Link
              to="/individual/my-shipments"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Gönderilerimi Görüntüle
            </Link>
            <Link
              to="/individual/dashboard"
              className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <React.Fragment>
      <Helmet>
        <title>Yeni Gönderi Oluştur - YolNet</title>
        <meta name="description" content="Güvenli ve hızlı gönderi oluşturun. En uygun fiyatları bulun." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/individual/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Gönderi Oluştur</h1>
            <p className="text-gray-600 mt-2">Gönderinizin detaylarını girin ve en uygun fiyatları bulun</p>
          </div>

          <form onSubmit={handleSubmit}>
            {renderForm()}
            
            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Gönderi Oluşturuluyor...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="w-5 h-5 mr-2" />
                    Gönderi Oluştur
                  </div>
                )}
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Gönderinizi oluşturduktan sonra nakliyecilerden fiyat teklifleri alacaksınız
              </p>
              <p className="text-xs text-gray-400 mt-1">
                * Ücretsiz fiyat teklifi alın, beğenmezseniz iptal edin
              </p>
            </div>
          </form>
        </div>
      </div>
    </React.Fragment>
  )
}

export default NewCreateShipment