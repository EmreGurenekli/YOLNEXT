const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YolNext Kargo Pazaryeri API',
      version: '2.0.0',
      description: 'Türkiye\'nin en kapsamlı kargo pazaryeri platformu API dokümantasyonu',
      contact: {
        name: 'YolNext API Support',
        email: 'api@YolNext.com',
        url: 'https://YolNext.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.YolNext.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'first_name', 'last_name', 'user_type'],
          properties: {
            id: {
              type: 'integer',
              description: 'Kullanıcı ID'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'Kullanıcı UUID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-posta adresi'
            },
            first_name: {
              type: 'string',
              description: 'Ad'
            },
            last_name: {
              type: 'string',
              description: 'Soyad'
            },
            phone: {
              type: 'string',
              description: 'Telefon numarası'
            },
            user_type: {
              type: 'string',
              enum: ['individual', 'corporate', 'carrier', 'driver'],
              description: 'Kullanıcı tipi'
            },
            company_name: {
              type: 'string',
              description: 'Şirket adı'
            },
            is_verified: {
              type: 'boolean',
              description: 'Doğrulama durumu'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            }
          }
        },
        Shipment: {
          type: 'object',
          required: ['title', 'pickup_address', 'delivery_address', 'pickup_date', 'delivery_date'],
          properties: {
            id: {
              type: 'integer',
              description: 'Gönderi ID'
            },
            title: {
              type: 'string',
              description: 'Gönderi başlığı'
            },
            description: {
              type: 'string',
              description: 'Gönderi açıklaması'
            },
            category: {
              type: 'string',
              description: 'Kategori'
            },
            pickup_address: {
              type: 'string',
              description: 'Alış adresi'
            },
            pickup_city: {
              type: 'string',
              description: 'Alış şehri'
            },
            delivery_address: {
              type: 'string',
              description: 'Teslimat adresi'
            },
            delivery_city: {
              type: 'string',
              description: 'Teslimat şehri'
            },
            weight_kg: {
              type: 'number',
              description: 'Ağırlık (kg)'
            },
            budget_min: {
              type: 'number',
              description: 'Minimum bütçe'
            },
            budget_max: {
              type: 'number',
              description: 'Maksimum bütçe'
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'in_progress', 'completed', 'cancelled'],
              description: 'Gönderi durumu'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            }
          }
        },
        Offer: {
          type: 'object',
          required: ['shipment_id', 'carrier_id', 'price'],
          properties: {
            id: {
              type: 'integer',
              description: 'Teklif ID'
            },
            shipment_id: {
              type: 'integer',
              description: 'Gönderi ID'
            },
            carrier_id: {
              type: 'integer',
              description: 'Nakliyeci ID'
            },
            price: {
              type: 'number',
              description: 'Teklif fiyatı'
            },
            message: {
              type: 'string',
              description: 'Teklif mesajı'
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled'],
              description: 'Teklif durumu'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Sipariş ID'
            },
            shipment_id: {
              type: 'integer',
              description: 'Gönderi ID'
            },
            customer_id: {
              type: 'integer',
              description: 'Müşteri ID'
            },
            carrier_id: {
              type: 'integer',
              description: 'Nakliyeci ID'
            },
            total_amount: {
              type: 'number',
              description: 'Toplam tutar'
            },
            status: {
              type: 'string',
              enum: ['confirmed', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
              description: 'Sipariş durumu'
            },
            payment_status: {
              type: 'string',
              enum: ['pending', 'paid', 'refunded', 'disputed'],
              description: 'Ödeme durumu'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Hata mesajı'
                },
                code: {
                  type: 'string',
                  description: 'Hata kodu'
                },
                statusCode: {
                  type: 'integer',
                  description: 'HTTP durum kodu'
                },
                details: {
                  type: 'object',
                  description: 'Hata detayları'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Hata zamanı'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Başarı mesajı'
            },
            data: {
              type: 'object',
              description: 'Yanıt verisi'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Kimlik doğrulama gerekli',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Kimlik doğrulama gerekli',
                  code: 'AUTHENTICATION_ERROR',
                  statusCode: 401,
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Yetki yok',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Bu işlem için yetkiniz yok',
                  code: 'AUTHORIZATION_ERROR',
                  statusCode: 403,
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Kaynak bulunamadı',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Kaynak bulunamadı',
                  code: 'NOT_FOUND_ERROR',
                  statusCode: 404,
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Geçersiz veri',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Geçersiz veri',
                  code: 'VALIDATION_ERROR',
                  statusCode: 400,
                  details: {
                    field: 'email',
                    message: 'Geçerli bir e-posta adresi giriniz'
                  },
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit aşıldı',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Çok fazla istek gönderildi',
                  code: 'RATE_LIMIT_EXCEEDED',
                  statusCode: 429,
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Sunucu hatası',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  message: 'Sunucu hatası',
                  code: 'INTERNAL_SERVER_ERROR',
                  statusCode: 500,
                  timestamp: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Kimlik doğrulama işlemleri'
      },
      {
        name: 'Users',
        description: 'Kullanıcı yönetimi'
      },
      {
        name: 'Shipments',
        description: 'Gönderi yönetimi'
      },
      {
        name: 'Offers',
        description: 'Teklif yönetimi'
      },
      {
        name: 'Orders',
        description: 'Sipariş yönetimi'
      },
      {
        name: 'Payments',
        description: 'Ödeme işlemleri'
      },
      {
        name: 'Messaging',
        description: 'Mesajlaşma sistemi'
      },
      {
        name: 'Notifications',
        description: 'Bildirim sistemi'
      },
      {
        name: 'Analytics',
        description: 'Analitik ve raporlama'
      },
      {
        name: 'Health',
        description: 'Sistem sağlık kontrolü'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './routes/*.ts'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};



