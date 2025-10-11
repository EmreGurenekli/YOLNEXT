const { db } = require('../database/init');
const cacheService = require('./cache-service');
const loggerService = require('./logger-service');

class SmartMatchingService {
  constructor() {
    this.weights = {
      location: 0.3,
      capacity: 0.25,
      price: 0.2,
      rating: 0.15,
      availability: 0.1
    };
  }

  // Gönderi için en iyi nakliyecileri bul
  async findBestCarriers(shipmentId, limit = 10) {
    try {
      const startTime = Date.now();
      
      // Gönderi bilgilerini al
      const shipment = await this.getShipment(shipmentId);
      if (!shipment) {
        throw new Error('Gönderi bulunamadı');
      }

      // Cache kontrolü
      const cacheKey = `best_carriers:${shipmentId}`;
      const cached = await cacheService.getCachedShipments({ shipmentId });
      if (cached) {
        loggerService.logCache('get', cacheKey, true, Date.now() - startTime);
        return cached;
      }

      // Nakliyecileri bul
      const carriers = await this.searchCarriers(shipment);
      
      // Skorlama yap
      const scoredCarriers = await this.scoreCarriers(carriers, shipment);
      
      // Sırala ve limit uygula
      const bestCarriers = scoredCarriers
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache'e kaydet
      await cacheService.setCachedShipments({ shipmentId }, bestCarriers, 300);

      const duration = Date.now() - startTime;
      loggerService.logPerformance('findBestCarriers', duration, {
        shipmentId,
        carriersFound: bestCarriers.length
      });

      return bestCarriers;

    } catch (error) {
      loggerService.error('Smart matching error', error);
      throw error;
    }
  }

