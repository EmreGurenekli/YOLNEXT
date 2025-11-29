import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Send,
  DollarSign,
  MessageSquare,
  Calendar,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  Star,
  Shield,
  Award,
  Loader,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentAPI } from '../../services/api';
import { createApiUrl } from '../../config/api';

interface Shipment {
  id: string;
  title: string;
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  deliveryDate: string;
  weight: number;
  specialRequirements: string;
  category: string;
  userId: string;
  createdAt: string;
}

interface OfferData {
  price: number;
  message: string;
  estimatedDeliveryDays: number;
  specialServices: string[];
}

const OfferShipment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [offerData, setOfferData] = useState<OfferData>({
    price: 0,
    message: '',
    estimatedDeliveryDays: 1,
    specialServices: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    if (!id) {
      setError('Gönderi ID bulunamadı');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Gerçek API çağrısı - Open shipments endpoint'inden gönderiyi al
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/shipments/open?id=${id}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Eğer open shipments'da yoksa, tüm shipments'tan ara
        const allShipmentsResponse = await fetch(
          createApiUrl('/api/shipments/open'),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (allShipmentsResponse.ok) {
          const allData = await allShipmentsResponse.json();
          const foundShipment = allData.data?.shipments?.find(
            (s: any) => s.id?.toString() === id || s.id === id
          );
          
          if (foundShipment) {
            // API'den gelen veriyi formatla
            setShipment({
              id: foundShipment.id?.toString() || id,
              title: foundShipment.title || foundShipment.productDescription || 'Gönderi',
              description: foundShipment.description || foundShipment.productDescription || '',
              pickupAddress: foundShipment.pickupAddress || '',
              deliveryAddress: foundShipment.deliveryAddress || '',
              pickupDate: foundShipment.pickupDate || '',
              deliveryDate: foundShipment.deliveryDate || '',
              weight: foundShipment.weight || 0,
              specialRequirements: foundShipment.specialRequirements || '',
              category: foundShipment.category || 'general',
              userId: foundShipment.userId?.toString() || '',
              createdAt: foundShipment.createdAt || new Date().toISOString(),
            });
          } else {
            setError('Gönderi bulunamadı');
          }
        } else {
          throw new Error('Gönderi yüklenemedi');
        }
      } else {
        const data = await response.json();
        const shipmentData = data.data?.shipment || data.data || data;
        
        if (shipmentData) {
          setShipment({
            id: shipmentData.id?.toString() || id,
            title: shipmentData.title || shipmentData.productDescription || 'Gönderi',
            description: shipmentData.description || shipmentData.productDescription || '',
            pickupAddress: shipmentData.pickupAddress || '',
            deliveryAddress: shipmentData.deliveryAddress || '',
            pickupDate: shipmentData.pickupDate || '',
            deliveryDate: shipmentData.deliveryDate || '',
            weight: shipmentData.weight || 0,
            specialRequirements: shipmentData.specialRequirements || '',
            category: shipmentData.category || 'general',
            userId: shipmentData.userId?.toString() || '',
            createdAt: shipmentData.createdAt || new Date().toISOString(),
          });
        } else {
          setError('Gönderi verisi bulunamadı');
        }
      }
    } catch (error) {
      console.error('Gönderi yüklenirken hata:', error);
      setError('Gönderi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof OfferData, value: any) => {
    setOfferData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleSpecialServiceToggle = (service: string) => {
    setOfferData(prev => ({
      ...prev,
      specialServices: prev.specialServices.includes(service)
        ? prev.specialServices.filter(s => s !== service)
        : [...prev.specialServices, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!offerData.price || offerData.price <= 0) {
      setError('Geçerli bir fiyat giriniz');
      return;
    }

    if (!offerData.message.trim()) {
      setError('Mesaj alanını doldurunuz');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Kullanıcı bilgilerini al
      const user = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : null;

      // Teklif verisi hazırla - gerçek kullanıcı verileri ile
      const offerPayload = {
        shipmentId: shipment?.id,
        price: offerData.price,
        message: offerData.message,
        estimatedDeliveryDays: offerData.estimatedDeliveryDays,
        specialServices: offerData.specialServices,
        carrierId: user?.id || '',
        carrierName: user?.fullName || user?.name || '',
        carrierCompany: user?.companyName || '',
      };

      // Gerçek API çağrısı
      const response = await fetch(createApiUrl('/api/offers'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerPayload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess('Teklifiniz başarıyla gönderildi!');
          setTimeout(() => {
            navigate('/nakliyeci/jobs');
          }, 2000);
        } else {
          setError(data.message || 'Teklif gönderilirken hata oluştu');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Teklif gönderilirken hata oluştu');
      }
    } catch (error) {
      console.error('Teklif gönderme hatası:', error);
      setError('Teklif gönderilirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'house_move':
        return '🏠';
      case 'furniture_goods':
        return '🪑';
      case 'vehicle_transport':
        return '🚗';
      case 'special_cargo':
        return '📦';
      default:
        return '📦';
    }
  };

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      house_move: 'Ev Taşınması',
      furniture_goods: 'Mobilya Taşıma',
      vehicle_transport: 'Araç Taşıma',
      special_cargo: 'Özel Yük',
      other: 'Diğer',
    };
    return categories[category] || 'Bilinmeyen';
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='w-8 h-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-slate-600'>Gönderi bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            Gönderi Bulunamadı
          </h2>
          <p className='text-slate-600 mb-4'>
            Aradığınız gönderi bulunamadı veya kaldırılmış olabilir.
          </p>
          <button
            onClick={() => navigate('/nakliyeci/jobs')}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <Helmet>
        <title>Teklif Ver - {shipment.title} - YolNext</title>
        <meta name='description' content='Gönderi için teklif verin' />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-6'>
            <button
              onClick={() => navigate('/nakliyeci/jobs')}
              className='flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
              Geri Dön
            </button>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-2xl'>
                {getCategoryIcon(shipment.category)}
              </div>
              <div>
                <h1 className='text-3xl font-bold text-slate-900'>
                  Teklif Ver
                </h1>
                <p className='text-slate-600'>{shipment.title}</p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Gönderi Bilgileri */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-8'>
              <h3 className='text-xl font-bold text-slate-900 mb-4'>
                Gönderi Bilgileri
              </h3>

              <div className='space-y-4'>
                {/* Kategori */}
                <div className='flex items-center gap-3'>
                  <Package className='w-5 h-5 text-blue-600' />
                  <div>
                    <p className='text-sm font-medium text-slate-700'>
                      Kategori
                    </p>
                    <p className='text-sm text-slate-600'>
                      {getCategoryName(shipment.category)}
                    </p>
                  </div>
                </div>

                {/* Açıklama */}
                <div>
                  <p className='text-sm font-medium text-slate-700 mb-2'>
                    Açıklama
                  </p>
                  <p className='text-sm text-slate-600'>
                    {shipment.description}
                  </p>
                </div>

                {/* Adresler */}
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <MapPin className='w-4 h-4 text-green-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-slate-700 mb-1'>
                        Toplama Adresi
                      </p>
                      <p className='text-sm text-slate-600'>
                        {shipment.pickupAddress}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <MapPin className='w-4 h-4 text-red-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-slate-700 mb-1'>
                        Teslimat Adresi
                      </p>
                      <p className='text-sm text-slate-600'>
                        {shipment.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tarihler */}
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <Calendar className='w-5 h-5 text-blue-600' />
                    <div>
                      <p className='text-sm font-medium text-slate-700'>
                        Toplama Tarihi
                      </p>
                      <p className='text-sm text-slate-600'>
                        {formatDate(shipment.pickupDate)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Calendar className='w-5 h-5 text-purple-600' />
                    <div>
                      <p className='text-sm font-medium text-slate-700'>
                        Teslimat Tarihi
                      </p>
                      <p className='text-sm text-slate-600'>
                        {formatDate(shipment.deliveryDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ağırlık */}
                <div className='flex items-center gap-3'>
                  <Truck className='w-5 h-5 text-slate-600' />
                  <div>
                    <p className='text-sm font-medium text-slate-700'>
                      Tahmini Ağırlık
                    </p>
                    <p className='text-sm text-slate-600'>
                      {shipment.weight} kg
                    </p>
                  </div>
                </div>

                {/* Özel Gereksinimler */}
                {shipment.specialRequirements && (
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
                    <div className='flex items-center gap-2 mb-1'>
                      <AlertCircle className='w-4 h-4 text-amber-600' />
                      <span className='text-sm font-medium text-amber-800'>
                        Özel Gereksinimler
                      </span>
                    </div>
                    <p className='text-sm text-amber-700'>
                      {shipment.specialRequirements}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Teklif Formu */}
          <div className='lg:col-span-2'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
                <h3 className='text-xl font-bold text-slate-900 mb-6'>
                  Teklif Bilgileri
                </h3>

                {/* Fiyat */}
                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    <DollarSign className='w-4 h-4 inline mr-2' />
                    Teklif Fiyatı (TL) *
                  </label>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={offerData.price}
                    onChange={e =>
                      handleInputChange(
                        'price',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 text-lg'
                    placeholder='0.00'
                    required
                  />
                  <p className='text-sm text-slate-500 mt-2'>
                    Rekabetçi bir fiyat vererek teklifinizin kabul edilme
                    şansını artırın.
                  </p>
                </div>

                {/* Teslimat Süresi */}
                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    <Clock className='w-4 h-4 inline mr-2' />
                    Tahmini Teslimat Süresi (Gün)
                  </label>
                  <select
                    value={offerData.estimatedDeliveryDays}
                    onChange={e =>
                      handleInputChange(
                        'estimatedDeliveryDays',
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700'
                  >
                    <option value={1}>1 Gün</option>
                    <option value={2}>2 Gün</option>
                    <option value={3}>3 Gün</option>
                    <option value={4}>4 Gün</option>
                    <option value={5}>5 Gün</option>
                    <option value={7}>1 Hafta</option>
                    <option value={14}>2 Hafta</option>
                  </select>
                </div>


                {/* Özel Hizmetler */}
                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-slate-700 mb-3'>
                    <Award className='w-4 h-4 inline mr-2' />
                    Özel Hizmetler
                  </label>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {[
                      'Paketleme Hizmeti',
                      'Sökme-Takma',
                      'Özel Taşıma',
                      'Hızlı Teslimat',
                      'Güvenli Depolama',
                      'Müşteri Hizmetleri',
                    ].map(service => (
                      <label
                        key={service}
                        className='flex items-center gap-3 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={offerData.specialServices.includes(service)}
                          onChange={() => handleSpecialServiceToggle(service)}
                          className='w-4 h-4 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500'
                        />
                        <span className='text-sm text-slate-700'>
                          {service}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mesaj */}
                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    <MessageSquare className='w-4 h-4 inline mr-2' />
                    Mesaj *
                  </label>
                  <textarea
                    value={offerData.message}
                    onChange={e => handleInputChange('message', e.target.value)}
                    rows={4}
                    className='w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-slate-700 resize-none'
                    placeholder='Teklifiniz hakkında detaylı bilgi verin, deneyimlerinizi paylaşın...'
                    required
                  />
                  <p className='text-sm text-slate-500 mt-2'>
                    Müşteriye güven veren, profesyonel bir mesaj yazın.
                  </p>
                </div>

                {/* Hata/Success Mesajları */}
                {error && (
                  <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2'>
                    <AlertCircle className='w-5 h-5' />
                    {error}
                  </div>
                )}

                {success && (
                  <div className='bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2'>
                    <CheckCircle className='w-5 h-5' />
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? (
                    <>
                      <Loader className='w-5 h-5 animate-spin' />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className='w-5 h-5' />
                      Teklifi Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferShipment;
