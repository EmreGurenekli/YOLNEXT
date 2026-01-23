const express = require('express');
const router = express.Router();
const realVerificationService = require('../services/realVerificationService');

// Vergi numarası doğrulama
router.post('/tax-number', async (req, res) => {
  try {
    const { taxNumber, companyName } = req.body;

    if (!taxNumber) {
      return res.status(400).json({
        isValid: false,
        error: 'Vergi numarası gerekli',
      });
    }

    if (!companyName) {
      return res.status(400).json({
        isValid: false,
        error: 'Şirket adı gerekli',
      });
    }

    // 1. Format kontrolü
    if (taxNumber.length !== 10 || !/^\d{10}$/.test(taxNumber)) {
      return res.json({
        isValid: false,
        error: 'Vergi numarası 10 haneli olmalıdır',
      });
    }

    // 2. Algoritma kontrolü
    const digits = taxNumber.split('').map(Number);
    const checkDigit = digits[9];
    const sum = digits.slice(0, 9).reduce((acc, digit, index) => {
      const temp = (digit + (9 - index)) % 10;
      return acc + (temp === 0 ? 0 : (temp * Math.pow(2, 9 - index)) % 9);
    }, 0);

    const isValidFormat = (10 - (sum % 10)) % 10 === checkDigit;
    if (!isValidFormat) {
      return res.json({
        isValid: false,
        error: 'Geçersiz vergi numarası formatı',
      });
    }

    // 3. GERÇEK DOĞRULAMA - Devlet web siteleri
    const verificationResult = await realVerificationService.verifyTaxNumber(
      taxNumber,
      companyName
    );

    if (verificationResult.error) {
      return res.json({
        isValid: false,
        error: verificationResult.error,
        details: verificationResult.details,
      });
    }

    res.json({
      isValid: verificationResult.isValid,
      message: verificationResult.isValid
        ? 'Vergi numarası ve şirket adı doğrulandı'
        : 'Vergi numarası veya şirket adı eşleşmiyor',
      companyInfo: verificationResult.companyInfo,
      verificationDetails: verificationResult.verificationDetails,
    });
  } catch (error) {
    console.error('Vergi numarası doğrulama hatası:', error);
    res.status(500).json({
      isValid: false,
      error: 'Doğrulama sırasında hata oluştu',
    });
  }
});

// Ehliyet numarası doğrulama
router.post('/driver-license', async (req, res) => {
  try {
    const { licenseNumber, firstName, lastName } = req.body;

    if (!licenseNumber) {
      return res.status(400).json({
        isValid: false,
        error: 'Ehliyet numarası gerekli',
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        isValid: false,
        error: 'Ad ve soyad gerekli',
      });
    }

    // 1. Format kontrolü
    if (!/^\d{11}$/.test(licenseNumber)) {
      return res.json({
        isValid: false,
        error: 'Ehliyet numarası 11 haneli olmalıdır',
      });
    }

    // 2. GERÇEK DOĞRULAMA - Devlet web siteleri
    const verificationResult =
      await realVerificationService.verifyDriverLicense(
        licenseNumber,
        firstName,
        lastName
      );

    if (verificationResult.error) {
      return res.json({
        isValid: false,
        error: verificationResult.error,
        details: verificationResult.details,
      });
    }

    res.json({
      isValid: verificationResult.isValid,
      message: verificationResult.isValid
        ? 'Ehliyet numarası ve kişi bilgileri doğrulandı'
        : 'Ehliyet numarası veya kişi bilgileri eşleşmiyor',
      driverInfo: verificationResult.driverInfo,
      verificationDetails: verificationResult.verificationDetails,
    });
  } catch (error) {
    console.error('Ehliyet doğrulama hatası:', error);
    res.status(500).json({
      isValid: false,
      error: 'Doğrulama sırasında hata oluştu',
    });
  }
});

