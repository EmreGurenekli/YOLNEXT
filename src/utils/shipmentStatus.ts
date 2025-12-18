// Shipment status utility functions
export interface StatusInfo {
  text: string;
  color: string;
  description: string;
  icon?: string;
}

export const getStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    pending: {
      text: 'Beklemede',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'Gönderi oluşturuldu, teklif bekleniyor',
    },
    waiting_for_offers: {
      text: 'Teklif Bekliyor',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Nakliyecilerden teklif bekleniyor',
    },
    offer_accepted: {
      text: 'Teklif Kabul Edildi',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Teklif kabul edildi, taşıyıcı ataması bekleniyor',
    },
    accepted: {
      text: 'Kabul Edildi',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Teklif kabul edildi, taşıyıcı ataması bekleniyor',
    },
    in_progress: {
      text: 'Taşıyıcı Atandı',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Taşıyıcı atandı, yükleme bekleniyor',
    },
    assigned: {
      text: 'Taşıyıcı Atandı',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Taşıyıcı atandı, yükleme bekleniyor',
    },
    in_transit: {
      text: 'Yolda',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Gönderi yolda, teslimat bekleniyor',
    },
    delivered: {
      text: 'Teslim Edildi',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Gönderi teslim edildi, onay bekleniyor',
    },
    cancelled: {
      text: 'İptal Edildi',
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'Gönderi iptal edildi',
    },
    completed: {
      text: 'Tamamlandı',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Gönderi başarıyla tamamlandı',
    },
  };

  return statusMap[status] || {
    text: 'Bilinmiyor',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Durum bilgisi mevcut değil',
  };
};

export const getStatusDescription = (status: string): string => {
  return getStatusInfo(status).description;
};












