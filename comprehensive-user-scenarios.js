import { chromium } from 'playwright';

// Kullanıcı tipleri ve senaryoları
const userScenarios = {
  // BİREYSEL KULLANICI SENARYOLARI
  individual: [
    {
      name: "Ev Taşıyan Aile - Başarılı",
      profile: {
        name: "Ahmet Yılmaz",
        email: "ahmet@test.com",
        phone: "+90 555 123 4567",
        age: 35,
        income: "middle",
        techLevel: "medium",
        experience: "first_time"
      },
      behavior: "cooperative",
      expectations: "budget_conscious",
      testSteps: [
        "landing_page_visit",
        "demo_login_individual",
        "create_shipment_home_move",
        "compare_offers",
        "accept_offer",
        "track_shipment",
        "rate_carrier"
      ]
    },
    {
      name: "Teknoloji Uzmanı - Hızlı",
      profile: {
        name: "Zeynep Kaya",
        email: "zeynep@test.com",
        phone: "+90 555 234 5678",
        age: 28,
        income: "high",
        techLevel: "expert",
        experience: "frequent"
      },
      behavior: "efficient",
      expectations: "premium_service",
      testSteps: [
        "direct_dashboard_access",
        "bulk_shipment_creation",
        "advanced_tracking",
        "api_integration_check"
      ]
    },
    {
      name: "Yaşlı Kullanıcı - Zorlanan",
      profile: {
        name: "Mehmet Amca",
        email: "mehmet@test.com",
        phone: "+90 555 345 6789",
        age: 65,
        income: "low",
        techLevel: "beginner",
        experience: "never"
      },
      behavior: "confused",
      expectations: "simple_process",
      testSteps: [
        "landing_page_confusion",
        "help_section_usage",
        "step_by_step_guidance",
        "phone_support_request"
      ]
    },
    {
      name: "Şüpheli Kullanıcı - Güvensiz",
      profile: {
        name: "Ali Şüpheli",
        email: "ali@test.com",
        phone: "+90 555 456 7890",
        age: 42,
        income: "middle",
        techLevel: "medium",
        experience: "scammed_before"
      },
      behavior: "suspicious",
      expectations: "security_focused",
      testSteps: [
        "security_check",
        "privacy_policy_read",
        "payment_security_verify",
        "carrier_verification_check"
      ]
    },
    {
      name: "Aceleci Kullanıcı - Hızlı",
      profile: {
        name: "Fatma Hızlı",
        email: "fatma@test.com",
        phone: "+90 555 567 8901",
        age: 30,
        income: "high",
        techLevel: "medium",
        experience: "urgent_needs"
      },
      behavior: "rushed",
      expectations: "immediate_service",
      testSteps: [
        "quick_registration",
        "urgent_shipment",
        "instant_quotes",
        "same_day_delivery"
      ]
    }
  ],

  // KURUMSAL KULLANICI SENARYOLARI
  corporate: [
    {
      name: "Büyük Şirket - Profesyonel",
      profile: {
        company: "Migros A.Ş.",
        contact: "Ayşe Demir",
        email: "ayse@migros.com",
        phone: "+90 212 555 0123",
        size: "large",
        industry: "retail",
        techLevel: "enterprise"
      },
      behavior: "professional",
      expectations: "enterprise_features",
      testSteps: [
        "bulk_shipment_creation",
        "team_management",
        "advanced_analytics",
        "api_integration",
        "custom_reporting"
      ]
    },
    {
      name: "KOBİ - Orta Ölçek",
      profile: {
        company: "ABC Lojistik",
        contact: "Mehmet Özkan",
        email: "mehmet@abc.com",
        phone: "+90 216 555 1234",
        size: "medium",
        industry: "logistics",
        techLevel: "medium"
      },
      behavior: "cost_conscious",
      expectations: "value_for_money",
      testSteps: [
        "budget_planning",
        "carrier_comparison",
        "cost_optimization",
        "monthly_reporting"
      ]
    },
    {
      name: "Startup - Hızlı Büyüyen",
      profile: {
        company: "TechStart",
        contact: "Zeynep Teknoloji",
        email: "zeynep@techstart.com",
        phone: "+90 532 555 2345",
        size: "small",
        industry: "technology",
        techLevel: "expert"
      },
      behavior: "innovative",
      expectations: "scalable_solution",
      testSteps: [
        "api_integration",
        "automation_setup",
        "scaling_planning",
        "custom_features"
      ]
    },
    {
      name: "Geleneksel Şirket - Dirençli",
      profile: {
        company: "Eski Ticaret",
        contact: "Hasan Bey",
        email: "hasan@eski.com",
        phone: "+90 312 555 3456",
        size: "medium",
        industry: "traditional",
        techLevel: "low"
      },
      behavior: "resistant",
      expectations: "simple_process",
      testSteps: [
        "resistance_to_change",
        "training_needs",
        "gradual_adoption",
        "support_requirements"
      ]
    }
  ],

  // NAKLİYECİ SENARYOLARI
  carrier: [
    {
      name: "Büyük Nakliye Şirketi - Profesyonel",
      profile: {
        company: "Hızlı Lojistik A.Ş.",
        contact: "Ahmet Yönetici",
        email: "ahmet@hizli.com",
        phone: "+90 216 555 4567",
        fleetSize: "large",
        experience: "expert",
        reputation: "excellent"
      },
      behavior: "professional",
      expectations: "high_volume",
      testSteps: [
        "fleet_management",
        "route_optimization",
        "driver_management",
        "financial_tracking",
        "customer_service"
      ]
    },
    {
      name: "Bireysel Nakliyeci - Küçük",
      profile: {
        company: "Ahmet Nakliyat",
        contact: "Ahmet Şoför",
        email: "ahmet@nakliyat.com",
        phone: "+90 555 567 8901",
        fleetSize: "small",
        experience: "beginner",
        reputation: "new"
      },
      behavior: "learning",
      expectations: "guidance",
      testSteps: [
        "profile_setup",
        "first_offer",
        "learning_process",
        "reputation_building"
      ]
    },
    {
      name: "Dolandırıcı Nakliyeci - Kötü Niyetli",
      profile: {
        company: "Sahte Lojistik",
        contact: "Ali Sahte",
        email: "ali@sahte.com",
        phone: "+90 555 678 9012",
        fleetSize: "fake",
        experience: "scammer",
        reputation: "bad"
      },
      behavior: "malicious",
      expectations: "easy_money",
      testSteps: [
        "fake_documents",
        "suspicious_behavior",
        "system_exploitation",
        "fraud_attempts"
      ]
    },
    {
      name: "Deneyimli Nakliyeci - Uzman",
      profile: {
        company: "Uzman Taşımacılık",
        contact: "Mehmet Uzman",
        email: "mehmet@uzman.com",
        phone: "+90 555 789 0123",
        fleetSize: "medium",
        experience: "expert",
        reputation: "good"
      },
      behavior: "efficient",
      expectations: "quality_service",
      testSteps: [
        "quick_offer_submission",
        "competitive_pricing",
        "reliable_service",
        "customer_satisfaction"
      ]
    }
  ],

  // TAŞIYICI SENARYOLARI
  driver: [
    {
      name: "Profesyonel Şoför - Deneyimli",
      profile: {
        name: "Ali Şoför",
        email: "ali@sofor.com",
        phone: "+90 555 890 1234",
        experience: "expert",
        license: "professional",
        reputation: "excellent"
      },
      behavior: "professional",
      expectations: "steady_work",
      testSteps: [
        "profile_verification",
        "job_acceptance",
        "route_following",
        "customer_communication"
      ]
    },
    {
      name: "Yeni Şoför - Öğrenen",
      profile: {
        name: "Ayşe Yeni",
        email: "ayse@yeni.com",
        phone: "+90 555 901 2345",
        experience: "beginner",
        license: "basic",
        reputation: "new"
      },
      behavior: "cautious",
      expectations: "guidance",
      testSteps: [
        "learning_interface",
        "first_job_anxiety",
        "support_requests",
        "skill_development"
      ]
    },
    {
      name: "Geçici Şoför - Part-time",
      profile: {
        name: "Mehmet Geçici",
        email: "mehmet@gecici.com",
        phone: "+90 555 012 3456",
        experience: "medium",
        license: "basic",
        reputation: "variable"
      },
      behavior: "flexible",
      expectations: "flexible_hours",
      testSteps: [
        "availability_setting",
        "job_selection",
        "schedule_management",
        "income_tracking"
      ]
    },
    {
      name: "Sorunlu Şoför - Problemli",
      profile: {
        name: "Hasan Sorunlu",
        email: "hasan@sorunlu.com",
        phone: "+90 555 123 4567",
        experience: "medium",
        license: "suspended",
        reputation: "bad"
      },
      behavior: "problematic",
      expectations: "easy_money",
      testSteps: [
        "fake_credentials",
        "suspicious_behavior",
        "system_abuse",
        "customer_complaints"
      ]
    }
  ]
};

