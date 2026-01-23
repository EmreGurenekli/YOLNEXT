/**
 * Centralized professional toast messages for corporate experience
 * All toast messages across the platform should use this standardized system
 */

export const TOAST_MESSAGES = {
  // Success Messages - Professional and reassuring
  SUCCESS: {
    // Shipment & Delivery
    OFFER_SENT: 'Teklifınız başarıyla iletilmiştir. İlgili taraf tarafından değerlendirilecektir.',
    SHIPMENT_CREATED: 'Gönderi talebiniz başarıyla oluşturulmuştur. Nakliyecilerden teklifler gelmeye başlayacaktır.',
    DELIVERY_CONFIRMED: 'Teslimat işlemi başarıyla tamamlanmıştır. Taraflar bilgilendirilmiştir.',
    STATUS_UPDATED: 'Gönderi durumu başarıyla güncellenmiştir. İlgili taraflar bilgilendirilmiştir.',
    PICKUP_CONFIRMED: 'Yük alım işlemi onaylanmıştır. Takip sistemi güncellenmiştir.',
    TRANSIT_STARTED: 'Nakliye işlemi başlatılmıştır. Gönderici taraf bilgilendirilmiştir.',
    
    // Communication
    MESSAGE_SENT: 'Mesajınız başarıyla iletilmiştir.',
    CONVERSATION_DELETED: 'Mesaj geçmişi başarıyla kaldırılmıştır.',
    CONVERSATION_ARCHIVED: 'Mesaj geçmişi arşivlenmiştir.',
    CONVERSATION_UNARCHIVED: 'Mesaj geçmişi arşivden çıkarılmıştır.',
    
    // Account & Settings
    PROFILE_UPDATED: 'Profil bilgileriniz başarıyla güncellenmiştir.',
    PASSWORD_CHANGED: 'Şifreniz başarıyla değiştirilmiştir. Güvenliğiniz için tüm oturumlara yeniden giriş yapmanız önerilir.',
    SETTINGS_SAVED: 'Ayarlarınız başarıyla kaydedilmiştir.',
    
    // Job & Offer Management
    JOB_ACCEPTED: 'İş talebi kabul edilmiştir. Operasyon süreci başlamıştır.',
    JOB_REJECTED: 'İş talebi başarıyla reddedilmiştir.',
    OFFER_ACCEPTED: 'Teklif kabul edilmiştir. Taşıma süreci başlamıştır.',
    OFFER_REJECTED: 'Teklif reddedilmiştir. İlgili taraf bilgilendirilmiştir.',
    
    // Offline/Sync
    OFFLINE_SAVED: 'İşlem kaydedilmiştir. İnternet bağlantısı sağlandığında otomatik olarak gönderilecektir.',
    SYNC_COMPLETED: 'Bekleyen işlemleriniz başarıyla gönderilmiştir.',
    
    // Support & Contact
    SUPPORT_TICKET_CREATED: 'Destek talebiniz oluşturulmuştur. Destek ekibimiz en kısa sürede size dönüş yapacaktır.',
    FEEDBACK_SENT: 'Geri bildiriminiz alınmıştır. Değerlendirmeniz için teşekkür ederiz.',
    
    // General
    ACTION_COMPLETED: 'İşlem başarıyla tamamlanmıştır.',
    CHANGES_SAVED: 'Değişiklikleriniz kaydedilmiştir.'
  },

  // Error Messages - Professional and helpful
  ERROR: {
    // Network & Connection
    NETWORK_ERROR: 'Bağlantı sorunu tespit edilmiştir. Lütfen internet bağlantınızı kontrol ederek işlemi yeniden deneyiniz.',
    REQUEST_FAILED: 'İstek işlenememiştir. Lütfen birkaç dakika sonra tekrar deneyiniz.',
    SERVER_ERROR: 'Sistemsel bir sorun tespit edilmiştir. Teknik ekibimiz konuyla ilgileniyor.',
    TIMEOUT_ERROR: 'İşlem zaman aşımına uğramıştır. Lütfen sayfayı yenileyerek tekrar deneyiniz.',
    
    // Authentication & Authorization
    AUTH_REQUIRED: 'Bu işlemi gerçekleştirmek için oturum açmanız gerekmektedir.',
    SESSION_EXPIRED: 'Oturum süreniz dolmuştur. Güvenliğiniz için lütfen tekrar giriş yapınız.',
    PERMISSION_DENIED: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmamaktadır.',
    INVALID_CREDENTIALS: 'Kullanıcı bilgileriniz hatalıdır. Lütfen kontrol ederek tekrar deneyiniz.',
    
    // Validation & Input
    REQUIRED_FIELDS: 'Lütfen tüm zorunlu alanları eksiksiz doldurunuz.',
    INVALID_FORMAT: 'Girilen bilgi formatı geçersizdir. Lütfen doğru format kullanınız.',
    INVALID_AMOUNT: 'Lütfen geçerli bir tutar giriniz.',
    FILE_TOO_LARGE: 'Dosya boyutu izin verilen limitin üzerindedir. Lütfen daha küçük bir dosya seçiniz.',
    UNSUPPORTED_FILE: 'Seçilen dosya formatı desteklenmemektedir.',
    
    // Operations
    OPERATION_FAILED: 'İşlem gerçekleştirilememiştir. Lütfen tekrar deneyiniz.',
    SAVE_FAILED: 'Kaydetme işlemi başarısız olmuştur. Lütfen bilgilerinizi kontrol ederek tekrar deneyiniz.',
    DELETE_FAILED: 'Silme işlemi gerçekleştirilememiştir.',
    UPDATE_FAILED: 'Güncelleme işlemi başarısız olmuştur.',
    
    // Business Logic
    SHIPMENT_NOT_FOUND: 'Gönderi bulunamadı. Lütfen gönderi bilgilerinizi kontrol ediniz.',
    JOB_NOT_FOUND: 'İş talebi bulunamadı veya erişim yetkiniz bulunmamaktadır.',
    OFFER_EXPIRED: 'Teklif süresi dolmuştur. Lütfen yeni bir teklif oluşturunuz.',
    INSUFFICIENT_BALANCE: 'Yetersiz bakiye. Lütfen hesabınıza yeterli bakiye yükleyiniz.',
    
    // Generic
    UNKNOWN_ERROR: 'Beklenmeyen bir sorun oluşmuştur. Sorun devam ederse lütfen destek ekibimizle iletişime geçiniz.'
  },

  // Warning Messages - Informative and cautionary
  WARNING: {
    UNSAVED_CHANGES: 'Kaydedilmemiş değişiklikler bulunmaktadır. Sayfadan ayrılmadan önce değişiklikleri kaydetmeniz önerilir.',
    DATA_LOSS_WARNING: 'Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?',
    OFFLINE_MODE: 'İnternet bağlantısı bulunmamaktadır. Bazı özellikler sınırlı olabilir.',
    MAINTENANCE_MODE: 'Sistem bakımı nedeniyle bazı özellikler geçici olarak kullanılamayabilir.',
    LOCATION_REQUIRED: 'Bu özelliği kullanmak için konum erişimi gereklidir.',
    CAMERA_REQUIRED: 'Bu özelliği kullanmak için kamera erişimi gereklidir.',
    BETA_FEATURE: 'Bu özellik beta aşamasındadır. Karşılaştığınız sorunları lütfen bildirin.'
  },

  // Info Messages - Informative and helpful
  INFO: {
    LOADING: 'Bilgiler yükleniyor, lütfen bekleyiniz...',
    PROCESSING: 'İşleminiz gerçekleştiriliyor, lütfen bekleyiniz...',
    EMAIL_SENT: 'E-posta adresinize bilgilendirme mesajı gönderilmiştir.',
    VERIFICATION_SENT: 'Doğrulama kodu gönderilmiştir. Lütfen e-posta veya SMS\'inizi kontrol ediniz.',
    UPDATE_AVAILABLE: 'Yeni sürüm mevcuttur. Sayfayı yenileyerek güncelleyebilirsiniz.',
    FEATURE_COMING_SOON: 'Bu özellik yakında kullanıma sunulacaktır.',
    DOCUMENTATION_LINK: 'Detaylı bilgi için dokümantasyon sayfasını ziyaret edebilirsiniz.',
    CONTACT_SUPPORT: 'Sorunuz için destek ekibimizle iletişime geçebilirsiniz.'
  }
};

