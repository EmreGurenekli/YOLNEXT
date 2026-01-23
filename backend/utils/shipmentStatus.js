/**
 * Shipment Status Management
 * Defines valid status transitions and business rules
 */

const VALID_STATUSES = [
  'pending',
  'open',
  'waiting_for_offers',
  'offer_accepted',
  'accepted',
  'assigned',
  'in_progress',
  'picked_up',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
];

const STATUS_TRANSITIONS = {
  'pending': ['offer_accepted', 'cancelled'],
  'open': ['offer_accepted', 'cancelled'],
  'waiting_for_offers': ['offer_accepted', 'cancelled'],
  'offer_accepted': ['in_progress', 'picked_up', 'cancelled'],
  'accepted': ['in_progress', 'picked_up', 'cancelled'],
  // Legacy alias: some datasets may still have status='assigned'
  // Treat it the same as 'in_progress'
  'assigned': ['picked_up', 'in_transit', 'cancelled'],
  'in_progress': ['picked_up', 'in_transit', 'cancelled'],
  'picked_up': ['in_transit', 'cancelled'],
  'in_transit': ['delivered', 'cancelled'],
  'delivered': ['completed', 'cancelled'],
  'completed': [], // Terminal state
  'cancelled': [], // Terminal state
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
    pending: 'Oluşturuldu',
    open: 'İlana açık',
    waiting_for_offers: 'Teklifler bekleniyor',
    offer_accepted: 'Teklif kabul edildi, taşıyıcı ataması bekleniyor',
    accepted: 'Kabul edildi',
    assigned: 'Taşıyıcı atandı, yükleme bekleniyor',
    in_progress: 'Taşıyıcı atandı, yükleme bekleniyor',
    picked_up: 'Yük alındı, yola çıkış bekleniyor',
    in_transit: 'Yolda, teslimat bekleniyor',
    delivered: 'Teslim edildi, onay bekleniyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal edildi',
  };
}

module.exports = {
  VALID_STATUSES,
  STATUS_TRANSITIONS,
  isValidTransition,
  getNextValidStatuses,
  validateStatus,
  getStatusWorkflow,
};









