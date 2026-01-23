// Content Moderation Middleware
// Simple content filtering for messages

const BANNED_WORDS = [
  // Add banned words here if needed
];

const SPAM_PATTERNS = [
  /(.)\1{4,}/, // Repeated characters (aaaaa)
  /(https?:\/\/[^\s]+){3,}/i, // Multiple URLs
];

function moderateContent(content, options = {}) {
  if (!content || typeof content !== 'string') {
    return { allowed: false, reason: 'INVALID_CONTENT' };
  }

  const text = content.toLowerCase().trim();

  // Check for banned words
  for (const word of BANNED_WORDS) {
    if (text.includes(word.toLowerCase())) {
      return { allowed: false, reason: 'BANNED_WORD' };
    }
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return { allowed: false, reason: 'SPAM_PATTERN' };
    }
  }

  // Check length
  if (text.length < 1) {
    return { allowed: false, reason: 'TOO_SHORT' };
  }

  if (text.length > 5000) {
    return { allowed: false, reason: 'TOO_LONG' };
  }

  return { allowed: true };
}

function getModerationReason(reason) {
  const reasons = {
    INVALID_CONTENT: 'Geçersiz mesaj içeriği',
    BANNED_WORD: 'Mesaj yasaklı kelime içeriyor',
    SPAM_PATTERN: 'Spam tespit edildi',
    TOO_SHORT: 'Mesaj çok kısa',
    TOO_LONG: 'Mesaj çok uzun',
  };
  return reasons[reason] || 'Mesaj gönderilemedi';
}

function sanitizeContent(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove excessive whitespace
  let sanitized = content.replace(/\s+/g, ' ').trim();

  // Limit length
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  return sanitized;
}

module.exports = {
  moderateContent,
  getModerationReason,
  sanitizeContent,
};

