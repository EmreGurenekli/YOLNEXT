# 🔧 Environment Setup Guide

YolNext projesini çalıştırmak için gerekli environment variable'ların kurulum rehberi.

---

## 📋 Hızlı Başlangıç

1. `.env.example` dosyasını `.env` olarak kopyalayın:
```bash
cp .env.example .env
```

2. `.env` dosyasını açın ve gerekli değerleri doldurun

3. Backend ve frontend'i başlatın:
```bash
npm run dev:all
```

---

## 🔑 Gerekli Environment Variables

### 1. Application Settings

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 2. Database Configuration

PostgreSQL veritabanı için:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yolnext
DB_USER=postgres
DB_PASSWORD=your_password_here
```

**Not:** PostgreSQL'in kurulu ve çalışır durumda olduğundan emin olun.

### 3. JWT Authentication

```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

**Önemli:** Production'da mutlaka güçlü bir secret key kullanın!

### 4. Email (SMTP) Configuration

Gmail kullanımı için:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yolnext.com
```

**Gmail App Password Nasıl Alınır:**
1. Google Hesabınız → Güvenlik
2. 2 Adımlı Doğrulama'yı açın
3. Uygulama şifreleri → Mail için şifre oluşturun

### 5. SMS (Twilio) Configuration

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Not:** Development için opsiyonel, production'da gerekli.

### 6. Payment (Iyzico) Configuration

```env
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_MODE=sandbox
```

**Not:** Development için sandbox mode kullanın.

---

## 🚀 Development vs Production

### Development
- `NODE_ENV=development`
- Demo login aktif
- Console logging aktif
- Sandbox payment mode

### Production
- `NODE_ENV=production`
- Demo login kapalı
- Production logging (Sentry)
- Production payment mode
- HTTPS zorunlu

---

## ✅ Environment Kontrolü

Environment variable'ların doğru ayarlandığını kontrol etmek için:

```bash
# Backend health check
curl http://localhost:5000/api/health

# Environment variables kontrolü
node -e "console.log(process.env)"
```

---

## 🔒 Güvenlik Notları

1. **Asla `.env` dosyasını commit etmeyin!**
2. Production'da güçlü secret key'ler kullanın
3. Database şifrelerini güvenli tutun
4. API key'leri düzenli olarak rotate edin

---

## 📝 Checklist

- [ ] `.env` dosyası oluşturuldu
- [ ] Database connection string ayarlandı
- [ ] JWT secret key ayarlandı
- [ ] SMTP credentials ayarlandı (opsiyonel)
- [ ] Twilio credentials ayarlandı (opsiyonel)
- [ ] Iyzico credentials ayarlandı (opsiyonel)
- [ ] Backend başlatıldı ve çalışıyor
- [ ] Frontend başlatıldı ve çalışıyor

---

## 🆘 Sorun Giderme

### Database Connection Error
- PostgreSQL'in çalıştığından emin olun
- Database credentials'ı kontrol edin
- Firewall ayarlarını kontrol edin

### Email Gönderilemiyor
- SMTP credentials'ı kontrol edin
- Gmail App Password kullanıyorsanız doğru olduğundan emin olun
- Firewall/port engellemelerini kontrol edin

### JWT Token Hataları
- JWT_SECRET'in doğru ayarlandığından emin olun
- Token expiration süresini kontrol edin

---

## 📚 Daha Fazla Bilgi

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Iyzico Documentation](https://dev.iyzipay.com/)
