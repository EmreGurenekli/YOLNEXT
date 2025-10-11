const axios = require('axios');

class CargoIntegrationService {
  constructor() {
    // Gerçek kargo şirketleri API bilgileri
    this.cargoCompanies = {
      aras: {
        name: 'Aras Kargo',
        apiUrl: 'https://api.araskargo.com.tr',
        apiKey: process.env.ARAS_API_KEY,
        trackingUrl: 'https://www.araskargo.com.tr/takip'
      },
      yurtici: {
        name: 'Yurtiçi Kargo',
        apiUrl: 'https://api.yurticikargo.com',
        apiKey: process.env.YURTICI_API_KEY,
        trackingUrl: 'https://www.yurticikargo.com/tr/takip'
      },
      mng: {
        name: 'MNG Kargo',
        apiUrl: 'https://api.mngkargo.com.tr',
        apiKey: process.env.MNG_API_KEY,
        trackingUrl: 'https://www.mngkargo.com.tr/takip'
      },
      ups: {
        name: 'UPS Kargo',
        apiUrl: 'https://api.ups.com',
        apiKey: process.env.UPS_API_KEY,
        trackingUrl: 'https://www.ups.com/track'
      },
      dhl: {
        name: 'DHL Express',
        apiUrl: 'https://api.dhl.com',
        apiKey: process.env.DHL_API_KEY,
        trackingUrl: 'https://www.dhl.com/track'
      }
    };
  }

  // Kargo şirketi fiyat teklifi al
  async getPriceQuote(company, shipmentData) {
    try {
      const config = this.cargoCompanies[company];
      if (!config) {
        throw new Error('Desteklenmeyen kargo şirketi');
      }

      const requestData = {
        pickup_address: shipmentData.pickup_address,
        delivery_address: shipmentData.delivery_address,
        weight: shipmentData.weight_kg,
        volume: shipmentData.volume_m3,
        pickup_date: shipmentData.pickup_date,
        delivery_date: shipmentData.delivery_date,
        insurance_value: shipmentData.insurance_value || 0,
        special_requirements: shipmentData.special_requirements
      };

      const response = await axios.post(`${config.apiUrl}/api/price-quote`, requestData, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        company: config.name,
        price: response.data.price,
        currency: response.data.currency || 'TRY',
        estimated_delivery: response.data.estimated_delivery,
        service_type: response.data.service_type,
        tracking_number: response.data.tracking_number
      };

    } catch (error) {
      console.error(`${company} fiyat teklifi hatası:`, error.message);
      return {
        company: this.cargoCompanies[company].name,
        error: error.message,
        price: null
      };
    }
  }

  // Tüm kargo şirketlerinden fiyat karşılaştırması
  async comparePrices(shipmentData) {
    try {
      const companies = Object.keys(this.cargoCompanies);
      const promises = companies.map(company => this.getPriceQuote(company, shipmentData));
      
      const results = await Promise.allSettled(promises);
      
      const quotes = results
        .filter(result => result.status === 'fulfilled' && result.value.price)
        .map(result => result.value)
        .sort((a, b) => a.price - b.price);

      return {
        success: true,
        quotes,
        cheapest: quotes[0] || null,
        most_expensive: quotes[quotes.length - 1] || null
      };

    } catch (error) {
      console.error('Fiyat karşılaştırma hatası:', error);
      return {
        success: false,
        error: error.message,
        quotes: []
      };
    }
  }

