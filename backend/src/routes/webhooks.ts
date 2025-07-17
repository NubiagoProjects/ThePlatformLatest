/**
 * Webhook Routes for Yellow Card Integration
 */

import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { raw } from 'body-parser';

const router = Router();

// Use raw body parser for webhook signature verification
router.use('/yellowcard', raw({ type: 'application/json' }));

// Yellow Card webhook endpoint
router.post('/yellowcard', WebhookController.processYellowCardWebhook);

// Admin webhook logs
router.get('/logs', WebhookController.getWebhookLogs);

// Retry payment
router.post('/retry/:paymentId', WebhookController.retryPayment);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'webhook-handler',
    timestamp: new Date().toISOString()
  });
});

export default router; 