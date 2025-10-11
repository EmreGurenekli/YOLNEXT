# 🔌 YolNet API Dokümantasyonu

## 📋 Genel Bilgiler
- **Base URL:** `http://localhost:3001/api`
- **Authentication:** JWT Bearer Token
- **Content-Type:** `application/json`

## 🔐 Authentication Endpoints

### POST /auth/demo-login
Demo kullanıcı girişi

**Request Body:**
```json
{
  "userType": "individual" | "corporate" | "carrier" | "driver"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "name": "Demo User",
      "email": "demo@example.com",
      "userType": "individual"
    }
  }
}
```

## 👤 User Endpoints

### GET /profile
Kullanıcı profili

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Demo User",
    "email": "demo@example.com",
    "userType": "individual",
    "phone": "+90 555 123 4567",
    "address": "İstanbul, Türkiye"
  }
}
```

## 📦 Shipment Endpoints

### POST /shipments
Gönderi oluşturma

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Ev Eşyası Taşıma",
  "description": "İstanbul'dan Ankara'ya ev eşyası",
  "category": "ev-esya",
  "weight": 50,
  "volume": 2,
  "value": 1000,
  "fromLocation": "{\"address\":\"Kadıköy, İstanbul\",\"city\":\"İstanbul\",\"district\":\"Kadıköy\"}",
  "toLocation": "{\"address\":\"Beşiktaş, İstanbul\",\"city\":\"İstanbul\",\"district\":\"Beşiktaş\"}",
  "pickupDate": "2025-10-05T10:00:00Z",
  "deliveryDate": "2025-10-05T18:00:00Z",
  "specialRequirements": "[]"
}
```

### GET /shipments
Gönderi listesi

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Sayfa numarası
- `limit` (optional): Sayfa başına kayıt
- `status` (optional): Gönderi durumu

## 💰 Wallet Endpoints

### GET /wallet
Cüzdan bilgileri

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1500.00,
    "currency": "TRY",
    "transactions": []
  }
}
```

## 📊 Reports Endpoints

### GET /reports/shipments
Gönderi raporları

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi
- `type`: Rapor türü

## 🔔 Notifications Endpoints

### GET /notifications
Bildirim listesi

**Headers:**
```
Authorization: Bearer <token>
```

### POST /notifications/mark-read
Bildirimi okundu olarak işaretle

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notificationId": 1
}
```

## 📱 Messages Endpoints

### GET /messages
Mesaj listesi

**Headers:**
```
Authorization: Bearer <token>
```

### POST /messages
Mesaj gönderme

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "recipientId": 2,
  "message": "Merhaba, gönderiniz hakkında soru sormak istiyorum.",
  "type": "text"
}
```

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## 📝 Rate Limiting
- **Limit:** 100 requests per minute per IP
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## 🔒 CORS
- **Allowed Origins:** `http://localhost:5173`
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Headers:** Authorization, Content-Type







