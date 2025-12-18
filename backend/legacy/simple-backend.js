import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS Configuration - Production safe
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN;
const isProduction = process.env.NODE_ENV === 'production';

// CRITICAL: Production'da CORS origin MUTLAKA set edilmeli
if (isProduction && !corsOrigin) {
  console.error('❌ CRITICAL ERROR: CORS_ORIGIN or FRONTEND_ORIGIN must be set in production!');
  console.error('   This is a security risk. Please set CORS_ORIGIN environment variable.');
  process.exit(1);
}

// Development için fallback, production'da asla wildcard kullanma
const allowedOrigin = isProduction 
  ? corsOrigin 
  : (corsOrigin || '*');

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
const PORT = process.env.PORT || 5000;
const DATA_FILE = join(__dirname, 'backend-data.json');

// Security Middleware - Helmet (security headers)
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", corsOrigin].filter(Boolean),
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Disable in dev for easier testing
  crossOriginEmbedderPolicy: false,
}));

// CORS Middleware - Production safe (NO WILDCARD IN PRODUCTION)
app.use(cors({
  origin: (origin, callback) => {
    // Production'da origin kontrolü zorunlu
    if (isProduction) {
      if (!origin || origin !== corsOrigin) {
        return callback(new Error('Not allowed by CORS'));
      }
    }
    // Development'da tüm origin'lere izin ver
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory stores for demo data
const demoShipmentsStore = new Map();
const demoOffersStore = new Map();
const demoUsersStore = new Map();
const carrierMarketListingsStore = new Map();
const carrierMarketBidsStore = new Map();
const demoWalletStore = new Map(); // Wallet data: userId -> { balance, transactions, etc }
const demoDriversStore = new Map(); // Driver relationships: nakliyeciId -> Set of carrierIds
const demoCorporateCarriersStore = new Map(); // Corporate carrier relationships: corporateId -> Set of nakliyeciIds
const driverCodeStore = new Map(); // Driver codes: driverCode -> userId
const demoRatingsStore = new Map(); // Ratings: ratingId -> { rated_user_id, rater_id, rating, comment, shipment_id, created_at }
let shipmentIdCounter = 1;
let offerIdCounter = 1;
let listingIdCounter = 1;
let bidIdCounter = 1;
let transactionIdCounter = 1;
let driverCodeCounter = 1; // Counter for driver codes
let ratingIdCounter = 1; // Counter for ratings

// Helper function to normalize user IDs (remove "demo-" prefix)
const normalizeUserId = (id) => {
  if (!id) return id;
  const str = String(id);
  if (str.startsWith('demo-')) {
    return str.replace('demo-', '');
  }
  return str;
};

// INPUT VALIDATION HELPERS
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Turkish phone number validation (10 digits, can start with 0 or +90)
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const sanitizeString = (str, maxLength = 1000) => {
  if (!str || typeof str !== 'string') return '';
  // Remove potentially dangerous characters (XSS protection)
  return str.slice(0, maxLength).replace(/[<>]/g, '');
};

const validatePrice = (price) => {
  if (price === null || price === undefined) return false;
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 10000000; // Max 10M TL
};

const validateId = (id) => {
  if (!id) return false;
  const numId = typeof id === 'string' ? parseInt(id) : id;
  return !isNaN(numId) && numId > 0;
};

// Helper function to parse demo token
const parseDemoToken = (token) => {
  if (!token || !token.startsWith('demo-token-')) {
    return null;
  }
  const userId = token.replace('demo-token-', '');
  // Extract user type from userId (e.g., "individual-123" -> "individual")
  const userTypeMatch = userId.match(/^(individual|corporate|nakliyeci|tasiyici)-/);
  const userType = userTypeMatch ? userTypeMatch[1] : 'unknown';
  return { userType, userId };
};

// Middleware to authenticate demo tokens (optional for registration)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // For registration, token is optional
    if (req.path.includes('/register') || req.path.includes('/verify')) {
      return next();
    }
    return res.status(401).json({ success: false, message: 'Token bulunamadı' });
  }

  const demoUser = parseDemoToken(token);
  if (demoUser) {
    req.user = demoUser;
    return next();
  }

  // For non-demo tokens, you could add JWT verification here
  // For registration, allow without token
  if (req.path.includes('/register') || req.path.includes('/verify')) {
    return next();
  }
  
  return res.status(401).json({ success: false, message: 'Geçersiz token' });
};

// Health check endpoint (public, no auth required)
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };
  
  res.json(health);
});

// Detailed health check (for monitoring)
app.get('/api/health/live', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
    },
    checks: {
      cors: !!process.env.CORS_ORIGIN,
      jwt: !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
      dataFile: fs.existsSync(DATA_FILE),
    },
  };
  
  // Check if all critical checks pass
  const allChecksPass = health.checks.cors && health.checks.jwt;
  
  res.status(allChecksPass ? 200 : 503).json(health);
});

// Readiness probe (for Kubernetes/Docker)
app.get('/api/health/ready', (req, res) => {
  const checks = {
    cors: !!process.env.CORS_ORIGIN,
    jwt: !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
    dataFile: fs.existsSync(DATA_FILE),
  };
  
  const isReady = Object.values(checks).every(check => check === true);
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// Dashboard endpoints
app.get('/api/dashboard/individual', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
      recentShipments: [],
      notifications: [],
    },
  });
});

app.get('/api/dashboard/corporate', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
      recentShipments: [],
      notifications: [],
    },
  });
});

app.get('/api/dashboard/nakliyeci', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalOffers: 0,
        acceptedOffers: 0,
        openShipments: 0,
        totalEarnings: 0,
      },
      recentOffers: [],
      notifications: [],
    },
  });
});

app.get('/api/dashboard/tasiyici', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0,
      },
      recentJobs: [],
      notifications: [],
    },
  });
});

// Stats endpoints
app.get('/api/dashboard/stats/individual', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
    },
  });
});

app.get('/api/dashboard/stats/corporate', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
    },
  });
});

app.get('/api/dashboard/stats/nakliyeci', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalOffers: 0,
        acceptedOffers: 0,
        openShipments: 0,
        totalEarnings: 0,
      },
    },
  });
});

app.get('/api/dashboard/stats/tasiyici', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0,
      },
    },
  });
});

