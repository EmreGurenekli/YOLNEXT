// Test Helper Functions - Küçük, Adım Adım İşlemler İçin

/**
 * Güvenli bekleme - timeout ile
 */
async function safeWait(ms, maxWait = 10000) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), maxWait);
    setTimeout(() => {
      clearTimeout(timeout);
      resolve(true);
    }, ms);
  });
}

/**
 * Güvenli element bekleme
 */
async function safeWaitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Güvenli tıklama - retry ile
 */
async function safeClick(page, selector, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.click({ timeout: 5000 });
        await safeWait(500);
        return true;
      }
    } catch (e) {
      if (i === retries - 1) return false;
      await safeWait(1000);
    }
  }
  return false;
}

/**
 * Güvenli input doldurma
 */
async function safeFill(page, selector, value, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.fill(value, { timeout: 5000 });
        await safeWait(300);
        return true;
      }
    } catch (e) {
      if (i === retries - 1) return false;
      await safeWait(1000);
    }
  }
  return false;
}

/**
 * Güvenli select seçimi
 */
async function safeSelect(page, selector, value, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.selectOption(value, { timeout: 5000 });
        await safeWait(500);
        return true;
      }
    } catch (e) {
      if (i === retries - 1) return false;
      await safeWait(1000);
    }
  }
  return false;
}

/**
 * Adım adım gönderi oluşturma - basitleştirilmiş
 */
async function createShipmentStepByStep(page) {
  const steps = [];
  
  // Adım 1: Kategori seç
  steps.push({
    name: 'Kategori seç',
    action: async () => await safeSelect(page, 'select', 'Ev Taşınması'),
    wait: 500
  });
  
  // Adım 2: Eşya açıklaması
  steps.push({
    name: 'Eşya açıklaması',
    action: async () => await safeFill(page, 'input[type="text"]', 'Test Gönderisi'),
    wait: 300
  });
  
  // Adım 3: Oda sayısı
  steps.push({
    name: 'Oda sayısı',
    action: async () => await safeSelect(page, 'select', '2 Oda'),
    wait: 500
  });
  
  // Adım 4: İleri butonu
  steps.push({
    name: 'İleri butonu',
    action: async () => await safeClick(page, 'button:has-text("İleri")'),
    wait: 1000
  });
  
  // Adım 5: Toplama adresi
  steps.push({
    name: 'Toplama adresi',
    action: async () => await safeFill(page, 'input[placeholder*="adres" i]', 'İstanbul, Kadıköy, Test Sokak No:1'),
    wait: 300
  });
  
  // Adım 6: Toplama tarihi
  steps.push({
    name: 'Toplama tarihi',
    action: async () => await safeFill(page, 'input[type="date"]', '2025-01-25'),
    wait: 300
  });
  
  // Adım 7: Teslimat adresi
  steps.push({
    name: 'Teslimat adresi',
    action: async () => await safeFill(page, 'input[placeholder*="adres" i]:nth-of-type(2)', 'Ankara, Çankaya, Test Caddesi No:2'),
    wait: 300
  });
  
  // Adım 8: Teslimat tarihi
  steps.push({
    name: 'Teslimat tarihi',
    action: async () => await safeFill(page, 'input[type="date"]:nth-of-type(2)', '2025-01-27'),
    wait: 300
  });
  
  // Adım 9: İleri butonu 2
  steps.push({
    name: 'İleri butonu 2',
    action: async () => await safeClick(page, 'button:has-text("İleri")'),
    wait: 1000
  });
  
  // Adım 10: Yayınla
  steps.push({
    name: 'Yayınla',
    action: async () => await safeClick(page, 'button:has-text("Yayınla")'),
    wait: 2000
  });
  
  // Adımları sırayla çalıştır
  for (const step of steps) {
    console.log(`Adım: ${step.name}`);
    const success = await step.action();
    if (!success) {
      console.error(`❌ Adım başarısız: ${step.name}`);
      return false;
    }
    await safeWait(step.wait);
  }
  
  return true;
}

module.exports = {
  safeWait,
  safeWaitForElement,
  safeClick,
  safeFill,
  safeSelect,
  createShipmentStepByStep
};


























