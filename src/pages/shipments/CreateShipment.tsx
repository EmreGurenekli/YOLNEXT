import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShipmentForm {
  fromCity: string;
  toCity: string;
  cargoType: string;
  weight: string;
  volume: string;
  deliveryDate: string;
  specialRequirements: string;
}

export default function CreateShipment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ShipmentForm>({
    fromCity: '',
    toCity: '',
    cargoType: '',
    weight: '',
    volume: '',
    deliveryDate: '',
    specialRequirements: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_city: formData.fromCity,
          to_city: formData.toCity,
          cargo_type: formData.cargoType,
          weight: parseFloat(formData.weight),
          volume: parseFloat(formData.volume),
          delivery_date: formData.deliveryDate,
          special_requirements: formData.specialRequirements,
        }),
      });

      if (response.ok) {
        navigate('/individual/shipments');
      } else {
        const error = await response.text();
        alert(`Gönderi oluşturulurken bir hata oluştu. Hata: ${error}`);
      }
    } catch (error) {
      console.error('Gönderi oluşturma hatası:', error);
      alert('Gönderi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>
          Yeni Gönderi Oluştur
        </h1>
        <p className='text-gray-600'>
          Gönderi detaylarınızı girin ve nakliyecilerden teklif alın.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className='text-lg font-semibold flex items-center'>
              <Package className='w-5 h-5 mr-2' />
              Gönderi Bilgileri
            </h2>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nereden <span className='text-red-500'>*</span>
                </label>
                <Input
                  name='fromCity'
                  value={formData.fromCity}
                  onChange={handleInputChange}
                  placeholder='Çıkış şehri'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nereye <span className='text-red-500'>*</span>
                </label>
                <Input
                  name='toCity'
                  value={formData.toCity}
                  onChange={handleInputChange}
                  placeholder='Varış şehri'
                  required
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Kargo Türü <span className='text-red-500'>*</span>
                </label>
                <Input
                  name='cargoType'
                  value={formData.cargoType}
                  onChange={handleInputChange}
                  placeholder='Örn: Ev eşyası, elektronik'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Ağırlık (kg) <span className='text-red-500'>*</span>
                </label>
                <Input
                  name='weight'
                  type='number'
                  step='0.1'
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder='0.0'
                  required
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Hacim (m³)
                </label>
                <Input
                  name='volume'
                  type='number'
                  step='0.1'
                  value={formData.volume}
                  onChange={handleInputChange}
                  placeholder='0.0'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Teslimat Tarihi <span className='text-red-500'>*</span>
                </label>
                <Input
                  name='deliveryDate'
                  type='date'
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Özel Gereksinimler
              </label>
              <Textarea
                name='specialRequirements'
                value={formData.specialRequirements}
                onChange={handleInputChange}
                placeholder='Özel gereksinimlerinizi yazın...'
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <CardFooter className='mt-6 flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/individual/shipments')}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            type='submit'
            disabled={loading}
            className='bg-blue-600 hover:bg-blue-700'
          >
            {loading ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Oluşturuluyor...
              </div>
            ) : (
              <div className='flex items-center'>
                <Truck className='w-4 h-4 mr-2' />
                Gönderi Oluştur
              </div>
            )}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