// Shipments endpoints
app.get('/api/shipments', authenticateToken, (req, res) => {
  const { userId, userType } = req.user;
  const normalizedUserId = normalizeUserId(userId);
  
  // Check if user is individual or corporate sender
  const isSender = userType === 'individual' || userType === 'corporate' || 
                   userId.startsWith('individual-') || userId.startsWith('corporate-') ||
                   userId.toString().startsWith('individual-') || userId.toString().startsWith('corporate-');
  
  if (isSender) {
    // Get shipments for individual/corporate sender - match by normalized userId
    let shipments = Array.from(demoShipmentsStore.values())
      .filter(s => {
        const shipmentUserId = normalizeUserId(s.userId);
        return shipmentUserId === normalizedUserId || s.userId === userId || s.userId === normalizedUserId;
      });
    
    // Apply filters
    const { status, search } = req.query;
    if (status && status !== 'all') {
      shipments = shipments.filter(s => s.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      shipments = shipments.filter(s => 
        (s.title || '').toLowerCase().includes(searchLower) ||
        (s.pickupAddress || '').toLowerCase().includes(searchLower) ||
        (s.deliveryAddress || '').toLowerCase().includes(searchLower)
      );
    }
    
    return res.json({
      success: true,
      data: {
        shipments: shipments,
      },
    });
  }
  
  res.json({
    success: true,
    data: {
      shipments: [],
    },
  });
});

// Get individual sender's shipment history
app.get('/api/shipments/individual/history', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    // Get all shipments for this user (delivered, cancelled, etc.)
    const userShipments = Array.from(demoShipmentsStore.values())
      .filter(s => {
        const shipmentUserId = normalizeUserId(s.userId);
        return shipmentUserId === normalizedUserId;
      })
      .map(shipment => {
        // Get carrier info if available
        const carrierId = shipment.carrierId || shipment.acceptedOffer?.carrierId;
        let carrierName = 'Bilinmiyor';
        if (carrierId) {
          const carrier = Array.from(demoUsersStore.values()).find(
            u => normalizeUserId(u.id) === normalizeUserId(carrierId)
          );
          carrierName = carrier?.fullName || carrier?.firstName || 'Bilinmiyor';
        }
        
        return {
          id: shipment.id,
          trackingNumber: shipment.trackingNumber || `TRK${String(shipment.id).padStart(6, '0')}`,
          title: shipment.title || shipment.description || 'Gönderi',
          from: shipment.pickupAddress || shipment.from || 'Belirtilmemiş',
          to: shipment.deliveryAddress || shipment.to || 'Belirtilmemiş',
          status: shipment.status,
          createdAt: shipment.createdAt || shipment.created_at,
          deliveredAt: shipment.deliveredAt || shipment.actualDelivery,
          price: shipment.price || 0,
          carrierName: carrierName,
          category: shipment.category || 'Genel',
          weight: shipment.weight || '0kg',
          dimensions: shipment.dimensions || 'Belirtilmemiş',
          description: shipment.description || '',
          rating: shipment.rating || null,
        };
      });
    
    res.json({
      success: true,
      shipments: userShipments,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments/individual/history error:', error);
    res.status(500).json({
      success: false,
      error: 'Geçmiş gönderiler yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

// Get individual sender's shipments
app.get('/api/shipments/individual', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const normalizedUserId = normalizeUserId(userId);
  
  const shipments = Array.from(demoShipmentsStore.values())
    .filter(s => {
      const shipmentUserId = normalizeUserId(s.userId);
      return shipmentUserId === normalizedUserId || s.userId === userId || s.userId === normalizedUserId;
    });
  
  res.json({
    success: true,
    data: shipments,
  });
});

// Get corporate sender's shipments
app.get('/api/shipments/corporate', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const normalizedUserId = normalizeUserId(userId);
  
  const shipments = Array.from(demoShipmentsStore.values())
    .filter(s => {
      const shipmentUserId = normalizeUserId(s.userId);
      return shipmentUserId === normalizedUserId || shipmentUserId === `corporate-${normalizedUserId}` || s.userId === userId;
    });
  
  res.json({
    success: true,
    data: shipments,
  });
});

// Get open shipments (for carriers)
app.get('/api/shipments/open', authenticateToken, (req, res) => {
  const { id } = req.query;
  const userType = req.user?.userType || req.user?.role;
  
  if (id) {
    // Get specific shipment by ID
    const shipment = Array.from(demoShipmentsStore.values())
      .find(s => s.id === parseInt(id) && (s.status === 'open' || s.status === 'pending'));
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı',
      });
    }
    
    return res.json({
      success: true,
      data: shipment,
    });
  }
  
  // If user is a carrier (taşıyıcı), return active carrier market listings
  const isCarrier = userType === 'tasiyici' || req.user?.role === 'tasiyici';
  if (isCarrier) {
    try {
      // Get all active carrier market listings
      const listingsMap = new Map();
      for (const listing of carrierMarketListingsStore.values()) {
        if (listing && listing.id && listing.status === 'active') {
          if (!listingsMap.has(listing.id)) {
            listingsMap.set(listing.id, listing);
          }
        }
      }
      const allListings = Array.from(listingsMap.values());
      
      // Enrich listings with shipment details
      const enrichedListings = allListings
        .map(listing => {
          // Find shipment by ID
          let shipment = null;
          const lShipmentId = listing.shipmentId;
          
          for (const s of demoShipmentsStore.values()) {
            const sId = s.id;
            if (sId === lShipmentId || 
                sId === parseInt(lShipmentId) || 
                sId?.toString() === lShipmentId?.toString() ||
                parseInt(sId) === parseInt(lShipmentId)) {
              shipment = s;
              break;
            }
          }
          
          if (!shipment) {
            return null;
          }
          
          // Return listing format expected by frontend
          return {
            id: listing.id,
            shipmentId: listing.shipmentId,
            minPrice: listing.minPrice,
            price: shipment.price || listing.minPrice,
            title: shipment.description || shipment.title || shipment.productDescription || `Gönderi #${listing.shipmentId}`,
            pickupAddress: shipment.pickupAddress || shipment.fromAddress || '',
            deliveryAddress: shipment.deliveryAddress || shipment.toAddress || '',
            weight: shipment.weight || 0,
            volume: shipment.volume || 0,
            pickupDate: shipment.pickupDate || shipment.pickupDateTime || '',
            createdAt: listing.createdAt || new Date().toISOString(),
            notes: shipment.notes || shipment.specialRequirements || '',
          };
        })
        .filter(l => l !== null)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return res.json({
        success: true,
        data: enrichedListings,
      });
    } catch (error) {
      console.error('Error in carrier market listings endpoint:', error);
      return res.json({
        success: true,
        data: [],
      });
    }
  }
  
  // For other user types, get all open shipments
  const openShipments = Array.from(demoShipmentsStore.values())
    .filter(s => s.status === 'open' || s.status === 'pending');
  
  res.json({
    success: true,
    data: openShipments,
  });
});

// Get taşıyıcı (driver) assigned shipments
app.get('/api/shipments/tasiyici', authenticateToken, (req, res) => {
  try {
  const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    console.log(`🔍 [DEBUG] /api/shipments/tasiyici - userId: ${userId}, normalized: ${normalizedUserId}`);
  
  // Get shipments assigned to this driver
  const assignedShipments = Array.from(demoShipmentsStore.values())
      .filter(s => {
        const driverId = s.driverId || s.assignedDriverId;
        const normalizedDriverId = normalizeUserId(driverId);
        
        const match = 
          driverId === userId ||
          driverId === userId?.toString() ||
          driverId?.toString() === userId ||
          normalizedDriverId === normalizedUserId ||
          normalizedDriverId === userId ||
          normalizedDriverId === userId?.toString();
        
        // Accept shipments with status 'accepted' or 'assigned'
        return match && (s.status === 'accepted' || s.status === 'assigned' || s.status === 'in_transit');
      });
    
    console.log(`🔍 [DEBUG] Found ${assignedShipments.length} assigned shipments for taşıyıcı`);
    
    // Enrich shipments with sender, nakliyeci, and driver info
    const enrichedShipments = assignedShipments.map(shipment => {
      // Get sender user info
      const senderUserId = shipment.userId;
      const normalizedSenderUserId = normalizeUserId(senderUserId);
      const senderUser = demoUsersStore.get(senderUserId) ||
                         demoUsersStore.get(senderUserId?.toString()) ||
                         demoUsersStore.get(normalizedSenderUserId) ||
                         demoUsersStore.get(normalizedSenderUserId?.toString()) ||
                         demoUsersStore.get(`demo-${senderUserId}`) ||
                         demoUsersStore.get(`demo-${senderUserId?.toString()}`);

      // Get nakliyeci user info
      const nakliyeciId = shipment.carrierId;
      const normalizedNakliyeciId = normalizeUserId(nakliyeciId);
      const nakliyeciUser = nakliyeciId ? (
        demoUsersStore.get(nakliyeciId) ||
        demoUsersStore.get(nakliyeciId?.toString()) ||
        demoUsersStore.get(normalizedNakliyeciId) ||
        demoUsersStore.get(normalizedNakliyeciId?.toString()) ||
        demoUsersStore.get(`demo-${nakliyeciId}`) ||
        demoUsersStore.get(`demo-${nakliyeciId?.toString()}`)
      ) : null;

      // Get driver user info (the tasiyici who was assigned)
      const driverId = shipment.driverId || shipment.assignedDriverId;
      const normalizedDriverId = normalizeUserId(driverId);
      const driverUser = driverId ? (
        demoUsersStore.get(driverId) ||
        demoUsersStore.get(driverId?.toString()) ||
        demoUsersStore.get(normalizedDriverId) ||
        demoUsersStore.get(normalizedDriverId?.toString()) ||
        demoUsersStore.get(`demo-${driverId}`) ||
        demoUsersStore.get(`demo-${driverId?.toString()}`)
      ) : null;

      // PRIVACY: Taşıyıcı gönderici telefon numarasını görmemeli
      // Gönderici sadece nakliyeciye mesaj yoluyla ulaşabilir
      return {
        ...shipment,
        sender: {
          name: senderUser?.fullName || senderUser?.name || shipment.shipperName || shipment.senderName || 'Bilinmiyor',
          company: senderUser?.companyName || shipment.shipperCompany || shipment.companyName || '',
          // phone: HIDDEN - Taşıyıcı gönderici telefon numarasını görmemeli
        },
        nakliyeci: {
          name: nakliyeciUser?.fullName || nakliyeciUser?.name || shipment.carrierName || 'Nakliyeci',
          phone: nakliyeciUser?.phone || shipment.carrierPhone || '',
          company: nakliyeciUser?.companyName || '',
        },
        // Ensure driver object exists for frontend compatibility
        driver: shipment.driver || (driverUser ? {
          name: driverUser?.fullName || driverUser?.name || shipment.driver?.name || 'Taşıyıcı',
          phone: driverUser?.phone || shipment.driver?.phone || '',
          vehicle: driverUser?.vehicle || shipment.driver?.vehicle || '',
        } : {
          name: shipment.driver?.name || 'Atanmadı',
          phone: shipment.driver?.phone || '',
          vehicle: shipment.driver?.vehicle || '',
        }),
      };
    });
  
  res.json({
    success: true,
      data: enrichedShipments,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments/tasiyici error:', error);
    res.status(500).json({
      success: false,
      message: 'Aktif işler yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Get completed jobs for Taşıyıcı
app.get('/api/shipments/tasiyici/completed', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    console.log(`🔍 [DEBUG] /api/shipments/tasiyici/completed - userId: ${userId}, normalized: ${normalizedUserId}`);
  
    // Get completed shipments assigned to this driver
    const allShipments = Array.from(demoShipmentsStore.values());
    console.log(`🔍 [DEBUG] Total shipments: ${allShipments.length}`);
    
    const completedShipments = allShipments
      .filter(s => {
        const driverId = s.driverId || s.assignedDriverId;
        const normalizedDriverId = normalizeUserId(driverId);
        
        console.log(`🔍 [DEBUG] Shipment ${s.id}: driverId=${driverId}, normalizedDriverId=${normalizedDriverId}, status=${s.status}, userId=${userId}, normalizedUserId=${normalizedUserId}`);
        
        const match = 
          driverId === userId ||
          driverId === userId?.toString() ||
          driverId?.toString() === userId ||
          normalizedDriverId === normalizedUserId ||
          normalizedDriverId === userId ||
          normalizedDriverId === userId?.toString();
        
        const statusMatch = s.status === 'delivered' || s.status === 'completed';
        const result = match && statusMatch;
        
        if (result) {
          console.log(`✅ [DEBUG] Shipment ${s.id} matches!`);
        }
        
        // Accept shipments with status 'delivered' or 'completed'
        return result;
      });
    
    console.log(`🔍 [DEBUG] Found ${completedShipments.length} completed shipments for taşıyıcı`);
    
    // Enrich shipments with sender, nakliyeci, and driver info
    const enrichedShipments = completedShipments.map(shipment => {
      // Get sender user info
      const senderUserId = shipment.userId;
      const normalizedSenderUserId = normalizeUserId(senderUserId);
      const senderUser = demoUsersStore.get(senderUserId) ||
                         demoUsersStore.get(senderUserId?.toString()) ||
                         demoUsersStore.get(normalizedSenderUserId) ||
                         demoUsersStore.get(normalizedSenderUserId?.toString()) ||
                         demoUsersStore.get(`demo-${senderUserId}`) ||
                         demoUsersStore.get(`demo-${senderUserId?.toString()}`);

      // Get nakliyeci user info
      const nakliyeciId = shipment.carrierId;
      const normalizedNakliyeciId = normalizeUserId(nakliyeciId);
      const nakliyeciUser = nakliyeciId ? (
        demoUsersStore.get(nakliyeciId) ||
        demoUsersStore.get(nakliyeciId?.toString()) ||
        demoUsersStore.get(normalizedNakliyeciId) ||
        demoUsersStore.get(normalizedNakliyeciId?.toString()) ||
        demoUsersStore.get(`demo-${nakliyeciId}`) ||
        demoUsersStore.get(`demo-${nakliyeciId?.toString()}`)
      ) : null;

      // Get driver user info (the tasiyici who was assigned)
      const driverId = shipment.driverId || shipment.assignedDriverId;
      const normalizedDriverId = normalizeUserId(driverId);
      const driverUser = driverId ? (
        demoUsersStore.get(driverId) ||
        demoUsersStore.get(driverId?.toString()) ||
        demoUsersStore.get(normalizedDriverId) ||
        demoUsersStore.get(normalizedDriverId?.toString()) ||
        demoUsersStore.get(`demo-${driverId}`) ||
        demoUsersStore.get(`demo-${driverId?.toString()}`)
      ) : null;

      return {
        ...shipment,
        title: shipment.title || `${shipment.pickupCity || ''} → ${shipment.deliveryCity || ''}`,
        completedDate: shipment.deliveredAt || shipment.completedAt || shipment.updatedAt || new Date().toISOString(),
        rating: shipment.rating || null,
        sender: {
          name: senderUser?.fullName || senderUser?.name || shipment.shipperName || shipment.senderName || 'Bilinmiyor',
          company: senderUser?.companyName || shipment.shipperCompany || shipment.companyName || '',
          // phone: HIDDEN - Taşıyıcı gönderici telefon numarasını görmemeli
        },
        nakliyeci: {
          name: nakliyeciUser?.fullName || nakliyeciUser?.name || shipment.carrierName || 'Nakliyeci',
          phone: nakliyeciUser?.phone || shipment.carrierPhone || '',
          company: nakliyeciUser?.companyName || '',
        },
        driver: shipment.driver || (driverUser ? {
          name: driverUser?.fullName || driverUser?.name || shipment.driver?.name || 'Taşıyıcı',
          phone: driverUser?.phone || shipment.driver?.phone || '',
          vehicle: driverUser?.vehicle || shipment.driver?.vehicle || '',
        } : {
          name: shipment.driver?.name || 'Atanmadı',
          phone: shipment.driver?.phone || '',
          vehicle: shipment.driver?.vehicle || '',
        }),
      };
    });
  
    res.json({
      success: true,
      shipments: enrichedShipments,
      data: enrichedShipments,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments/tasiyici/completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Tamamlanan işler yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Helper function to safely serialize objects (handles circular references)
const safeStringify = (obj, maxDepth = 10, currentDepth = 0) => {
  if (currentDepth > maxDepth) return '[Max Depth Reached]';
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map(item => safeStringify(item, maxDepth, currentDepth + 1));
  }
  const result = {};
  try {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          result[key] = safeStringify(obj[key], maxDepth, currentDepth + 1);
        } catch (e) {
          result[key] = '[Serialization Error]';
        }
      }
    }
  } catch (e) {
    return '[Object Serialization Error]';
  }
  return result;
};

// Helper function to safely clone objects (handles circular references)
const safeClone = (obj, visited = new WeakSet()) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) {
    return obj.map(item => safeClone(item, visited));
  }
  if (visited.has(obj)) {
    return '[Circular Reference]';
  }
  visited.add(obj);
  const cloned = {};
  try {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          cloned[key] = safeClone(obj[key], visited);
        } catch (e) {
          cloned[key] = obj[key]; // Fallback to original value
        }
      }
    }
  } catch (e) {
    return obj; // Fallback to original object
  }
  visited.delete(obj);
  return cloned;
};

// Create shipment
app.post('/api/shipments', authenticateToken, (req, res) => {
  try {
    // Validate req.user exists
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası',
      });
    }

  const { userId } = req.user;
    let shipmentData = req.body;
    
    // INPUT VALIDATION
    if (!shipmentData || typeof shipmentData !== 'object' || Array.isArray(shipmentData)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz gönderi verisi',
      });
    }
    
    // Validate and sanitize title
    if (shipmentData.title) {
      shipmentData.title = sanitizeString(shipmentData.title, 200);
      if (!shipmentData.title) {
        return res.status(400).json({
          success: false,
          message: 'Gönderi başlığı gereklidir',
        });
      }
    }
    
    // Validate price if provided
    if (shipmentData.price !== undefined && !validatePrice(shipmentData.price)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz fiyat. Fiyat 0 ile 10.000.000 TL arasında olmalıdır.',
      });
    }
    
    // Validate addresses
    if (shipmentData.pickupAddress) {
      shipmentData.pickupAddress = sanitizeString(shipmentData.pickupAddress, 500);
    }
    if (shipmentData.deliveryAddress) {
      shipmentData.deliveryAddress = sanitizeString(shipmentData.deliveryAddress, 500);
    }
    
    // Validate dates
    if (shipmentData.pickupDate && !/^\d{4}-\d{2}-\d{2}/.test(shipmentData.pickupDate)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz toplama tarihi formatı (YYYY-MM-DD)',
      });
    }
    if (shipmentData.deliveryDate && !/^\d{4}-\d{2}-\d{2}/.test(shipmentData.deliveryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz teslimat tarihi formatı (YYYY-MM-DD)',
      });
    }
    
    // Normalize userId - remove "demo-" prefix if present for consistency
    const normalizedUserId = normalizeUserId(userId);
    
    console.log(`🔍 [DEBUG] /api/shipments POST - userId: ${userId}, normalized: ${normalizedUserId}, type: ${typeof userId}`);
    
    // Validate required fields
    if (!shipmentData || typeof shipmentData !== 'object' || Array.isArray(shipmentData)) {
      return res.status(400).json({
        success: false,
        message: 'Gönderi verisi gereklidir ve geçerli bir obje olmalıdır',
      });
    }
    
    // Safely log shipmentData keys
    try {
      const keys = Object.keys(shipmentData);
      console.log(`🔍 [DEBUG] shipmentData keys (${keys.length}): ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);
    } catch (e) {
      console.log(`⚠️ [DEBUG] Could not log shipmentData keys: ${e.message}`);
    }
    
    // Validate shipmentIdCounter exists and is a number
    if (typeof shipmentIdCounter !== 'number' || isNaN(shipmentIdCounter)) {
      console.error('❌ [ERROR] shipmentIdCounter is invalid, resetting to 1');
      shipmentIdCounter = 1;
    }
    
    // Validate stores exist
    if (!demoShipmentsStore || !(demoShipmentsStore instanceof Map)) {
      console.error('❌ [ERROR] demoShipmentsStore is invalid');
      return res.status(500).json({
        success: false,
        message: 'Backend veri deposu hatası',
      });
    }
    
    // Get user info for sender name - try multiple formats including normalized
    let user = null;
    if (userId && demoUsersStore && demoUsersStore instanceof Map) {
      try {
        // Try direct lookup
        user = demoUsersStore.get(userId) || 
               demoUsersStore.get(userId?.toString()) || 
               demoUsersStore.get(parseInt(userId)) ||
               demoUsersStore.get(Number(userId));
        
        // If not found, try with normalized userId
        if (!user && normalizedUserId) {
          user = demoUsersStore.get(normalizedUserId) ||
                 demoUsersStore.get(normalizedUserId?.toString()) ||
                 demoUsersStore.get(parseInt(normalizedUserId)) ||
                 demoUsersStore.get(Number(normalizedUserId));
        }
        
        // If still not found, try with "demo-" prefix
        if (!user && normalizedUserId) {
          const demoUserId = `demo-${normalizedUserId}`;
          user = demoUsersStore.get(demoUserId) ||
                 demoUsersStore.get(demoUserId?.toString());
        }
      } catch (e) {
        console.log(`⚠️ [DEBUG] Error getting user: ${e.message}`);
      }
    }
    
    const senderName = user ? (user.fullName || user.name || user.companyName || 'Bilinmiyor') : 'Bilinmiyor';
    
    console.log(`🔍 [DEBUG] user found: ${!!user}, senderName: ${senderName}`);
    
    // Safely handle nested objects and undefined values
    const safeShipmentData = {};
    try {
      for (const key in shipmentData) {
        if (shipmentData.hasOwnProperty(key)) {
          const value = shipmentData[key];
          // Skip undefined and null values, but keep empty strings and 0
          if (value !== undefined && value !== null) {
            // Handle nested objects (like categoryData)
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && value !== null) {
              try {
                // Use safe clone instead of JSON.parse(JSON.stringify())
                safeShipmentData[key] = safeClone(value);
              } catch (e) {
                // If cloning fails, try to create a simple copy
                console.log(`⚠️ [DEBUG] Could not clone ${key}, using simple copy: ${e.message}`);
                try {
                  safeShipmentData[key] = { ...value };
                } catch (e2) {
                  // If that also fails, store as string representation
                  safeShipmentData[key] = String(value);
                }
              }
            } else if (Array.isArray(value)) {
              // Handle arrays
              try {
                safeShipmentData[key] = value.map(item => {
                  if (typeof item === 'object' && item !== null) {
                    return safeClone(item);
                  }
                  return item;
                });
              } catch (e) {
                safeShipmentData[key] = value; // Fallback to original
              }
            } else {
              safeShipmentData[key] = value;
            }
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ [DEBUG] Error processing shipmentData: ${e.message}`);
      // If processing fails, use original data with basic sanitization
      Object.keys(shipmentData || {}).forEach(key => {
        if (shipmentData.hasOwnProperty(key) && shipmentData[key] !== undefined && shipmentData[key] !== null) {
          try {
            safeShipmentData[key] = shipmentData[key];
          } catch (e2) {
            console.log(`⚠️ [DEBUG] Could not copy key ${key}: ${e2.message}`);
          }
        }
      });
    }
    
    // Create new shipment with all required fields
    const newShipmentId = shipmentIdCounter++;
  const newShipment = {
      id: newShipmentId,
      ...safeShipmentData,
      userId: normalizedUserId, // Use normalized userId for consistency
      status: safeShipmentData.status || 'open',
    createdAt: new Date().toISOString(),
      pickupAddress: safeShipmentData.pickupAddress || safeShipmentData.pickupCity || '',
      deliveryAddress: safeShipmentData.deliveryAddress || safeShipmentData.deliveryCity || '',
      pickupDate: safeShipmentData.pickupDate || '',
      deliveryDate: safeShipmentData.deliveryDate || '',
      price: typeof safeShipmentData.price === 'number' ? safeShipmentData.price : (parseFloat(safeShipmentData.price) || 0),
      sender: senderName,
      senderName: senderName,
      shipperName: senderName, // Frontend compatibility
    };
    
    // Validate newShipment before storing
    if (!newShipment.id || isNaN(newShipment.id)) {
      throw new Error('Invalid shipment ID generated');
    }
    
    // Store shipment
    try {
  demoShipmentsStore.set(newShipment.id, newShipment);
      saveData();
    } catch (e) {
      console.error('❌ [ERROR] Failed to store shipment:', e);
      throw new Error('Failed to store shipment: ' + e.message);
    }
    
    console.log(`✅ [DEBUG] Shipment created successfully: ${newShipment.id}`);
  
    // Send notification to all nakliyecis about new shipment
    io.emit('notification:new', {
      type: 'shipment_created',
      title: 'Yeni Gönderi Yayınlandı',
      message: `${newShipment.title || 'Yeni gönderi'} - ${newShipment.from} → ${newShipment.to}`,
      shipmentId: newShipment.id,
      userId: newShipment.userId,
      timestamp: new Date().toISOString(),
    });
  
  res.json({
    success: true,
    data: newShipment,
    message: 'Gönderi başarıyla oluşturuldu',
  });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments POST error:', error);
    console.error('❌ [ERROR] Stack trace:', error.stack);
    
    // Safely log request body
    try {
      const safeBody = safeStringify(req.body);
      console.error('❌ [ERROR] Request body:', JSON.stringify(safeBody, null, 2));
    } catch (e) {
      console.error('❌ [ERROR] Could not serialize request body:', e.message);
      console.error('❌ [ERROR] Request body type:', typeof req.body);
    }
    
    res.status(500).json({
      success: false,
      message: 'Gönderi oluşturulurken bir hata oluştu',
      error: error.message || 'Bilinmeyen hata',
    });
  }
});

