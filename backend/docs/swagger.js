const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YolNext Kargo API',
      version: '1.0.0',
      description: 'YolNext Kargo Platform API Documentation',
      contact: {
        name: 'YolNext Team',
        email: 'api@yolnext.com',
        url: 'https://yolnext.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.yolnext.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password', 'userType'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            userType: {
              type: 'string',
              enum: ['individual', 'corporate', 'nakliyeci', 'tasiyici'],
              description: 'User type'
            },
            companyName: {
              type: 'string',
              description: 'Company name (for corporate users)'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            isVerified: {
              type: 'boolean',
              description: 'User verification status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            }
          }
        },
        Shipment: {
          type: 'object',
          required: ['title', 'pickupAddress', 'deliveryAddress'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Shipment unique identifier'
            },
            title: {
              type: 'string',
              description: 'Shipment title'
            },
            description: {
              type: 'string',
              description: 'Shipment description'
            },
            category: {
              type: 'string',
              description: 'Shipment category'
            },
            weight: {
              type: 'number',
              format: 'float',
              description: 'Shipment weight in kg'
            },
            pickupAddress: {
              type: 'string',
              description: 'Pickup address'
            },
            deliveryAddress: {
              type: 'string',
              description: 'Delivery address'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Shipment price'
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'],
              description: 'Shipment status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Shipment creation timestamp'
            }
          }
        },
        Offer: {
          type: 'object',
          required: ['shipmentId', 'price'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Offer unique identifier'
            },
            shipmentId: {
              type: 'string',
              format: 'uuid',
              description: 'Related shipment ID'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Offer price'
            },
            message: {
              type: 'string',
              description: 'Offer message'
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected', 'expired'],
              description: 'Offer status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Offer creation timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
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
    ]
  },
  apis: ['./routes/*.js', './app.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};


