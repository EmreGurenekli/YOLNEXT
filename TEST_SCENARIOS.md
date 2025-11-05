# Test Senaryoları - YolNext Lojistik Platformu

Bu dosya, platformun tüm iş akışlarını ve test senaryolarını içerir.

## 📋 Genel Bakış

Platform 4 farklı kullanıcı tipi için tasarlanmıştır:
1. **Bireysel Gönderici** - Kişisel eşyalarını gönderenler
2. **Kurumsal Gönderici** - Şirketler, üreticiler, depo holdingleri
3. **Nakliyeci** - Gönderileri alan ve taşıyıcılara dağıtan aracılar
4. **Taşıyıcı** - Gerçek taşımacılığı yapan şoförler

---

## 🧪 Test Senaryoları

### 1. Bireysel Gönderici Senaryoları

#### Senaryo 1.1: Yeni Gönderi Oluşturma
**Adımlar:**
1. Bireysel gönderici olarak giriş yap
2. "Gönderi Oluştur" sayfasına git
3. Kategori seç (Ev Taşınması, Mobilya & Eşya, Özel Yük, Diğer)
4. Ev Taşınması seçildiyse:
   - Oda sayısı seç
   - Bina tipi seç
   - Toplama katı gir
   - Teslimat katı gir
   - Asansör bilgisi işaretle
   - Paketleme hizmeti ihtiyacı belirt
   - Özel eşyalar varsa belirt
5. Yük açıklaması gir
6. Toplama adresi ve teslimat adresi gir
7. Tarihleri seç
8. Özel gereksinimler varsa belirt
9. Yayınlama tercihini seç
10. Önizleme yap ve yayınla

**Beklenen Sonuç:**
- Gönderi başarıyla oluşturulur
- Gönderilerim sayfasında görünür
- Nakliyeciler gönderiyi görebilir

#### Senaryo 1.2: Teklif Alma ve Değerlendirme
**Adımlar:**
1. Gönderilerim sayfasına git
2. Beklemede olan bir gönderiyi seç
3. Gelen teklifleri görüntüle
4. Teklifleri karşılaştır (fiyat, teslimat süresi, nakliyeci puanı)
5. Uygun bir teklifi kabul et
6. Ödeme işlemini tamamla

**Beklenen Sonuç:**
- Teklifler listelenir
- Teklif detayları görüntülenir
- Teklif kabul edilir ve gönderi durumu güncellenir

#### Senaryo 1.3: Canlı Takip
**Adımlar:**
1. Aktif bir gönderi seç
2. Canlı Takip sayfasına git
3. Gönderinin mevcut konumunu görüntüle
4. Teslimat durumunu takip et

**Beklenen Sonuç:**
- Gönderinin güncel konumu gösterilir
- Durum güncellemeleri görüntülenir
5. Teslimat tamamlandığında bildirim alınır

#### Senaryo 1.4: Geçmiş Siparişler
**Adımlar:**
1. Geçmiş Siparişler sayfasına git
2. Tamamlanan gönderileri görüntüle
3. Filtreleme yap (tarih, durum, kategori)
4. Detayları görüntüle

**Beklenen Sonuç:**
- Tüm geçmiş gönderiler listelenir
- Filtreleme çalışır
- Detaylar doğru görüntülenir

---

### 2. Kurumsal Gönderici Senaryoları

#### Senaryo 2.1: Kurumsal Gönderi Oluşturma
**Adımlar:**
1. Kurumsal gönderici olarak giriş yap
2. "Gönderi Oluştur" sayfasına git
3. Ana kategori seç (19 kategori mevcut):
   - Hammaddeler
   - Perakende Ürünleri
   - Elektronik & Teknoloji
   - Gıda & İçecek
   - Tıbbi & İlaç
   - Tehlikeli Maddeler
   - Dökme Yük
   - Soğuk Zincir
   - Özel Boyutlu Yük
   - Depo Transferi
   - vb.
4. Kategoriye özel alanları doldur:
   - Soğuk zincir gerekiyorsa: Sıcaklık aralığı
   - Tehlikeli madde ise: Tehlike sınıfı, MSDS belgesi
   - Özel boyutlu ise: Vinç gereksinimi, araç tipi
   - vb.
5. Ağırlık (ton), boyutlar, paketleme bilgileri gir
6. Toplama ve teslimat bilgileri gir
7. Tarih ve saat bilgileri gir
8. Özel gereksinimler belirt
9. Yayınla

