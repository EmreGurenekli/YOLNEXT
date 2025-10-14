const { User, Shipment, Offer, Report } = require('../models');
const { logger } = require('../utils/logger');

// Content moderation for shipments
const moderateShipment = async (shipmentData) => {
  const moderationRules = {
    // Prohibited words
    prohibitedWords: [
      'sahte', 'fake', 'dolandırıcı', 'scam', 'hile', 'trick',
      'bedava', 'ücretsiz', 'para', 'money', 'kredi', 'credit'
    ],
    
    // Suspicious patterns
    suspiciousPatterns: [
      /[0-9]{4,}/g, // Long numbers (phone, credit card)
      /[A-Z]{5,}/g, // Long uppercase strings
      /[!@#$%^&*()_+={}[\]|\\:";'<>?,./]{3,}/g // Too many special chars
    ],
    
    // Required fields check
    requiredFields: ['description', 'originAddress', 'destinationAddress'],
    
    // Length limits
    maxDescriptionLength: 1000,
    maxAddressLength: 500
  };

  const issues = [];

  // Check prohibited words
  const textToCheck = `${shipmentData.description || ''} ${shipmentData.originAddress || ''} ${shipmentData.destinationAddress || ''}`.toLowerCase();
  
  for (const word of moderationRules.prohibitedWords) {
    if (textToCheck.includes(word)) {
      issues.push(`Yasaklı kelime tespit edildi: ${word}`);
    }
  }

  // Check suspicious patterns
  for (const pattern of moderationRules.suspiciousPatterns) {
    if (pattern.test(textToCheck)) {
      issues.push('Şüpheli içerik tespit edildi');
    }
  }

  // Check required fields
  for (const field of moderationRules.requiredFields) {
    if (!shipmentData[field] || shipmentData[field].trim().length === 0) {
      issues.push(`Gerekli alan eksik: ${field}`);
    }
  }

  // Check length limits
  if (shipmentData.description && shipmentData.description.length > moderationRules.maxDescriptionLength) {
    issues.push('Açıklama çok uzun');
  }

  if (shipmentData.originAddress && shipmentData.originAddress.length > moderationRules.maxAddressLength) {
    issues.push('Alış adresi çok uzun');
  }

  if (shipmentData.destinationAddress && shipmentData.destinationAddress.length > moderationRules.maxAddressLength) {
    issues.push('Teslimat adresi çok uzun');
  }

  return {
    approved: issues.length === 0,
    issues,
    requiresReview: issues.length > 0
  };
};

// Content moderation for offers
const moderateOffer = async (offerData) => {
  const moderationRules = {
    prohibitedWords: [
      'sahte', 'fake', 'dolandırıcı', 'scam', 'hile', 'trick',
      'bedava', 'ücretsiz', 'para', 'money', 'kredi', 'credit'
    ],
    
    maxMessageLength: 500,
    minPrice: 50, // Minimum 50 TL
    maxPrice: 50000 // Maximum 50,000 TL
  };

  const issues = [];

  // Check prohibited words in message
  if (offerData.message) {
    const messageLower = offerData.message.toLowerCase();
    for (const word of moderationRules.prohibitedWords) {
      if (messageLower.includes(word)) {
        issues.push(`Yasaklı kelime tespit edildi: ${word}`);
      }
    }

    if (offerData.message.length > moderationRules.maxMessageLength) {
      issues.push('Mesaj çok uzun');
    }
  }

  // Check price range
  if (offerData.price < moderationRules.minPrice) {
    issues.push('Fiyat çok düşük');
  }

  if (offerData.price > moderationRules.maxPrice) {
    issues.push('Fiyat çok yüksek');
  }

  return {
    approved: issues.length === 0,
    issues,
    requiresReview: issues.length > 0
  };
};

// User registration moderation
const moderateUserRegistration = async (userData) => {
  const issues = [];

  // Check email domain
  const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  const emailDomain = userData.email.split('@')[1];
  
  if (suspiciousDomains.includes(emailDomain)) {
    issues.push('Şüpheli e-posta adresi');
  }

  // Check phone number format
  if (userData.phone) {
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    if (!phoneRegex.test(userData.phone.replace(/\s/g, ''))) {
      issues.push('Geçersiz telefon numarası formatı');
    }
  }

  // Check name length
  if (userData.firstName && userData.firstName.length < 2) {
    issues.push('Ad çok kısa');
  }

  if (userData.lastName && userData.lastName.length < 2) {
    issues.push('Soyad çok kısa');
  }

  return {
    approved: issues.length === 0,
    issues,
    requiresReview: issues.length > 0
  };
};

// Auto-approve or flag for review
const processModeration = async (type, data, userId) => {
  let moderationResult;

  switch (type) {
    case 'shipment':
      moderationResult = await moderateShipment(data);
      break;
    case 'offer':
      moderationResult = await moderateOffer(data);
      break;
    case 'user':
      moderationResult = await moderateUserRegistration(data);
      break;
    default:
      return { approved: true, issues: [], requiresReview: false };
  }

  // Log moderation result
  logger.info(`Moderation result for ${type}:`, {
    userId,
    approved: moderationResult.approved,
    issues: moderationResult.issues,
    requiresReview: moderationResult.requiresReview
  });

  return moderationResult;
};

// Report content
const reportContent = async (reporterId, contentType, contentId, reason, description) => {
  try {
    const report = await Report.create({
      reporterId,
      contentType, // 'shipment', 'offer', 'user'
      contentId,
      reason,
      description,
      status: 'pending'
    });

    logger.info(`Content reported: ${contentType} ${contentId} by user ${reporterId}`);

    return {
      success: true,
      reportId: report.id
    };
  } catch (error) {
    logger.error('Report creation error:', error);
    return {
      success: false,
      message: 'Rapor oluşturulamadı'
    };
  }
};

// Get pending moderation items
const getPendingModeration = async (type = 'all') => {
  try {
    const whereClause = type === 'all' ? {} : { type };
    
    const pendingItems = await ModerationQueue.findAll({
      where: {
        status: 'pending',
        ...whereClause
      },
      include: [
        { model: User, as: 'user' },
        { model: Shipment, as: 'shipment' },
        { model: Offer, as: 'offer' }
      ],
      order: [['createdAt', 'ASC']]
    });

    return pendingItems;
  } catch (error) {
    logger.error('Get pending moderation error:', error);
    return [];
  }
};

module.exports = {
  moderateShipment,
  moderateOffer,
  moderateUserRegistration,
  processModeration,
  reportContent,
  getPendingModeration
};





