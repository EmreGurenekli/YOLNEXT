const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
require('dotenv').config();

// Services
const cacheService = require('./services/cache-service');
const loggerService = require('./services/logger-service');
const monitoringService = require('./services/monitoring-service');
const smartMatchingService = require('./services/smart-matching-service');

// Middleware
const { errorHandler, asyncHandler } = require('./utils/errors');
const { 
  generalLimiter, 
  authLimiter, 
  registerLimiter, 
  uploadLimiter, 
  apiLimiter,
  dynamicLimiter 
} = require('./middleware/rate-limiter');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shipmentRoutes = require('./routes/real-shipments');
const offerRoutes = require('./routes/offers');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/real-payments');
const messagingRoutes = require('./routes/real-messaging');
const notificationRoutes = require('./routes/notifications');
const healthRoutes = require('./routes/health');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');

// Swagger
const { specs, swaggerUi } = require('./docs/swagger-config');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api', apiLimiter);
app.use(dynamicLimiter);

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maksimum 5 dosya
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü. Sadece jpg, png, pdf, doc, docx dosyaları kabul edilir.'));
    }
  }
});

// Make upload available to routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoringService.recordRequest(req, res, responseTime);
    loggerService.logRequest(req, res, responseTime);
  });
  
  next();
});

// Health check
app.use('/api/health', healthRoutes);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'YolNet API Documentation'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Monitoring endpoints
app.get('/api/monitoring/metrics', asyncHandler(async (req, res) => {
  const metrics = monitoringService.getSystemMetrics();
  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString()
  });
}));

app.get('/api/monitoring/report', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const report = await monitoringService.generateReport(days);
  res.json({
    success: true,
    data: report
  });
}));

// Static files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'API endpoint bulunamadı',
      code: 'NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString()
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  loggerService.info('New WebSocket connection', { socketId: socket.id });

  // Kullanıcı oda katılımı
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    loggerService.info('User joined room', { socketId: socket.id, userId });
  });

  // Mesaj gönderme
  socket.on('send_message', async (data) => {
    try {
      // Mesajı veritabanına kaydet
      const { db } = require('./database/init');
      const result = await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO messages (conversation_id, sender_id, content, message_type)
          VALUES (?, ?, ?, ?)
        `, [data.conversationId, data.senderId, data.content, data.messageType || 'text'], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });

      // Konuşmanın son mesaj zamanını güncelle
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE conversations 
          SET last_message_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [data.conversationId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Mesajı alıcıya gönder
      socket.to(`user_${data.recipientId}`).emit('new_message', {
        id: result,
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        content: data.content,
        message_type: data.messageType || 'text',
        created_at: new Date().toISOString()
      });

      loggerService.info('Message sent', { 
        conversationId: data.conversationId, 
        senderId: data.senderId,
        recipientId: data.recipientId 
      });

    } catch (error) {
      loggerService.error('Message sending error', error);
      socket.emit('message_error', { error: 'Mesaj gönderilemedi' });
    }
  });

  // Bağlantı kesildi
  socket.on('disconnect', () => {
    loggerService.info('WebSocket disconnected', { socketId: socket.id });
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  loggerService.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    loggerService.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  loggerService.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    loggerService.info('Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  loggerService.error('Unhandled Promise Rejection', reason);
});

// Uncaught exception
process.on('uncaughtException', (error) => {
  loggerService.error('Uncaught Exception', error);
  process.exit(1);
});

// Server başlatma
const startServer = () => {
  server.listen(PORT, () => {
    loggerService.info('YolNet Improved API Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0'
    });
    
    console.log('🚀 YolNet Improved API Server çalışıyor!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`📈 Monitoring: http://localhost:${PORT}/api/monitoring/metrics`);
    console.log('🔌 WebSocket aktif');
  });
};

// Uygulamayı başlat
startServer();

module.exports = { app, server, io };