// Update shipment
// Get single shipment by ID
app.get('/api/shipments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const shipment = demoShipmentsStore.get(parseInt(id)) || demoShipmentsStore.get(id);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }
    
    // Enrich shipment with user info
    const senderUserId = shipment.userId;
    const normalizedSenderUserId = normalizeUserId(senderUserId);
    const senderUser = demoUsersStore.get(senderUserId) ||
                       demoUsersStore.get(senderUserId?.toString()) ||
                       demoUsersStore.get(normalizedSenderUserId) ||
                       demoUsersStore.get(normalizedSenderUserId?.toString()) ||
                       demoUsersStore.get(`demo-${senderUserId}`) ||
                       demoUsersStore.get(`demo-${senderUserId?.toString()}`);
    
    const carrierId = shipment.carrierId;
    const normalizedCarrierId = normalizeUserId(carrierId);
    const carrierUser = carrierId ? (
      demoUsersStore.get(carrierId) ||
      demoUsersStore.get(carrierId?.toString()) ||
      demoUsersStore.get(normalizedCarrierId) ||
      demoUsersStore.get(normalizedCarrierId?.toString()) ||
      demoUsersStore.get(`demo-${carrierId}`) ||
      demoUsersStore.get(`demo-${carrierId?.toString()}`)
    ) : null;
    
    const driverId = shipment.driverId || shipment.assignedDriverId;
    const normalizedDriverId = normalizeUserId(driverId);
    const driverUser = driverId ? (
      demoUsersStore.get(driverId) ||
      demoUsersStore.get(driverId?.toString()) ||
      demoUsersStore.get(normalizedDriverId) ||
      demoUsersStore.get(normalizedDriverId?.toString()) ||
      demoUsersStore.get(`demo-${driverId}`) ||
      demoUsersStore.get(`demo-${driverId?.toString()}`)
    ) : null;
    
    const nakliyeciInfo = carrierUser ? {
      name: carrierUser?.fullName || carrierUser?.name || shipment.carrierName || 'Nakliyeci',
      phone: carrierUser?.phone || shipment.carrierPhone || '',
      company: carrierUser?.companyName || shipment.carrierCompany || '',
      email: carrierUser?.email || shipment.carrierEmail || '',
    } : null;
    
    // PRIVACY: Gönderici telefon numarası sadece gönderici kendisi görebilir
    // Nakliyeci ve taşıyıcı gönderici telefon numarasını görmemeli
    const enrichedShipment = {
      ...shipment,
      sender: {
        name: senderUser?.fullName || senderUser?.name || shipment.shipperName || shipment.senderName || 'Bilinmiyor',
        company: senderUser?.companyName || shipment.shipperCompany || shipment.companyName || '',
        // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
      },
      nakliyeci: nakliyeciInfo,
      // Frontend compatibility - map nakliyeci object to individual fields
      nakliyeciName: nakliyeciInfo?.name || shipment.nakliyeciName || shipment.carrierName || '',
      nakliyeciCompany: nakliyeciInfo?.company || shipment.nakliyeciCompany || shipment.carrierCompany || '',
      nakliyeciPhone: nakliyeciInfo?.phone || shipment.nakliyeciPhone || shipment.carrierPhone || '',
      nakliyeciEmail: nakliyeciInfo?.email || shipment.nakliyeciEmail || shipment.carrierEmail || '',
      driver: shipment.driver || (driverUser ? {
        name: driverUser?.fullName || driverUser?.name || shipment.driver?.name || 'Taşıyıcı',
        phone: driverUser?.phone || shipment.driver?.phone || '',
        vehicle: driverUser?.vehicle || shipment.driver?.vehicle || '',
      } : {
        name: shipment.driver?.name || 'Atanmadı',
        phone: shipment.driver?.phone || '',
        vehicle: shipment.driver?.vehicle || '',
      }),
    };
    
    res.json({
      success: true,
      data: enrichedShipment,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments/:id GET error:', error);
    res.status(500).json({
      success: false,
      message: 'Gönderi yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

app.put('/api/shipments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const shipment = demoShipmentsStore.get(parseInt(id));
  
  if (!shipment) {
    return res.status(404).json({
      success: false,
      message: 'Gönderi bulunamadı',
    });
  }
  
  // VALIDATION: Prevent updates to cancelled or completed shipments
  if (shipment.status === 'cancelled' || shipment.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: `${shipment.status === 'cancelled' ? 'İptal edilmiş' : 'Tamamlanmış'} gönderiler güncellenemez`,
    });
  }
  
  const updateData = { ...req.body };
  const oldStatus = shipment.status;
  const newStatus = updateData.status;
  
  // VALIDATION: Check if status transition is valid
  if (newStatus && newStatus !== oldStatus) {
    const validStatusTransitions = {
      'open': ['accepted', 'cancelled'],
      'accepted': ['assigned', 'in_transit', 'cancelled'],
      'assigned': ['in_transit', 'picked_up', 'cancelled'],
      'picked_up': ['in_transit', 'cancelled'],
      'in_transit': ['delivered', 'cancelled'],
      'delivered': ['completed'],
      'completed': [], // Terminal state
      'cancelled': [], // Terminal state
    };
    
    const allowedTransitions = validStatusTransitions[oldStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Geçersiz durum geçişi: ${oldStatus} → ${newStatus}. İzin verilen geçişler: ${allowedTransitions.join(', ')}`,
      });
    }
  }
  
  // If status is being updated to 'delivered' or 'completed', set deliveredAt
  if (updateData.status === 'delivered' || updateData.status === 'completed') {
    updateData.deliveredAt = new Date().toISOString();
    updateData.completedAt = new Date().toISOString();
  }
  
  const updatedShipment = {
    ...shipment,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  demoShipmentsStore.set(parseInt(id), updatedShipment);
  saveData();
  
  // Send notifications based on status changes
  const senderUserId = shipment.userId;
  const normalizedSenderUserId = normalizeUserId(senderUserId);
  const carrierId = shipment.carrierId;
  const normalizedCarrierId = normalizeUserId(carrierId);
  const driverId = shipment.driverId || shipment.assignedDriverId;
  const normalizedDriverId = normalizeUserId(driverId);
  
  if (newStatus && newStatus !== oldStatus) {
    if (newStatus === 'picked_up') {
      // Taşıyıcı yükü aldı
      io.emit('notification:new', {
        type: 'shipment_picked_up',
        title: 'Yük Alındı',
        message: `Taşıyıcı yükü aldı. Gönderi yola çıktı.`,
        shipmentId: parseInt(id),
        userId: normalizedSenderUserId, // Send to sender
        timestamp: new Date().toISOString(),
      });
    } else if (newStatus === 'in_transit') {
      // Yolda
      io.emit('notification:new', {
        type: 'shipment_in_transit',
        title: 'Gönderi Yolda',
        message: `Gönderiniz yola çıktı. Canlı takip ile konumunu takip edebilirsiniz.`,
        shipmentId: parseInt(id),
        userId: normalizedSenderUserId, // Send to sender
        timestamp: new Date().toISOString(),
      });
    } else if (newStatus === 'delivered') {
      // Teslim edildi
      io.emit('notification:new', {
        type: 'shipment_delivered',
        title: 'Gönderi Teslim Edildi',
        message: `Gönderiniz teslim edildi. Lütfen onaylayın ve değerlendirme yapın.`,
        shipmentId: parseInt(id),
        userId: normalizedSenderUserId, // Send to sender
        timestamp: new Date().toISOString(),
      });
      
      // Also notify carrier
      if (normalizedCarrierId) {
        io.emit('notification:new', {
          type: 'shipment_delivered_carrier',
          title: 'Gönderi Teslim Edildi',
          message: `Gönderi teslim edildi. Gönderici onayı bekleniyor.`,
          shipmentId: parseInt(id),
          userId: normalizedCarrierId, // Send to carrier
          timestamp: new Date().toISOString(),
        });
      }
    } else if (newStatus === 'cancelled') {
      // İptal edildi - Handle refunds and notifications
      const cancellationReason = updateData.cancellationReason || 'Gönderici tarafından iptal edildi';
      
      // Notify sender
      io.emit('notification:new', {
        type: 'shipment_cancelled',
        title: 'Gönderi İptal Edildi',
        message: `Gönderiniz iptal edildi.${shipment.price > 0 ? ' Ödeme iadesi işleme alınacak.' : ''}`,
        shipmentId: parseInt(id),
        cancellationReason: cancellationReason,
        userId: normalizedSenderUserId,
        timestamp: new Date().toISOString(),
      });
      
      // Notify carrier
      if (normalizedCarrierId) {
        io.emit('notification:new', {
          type: 'shipment_cancelled_carrier',
          title: 'Gönderi İptal Edildi',
          message: `Gönderi iptal edildi: ${cancellationReason}`,
          shipmentId: parseInt(id),
          cancellationReason: cancellationReason,
          userId: normalizedCarrierId,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Notify driver
      if (normalizedDriverId) {
        io.emit('notification:new', {
          type: 'shipment_cancelled_driver',
          title: 'İş İptal Edildi',
          message: `Gönderi iptal edildi: ${cancellationReason}`,
          shipmentId: parseInt(id),
          cancellationReason: cancellationReason,
          userId: normalizedDriverId,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Handle refund if payment was made
      if (shipment.price > 0 && shipment.status !== 'open') {
        // Process refund (in production, integrate with payment gateway)
        try {
          const refundAmount = shipment.price;
          // Update wallet for sender (if wallet system exists)
          // In production, this would be a real refund transaction
          console.log(`💰 [REFUND] Processing refund for shipment ${id}: ₺${refundAmount}`);
          
          // Update shipment with refund info
          updatedShipment.refundAmount = refundAmount;
          updatedShipment.refundProcessedAt = new Date().toISOString();
          updatedShipment.refundStatus = 'pending'; // In production, this would be processed by payment gateway
        } catch (refundError) {
          console.error('❌ [ERROR] Refund processing failed:', refundError);
          // Don't fail the cancellation, but log the error
        }
      }
      
      // Reject all pending offers for this shipment
      const pendingOffers = Array.from(demoOffersStore.values())
        .filter(o => o.shipmentId === shipment.id && o.status === 'pending');
      
      pendingOffers.forEach(offer => {
        const rejectedOffer = {
          ...offer,
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: 'Gönderi iptal edildi',
        };
        demoOffersStore.set(offer.id, rejectedOffer);
      });
      
      // Close carrier market listings for this shipment
      const relatedListings = Array.from(carrierMarketListingsStore.values())
        .filter(l => l.shipmentId === shipment.id && l.status === 'active');
      
      relatedListings.forEach(listing => {
        listing.status = 'closed';
        listing.closedAt = new Date().toISOString();
        listing.closedReason = 'Gönderi iptal edildi';
        carrierMarketListingsStore.set(listing.id, listing);
      });
      
      // Reject all pending bids for related listings
      relatedListings.forEach(listing => {
        const pendingBids = Array.from(carrierMarketBidsStore.values())
          .filter(b => b.listingId === listing.id && b.status === 'pending');
        
        pendingBids.forEach(bid => {
          bid.status = 'rejected';
          bid.rejectedAt = new Date().toISOString();
          bid.rejectionReason = 'Gönderi iptal edildi';
          carrierMarketBidsStore.set(bid.id, bid);
        });
      });
      
      // Set cancellation timestamp
      updateData.cancelledAt = new Date().toISOString();
      
    } else if (newStatus === 'completed') {
      // Tamamlandı - Process payment and commission
      try {
        // ATOMIC TRANSACTION: Process payment to carrier
        if (normalizedCarrierId && shipment.price > 0) {
          // Get or initialize carrier wallet
          let carrierWallet = demoWalletStore.get(normalizedCarrierId) || demoWalletStore.get(carrierId);
          
          if (!carrierWallet) {
            carrierWallet = {
              balance: 0,
              pendingCommissions: 0,
              totalCommissions: 0,
              totalRefunds: 0,
              commissionRate: 1, // %1
              transactions: [],
            };
          }
          
          // Calculate commission (1% of shipment price)
          const commission = shipment.price * 0.01;
          const paymentToCarrier = shipment.price - commission;
          
          // Update carrier wallet (ATOMIC)
          carrierWallet.balance = (carrierWallet.balance || 0) + paymentToCarrier;
          carrierWallet.totalCommissions = (carrierWallet.totalCommissions || 0) + commission;
          
          // Add transaction record
          const transaction = {
            id: transactionIdCounter++,
            type: 'payment',
            shipmentId: parseInt(id),
            amount: paymentToCarrier,
            commission: commission,
            status: 'completed',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          };
          
          carrierWallet.transactions = carrierWallet.transactions || [];
          carrierWallet.transactions.push(transaction);
          
          // Save wallet (ATOMIC)
          demoWalletStore.set(normalizedCarrierId, carrierWallet);
          if (carrierId && carrierId !== normalizedCarrierId) {
            demoWalletStore.set(carrierId, carrierWallet);
          }
          
          console.log(`💰 [PAYMENT] Processed payment for shipment ${id}: ₺${paymentToCarrier} to carrier, ₺${commission} commission`);
        }
      } catch (paymentError) {
        console.error('❌ [ERROR] Payment processing failed:', paymentError);
        // Don't fail the completion, but log the error
        // In production, this should trigger a retry mechanism
      }
      
      // Tamamlandı
      io.emit('notification:new', {
        type: 'shipment_completed',
        title: 'Gönderi Tamamlandı',
        message: `Gönderi başarıyla tamamlandı. Değerlendirme yapabilirsiniz.`,
        shipmentId: parseInt(id),
        userId: normalizedSenderUserId, // Send to sender
        timestamp: new Date().toISOString(),
      });
      
      // Notify carrier
      if (normalizedCarrierId) {
        io.emit('notification:new', {
          type: 'shipment_completed_carrier',
          title: 'Gönderi Tamamlandı',
          message: `Gönderi başarıyla tamamlandı. Ödeme hesabınıza yatırıldı.`,
          shipmentId: parseInt(id),
          userId: normalizedCarrierId, // Send to carrier
          timestamp: new Date().toISOString(),
        });
      }
      
      // Notify driver
      if (normalizedDriverId) {
        io.emit('notification:new', {
          type: 'shipment_completed_driver',
          title: 'İş Tamamlandı',
          message: `Gönderi başarıyla tamamlandı.`,
          shipmentId: parseInt(id),
          userId: normalizedDriverId, // Send to driver
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    // Location update notifications with ETA calculation
    if (updateData.currentLocation || updateData.location) {
      const location = updateData.currentLocation || updateData.location;
      const locationStr = typeof location === 'string' ? location : 
                         (location?.city || location?.address || 'Konum bilgisi');
      
      // Calculate ETA if location and delivery address are available
      let etaMessage = '';
      if (shipment.deliveryAddress || shipment.deliveryCity) {
        // Simple ETA estimation (can be enhanced with actual distance calculation)
        const estimatedHours = updateData.estimatedArrivalHours || 
                              (updateData.etaHours ? parseInt(updateData.etaHours) : null);
        
        if (estimatedHours) {
          const arrivalTime = new Date();
          arrivalTime.setHours(arrivalTime.getHours() + estimatedHours);
          const arrivalTimeStr = arrivalTime.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          etaMessage = ` Tahmini varış saati: ${arrivalTimeStr} (${estimatedHours} saat sonra).`;
        }
      }
      
      io.emit('notification:new', {
        type: 'location_updated',
        title: 'Araç Konumu Güncellendi',
        message: `Araç şu an ${locationStr} konumunda.${etaMessage} Canlı takip sayfasından detaylı konumu görüntüleyebilirsiniz.`,
        shipmentId: parseInt(id),
        location: locationStr,
        currentLocation: location,
        estimatedArrivalHours: updateData.estimatedArrivalHours || updateData.etaHours || null,
        userId: normalizedSenderUserId, // Send to sender
        timestamp: new Date().toISOString(),
      });
      
      // Also notify if driver is on the way to pickup
      if (newStatus === 'in_transit' || shipment.status === 'in_transit' || shipment.status === 'assigned') {
        io.emit('notification:new', {
          type: 'driver_on_way',
          title: 'Taşıyıcı Yola Çıktı',
          message: `Taşıyıcı yola çıktı ve şu an ${locationStr} konumunda.${etaMessage} Lütfen hazır olun.`,
          shipmentId: parseInt(id),
          location: locationStr,
          estimatedArrivalHours: updateData.estimatedArrivalHours || updateData.etaHours || null,
          userId: normalizedSenderUserId, // Send to sender
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
  
  res.json({
    success: true,
    data: updatedShipment,
    message: 'Gönderi güncellendi',
  });
});

// Cancel shipment endpoint (POST /api/shipments/:id/cancel)
app.post('/api/shipments/:id/cancel', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { reason } = req.body;
    
    const shipment = demoShipmentsStore.get(parseInt(id));
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı',
      });
    }
    
    // VALIDATION: Check authorization - only sender or admin can cancel
    const normalizedUserId = normalizeUserId(userId);
    const normalizedShipmentUserId = normalizeUserId(shipment.userId);
    
    if (normalizedUserId !== normalizedShipmentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Bu gönderiyi iptal etme yetkiniz yok',
      });
    }
    
    // VALIDATION: Cannot cancel already completed or cancelled shipments
    if (shipment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Tamamlanmış gönderiler iptal edilemez',
      });
    }
    
    if (shipment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Gönderi zaten iptal edilmiş',
      });
    }
    
    // VALIDATION: Cannot cancel if already delivered (must be rejected by receiver)
    if (shipment.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Teslim edilmiş gönderiler iptal edilemez. Lütfen teslim reddi yapın.',
      });
    }
    
    // Update shipment status to cancelled
    const updatedShipment = {
      ...shipment,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || 'Gönderici tarafından iptal edildi',
      updatedAt: new Date().toISOString(),
    };
    
    demoShipmentsStore.set(parseInt(id), updatedShipment);
    saveData();
    
    // Send notifications (same as in PUT endpoint)
    const senderUserId = shipment.userId;
    const normalizedSenderUserId = normalizeUserId(senderUserId);
    const carrierId = shipment.carrierId;
    const normalizedCarrierId = normalizeUserId(carrierId);
    const driverId = shipment.driverId || shipment.assignedDriverId;
    const normalizedDriverId = normalizeUserId(driverId);
    
    const cancellationReason = reason || 'Gönderici tarafından iptal edildi';
    
    // Notify sender
    io.emit('notification:new', {
      type: 'shipment_cancelled',
      title: 'Gönderi İptal Edildi',
      message: `Gönderiniz iptal edildi.${shipment.price > 0 ? ' Ödeme iadesi işleme alınacak.' : ''}`,
      shipmentId: parseInt(id),
      cancellationReason: cancellationReason,
      userId: normalizedSenderUserId,
      timestamp: new Date().toISOString(),
    });
    
    // Notify carrier
    if (normalizedCarrierId) {
      io.emit('notification:new', {
        type: 'shipment_cancelled_carrier',
        title: 'Gönderi İptal Edildi',
        message: `Gönderi iptal edildi: ${cancellationReason}`,
        shipmentId: parseInt(id),
        cancellationReason: cancellationReason,
        userId: normalizedCarrierId,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Notify driver
    if (normalizedDriverId) {
      io.emit('notification:new', {
        type: 'shipment_cancelled_driver',
        title: 'İş İptal Edildi',
        message: `Gönderi iptal edildi: ${cancellationReason}`,
        shipmentId: parseInt(id),
        cancellationReason: cancellationReason,
        userId: normalizedDriverId,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Handle refund if payment was made (ATOMIC TRANSACTION)
    if (shipment.price > 0 && shipment.status !== 'open') {
      try {
        const refundAmount = shipment.price;
        console.log(`💰 [REFUND] Processing refund for shipment ${id}: ₺${refundAmount}`);
        
        updatedShipment.refundAmount = refundAmount;
        updatedShipment.refundProcessedAt = new Date().toISOString();
        updatedShipment.refundStatus = 'pending';
        
        // If carrier was already paid (completed/delivered status), reverse the transaction
        if (normalizedCarrierId && (shipment.status === 'completed' || shipment.status === 'delivered')) {
          let carrierWallet = demoWalletStore.get(normalizedCarrierId) || demoWalletStore.get(carrierId);
          
          if (carrierWallet) {
            // Reverse payment (ATOMIC)
            const commission = shipment.price * 0.01;
            const paymentToCarrier = shipment.price - commission;
            
            // ATOMIC: Update wallet balance (prevent negative)
            const currentBalance = carrierWallet.balance || 0;
            const newBalance = Math.max(0, currentBalance - paymentToCarrier);
            
            carrierWallet.balance = newBalance;
            carrierWallet.totalCommissions = Math.max(0, (carrierWallet.totalCommissions || 0) - commission);
            carrierWallet.totalRefunds = (carrierWallet.totalRefunds || 0) + paymentToCarrier;
            
            // Add refund transaction
            const refundTransaction = {
              id: transactionIdCounter++,
              type: 'refund',
              shipmentId: parseInt(id),
              amount: paymentToCarrier,
              commission: commission,
              status: 'completed',
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            };
            
            carrierWallet.transactions = carrierWallet.transactions || [];
            carrierWallet.transactions.push(refundTransaction);
            
            // Save wallet (ATOMIC)
            demoWalletStore.set(normalizedCarrierId, carrierWallet);
            if (carrierId && carrierId !== normalizedCarrierId) {
              demoWalletStore.set(carrierId, carrierWallet);
            }
            
            console.log(`💰 [REFUND] Reversed payment for shipment ${id}: ₺${paymentToCarrier} from carrier (balance: ${currentBalance} → ${newBalance})`);
          }
        }
        
        demoShipmentsStore.set(parseInt(id), updatedShipment);
        saveData();
      } catch (refundError) {
        console.error('❌ [ERROR] Refund processing failed:', refundError);
        // In production, this should trigger an alert and retry mechanism
      }
    }
    
    // Reject all pending offers
    const pendingOffers = Array.from(demoOffersStore.values())
      .filter(o => o.shipmentId === shipment.id && o.status === 'pending');
    
    pendingOffers.forEach(offer => {
      const rejectedOffer = {
        ...offer,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: 'Gönderi iptal edildi',
      };
      demoOffersStore.set(offer.id, rejectedOffer);
    });
    
    // Close carrier market listings
    const relatedListings = Array.from(carrierMarketListingsStore.values())
      .filter(l => l.shipmentId === shipment.id && l.status === 'active');
    
    relatedListings.forEach(listing => {
      listing.status = 'closed';
      listing.closedAt = new Date().toISOString();
      listing.closedReason = 'Gönderi iptal edildi';
      carrierMarketListingsStore.set(listing.id, listing);
    });
    
    // Reject all pending bids
    relatedListings.forEach(listing => {
      const pendingBids = Array.from(carrierMarketBidsStore.values())
        .filter(b => b.listingId === listing.id && b.status === 'pending');
      
      pendingBids.forEach(bid => {
        bid.status = 'rejected';
        bid.rejectedAt = new Date().toISOString();
        bid.rejectionReason = 'Gönderi iptal edildi';
        carrierMarketBidsStore.set(bid.id, bid);
      });
    });
    
    saveData();
    
    res.json({
      success: true,
      data: updatedShipment,
      message: 'Gönderi başarıyla iptal edildi',
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments/:id/cancel error:', error);
    res.status(500).json({
      success: false,
      message: 'Gönderi iptal edilirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Assign driver (taşıyıcı) to shipment
app.post('/api/shipments/:id/assign-driver', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const { userId } = req.user;

    console.log(`🔍 [DEBUG] /api/shipments/${id}/assign-driver - userId: ${userId}, driverId: ${driverId}`);

    const shipment = demoShipmentsStore.get(parseInt(id));

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı',
      });
    }

    // Verify that the user is the nakliyeci who accepted this shipment
    const normalizedUserId = normalizeUserId(userId);
    const shipmentCarrierId = shipment.carrierId;
    const normalizedShipmentCarrierId = normalizeUserId(shipmentCarrierId);

    const isAuthorized = 
      shipmentCarrierId === userId ||
      shipmentCarrierId === userId?.toString() ||
      shipmentCarrierId?.toString() === userId ||
      normalizedShipmentCarrierId === normalizedUserId ||
      normalizedShipmentCarrierId === userId ||
      normalizedShipmentCarrierId === userId?.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bu gönderiyi atama yetkiniz yok',
      });
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Taşıyıcı ID gerekli',
      });
    }

    // Get driver (taşıyıcı) user info
    const normalizedDriverId = normalizeUserId(driverId);
    const driverUser = demoUsersStore.get(driverId) ||
                       demoUsersStore.get(driverId?.toString()) ||
                       demoUsersStore.get(normalizedDriverId) ||
                       demoUsersStore.get(normalizedDriverId?.toString()) ||
                       demoUsersStore.get(`demo-${driverId}`) ||
                       demoUsersStore.get(`demo-${driverId?.toString()}`) ||
                       demoUsersStore.get(`demo-${normalizedDriverId}`) ||
                       demoUsersStore.get(`demo-${normalizedDriverId?.toString()}`);

    if (!driverUser || driverUser.userType !== 'tasiyici') {
      return res.status(404).json({
        success: false,
        message: 'Taşıyıcı bulunamadı',
      });
    }

    // Update shipment with driver assignment
    const updatedShipment = {
      ...shipment,
      assignedDriverId: driverId,
      driverId: driverId,
      assignedDriver: {
        id: driverId,
        name: driverUser.fullName || driverUser.name || 'Taşıyıcı',
        phone: driverUser.phone || '',
        vehicle: driverUser.vehicle || '',
      },
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoShipmentsStore.set(parseInt(id), updatedShipment);
    saveData();

    console.log(`✅ [DEBUG] Driver assigned - shipmentId: ${id}, driverId: ${driverId}, driverName: ${driverUser.fullName || driverUser.name}`);

    // Send notification to driver about assignment
    io.emit('notification:new', {
      type: 'driver_assigned',
      title: 'Yeni İş Atandı',
      message: `${shipment.title || 'Gönderi'} size atandı. Detayları görüntüleyin.`,
      shipmentId: parseInt(id),
      userId: driverId, // Send to driver
      timestamp: new Date().toISOString(),
    });
    
    // Send notification to sender about driver assignment
    const senderUserId = shipment.userId;
    const normalizedSenderUserId = normalizeUserId(senderUserId);
    io.emit('notification:new', {
      type: 'driver_assigned_to_sender',
      title: 'Taşıyıcı Atandı',
      message: `Gönderiniz için taşıyıcı atandı: ${driverUser.fullName || driverUser.name}. Taşıyıcı yakında sizinle iletişime geçecek.`,
      shipmentId: parseInt(id),
      driverName: driverUser.fullName || driverUser.name,
      driverPhone: driverUser.phone || '',
      userId: normalizedSenderUserId, // Send to sender
      timestamp: new Date().toISOString(),
    });
    
    // Send notification to carrier about assignment confirmation
    const carrierId = shipment.carrierId;
    const normalizedCarrierId = normalizeUserId(carrierId);
    io.emit('notification:new', {
      type: 'driver_assigned_confirmation',
      title: 'Taşıyıcı Atama Onayı',
      message: `Taşıyıcı başarıyla atandı: ${driverUser.fullName || driverUser.name}`,
      shipmentId: parseInt(id),
      userId: normalizedCarrierId, // Send to carrier
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: updatedShipment,
      message: 'Taşıyıcı başarıyla atandı',
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments/:id/assign-driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Taşıyıcı atanırken bir hata oluştu',
      error: error.message,
    });
  }
});

// Get nakliyeci active shipments (accepted offers)
app.get('/api/shipments/nakliyeci/active', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10, status } = req.query;
    
    console.log(`🔍 [DEBUG] /api/shipments/nakliyeci/active - userId: ${userId}`);
    
    // Get all accepted offers for this nakliyeci
    const normalizedUserId = normalizeUserId(userId);
    const acceptedOffers = Array.from(demoOffersStore.values())
      .filter(o => {
        const normalizedOfferCarrierId = normalizeUserId(o.carrierId);
        const normalizedOfferUserId = normalizeUserId(o.userId);
        const carrierMatch = 
          o.carrierId === userId ||
          o.carrierId === userId?.toString() ||
          o.carrierId?.toString() === userId ||
          normalizedOfferCarrierId === normalizedUserId ||
          normalizedOfferCarrierId === userId ||
          normalizedOfferCarrierId === userId?.toString() ||
          o.userId === userId ||
          o.userId === userId?.toString() ||
          o.userId?.toString() === userId ||
          normalizedOfferUserId === normalizedUserId ||
          normalizedOfferUserId === userId ||
          normalizedOfferUserId === userId?.toString();
        
        return carrierMatch && o.status === 'accepted';
      });
    
    console.log(`🔍 [DEBUG] Found ${acceptedOffers.length} accepted offers for nakliyeci`);
    
    // Get shipments for accepted offers
    const activeShipments = acceptedOffers
      .map(offer => {
        const shipment = Array.from(demoShipmentsStore.values())
          .find(s => s.id === offer.shipmentId || s.id === parseInt(offer.shipmentId));
        
        if (!shipment) return null;
        
        // Filter by status if provided
        if (status && status !== 'all') {
          if (status === 'pending' && shipment.status !== 'accepted') return null;
          if (status === 'in_transit' && shipment.status !== 'in_transit') return null;
          if (status === 'delivered' && shipment.status !== 'delivered') return null;
        }
        
        // Get carrier user info for driver - try multiple formats
        const carrierId = shipment.carrierId || offer.carrierId || offer.userId;
        const normalizedCarrierId = normalizeUserId(carrierId);
        
        const carrierUser = carrierId ? (
          demoUsersStore.get(carrierId) ||
          demoUsersStore.get(carrierId?.toString()) ||
          demoUsersStore.get(normalizedCarrierId) ||
          demoUsersStore.get(normalizedCarrierId?.toString()) ||
          demoUsersStore.get(`demo-${carrierId}`) ||
          demoUsersStore.get(`demo-${carrierId?.toString()}`) ||
          demoUsersStore.get(`demo-${normalizedCarrierId}`) ||
          demoUsersStore.get(`demo-${normalizedCarrierId?.toString()}`) ||
          demoUsersStore.get(offer.carrierId) ||
          demoUsersStore.get(offer.carrierId?.toString()) ||
          demoUsersStore.get(`demo-${offer.carrierId}`) ||
          demoUsersStore.get(`demo-${offer.carrierId?.toString()}`) ||
          demoUsersStore.get(offer.userId) ||
          demoUsersStore.get(offer.userId?.toString()) ||
          demoUsersStore.get(`demo-${offer.userId}`) ||
          demoUsersStore.get(`demo-${offer.userId?.toString()}`)
        ) : null;
        
        console.log(`🔍 [DEBUG] /api/shipments/nakliyeci/active - shipmentId: ${shipment.id}, carrierId: ${carrierId}, normalized: ${normalizedCarrierId}`);
        console.log(`🔍 [DEBUG] carrierUser found: ${!!carrierUser}, name: ${carrierUser?.fullName || carrierUser?.name || 'N/A'}, phone: ${carrierUser?.phone || 'N/A'}, vehicle: ${carrierUser?.vehicle || 'N/A'}`);
        
        // Get sender user info for shipper
        const senderUserId = shipment.userId;
        const normalizedSenderUserId = normalizeUserId(senderUserId);
        const senderUser = demoUsersStore.get(senderUserId) ||
                           demoUsersStore.get(senderUserId?.toString()) ||
                           demoUsersStore.get(normalizedSenderUserId) ||
                           demoUsersStore.get(normalizedSenderUserId?.toString()) ||
                           demoUsersStore.get(`demo-${senderUserId}`) ||
                           demoUsersStore.get(`demo-${senderUserId?.toString()}`);
        
        // Ensure driver and shipper objects exist with complete info
        // Always rebuild driver object from carrierUser to ensure complete info
        const driver = {
          name: carrierUser?.fullName || carrierUser?.name || shipment.carrierName || offer.carrierName || shipment.driver?.name || 'Atanmadı',
          phone: carrierUser?.phone || shipment.driver?.phone || shipment.carrierPhone || offer.carrierPhone || shipment.contactPhone || shipment.phone || '',
          vehicle: carrierUser?.vehicle || shipment.driver?.vehicle || shipment.vehicle || offer.carrierVehicle || '',
        };
        
        // PRIVACY: Gönderici telefon numarası gizlenmeli - nakliyeci sadece mesaj yoluyla ulaşabilir
        const shipper = shipment.shipper || {
          name: senderUser?.fullName || senderUser?.name || shipment.shipperName || shipment.senderName || shipment.sender || shipment.contactPerson || '',
          company: senderUser?.companyName || shipment.shipperCompany || shipment.companyName || '',
          // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
        };
        
        return {
          ...shipment,
          driver,
          shipper,
          offerId: offer.id,
          offerPrice: offer.price,
          offerAcceptedAt: offer.acceptedAt,
        };
      })
      .filter(s => s !== null);
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedShipments = activeShipments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedShipments,
      shipments: paginatedShipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activeShipments.length,
        totalPages: Math.ceil(activeShipments.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/shipments/nakliyeci/active error:', error);
    res.status(500).json({
      success: false,
      message: 'Aktif gönderiler yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Offers endpoints
// Get individual sender's offers
app.get('/api/offers/individual', authenticateToken, (req, res) => {
  const { userId } = req.user;
  
  console.log(`🔍 [DEBUG] /api/offers/individual - userId: ${userId}, type: ${typeof userId}`);
  console.log(`🔍 [DEBUG] All offers count: ${demoOffersStore.size}`);
  
  // Get offers for shipments owned by this user
  // Try multiple formats for userId matching
  const userOffers = Array.from(demoOffersStore.values())
    .filter(o => {
      const offerUserId = o.shipmentUserId;
      const matches = 
        offerUserId === userId ||
        offerUserId === userId?.toString() ||
        offerUserId?.toString() === userId ||
        parseInt(offerUserId) === parseInt(userId) ||
        Number(offerUserId) === Number(userId);
      
      if (matches) {
        console.log(`✅ [DEBUG] Match found - offerId: ${o.id}, shipmentUserId: ${offerUserId}, userId: ${userId}`);
      }
      return matches;
    });
  
  console.log(`🔍 [DEBUG] Filtered offers count: ${userOffers.length}`);
  
  res.json({
    success: true,
    data: userOffers,
    offers: userOffers,
  });
});

// Get corporate sender's offers
app.get('/api/offers/corporate', authenticateToken, (req, res) => {
  const { userId } = req.user;
  
  console.log(`🔍 [DEBUG] /api/offers/corporate - userId: ${userId}, type: ${typeof userId}`);
  console.log(`🔍 [DEBUG] All offers count: ${demoOffersStore.size}`);
  
  // Log all offers for debugging
  const allOffers = Array.from(demoOffersStore.values());
  console.log(`🔍 [DEBUG] All offers details:`);
  allOffers.forEach((o, idx) => {
    console.log(`  Offer ${idx + 1}: id=${o.id}, shipmentUserId=${o.shipmentUserId} (type: ${typeof o.shipmentUserId}), shipmentId=${o.shipmentId}`);
  });
  
  // Log all shipments for debugging
  const allShipments = Array.from(demoShipmentsStore.values());
  console.log(`🔍 [DEBUG] All shipments details:`);
  allShipments.forEach((s, idx) => {
    console.log(`  Shipment ${idx + 1}: id=${s.id}, userId=${s.userId} (type: ${typeof s.userId})`);
  });
  
  // Normalize userId formats for matching
  const normalizedUserId = normalizeUserId(userId);
  console.log(`🔍 [DEBUG] Normalized userId: ${normalizedUserId} (original: ${userId})`);
  
  // Get offers for shipments owned by this user
  // Try multiple formats for userId matching
  const userOffers = Array.from(demoOffersStore.values())
    .filter(o => {
      const offerUserId = o.shipmentUserId;
      if (!offerUserId) {
        console.log(`⚠️ [DEBUG] Offer ${o.id} has no shipmentUserId`);
        return false;
      }
      
      const normalizedOfferUserId = normalizeUserId(offerUserId);
      
      // Try all possible matching combinations - prioritize normalized matches
      const matches = 
        // Normalized matches (most reliable)
        String(normalizedOfferUserId) === String(normalizedUserId) ||
        normalizedOfferUserId === normalizedUserId ||
        // Direct matches
        String(offerUserId) === String(userId) ||
        offerUserId === userId ||
        offerUserId === userId?.toString() ||
        offerUserId?.toString() === userId ||
        // Cross-normalized matches
        normalizedOfferUserId === userId ||
        normalizedUserId === offerUserId ||
        // Numeric matches (if both are numeric)
        (!isNaN(offerUserId) && !isNaN(userId) && parseInt(offerUserId) === parseInt(userId)) ||
        (!isNaN(offerUserId) && !isNaN(userId) && Number(offerUserId) === Number(userId)) ||
        // Case-insensitive string matches
        String(offerUserId).toLowerCase() === String(userId).toLowerCase() ||
        String(normalizedOfferUserId).toLowerCase() === String(normalizedUserId).toLowerCase();
      
      if (matches) {
        console.log(`✅ [DEBUG] Match found - offerId: ${o.id}, shipmentUserId: ${offerUserId} (normalized: ${normalizedOfferUserId}), userId: ${userId} (normalized: ${normalizedUserId})`);
      } else {
        console.log(`❌ [DEBUG] No match - offerId: ${o.id}, shipmentUserId: ${offerUserId} (normalized: ${normalizedOfferUserId}), userId: ${userId} (normalized: ${normalizedUserId})`);
      }
      return matches;
    });
  
  console.log(`🔍 [DEBUG] Filtered offers count: ${userOffers.length}`);
  
  res.json({
    success: true,
    data: userOffers,
    offers: userOffers,
  });
});

// Get carrier's offers
app.get('/api/offers', authenticateToken, (req, res) => {
  const { userId } = req.user;
  
  const carrierOffers = Array.from(demoOffersStore.values())
    .filter(o => o.carrierId === userId || o.userId === userId);
  
  res.json({
    success: true,
    data: carrierOffers,
    offers: carrierOffers,
  });
});

// Create offer
app.post('/api/offers', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const offerData = req.body;
    
    console.log(`🔍 [DEBUG] /api/offers POST - carrierId (userId): ${userId}, type: ${typeof userId}`);
    console.log(`🔍 [DEBUG] offerData:`, JSON.stringify(offerData, null, 2));
    
    // Find the shipment to get the owner's ID
    const shipmentId = offerData.shipmentId || offerData.shipment_id;
    const shipment = Array.from(demoShipmentsStore.values())
      .find(s => s.id === shipmentId || s.id === parseInt(shipmentId));
    
    if (!shipment) {
      console.log(`❌ [DEBUG] Shipment not found for shipmentId: ${shipmentId}`);
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı',
      });
    }
    
    console.log(`🔍 [DEBUG] Found shipment - id: ${shipment.id}, userId: ${shipment.userId}, type: ${typeof shipment.userId}`);
    
    // Normalize shipmentUserId - remove "demo-" prefix if present for consistency
    const normalizedShipmentUserId = normalizeUserId(shipment.userId);
    
    console.log(`🔍 [DEBUG] Normalized shipmentUserId: ${normalizedShipmentUserId} (original: ${shipment.userId})`);
    
    const newOffer = {
      id: offerIdCounter++,
      shipmentId: shipmentId,
      shipmentUserId: normalizedShipmentUserId, // Use normalized userId for consistency
      carrierId: userId,
      userId: userId,
      price: offerData.price || 0,
      message: offerData.message || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      shipmentTitle: shipment.title || shipment.category || 'Gönderi',
      carrierName: 'Nakliyeci Demo User',
      carrierRating: 0,
      carrierVerified: false,
      carrierReviews: 0,
      carrierExperience: '',
      estimatedDelivery: offerData.estimatedDelivery || shipment.deliveryDate || '',
      pickupAddress: shipment.pickupAddress || '',
      deliveryAddress: shipment.deliveryAddress || '',
      weight: shipment.weight || '',
      priority: shipment.priority || 'medium',
    };
    
    console.log(`✅ [DEBUG] Created offer - id: ${newOffer.id}, shipmentUserId: ${newOffer.shipmentUserId}, carrierId: ${newOffer.carrierId}`);
    
    demoOffersStore.set(newOffer.id, newOffer);
    saveData();
    
    // Send notification to sender about new offer
    io.emit('notification:new', {
      type: 'offer_received',
      title: 'Yeni Teklif Alındı',
      message: `${newOffer.carrierName || 'Nakliyeci'} gönderiniz için teklif verdi: ₺${newOffer.price.toLocaleString()}`,
      shipmentId: newOffer.shipmentId,
      offerId: newOffer.id,
      userId: normalizedShipmentUserId, // Send to sender
      timestamp: new Date().toISOString(),
    });
    
    res.json({
      success: true,
      data: newOffer,
      message: 'Teklif başarıyla gönderildi',
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/offers POST error:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif gönderilirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Helper functions for offer actions
const handleAcceptOffer = (req, res) => {
  const { id } = req.params;
  const offer = demoOffersStore.get(parseInt(id));
  
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Teklif bulunamadı',
    });
  }
  
  // RACE CONDITION FIX: Check if offer is already accepted
  if (offer.status === 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Bu teklif zaten kabul edilmiş',
    });
  }
  
  // RACE CONDITION FIX: Check if shipment already has accepted offer
  const shipment = Array.from(demoShipmentsStore.values())
    .find(s => s.id === offer.shipmentId || s.id === parseInt(offer.shipmentId));
  
  if (shipment && shipment.status === 'accepted') {
    // Check if there's already an accepted offer for this shipment
    const existingAcceptedOffer = Array.from(demoOffersStore.values())
      .find(o => o.shipmentId === offer.shipmentId && o.status === 'accepted' && o.id !== parseInt(id));
    
    if (existingAcceptedOffer) {
      return res.status(400).json({
        success: false,
        message: 'Bu gönderi için zaten bir teklif kabul edilmiş',
      });
    }
  }
  
  const updatedOffer = {
    ...offer,
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
  };
  
  demoOffersStore.set(parseInt(id), updatedOffer);
  
  // Update shipment status and add carrier/driver info
  // shipment is already defined above, reuse it
  if (!shipment) {
    return res.status(404).json({
      success: false,
      message: 'Gönderi bulunamadı',
    });
  }
  if (shipment) {
    // Get carrier user info - try multiple formats
    const carrierId = offer.carrierId || offer.userId;
    const normalizedCarrierId = normalizeUserId(carrierId);
    
    const carrierUser = demoUsersStore.get(carrierId) || 
                       demoUsersStore.get(carrierId?.toString()) ||
                       demoUsersStore.get(normalizedCarrierId) ||
                       demoUsersStore.get(normalizedCarrierId?.toString()) ||
                       demoUsersStore.get(`demo-${carrierId}`) ||
                       demoUsersStore.get(`demo-${carrierId?.toString()}`) ||
                       demoUsersStore.get(`demo-${normalizedCarrierId}`) ||
                       demoUsersStore.get(`demo-${normalizedCarrierId?.toString()}`) ||
                       demoUsersStore.get(offer.carrierId) ||
                       demoUsersStore.get(offer.carrierId?.toString()) ||
                       demoUsersStore.get(`demo-${offer.carrierId}`) ||
                       demoUsersStore.get(`demo-${offer.carrierId?.toString()}`) ||
                       demoUsersStore.get(offer.userId) ||
                       demoUsersStore.get(offer.userId?.toString()) ||
                       demoUsersStore.get(`demo-${offer.userId}`) ||
                       demoUsersStore.get(`demo-${offer.userId?.toString()}`);
    
    console.log(`🔍 [DEBUG] handleAcceptOffer - carrierId: ${carrierId}, normalized: ${normalizedCarrierId}`);
    console.log(`🔍 [DEBUG] carrierUser found: ${!!carrierUser}, name: ${carrierUser?.fullName || carrierUser?.name || 'N/A'}, phone: ${carrierUser?.phone || 'N/A'}, vehicle: ${carrierUser?.vehicle || 'N/A'}`);
    
    // Get sender user info - try multiple formats
    const senderUserId = shipment.userId;
    const normalizedSenderUserId = normalizeUserId(senderUserId);
    
    const senderUser = demoUsersStore.get(senderUserId) ||
                       demoUsersStore.get(senderUserId?.toString()) ||
                       demoUsersStore.get(normalizedSenderUserId) ||
                       demoUsersStore.get(normalizedSenderUserId?.toString()) ||
                       demoUsersStore.get(`demo-${senderUserId}`) ||
                       demoUsersStore.get(`demo-${senderUserId?.toString()}`);
    
    console.log(`🔍 [DEBUG] handleAcceptOffer - senderUserId: ${senderUserId}, normalized: ${normalizedSenderUserId}`);
    console.log(`🔍 [DEBUG] senderUser found: ${!!senderUser}, name: ${senderUser?.fullName || senderUser?.name || 'N/A'}`);
    
    const updatedShipment = {
      ...shipment,
      status: 'accepted',
      acceptedOfferId: parseInt(id),
      carrierId: offer.carrierId || offer.userId,
      carrierName: offer.carrierName || carrierUser?.fullName || carrierUser?.name || 'Taşıyıcı',
      price: offer.price || shipment.price,
      // Add driver object for frontend compatibility
      driver: {
        name: offer.carrierName || carrierUser?.fullName || carrierUser?.name || 'Taşıyıcı',
        phone: carrierUser?.phone || offer.carrierPhone || shipment.contactPhone || shipment.phone || carrierUser?.phone || '',
        vehicle: carrierUser?.vehicle || offer.carrierVehicle || shipment.vehicle || carrierUser?.vehicle || '',
      },
      // Add shipper object for frontend compatibility
      // PRIVACY: Gönderici telefon numarası gizlenmeli - nakliyeci sadece mesaj yoluyla ulaşabilir
      shipper: {
        name: senderUser?.fullName || senderUser?.name || shipment.senderName || shipment.sender || shipment.contactPerson || '',
        company: senderUser?.companyName || shipment.shipperCompany || shipment.companyName || '',
        // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
      },
      shipperName: senderUser?.fullName || senderUser?.name || shipment.senderName || shipment.sender || shipment.contactPerson || '',
      shipperCompany: senderUser?.companyName || shipment.shipperCompany || shipment.companyName || '',
      // shipperPhone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
      updatedAt: new Date().toISOString(),
    };
    
    demoShipmentsStore.set(shipment.id, updatedShipment);
    // Also set with string key for compatibility
    if (shipment.id.toString() !== shipment.id) {
      demoShipmentsStore.set(shipment.id.toString(), updatedShipment);
    }
    saveData(); // Persist data immediately
    
    // Send notification to carrier about offer acceptance
    io.emit('notification:new', {
      type: 'offer_accepted',
      title: 'Teklifiniz Kabul Edildi',
      message: `${shipment.title || 'Gönderi'} için teklifiniz kabul edildi. Taşıyıcı atayabilirsiniz.`,
      shipmentId: shipment.id,
      offerId: parseInt(id),
      userId: carrierId, // Send to carrier
      timestamp: new Date().toISOString(),
    });
    
    // Send notification to sender about acceptance confirmation
    io.emit('notification:new', {
      type: 'offer_accepted_confirmation',
      title: 'Teklif Kabul Onayı',
      message: `Teklifiniz kabul edildi. Nakliyeci taşıyıcı atayacak.`,
      shipmentId: shipment.id,
      offerId: parseInt(id),
      userId: normalizedSenderUserId, // Send to sender
      timestamp: new Date().toISOString(),
    });
  }
  
  saveData(); // Persist offer update
  res.json({
    success: true,
    data: updatedOffer,
    message: 'Teklif kabul edildi',
  });
};

const handleRejectOffer = (req, res) => {
  const { id } = req.params;
  const offer = demoOffersStore.get(parseInt(id));
  
  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Teklif bulunamadı',
    });
  }
  
  const updatedOffer = {
    ...offer,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
  };
  
  demoOffersStore.set(parseInt(id), updatedOffer);
  
  res.json({
    success: true,
    data: updatedOffer,
    message: 'Teklif reddedildi',
  });
};

// Accept offer (support both POST and PUT)
app.post('/api/offers/:id/accept', authenticateToken, handleAcceptOffer);
app.put('/api/offers/:id/accept', authenticateToken, handleAcceptOffer);

// Reject offer (support both POST and PUT)
app.post('/api/offers/:id/reject', authenticateToken, handleRejectOffer);
app.put('/api/offers/:id/reject', authenticateToken, handleRejectOffer);

// Notifications endpoint
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({
    success: true,
    data: {
      count: 0,
    },
  });
});

// Messages endpoints
// Store messages in memory (in production, use database)
const messagesStore = new Map();

// Get messages for current user
app.get('/api/messages', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    // Get all messages where user is sender or receiver
    const userMessages = Array.from(messagesStore.values()).filter(
      (msg) => 
        normalizeUserId(msg.sender_id) === normalizedUserId || 
        normalizeUserId(msg.receiver_id) === normalizedUserId
    );
    
    // Group messages by conversation (other user)
    const conversations = new Map();
    
    userMessages.forEach(msg => {
      const otherUserId = normalizeUserId(msg.sender_id) === normalizedUserId 
        ? msg.receiver_id 
        : msg.sender_id;
      const otherUserName = normalizeUserId(msg.sender_id) === normalizedUserId 
        ? msg.receiver_name 
        : msg.sender_name;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          id: `conv-${otherUserId}`,
          carrierId: otherUserId,
          shipmentId: msg.shipment_id || '',
          carrierName: otherUserName || 'Kullanıcı',
          carrierCompany: msg.receiver_company || msg.sender_company || '',
          lastMessage: msg.message,
          lastMessageTime: new Date(msg.created_at).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          unreadCount: normalizeUserId(msg.receiver_id) === normalizedUserId && !msg.isRead ? 1 : 0,
          isOnline: false,
          messages: [msg],
        });
      } else {
        const conv = conversations.get(otherUserId);
        conv.messages.push(msg);
        if (new Date(msg.created_at) > new Date(conv.lastMessageTime)) {
          conv.lastMessage = msg.message;
          conv.lastMessageTime = new Date(msg.created_at).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
        if (normalizeUserId(msg.receiver_id) === normalizedUserId && !msg.isRead) {
          conv.unreadCount++;
        }
      }
    });
    
    // Sort conversations by last message time
    const conversationsArray = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.messages[b.messages.length - 1]?.created_at || 0).getTime() - 
                new Date(a.messages[a.messages.length - 1]?.created_at || 0).getTime()
    );
    
    res.json({
      success: true,
      data: conversationsArray,
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar yüklenirken hata oluştu',
    });
  }
});

// Send message
app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    const { receiver_id, message, shipment_id } = req.body;
    
    if (!receiver_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Alıcı ID ve mesaj gerekli',
      });
    }
    
    // Get sender info
    const sender = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizedUserId
    );
    
    // Get receiver info
    const receiver = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizeUserId(receiver_id)
    );
    
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Gönderen kullanıcı bulunamadı',
      });
    }
    
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Alıcı kullanıcı bulunamadı',
      });
    }
    
    // Create message
    const messageId = Date.now().toString();
    const newMessage = {
      id: messageId,
      sender_id: sender.id,
      receiver_id: receiver.id,
      sender_name: sender.fullName || `${sender.firstName} ${sender.lastName}`,
      receiver_name: receiver.fullName || `${receiver.firstName} ${receiver.lastName}`,
      sender_company: sender.companyName || null,
      receiver_company: receiver.companyName || null,
      message: message.trim(),
      shipment_id: shipment_id || null,
      created_at: new Date().toISOString(),
      isRead: false,
    };
    
    // Store message
    messagesStore.set(messageId, newMessage);
    
    // Emit Socket.IO event for real-time messaging
    io.emit('message:new', {
      message: newMessage,
      receiver_id: receiver.id,
      sender_id: sender.id,
    });
    
    console.log(`✅ Message sent: ${sender.fullName} -> ${receiver.fullName}: ${message.substring(0, 50)}...`);
    
    res.json({
      success: true,
      data: newMessage,
      message: 'Mesaj başarıyla gönderildi',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken hata oluştu',
    });
  }
});

// Get conversation messages
app.get('/api/messages/:otherUserId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    const { otherUserId } = req.params;
    const normalizedOtherUserId = normalizeUserId(otherUserId);
    
    // Get messages between current user and other user
    const conversationMessages = Array.from(messagesStore.values())
      .filter(msg => {
        const msgSenderId = normalizeUserId(msg.sender_id);
        const msgReceiverId = normalizeUserId(msg.receiver_id);
        return (
          (msgSenderId === normalizedUserId && msgReceiverId === normalizedOtherUserId) ||
          (msgSenderId === normalizedOtherUserId && msgReceiverId === normalizedUserId)
        );
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    res.json({
      success: true,
      data: conversationMessages,
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma yüklenirken hata oluştu',
    });
  }
});

// Get conversation messages (alternative endpoint format)
app.get('/api/messages/conversation/:otherUserId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    const { otherUserId } = req.params;
    const normalizedOtherUserId = normalizeUserId(otherUserId);
    
    // Get messages between current user and other user
    const conversationMessages = Array.from(messagesStore.values())
      .filter(msg => {
        const msgSenderId = normalizeUserId(msg.sender_id);
        const msgReceiverId = normalizeUserId(msg.receiver_id);
        return (
          (msgSenderId === normalizedUserId && msgReceiverId === normalizedOtherUserId) ||
          (msgSenderId === normalizedOtherUserId && msgReceiverId === normalizedUserId)
        );
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    res.json(conversationMessages);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma yüklenirken hata oluştu',
    });
  }
});

// Verification endpoints
// Phone verification
app.post('/api/verify/phone', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        isValid: false,
        requiresCode: false,
        error: 'Telefon numarası gerekli'
      });
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Format validation - accept: 5321234567, 05321234567, +905321234567, 905321234567
    if (!/^(\+90|90|0)?[5][0-9]{9}$/.test(cleanPhone)) {
      return res.json({
        isValid: false,
        requiresCode: false,
        error: 'Geçersiz telefon formatı'
      });
    }
    
    // For demo, we'll skip SMS verification and just validate format
    res.json({
      isValid: true,
      requiresCode: false,
      message: 'Telefon numarası formatı geçerli'
    });
  } catch (error) {
    res.status(500).json({
      isValid: false,
      requiresCode: false,
      error: 'Doğrulama hatası'
    });
  }
});

// Email verification
app.post('/api/verify/email', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        isValid: false,
        requiresCode: false,
        error: 'E-posta adresi gerekli'
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Format validation
    if (!emailRegex.test(email)) {
      return res.json({
        isValid: false,
        requiresCode: false,
        error: 'Geçersiz e-posta formatı'
      });
    }
    
    // For demo, we'll skip email verification and just validate format
    res.json({
      isValid: true,
      requiresCode: false,
      message: 'E-posta formatı geçerli'
    });
  } catch (error) {
    res.status(500).json({
      isValid: false,
      requiresCode: false,
      error: 'Doğrulama hatası'
    });
  }
});

// Tax number verification
app.post('/api/verify/tax-number', (req, res) => {
  const { taxNumber, companyName } = req.body;
  
  // Format validation
  if (taxNumber.length !== 10 || !/^\d{10}$/.test(taxNumber)) {
    return res.json({
      isValid: false,
      error: 'Geçersiz vergi numarası formatı'
    });
  }
  
  // For demo, accept valid format
  res.json({
    isValid: true,
    companyInfo: {
      unvan: companyName || 'Test Şirketi',
      adres: 'Test Adresi'
    }
  });
});

// Driver license verification
app.post('/api/verify/driver-license', (req, res) => {
  const { licenseNumber, firstName, lastName } = req.body;
  
  // Format validation
  if (!/^\d{11}$/.test(licenseNumber)) {
    return res.json({
      isValid: false,
      error: 'Geçersiz ehliyet numarası formatı'
    });
  }
  
  // For demo, accept valid format
  res.json({
    isValid: true,
    driverInfo: {
      ad: firstName || 'Test',
      soyad: lastName || 'Kullanıcı',
      ehliyetSinifi: 'B'
    }
  });
});

// Verification code endpoints (for future use)
app.post('/api/verify/phone/verify-code', (req, res) => {
  res.json({
    isValid: true,
    message: 'Telefon doğrulandı'
  });
});

app.post('/api/verify/email/verify-code', (req, res) => {
  res.json({
    isValid: true,
    message: 'E-posta doğrulandı'
  });
});

// Registration endpoint (no authentication required for new users)
app.post('/api/auth/register', async (req, res) => {
  try {
    const userData = req.body;
    
    console.log('=== REGISTER REQUEST ===');
  console.log('userData.firstName:', userData.firstName);
  console.log('userData.lastName:', userData.lastName);
  console.log('userData.userType:', userData.userType);
  
  // Check if user already exists
  const existingUser = demoUsersStore.get(userData.email);
  if (existingUser) {
    console.log('❌ User already exists:', userData.email);
    return res.status(400).json({
      success: false,
      message: 'Bu e-posta adresi ile zaten bir hesap mevcut'
    });
  }
  
  // 18 yaş kontrolü (bireysel kullanıcılar için)
  if (userData.userType === 'individual' && userData.birthDate) {
    const birth = new Date(userData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) ? age - 1 : age;
    
    if (actualAge < 18) {
      console.log('❌ User under 18:', userData.email);
      return res.status(400).json({
        success: false,
        message: 'Platformu kullanmak için 18 yaşında veya daha büyük olmalısınız'
      });
    }
  }
  
  // Generate user ID (use numeric ID for consistency with login)
  const userId = Date.now();
  const token = `demo-token-${userId}`;
  
  // Build full name from firstName and lastName
  const firstName = userData.firstName || userData.name?.split(' ')[0] || '';
  const lastName = userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '';
  
  console.log('Extracted firstName:', firstName, 'lastName:', lastName);
  
  // If both firstName and lastName are empty, use 'Kullanıcı', otherwise combine them
  const fullName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : 
                   firstName ? firstName : 
                   lastName ? lastName : 
                   userData.name || 'Kullanıcı';
  
  console.log('Generated fullName:', fullName);
  
  // Map userType to role
  const roleMap = {
    'individual': 'individual',
    'corporate': 'corporate',
    'nakliyeci': 'nakliyeci',
    'tasiyici': 'tasiyici'
  };
  const role = roleMap[userData.userType] || 'individual';
  
  // Generate driver code for tasiyici users (format: DRV-XXX-XXX)
  let driverCode = null;
  if (userData.userType === 'tasiyici') {
    // Get city code (first 3 letters, uppercase)
    const cityCode = (userData.city || 'IST').substring(0, 3).toUpperCase().padEnd(3, 'X');
    // Get sequential number (3 digits, zero-padded)
    const codeNumber = driverCodeCounter.toString().padStart(3, '0');
    driverCode = `DRV-${cityCode}-${codeNumber}`;
    driverCodeCounter++;
    
    // Store driver code mapping
    driverCodeStore.set(driverCode, userId.toString());
    console.log(`✅ Generated driver code: ${driverCode} for user: ${userData.email}`);
  }
  
  // Hash password with bcrypt before storing
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(userData.password, 10);
  } catch (error) {
    console.error('Password hashing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Kayıt sırasında bir hata oluştu'
    });
  }
  
  // Store user in demoUsersStore for login later
  // IMPORTANT: Don't use spread operator here, it will override firstName and lastName
  const newUser = {
    id: userId.toString(), // Store as string for consistency
    fullName: fullName,
    firstName: firstName,
    lastName: lastName,
    email: userData.email,
    phone: userData.phone,
    password: hashedPassword, // Store hashed password
    userType: userData.userType || 'individual',
    role: role,
    panel_type: role,
    companyName: userData.companyName || null,
    address: userData.address || null,
    city: userData.city || null,
    district: userData.district || null,
    driverCode: driverCode, // Add driver code for tasiyici users
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('=== NEW USER CREATED ===');
  console.log('newUser.firstName:', newUser.firstName);
  console.log('newUser.lastName:', newUser.lastName);
  console.log('newUser.fullName:', newUser.fullName);
  console.log('newUser.userType:', newUser.userType);
  console.log('newUser.email:', newUser.email);
  console.log('newUser.id:', newUser.id);
  if (driverCode) {
    console.log('newUser.driverCode:', driverCode);
  }
  
  // Store in demoUsersStore for login (use email as primary key, userId as secondary)
  demoUsersStore.set(userData.email, newUser); // Primary lookup by email
  demoUsersStore.set(userId.toString(), newUser); // Secondary lookup by userId
  
  // Also store with normalized userId for consistency
  const normalizedNewUserId = normalizeUserId(userId.toString());
  if (normalizedNewUserId !== userId.toString()) {
    demoUsersStore.set(normalizedNewUserId, newUser);
    console.log(`✅ Also stored with normalized userId: ${normalizedNewUserId}`);
  }
  
  // Save data to persist user registration
  saveData();
  
  console.log('✅ User registered and saved:', userData.email);
  console.log(`✅ Total users in store after registration: ${demoUsersStore.size}`);
  
  // Ensure all fields are included in response
  const responseUser = {
    id: newUser.id,
    fullName: newUser.fullName,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    phone: newUser.phone,
    userType: newUser.userType,
    role: newUser.role,
    panel_type: newUser.panel_type,
    companyName: newUser.companyName,
    address: newUser.address,
    city: newUser.city,
    district: newUser.district,
    driverCode: newUser.driverCode || null, // Include driver code for tasiyici users
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
  
  res.json({
    success: true,
    data: {
      user: responseUser,
      token: token
    },
    message: 'Kayıt başarılı'
  });
  } catch (error) {
    console.error('❌ [ERROR] /api/auth/register error:', error);
    res.status(500).json({
      success: false,
      message: 'Kayıt işlemi sırasında bir hata oluştu',
      error: error.message,
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
  const { email, password } = req.body;
  
    // INPUT VALIDATION
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'E-posta ve şifre gereklidir' 
    });
  }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir e-posta adresi giriniz'
      });
    }
    
    if (typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir şifre giriniz'
      });
    }
  
  // Find user by email in demoUsersStore
  let user = demoUsersStore.get(email);
  
  // If not found by email, try to find by userId (for backward compatibility)
  if (!user) {
    // Try to find by iterating through all users
    for (const [key, value] of demoUsersStore.entries()) {
      if (value && value.email === email) {
        user = value;
        break;
      }
    }
  }
  
  console.log('=== LOGIN REQUEST ===');
  console.log('email:', email);
  console.log('user found:', !!user);
  if (user) {
    console.log('Full user object:', JSON.stringify(user, null, 2));
    console.log('user.id:', user.id);
    console.log('user.firstName:', user.firstName);
    console.log('user.lastName:', user.lastName);
    console.log('user.fullName:', user.fullName);
    console.log('user.email:', user.email);
  } else {
    console.log('User not found in demoUsersStore');
    console.log('Available keys in demoUsersStore:', Array.from(demoUsersStore.keys()));
  }
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'E-posta veya şifre hatalı' 
    });
  }
  
  // Check password with bcrypt (supports both hashed and plain text for migration)
  let passwordValid = false;
  if (user.password && user.password.startsWith('$2b$')) {
    // Password is hashed with bcrypt
    try {
      passwordValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Password comparison error:', error);
      return res.status(500).json({
        success: false,
        message: 'Şifre doğrulama hatası'
      });
    }
  } else {
    // Plain text password (legacy - for migration)
    passwordValid = user.password === password;
    // If valid, upgrade to hashed password
    if (passwordValid && user.password) {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        demoUsersStore.set(email, user);
      } catch (error) {
        console.error('Password hashing error:', error);
      }
    }
  }
  
  if (!passwordValid) {
    return res.status(401).json({ 
      success: false, 
      message: 'E-posta veya şifre hatalı' 
    });
  }
  
  // Generate token
  const token = `demo-token-${user.id}`;
  
  // Return user without password, ensuring all fields are explicitly included
  const responseUser = {
    id: user.id,
    fullName: user.fullName || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email,
    phone: user.phone || '',
    userType: user.userType || user.role || 'individual',
    role: user.role || user.userType || 'individual',
    panel_type: user.panel_type || user.role || 'individual',
    companyName: user.companyName || null,
    address: user.address || null,
    city: user.city || null,
    district: user.district || null,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString(),
  };
  
  console.log('=== LOGIN RESPONSE ===');
  console.log('responseUser.firstName:', responseUser.firstName);
  console.log('responseUser.lastName:', responseUser.lastName);
  console.log('responseUser.fullName:', responseUser.fullName);
  console.log('Full responseUser:', JSON.stringify(responseUser, null, 2));
  
  res.json({
    success: true,
    data: {
      user: responseUser,
      token: token
    },
    message: 'Giriş başarılı'
  });
  } catch (error) {
    console.error('❌ [ERROR] /api/auth/login error:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş işlemi sırasında bir hata oluştu',
      error: error.message,
    });
  }
});

// KVKK - Veri Erişim Hakkı (KVKK m.11)
app.get('/api/kvkk/data-access', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const normalizedUserId = normalizeUserId(userId);
  
  // Find user
  let user = demoUsersStore.get(normalizedUserId);
  if (!user) {
    // Try to find by email
    for (const [key, value] of demoUsersStore.entries()) {
      if (value && value.id === normalizedUserId) {
        user = value;
        break;
      }
    }
  }
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Kullanıcı bulunamadı'
    });
  }
  
  // Get user's shipments
  const userShipments = Array.from(demoShipmentsStore.values()).filter(
    shipment => shipment.userId === normalizedUserId || shipment.userId === userId
  );
  
  // Get user's offers
  const userOffers = Array.from(demoOffersStore.values()).filter(
    offer => offer.nakliyeciId === normalizedUserId || offer.nakliyeciId === userId
  );
  
  // Get user's messages (if exists)
  const userMessages = []; // Messages would be in a separate store
  
  // Get wallet data (if nakliyeci)
  let walletData = null;
  if (user.userType === 'nakliyeci' || user.role === 'nakliyeci') {
    walletData = demoWalletStore.get(normalizedUserId) || demoWalletStore.get(userId);
  }
  
  // Prepare data export (KVKK m.11 - Veri Taşınabilirlik Hakkı)
  const exportData = {
    user: {
      id: user.id,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      role: user.role,
      companyName: user.companyName,
      address: user.address,
      city: user.city,
      district: user.district,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    shipments: userShipments.map(s => ({
      id: s.id,
      title: s.title,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    offers: userOffers.map(o => ({
      id: o.id,
      shipmentId: o.shipmentId,
      price: o.price,
      status: o.status,
      createdAt: o.createdAt,
    })),
    wallet: walletData ? {
      balance: walletData.balance,
      totalCommissions: walletData.totalCommissions,
      transactions: walletData.transactions || [],
    } : null,
    exportDate: new Date().toISOString(),
    format: 'JSON',
  };
  
  res.json({
    success: true,
    data: exportData,
    message: 'Veri erişim hakkı kullanıldı'
  });
});

// KVKK - Veri Silme Hakkı (KVKK m.7)
app.delete('/api/kvkk/delete-data', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const normalizedUserId = normalizeUserId(userId);
  
  // Find user
  let user = demoUsersStore.get(normalizedUserId);
  if (!user) {
    for (const [key, value] of demoUsersStore.entries()) {
      if (value && value.id === normalizedUserId) {
        user = value;
        break;
      }
    }
  }
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Kullanıcı bulunamadı'
    });
  }
  
  // Check if user has active shipments or offers
  const activeShipments = Array.from(demoShipmentsStore.values()).filter(
    shipment => (shipment.userId === normalizedUserId || shipment.userId === userId) && 
                shipment.status !== 'delivered' && shipment.status !== 'cancelled'
  );
  
  const activeOffers = Array.from(demoOffersStore.values()).filter(
    offer => (offer.nakliyeciId === normalizedUserId || offer.nakliyeciId === userId) && 
             offer.status === 'accepted'
  );
  
  if (activeShipments.length > 0 || activeOffers.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Aktif gönderileriniz veya teklifleriniz var. Önce bunları tamamlayın veya iptal edin.',
      activeShipments: activeShipments.length,
      activeOffers: activeOffers.length
    });
  }
  
  // Delete user data (soft delete - mark as deleted)
  // Note: We keep minimal data for legal requirements (tax, accounting)
  const deletedUser = {
    ...user,
    email: `deleted_${Date.now()}@deleted.local`,
    phone: null,
    address: null,
    city: null,
    district: null,
    deletedAt: new Date().toISOString(),
    isActive: false,
  };
  
  // Update user in store
  demoUsersStore.set(normalizedUserId, deletedUser);
  if (user.email) {
    demoUsersStore.delete(user.email);
  }
  
  // Delete wallet data
  demoWalletStore.delete(normalizedUserId);
  demoWalletStore.delete(userId);
  
  // Log deletion
  console.log(`✅ User data deleted: ${normalizedUserId} at ${new Date().toISOString()}`);
  
  saveData();
  
  res.json({
    success: true,
    message: 'Verileriniz başarıyla silindi. Yasal saklama süreleri gereği bazı veriler saklanmaya devam edecektir.'
  });
});

// Şikayet/Anlaşmazlık Sistemi
const demoComplaintsStore = new Map();
let complaintIdCounter = 1;

app.post('/api/complaints', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const normalizedUserId = normalizeUserId(userId);
  
  const { type, title, description, priority, shipmentId } = req.body;
  
  if (!type || !title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Şikayet türü, başlık ve açıklama zorunludur'
    });
  }
  
  const complaint = {
    id: complaintIdCounter++,
    userId: normalizedUserId,
    type,
    title,
    description,
    priority: priority || 'medium',
    shipmentId: shipmentId || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  demoComplaintsStore.set(complaint.id, complaint);
  saveData();
  
  console.log(`✅ Complaint submitted: ${complaint.id} by user ${normalizedUserId}`);
  
  res.json({
    success: true,
    data: complaint,
    message: 'Şikayetiniz alındı. En kısa sürede incelenecektir.'
  });
});

app.get('/api/complaints', authenticateToken, (req, res) => {
  const { userId } = req.user;
  const normalizedUserId = normalizeUserId(userId);
  
  const userComplaints = Array.from(demoComplaintsStore.values()).filter(
    complaint => complaint.userId === normalizedUserId || complaint.userId === userId
  );
  
  res.json({
    success: true,
    data: userComplaints
  });
});

// Rate Limiting (Production-safe implementation)
const requestCounts = new Map();
// Production'da daha sıkı limitler
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (isProduction ? 15 * 60 * 1000 : 60 * 1000); // Production: 15 dk, Dev: 1 dk
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProduction ? 100 : 1000); // Production: 100, Dev: 1000

// Per-endpoint rate limiting (daha sıkı)
const endpointLimits = {
  '/api/auth/login': { window: 15 * 60 * 1000, max: 5 }, // 15 dakikada 5 login denemesi
  '/api/auth/register': { window: 60 * 60 * 1000, max: 3 }, // 1 saatte 3 kayıt
  '/api/verify': { window: 5 * 60 * 1000, max: 10 }, // 5 dakikada 10 doğrulama
};

// Cleanup old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime + RATE_LIMIT_WINDOW) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Her 5 dakikada bir temizle

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const path = req.path;
  const now = Date.now();
  
  // Endpoint-specific limits
  const endpointLimit = endpointLimits[path];
  const window = endpointLimit?.window || RATE_LIMIT_WINDOW;
  const max = endpointLimit?.max || RATE_LIMIT_MAX;
  
  const key = `${ip}:${path}`;
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, resetTime: now + window });
    return next();
  }
  
  const record = requestCounts.get(key);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + window;
    return next();
  }
  
  if (record.count >= max) {
    // Log rate limit violations in production
    if (isProduction) {
      console.warn(`Rate limit exceeded: ${ip} on ${path} (${record.count}/${max})`);
    }
    return res.status(429).json({
      success: false,
      message: 'Çok fazla istek. Lütfen bir süre sonra tekrar deneyin.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000), // seconds
    });
  }
  
  record.count++;
  next();
};

// Rate limiting'i kritik endpoint'lere uygula
app.use('/api/auth/login', rateLimitMiddleware);
app.use('/api/auth/register', rateLimitMiddleware);
app.use('/api/complaints', rateLimitMiddleware);
app.use('/api/shipments', rateLimitMiddleware);
app.use('/api/offers', rateLimitMiddleware);
app.use('/api/messages', rateLimitMiddleware);
app.use('/api/wallet', rateLimitMiddleware);
app.use('/api/carrier-market', rateLimitMiddleware);
app.use('/api/driver-market', rateLimitMiddleware);

// CRITICAL: Production environment validation
if (isProduction) {
  const jwtSecret = process.env.JWT_SECRET;
  const requiredEnvVars = {
    'CORS_ORIGIN': corsOrigin,
    'JWT_SECRET': jwtSecret,
  };

  const missingVars = [];
  const weakVars = [];

  // Check for missing required variables
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }

  // Check for weak JWT_SECRET
  if (jwtSecret && jwtSecret.length < 32) {
    weakVars.push('JWT_SECRET (must be at least 32 characters)');
  }

  // Critical: Exit if required variables are missing
  if (missingVars.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required environment variables in production:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('   Application cannot start safely. Please set all required variables.');
    process.exit(1);
  }

  // Warning for weak variables
  if (weakVars.length > 0) {
    console.warn('⚠️  WARNING: Weak security configuration:');
    weakVars.forEach(v => console.warn(`   - ${v}`));
    console.warn('   This may pose a security risk. Please strengthen these values.');
  }

  console.log('✅ Production security checks passed');
}

// Global Error Handler Middleware (production-safe)
app.use((err, req, res, next) => {
  // Log error details (only in development)
  if (!isProduction) {
    console.error('Error:', err);
  } else {
    // In production, log minimal info
    console.error('Error occurred:', {
      path: req.path,
      method: req.method,
      message: err.message,
      // Don't log stack trace or sensitive data in production
    });
  }

  // Don't leak error details in production
  const errorMessage = isProduction 
    ? 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    : err.message || 'Bir hata oluştu';

  res.status(err.status || 500).json({
    success: false,
    message: errorMessage,
    ...(isProduction ? {} : { error: err.message, stack: err.stack }),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
  });
});

// Carrier Market Listings - Create listing (POST /api/carrier-market/listings)
app.post('/api/carrier-market/listings', authenticateToken, (req, res) => {
  try {
    const { shipmentId, minPrice } = req.body;
    const { userId } = req.user;
    
    if (!shipmentId) {
      return res.status(400).json({
        success: false,
        message: 'shipmentId gereklidir'
      });
    }
    
    // Find shipment
    let shipment = null;
    for (const s of demoShipmentsStore.values()) {
      if (s.id === shipmentId || s.id === parseInt(shipmentId) || s.id?.toString() === shipmentId?.toString()) {
        shipment = s;
        break;
      }
    }
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }
    
    // Check if listing already exists
    const existingListing = Array.from(carrierMarketListingsStore.values())
      .find(l => l.shipmentId === shipmentId || l.shipmentId === parseInt(shipmentId));
    
    if (existingListing && existingListing.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu gönderi için zaten aktif bir ilan var'
      });
    }
    
    // Create new listing
    const listing = {
      id: listingIdCounter++,
      shipmentId: shipment.id,
      nakliyeciId: userId,
      minPrice: minPrice || shipment.price || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    carrierMarketListingsStore.set(listing.id, listing);
    saveData();
    
    console.log(`✅ [DEBUG] Listing created - id: ${listing.id}, shipmentId: ${shipmentId}, minPrice: ${listing.minPrice}`);
    
    res.json({
      success: true,
      data: listing,
      message: 'İlan başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/carrier-market/listings error:', error);
    res.status(500).json({
      success: false,
      message: 'İlan oluşturulurken bir hata oluştu',
      error: error.message,
    });
  }
});

// Get carrier market listings (GET /api/carrier-market/listings)
app.get('/api/carrier-market/listings', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { mine } = req.query;
    
    let listings;
    if (mine === '1' || mine === 'true') {
      // Get all listings for this nakliyeci
      listings = Array.from(carrierMarketListingsStore.values())
        .filter(l => {
          const normalizedNakliyeciId = normalizeUserId(l.nakliyeciId);
          const normalizedUserId = normalizeUserId(userId);
          return normalizedNakliyeciId === normalizedUserId || 
                 l.nakliyeciId === userId || 
                 l.nakliyeciId === userId.toString();
        });
    } else {
      // Get all active listings (for taşıyıcı to see available jobs)
      listings = Array.from(carrierMarketListingsStore.values())
        .filter(l => l.status === 'active');
    }
    
    // Enrich listings with shipment info
    const enrichedListings = listings.map(listing => {
      const shipment = Array.from(demoShipmentsStore.values())
        .find(s => s.id === listing.shipmentId || s.id === parseInt(listing.shipmentId));
      
      return {
        ...listing,
        shipment: shipment ? {
          id: shipment.id,
          from: shipment.from,
          to: shipment.to,
          weight: shipment.weight,
          volume: shipment.volume,
          pickupDate: shipment.pickupDate,
          deliveryDate: shipment.deliveryDate,
        } : null,
      };
    });
    
    res.json({
      success: true,
      data: enrichedListings
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/carrier-market/listings GET error:', error);
    res.status(500).json({
      success: false,
      message: 'İlanlar yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Carrier Market Bids - Submit bid (POST /api/carrier-market/bids)
app.post('/api/carrier-market/bids', authenticateToken, (req, res) => {
  try {
    const { listingId, bidPrice, etaHours } = req.body;
    const { userId } = req.user;
    
    if (!listingId || !bidPrice || bidPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'listingId ve geçerli bir bidPrice gereklidir'
      });
    }
    
    // Find listing
    const listing = carrierMarketListingsStore.get(parseInt(listingId));
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'İlan bulunamadı'
      });
    }
    
    if (listing.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu ilan artık aktif değil'
      });
    }
    
    // Check if bid price is above minimum
    if (bidPrice < listing.minPrice) {
      return res.status(400).json({
        success: false,
        message: `Teklif fiyatı minimum fiyattan (₺${listing.minPrice}) düşük olamaz`
      });
    }
    
    // Get carrier user info
    const normalizedUserId = normalizeUserId(userId);
    const carrierUser = demoUsersStore.get(userId) ||
                       demoUsersStore.get(userId?.toString()) ||
                       demoUsersStore.get(normalizedUserId) ||
                       demoUsersStore.get(normalizedUserId?.toString()) ||
                       demoUsersStore.get(`demo-${userId}`) ||
                       demoUsersStore.get(`demo-${userId?.toString()}`) ||
                       demoUsersStore.get(`demo-${normalizedUserId}`) ||
                       demoUsersStore.get(`demo-${normalizedUserId?.toString()}`);
    
    // Create bid
    const bid = {
      id: bidIdCounter++,
      listingId: parseInt(listingId),
      carrierId: userId,
      carrierName: carrierUser?.fullName || carrierUser?.name || 'Taşıyıcı',
      carrierPhone: carrierUser?.phone || '',
      carrierVehicle: carrierUser?.vehicle || '',
      bidPrice: parseFloat(bidPrice),
      etaHours: etaHours ? parseInt(etaHours) : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    carrierMarketBidsStore.set(bid.id, bid);
    saveData();
    
    console.log(`✅ [DEBUG] Bid created - id: ${bid.id}, listingId: ${listingId}, bidPrice: ${bid.bidPrice}, carrierId: ${userId}`);
    
    res.json({
      success: true,
      data: bid,
      message: 'Teklif başarıyla gönderildi'
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/carrier-market/bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif gönderilirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Get bids for a listing (GET /api/carrier-market/bids?listingId=...)
app.get('/api/carrier-market/bids', authenticateToken, (req, res) => {
  try {
    const { listingId } = req.query;
    const { userId } = req.user;
    
    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: 'listingId gereklidir'
      });
    }
    
    // Get all bids for this listing
    const bids = Array.from(carrierMarketBidsStore.values())
      .filter(b => b.listingId === parseInt(listingId));
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/carrier-market/bids GET error:', error);
    res.status(500).json({
      success: false,
      message: 'Teklifler yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Accept bid (POST /api/carrier-market/bids/:id/accept)
app.post('/api/carrier-market/bids/:id/accept', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const bid = carrierMarketBidsStore.get(parseInt(id));
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }
    
    // Find listing
    const listing = carrierMarketListingsStore.get(bid.listingId);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'İlan bulunamadı'
      });
    }
    
    // Verify that the user is the nakliyeci who owns this listing
    const normalizedUserId = normalizeUserId(userId);
    const normalizedListingNakliyeciId = normalizeUserId(listing.nakliyeciId);
    
    const isAuthorized = 
      listing.nakliyeciId === userId ||
      listing.nakliyeciId === userId?.toString() ||
      listing.nakliyeciId?.toString() === userId ||
      normalizedListingNakliyeciId === normalizedUserId ||
      normalizedListingNakliyeciId === userId ||
      normalizedListingNakliyeciId === userId?.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklifi kabul etme yetkiniz yok'
      });
    }
    
    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif zaten işleme alınmış'
      });
    }
    
    // RACE CONDITION FIX: Check if listing is still active
    if (listing.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu ilan artık aktif değil. Başka bir taşıyıcı seçilmiş olabilir.'
      });
    }
    
    // RACE CONDITION FIX: Check if shipment already has assigned driver
    const shipment = demoShipmentsStore.get(listing.shipmentId);
    
    if (shipment && (shipment.driverId || shipment.assignedDriverId)) {
      return res.status(400).json({
        success: false,
        message: 'Bu gönderi için zaten bir taşıyıcı atanmış'
      });
    }
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }
    
    // Get carrier user info
    const normalizedCarrierId = normalizeUserId(bid.carrierId);
    const carrierUser = demoUsersStore.get(bid.carrierId) ||
                       demoUsersStore.get(bid.carrierId?.toString()) ||
                       demoUsersStore.get(normalizedCarrierId) ||
                       demoUsersStore.get(normalizedCarrierId?.toString()) ||
                       demoUsersStore.get(`demo-${bid.carrierId}`) ||
                       demoUsersStore.get(`demo-${bid.carrierId?.toString()}`) ||
                       demoUsersStore.get(`demo-${normalizedCarrierId}`) ||
                       demoUsersStore.get(`demo-${normalizedCarrierId?.toString()}`);
    
    // Update bid status
    bid.status = 'accepted';
    bid.acceptedAt = new Date().toISOString();
    bid.updatedAt = new Date().toISOString();
    carrierMarketBidsStore.set(bid.id, bid);
    
    // Update listing status
    listing.status = 'closed';
    listing.updatedAt = new Date().toISOString();
    carrierMarketListingsStore.set(listing.id, listing);
    
    // Assign driver to shipment
    const updatedShipment = {
      ...shipment,
      assignedDriverId: bid.carrierId,
      driverId: bid.carrierId,
      status: 'assigned', // Update status to assigned
      assignedDriver: {
        id: bid.carrierId,
        name: bid.carrierName || carrierUser?.fullName || carrierUser?.name || 'Taşıyıcı',
        phone: bid.carrierPhone || carrierUser?.phone || '',
        vehicle: bid.carrierVehicle || carrierUser?.vehicle || '',
      },
      // Add driver object for frontend compatibility
      driver: {
        name: bid.carrierName || carrierUser?.fullName || carrierUser?.name || 'Taşıyıcı',
        phone: bid.carrierPhone || carrierUser?.phone || '',
        vehicle: bid.carrierVehicle || carrierUser?.vehicle || '',
      },
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    demoShipmentsStore.set(shipment.id, updatedShipment);
    saveData();
    
    console.log(`✅ [DEBUG] Bid accepted - bidId: ${bid.id}, listingId: ${listing.id}, shipmentId: ${shipment.id}, carrierId: ${bid.carrierId}`);
    
    // Get sender user info for notification
    const senderUserId = shipment.userId;
    const normalizedSenderUserId = normalizeUserId(senderUserId);
    const senderUser = demoUsersStore.get(senderUserId) ||
                       demoUsersStore.get(senderUserId?.toString()) ||
                       demoUsersStore.get(normalizedSenderUserId) ||
                       demoUsersStore.get(normalizedSenderUserId?.toString()) ||
                       demoUsersStore.get(`demo-${senderUserId}`) ||
                       demoUsersStore.get(`demo-${senderUserId?.toString()}`);
    
    // Calculate ETA if provided
    const etaMessage = bid.etaHours 
      ? ` Tahmini varış süresi: ${bid.etaHours} saat.`
      : '';
    
    // Send notification to sender about driver assignment via carrier market
    io.emit('notification:new', {
      type: 'driver_assigned_via_market',
      title: 'Taşıyıcı Atandı - Yolda',
      message: `Gönderiniz için taşıyıcı atandı: ${bid.carrierName || carrierUser?.fullName || carrierUser?.name || 'Taşıyıcı'}.${etaMessage} Taşıyıcı yakında sizinle iletişime geçecek.`,
      shipmentId: shipment.id,
      driverName: bid.carrierName || carrierUser?.fullName || carrierUser?.name || 'Taşıyıcı',
      driverPhone: bid.carrierPhone || carrierUser?.phone || '',
      vehicle: bid.carrierVehicle || carrierUser?.vehicle || '',
      etaHours: bid.etaHours || null,
      userId: normalizedSenderUserId, // Send to sender
      timestamp: new Date().toISOString(),
    });
    
    // Send notification to driver about new assignment
    io.emit('notification:new', {
      type: 'driver_assigned_via_market',
      title: 'Yeni İş Atandı - Güzergahınıza Eklendi',
      message: `${shipment.title || 'Gönderi'} güzergahınıza eklendi. Detayları görüntüleyin.`,
      shipmentId: shipment.id,
      userId: bid.carrierId, // Send to driver
      timestamp: new Date().toISOString(),
    });
    
    res.json({
      success: true,
      data: {
        bid,
        shipment: updatedShipment,
      },
      message: 'Teklif kabul edildi ve taşıyıcı atandı'
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/carrier-market/bids/:id/accept error:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif kabul edilirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Data persistence functions
const saveData = () => {
  try {
    // Convert demoDriversStore (Map of Sets) to serializable format
    const driversData = Array.from(demoDriversStore.entries()).map(([key, value]) => [
      key,
      Array.from(value) // Convert Set to Array for serialization
    ]);
    
    const data = {
      shipments: Array.from(demoShipmentsStore.entries()),
      offers: Array.from(demoOffersStore.entries()),
      users: Array.from(demoUsersStore.entries()),
      carrierMarketListings: Array.from(carrierMarketListingsStore.entries()),
      carrierMarketBids: Array.from(carrierMarketBidsStore.entries()),
      wallets: Array.from(demoWalletStore.entries()),
      complaints: Array.from(demoComplaintsStore.entries()),
      drivers: driversData, // Add drivers store
      corporateCarriers: Array.from(demoCorporateCarriersStore.entries()).map(([key, value]) => [
        key,
        Array.from(value) // Convert Set to Array for serialization
      ]), // Add corporate carriers store
      driverCodes: Array.from(driverCodeStore.entries()), // Add driver codes store
      shipmentIdCounter,
      offerIdCounter,
      listingIdCounter,
      bidIdCounter,
      transactionIdCounter,
      complaintIdCounter,
      driverCodeCounter, // Add driver code counter
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Data saved to ${DATA_FILE}`);
  } catch (error) {
    console.error(`❌ Error saving data: ${error.message}`);
  }
};

const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      
      // Restore Maps from arrays
      if (data.shipments) {
        demoShipmentsStore.clear();
        data.shipments.forEach(([key, value]) => {
          demoShipmentsStore.set(key, value);
        });
      }
      
      if (data.offers) {
        demoOffersStore.clear();
        data.offers.forEach(([key, value]) => {
          demoOffersStore.set(key, value);
        });
      }
      
      if (data.users) {
        demoUsersStore.clear();
        data.users.forEach(([key, value]) => {
          demoUsersStore.set(key, value);
        });
      }
      
      if (data.carrierMarketListings) {
        carrierMarketListingsStore.clear();
        data.carrierMarketListings.forEach(([key, value]) => {
          carrierMarketListingsStore.set(key, value);
        });
      }
      
      if (data.carrierMarketBids) {
        carrierMarketBidsStore.clear();
        data.carrierMarketBids.forEach(([key, value]) => {
          carrierMarketBidsStore.set(key, value);
        });
      }
      
      if (data.wallets) {
        demoWalletStore.clear();
        data.wallets.forEach(([key, value]) => {
          demoWalletStore.set(key, value);
        });
      }
      
      if (typeof data.shipmentIdCounter === 'number') shipmentIdCounter = data.shipmentIdCounter;
      if (typeof data.offerIdCounter === 'number') offerIdCounter = data.offerIdCounter;
      if (typeof data.listingIdCounter === 'number') listingIdCounter = data.listingIdCounter;
      if (typeof data.bidIdCounter === 'number') bidIdCounter = data.bidIdCounter;
      if (typeof data.transactionIdCounter === 'number') transactionIdCounter = data.transactionIdCounter;
      
      if (data.complaints) {
        demoComplaintsStore.clear();
        data.complaints.forEach(([key, value]) => {
          demoComplaintsStore.set(key, value);
        });
      }
      
      if (data.drivers) {
        demoDriversStore.clear();
        data.drivers.forEach(([key, value]) => {
          // Convert Array back to Set
          demoDriversStore.set(key, new Set(value));
        });
      }
      
      if (data.corporateCarriers) {
        demoCorporateCarriersStore.clear();
        data.corporateCarriers.forEach(([key, value]) => {
          // Convert Array back to Set
          demoCorporateCarriersStore.set(key, new Set(value));
        });
      }
      
      if (data.driverCodes) {
        driverCodeStore.clear();
        data.driverCodes.forEach(([key, value]) => {
          driverCodeStore.set(key, value);
        });
      }
      
      if (typeof data.complaintIdCounter === 'number') complaintIdCounter = data.complaintIdCounter;
      if (typeof data.driverCodeCounter === 'number') driverCodeCounter = data.driverCodeCounter;
      
      console.log(`📂 Data loaded from ${DATA_FILE}`);
      console.log(`   - Shipments: ${demoShipmentsStore.size}`);
      console.log(`   - Offers: ${demoOffersStore.size}`);
      console.log(`   - Users: ${demoUsersStore.size}`);
      console.log(`   - Listings: ${carrierMarketListingsStore.size}`);
      console.log(`   - Bids: ${carrierMarketBidsStore.size}`);
      console.log(`   - Wallets: ${demoWalletStore.size}`);
      console.log(`   - Complaints: ${demoComplaintsStore.size}`);
      console.log(`   - Drivers: ${demoDriversStore.size}`);
      console.log(`   - Corporate Carriers: ${demoCorporateCarriersStore.size}`);
      console.log(`   - Driver Codes: ${driverCodeStore.size}`);
    } else {
      console.log(`📂 No existing data file found, starting fresh`);
    }
  } catch (error) {
    console.error(`❌ Error loading data: ${error.message}`);
  }
};

