const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // limit her IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Veritabanı bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yolnet-kargo';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/individual', require('./routes/individual'));
app.use('/api/corporate', require('./routes/corporate'));
app.use('/api/carrier', require('./routes/carrier'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/notifications', require('./routes/notifications'));

// Socket.io bağlantıları
io.on('connection', (socket) => {
  console.log('🔌 Kullanıcı bağlandı:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`👥 Kullanıcı odaya katıldı: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Kullanıcı ayrıldı:', socket.id);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Hata:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 YolNet Backend API çalışıyor: http://localhost:${PORT}`);
  console.log(`📊 Socket.io aktif: ws://localhost:${PORT}`);
});

module.exports = { app, io };