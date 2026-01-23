const crypto = require('crypto');

class FraudDetectionService {
  constructor() {
    this.fraudPatterns = {
      // IP-based patterns
      ipPatterns: {
        multipleAccountsFromSameIP: {
          threshold: 3,
          timeWindow: 24 * 60 * 60 * 1000, // 24 hours
          severity: 'medium'
        },
        vpnTorDetection: {
          patterns: [
            /^10\./,    // Private IP ranges
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private IP ranges
            /^192\.168\./, // Private IP ranges
            /^127\./,   // Localhost
            // Known VPN/Tor exit nodes would be in a database
          ],
          severity: 'low'
        }
      },

      // User behavior patterns
      behaviorPatterns: {
        rapidAccountCreation: {
          threshold: 5,
          timeWindow: 60 * 60 * 1000, // 1 hour
          severity: 'high'
        },
        rapidPasswordChanges: {
          threshold: 3,
          timeWindow: 24 * 60 * 60 * 1000, // 24 hours
          severity: 'medium'
        },
        unusualLoginTimes: {
          allowedHours: [6, 23], // 06:00 - 23:00
          severity: 'low'
        },
        unusualLoginLocations: {
          maxDistanceKm: 1000, // Max distance between logins
          severity: 'medium'
        }
      },

      // Transaction patterns
      transactionPatterns: {
        largeAmountTransactions: {
          threshold: 50000, // 50k TL
          severity: 'high'
        },
        rapidSuccessiveTransactions: {
          threshold: 5,
          timeWindow: 60 * 60 * 1000, // 1 hour
          severity: 'high'
        },
        roundNumberTransactions: {
          patterns: [/^\d+00$/, /^\d+000$/], // 100, 1000, 10000 etc.
          threshold: 1000, // Over 1000 TL
          severity: 'medium'
        },
        internationalCardUsage: {
          domesticCountry: 'TR',
          severity: 'low'
        }
      },

      // Content patterns
      contentPatterns: {
        spamIndicators: {
          patterns: [
            /\b(?:bitcoin|crypto|investment)\b/gi,
            /\b(?:earn money|make money|free money)\b/gi,
            /\b(?:lottery|casino|gambling)\b/gi,
            /\b(?:drugs|cocaine|heroin)\b/gi
          ],
          severity: 'medium'
        },
        phishingIndicators: {
          patterns: [
            /\b(?:password|login|account)\b.*\b(?:reset|change|update)\b/gi,
            /\b(?:click here|verify now|confirm account)\b/gi,
            /\b(?:bank|credit card|payment)\b.*\b(?:information|details)\b/gi
          ],
          severity: 'high'
        }
      }
    };

    this.riskScoring = {
      low: 1,
      medium: 3,
      high: 5,
      critical: 10
    };

    this.maxRiskScore = 20; // Threshold for blocking
  }