// Initialize demo users if they don't exist
const initializeDemoUsers = () => {
  const demoUsers = [
    {
      id: 'individual-1763843879892',
      fullName: 'Bireysel Demo User',
      firstName: 'Bireysel',
      lastName: 'Demo',
      email: 'demo@individual.com',
      phone: '05001112233',
      password: 'demo123', // Add password for login
      userType: 'individual',
      role: 'individual',
      panel_type: 'individual',
      companyName: null,
      balance: 0,
      totalCommissions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'corporate-1763928878918',
      fullName: 'Kurumsal Demo User',
      firstName: 'Kurumsal',
      lastName: 'Demo',
      email: 'demo@corporate.com',
      phone: '05001112233',
      password: 'demo123', // Add password for login
      userType: 'corporate',
      role: 'corporate',
      panel_type: 'corporate',
      companyName: 'Demo Company',
      balance: 0,
      totalCommissions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'nakliyeci-1763929991737',
      fullName: 'Nakliyeci Demo User',
      firstName: 'Nakliyeci',
      lastName: 'Demo',
      email: 'demo@nakliyeci.com',
      phone: '05001112233',
      password: 'demo123', // Add password for login
      userType: 'nakliyeci',
      role: 'nakliyeci',
      panel_type: 'nakliyeci',
      companyName: 'Demo Lojistik A.Ş.',
      vehicle: '34 ABC 1234', // Araç plakası
      balance: 1000,
      totalCommissions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tasiyici-1763845119100',
      fullName: 'Taşıyıcı Demo User',
      firstName: 'Taşıyıcı',
      lastName: 'Demo',
      email: 'demo@tasiyici.com',
      phone: '05001112233',
      password: 'demo123', // Add password for login
      userType: 'tasiyici',
      role: 'tasiyici',
      panel_type: 'tasiyici',
      companyName: null,
      balance: 0,
      totalCommissions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  demoUsers.forEach(user => {
    // Update existing user or create new one
    const existingUser = demoUsersStore.get(user.id);
    if (existingUser) {
      // Merge new data with existing user (preserve existing data, update with new fields)
      const updatedUser = { ...existingUser, ...user };
      demoUsersStore.set(user.id, updatedUser);
    } else {
      demoUsersStore.set(user.id, user);
    }
    
    // Also store with "demo-" prefix for frontend compatibility
    const demoPrefixedId = `demo-${user.id}`;
    const existingPrefixedUser = demoUsersStore.get(demoPrefixedId);
    if (existingPrefixedUser) {
      const updatedPrefixedUser = { ...existingPrefixedUser, ...user };
      demoUsersStore.set(demoPrefixedId, updatedPrefixedUser);
    } else {
      demoUsersStore.set(demoPrefixedId, user);
    }
    
    // Store by email
    const existingEmailUser = demoUsersStore.get(user.email);
    if (existingEmailUser) {
      const updatedEmailUser = { ...existingEmailUser, ...user };
      demoUsersStore.set(user.email, updatedEmailUser);
    } else {
      demoUsersStore.set(user.email, user);
    }
  });

  console.log(`✅ Demo users initialized: ${demoUsers.length} users`);
};

// Load data on startup
loadData();

// Initialize demo users after loading data
initializeDemoUsers();

// Save updated demo users to file
saveData();

// Save data periodically (every 5 seconds)
setInterval(saveData, 5000);

// Save data on graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  saveData();
  process.exit(0);
});

