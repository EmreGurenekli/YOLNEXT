const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
require('dotenv').config();

// Database
const { initializeDatabase } = require('./scripts/init-real-database');
const { db } = require('./database/init');

// Services
const NotificationService = require('./services/notification-service');
const CargoIntegrationService = require('./services/cargo-integration');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shipmentRoutes = require('./routes/real-shipments');
const offerRoutes = require('./routes/offers');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/real-payments');
const messagingRoutes = require('./routes/real-messaging');
const notificationRoutes = require('./routes/notifications');
const cargoRoutes = require('./routes/cargo');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');
const kycRoutes = require('./routes/kyc');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const reviewRoutes = require('./routes/reviews');
const settingsRoutes = require('./routes/settings');

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

// Services
const notificationService = new NotificationService(io);
const cargoService = new CargoIntegrationService();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü'));
    }
  }
});

// Make upload available to routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'YolNet API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', settingsRoutes);

// Static files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu çok büyük (maksimum 10MB)'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint bulunamadı'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Yeni kullanıcı bağlandı:', socket.id);

  // Kullanıcı oda katılımı
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Kullanıcı ${userId} odasına katıldı`);
  });

  // Mesaj gönderme
  socket.on('send_message', async (data) => {
    try {
      // Mesajı veritabanına kaydet
      const result = await db.run(`
        INSERT INTO messages (conversation_id, sender_id, content, message_type)
        VALUES (?, ?, ?, ?)
      `, [data.conversationId, data.senderId, data.content, data.messageType || 'text']);

      // Konuşmanın son mesaj zamanını güncelle
      await db.run(`
        UPDATE conversations 
        SET last_message_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [data.conversationId]);

      // Mesajı alıcıya gönder
      socket.to(`user_${data.recipientId}`).emit('new_message', {
        id: result.lastID,
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        content: data.content,
        message_type: data.messageType || 'text',
        created_at: new Date().toISOString()
      });

      // Bildirim oluştur
      await notificationService.notifyMessageReceived(data.conversationId, result.lastID);

    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      socket.emit('message_error', { error: 'Mesaj gönderilemedi' });
    }
  });

  // Bağlantı kesildi
  socket.on('disconnect', () => {
    console.log('🔌 Kullanıcı bağlantısı kesildi:', socket.id);
  });
});

// Database initialization
const initDatabase = async () => {
  try {
    console.log('🗄️ Veritabanı başlatılıyor...');
    await initializeDatabase();
    console.log('✅ Veritabanı hazır!');
  } catch (error) {
    console.error('❌ Veritabanı başlatma hatası:', error);
    process.exit(1);
  }
};

// Server başlatma
const startServer = () => {
  server.listen(PORT, () => {
    console.log('🚀 YolNet Gerçek API Server çalışıyor!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log('🔌 WebSocket aktif');
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server kapatılıyor...');
  server.close(() => {
    console.log('✅ Server kapatıldı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Server kapatılıyor...');
  server.close(() => {
    console.log('✅ Server kapatıldı');
    process.exit(0);
  });
});

// Uygulamayı başlat
const main = async () => {
  await initDatabase();
  startServer();
};

main().catch(console.error);

module.exports = { app, server, io };




