import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSupplierProducts,
  getSupplierOrders,
  getSupplierOverview
} from '../controllers/supplierDashboard';

const router = express.Router();

// All routes require supplier authentication
router.use(authenticate);
router.use(authorize('SUPPLIER', 'ADMIN')); // Admin can also access supplier routes

// @route   GET /api/supplier/products
// @desc    Get supplier's product performance metrics
// @access  Private (Supplier/Admin only)
router.get('/products', getSupplierProducts);

// @route   GET /api/supplier/orders
// @desc    Get supplier's order fulfillment metrics
// @access  Private (Supplier/Admin only)
router.get('/orders', getSupplierOrders);

// @route   GET /api/supplier/overview
// @desc    Get supplier dashboard overview
// @access  Private (Supplier/Admin only)
router.get('/overview', getSupplierOverview);

export default router; 