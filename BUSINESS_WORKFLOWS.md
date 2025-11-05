# İş Akışları - YolNext Lojistik Platformu

Bu dosya, platformdaki tüm iş akışlarını detaylı olarak açıklar.

## 📋 İş Akışı Diyagramları

### 1. Bireysel Gönderici İş Akışı

```
[Giriş Yap] 
    ↓
[Dashboard] → [Gönderi Oluştur] → [Form Doldur] → [Önizleme] → [Yayınla]
    ↓                                                              ↓
[Gönderilerim] ← [Teklifler] ← [Nakliyeci Teklifleri] ← [Gönderi Yayınlandı]
    ↓
[Canlı Takip] → [Konum Güncellemeleri] → [Teslimat] → [Onay] → [Tamamlandı]
```

### 2. Kurumsal Gönderici İş Akışı

```
[Giriş Yap]
    ↓
[Dashboard] → [Analitik] → [Raporlar]
    ↓
[Gönderi Oluştur] → [Kategori Seç] → [Özel Alanlar] → [Toplu Gönderi] → [Yayınla]
    ↓
[Gönderi Yönetimi] → [Filtreleme] → [Sıralama] → [Rapor İndir]
    ↓
[Toplu İşlemler] → [Durum Güncelleme] → [Takip]
```

### 3. Nakliyeci İş Akışı

```
[Giriş Yap]
    ↓
[Dashboard] → [Yük Pazarı] → [Gönderi Seç] → [Teklif Ver] → [Teklif Kabul]
    ↓
[Aktif Yükler] → [Gönderi Seç] → [Taşıyıcıya Ata]
    ↓
    ├─→ [Doğrudan Ata] → [Taşıyıcı Seç] → [Atama Onayı]
    └─→ [İlan Aç] → [Teklifler] → [Teklif Kabul] → [Taşıyıcı Atandı]
    ↓
[İlanlarım] → [Teklif Yönetimi] → [Rota Optimizasyonu]
    ↓
[Teslimat] → [Ödeme Al] → [Cüzdan] → [Para Çek]
```

### 4. Taşıyıcı İş Akışı

```
[Giriş Yap]
    ↓
[Dashboard] → [İş Pazarı] → [İlan Seç] → [Teklif Ver] → [Teklif Kabul]
    ↓
[Aktif İşler] → [Gönderi Al] → [Konum Güncelle] → [Teslim Et] → [Tamamlandı]
    ↓
[Tamamlanan İşler] → [Kazanç Görüntüle] → [Rapor İndir]
```

---

## 🔄 Tam Döngü İş Akışı

### Senaryo: Ev Taşınması Gönderisi

```
1. BİREYSEL GÖNDERİCİ
   ├─ Gönderi oluşturur (Ev Taşınması)
   ├─ Oda sayısı, bina tipi, kat bilgileri girer
   ├─ Adres ve tarih bilgileri girer
   └─ Yayınlar
          ↓
2. NAKLİYECİ
   ├─ Gönderiyi görür (Yük Pazarı)
   ├─ Detayları inceler
   ├─ Teklif verir (fiyat, süre, mesaj)
   └─ Teklif gönderir
          ↓
3. BİREYSEL GÖNDERİCİ
   ├─ Teklifleri görür
   ├─ Teklifleri karşılaştırır
   ├─ Uygun teklifi kabul eder
   └─ Ödeme yapar
          ↓
4. NAKLİYECİ
   ├─ Gönderiyi alır (Aktif Yükler)
   ├─ Taşıyıcıya atar (Doğrudan veya İlan)
   │   ├─ Doğrudan: Taşıyıcılarım listesinden seçer
   │   └─ İlan: Açık ilan oluşturur, teklifler alır
   └─ Taşıyıcı seçer
          ↓
5. TAŞIYICI
   ├─ İlanı görür (İş Pazarı)
   ├─ Teklif verir
   └─ Teklif kabul edilir
          ↓
6. TAŞIYICI
   ├─ Gönderiyi alır (Aktif İşler)
   ├─ Konum güncellemeleri yapar
   ├─ Teslim eder
   └─ Tamamlandı olarak işaretler
          ↓
7. BİREYSEL GÖNDERİCİ
   ├─ Teslimat bildirimi alır
   ├─ Teslimatı onaylar
   └─ Değerlendirme yapar
          ↓
8. ÖDEME DÖNGÜSÜ
   ├─ Nakliyeci ödeme alır
   ├─ Taşıyıcı ödeme alır
   └─ İşlem tamamlanır
```

---

## 📊 Kategori Bazlı İş Akışları

### Kurumsal: Soğuk Zincir Gönderisi

```
KURUMSAL GÖNDERİCİ
    ↓
[Gönderi Oluştur] → [Kategori: Soğuk Zincir]
    ↓
[Özel Alanlar: Sıcaklık Aralığı, Soğutma Gereksinimleri]
    ↓
[Yayınla]
    ↓
NAKLİYECİ
    ↓
[Gönderiyi Görür] → [Soğuk Zincir Uyumlu Araç Kontrolü]
    ↓
[Teklif Verir] → [Soğuk Zincir Fiyatlandırması]
    ↓
[Kabul Edilir]
    ↓
[Soğuk Zincir Uyumlu Taşıyıcı Seçer]
    ↓
TAŞIYICI
    ↓
[Soğuk Zincir Araçla Taşır]
    ↓
[Sıcaklık Logları Tutar]
    ↓
[Teslim Eder]
```

