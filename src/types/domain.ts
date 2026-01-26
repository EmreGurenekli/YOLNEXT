/**
 * Domain-level enums/types shared across the frontend.
 *
 * Keep this file dependency-free and focused on **product language**:
 * roles, statuses, and their allowed literal values.
 */

export const USER_ROLE = {
  INDIVIDUAL: 'individual',
  CORPORATE: 'corporate',
  NAKLIYECI: 'nakliyeci',
  TASIYICI: 'tasiyici',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const SHIPMENT_STATUS = {
  PENDING: 'pending',
  OPEN: 'open',
  WAITING_FOR_OFFERS: 'waiting_for_offers',
  OFFER_ACCEPTED: 'offer_accepted',
  ACCEPTED: 'accepted', // legacy alias
  ASSIGNED: 'assigned', // legacy alias
  IN_PROGRESS: 'in_progress',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS];

export const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS];

export const CARRIER_MARKET_LISTING_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export type CarrierMarketListingStatus =
  (typeof CARRIER_MARKET_LISTING_STATUS)[keyof typeof CARRIER_MARKET_LISTING_STATUS];

export const CARRIER_MARKET_BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type CarrierMarketBidStatus =
  (typeof CARRIER_MARKET_BID_STATUS)[keyof typeof CARRIER_MARKET_BID_STATUS];

