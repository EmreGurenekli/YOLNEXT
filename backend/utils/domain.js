/**
 * Domain constants shared across backend modules.
 *
 * Keep this file small and dependency-free.
 * Do NOT import application modules here (routes/services) to avoid cycles.
 */
const ROLE = Object.freeze({
  INDIVIDUAL: 'individual',
  CORPORATE: 'corporate',
  NAKLIYECI: 'nakliyeci',
  TASIYICI: 'tasiyici',
  ADMIN: 'admin',
});

const SHIPMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  OPEN: 'open',
  WAITING_FOR_OFFERS: 'waiting_for_offers',
  OFFER_ACCEPTED: 'offer_accepted',
  ACCEPTED: 'accepted', // legacy alias used by some datasets
  ASSIGNED: 'assigned', // legacy alias used by some datasets
  IN_PROGRESS: 'in_progress',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const OFFER_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

const CARRIER_MARKET_LISTING_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

const CARRIER_MARKET_BID_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

module.exports = {
  ROLE,
  SHIPMENT_STATUS,
  OFFER_STATUS,
  CARRIER_MARKET_LISTING_STATUS,
  CARRIER_MARKET_BID_STATUS,
};