// Get vehicles for Nakliyeci
app.get('/api/vehicles/nakliyeci', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    // Get nakliyeci user
    const nakliyeciUser = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizedUserId && u.userType === 'nakliyeci'
    );
    
    if (!nakliyeciUser) {
      return res.status(404).json({
        success: false,
        message: 'Nakliyeci kullanıcı bulunamadı',
      });
    }
    
    // Demo vehicles - in a real app, these would come from a vehicles table
    // For now, create demo vehicles based on the nakliyeci's vehicle info
    const vehicles = [];
    
    // If nakliyeci has a vehicle property, use it
    if (nakliyeciUser.vehicle) {
      vehicles.push({
        id: 1,
        name: nakliyeciUser.vehicle,
        type: 'Kamyon',
        maxWeight: 10000, // 10 tons
        maxVolume: 50, // 50 m³
        currentWeight: 0,
        currentVolume: 0,
      });
    } else {
      // Default demo vehicles
      vehicles.push(
        {
          id: 1,
          name: '34 ABC 1234',
          type: 'Kamyon',
          maxWeight: 10000, // 10 tons
          maxVolume: 50, // 50 m³
          currentWeight: 0,
          currentVolume: 0,
        },
        {
          id: 2,
          name: '34 XYZ 5678',
          type: 'Tır',
          maxWeight: 20000, // 20 tons
          maxVolume: 80, // 80 m³
          currentWeight: 0,
          currentVolume: 0,
        }
      );
    }
    
    res.json({
      success: true,
      vehicles: vehicles,
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Araçlar yüklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Get available loads for route planner
app.get('/api/loads/available', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    // Get nakliyeci user
    const nakliyeciUser = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizedUserId && u.userType === 'nakliyeci'
    );
    
    if (!nakliyeciUser) {
      return res.status(404).json({
        success: false,
        message: 'Nakliyeci kullanıcı bulunamadı',
      });
    }
    
    // Get open shipments (status: 'open' or 'pending')
    const openShipments = Array.from(demoShipmentsStore.values()).filter(
      (s) => s.status === 'open' || s.status === 'pending'
    );
    
    // Transform shipments to available loads format
    const availableLoads = openShipments.map((shipment) => {
      // Get sender user info
      const senderUser = Array.from(demoUsersStore.values()).find(
        (u) => normalizeUserId(u.id) === normalizeUserId(shipment.userId)
      );
      
      return {
        id: shipment.id,
        title: shipment.title || shipment.description || 'Yük',
        pickupAddress: shipment.pickupAddress || shipment.from || 'Adres bilgisi yok',
        deliveryAddress: shipment.deliveryAddress || shipment.to || 'Adres bilgisi yok',
        weight: shipment.weight || 0,
        volume: shipment.volume || 0,
        price: shipment.price || 0,
        deadline: shipment.deliveryDate || shipment.deadline || new Date().toISOString(),
        distance: shipment.distance || 0,
        shipper: {
          name: senderUser?.fullName || senderUser?.firstName || 'Bilinmiyor',
          // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
          email: senderUser?.email || 'Bilinmiyor',
        },
      };
    });
    
    res.json({
      success: true,
      data: availableLoads,
    });
  } catch (error) {
    console.error('Error fetching available loads:', error);
    res.status(500).json({
      success: false,
      message: 'Mevcut yükler yüklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Driver/Carrier endpoints for nakliyeci
// Get drivers for nakliyeci
app.get('/api/drivers/nakliyeci', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    // Get nakliyeci user
    const nakliyeciUser = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizedUserId && u.userType === 'nakliyeci'
    );
    
    if (!nakliyeciUser) {
      return res.status(404).json({
        success: false,
        message: 'Nakliyeci kullanıcı bulunamadı',
      });
    }
    
    // Get all carriers (tasiyici users) linked to this nakliyeci
    const driverIds = demoDriversStore.get(normalizedUserId) || new Set();
    const drivers = [];
    
    for (const carrierId of driverIds) {
      const carrierUser = Array.from(demoUsersStore.values()).find(
        (u) => normalizeUserId(u.id) === normalizeUserId(carrierId) && u.userType === 'tasiyici'
      );
      if (carrierUser) {
        drivers.push({
          id: carrierUser.id,
          name: carrierUser.fullName || carrierUser.name,
          email: carrierUser.email,
          phone: carrierUser.phone,
          city: carrierUser.city,
          district: carrierUser.district,
        });
      }
    }
    
    res.json({
      success: true,
      drivers: drivers,
      data: drivers,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/drivers/nakliyeci error:', error);
    res.status(500).json({
      success: false,
      message: 'Taşıyıcılar yüklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Link driver by code
app.post('/api/drivers/link', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir taşıyıcı kodu girin',
      });
    }
    
    // Get nakliyeci user
    const nakliyeciUser = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizedUserId && u.userType === 'nakliyeci'
    );
    
    if (!nakliyeciUser) {
      return res.status(404).json({
        success: false,
        message: 'Nakliyeci kullanıcı bulunamadı',
      });
    }
    
    // Code format: DRV-XXX-XXX (e.g., DRV-IST-001)
    // First, try to find carrier by driver code from driverCodeStore
    let carrierUser = null;
    
    // Check if code exists in driverCodeStore
    const driverUserId = driverCodeStore.get(code);
    if (driverUserId) {
      console.log(`🔍 [DEBUG] Found driver code ${code} -> userId: ${driverUserId}`);
      // Find user by userId
      carrierUser = Array.from(demoUsersStore.values()).find(
        (u) => (u.id === driverUserId || u.id?.toString() === driverUserId) && 
               (u.userType === 'tasiyici' || u.panel_type === 'tasiyici' || u.role === 'tasiyici')
      );
      if (carrierUser) {
        console.log(`✅ [DEBUG] Found carrier by code: ${carrierUser.email} (userType: ${carrierUser.userType})`);
      } else {
        console.log(`⚠️ [DEBUG] Driver code found but user not found or not a tasiyici: ${driverUserId}`);
      }
    }
    
    // If not found by code, try to find by email (for backward compatibility)
    if (!carrierUser && code.includes('@')) {
      const codeLower = code.toLowerCase();
      // Log all users for debugging
      const allUsers = Array.from(demoUsersStore.values());
      console.log(`🔍 [DEBUG] Total users in store: ${allUsers.length}`);
      const tasiyiciUsers = allUsers.filter(u => u.userType === 'tasiyici' || u.panel_type === 'tasiyici' || u.role === 'tasiyici');
      console.log(`🔍 [DEBUG] Total tasiyici users: ${tasiyiciUsers.length}`);
      tasiyiciUsers.forEach(u => {
        console.log(`  - ${u.email} (userType: ${u.userType}, panel_type: ${u.panel_type}, role: ${u.role}, id: ${u.id})`);
      });
      // Try multiple ways to find carrier user
      carrierUser = Array.from(demoUsersStore.values()).find(
        (u) => u.email && u.email.toLowerCase() === codeLower && (u.userType === 'tasiyici' || u.panel_type === 'tasiyici' || u.role === 'tasiyici')
      );
      // If not found, try without userType check (for backward compatibility)
      if (!carrierUser) {
        carrierUser = Array.from(demoUsersStore.values()).find(
          (u) => u.email && u.email.toLowerCase() === codeLower
        );
        if (carrierUser) {
          console.log(`⚠️ [DEBUG] Found user but userType mismatch: ${carrierUser.email} (userType: ${carrierUser.userType}, panel_type: ${carrierUser.panel_type}, role: ${carrierUser.role})`);
        }
      }
      console.log(`🔍 [DEBUG] Looking for carrier with email: ${codeLower}, found:`, carrierUser ? `${carrierUser.email} (userType: ${carrierUser.userType})` : 'NOT FOUND');
    } else if (!carrierUser) {
      // Try to find by ID if code is numeric or looks like an ID
      const codeAsId = code.replace(/^DRV-[A-Z]{3}-/, '');
      if (codeAsId && codeAsId !== code) {
        carrierUser = Array.from(demoUsersStore.values()).find(
          (u) => (u.id === code || u.id === codeAsId || u.id?.toString() === codeAsId) && 
                 (u.userType === 'tasiyici' || u.panel_type === 'tasiyici' || u.role === 'tasiyici')
        );
      }
    }
    
    if (!carrierUser) {
      // Log all users for debugging
      const allUsers = Array.from(demoUsersStore.values());
      console.log(`❌ [DEBUG] Carrier not found. Total users in store: ${allUsers.length}`);
      allUsers.forEach((u, idx) => {
        console.log(`  User ${idx + 1}: ${u.email} (userType: ${u.userType}, panel_type: ${u.panel_type}, role: ${u.role}, id: ${u.id})`);
      });
      return res.status(404).json({
        success: false,
        message: 'Kod bulunamadı. Lütfen geçerli bir taşıyıcı kodu girin.',
      });
    }
    
    // Create driver relationship - store in demoDriversStore
    if (!demoDriversStore.has(normalizedUserId)) {
      demoDriversStore.set(normalizedUserId, new Set());
    }
    const driverSet = demoDriversStore.get(normalizedUserId);
    const carrierIdNormalized = normalizeUserId(carrierUser.id);
    
    // Check if already linked
    if (driverSet.has(carrierIdNormalized)) {
      return res.status(400).json({
        success: false,
        message: 'Bu taşıyıcı zaten eklenmiş',
      });
    }
    
    // Add carrier to nakliyeci's driver list
    driverSet.add(carrierIdNormalized);
    demoDriversStore.set(normalizedUserId, driverSet);
    
    console.log(`✅ [DEBUG] Driver linked - nakliyeciId: ${normalizedUserId}, carrierId: ${carrierIdNormalized}, code: ${code}`);
    console.log(`✅ [DEBUG] Total drivers for nakliyeci ${normalizedUserId}: ${driverSet.size}`);
    
    res.json({
      success: true,
      message: 'Taşıyıcı başarıyla eklendi',
      data: {
        driverId: carrierUser.id,
        driverName: carrierUser.fullName || carrierUser.name,
        driverEmail: carrierUser.email,
        driverPhone: carrierUser.phone,
      },
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/drivers/link error:', error);
    res.status(500).json({
      success: false,
      message: 'Taşıyıcı eklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Corporate carrier (nakliyeci) endpoints for corporate users
// Get favori nakliyeciler for corporate user
app.get('/api/carriers/corporate', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    
    // Get corporate user - try multiple ways to find user
    let corporateUser = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizedUserId && (u.userType === 'corporate' || u.panel_type === 'corporate' || u.role === 'corporate')
    );
    
    // If not found, create demo corporate user
    if (!corporateUser) {
      corporateUser = {
        id: userId,
        fullName: 'Corporate Demo User',
        email: 'demo@corporate.com',
        phone: '+90 555 123 4567',
        userType: 'corporate',
        panel_type: 'corporate',
        role: 'corporate',
        companyName: 'Demo Corporate Company',
      };
      demoUsersStore.set(userId, corporateUser);
      console.log(`✅ [DEBUG] Created demo corporate user: ${userId}`);
    }
    
    // Get all nakliyeciler linked to this corporate user
    const nakliyeciIds = demoCorporateCarriersStore.get(normalizedUserId) || new Set();
    const nakliyeciler = [];
    
    for (const nakliyeciId of nakliyeciIds) {
      const nakliyeciUser = Array.from(demoUsersStore.values()).find(
        (u) => normalizeUserId(u.id) === normalizeUserId(nakliyeciId) && (u.userType === 'nakliyeci' || u.panel_type === 'nakliyeci' || u.role === 'nakliyeci')
      );
      if (nakliyeciUser) {
        nakliyeciler.push({
          id: nakliyeciUser.id,
          name: nakliyeciUser.fullName || nakliyeciUser.name,
          companyName: nakliyeciUser.companyName,
          email: nakliyeciUser.email,
          phone: nakliyeciUser.phone,
          city: nakliyeciUser.city,
          district: nakliyeciUser.district,
        });
      }
    }
    
    res.json({
      success: true,
      carriers: nakliyeciler,
      data: nakliyeciler,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/carriers/corporate error:', error);
    res.status(500).json({
      success: false,
      message: 'Nakliyeciler yüklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Link nakliyeci to corporate user (by email or code)
app.post('/api/carriers/corporate/link', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    const { code, email } = req.body;
    
    if (!code && !email) {
      return res.status(400).json({
        success: false,
        message: 'Nakliyeci kodu veya e-posta gereklidir',
      });
    }
    
    // Get corporate user
    const corporateUser = Array.from(demoUsersStore.values()).find(
      (u) => normalizeUserId(u.id) === normalizedUserId && u.userType === 'corporate'
    );
    
    if (!corporateUser) {
      return res.status(404).json({
        success: false,
        message: 'Kurumsal kullanıcı bulunamadı',
      });
    }
    
    // Find nakliyeci user by email or code
    let nakliyeciUser = null;
    const searchTerm = code || email;
    
    if (searchTerm.includes('@')) {
      // Search by email
      const searchLower = searchTerm.toLowerCase();
      nakliyeciUser = Array.from(demoUsersStore.values()).find(
        (u) => u.email && u.email.toLowerCase() === searchLower && 
               (u.userType === 'nakliyeci' || u.panel_type === 'nakliyeci' || u.role === 'nakliyeci')
      );
    } else {
      // Search by ID or code
      nakliyeciUser = Array.from(demoUsersStore.values()).find(
        (u) => (u.id === searchTerm || u.id?.toString() === searchTerm) && 
               (u.userType === 'nakliyeci' || u.panel_type === 'nakliyeci' || u.role === 'nakliyeci')
      );
    }
    
    if (!nakliyeciUser) {
      return res.status(404).json({
        success: false,
        message: 'Nakliyeci bulunamadı. Lütfen geçerli bir nakliyeci kodu veya e-posta girin.',
      });
    }
    
    // Create corporate-nakliyeci relationship
    if (!demoCorporateCarriersStore.has(normalizedUserId)) {
      demoCorporateCarriersStore.set(normalizedUserId, new Set());
    }
    const carrierSet = demoCorporateCarriersStore.get(normalizedUserId);
    const nakliyeciIdNormalized = normalizeUserId(nakliyeciUser.id);
    
    // Check if already linked
    if (carrierSet.has(nakliyeciIdNormalized)) {
      return res.status(400).json({
        success: false,
        message: 'Bu nakliyeci zaten favorilerinize eklenmiş',
      });
    }
    
    // Add nakliyeci to corporate's carrier list
    carrierSet.add(nakliyeciIdNormalized);
    demoCorporateCarriersStore.set(normalizedUserId, carrierSet);
    
    console.log(`✅ [DEBUG] Corporate carrier linked - corporateId: ${normalizedUserId}, nakliyeciId: ${nakliyeciIdNormalized}`);
    console.log(`✅ [DEBUG] Total carriers for corporate ${normalizedUserId}: ${carrierSet.size}`);
    
    // Save data
    saveData();
    
    res.json({
      success: true,
      message: 'Nakliyeci başarıyla favorilerinize eklendi',
      data: {
        nakliyeci: {
          id: nakliyeciUser.id,
          name: nakliyeciUser.fullName || nakliyeciUser.name,
          companyName: nakliyeciUser.companyName,
          email: nakliyeciUser.email,
        }
      }
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/carriers/corporate/link error:', error);
    res.status(500).json({
      success: false,
      message: 'Nakliyeci eklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Wallet endpoints
app.get('/api/wallet/nakliyeci', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);

    // Get or initialize wallet data
    let walletData = demoWalletStore.get(normalizedUserId) || demoWalletStore.get(userId);
    
    if (!walletData) {
      // Initialize wallet for nakliyeci
      walletData = {
        balance: 0,
        pendingCommissions: 0,
        totalCommissions: 0,
        totalRefunds: 0,
        commissionRate: 1, // %1 komisyon
        transactions: [],
      };
      demoWalletStore.set(normalizedUserId, walletData);
      demoWalletStore.set(userId, walletData);
    }

    // Calculate pending commissions from accepted offers
    const allOffers = Array.from(demoOffersStore.values());
    const acceptedOffers = allOffers.filter(o => {
      const offerUserId = normalizeUserId(o.carrierId || o.userId);
      return (offerUserId === normalizedUserId || offerUserId === userId) && o.status === 'accepted';
    });

    let pendingCommissions = 0;
    const transactions = [];

    acceptedOffers.forEach(offer => {
      const commission = (offer.price || 0) * 0.01; // %1 komisyon
      pendingCommissions += commission;
      
      // Find related shipment
      const shipment = demoShipmentsStore.get(offer.shipmentId);
      const shipmentTitle = shipment?.title || shipment?.description || `Gönderi #${offer.shipmentId}`;
      
      transactions.push({
        id: transactionIdCounter++,
        offerId: offer.id,
        shipmentId: offer.shipmentId,
        shipmentTitle: shipmentTitle,
        amount: commission,
        status: shipment?.status === 'delivered' ? 'completed' : 'pending',
        createdAt: offer.createdAt || new Date().toISOString(),
        completedAt: shipment?.status === 'delivered' ? shipment.deliveredAt : undefined,
      });
    });

    // Update wallet data
    walletData.pendingCommissions = pendingCommissions;
    walletData.transactions = transactions;
    walletData.totalCommissions = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        balance: walletData.balance || 0,
        pendingCommissions: walletData.pendingCommissions || 0,
        totalCommissions: walletData.totalCommissions || 0,
        totalRefunds: walletData.totalRefunds || 0,
        commissionRate: walletData.commissionRate || 1,
        transactions: walletData.transactions || [],
      },
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/wallet/nakliyeci error:', error);
    res.status(500).json({
      success: false,
      message: 'Cüzdan verileri yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

app.post('/api/wallet/deposit', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const normalizedUserId = normalizeUserId(userId);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir miktar girin',
      });
    }

    // Get or initialize wallet data
    let walletData = demoWalletStore.get(normalizedUserId) || demoWalletStore.get(userId);
    
    if (!walletData) {
      walletData = {
        balance: 0,
        pendingCommissions: 0,
        totalCommissions: 0,
        totalRefunds: 0,
        commissionRate: 1,
        transactions: [],
      };
    }

    // Add deposit amount to balance
    walletData.balance = (walletData.balance || 0) + parseFloat(amount);
    walletData.updatedAt = new Date().toISOString();

    // Save wallet data
    demoWalletStore.set(normalizedUserId, walletData);
    demoWalletStore.set(userId, walletData);
    saveData();

    res.json({
      success: true,
      data: {
        balance: walletData.balance,
        message: `₺${amount} cüzdanınıza yatırıldı`,
      },
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/wallet/deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Para yatırma işlemi sırasında bir hata oluştu',
      error: error.message,
    });
  }
});

// Rating endpoints
// POST /api/ratings - Create a new rating
app.post('/api/ratings', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const { rated_user_id, rating, comment, shipment_id } = req.body;

    console.log('📝 [RATING] POST /api/ratings request:', {
      userId,
      rated_user_id,
      rating,
      shipment_id,
    });

    if (!rated_user_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir kullanıcı ID ve 1-5 arası puan gerekli',
      });
    }

    // Normalize IDs
    const normalizedRatedUserId = normalizeUserId(rated_user_id);
    const normalizedRaterId = normalizeUserId(userId);

    console.log('📝 [RATING] Normalized IDs:', {
      rated_user_id: normalizedRatedUserId,
      rater_id: normalizedRaterId,
    });

    const ratingId = ratingIdCounter++;
    const newRating = {
      id: ratingId,
      rated_user_id: normalizedRatedUserId,
      rater_id: normalizedRaterId,
      rating: parseInt(rating),
      comment: comment || '',
      shipment_id: shipment_id || null,
      created_at: new Date().toISOString(),
    };

    demoRatingsStore.set(ratingId, newRating);
    console.log('✅ [RATING] Rating created:', newRating);

    // Update shipment rating if shipment_id is provided
    if (shipment_id) {
      const shipmentIdNum = parseInt(shipment_id);
      const shipment = demoShipmentsStore.get(shipmentIdNum);
      if (shipment) {
        shipment.rating = parseInt(rating);
        demoShipmentsStore.set(shipmentIdNum, shipment);
        console.log('✅ [RATING] Shipment rating updated:', shipmentIdNum, '->', rating);
      } else {
        console.log('⚠️ [RATING] Shipment not found:', shipmentIdNum);
      }
    }
    
    // Send notification to rated user about new rating
    io.emit('notification:new', {
      type: 'rating_received',
      title: 'Yeni Değerlendirme Alındı',
      message: `${rating} yıldız değerlendirme aldınız. ${comment ? 'Yorum: ' + comment.substring(0, 50) + '...' : ''}`,
      shipmentId: shipment_id || null,
      ratingId: ratingId,
      userId: normalizedRatedUserId, // Send to rated user
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: newRating,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Değerlendirme oluşturulurken bir hata oluştu',
      message: error.message,
    });
  }
});

// GET /api/ratings/:userId - Get ratings for a user
app.get('/api/ratings/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = normalizeUserId(userId);

    const ratings = Array.from(demoRatingsStore.values()).filter(
      (r) => normalizeUserId(r.rated_user_id) === normalizedUserId
    );

    // Get rater names
    const ratingsWithNames = ratings.map((rating) => {
      const rater = Array.from(demoUsersStore.values()).find(
        (u) => normalizeUserId(u.id) === normalizeUserId(rating.rater_id)
      );
      return {
        ...rating,
        rater_name: rater?.fullName || rater?.name || 'Bilinmiyor',
      };
    });

    res.json({
      success: true,
      data: ratingsWithNames,
    });
  } catch (error) {
    console.error('❌ [ERROR] /api/ratings/:userId error:', error);
    res.status(500).json({
      success: false,
      error: 'Değerlendirmeler yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  saveData();
  process.exit(0);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ WebSocket client disconnected: ${socket.id}`);
  });

  // Handle message events
  socket.on('message:new', (data) => {
    // Broadcast new message to relevant users
    io.emit('message:new', data);
  });

  socket.on('message:read', (data) => {
    // Broadcast read receipt
    io.emit('message:read', data);
  });
});

// Start server
// Production startup validation
if (isProduction) {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 YOLNEXT Production Server');
  console.log('='.repeat(60));
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ CORS Origin: ${corsOrigin || 'NOT SET - CRITICAL ERROR'}`);
  console.log(`✅ JWT Secret: ${process.env.JWT_SECRET ? 'SET (' + process.env.JWT_SECRET.length + ' chars)' : 'NOT SET - CRITICAL ERROR'}`);
  console.log(`✅ Port: ${PORT}`);
  console.log(`✅ Helmet: Enabled`);
  console.log(`✅ Rate Limiting: Enabled`);
  console.log('='.repeat(60) + '\n');
  
  if (!corsOrigin) {
    console.error('❌ CRITICAL: CORS_ORIGIN not set. Server will not start safely.');
    process.exit(1);
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ CRITICAL: JWT_SECRET not set or too short. Server will not start safely.');
    process.exit(1);
  }
} else {
  console.log(`🚀 YOLNEXT Development Server starting on port ${PORT}...`);
}

httpServer.listen(PORT, () => {
  console.log(`✅ Simple Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📦 Demo data stores initialized`);
});
