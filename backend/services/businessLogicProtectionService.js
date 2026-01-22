class BusinessLogicProtectionService {
  constructor() {
    this.priceValidationRules = {
      // Minimum ve maksimum fiyat limitleri
      limits: {
        minPrice: 10, // Minimum 10 TL
        maxPrice: 1000000, // Maximum 1M TL
        maxPriceMultiplier: 5, // Piyasa ortalamasının maksimum 5x'i
      },

      // Anormal fiyat paternleri
      suspiciousPatterns: {
        roundNumbers: {
          patterns: [/^\d+00$/, /^\d+000$/], // 100, 1000, 10000 etc.
          threshold: 1000, // 1000 TL üstü için geçerli
          severity: 'medium'
        },
        repeatingDigits: {
          pattern: /(\d)\1{2,}/, // 111, 222, 9999 etc.
          severity: 'medium'
        },
        sequentialNumbers: {
          pattern: /123|234|345|456|567|678|789|987|876|765|654|543|432|321/,
          severity: 'high'
        }
      },

      // Piyasa karşılaştırma
      marketComparison: {
        enabled: true,
        minSamples: 3, // Karşılaştırma için minimum örnek sayısı
        deviationThreshold: 3.0, // Standart sapmanın 3x'i
        updateInterval: 24 * 60 * 60 * 1000 // 24 saat
      }
    };

    this.offerValidationRules = {
      // Teklif sıklığı limitleri
      frequencyLimits: {
        maxOffersPerHour: 10,
        maxOffersPerDay: 50,
        maxOffersPerShipment: 5,
        cooldownMinutes: 5 // Teklifler arası minimum süre
      },

      // Tekrarlayan teklif kontrolü
      duplicateDetection: {
        enabled: true,
        similarityThreshold: 0.95, // %95 benzerlik
        timeWindow: 24 * 60 * 60 * 1000, // 24 saat
        maxDuplicates: 3
      },

      // Şüpheli davranış paternleri
      suspiciousBehaviors: {
        priceUndercutting: {
          threshold: 0.5, // Piyasa fiyatının %50'sinden düşük
          severity: 'high'
        },
        rapidOfferCancellation: {
          threshold: 3, // 3+ iptal saatte
          timeWindow: 60 * 60 * 1000, // 1 saat
          severity: 'medium'
        },
        massOfferCreation: {
          threshold: 10, // 10+ teklif farklı gönderilere
          timeWindow: 60 * 60 * 1000, // 1 saat
          severity: 'high'
        }
      }
    };

    this.shipmentValidationRules = {
      // Gönderi oluşturma limitleri
      creationLimits: {
        maxShipmentsPerHour: 5,
        maxShipmentsPerDay: 20,
        maxActiveShipments: 10
      },

      // Şüpheli gönderi paternleri
      suspiciousShipmentPatterns: {
        identicalAddresses: {
          severity: 'high',
          description: 'Pickup and delivery addresses are identical'
        },
        unrealisticDistances: {
          maxDistance: 2000, // 2000 km max
          severity: 'medium'
        },
        unrealisticWeights: {
          maxWeight: 25000, // 25 ton max
          minWeight: 1, // 1 kg min
          severity: 'medium'
        },
        frequentCancellations: {
          threshold: 3,
          timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 gün
          severity: 'high'
        }
      }
    };
  }

  /**
   * Fiyat manipülasyon kontrolü
   */
  async validateOfferPrice(offerData, context = {}) {
    const { price, shipmentId, carrierId, carrierType } = offerData;
    const validationResults = {
      isValid: true,
      riskScore: 0,
      warnings: [],
      blocks: [],
      recommendations: []
    };

    // Temel fiyat validasyonları
    const basicValidation = this.validateBasicPriceRules(price);
    validationResults.warnings.push(...basicValidation.warnings);
    validationResults.blocks.push(...basicValidation.blocks);
    validationResults.riskScore += basicValidation.riskScore;

    // Anormal fiyat paternleri kontrolü
    const patternValidation = this.detectSuspiciousPricePatterns(price);
    validationResults.warnings.push(...patternValidation.warnings);
    validationResults.blocks.push(...patternValidation.blocks);
    validationResults.riskScore += patternValidation.riskScore;

    // Piyasa karşılaştırma
    if (context.enableMarketComparison !== false) {
      const marketValidation = await this.validateAgainstMarketRates(price, shipmentId, carrierType);
      validationResults.warnings.push(...marketValidation.warnings);
      validationResults.blocks.push(...marketValidation.blocks);
      validationResults.riskScore += marketValidation.riskScore;
    }

    // Carrier-specific validations
    const carrierValidation = await this.validateCarrierPricing(carrierId, price, context);
    validationResults.warnings.push(...carrierValidation.warnings);
    validationResults.blocks.push(...carrierValidation.blocks);
    validationResults.riskScore += carrierValidation.riskScore;

    // Final decision
    validationResults.isValid = validationResults.blocks.length === 0;
    validationResults.recommendations = this.generatePriceRecommendations(validationResults);

    return validationResults;
  }

  /**
   * Temel fiyat kuralları kontrolü
   */
  validateBasicPriceRules(price) {
    const results = {
      warnings: [],
      blocks: [],
      riskScore: 0
    };

    // Numeric validation
    if (!price || isNaN(price) || price <= 0) {
      results.blocks.push('Invalid price format');
      results.riskScore += 10;
      return results;
    }

    // Minimum price check
    if (price < this.priceValidationRules.limits.minPrice) {
      results.blocks.push(`Price too low (minimum: ${this.priceValidationRules.limits.minPrice} TL)`);
      results.riskScore += 8;
    }

    // Maximum price check
    if (price > this.priceValidationRules.limits.maxPrice) {
      results.blocks.push(`Price too high (maximum: ${this.priceValidationRules.limits.maxPrice} TL)`);
      results.riskScore += 6;
    }

    // Unrealistic prices
    if (price > 100000) {
      results.warnings.push('Unrealistically high price - manual review recommended');
      results.riskScore += 3;
    }

    return results;
  }

  /**
   * Şüpheli fiyat paternleri tespiti
   */
  detectSuspiciousPricePatterns(price) {
    const results = {
      warnings: [],
      blocks: [],
      riskScore: 0
    };

    const priceStr = price.toString();

    // Round number detection
    const roundNumberRules = this.priceValidationRules.suspiciousPatterns.roundNumbers;
    const isRoundNumber = roundNumberRules.patterns.some(pattern => pattern.test(priceStr));

    if (isRoundNumber && price >= roundNumberRules.threshold) {
      results.warnings.push('Round number pricing detected - potential manipulation');
      results.riskScore += this.getSeverityScore(roundNumberRules.severity);
    }

    // Repeating digits
    const repeatingRules = this.priceValidationRules.suspiciousPatterns.repeatingDigits;
    if (repeatingRules.pattern.test(priceStr)) {
      results.warnings.push('Repeating digit pattern detected');
      results.riskScore += this.getSeverityScore(repeatingRules.severity);
    }

    // Sequential numbers
    const sequentialRules = this.priceValidationRules.suspiciousPatterns.sequentialNumbers;
    if (sequentialRules.pattern.test(priceStr)) {
      results.warnings.push('Sequential number pattern detected - high manipulation risk');
      results.riskScore += this.getSeverityScore(sequentialRules.severity);
    }

    return results;
  }

  /**
   * Piyasa fiyatları ile karşılaştırma
   */
  async validateAgainstMarketRates(price, shipmentId, carrierType) {
    const results = {
      warnings: [],
      blocks: [],
      riskScore: 0
    };

    try {
      // Benzer gönderilerin ortalama fiyatını al
      const marketData = await this.getMarketPriceData(shipmentId, carrierType);

      if (marketData.samples >= this.priceValidationRules.marketComparison.minSamples) {
        const { average, standardDeviation } = marketData;

        // Standart sapma hesaplama
        const deviation = Math.abs(price - average) / standardDeviation;

        if (deviation > this.priceValidationRules.marketComparison.deviationThreshold) {
          const direction = price > average ? 'above' : 'below';
          results.warnings.push(`Price significantly ${direction} market average (${deviation.toFixed(1)}σ deviation)`);
          results.riskScore += deviation > 5 ? 5 : 3;
        }

        // Çok düşük fiyat kontrolü
        const minReasonablePrice = average * 0.3; // %30 altında
        if (price < minReasonablePrice) {
          results.warnings.push('Price significantly below market average - potential dumping');
          results.riskScore += 4;
        }

        // Çok yüksek fiyat kontrolü
        const maxReasonablePrice = average * this.priceValidationRules.limits.maxPriceMultiplier;
        if (price > maxReasonablePrice) {
          results.warnings.push('Price significantly above market average');
          results.riskScore += 2;
        }
      }

    } catch (error) {
      console.warn('Market price comparison failed:', error);
      // Market verisi alınamazsa hafif uyarı ver
      results.warnings.push('Market price comparison unavailable');
      results.riskScore += 1;
    }

    return results;
  }

  /**
   * Carrier-specific fiyat validasyonu
   */
  async validateCarrierPricing(carrierId, price, context) {
    const results = {
      warnings: [],
      blocks: [],
      riskScore: 0
    };

    try {
      // Carrier'ın geçmiş fiyatlarını kontrol et
      const carrierHistory = await this.getCarrierPricingHistory(carrierId);

      if (carrierHistory.averagePrice > 0) {
        const carrierAverage = carrierHistory.averagePrice;
        const deviation = Math.abs(price - carrierAverage) / carrierAverage;

        // Carrier'ın kendi ortalamasından çok sapma
        if (deviation > 2.0) {
          results.warnings.push(`Price deviates significantly from carrier's average (${(deviation * 100).toFixed(0)}% difference)`);
          results.riskScore += deviation > 3 ? 3 : 2;
        }
      }

      // Carrier'ın fiyat tutarlılığını kontrol et
      if (carrierHistory.consistency < 0.7) { // %70 altında tutarlılık
        results.warnings.push('Carrier has inconsistent pricing history');
        results.riskScore += 2;
      }

    } catch (error) {
      console.warn('Carrier pricing validation failed:', error);
    }

    return results;
  }

  /**
   * Teklif sıklığı ve davranış kontrolü
   */
  async validateOfferBehavior(offerData, context = {}) {
    const { carrierId, shipmentId, userId } = offerData;
    const validationResults = {
      isValid: true,
      riskScore: 0,
      warnings: [],
      blocks: [],
      recommendations: []
    };

    // Teklif sıklığı kontrolü
    const frequencyValidation = await this.validateOfferFrequency(carrierId, shipmentId);
    validationResults.warnings.push(...frequencyValidation.warnings);
    validationResults.blocks.push(...frequencyValidation.blocks);
    validationResults.riskScore += frequencyValidation.riskScore;

    // Tekrarlayan teklif kontrolü
    const duplicateValidation = await this.detectDuplicateOffers(offerData);
    validationResults.warnings.push(...duplicateValidation.warnings);
    validationResults.blocks.push(...duplicateValidation.blocks);
    validationResults.riskScore += duplicateValidation.riskScore;

    // Şüpheli davranış paternleri
    const behaviorValidation = await this.detectSuspiciousOfferBehaviors(carrierId, offerData);
    validationResults.warnings.push(...behaviorValidation.warnings);
    validationResults.blocks.push(...behaviorValidation.blocks);
    validationResults.riskScore += behaviorValidation.riskScore;

    validationResults.isValid = validationResults.blocks.length === 0;
    validationResults.recommendations = this.generateOfferRecommendations(validationResults);

    return validationResults;
  }

  /**
   * Teklif sıklığı validasyonu
   */
  async validateOfferFrequency(carrierId, shipmentId) {
    const results = {
      warnings: [],
      blocks: [],
      riskScore: 0
    };

    // Saatlik teklif limiti
    const hourlyOffers = await this.getCarrierOffersCount(carrierId, 60 * 60 * 1000);
    if (hourlyOffers >= this.offerValidationRules.frequencyLimits.maxOffersPerHour) {
      results.blocks.push(`Too many offers per hour (${hourlyOffers})`);
      results.riskScore += 5;
    }

    // Günlük teklif limiti
    const dailyOffers = await this.getCarrierOffersCount(carrierId, 24 * 60 * 60 * 1000);
    if (dailyOffers >= this.offerValidationRules.frequencyLimits.maxOffersPerDay) {
      results.blocks.push(`Too many offers per day (${dailyOffers})`);
      results.riskScore += 4;
    }

    // Gönderi başına teklif limiti
    const shipmentOffers = await this.getCarrierShipmentOffersCount(carrierId, shipmentId);
    if (shipmentOffers >= this.offerValidationRules.frequencyLimits.maxOffersPerShipment) {
      results.blocks.push(`Too many offers for this shipment (${shipmentOffers})`);
      results.riskScore += 3;
    }

    return results;
  }

  /**
   * Tekrarlayan teklif tespiti
   */
  async detectDuplicateOffers(offerData) {
    const results = {
      warnings: [],
      blocks: [],
      riskScore: 0
    };

    if (!this.offerValidationRules.duplicateDetection.enabled) {
      return results;
    }

    const recentOffers = await this.getCarrierRecentOffers(offerData.carrierId, this.offerValidationRules.duplicateDetection.timeWindow);
    const similarOffers = recentOffers.filter(offer =>
      this.calculateOfferSimilarity(offer, offerData) >= this.offerValidationRules.duplicateDetection.similarityThreshold
    );

    if (similarOffers.length >= this.offerValidationRules.duplicateDetection.maxDuplicates) {
      results.warnings.push(`Multiple similar offers detected (${similarOffers.length})`);
      results.riskScore += 3;
    }

    return results;
  }

  /**
   * Şüpheli teklif davranışları tespiti
   */
  async detectSuspiciousOfferBehaviors(carrierId, offerData) {
    const results = {
      warnings: [],
      blocks: [],
      riskScore: 0
    };

    // Price undercutting detection
    const marketPrice = await this.getMarketPriceForShipment(offerData.shipmentId);
    if (marketPrice && offerData.price < marketPrice * this.offerValidationRules.suspiciousBehaviors.priceUndercutting.threshold) {
      results.warnings.push('Significant price undercutting detected');
      results.riskScore += this.getSeverityScore(this.offerValidationRules.suspiciousBehaviors.priceUndercutting.severity);
    }

    // Rapid offer cancellation
    const recentCancellations = await this.getCarrierRecentCancellations(carrierId, this.offerValidationRules.suspiciousBehaviors.rapidOfferCancellation.timeWindow);
    if (recentCancellations >= this.offerValidationRules.suspiciousBehaviors.rapidOfferCancellation.threshold) {
      results.warnings.push('High rate of offer cancellations detected');
      results.riskScore += this.getSeverityScore(this.offerValidationRules.suspiciousBehaviors.rapidOfferCancellation.severity);
    }

    // Mass offer creation
    const recentMassOffers = await this.getCarrierRecentMassOffers(carrierId, this.offerValidationRules.suspiciousBehaviors.massOfferCreation.timeWindow);
    if (recentMassOffers >= this.offerValidationRules.suspiciousBehaviors.massOfferCreation.threshold) {
      results.warnings.push('Mass offer creation detected');
      results.riskScore += this.getSeverityScore(this.offerValidationRules.suspiciousBehaviors.massOfferCreation.severity);
    }

    return results;
  }

  /**
   * Gönderi validasyonu
   */
  async validateShipmentCreation(shipmentData, userId) {
    const validationResults = {
      isValid: true,
      riskScore: 0,
      warnings: [],
      blocks: [],
      recommendations: []
    };

    // Oluşturma sıklığı kontrolü
    const frequencyValidation = await this.validateShipmentCreationFrequency(userId);
    validationResults.warnings.push(...frequencyValidation.warnings);
    validationResults.blocks.push(...frequencyValidation.blocks);
    validationResults.riskScore += frequencyValidation.riskScore;

    // Şüpheli gönderi paternleri
    const patternValidation = this.detectSuspiciousShipmentPatterns(shipmentData);
    validationResults.warnings.push(...patternValidation.warnings);
    validationResults.blocks.push(...patternValidation.blocks);
    validationResults.riskScore += patternValidation.riskScore;

    // Business rule violations
    const businessValidation = await this.validateShipmentBusinessRules(shipmentData, userId);
    validationResults.warnings.push(...businessValidation.warnings);
    validationResults.blocks.push(...businessValidation.blocks);
    validationResults.riskScore += businessValidation.riskScore;

    validationResults.isValid = validationResults.blocks.length === 0;
    validationResults.recommendations = this.generateShipmentRecommendations(validationResults);

    return validationResults;
  }

  /**
   * Yardımcı fonksiyonlar
   */
  getSeverityScore(severity) {
    const scores = { low: 1, medium: 3, high: 5, critical: 10 };
    return scores[severity] || 1;
  }

  generatePriceRecommendations(validation) {
    const recommendations = [];

    if (validation.riskScore >= 10) {
      recommendations.push('PRICE_BLOCKED', 'MANUAL_REVIEW_REQUIRED');
    } else if (validation.riskScore >= 5) {
      recommendations.push('PRICE_FLAGGED', 'CARRIER_NOTIFICATION');
    }

    if (validation.warnings.some(w => w.includes('market'))) {
      recommendations.push('SUGGEST_MARKET_PRICE');
    }

    return recommendations;
  }

  generateOfferRecommendations(validation) {
    const recommendations = [];

    if (validation.blocks.some(b => b.includes('frequency'))) {
      recommendations.push('REDUCE_OFFER_FREQUENCY', 'TEMPORARY_OFFER_BLOCK');
    }

    if (validation.warnings.some(w => w.includes('duplicate'))) {
      recommendations.push('AVOID_DUPLICATE_OFFERS');
    }

    return recommendations;
  }

  generateShipmentRecommendations(validation) {
    const recommendations = [];

    if (validation.blocks.some(b => b.includes('frequency'))) {
      recommendations.push('REDUCE_SHIPMENT_CREATION_RATE');
    }

    if (validation.warnings.some(w => w.includes('distance'))) {
      recommendations.push('VERIFY_DISTANCE_ACCURACY');
    }

    return recommendations;
  }

  // Mock implementations - gerçek uygulamada database sorguları yapılacak
  async getMarketPriceData(shipmentId, carrierType) {
    return { average: 500, standardDeviation: 150, samples: 10 };
  }

  async getCarrierPricingHistory(carrierId) {
    return { averagePrice: 450, consistency: 0.85 };
  }

  async getCarrierOffersCount(carrierId, timeWindow) {
    return Math.floor(Math.random() * 5); // Mock
  }

  async getCarrierShipmentOffersCount(carrierId, shipmentId) {
    return Math.floor(Math.random() * 3); // Mock
  }

  async getCarrierRecentOffers(carrierId, timeWindow) {
    return []; // Mock
  }

  calculateOfferSimilarity(offer1, offer2) {
    return 0.5; // Mock similarity calculation
  }

  async getMarketPriceForShipment(shipmentId) {
    return 600; // Mock
  }

  async getCarrierRecentCancellations(carrierId, timeWindow) {
    return Math.floor(Math.random() * 2); // Mock
  }

  async getCarrierRecentMassOffers(carrierId, timeWindow) {
    return Math.floor(Math.random() * 3); // Mock
  }

  async validateShipmentCreationFrequency(userId) {
    return { warnings: [], blocks: [], riskScore: 0 };
  }

  detectSuspiciousShipmentPatterns(shipmentData) {
    return { warnings: [], blocks: [], riskScore: 0 };
  }

  async validateShipmentBusinessRules(shipmentData, userId) {
    return { warnings: [], blocks: [], riskScore: 0 };
  }
}

module.exports = new BusinessLogicProtectionService();
