export interface User {
  id: string
  email: string
  fullName: string
  firstName?: string
  role: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici'
  panel_type?: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici'
  avatar?: string
  phone?: string
  company?: {
    name: string
    taxNumber: string
    address: string
  }
  preferences?: {
    notifications: boolean
    theme: 'light' | 'dark' | 'system'
    language: 'tr' | 'en'
  }
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface Shipment {
  id: string
  title: string
  description: string
  from_location: string
  to_location: string
  weight: number
  volume: number
  vehicle_type: string
  status: string
  created_at: string
  agreed_price?: number
  nakliyeci_name?: string
}

export interface Offer {
  id: string
  shipment_id: string
  nakliyeci_id: string
  price: number
  message: string
  status: string
  created_at: string
  nakliyeci_name: string
}

export interface Order {
  id: string
  shipment_id: string
  offer_id: string
  status: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
}

export interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  action_url: string
}

export interface SecurityLog {
  id: string
  userId: string
  action: string
  ipAddress: string
  userAgent: string
  timestamp: string
  success: boolean
}

export interface PasswordStrength {
  score: number
  feedback: string[]
  isStrong: boolean
}

export interface RegisterData {
  role: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici'
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  company?: {
    name: string
    taxNumber: string
    address: string
  }
  acceptTerms: boolean
}

