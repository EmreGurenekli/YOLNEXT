import { Router } from 'express'
import {
  createShipmentRequest,
  getShipmentRequests,
  getShipmentRequest,
  trackShipment,
  createOffer,
  getOffers,
  acceptOffer,
  rejectOffer,
  getCarriers,
  getShipmentStats,
  estimatePrice,
  calculateDistance,
  sendNotification,
  uploadFile
} from './shipmentController'

const router = Router()

// Nakliye talebi rotaları
router.post('/shipments', createShipmentRequest)
router.get('/shipments', getShipmentRequests)
router.get('/shipments/:id', getShipmentRequest)
router.get('/shipments/track/:trackingCode', trackShipment)
router.put('/shipments/:id', (req, res) => res.json({ message: 'Not implemented' }))
router.delete('/shipments/:id', (req, res) => res.json({ message: 'Not implemented' }))

// Teklif rotaları
router.post('/shipments/:shipmentId/offers', createOffer)
router.get('/shipments/:shipmentId/offers', getOffers)
router.post('/offers/:offerId/accept', acceptOffer)
router.post('/offers/:offerId/reject', rejectOffer)

// Taşıyıcı rotaları
router.get('/carriers', getCarriers)
router.get('/carriers/:id', (req, res) => res.json({ message: 'Not implemented' }))

// İstatistik rotaları
router.get('/shipments/stats', getShipmentStats)

// Yardımcı rotalar
router.post('/shipments/estimate-price', estimatePrice)
router.post('/shipments/calculate-distance', calculateDistance)
router.post('/shipments/:shipmentId/notifications', sendNotification)
router.post('/shipments/:shipmentId/upload', uploadFile)

export default router











