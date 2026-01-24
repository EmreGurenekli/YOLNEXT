/**
 * KVKK Uyumluluğu için Kullanıcı Onaylarını Kaydetme Fonksiyonu
 * Bu fonksiyon, kullanıcı kayıt sırasında verdiği onayları veritabanına kaydeder.
 * KVKK m.5 gereği onayların tarih, saat, IP adresi ile saklanması zorunludur.
 */

const crypto = require('crypto');

/**
 * Kullanıcı onaylarını veritabanına kaydeder
 * @param {Object} pool - PostgreSQL connection pool
 * @param {number} userId - Kullanıcı ID
 * @param {Object} req - Express request object (IP ve user agent için)
 * @param {Object} consents - Onay objesi { acceptTerms, acceptPrivacy, acceptCookies, acceptKVKK, acceptDistanceSelling }
 * @returns {Promise<void>}
 */
async function saveUserConsents(pool, userId, req, consents) {
  if (!pool || !userId) {
    console.warn('⚠️ Cannot save consents: pool or userId missing');
    return;
  }

  try {
    // IP adresini al (proxy/load balancer arkasındaysa X-Forwarded-For header'ını kontrol et)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     req.ip ||
                     'unknown';
    
    // User agent bilgisini al
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Doküman versiyonları (şu an için v1.0 olarak kaydediyoruz)
    const documentVersion = 'v1.0-2024';
    
    // Onay türleri ve değerleri
    const consentTypes = [
      { type: 'terms_of_service', accepted: consents.acceptTerms },
      { type: 'privacy_policy', accepted: consents.acceptPrivacy },
      { type: 'cookie_policy', accepted: consents.acceptCookies },
      { type: 'kvkk_consent', accepted: consents.acceptKVKK },
      { type: 'distance_selling_contract', accepted: consents.acceptDistanceSelling },
    ];
    
    // Her onayı veritabanına kaydet
    for (const consent of consentTypes) {
      if (consent.accepted) {
        try {
          await pool.query(
            `INSERT INTO user_consents 
             (user_id, consent_type, is_accepted, consent_date, ip_address, user_agent, document_version) 
             VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
            [userId, consent.type, true, clientIp, userAgent, documentVersion]
          );
        } catch (consentError) {
          // Eğer tablo yoksa (migration çalıştırılmamışsa) sadece log'la, kayıt devam etsin
          if (consentError.code === '42P01') {
            // Table does not exist
            console.warn(`⚠️ Could not save consent ${consent.type}: Table user_consents does not exist`);
            console.warn('⚠️ IMPORTANT: Run migration 003_legal_compliance.sql to create user_consents table!');
          } else {
            console.warn(`⚠️ Could not save consent ${consent.type}:`, consentError.message);
          }
        }
      }
    }
    
    // Sözleşme imzası kaydı (elektronik imza)
    if (consents.acceptTerms && consents.acceptPrivacy && consents.acceptCookies && 
        consents.acceptKVKK && consents.acceptDistanceSelling) {
      try {
        // Sözleşme içeriğinin hash'ini oluştur (versiyon + kullanıcı ID + tarih)
        const contractContent = `${documentVersion}-${userId}-${Date.now()}`;
        const contractHash = crypto.createHash('sha256').update(contractContent).digest('hex');
        
        await pool.query(
          `INSERT INTO contract_signatures 
           (user_id, contract_type, contract_hash, contract_version, signature_date, ip_address, user_agent, signature_method) 
           VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)`,
          [
            userId,
            'user_agreement',
            contractHash,
            documentVersion,
            clientIp,
            userAgent,
            'click_to_sign'
          ]
        );
      } catch (signatureError) {
        if (signatureError.code === '42P01') {
          console.warn('⚠️ Could not save contract signature: Table contract_signatures does not exist');
          console.warn('⚠️ IMPORTANT: Run migration 003_legal_compliance.sql to create contract_signatures table!');
        } else {
          console.warn('⚠️ Could not save contract signature:', signatureError.message);
        }
      }
    }
    
    console.log(`✅ User consents saved for user ${userId} (IP: ${clientIp})`);
  } catch (error) {
    // Onay kaydetme hatası kritik değil, ama log'lanmalı
    console.error('❌ Error saving user consents:', error);
    // Kayıt işlemi devam etsin, ama uyarı ver
  }
}

module.exports = { saveUserConsents };





