**Beklenen Sonuç:**
- Gönderi kategoriye özel alanlarla oluşturulur
- Kurumsal gönderilerim sayfasında görünür

#### Senaryo 2.2: Toplu Gönderi Yönetimi
**Adımlar:**
1. Gönderilerim sayfasına git
2. Birden fazla gönderiyi seç
3. Toplu işlemler yap (filtrele, sırala)
4. Excel/PDF raporu indir

**Beklenen Sonuç:**
- Toplu işlemler çalışır
- Raporlar doğru formatlanır

#### Senaryo 2.3: Analitik ve Raporlama
**Adımlar:**
1. Analitik sayfasına git
2. Harcama analizlerini görüntüle
3. Kategori bazlı istatistikleri incele
4. Zaman serisi grafiklerini görüntüle
5. Rapor oluştur ve indir

**Beklenen Sonuç:**
- Analitik veriler doğru hesaplanır
- Grafikler doğru gösterilir
- Raporlar indirilebilir

---

### 3. Nakliyeci Senaryoları

#### Senaryo 3.1: Gönderi Alma ve Teklif Verme
**Adımlar:**
1. Nakliyeci olarak giriş yap
2. Yük Pazarı (Jobs) sayfasına git
3. Açık gönderileri görüntüle
4. Bir gönderi seç ve detayları incele
5. Teklif ver:
   - Fiyat belirle
   - Teslimat süresi belirt
   - Mesaj ekle
   - Özel hizmetler seç (sigorta, paketleme, vb.)
6. Teklifi gönder

**Beklenen Sonuç:**
- Açık gönderiler listelenir
- Teklif başarıyla gönderilir
- Gönderici teklifi görür

#### Senaryo 3.2: Aktif Gönderileri Taşıyıcıya Atama
**Adımlar:**
1. Aktif Yükler sayfasına git
2. Bir gönderi seç
3. "Taşıyıcıya Ata" butonuna tıkla
4. İki mod seç:
   - **Doğrudan Ata:** Taşıyıcılarım listesinden seç
   - **İlan Aç:** Teklifler alsın (minimum fiyat belirle)
5. Seçimi yap ve onayla

**Beklenen Sonuç:**
- Doğrudan atama: Taşıyıcı atanır
- İlan açma: İlan oluşturulur, teklifler gelir

#### Senaryo 3.3: İlan Yönetimi
**Adımlar:**
1. İlanlarım sayfasına git
2. Aktif ilanları görüntüle
3. Gelen teklifleri incele
4. Bir teklifi kabul et veya reddet
5. Teklif kabul edildiğinde taşıyıcı atanır

**Beklenen Sonuç:**
- İlanlar listelenir
- Teklifler görüntülenir
- Teklif kabul/red işlemleri çalışır

#### Senaryo 3.4: Rota Optimizasyonu
**Adımlar:**
1. Rota Planlayıcı sayfasına git
2. Birden fazla gönderi seç
3. Optimizasyon algoritmasını çalıştır
4. Optimize edilmiş rotayı görüntüle
5. Rotayı uygula

**Beklenen Sonuç:**
- Rota optimize edilir
- Yakıt ve zaman tasarrufu hesaplanır
- Rotayı haritada görüntüle

#### Senaryo 3.5: Cüzdan ve Ödemeler
**Adımlar:**
1. Cüzdan sayfasına git
2. Bakiye görüntüle
3. Gelir/gider geçmişini incele
4. Para çekme işlemi yap (opsiyonel)

**Beklenen Sonuç:**
- Bakiye doğru gösterilir
- İşlem geçmişi listelenir
- Para çekme işlemi çalışır

---

### 4. Taşıyıcı Senaryoları

#### Senaryo 4.1: İş Pazarından İş Bulma
**Adımlar:**
1. Taşıyıcı olarak giriş yap
2. İş Pazarı sayfasına git
3. Açık ilanları görüntüle
4. Bir ilan seç ve detayları incele
5. Teklif ver:
   - Fiyat belirle
   - Mesaj ekle
   - Teslimat süresi belirt
6. Teklifi gönder

**Beklenen Sonuç:**
- Açık ilanlar listelenir
- Teklif başarıyla gönderilir
- Nakliyeci teklifi görür

#### Senaryo 4.2: Tekliflerim ve Durum Takibi
**Adımlar:**
1. Tekliflerim sayfasına git
2. Gönderdiğin teklifleri görüntüle
3. Bekleyen teklifleri kontrol et
4. Kabul edilen teklifleri görüntüle
5. Aktif işlere geç

