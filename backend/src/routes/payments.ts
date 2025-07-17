/**
 * Payment Routes - Fast API with exact payment_intents schema
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { paymentSecurityMiddleware } from '../middleware/paymentSecurity';

const router = Router();

// Apply security middleware
router.use(paymentSecurityMiddleware);

// Payment initiation - exact schema endpoint
router.post('/initiate', PaymentController.initiatePayment);

// Payment status check
router.get('/status/:transactionId', PaymentController.getPaymentStatus);

// Update payment status (for webhooks)
router.post('/update-status', PaymentController.updatePaymentStatus);

// Get user payments
router.get('/user/:userId', PaymentController.getUserPayments);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'payment-api',
    version: '1.0.0'
  });
});

export default router; 