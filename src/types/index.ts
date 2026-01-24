/**
 * 📝 YOLNEXT TYPE DEFINITIONS - BUSINESS DATA MODELS
 * 
 * BUSINESS PURPOSE: Defines the shape of all data flowing through the platform
 * TypeScript interfaces ensure data consistency across frontend, backend, and database
 * 
 * CORE BUSINESS ENTITIES:
 * 👤 User - Platform users (individual, corporate, nakliyeci, tasiyici, admin)
 * 📦 Shipment - Cargo packages being transported (core business entity)
 * 💰 Offer - Carrier price quotes for shipments (revenue generation)
 * 🔔 Notification - User communications (engagement & retention)
 * 🚛 Carrier - Transport service providers (supply side of marketplace)
 * 
 * DATA FLOW ASSURANCE:
 * - Frontend forms → validated against these types
 * - API responses → typed for compile-time safety  
 * - Database queries → ensure schema consistency
 * - Component props → prevent runtime errors
 * 
 * BUSINESS BENEFITS:
 * ✅ Prevents data corruption and API mismatches
 * ✅ Catches bugs at compile-time (not runtime in production)
 * ✅ Self-documenting interfaces for new developers
 * ✅ IDE autocompletion for faster development
 * ✅ Refactoring safety when business requirements change
 */

// API types - re-export with explicit names to avoid conflicts
export type {
  User as ApiUser,
  Shipment as ApiShipment,
  Offer as ApiOffer,
  Notification as ApiNotification,
  CreateShipmentForm,
  ShipmentFilters,
  UserSettings,
} from './api';

// Auth types
export * from './auth';

// User types
export * from './user';

// Shipment types
export * from './shipment';

// Carrier types
export * from './carrier';

// Notification types
export * from './notification';









