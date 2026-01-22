const badWords = [
  // Türkçe küfürler
  'amk', 'ananı', 'annen', 'baban', 'bacın', 'bacını', 'bacini', 'sikeyim', 'siktir', 'siktirgit',
  'orospu', 'orospu çocuğu', 'piç', 'piç kurusu', 'göt', 'götveren', 'kahpe', 'kahpe oğlu',
  'yarrak', 'yarak', 'sıçmak', 'sıç', 'bok', 'bok ye', 'eşşek', 'eşşek herif', 'ibne', 'ibne herif',
  'pezevenk', 'pezevenk oğlu', 'pezevenk herif', 'oç', 'oç oğlu', 'gavat', 'gavat herif',
  'kaltak', 'kaltak oğlu', 'kaltak herif', 'fahişe', 'fahişe oğlu', 'fahişe herif',
  // İngilizce küfürler
  'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'cunt', 'pussy',
  'motherfucker', 'cocksucker', 'bullshit', 'damn', 'hell', 'crap', 'nigger', 'nigga',
  // Spam kelimeleri
  'bitcoin', 'crypto', 'investment', 'earn money', 'make money', 'free money', 'win prize',
  'lottery', 'casino', 'gambling', 'porn', 'sex', 'nude', 'naked', 'drugs', 'cocaine', 'heroin',
  // Tehdit kelimeleri
  'öldüreceğim', 'öldür', 'vuracağım', 'vur', 'yaralayacağım', 'yarala', 'şantaj', 'blackmail',
  'kill', 'murder', 'threat', 'bomb', 'explosive', 'terrorist', 'rape', 'assault'
];

const spamPatterns = [
  /\b\d{10,}\b/g, // Uzun telefon numaraları
  /\b\w+@\w+\.\w+\b/g, // E-posta adresleri (çok fazla)
  /(https?:\/\/[^\s]+)/g, // URL'ler
  /\b\d+\s*(tl|usd|eur|try)\b/gi, // Fiyat bilgileri
  /\b(iban|hesap|account)\b.*\b\d+\b/gi, // Banka bilgileri
  /\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b/g, // Kredi kartı formatı
  /\b\d{16}\b/g, // 16 haneli kart numarası
];

const threatPatterns = [
  /\böldür|\böldüreceğim|\bvur|\böldür/g,
  /\bşantaj|\bblackmail|\bthreat/g,
  /\bbomb|\bexplosive|\bpatlat/g,
  /\btecavüz|\brape|\bassault/g,
  /\bintihar|\bsuicide/g
];

function containsBadWords(text) {
  const lowerText = text.toLowerCase();
  return badWords.some(word => lowerText.includes(word));
}

function containsSpam(text) {
  return spamPatterns.some(pattern => pattern.test(text));
}

function containsThreat(text) {
  return threatPatterns.some(pattern => pattern.test(text));
}

function moderateContent(text, options = {}) {
  const {
    strictMode = false,
    allowUrls = false,
    allowEmails = false,
    allowPhoneNumbers = false
  } = options;

  if (!text || typeof text !== 'string') {
    return { allowed: false, reason: 'invalid_content' };
  }

  // Boş mesaj kontrolü
  if (text.trim().length === 0) {
    return { allowed: false, reason: 'empty_content' };
  }

  // Maksimum uzunluk kontrolü
  if (text.length > 1000) {
    return { allowed: false, reason: 'content_too_long' };
  }

  // Küfür kontrolü
  if (containsBadWords(text)) {
    return { allowed: false, reason: 'profanity_detected' };
  }

  // Tehdit kontrolü (her zaman engellenir)
  if (containsThreat(text)) {
    return { allowed: false, reason: 'threat_detected' };
  }

  // Spam kontrolü
  if (containsSpam(text)) {
    // Strict mode'da spam engellenir
    if (strictMode) {
      return { allowed: false, reason: 'spam_detected' };
    }

    // Normal mode'da uyarı verilir ama engellenmez
    return {
      allowed: true,
      warning: 'potential_spam',
      sanitized: true
    };
  }

  // URL kontrolü
  if (!allowUrls && /(https?:\/\/[^\s]+)/.test(text)) {
    if (strictMode) {
      return { allowed: false, reason: 'url_not_allowed' };
    }
    return {
      allowed: true,
      warning: 'contains_url',
      sanitized: true
    };
  }

  // E-posta kontrolü
  if (!allowEmails && /\b\w+@\w+\.\w+\b/.test(text)) {
    if (strictMode) {
      return { allowed: false, reason: 'email_not_allowed' };
    }
    return {
      allowed: true,
      warning: 'contains_email',
      sanitized: true
    };
  }

  // Telefon numarası kontrolü
  if (!allowPhoneNumbers && /\b\d{10,}\b/.test(text)) {
    if (strictMode) {
      return { allowed: false, reason: 'phone_not_allowed' };
    }
    return {
      allowed: true,
      warning: 'contains_phone',
      sanitized: true
    };
  }

  return { allowed: true };
}

function sanitizeContent(text) {
  let sanitized = text;

  // Küfürleri yıldızla değiştir
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '*'.repeat(word.length));
  });

  // Hassas bilgileri maskele
  sanitized = sanitized.replace(/\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b/g, '**** **** **** ****');
  sanitized = sanitized.replace(/\b\d{16}\b/g, '****************');

  return sanitized;
}

function getModerationReason(reason) {
  const reasons = {
    'invalid_content': 'Geçersiz içerik',
    'empty_content': 'Boş mesaj',
    'content_too_long': 'Mesaj çok uzun',
    'profanity_detected': 'Küfür içeriyor',
    'threat_detected': 'Tehdit içeriyor',
    'spam_detected': 'Spam içerik',
    'url_not_allowed': 'URL paylaşımı yasak',
    'email_not_allowed': 'E-posta paylaşımı yasak',
    'phone_not_allowed': 'Telefon numarası paylaşımı yasak'
  };

  return reasons[reason] || 'İçerik uygun değil';
}

module.exports = {
  moderateContent,
  sanitizeContent,
  getModerationReason,
  containsBadWords,
  containsSpam,
  containsThreat,
  badWords,
  spamPatterns,
  threatPatterns
};