// Telefon numarası doğrulama
router.post('/phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        isValid: false,
        error: 'Telefon numarası gerekli',
      });
    }

    // 1. Format kontrolü
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^(\+90|0)?[5][0-9]{9}$/.test(cleanPhone)) {
      return res.json({
        isValid: false,
        error: 'Geçersiz telefon numarası formatı',
      });
    }

    // 2. GERÇEK DOĞRULAMA - SMS servisi
    const verificationResult =
      await realVerificationService.verifyPhoneNumber(phone);

    if (verificationResult.error) {
      return res.json({
        isValid: false,
        error: verificationResult.error,
      });
    }

    if (verificationResult.requiresCode) {
      // SMS kodu gönderildi, kodu sakla
      const code = Math.floor(100000 + Math.random() * 900000);
      verificationCodes[cleanPhone] = { code, expires: Date.now() + 300000 }; // 5 dakika

      res.json({
        isValid: false,
        requiresCode: true,
        message: verificationResult.message,
      });
    } else {
      res.json({
        isValid: verificationResult.isValid,
        message: verificationResult.message,
      });
    }
  } catch (error) {
    console.error('Telefon doğrulama hatası:', error);
    res.status(500).json({
      isValid: false,
      error: 'Doğrulama sırasında hata oluştu',
    });
  }
});

// SMS doğrulama kodu kontrolü
router.post('/phone/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        isValid: false,
        error: 'Telefon numarası ve kod gerekli',
      });
    }

    const verification = req.session.phoneVerification;

    if (
      !verification ||
      verification.phone !== phone ||
      verification.code !== parseInt(code) ||
      Date.now() > verification.expires
    ) {
      return res.json({
        isValid: false,
        error: 'Geçersiz veya süresi dolmuş kod',
      });
    }

    // Doğrulama başarılı
    delete req.session.phoneVerification;

    res.json({
      isValid: true,
      message: 'Telefon numarası doğrulandı',
    });
  } catch (error) {
    console.error('SMS kod doğrulama hatası:', error);
    res.status(500).json({
      isValid: false,
      error: 'Doğrulama sırasında hata oluştu',
    });
  }
});

// E-posta doğrulama
router.post('/email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        isValid: false,
        error: 'E-posta adresi gerekli',
      });
    }

    // 1. Format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        isValid: false,
        error: 'Geçersiz e-posta formatı',
      });
    }

    // 2. GERÇEK DOĞRULAMA - E-posta servisi
    const verificationResult = await realVerificationService.verifyEmail(email);

    if (verificationResult.error) {
      return res.json({
        isValid: false,
        error: verificationResult.error,
      });
    }

    if (verificationResult.requiresCode) {
      // E-posta kodu gönderildi, kodu sakla
      const code = Math.floor(100000 + Math.random() * 900000);
      verificationCodes[email] = { code, expires: Date.now() + 300000 }; // 5 dakika

      res.json({
        isValid: false,
        requiresCode: true,
        message: verificationResult.message,
      });
    } else {
      res.json({
        isValid: verificationResult.isValid,
        message: verificationResult.message,
      });
    }
  } catch (error) {
    console.error('E-posta doğrulama hatası:', error);
    res.status(500).json({
      isValid: false,
      error: 'Doğrulama sırasında hata oluştu',
    });
  }
});

// E-posta doğrulama kodu kontrolü
router.post('/email/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        isValid: false,
        error: 'E-posta adresi ve kod gerekli',
      });
    }

    const verification = req.session.emailVerification;

    if (
      !verification ||
      verification.email !== email ||
      verification.code !== parseInt(code) ||
      Date.now() > verification.expires
    ) {
      return res.json({
        isValid: false,
        error: 'Geçersiz veya süresi dolmuş kod',
      });
    }

    // Doğrulama başarılı
    delete req.session.emailVerification;

    res.json({
      isValid: true,
      message: 'E-posta adresi doğrulandı',
    });
  } catch (error) {
    console.error('E-posta kod doğrulama hatası:', error);
    res.status(500).json({
      isValid: false,
      error: 'Doğrulama sırasında hata oluştu',
    });
  }
});

// Eski simüle edilmiş fonksiyonlar kaldırıldı - artık gerçek doğrulama kullanılıyor

async function sendSMSVerification(phone, code) {
  // Gerçek uygulamada burada SMS servisi kullanılır
  console.log(`SMS gönderildi: ${phone} - Kod: ${code}`);

  // Simüle edilmiş başarı
  return Math.random() > 0.1; // %90 başarı oranı
}

async function sendEmailVerification(email, code) {
  // Gerçek uygulamada burada e-posta servisi kullanılır
  console.log(`E-posta gönderildi: ${email} - Kod: ${code}`);

  // Simüle edilmiş başarı
  return Math.random() > 0.1; // %90 başarı oranı
}

module.exports = router;