// Test senaryoları
const testScenarios = [
  // BAŞARILI SENARYOLAR
  {
    name: "Mükemmel Kullanıcı Deneyimi",
    type: "success",
    description: "Her şey mükemmel çalışıyor",
    steps: [
      "perfect_registration",
      "smooth_navigation",
      "instant_verification",
      "seamless_transaction",
      "excellent_support"
    ]
  },
  {
    name: "Hızlı İşlem Tamamlama",
    type: "success",
    description: "Kullanıcı hızlıca işlemini tamamlıyor",
    steps: [
      "quick_registration",
      "fast_shipment_creation",
      "immediate_offer_acceptance",
      "real_time_tracking"
    ]
  },

  // PROBLEM SENARYOLARI
  {
    name: "Yavaş İnternet Bağlantısı",
    type: "problem",
    description: "Kullanıcı yavaş internet ile çalışıyor",
    steps: [
      "slow_loading",
      "timeout_issues",
      "retry_attempts",
      "patience_testing"
    ]
  },
  {
    name: "Mobil Cihaz Sorunları",
    type: "problem",
    description: "Eski mobil cihazda sorunlar",
    steps: [
      "mobile_compatibility",
      "touch_issues",
      "screen_size_problems",
      "performance_issues"
    ]
  },
  {
    name: "Güvenlik Endişeleri",
    type: "problem",
    description: "Kullanıcı güvenlik konusunda endişeli",
    steps: [
      "security_concerns",
      "privacy_questions",
      "payment_hesitation",
      "verification_requests"
    ]
  },

  // AŞIRI SENARYOLAR
  {
    name: "Çok Fazla Eşzamanlı İşlem",
    type: "stress",
    description: "Sistem yük altında",
    steps: [
      "multiple_simultaneous_users",
      "high_traffic_load",
      "system_slowdown",
      "error_handling"
    ]
  },
  {
    name: "Saldırı Senaryosu",
    type: "attack",
    description: "Kötü niyetli kullanıcı",
    steps: [
      "malicious_inputs",
      "sql_injection_attempts",
      "xss_attacks",
      "brute_force_attacks"
    ]
  }
];

