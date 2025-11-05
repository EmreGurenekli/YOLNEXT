import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Package, Clock, DollarSign } from 'lucide-react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

interface Offer {
  id: number;
  shipmentId: number;
  carrierId: number;
  carrierName: string;
  price: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  shipment?: {
    fromCity: string;
    toCity: string;
    cargoType: string;
    weight: number;
    deliveryDate: string;
  };
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [newOffer, setNewOffer] = useState({
    shipmentId: '',
    price: '',
    message: ''
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await api.get<any[]>(`${API_ENDPOINTS.OFFERS}?status=accepted`);
      const list = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res) ? res : (res as any)?.data?.offers || []);
      setOffers(list as unknown as Offer[]);
    } catch (error) {
      console.error('Teklifler yüklenirken hata:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: number) => {
    try {
      await api.post(`${API_ENDPOINTS.OFFERS}/${offerId}/accept`);
        fetchOffers();
    } catch (error) {
      console.error('Teklif kabul edilirken hata:', error);
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      await api.post(`${API_ENDPOINTS.OFFERS}/${offerId}/reject`);
      fetchOffers();
    } catch (error) {
      console.error('Teklif reddedilirken hata:', error);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(API_ENDPOINTS.OFFERS, {
        shipmentId: parseInt(newOffer.shipmentId),
        price: parseFloat(newOffer.price),
        message: newOffer.message
      });
      setNewOffer({ shipmentId: '', price: '', message: '' });
      setShowOfferModal(false);
        fetchOffers();
    } catch (error) {
      console.error('Teklif gönderilirken hata:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teklifler</h1>
        <Button onClick={() => setShowOfferModal(true)}>
          <Package className="w-4 h-4 mr-2" />
          Yeni Teklif Ver
              </Button>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz teklif yok</h3>
            <p className="text-gray-500">İlk teklifinizi vermek için yukarıdaki butona tıklayın.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-lg">{offer.carrierName || 'Taşıyıcı'}</h3>
                    {offer.shipment && (
                      <p className="text-sm text-gray-500">
                        {offer.shipment.fromCity} → {offer.shipment.toCity}
                      </p>
                    )}
                </div>
                  <Badge variant={offer.status === 'accepted' ? 'default' : offer.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {offer.status === 'pending' && 'Beklemede'}
                    {offer.status === 'accepted' && 'Kabul Edildi'}
                    {offer.status === 'rejected' && 'Reddedildi'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span className="font-medium">{Number(offer.price || 0).toLocaleString()} TL</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                </div>
                {offer.message && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {offer.message}
                  </p>
                )}
              </CardContent>
                  {offer.status === 'pending' && (
                <CardFooter className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptOffer(offer.id)}
                    className="bg-green-600 hover:bg-green-700"
                    >
                      Kabul Et
                    </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRejectOffer(offer.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Reddet
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h2 className="text-xl font-semibold">Yeni Teklif Ver</h2>
            </CardHeader>
            <form onSubmit={handleSubmitOffer}>
              <CardContent className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gönderi ID
                  </label>
                  <Input
                  type="number"
                    value={newOffer.shipmentId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOffer({ ...newOffer, shipmentId: e.target.value })}
                  required
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teklif Fiyatı (TL)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newOffer.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewOffer({ ...newOffer, price: e.target.value })}
                    required
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesaj
                  </label>
                  <Textarea
                    value={newOffer.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewOffer({ ...newOffer, message: e.target.value })}
                    rows={3}
                />
              </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Teklif Gönder
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}


