/**
 * 📊 SHIPMENT STATUS MANAGEMENT - CORE BUSINESS LOGIC
 * 
 * BUSINESS PURPOSE: Manages the lifecycle states of cargo shipments
 * This is CRITICAL business logic that determines what users see and what actions they can take
 * 
 * SHIPMENT LIFECYCLE (Business Flow):
 * 1️⃣ pending/waiting_for_offers → User created shipment, waiting for carrier offers
 * 2️⃣ offer_accepted/accepted → User accepted a carrier's price quote  
 * 3️⃣ in_progress/assigned → Carrier assigned, preparing for pickup
 * 4️⃣ in_transit → Package picked up, being transported
 * 5️⃣ delivered → Package delivered, awaiting confirmation
 * 6️⃣ completed → Job finished, payments processed, ratings done
 * ❌ cancelled → Shipment cancelled by user or system
 * 
 * UI/UX IMPACT:
 * - Status colors provide immediate visual feedback to users
 * - Text is localized for Turkish users
 * - Descriptions help users understand next steps
 * - Different statuses enable/disable different actions (messaging, rating, etc.)
 * 
 * BUSINESS RULES:
 * - Only "pending" and "waiting_for_offers" shipments can be cancelled by users
 * - Messaging is only enabled after "offer_accepted" status
 * - Rating is only available after "completed" status
 * - Real-time tracking is active during "in_transit" status
 */

export interface StatusInfo {
  text: string;         // Human-readable Turkish status text (shown to users)
  color: string;        // Tailwind CSS classes for visual styling
  description: string;  // Detailed explanation for user guidance
  icon?: string;        // Optional icon identifier (future use)
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
      description: 'Taşıyıcılardan teklif bekleniyor',
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






















