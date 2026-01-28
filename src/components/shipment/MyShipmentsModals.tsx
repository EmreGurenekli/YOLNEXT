import React, { useMemo } from 'react';
import { X, Phone, MapPin, Package, Calendar, DollarSign, User, Building2, Info, Truck, Weight, Ruler, Shield, MessageSquare, Star, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import { getStatusInfo as getStatusInfoBase } from '../../utils/shipmentStatus';
import MessagingModal from '../MessagingModal';
import RatingModal from '../RatingModal';
import CarrierInfoCard from '../CarrierInfoCard';
import { Shipment } from '../../hooks/useMyShipments';

interface MyShipmentsModalsProps {
  // Detail Modal Props
  showDetailModal: boolean;
  selectedShipment: Shipment | null;
  onCloseDetailModal: () => void;
  onOpenMessaging: (shipment: Shipment) => void;
  onOpenRating: (shipment: Shipment) => void;
  onCancelShipment: (shipment: Shipment) => void;
  
  // Messaging Modal Props
  showMessagingModal: boolean;
  selectedCarrier: { id: string; name: string; email: string; type: string } | null;
  selectedShipmentId: string | null;
  onCloseMessagingModal: () => void;
  
  // Rating Modal Props
  showRatingModal: boolean;
  onCloseRatingModal: () => void;
  onRatingSubmit: () => void;
  
  // Cancel Modal Props
  showCancelModal: boolean;
  onCloseCancelModal: () => void;
  onConfirmCancel: () => void;
  
  // Utils
  isMessagingEnabled: (status: Shipment['status']) => boolean;
  locallyRatedShipmentIds: string[];
}

const getStatusInfo = (status: string) => {
  return getStatusInfoBase(status);
};

const MyShipmentsModals: React.FC<MyShipmentsModalsProps> = ({
  showDetailModal,
  selectedShipment,
  onCloseDetailModal,
  onOpenMessaging,
  onOpenRating,
  onCancelShipment,
  showMessagingModal,
  selectedCarrier,
  selectedShipmentId,
  onCloseMessagingModal,
  showRatingModal,
  onCloseRatingModal,
  onRatingSubmit,
  showCancelModal,
  onCloseCancelModal,
  onConfirmCancel,
  isMessagingEnabled,
  locallyRatedShipmentIds,
}) => {
  if (!selectedShipment) return null;

  const statusInfo = getStatusInfo(selectedShipment.status);
  const isRated = selectedShipment.user_rated || locallyRatedShipmentIds.includes(selectedShipment.id);

  const timeline = useMemo(() => {
    const s = String(selectedShipment.status || '');
    const hasCarrier = Boolean(selectedShipment.carrier_id);
    const hasDriver = Boolean(selectedShipment.driver_name || selectedShipment.driver_id || selectedShipment.vehicle_plate);

    const done = (k: string) => {
      if (k === 'offer') return ['offer_accepted', 'accepted', 'assigned', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed'].includes(s);
      if (k === 'assign') return hasCarrier && ['assigned', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed'].includes(s) || hasDriver;
      if (k === 'pickup') return ['picked_up', 'in_transit', 'delivered', 'completed'].includes(s);
      if (k === 'transit') return ['in_transit', 'delivered', 'completed'].includes(s);
      if (k === 'deliver') return ['delivered', 'completed'].includes(s);
      if (k === 'complete') return ['completed'].includes(s);
      return false;
    };

    const steps = [
      { key: 'offer', title: 'Teklif kabul edildi', hint: 'Nakliyeci seçildi' },
      { key: 'assign', title: 'Taşıyıcı ataması', hint: hasDriver ? 'Taşıyıcı atandı' : 'Taşıyıcı/araç bekleniyor' },
      { key: 'pickup', title: 'Yük alındı', hint: 'Yükleme tamamlandı' },
      { key: 'transit', title: 'Yolda', hint: 'Taşıma sürüyor' },
      { key: 'deliver', title: 'Teslim', hint: 'Teslimat tamamlandı' },
      { key: 'complete', title: 'Kapanış', hint: 'Değerlendirme / kayıt' },
    ];

    const show = ['offer_accepted', 'accepted', 'assigned', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed'].includes(s);
    if (!show) return null;

    let nextText = 'Sıradaki adım: Nakliyeci taşıyıcı atayacak.';
    if (hasCarrier && !hasDriver) nextText = 'Sıradaki adım: Nakliyeci taşıyıcı atayacak (taşıyıcı teklifi 30 dk içinde kabul eder).';
    if (hasDriver && ['offer_accepted', 'accepted', 'assigned', 'in_progress'].includes(s)) nextText = 'Sıradaki adım: Yükleme alınacak.';
    if (s === 'picked_up') nextText = 'Sıradaki adım: Yola çıkış / takip.';
    if (s === 'in_transit') nextText = 'Sıradaki adım: Teslimat.';
    if (s === 'delivered') nextText = 'Sıradaki adım: Teslimat onayı (varsa).';
    if (s === 'completed') nextText = 'Süreç tamamlandı.';

    return { steps, done, nextText };
  }, [selectedShipment]);

  return (
    <>
      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Gönderi Detayları</h2>
              <button
                onClick={onCloseDetailModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Status Banner */}
              <div className={`p-6 rounded-xl border-l-4 ${statusInfo.color} bg-gradient-to-r from-slate-50 to-blue-50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {statusInfo.icon}
                    </div>
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        {statusInfo.text}
                      </span>
                      <p className="text-sm text-slate-600 mt-1">{statusInfo.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      {selectedShipment.tracking_code || `TRK${String(selectedShipment.id).slice(-6).padStart(6, '0')}`}
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(selectedShipment.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Next steps timeline */}
              {timeline && (
                <div className='bg-white rounded-xl border border-slate-200 p-6'>
                  <div className='flex items-start gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
                      <Truck className='w-5 h-5' />
                    </div>
                    <div className='flex-1'>
                      <div className='text-sm font-bold text-slate-900'>Süreç akışı</div>
                      <div className='text-xs text-slate-600 mt-1'>{timeline.nextText}</div>
                    </div>
                  </div>
                  <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {timeline.steps.map((st) => {
                      const ok = timeline.done(st.key);
                      return (
                        <div key={st.key} className={`rounded-lg border p-3 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                          <div className='flex items-center gap-2'>
                            <CheckCircle2 className={`w-4 h-4 ${ok ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <div className={`text-sm font-semibold ${ok ? 'text-emerald-900' : 'text-slate-900'}`}>{st.title}</div>
                          </div>
                          <div className={`text-xs mt-1 ${ok ? 'text-emerald-700' : 'text-slate-600'}`}>{st.hint}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Yük Bilgileri */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Yük Bilgileri
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Gönderi Başlığı</label>
                    <p className="text-sm font-bold text-slate-900">{selectedShipment.title}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedShipment.weight && (
                      <div>
                        <label className="text-xs text-slate-500 flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          Ağırlık
                        </label>
                        <p className="text-sm font-semibold text-slate-900">{selectedShipment.weight} kg</p>
                      </div>
                    )}
                    
                    {selectedShipment.volume && (
                      <div>
                        <label className="text-xs text-slate-500 flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          Hacim
                        </label>
                        <p className="text-sm font-semibold text-slate-900">{selectedShipment.volume} m³</p>
                      </div>
                    )}
                  </div>

                  {selectedShipment.dimensions && (
                    <div>
                      <label className="text-xs text-slate-500">Boyutlar (E×G×Y)</label>
                      <p className="text-sm font-semibold text-slate-900">{selectedShipment.dimensions}</p>
                    </div>
                  )}

                  {selectedShipment.cargo_value && (
                    <div>
                      <label className="text-xs text-slate-500 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Yük Değeri
                      </label>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(selectedShipment.cargo_value)}</p>
                    </div>
                  )}

                  {selectedShipment.category && (
                    <div>
                      <label className="text-xs text-slate-500">Kategori</label>
                      <p className="text-sm font-semibold text-slate-900">{selectedShipment.category}</p>
                    </div>
                  )}

                  {selectedShipment.description && (
                    <div>
                      <label className="text-xs text-slate-500">Açıklama</label>
                      <p className="text-sm text-slate-700 bg-white rounded-lg p-3 border">{selectedShipment.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nakliyeci ve Taşıyıcı Durumu */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Taşıma ve Nakliyeci Bilgileri
                </h3>
                
                {selectedShipment.carrier_id ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Nakliyeci Firması Bilgileri */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Nakliyeci Firması</h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium text-green-700">ATANDİ</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{selectedShipment.carrier_name || 'Nakliyeci Firması'}</p>
                          {selectedShipment.carrier_company && (
                            <p className="text-sm text-slate-600">{selectedShipment.carrier_company}</p>
                          )}
                        </div>
                        
                        {selectedShipment.carrier_rating && (
                          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (selectedShipment.carrier_rating || 0)
                                      ? 'text-amber-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                              {selectedShipment.carrier_rating}/5
                            </span>
                            {selectedShipment.completed_jobs && (
                              <span className="text-xs text-slate-500 ml-2">
                                ({selectedShipment.completed_jobs} tamamlanmış iş)
                              </span>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          {selectedShipment.carrier_phone && (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                              <Phone className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-700">{selectedShipment.carrier_phone}</span>
                            </div>
                          )}

                          {selectedShipment.carrier_email && (
                            <div className="text-sm text-slate-600 p-2 bg-slate-50 rounded">{selectedShipment.carrier_email}</div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {selectedShipment.carrier_verified && (
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Doğrulanmış Firma
                            </div>
                          )}
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            Profesyonel Nakliyeci
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Taşıyıcı ve Araç Bilgileri */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Taşıyıcı & Araç</h4>
                          <div className="flex items-center gap-2">
                            {(selectedShipment.driver_name || selectedShipment.vehicle_plate) ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs font-medium text-green-700">ATANDİ</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-xs font-medium text-orange-700">BEKLEME</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {(selectedShipment.driver_name || selectedShipment.vehicle_plate) ? (
                        <div className="space-y-4">
                          {selectedShipment.driver_name && (
                            <div>
                              <label className="text-xs font-medium text-slate-600 mb-1 block">Şoför</label>
                              <p className="text-lg font-bold text-slate-900">{selectedShipment.driver_name}</p>
                            </div>
                          )}

                          {selectedShipment.driver_phone && (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                              <Phone className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-700">{selectedShipment.driver_phone}</span>
                            </div>
                          )}

                          {selectedShipment.vehicle_plate && (
                            <div>
                              <label className="text-xs font-medium text-slate-600 mb-2 block">Araç Bilgileri</label>
                              <div className="p-3 bg-slate-900 rounded-lg">
                                <p className="text-xl font-mono font-bold text-white text-center tracking-wider">
                                  {selectedShipment.vehicle_plate}
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedShipment.vehicle_type && (
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <span className="text-sm font-semibold text-blue-800">{selectedShipment.vehicle_type}</span>
                            </div>
                          )}

                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Araç ve şoför hazır</span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">Yükünüz alınmaya hazır</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-orange-800">Taşıyıcı Ataması Bekleniyor</p>
                            <p className="text-xs text-orange-700 mt-1">
                              Nakliyeci firma en uygun araç ve şoförü atayacak
                            </p>
                          </div>
                          <div className="text-xs text-slate-500">
                            ⏳ Genellikle 2-4 saat içinde atama yapılır
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200 max-w-md mx-auto">
                      <Package className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                      <h4 className="font-bold text-slate-900 mb-2">Nakliyeci Ataması Bekleniyor</h4>
                      <p className="text-sm text-slate-600 mb-4">
                        Teklifler değerlendiriliyor. En uygun nakliyeci size atanacak.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>Ortalama bekleme süresi: 1-2 saat</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mesajlaşma Uyarısı */}
              {!isMessagingEnabled(selectedShipment.status) && (
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Mesajlaşma Henüz Aktif Değil</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Nakliyeci ile mesajlaşabilmek için önce bir teklif kabul etmelisiniz. 
                        Teklif kabul edildikten sonra ödeme detayları ve iletişim için mesajlaşma açılacak.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                {isMessagingEnabled(selectedShipment.status) && selectedShipment.carrier_id && (
                  <button
                    onClick={() => onOpenMessaging(selectedShipment)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-900 hover:to-slate-800 text-white rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Nakliyeci ile Mesajlaş
                  </button>
                )}
                
                {selectedShipment.status === 'completed' && !isRated && (
                  <button
                    onClick={() => onOpenRating(selectedShipment)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Star className="w-5 h-5" />
                    Nakliyeciyi Değerlendir
                  </button>
                )}
                
                {(selectedShipment.status === 'preparing' || selectedShipment.status === 'waiting' || selectedShipment.status === 'waiting_for_offers') && (
                  <button
                    onClick={() => onCancelShipment(selectedShipment)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
                  >
                    <X className="w-5 h-5" />
                    Gönderiyi İptal Et
                  </button>
                )}

                <button
                  onClick={onCloseDetailModal}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {showMessagingModal && selectedCarrier && selectedShipmentId && (
        <MessagingModal
          isOpen={showMessagingModal}
          onClose={onCloseMessagingModal}
          otherUser={{
            id: selectedCarrier.id,
            name: selectedCarrier.name,
            email: selectedCarrier.email,
            type: selectedCarrier.type
          }}
          currentUser={{
            id: 'current-user-id',
            name: 'Current User'
          }}
          shipmentId={selectedShipmentId}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={onCloseRatingModal}
          ratedUser={{
            id: selectedCarrier?.id || '',
            name: selectedCarrier?.name || '',
            email: selectedCarrier?.email || '',
            type: selectedCarrier?.type || 'carrier'
          }}
          currentUser={{
            id: 'current-user-id',
            name: 'Current User'
          }}
          shipmentId={selectedShipment.id}
          onSubmitted={onRatingSubmit}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold">Gönderiyi İptal Et</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Bu gönderiyi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCloseCancelModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={onConfirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                İptal Et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyShipmentsModals;










