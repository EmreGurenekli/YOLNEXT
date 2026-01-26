/**
 * Shipment Status Management
 * Defines valid status transitions and business rules.
 */

const { SHIPMENT_STATUS } = require('./domain');

const VALID_STATUSES = Object.values(SHIPMENT_STATUS);

const STATUS_TRANSITIONS = {
  [SHIPMENT_STATUS.PENDING]: [SHIPMENT_STATUS.OFFER_ACCEPTED, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.OPEN]: [SHIPMENT_STATUS.OFFER_ACCEPTED, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.WAITING_FOR_OFFERS]: [SHIPMENT_STATUS.OFFER_ACCEPTED, SHIPMENT_STATUS.CANCELLED],

  // Offer accepted; waiting for driver assignment (normal) OR direct progress updates (legacy/operational shortcuts)
  [SHIPMENT_STATUS.OFFER_ACCEPTED]: [
    SHIPMENT_STATUS.IN_PROGRESS,
    SHIPMENT_STATUS.PICKED_UP,
    SHIPMENT_STATUS.CANCELLED,
  ],

  // Legacy alias used by some datasets
  [SHIPMENT_STATUS.ACCEPTED]: [
    SHIPMENT_STATUS.IN_PROGRESS,
    SHIPMENT_STATUS.PICKED_UP,
    SHIPMENT_STATUS.CANCELLED,
  ],

  // Legacy alias: treat like IN_PROGRESS
  [SHIPMENT_STATUS.ASSIGNED]: [SHIPMENT_STATUS.PICKED_UP, SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.IN_PROGRESS]: [
    SHIPMENT_STATUS.PICKED_UP,
    SHIPMENT_STATUS.IN_TRANSIT,
    SHIPMENT_STATUS.CANCELLED,
  ],
  [SHIPMENT_STATUS.PICKED_UP]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.IN_TRANSIT]: [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.DELIVERED]: [SHIPMENT_STATUS.COMPLETED, SHIPMENT_STATUS.CANCELLED],
  [SHIPMENT_STATUS.COMPLETED]: [], // Terminal state
  [SHIPMENT_STATUS.CANCELLED]: [], // Terminal state
};

/**
 * Check if status transition is valid
 */
function isValidTransition(currentStatus, newStatus) {
  if (!VALID_STATUSES.includes(newStatus)) {
    return { valid: false, error: `Geçersiz durum: ${newStatus}` };
  }

  if (currentStatus === newStatus) {
    return { valid: true }; // Same status is always valid
  }

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Geçersiz durum geçişi: "${currentStatus}" durumundan "${newStatus}" durumuna geçilemez. İzin verilen geçişler: ${allowedTransitions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get next valid statuses for current status
 */
function getNextValidStatuses(currentStatus) {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate shipment status
 */
function validateStatus(status) {
  return VALID_STATUSES.includes(status);
}

/**
 * Get status workflow description
 */
function getStatusWorkflow() {
  return {
    [SHIPMENT_STATUS.PENDING]: 'Oluşturuldu',
    [SHIPMENT_STATUS.OPEN]: 'İlana açık',
    [SHIPMENT_STATUS.WAITING_FOR_OFFERS]: 'Teklifler bekleniyor',
    [SHIPMENT_STATUS.OFFER_ACCEPTED]: 'Teklif kabul edildi, taşıyıcı ataması bekleniyor',
    [SHIPMENT_STATUS.ACCEPTED]: 'Kabul edildi',
    [SHIPMENT_STATUS.ASSIGNED]: 'Taşıyıcı atandı, yükleme bekleniyor',
    [SHIPMENT_STATUS.IN_PROGRESS]: 'Taşıyıcı atandı, yükleme bekleniyor',
    [SHIPMENT_STATUS.PICKED_UP]: 'Yük alındı, yola çıkış bekleniyor',
    [SHIPMENT_STATUS.IN_TRANSIT]: 'Yolda, teslimat bekleniyor',
    [SHIPMENT_STATUS.DELIVERED]: 'Teslim edildi, onay bekleniyor',
    [SHIPMENT_STATUS.COMPLETED]: 'Tamamlandı',
    [SHIPMENT_STATUS.CANCELLED]: 'İptal edildi',
  };
}

module.exports = {
  SHIPMENT_STATUS,
  VALID_STATUSES,
  STATUS_TRANSITIONS,
  isValidTransition,
  getNextValidStatuses,
  validateStatus,
  getStatusWorkflow,
};