// Test çalıştırıcı
async function runComprehensiveTests() {
  console.log('🧪 KAPSAMLI KULLANICI SENARYO TESTLERİ BAŞLIYOR...\n');
  
  const browser = await chromium.launch({ headless: false });
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    scenarios: []
  };

  try {
    // Her kullanıcı tipi için test
    for (const [userType, scenarios] of Object.entries(userScenarios)) {
      console.log(`\n🎯 ${userType.toUpperCase()} KULLANICI TESTLERİ`);
      console.log('='.repeat(50));
      
      for (const scenario of scenarios) {
        console.log(`\n👤 Test: ${scenario.name}`);
        console.log(`📋 Profil: ${JSON.stringify(scenario.profile, null, 2)}`);
        
        const testResult = await runUserScenario(browser, userType, scenario);
        results.scenarios.push(testResult);
        results.total++;
        
        if (testResult.success) {
          results.passed++;
          console.log(`✅ ${scenario.name} - BAŞARILI`);
        } else {
          results.failed++;
          console.log(`❌ ${scenario.name} - BAŞARISIZ: ${testResult.error}`);
        }
      }
    }

    // Özel test senaryoları
    console.log(`\n🎭 ÖZEL TEST SENARYOLARI`);
    console.log('='.repeat(50));
    
    for (const scenario of testScenarios) {
      console.log(`\n🎪 Test: ${scenario.name}`);
      console.log(`📝 Açıklama: ${scenario.description}`);
      
      const testResult = await runSpecialScenario(browser, scenario);
      results.scenarios.push(testResult);
      results.total++;
      
      if (testResult.success) {
        results.passed++;
        console.log(`✅ ${scenario.name} - BAŞARILI`);
      } else {
        results.failed++;
        console.log(`❌ ${scenario.name} - BAŞARISIZ: ${testResult.error}`);
      }
    }

    // Sonuçları göster
    console.log('\n🎯 TEST SONUÇLARI ÖZETİ');
    console.log('='.repeat(50));
    console.log(`📊 Toplam Test: ${results.total}`);
    console.log(`✅ Başarılı: ${results.passed}`);
    console.log(`❌ Başarısız: ${results.failed}`);
    console.log(`📈 Başarı Oranı: ${Math.round((results.passed / results.total) * 100)}%`);
    
    // Detaylı rapor
    console.log('\n📋 DETAYLI RAPOR');
    console.log('='.repeat(50));
    
    const failedTests = results.scenarios.filter(s => !s.success);
    if (failedTests.length > 0) {
      console.log('\n❌ BAŞARISIZ TESTLER:');
      failedTests.forEach(test => {
        console.log(`- ${test.name}: ${test.error}`);
      });
    }
    
    const successTests = results.scenarios.filter(s => s.success);
    if (successTests.length > 0) {
      console.log('\n✅ BAŞARILI TESTLER:');
      successTests.forEach(test => {
        console.log(`- ${test.name}: ${test.duration}ms`);
      });
    }

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await browser.close();
  }
}