  /**
   * Fraud risk skorunu hesapla
   */
  async calculateRiskScore(userId, activity, context = {}) {
    let totalScore = 0;
    const riskFactors = [];

    // IP-based checks
    if (context.ipAddress) {
      const ipRisk = await this.checkIPAddressRisk(context.ipAddress, userId);
      totalScore += ipRisk.score;
      riskFactors.push(...ipRisk.factors);
    }

    // User behavior checks
    if (activity.type) {
      const behaviorRisk = await this.checkUserBehaviorRisk(userId, activity);
      totalScore += behaviorRisk.score;
      riskFactors.push(...behaviorRisk.factors);
    }

    // Transaction checks
    if (activity.type === 'payment' || activity.type === 'transaction') {
      const transactionRisk = await this.checkTransactionRisk(activity, context);
      totalScore += transactionRisk.score;
      riskFactors.push(...transactionRisk.factors);
    }

    // Content checks
    if (activity.content) {
      const contentRisk = await this.checkContentRisk(activity.content);
      totalScore += contentRisk.score;
      riskFactors.push(...contentRisk.factors);
    }

    // Velocity checks (rate of activities)
    const velocityRisk = await this.checkVelocityRisk(userId, activity);
    totalScore += velocityRisk.score;
    riskFactors.push(...velocityRisk.factors);

    // Device fingerprinting
    if (context.deviceFingerprint) {
      const deviceRisk = await this.checkDeviceRisk(userId, context.deviceFingerprint);
      totalScore += deviceRisk.score;
      riskFactors.push(...deviceRisk.factors);
    }

    // Risk level determination
    const riskLevel = this.determineRiskLevel(totalScore);
    const shouldBlock = totalScore >= this.maxRiskScore;

    return {
      userId,
      totalScore,
      riskLevel,
      shouldBlock,
      riskFactors,
      recommendation: this.generateRecommendation(totalScore, riskFactors),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * IP address risk kontrolü
   */
  async checkIPAddressRisk(ipAddress, userId) {
    let score = 0;
    const factors = [];

    // Multiple accounts from same IP
    const accountsFromIP = await this.getAccountsFromIPAddress(ipAddress);
    if (accountsFromIP.length > this.fraudPatterns.ipPatterns.multipleAccountsFromSameIP.threshold) {
      const riskScore = this.riskScoring[this.fraudPatterns.ipPatterns.multipleAccountsFromSameIP.severity];
      score += riskScore;
      factors.push({
        type: 'multiple_accounts_same_ip',
        severity: this.fraudPatterns.ipPatterns.multipleAccountsFromSameIP.severity,
        score: riskScore,
        description: `${accountsFromIP.length} accounts from same IP address`
      });
    }

    // VPN/Tor detection
    if (this.isVPNOrTorIP(ipAddress)) {
      const riskScore = this.riskScoring[this.fraudPatterns.ipPatterns.vpnTorDetection.severity];
      score += riskScore;
      factors.push({
        type: 'vpn_tor_ip',
        severity: this.fraudPatterns.ipPatterns.vpnTorDetection.severity,
        score: riskScore,
        description: 'IP address associated with VPN/Tor usage'
      });
    }

    // Geolocation consistency check
    if (userId) {
      const geoRisk = await this.checkGeoLocationRisk(ipAddress, userId);
      score += geoRisk.score;
      factors.push(...geoRisk.factors);
    }

    return { score, factors };
  }

  /**
   * User behavior risk kontrolü
   */
  async checkUserBehaviorRisk(userId, activity) {
    let score = 0;
    const factors = [];

    // Rapid account creation
    if (activity.type === 'account_creation') {
      const recentCreations = await this.getRecentAccountCreations(userId);
      const threshold = this.fraudPatterns.behaviorPatterns.rapidAccountCreation.threshold;
      const timeWindow = this.fraudPatterns.behaviorPatterns.rapidAccountCreation.timeWindow;

      if (recentCreations.length >= threshold) {
        const riskScore = this.riskScoring[this.fraudPatterns.behaviorPatterns.rapidAccountCreation.severity];
        score += riskScore;
        factors.push({
          type: 'rapid_account_creation',
          severity: this.fraudPatterns.behaviorPatterns.rapidAccountCreation.severity,
          score: riskScore,
          description: `${recentCreations.length} accounts created in ${timeWindow / (60 * 60 * 1000)} hours`
        });
      }
    }

    // Rapid password changes
    if (activity.type === 'password_change') {
      const recentChanges = await this.getRecentPasswordChanges(userId);
      const threshold = this.fraudPatterns.behaviorPatterns.rapidPasswordChanges.threshold;

      if (recentChanges.length >= threshold) {
        const riskScore = this.riskScoring[this.fraudPatterns.behaviorPatterns.rapidPasswordChanges.severity];
        score += riskScore;
        factors.push({
          type: 'rapid_password_changes',
          severity: this.fraudPatterns.behaviorPatterns.rapidPasswordChanges.severity,
          score: riskScore,
          description: `${recentChanges.length} password changes in 24 hours`
        });
      }
    }

    // Unusual login times
    if (activity.type === 'login') {
      const loginHour = new Date(activity.timestamp).getHours();
      const [startHour, endHour] = this.fraudPatterns.behaviorPatterns.unusualLoginTimes.allowedHours;

      if (loginHour < startHour || loginHour > endHour) {
        const riskScore = this.riskScoring[this.fraudPatterns.behaviorPatterns.unusualLoginTimes.severity];
        score += riskScore;
        factors.push({
          type: 'unusual_login_time',
          severity: this.fraudPatterns.behaviorPatterns.unusualLoginTimes.severity,
          score: riskScore,
          description: `Login at unusual hour: ${loginHour}:00`
        });
      }
    }

    return { score, factors };
  }

  /**
   * Transaction risk kontrolü
   */
  async checkTransactionRisk(transaction, context) {
    let score = 0;
    const factors = [];

    const amount = parseFloat(transaction.amount || 0);

    // Large amount transactions
    if (amount >= this.fraudPatterns.transactionPatterns.largeAmountTransactions.threshold) {
      const riskScore = this.riskScoring[this.fraudPatterns.transactionPatterns.largeAmountTransactions.severity];
      score += riskScore;
      factors.push({
        type: 'large_transaction_amount',
        severity: this.fraudPatterns.transactionPatterns.largeAmountTransactions.severity,
        score: riskScore,
        description: `Large transaction amount: ${amount} TL`
      });
    }

    // Rapid successive transactions
    const recentTransactions = await this.getRecentTransactions(context.userId || transaction.userId);
    const threshold = this.fraudPatterns.transactionPatterns.rapidSuccessiveTransactions.threshold;
    const timeWindow = this.fraudPatterns.transactionPatterns.rapidSuccessiveTransactions.timeWindow;

    if (recentTransactions.length >= threshold) {
      const riskScore = this.riskScoring[this.fraudPatterns.transactionPatterns.rapidSuccessiveTransactions.severity];
      score += riskScore;
      factors.push({
        type: 'rapid_transactions',
        severity: this.fraudPatterns.transactionPatterns.rapidSuccessiveTransactions.severity,
        score: riskScore,
        description: `${recentTransactions.length} transactions in ${timeWindow / (60 * 60 * 1000)} hours`
      });
    }

    // Round number transactions
    const isRoundNumber = this.fraudPatterns.transactionPatterns.roundNumberTransactions.patterns
      .some(pattern => pattern.test(amount.toString()));

    if (isRoundNumber && amount >= this.fraudPatterns.transactionPatterns.roundNumberTransactions.threshold) {
      const riskScore = this.riskScoring[this.fraudPatterns.transactionPatterns.roundNumberTransactions.severity];
      score += riskScore;
      factors.push({
        type: 'round_number_transaction',
        severity: this.fraudPatterns.transactionPatterns.roundNumberTransactions.severity,
        score: riskScore,
        description: `Round number transaction: ${amount} TL`
      });
    }

    // International card usage
    if (context.cardCountry && context.cardCountry !== this.fraudPatterns.transactionPatterns.internationalCardUsage.domesticCountry) {
      const riskScore = this.riskScoring[this.fraudPatterns.transactionPatterns.internationalCardUsage.severity];
      score += riskScore;
      factors.push({
        type: 'international_card',
        severity: this.fraudPatterns.transactionPatterns.internationalCardUsage.severity,
        score: riskScore,
        description: `International card usage from ${context.cardCountry}`
      });
    }

    return { score, factors };
  }

  /**
   * Content risk kontrolü
   */
  async checkContentRisk(content) {
    let score = 0;
    const factors = [];

    // Spam indicators
    const spamMatches = this.fraudPatterns.contentPatterns.spamIndicators.patterns
      .filter(pattern => pattern.test(content));

    if (spamMatches.length > 0) {
      const riskScore = this.riskScoring[this.fraudPatterns.contentPatterns.spamIndicators.severity];
      score += riskScore;
      factors.push({
        type: 'spam_content',
        severity: this.fraudPatterns.contentPatterns.spamIndicators.severity,
        score: riskScore,
        description: `Spam indicators detected: ${spamMatches.length} matches`
      });
    }

    // Phishing indicators
    const phishingMatches = this.fraudPatterns.contentPatterns.phishingIndicators.patterns
      .filter(pattern => pattern.test(content));

    if (phishingMatches.length > 0) {
      const riskScore = this.riskScoring[this.fraudPatterns.contentPatterns.phishingIndicators.severity];
      score += riskScore;
      factors.push({
        type: 'phishing_content',
        severity: this.fraudPatterns.contentPatterns.phishingIndicators.severity,
        score: riskScore,
        description: `Phishing indicators detected: ${phishingMatches.length} matches`
      });
    }

    return { score, factors };
  }

  /**
   * Velocity risk kontrolü (aktivite hızı)
   */
  async checkVelocityRisk(userId, activity) {
    let score = 0;
    const factors = [];

    // Genel aktivite hızı kontrolü
    const recentActivities = await this.getRecentUserActivities(userId, 60 * 60 * 1000); // Last hour

    if (recentActivities.length > 10) {
      score += 2; // Moderate risk for high activity
      factors.push({
        type: 'high_activity_velocity',
        severity: 'medium',
        score: 2,
        description: `${recentActivities.length} activities in last hour`
      });
    }

    // Aynı tip aktivite yoğunluğu
    const sameTypeActivities = recentActivities.filter(a => a.type === activity.type);
    if (sameTypeActivities.length > 5) {
      score += 3; // Higher risk for same type activity burst
      factors.push({
        type: 'same_type_activity_burst',
        severity: 'medium',
        score: 3,
        description: `${sameTypeActivities.length} ${activity.type} activities in last hour`
      });
    }

    return { score, factors };
  }

  /**
   * Device risk kontrolü
   */
  async checkDeviceRisk(userId, deviceFingerprint) {
    let score = 0;
    const factors = [];

    // Device fingerprint değişimi kontrolü
    const deviceHistory = await this.getUserDeviceHistory(userId);
    const currentDevice = deviceHistory.find(d => d.fingerprint === deviceFingerprint);

    if (!currentDevice) {
      // Yeni device
      if (deviceHistory.length > 3) {
        score += 2; // Risk for many different devices
        factors.push({
          type: 'new_device_detected',
          severity: 'low',
          score: 2,
          description: `User has ${deviceHistory.length} different devices`
        });
      }
    } else {
      // Bilinen device, son kullanım kontrolü
      const lastUsed = new Date(currentDevice.lastUsed);
      const daysSinceLastUse = (Date.now() - lastUsed.getTime()) / (24 * 60 * 60 * 1000);

      if (daysSinceLastUse > 30) {
        score += 1; // Low risk for long-unused device
        factors.push({
          type: 'long_unused_device',
          severity: 'low',
          score: 1,
          description: `Device not used for ${Math.round(daysSinceLastUse)} days`
        });
      }
    }

    return { score, factors };
  }

  /**
   * Risk seviyesini belirle
   */
  determineRiskLevel(score) {
    if (score >= 15) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  /**
   * Öneri oluştur
   */
  generateRecommendation(score, factors) {
    const recommendations = [];

    if (score >= this.maxRiskScore) {
      recommendations.push('BLOCK_ACTIVITY', 'INVESTIGATE_USER', 'ALERT_SECURITY_TEAM');
    } else if (score >= 10) {
      recommendations.push('REQUIRE_ADDITIONAL_AUTH', 'MONITOR_USER', 'FLAG_FOR_REVIEW');
    } else if (score >= 5) {
      recommendations.push('LOG_ACTIVITY', 'SEND_WARNING_NOTIFICATION');
    }

    // Factor-specific recommendations
    factors.forEach(factor => {
      switch (factor.type) {
        case 'multiple_accounts_same_ip':
          recommendations.push('BLOCK_IP_ADDRESS');
          break;
        case 'rapid_account_creation':
          recommendations.push('TEMPORARY_ACCOUNT_CREATION_BLOCK');
          break;
        case 'large_transaction_amount':
          recommendations.push('MANUAL_TRANSACTION_REVIEW');
          break;
        case 'phishing_content':
          recommendations.push('CONTENT_BLOCK', 'USER_WARNING');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Yardımcı fonksiyonlar (mock implementations)
   */
  async getAccountsFromIPAddress(ipAddress) {
    // TODO: Implement database query
    return [];
  }

  isVPNOrTorIP(ipAddress) {
    return this.fraudPatterns.ipPatterns.vpnTorDetection.patterns
      .some(pattern => pattern.test(ipAddress));
  }

  async checkGeoLocationRisk(ipAddress, userId) {
    // TODO: Implement geolocation checking
    return { score: 0, factors: [] };
  }

  async getRecentAccountCreations(userId) {
    // TODO: Implement database query
    return [];
  }

  async getRecentPasswordChanges(userId) {
    // TODO: Implement database query
    return [];
  }

  async getRecentTransactions(userId) {
    // TODO: Implement database query
    return [];
  }

  async getRecentUserActivities(userId, timeWindow) {
    // TODO: Implement database query
    return [];
  }

  async getUserDeviceHistory(userId) {
    // TODO: Implement database query
    return [];
  }

  /**
   * Fraud alert gönderme
   */
  async sendFraudAlert(riskAssessment) {
    console.log(`🚨 FRAUD ALERT: User ${riskAssessment.userId} - Risk Level: ${riskAssessment.riskLevel} (${riskAssessment.totalScore})`);

    // Incident response sistemini çağır
    if (riskAssessment.shouldBlock) {
      const incidentResponse = require('./incidentResponseService');
      await incidentResponse.reportSecurityIncident({
        type: 'fraud_attempt',
        severity: riskAssessment.riskLevel,
        description: `Fraudulent activity detected for user ${riskAssessment.userId}`,
        indicators: riskAssessment.riskFactors,
        affectedUsers: [riskAssessment.userId],
        source: 'fraud_detection_system'
      });
    }

    // TODO: Implement alert mechanisms (email, webhook, etc.)
  }

  /**
   * Fraud detection loglama
   */
  async logFraudAssessment(assessment) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'fraud_assessment',
      data: assessment
    };

    console.log('📊 Fraud Assessment:', JSON.stringify(logEntry, null, 2));

    // TODO: Log to secure database/file
  }

  /**
   * Fraud istatistikleri
   */
  async getFraudStats(timeRange = 30 * 24 * 60 * 60 * 1000) { // 30 days
    // TODO: Implement statistics calculation
    return {
      totalAssessments: 0,
      blockedActivities: 0,
      riskLevelDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      topRiskFactors: [],
      recentIncidents: []
    };
  }
}

module.exports = new FraudDetectionService();