  // Kargo gönderisi oluştur
  async createShipment(company, orderData) {
    try {
      const config = this.cargoCompanies[company];
      if (!config) {
        throw new Error('Desteklenmeyen kargo şirketi');
      }

      const requestData = {
        sender: {
          name: orderData.sender_name,
          company: orderData.sender_company,
          address: orderData.sender_address,
          city: orderData.sender_city,
          phone: orderData.sender_phone,
          email: orderData.sender_email
        },
        receiver: {
          name: orderData.receiver_name,
          company: orderData.receiver_company,
          address: orderData.receiver_address,
          city: orderData.receiver_city,
          phone: orderData.receiver_phone,
          email: orderData.receiver_email
        },
        package: {
          weight: orderData.weight_kg,
          volume: orderData.volume_m3,
          description: orderData.description,
          value: orderData.insurance_value || 0
        },
        service: {
          type: orderData.service_type || 'standard',
          pickup_date: orderData.pickup_date,
          delivery_date: orderData.delivery_date,
          special_instructions: orderData.special_requirements
        }
      };

      const response = await axios.post(`${config.apiUrl}/api/shipments`, requestData, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      return {
        success: true,
        company: config.name,
        tracking_number: response.data.tracking_number,
        shipment_id: response.data.shipment_id,
        label_url: response.data.label_url,
        estimated_delivery: response.data.estimated_delivery,
        price: response.data.price
      };

    } catch (error) {
      console.error(`${company} gönderi oluşturma hatası:`, error.message);
      return {
        success: false,
        company: this.cargoCompanies[company].name,
        error: error.message
      };
    }
  }

  // Kargo takip
  async trackShipment(company, trackingNumber) {
    try {
      const config = this.cargoCompanies[company];
      if (!config) {
        throw new Error('Desteklenmeyen kargo şirketi');
      }

      const response = await axios.get(`${config.apiUrl}/api/track/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 10000
      });

      return {
        success: true,
        company: config.name,
        tracking_number: trackingNumber,
        status: response.data.status,
        current_location: response.data.current_location,
        events: response.data.events || [],
        estimated_delivery: response.data.estimated_delivery,
        delivered_at: response.data.delivered_at
      };

    } catch (error) {
      console.error(`${company} takip hatası:`, error.message);
      return {
        success: false,
        company: this.cargoCompanies[company].name,
        tracking_number: trackingNumber,
        error: error.message
      };
    }
  }

  // Kargo iptal et
  async cancelShipment(company, trackingNumber) {
    try {
      const config = this.cargoCompanies[company];
      if (!config) {
        throw new Error('Desteklenmeyen kargo şirketi');
      }

      const response = await axios.post(`${config.apiUrl}/api/shipments/${trackingNumber}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        success: true,
        company: config.name,
        tracking_number: trackingNumber,
        cancellation_fee: response.data.cancellation_fee,
        refund_amount: response.data.refund_amount
      };

    } catch (error) {
      console.error(`${company} iptal hatası:`, error.message);
      return {
        success: false,
        company: this.cargoCompanies[company].name,
        tracking_number: trackingNumber,
        error: error.message
      };
    }
  }

  // Kargo şirketi servisleri
  async getAvailableServices(company) {
    try {
      const config = this.cargoCompanies[company];
      if (!config) {
        throw new Error('Desteklenmeyen kargo şirketi');
      }

      const response = await axios.get(`${config.apiUrl}/api/services`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 10000
      });

      return {
        success: true,
        company: config.name,
        services: response.data.services || []
      };

    } catch (error) {
      console.error(`${company} servis listesi hatası:`, error.message);
      return {
        success: false,
        company: this.cargoCompanies[company].name,
        error: error.message,
        services: []
      };
    }
  }

  // Desteklenen şehirler
  async getSupportedCities(company) {
    try {
      const config = this.cargoCompanies[company];
      if (!config) {
        throw new Error('Desteklenmeyen kargo şirketi');
      }

      const response = await axios.get(`${config.apiUrl}/api/cities`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 10000
      });

      return {
        success: true,
        company: config.name,
        cities: response.data.cities || []
      };

    } catch (error) {
      console.error(`${company} şehir listesi hatası:`, error.message);
      return {
        success: false,
        company: this.cargoCompanies[company].name,
        error: error.message,
        cities: []
      };
    }
  }

  // Kargo şirketi performans metrikleri
  async getCompanyPerformance(company) {
    try {
      const config = this.cargoCompanies[company];
      if (!config) {
        throw new Error('Desteklenmeyen kargo şirketi');
      }

      const response = await axios.get(`${config.apiUrl}/api/performance`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 10000
      });

      return {
        success: true,
        company: config.name,
        performance: {
          on_time_delivery: response.data.on_time_delivery || 0,
          customer_satisfaction: response.data.customer_satisfaction || 0,
          average_delivery_time: response.data.average_delivery_time || 0,
          success_rate: response.data.success_rate || 0
        }
      };

    } catch (error) {
      console.error(`${company} performans hatası:`, error.message);
      return {
        success: false,
        company: this.cargoCompanies[company].name,
        error: error.message
      };
    }
  }
}

module.exports = CargoIntegrationService;