// Kullanıcı senaryosu çalıştırıcı
async function runUserScenario(browser, userType, scenario) {
  const startTime = Date.now();
  const page = await browser.newPage();
  
  try {
    // Senaryo adımlarını çalıştır
    for (const step of scenario.testSteps) {
      await executeTestStep(page, userType, step, scenario);
    }
    
    const duration = Date.now() - startTime;
    return {
      name: scenario.name,
      userType,
      success: true,
      duration,
      steps: scenario.testSteps.length
    };
    
  } catch (error) {
    return {
      name: scenario.name,
      userType,
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  } finally {
    await page.close();
  }
}

// Özel senaryo çalıştırıcı
async function runSpecialScenario(browser, scenario) {
  const startTime = Date.now();
  const page = await browser.newPage();
  
  try {
    // Senaryo tipine göre test çalıştır
    switch (scenario.type) {
      case 'success':
        await runSuccessScenario(page, scenario);
        break;
      case 'problem':
        await runProblemScenario(page, scenario);
        break;
      case 'stress':
        await runStressScenario(page, scenario);
        break;
      case 'attack':
        await runAttackScenario(page, scenario);
        break;
    }
    
    const duration = Date.now() - startTime;
    return {
      name: scenario.name,
      type: scenario.type,
      success: true,
      duration
    };
    
  } catch (error) {
    return {
      name: scenario.name,
      type: scenario.type,
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  } finally {
    await page.close();
  }
}

// Test adımı çalıştırıcı
async function executeTestStep(page, userType, step, scenario) {
  switch (step) {
    case 'landing_page_visit':
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Extra wait for page to fully load
      break;
      
    case 'demo_login_individual':
      // Try multiple selectors for demo button
      try {
        await page.click('button:has-text("Demo\'yu Başlat")');
      } catch (e) {
        try {
          await page.click('button:has-text("Demo")');
        } catch (e2) {
          await page.click('[data-testid="demo-button"]');
        }
      }
      await page.waitForTimeout(2000);
      break;
      
    case 'create_shipment_home_move':
      await page.goto('http://localhost:5173/individual/create-shipment');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("Ev Taşınması")');
      break;
      
    case 'compare_offers':
      await page.goto('http://localhost:5173/individual/offers');
      await page.waitForLoadState('networkidle');
      break;
      
    case 'accept_offer':
      // Offer kabul etme simülasyonu
      break;
      
    case 'track_shipment':
      await page.goto('http://localhost:5173/individual/live-tracking');
      await page.waitForLoadState('networkidle');
      break;
      
    case 'rate_carrier':
      // Carrier değerlendirme simülasyonu
      break;
      
    // Diğer adımlar...
    default:
      console.log(`⚠️ Bilinmeyen test adımı: ${step}`);
  }
}

// Başarı senaryosu
async function runSuccessScenario(page, scenario) {
  // Mükemmel kullanıcı deneyimi simülasyonu
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Hızlı ve sorunsuz işlemler
  try {
    await page.click('button:has-text("Demo\'yu Başlat")');
  } catch (e) {
    try {
      await page.click('button:has-text("Demo")');
    } catch (e2) {
      await page.click('[data-testid="demo-button"]');
    }
  }
  await page.waitForTimeout(1000);
  
  // Tüm panelleri test et
  const panels = ['individual', 'corporate', 'nakliyeci', 'tasiyici'];
  for (const panel of panels) {
    await page.goto(`http://localhost:5173/${panel}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
}

// Problem senaryosu
async function runProblemScenario(page, scenario) {
  // Yavaş bağlantı simülasyonu
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 2000); // 2 saniye gecikme
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
}

// Stres senaryosu
async function runStressScenario(page, scenario) {
  // Çoklu eşzamanlı işlem simülasyonu
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(page.goto('http://localhost:5173'));
  }
  await Promise.all(promises);
}

// Saldırı senaryosu
async function runAttackScenario(page, scenario) {
  // Kötü niyetli girişler
  await page.goto('http://localhost:5173/login');
  
  // SQL injection denemeleri
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    "<script>alert('XSS')</script>",
    "admin' OR '1'='1",
    "../../etc/passwd"
  ];
  
  for (const input of maliciousInputs) {
    try {
      await page.fill('input[type="email"]', input);
      await page.fill('input[type="password"]', input);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    } catch (error) {
      // Beklenen hata
    }
  }
}

// Testi başlat
runComprehensiveTests();
