import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder
} from '../controllers/orders';

const router = express.Router();

// @route   GET /api/orders
// @desc    Get user orders with pagination and filtering
// @access  Private
router.get('/', authenticate, getOrders);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/:id', authenticate, getOrder);

// @route   POST /api/orders
// @desc    Create an order
// @access  Private (Users)
router.post('/', authenticate, createOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Supplier/Admin)
// @access  Private
router.put('/:id/status', authenticate, authorize('SUPPLIER', 'ADMIN'), updateOrderStatus);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order (User owns order or Admin)
// @access  Private
router.put('/:id/cancel', authenticate, cancelOrder);

export default router; 