**Beklenen Sonuç:**
- Teklifler durumlarına göre listelenir
- Kabul/red durumları görüntülenir

#### Senaryo 4.3: Aktif İşler ve Teslimat
**Adımlar:**
1. Aktif İşler sayfasına git
2. Atanan gönderileri görüntüle
3. Bir gönderi seç
4. Gönderiyi almaya başla
5. Konum güncellemeleri yap
6. Teslimatı tamamla

**Beklenen Sonuç:**
- Aktif işler listelenir
- Konum güncellemeleri kaydedilir
- Teslimat tamamlandığında durum güncellenir

#### Senaryo 4.4: Tamamlanan İşler ve Kazanç
**Adımlar:**
1. Tamamlanan İşler sayfasına git
2. Geçmiş teslimatları görüntüle
3. Toplam kazancı görüntüle
4. Aylık/haftalık istatistikleri incele

**Beklenen Sonuç:**
- Tamamlanan işler listelenir
- Kazanç bilgileri doğru gösterilir
- İstatistikler hesaplanır

---

## 🔄 Entegrasyon Senaryoları

### Senaryo 5.1: Tam Gönderi Döngüsü
**Akış:**
1. **Bireysel Gönderici:** Gönderi oluştur
2. **Nakliyeci:** Gönderiyi görür, teklif verir
3. **Bireysel Gönderici:** Teklifi kabul eder
4. **Nakliyeci:** Gönderiyi alır, taşıyıcıya atar
5. **Taşıyıcı:** İlanı görür, teklif verir
6. **Nakliyeci:** Teklifi kabul eder
7. **Taşıyıcı:** Gönderiyi alır, taşır, teslim eder
8. **Bireysel Gönderici:** Teslimatı onaylar
9. **Nakliyeci:** Ödeme alır
10. **Taşıyıcı:** Ödeme alır

**Beklenen Sonuç:**
- Tüm adımlar sorunsuz çalışır
- Bildirimler gönderilir
- Ödemeler doğru hesaplanır

### Senaryo 5.2: Kurumsal Toplu Gönderi
**Akış:**
1. **Kurumsal Gönderici:** Birden fazla gönderi oluşturur
2. **Nakliyeci:** Toplu gönderileri görür
3. **Nakliyeci:** Rota optimizasyonu yapar
4. **Nakliyeci:** Taşıyıcılara atar
5. **Taşıyıcılar:** Gönderileri teslim eder
6. **Kurumsal Gönderici:** Rapor indirir

**Beklenen Sonuç:**
- Toplu işlemler çalışır
- Rota optimizasyonu doğru çalışır
- Raporlar oluşturulur

---

## ✅ Doğrulama Kontrolleri

### Her Senaryo İçin Kontrol Edilecekler:
- [ ] API çağrıları başarılı
- [ ] Veriler doğru görüntüleniyor
- [ ] Bildirimler gönderiliyor
- [ ] Durum güncellemeleri çalışıyor
- [ ] Ödemeler doğru hesaplanıyor
- [ ] Hata durumları ele alınıyor
- [ ] Responsive tasarım çalışıyor
- [ ] Form validasyonları çalışıyor

---

## 🐛 Hata Senaryoları

### Senaryo 6.1: Ağ Hatası
- Backend'e bağlanılamazsa
- Hata mesajı gösterilmeli
- Kullanıcı bilgilendirilmeli
- Yeniden deneme mekanizması olmalı

### Senaryo 6.2: Yetkisiz Erişim
- Token süresi dolmuşsa
- Otomatik logout yapılmalı
- Login sayfasına yönlendirilmeli

### Senaryo 6.3: Eksik Veri
- Zorunlu alanlar boşsa
- Form gönderilmemeli
- Hata mesajları gösterilmeli

---

## 📊 Performans Senaryoları

### Senaryo 7.1: Yüksek Veri Yükleme
- 100+ gönderi listeleme
- Sayfalama çalışmalı
- Filtreleme hızlı olmalı

### Senaryo 7.2: Eşzamanlı İşlemler
- Birden fazla kullanıcı aynı gönderiye teklif verirse
- Çakışma yönetimi çalışmalı
- Real-time güncellemeler olmalı

---

## 📝 Notlar

- Tüm senaryolar gerçek backend API'leri ile test edilmelidir
- Mock data kullanılmamalıdır
- Her senaryo farklı kullanıcı hesapları ile test edilmelidir
- Test verileri production verilerinden ayrı tutulmalıdır