// Toast display helper functions
export const getToastConfig = (type: 'success' | 'error' | 'warning' | 'info') => {
  const configs = {
    success: {
      duration: 4000,
      position: 'top-right' as const,
      style: {
        background: '#10b981',
        color: '#ffffff',
        fontWeight: '500',
      }
    },
    error: {
      duration: 6000,
      position: 'top-right' as const,
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontWeight: '500',
      }
    },
    warning: {
      duration: 5000,
      position: 'top-right' as const,
      style: {
        background: '#f59e0b',
        color: '#ffffff',
        fontWeight: '500',
      }
    },
    info: {
      duration: 4000,
      position: 'top-right' as const,
      style: {
        background: '#3b82f6',
        color: '#ffffff',
        fontWeight: '500',
      }
    }
  };

  return configs[type];
};

// Professional toast helper function - Updated for useToast hook
export const showProfessionalToast = (
  showToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; duration?: number }) => void,
  messageKey: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  customMessage?: string
) => {
  const messages = TOAST_MESSAGES[type.toUpperCase() as keyof typeof TOAST_MESSAGES];
  const message = customMessage || (messages as any)[messageKey] || TOAST_MESSAGES.ERROR.UNKNOWN_ERROR;
  const config = getToastConfig(type);
  
  showToast({
    type,
    title: type === 'success' ? 'Başarılı' : type === 'error' ? 'Hata' : type === 'warning' ? 'Uyarı' : 'Bilgi',
    message,
    duration: config.duration,
  });
};