### Kurumsal: Tehlikeli Madde Gönderisi

```
KURUMSAL GÖNDERİCİ
    ↓
[Gönderi Oluştur] → [Kategori: Tehlikeli Maddeler]
    ↓
[Özel Alanlar: Tehlike Sınıfı, MSDS Belgesi Yükleme]
    ↓
[Yayınla]
    ↓
NAKLİYECİ
    ↓
[Gönderiyi Görür] → [Tehlikeli Madde Lisansı Kontrolü]
    ↓
[Teklif Verir] → [Özel Fiyatlandırma]
    ↓
[Kabul Edilir]
    ↓
[Tehlikeli Madde Uyumlu Taşıyıcı Seçer]
    ↓
TAŞIYICI
    ↓
[Tehlikeli Madde Lisansı Kontrolü]
    ↓
[Özel Araçla Taşır]
    ↓
[Güvenlik Protokolleri Uygular]
    ↓
[Teslim Eder]
```

---

## 💰 Ödeme Akışları

### Ödeme Akışı 1: Bireysel → Nakliyeci → Taşıyıcı

```
1. BİREYSEL GÖNDERİCİ
   └─ Teklif kabul edilince ödeme yapar
          ↓
2. NAKLİYECİ
   └─ Ödeme alır (Komisyon düşülür)
          ↓
3. TAŞIYICI
   └─ Teslimat sonrası ödeme alır
```

### Ödeme Akışı 2: Kurumsal → Nakliyeci → Taşıyıcı

```
1. KURUMSAL GÖNDERİCİ
   └─ Toplu gönderiler için toplu ödeme
          ↓
2. NAKLİYECİ
   └─ Toplu ödeme alır
          ↓
3. TAŞIYICILAR
   └─ Her bir teslimat için ödeme alır
```

---

## 🔔 Bildirim Akışları

### Bildirim Senaryoları:

1. **Gönderi Oluşturuldu**
   - Nakliyeciler bildirim alır

2. **Teklif Geldi**
   - Gönderici bildirim alır

3. **Teklif Kabul Edildi**
   - Nakliyeci bildirim alır

4. **Gönderi Taşıyıcıya Atandı**
   - Taşıyıcı bildirim alır
   - Gönderici bildirim alır

5. **Konum Güncellendi**
   - Gönderici bildirim alır

6. **Teslimat Tamamlandı**
   - Gönderici bildirim alır
   - Nakliyeci bildirim alır

7. **Ödeme Yapıldı**
   - İlgili taraflar bildirim alır

---

## 📈 Analitik ve Raporlama Akışları

### Kurumsal Analitik

```
[Dashboard] → [Analitik]
    ↓
[Kategori Bazlı Analiz]
    ↓
[Harcama Analizi] → [Zaman Serisi Grafikleri]
    ↓
[Performans Metrikleri]
    ↓
[Rapor Oluştur] → [PDF/Excel İndir]
```

### Nakliyeci Analitik

```
[Dashboard] → [Analitik]
    ↓
[Gelir Analizi]
    ↓
[En Çok Kazanç Sağlayan Gönderiler]
    ↓
[Taşıyıcı Performans Analizi]
    ↓
[Rota Optimizasyonu Raporları]
```

---

## 🚛 Rota Optimizasyonu Akışı

```
NAKLİYECİ
    ↓
[Birden Fazla Gönderi Seç]
    ↓
[Rota Planlayıcı] → [Optimizasyon Algoritması]
    ↓
[Optimize Edilmiş Rota]
    ├─ Yakıt Tasarrufu Hesapla
    ├─ Zaman Tasarrufu Hesapla
    └─ Mesafe Optimizasyonu
    ↓
[Rotayı Uygula] → [Taşıyıcılara Dağıt]
```

---

## ✅ Durum Geçişleri

### Gönderi Durumları:

```
[Yayınlandı] → [Teklif Bekliyor]
    ↓
[Teklif Kabul Edildi] → [Ödeme Bekliyor]
    ↓
[Ödeme Yapıldı] → [Nakliyeciye Atandı]
    ↓
[Taşıyıcıya Atandı] → [Toplanıyor]
    ↓
[Yolda] → [Konum Güncellemeleri]
    ↓
[Teslim Edildi] → [Onay Bekliyor]
    ↓
[Onaylandı] → [Tamamlandı]
```

---

## 🔒 Güvenlik ve Doğrulama Akışları

### Kullanıcı Doğrulama

```
[Kayıt] → [Email Doğrulama]
    ↓
[Telefon Doğrulama] (Opsiyonel)
    ↓
[Kimlik Doğrulama] (Kurumsal için)
    ↓
[Hesap Aktif] → [Giriş Yapabilir]
```

### İşlem Doğrulama

```
[İşlem Başlat] → [Yetki Kontrolü]
    ↓
[Token Doğrulama]
    ↓
[İşlem Onayı]
    ↓
[İşlem Gerçekleştir]
```

---

## 📝 Notlar

- Tüm iş akışları gerçek zamanlı veri ile çalışır
- Mock data kullanılmaz
- Her akış backend API'leri ile entegredir
- Bildirimler WebSocket ile gerçek zamanlı gönderilir
- Ödemeler güvenli ödeme sistemleri ile yapılır

