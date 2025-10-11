import api from './api';

export interface DashboardStats {
  totalShipments?: number;
  deliveredShipments?: number;
  pendingShipments?: number;
  inTransitShipments?: number;
  successRate?: number;
  totalSpent?: number;
  thisMonthSpent?: number;
  totalEarnings?: number;
  thisMonthEarnings?: number;
  monthlyGrowth?: number;
  activeDrivers?: number;
  totalOffers?: number;
  acceptedOffers?: number;
  totalJobs?: number;
  completedJobs?: number;
  activeJobs?: number;
  rating?: number;
  totalTrips?: number;
  availableJobs?: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  from: string;
  to: string;
  weight: string;
  value: string;
  date: string;
  description: string;
  priority?: 'high' | 'normal' | 'low';
  driver?: string;
  vehicle?: string;
  distance?: string;
  estimatedTime?: string;
}

export interface Offer {
  id: string;
  shipmentId: string;
  carrierName: string;
  price: string;
  deliveryTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  rating: number;
  sender?: string;
  route?: string;
}

export const dashboardService = {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    try {
      // Mock data for now - will be replaced with real API call
      return {
        totalShipments: 28,
        deliveredShipments: 24,
        pendingShipments: 3,
        successRate: 89,
        totalEarnings: 18500.25,
        thisMonthEarnings: 4200.75,
        monthlyGrowth: 22.5,
        activeDrivers: 5,
        totalOffers: 45,
        acceptedOffers: 28
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

  // Get recent shipments
  async getRecentShipments(limit: number = 10): Promise<Shipment[]> {
    try {
      const response = await api.getShipments({ limit });
      return response.data || [];
    } catch (error) {
      console.error('Recent shipments error:', error);
      // Return mock data on error
      return [
        {
          id: '1',
          trackingNumber: 'YN001234567',
          status: 'in_transit',
          from: 'İstanbul, Şişli',
          to: 'Ankara, Çankaya',
          weight: '3.5 kg',
          value: '₺450',
          date: '2024-01-15',
          description: 'Elektronik eşya - Laptop',
          driver: 'Veli Özkan'
        }
      ];
    }
  },

  // Get recent offers
  async getRecentOffers(limit: number = 10): Promise<Offer[]> {
    try {
      const response = await api.getOffers({ limit });
      return response.data || [];
    } catch (error) {
      console.error('Recent offers error:', error);
      // Return mock data on error
      return [
        {
          id: '1',
          shipmentId: 'YN001234567',
          carrierName: 'Hızlı Lojistik A.Ş.',
          price: '₺450',
          deliveryTime: '2-3 gün',
          status: 'accepted',
          rating: 4.8,
          sender: 'Ahmet Yılmaz',
          route: 'İstanbul → Ankara'
        }
      ];
    }
  },

  // Get all shipments
  async getShipments(): Promise<Shipment[]> {
    try {
      const response = await api.getShipments();
      return response.data || [];
    } catch (error) {
      console.error('Shipments error:', error);
      return [];
    }
  },

  // Get all offers
  async getOffers(): Promise<Offer[]> {
    try {
      const response = await api.getOffers();
      return response.data || [];
    } catch (error) {
      console.error('Offers error:', error);
      return [];
    }
  },

  // Create new shipment
  async createShipment(shipmentData: any): Promise<Shipment> {
    try {
      const response = await api.createShipment(shipmentData);
      return response.data;
    } catch (error) {
      console.error('Create shipment error:', error);
      throw error;
    }
  },

  // Create new offer
  async createOffer(offerData: any): Promise<Offer> {
    try {
      const response = await api.createOffer(offerData);
      return response.data;
    } catch (error) {
      console.error('Create offer error:', error);
      throw error;
    }
  },

  // Update shipment status
  async updateShipmentStatus(shipmentId: string, status: string): Promise<void> {
    try {
      await api.updateShipment(shipmentId, { status });
    } catch (error) {
      console.error('Update shipment status error:', error);
      throw error;
    }
  },

  // Update offer status
  async updateOfferStatus(offerId: string, status: string): Promise<void> {
    try {
      if (status === 'accepted') {
        await api.acceptOffer(offerId);
      } else if (status === 'rejected') {
        await api.rejectOffer(offerId);
      }
    } catch (error) {
      console.error('Update offer status error:', error);
      throw error;
    }
  }
};
