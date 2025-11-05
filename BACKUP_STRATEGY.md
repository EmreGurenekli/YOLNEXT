# 💾 Database Backup Strategy

## 📋 Genel Bakış

YolNext platformu için PostgreSQL veritabanı yedekleme stratejisi ve prosedürleri.

---

## 🔄 Otomatik Yedekleme

### Günlük Yedekleme
- **Sıklık:** Her gün saat 02:00
- **Saklama Süresi:** 7 gün
- **Format:** PostgreSQL custom format (.sql.gz)
- **Lokasyon:** `backend/backups/`

### Yedekleme Script'i
```bash
# Manuel yedekleme
node backend/scripts/backup-database.js

# Otomatik yedekleme (cron job)
0 2 * * * cd /path/to/YOLNEXT && node backend/scripts/backup-database.js
```

---

## 📦 Yedekleme Türleri

### 1. Full Backup (Tam Yedek)
- Tüm veritabanı içeriği
- Schema ve data
- **Sıklık:** Günlük
- **Boyut:** ~100MB - 1GB (veriye göre)

### 2. Incremental Backup (Artımlı Yedek)
- Sadece değişen veriler
- **Sıklık:** Her 6 saatte bir (opsiyonel)
- **Boyut:** Küçük

---

## 🔧 Yedekleme Prosedürleri

### Manuel Yedekleme
```bash
# 1. Environment variables ayarlayın
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=yolnext
export DB_USER=postgres
export DB_PASSWORD=your_password

# 2. Yedekleme oluşturun
node backend/scripts/backup-database.js
```

### Yedekten Geri Yükleme
```bash
# Yedekten geri yükleme
node backend/scripts/backup-database.js restore backend/backups/yolnext_backup_2025-01-11.sql.gz
```

---

## 📁 Yedekleme Dosya Yapısı

```
backend/backups/
├── yolnext_backup_2025-01-11.sql.gz
├── yolnext_backup_2025-01-10.sql.gz
├── yolnext_backup_2025-01-09.sql.gz
└── ...
```

---

## 🔒 Güvenlik

### Yedekleme Güvenliği
- ✅ Yedekler şifrelenmiş (gzip compression)
- ✅ Erişim kontrolü (sadece admin)
- ✅ Yedekler ayrı sunucuda saklanmalı
- ✅ Düzenli yedek testleri yapılmalı

### Best Practices
1. **3-2-1 Kuralı:**
   - 3 kopya (original + 2 backup)
   - 2 farklı medya türü
   - 1 off-site backup

2. **Yedek Testleri:**
   - Aylık restore testleri
   - Yedek bütünlüğü kontrolü

3. **Dokümantasyon:**
   - Yedekleme prosedürleri dokümante edilmeli
   - Acil durum planı hazır olmalı

---

## 🚨 Disaster Recovery Plan

### Senaryo 1: Veri Kaybı
1. En son yedeği belirle
2. Yedekten geri yükle
3. Veri bütünlüğünü kontrol et
4. Servisi yeniden başlat

### Senaryo 2: Tam Sistem Çökmesi
1. Yeni sunucu kurulumu
2. PostgreSQL kurulumu
3. Yedekten geri yükleme
4. Uygulama deploy
5. Sistem testleri

---

## 📊 Monitoring

### Yedekleme Kontrolü
- Günlük yedekleme başarı kontrolü
- Yedek dosya boyutu kontrolü
- Yedek bütünlüğü kontrolü
- Eski yedeklerin temizlenmesi

### Alerting
- Yedekleme başarısızlığı alert
- Disk alanı uyarısı
- Yedek dosyası eksikliği uyarısı

---

## 🔄 Production Deployment

### Production Backup Settings
```env
BACKUP_DIR=/var/backups/yolnext
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *  # Her gün saat 02:00
```

### Cloud Backup (Önerilen)
- AWS RDS automated backups
- Azure Database backups
- Google Cloud SQL backups

---

## ✅ Checklist

- [ ] Yedekleme script'i test edildi
- [ ] Otomatik yedekleme cron job kuruldu
- [ ] Yedek dosyaları doğru lokasyonda
- [ ] Yedekten geri yükleme test edildi
- [ ] Eski yedekler otomatik temizleniyor
- [ ] Yedekleme monitoring aktif
- [ ] Disaster recovery plan hazır

---

**Son Güncelleme:** 2025-01-11

