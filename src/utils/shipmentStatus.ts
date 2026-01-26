import { SHIPMENT_STATUS, type ShipmentStatus } from '../types/domain';

export interface StatusInfo {
  text: string;
  color: string;
  description: string;
  icon?: string;
}

export const getStatusInfo = (status: ShipmentStatus | string): StatusInfo => {
  const normalizeStatusKey = (raw: ShipmentStatus | string): string => {
    const s = String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/-/g, '_');

    // Backward-compatible aliases used across UI/backend
    if (s === 'waiting') return SHIPMENT_STATUS.WAITING_FOR_OFFERS;
    if (s === 'canceled') return SHIPMENT_STATUS.CANCELLED;
    return s;
  };

  const statusMap: Record<string, StatusInfo> = {
    [SHIPMENT_STATUS.PENDING]: {
      text: 'Beklemede',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'Gönderi oluşturuldu, teklif bekleniyor',
    },
    [SHIPMENT_STATUS.OPEN]: {
      text: 'İlana Açık',
      color: 'bg-sky-100 text-sky-800 border-sky-200',
      description: 'Gönderi yayında, teklifler toplanıyor',
    },
    [SHIPMENT_STATUS.WAITING_FOR_OFFERS]: {
      text: 'Teklif Bekliyor',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Taşıyıcılardan teklif bekleniyor',
    },
    [SHIPMENT_STATUS.OFFER_ACCEPTED]: {
      text: 'Teklif Kabul Edildi',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Teklif kabul edildi, taşıyıcı ataması bekleniyor',
    },
    [SHIPMENT_STATUS.ACCEPTED]: {
      text: 'Kabul Edildi',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Teklif kabul edildi, taşıyıcı ataması bekleniyor',
    },
    [SHIPMENT_STATUS.IN_PROGRESS]: {
      text: 'Hazırlanıyor',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Taşıyıcı atandı, yükleme hazırlığı devam ediyor',
    },
    [SHIPMENT_STATUS.ASSIGNED]: {
      text: 'Taşıyıcı Atandı',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Taşıyıcı atandı, yükleme bekleniyor',
    },
    [SHIPMENT_STATUS.PICKED_UP]: {
      text: 'Yük Alındı',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Yük alındı, yola çıkış bekleniyor',
    },
    [SHIPMENT_STATUS.IN_TRANSIT]: {
      text: 'Yolda',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Gönderi yolda, teslimat bekleniyor',
    },
    [SHIPMENT_STATUS.DELIVERED]: {
      text: 'Teslim Edildi',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Gönderi teslim edildi, onay bekleniyor',
    },
    [SHIPMENT_STATUS.CANCELLED]: {
      text: 'İptal Edildi',
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'Gönderi iptal edildi',
    },
    [SHIPMENT_STATUS.COMPLETED]: {
      text: 'Tamamlandı',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Gönderi başarıyla tamamlandı',
    },

    // Backward-compatible aliases
    preparing: {
      text: 'Hazırlanıyor',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Yükleme hazırlığı devam ediyor',
    },
  };

  const key = normalizeStatusKey(status);
  return statusMap[key] || {
    text: 'Bilinmiyor',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Durum bilgisi mevcut değil',
  };
};

export const getStatusDescription = (status: string): string => {
  return getStatusInfo(status).description;
};

export const getStatusText = (status: ShipmentStatus | string): string => {
  return getStatusInfo(status).text;
};
