export interface DashboardStats {
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  successRate: number;
  totalSpent: number;
  thisMonthSpent: number;
  totalSavings: number;
  thisMonthSavings: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadResponse {
  message: string;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  constructor(message: string, status: number, statusText: string);
}

export class ApiClient {
  constructor(baseURL: string);
  baseURL: string;
  token: string | null;
  
  request(endpoint: string, options?: RequestInit): Promise<any>;
  setToken(token: string | null): void;
  
  // Auth endpoints
  login(credentials: { email: string; password: string }): Promise<any>;
  register(data: any): Promise<any>;
  verifyToken(): Promise<any>;
  logout(): Promise<any>;
  
  // User endpoints
  getProfile(): Promise<any>;
  updateProfile(data: any): Promise<any>;
  
  // Shipment endpoints
  getShipments(params?: any): Promise<any>;
  getShipment(id: number): Promise<any>;
  createShipment(data: any): Promise<any>;
  updateShipment(id: number, data: any): Promise<any>;
  deleteShipment(id: number): Promise<any>;
  
  // Message endpoints
  getMessages(params?: any): Promise<any>;
  sendMessage(data: any): Promise<any>;
  
  // Offers endpoints
  createOffer(offerData: any): Promise<any>;
  getShipmentOffers(shipmentId: number): Promise<any>;
  getNakliyeciOffers(status?: string): Promise<any>;
  acceptOffer(offerId: number): Promise<any>;
  rejectOffer(offerId: number): Promise<any>;
  
  // Agreements endpoints
  createAgreement(offerId: number): Promise<any>;
  getSenderAgreements(status?: string): Promise<any>;
  getNakliyeciAgreements(status?: string): Promise<any>;
  acceptAgreement(agreementId: number): Promise<any>;
  rejectAgreement(agreementId: number): Promise<any>;
  
  // Tracking endpoints
  updateShipmentStatus(shipmentId: number, statusData: any): Promise<any>;
  getTrackingHistory(shipmentId: number): Promise<any>;
  getActiveShipments(userType: string): Promise<any>;
  confirmDelivery(shipmentId: number, rating: number, feedback: string): Promise<any>;
  
  // Commission endpoints
  calculateCommission(agreedPrice: number): Promise<any>;
  getCommissionRate(): Promise<any>;
  getCommissionExamples(): Promise<any>;
  
  // Dashboard endpoints
  getDashboardStats(): Promise<DashboardStats>;
  getNotifications(params?: any): Promise<NotificationsResponse>;
  getUnreadNotificationCount(): Promise<UnreadCountResponse>;
  markNotificationAsRead(notificationId: number): Promise<MarkReadResponse>;
  
  // Analytics endpoints
  getAnalytics(params?: any): Promise<any>;
  
  // File upload
  uploadFile(file: File, endpoint?: string): Promise<any>;
}

export declare const apiClient: ApiClient;












