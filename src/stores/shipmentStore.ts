// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - zustand type definitions may not be available
import { create } from 'zustand';
import { logger } from '../services/logger';

export interface Shipment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  pickupAddress: string;
  deliveryAddress: string;
  weight?: number;
  dimensions?: string;
  price: number;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  category?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  shipmentId: string;
  nakliyeciId: string;
  price: number;
  message?: string;
  estimatedDelivery?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ShipmentState {
  shipments: Shipment[];
  offers: Offer[];
  openShipments: Shipment[];
  selectedShipment: Shipment | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    category?: string;
    search?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ShipmentActions {
  setShipments: (shipments: Shipment[]) => void;
  addShipment: (shipment: Shipment) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  removeShipment: (id: string) => void;
  setOffers: (offers: Offer[]) => void;
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  setOpenShipments: (shipments: Shipment[]) => void;
  setSelectedShipment: (shipment: Shipment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<ShipmentState['filters']>) => void;
  setPagination: (pagination: Partial<ShipmentState['pagination']>) => void;
  reset: () => void;
}

type ShipmentStore = ShipmentState & ShipmentActions;

export const useShipmentStore = create<ShipmentStore>((set: any, get: any) => ({
  // State
  shipments: [],
  offers: [],
  openShipments: [],
  selectedShipment: null,
  isLoading: false,
  error: null,
  filters: {
    status: undefined,
    category: undefined,
    search: undefined,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },

  // Actions
  setShipments: (shipments: Shipment[]) => {
    logger.info('Gönderiler güncellendi', { count: shipments.length });
    set({ shipments });
  },

  addShipment: (shipment: Shipment) => {
    const { shipments } = get();
    logger.info('Gönderi eklendi', { shipmentId: shipment.id });
    set({ shipments: [shipment, ...shipments] });
  },

  updateShipment: (id: string, updates: Partial<Shipment>) => {
    const { shipments } = get();
    const updatedShipments = shipments.map((shipment: any) =>
      shipment.id === id ? { ...shipment, ...updates } : shipment
    );
    logger.info('Gönderi güncellendi', { shipmentId: id, updates });
    set({ shipments: updatedShipments });
  },

  removeShipment: (id: string) => {
    const { shipments } = get();
    const filteredShipments = shipments.filter((shipment: any) => shipment.id !== id);
    logger.info('Gönderi kaldırıldı', { shipmentId: id });
    set({ shipments: filteredShipments });
  },

  setOffers: (offers: Offer[]) => {
    logger.info('Teklifler güncellendi', { count: offers.length });
    set({ offers });
  },

  addOffer: (offer: Offer) => {
    const { offers } = get();
    logger.info('Teklif eklendi', {
      offerId: offer.id,
      shipmentId: offer.shipmentId,
    });
    set({ offers: [offer, ...offers] });
  },

  updateOffer: (id: string, updates: Partial<Offer>) => {
    const { offers } = get();
    const updatedOffers = offers.map((offer: any) =>
      offer.id === id ? { ...offer, ...updates } : offer
    );
    logger.info('Teklif güncellendi', { offerId: id, updates });
    set({ offers: updatedOffers });
  },

  setOpenShipments: (shipments: Shipment[]) => {
    logger.info('Açık gönderiler güncellendi', { count: shipments.length });
    set({ openShipments: shipments });
  },

  setSelectedShipment: (shipment: Shipment | null) => {
    set({ selectedShipment: shipment });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    if (error) {
      logger.error('Gönderi deposu hatası', { error });
    }
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setFilters: (filters: Partial<ShipmentState['filters']>) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  setPagination: (pagination: Partial<ShipmentState['pagination']>) => {
    set({ pagination: { ...get().pagination, ...pagination } });
  },

  reset: () => {
    set({
      shipments: [],
      offers: [],
      openShipments: [],
      selectedShipment: null,
      isLoading: false,
      error: null,
      filters: {
        status: undefined,
        category: undefined,
        search: undefined,
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
      },
    });
  },
}));

// Selectors
type ShipmentStoreType = ShipmentStore;
export const useShipments = () => useShipmentStore((state: ShipmentStoreType) => state.shipments);
export const useOffers = () => useShipmentStore((state: ShipmentStoreType) => state.offers);
export const useOpenShipments = () =>
  useShipmentStore((state: ShipmentStoreType) => state.openShipments);
export const useSelectedShipment = () =>
  useShipmentStore((state: ShipmentStoreType) => state.selectedShipment);
export const useShipmentLoading = () =>
  useShipmentStore((state: ShipmentStoreType) => state.isLoading);
export const useShipmentError = () => useShipmentStore((state: ShipmentStoreType) => state.error);
export const useShipmentFilters = () =>
  useShipmentStore((state: ShipmentStoreType) => state.filters);
export const useShipmentPagination = () =>
  useShipmentStore((state: ShipmentStoreType) => state.pagination);