  // Gönderi bilgilerini al
  async getShipment(shipmentId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT s.*, u.first_name, u.last_name, u.company_name, u.avatar_url
        FROM shipments s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.status = 'active'
      `, [shipmentId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Nakliyecileri ara
  async searchCarriers(shipment) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT u.*, v.plate_number, v.vehicle_type, v.max_weight_kg, v.max_volume_m3,
               v.is_available, v.current_location_lat, v.current_location_lng,
               COALESCE(AVG(r.rating), 0) as avg_rating,
               COUNT(r.id) as total_reviews,
               COUNT(o.id) as total_offers,
               COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) as accepted_offers
        FROM users u
        LEFT JOIN vehicles v ON u.id = v.owner_id
        LEFT JOIN reviews r ON u.id = r.reviewed_id
        LEFT JOIN offers o ON u.id = o.carrier_id
        WHERE u.user_type = 'carrier' 
          AND u.is_active = 1
          AND (v.is_available = 1 OR v.is_available IS NULL)
          AND (v.max_weight_kg >= ? OR v.max_weight_kg IS NULL)
          AND (v.max_volume_m3 >= ? OR v.max_volume_m3 IS NULL)
        GROUP BY u.id
        HAVING total_reviews = 0 OR avg_rating >= 3.0
      `, [shipment.weight_kg || 0, shipment.volume_m3 || 0], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Nakliyecileri skorla
  async scoreCarriers(carriers, shipment) {
    const scoredCarriers = [];

    for (const carrier of carriers) {
      const score = await this.calculateScore(carrier, shipment);
      scoredCarriers.push({
        ...carrier,
        score,
        matchReasons: this.getMatchReasons(carrier, shipment, score)
      });
    }

    return scoredCarriers;
  }

  // Skor hesapla
  async calculateScore(carrier, shipment) {
    let totalScore = 0;

    // Lokasyon skoru (0-1)
    const locationScore = this.calculateLocationScore(carrier, shipment);
    totalScore += locationScore * this.weights.location;

    // Kapasite skoru (0-1)
    const capacityScore = this.calculateCapacityScore(carrier, shipment);
    totalScore += capacityScore * this.weights.capacity;

    // Fiyat skoru (0-1)
    const priceScore = await this.calculatePriceScore(carrier, shipment);
    totalScore += priceScore * this.weights.price;

    // Rating skoru (0-1)
    const ratingScore = this.calculateRatingScore(carrier);
    totalScore += ratingScore * this.weights.rating;

    // Müsaitlik skoru (0-1)
    const availabilityScore = this.calculateAvailabilityScore(carrier, shipment);
    totalScore += availabilityScore * this.weights.availability;

    return Math.min(1, Math.max(0, totalScore));
  }

  // Lokasyon skoru hesapla
  calculateLocationScore(carrier, shipment) {
    if (!carrier.current_location_lat || !carrier.current_location_lng) {
      return 0.5; // Lokasyon bilgisi yoksa orta skor
    }

    // Basit mesafe hesaplama (gerçek uygulamada Haversine formülü kullanılmalı)
    const distance = this.calculateDistance(
      carrier.current_location_lat,
      carrier.current_location_lng,
      shipment.pickup_latitude || 0,
      shipment.pickup_longitude || 0
    );

    // Mesafeye göre skor (0-100km arası ideal)
    if (distance <= 10) return 1.0;
    if (distance <= 50) return 0.8;
    if (distance <= 100) return 0.6;
    if (distance <= 200) return 0.4;
    return 0.2;
  }

  // Kapasite skoru hesapla
  calculateCapacityScore(carrier, shipment) {
    if (!carrier.max_weight_kg || !shipment.weight_kg) {
      return 0.5;
    }

    const weightRatio = shipment.weight_kg / carrier.max_weight_kg;
    
    // %80-100 arası ideal
    if (weightRatio >= 0.8 && weightRatio <= 1.0) return 1.0;
    if (weightRatio >= 0.6 && weightRatio < 0.8) return 0.8;
    if (weightRatio >= 0.4 && weightRatio < 0.6) return 0.6;
    if (weightRatio < 0.4) return 0.4;
    return 0.2; // Aşırı yük
  }

  // Fiyat skoru hesapla
  async calculatePriceScore(carrier, shipment) {
    try {
      // Geçmiş tekliflerden ortalama fiyat hesapla
      const avgPrice = await this.getAveragePrice(carrier.id, shipment);
      
      if (!avgPrice || !shipment.budget_max) {
        return 0.5;
      }

      const priceRatio = avgPrice / shipment.budget_max;
      
      // Bütçenin %70-90'ı arası ideal
      if (priceRatio >= 0.7 && priceRatio <= 0.9) return 1.0;
      if (priceRatio >= 0.5 && priceRatio < 0.7) return 0.8;
      if (priceRatio >= 0.9 && priceRatio <= 1.1) return 0.6;
      if (priceRatio < 0.5) return 0.4;
      return 0.2; // Bütçeyi aşan
    } catch (error) {
      loggerService.error('Price score calculation error', error);
      return 0.5;
    }
  }

  // Rating skoru hesapla
  calculateRatingScore(carrier) {
    const rating = carrier.avg_rating || 0;
    const totalReviews = carrier.total_reviews || 0;

    // Yeterli review yoksa orta skor
    if (totalReviews < 3) return 0.5;

    // Rating'e göre skor
    if (rating >= 4.5) return 1.0;
    if (rating >= 4.0) return 0.8;
    if (rating >= 3.5) return 0.6;
    if (rating >= 3.0) return 0.4;
    return 0.2;
  }

  // Müsaitlik skoru hesapla
  calculateAvailabilityScore(carrier, shipment) {
    if (!carrier.is_available) return 0;

    // Gönderi tarihi ile uyumluluk kontrolü
    const pickupDate = new Date(shipment.pickup_date);
    const today = new Date();
    const daysDiff = Math.ceil((pickupDate - today) / (1000 * 60 * 60 * 24));

    // 1-7 gün arası ideal
    if (daysDiff >= 1 && daysDiff <= 7) return 1.0;
    if (daysDiff >= 0 && daysDiff < 1) return 0.8;
    if (daysDiff > 7 && daysDiff <= 14) return 0.6;
    if (daysDiff > 14) return 0.4;
    return 0.2;
  }

  // Ortalama fiyat hesapla
  async getAveragePrice(carrierId, shipment) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT AVG(o.price) as avg_price
        FROM offers o
        JOIN shipments s ON o.shipment_id = s.id
        WHERE o.carrier_id = ?
          AND s.category = ?
          AND s.pickup_city = ?
          AND s.delivery_city = ?
          AND o.status = 'accepted'
          AND o.created_at >= datetime('now', '-30 days')
      `, [
        carrierId,
        shipment.category,
        shipment.pickup_city,
        shipment.delivery_city
      ], (err, row) => {
        if (err) reject(err);
        else resolve(row?.avg_price || null);
      });
    });
  }

  // Mesafe hesapla (basit versiyon)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }

  // Eşleşme nedenlerini al
  getMatchReasons(carrier, shipment, score) {
    const reasons = [];

    if (score >= 0.8) {
      reasons.push('Mükemmel eşleşme');
    } else if (score >= 0.6) {
      reasons.push('İyi eşleşme');
    } else if (score >= 0.4) {
      reasons.push('Orta eşleşme');
    }

    // Spesifik nedenler
    if (carrier.avg_rating >= 4.5) {
      reasons.push('Yüksek değerlendirme');
    }

    if (carrier.total_offers > 10) {
      reasons.push('Deneyimli nakliyeci');
    }

    if (carrier.accepted_offers / Math.max(carrier.total_offers, 1) >= 0.8) {
      reasons.push('Yüksek kabul oranı');
    }

    return reasons;
  }

  // Fiyat önerisi
  async suggestPrice(shipment) {
    try {
      const similarShipments = await this.findSimilarShipments(shipment);
      
      if (similarShipments.length === 0) {
        return this.getDefaultPrice(shipment);
      }

      const avgPrice = similarShipments.reduce((sum, s) => sum + s.price, 0) / similarShipments.length;
      const marketFactor = this.getMarketFactor(shipment);
      
      return Math.round(avgPrice * marketFactor);
    } catch (error) {
      loggerService.error('Price suggestion error', error);
      return this.getDefaultPrice(shipment);
    }
  }

  // Benzer gönderileri bul
  async findSimilarShipments(shipment) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT o.price, s.weight_kg, s.volume_m3, s.pickup_city, s.delivery_city
        FROM offers o
        JOIN shipments s ON o.shipment_id = s.id
        WHERE s.category = ?
          AND s.pickup_city = ?
          AND s.delivery_city = ?
          AND o.status = 'accepted'
          AND o.created_at >= datetime('now', '-90 days')
          AND ABS(s.weight_kg - ?) <= ?
        ORDER BY o.created_at DESC
        LIMIT 20
      `, [
        shipment.category,
        shipment.pickup_city,
        shipment.delivery_city,
        shipment.weight_kg || 0,
        (shipment.weight_kg || 0) * 0.2 // %20 tolerans
      ], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Varsayılan fiyat
  getDefaultPrice(shipment) {
    const basePrice = 100; // Temel fiyat
    const weightFactor = (shipment.weight_kg || 1) * 2;
    const distanceFactor = this.estimateDistance(shipment) * 0.5;
    
    return Math.round(basePrice + weightFactor + distanceFactor);
  }

  // Mesafe tahmini
  estimateDistance(shipment) {
    // Basit mesafe tahmini (gerçek uygulamada harita API kullanılmalı)
    const cityDistances = {
      'İstanbul-Ankara': 450,
      'İstanbul-İzmir': 350,
      'Ankara-İzmir': 550,
      'İstanbul-Bursa': 150,
      'İstanbul-Antalya': 500
    };

    const key = `${shipment.pickup_city}-${shipment.delivery_city}`;
    return cityDistances[key] || 200; // Varsayılan 200km
  }

  // Piyasa faktörü
  getMarketFactor(shipment) {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    let factor = 1.0;
    
    // Hafta sonu %20 artış
    if (day === 0 || day === 6) {
      factor += 0.2;
    }
    
    // Akşam saatleri %10 artış
    if (hour >= 18 || hour <= 6) {
      factor += 0.1;
    }
    
    // Tatil günleri kontrolü (basit)
    const month = new Date().getMonth();
    if (month === 6 || month === 7) { // Yaz ayları
      factor += 0.15;
    }
    
    return Math.min(1.5, Math.max(0.5, factor));
  }

  // Cache temizleme
  async clearCache() {
    await cacheService.delPattern('best_carriers:*');
    loggerService.info('Smart matching cache cleared');
  }
}

module.exports = new SmartMatchingService();



