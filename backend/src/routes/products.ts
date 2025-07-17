import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/products';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with search, filtering, and pagination
// @access  Public
router.get('/', getProducts);

// @route   GET /api/products/:slug
// @desc    Get single product by slug or ID
// @access  Public
router.get('/:slug', getProduct);

// @route   POST /api/products
// @desc    Create a product (Supplier/Admin only)
// @access  Private
router.post('/', authenticate, authorize('SUPPLIER', 'ADMIN'), createProduct);

// @route   PUT /api/products/:id
// @desc    Update product (Supplier owns product or Admin)
// @access  Private
router.put('/:id', authenticate, authorize('SUPPLIER', 'ADMIN'), updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product (Supplier owns product or Admin)
// @access  Private
router.delete('/:id', authenticate, authorize('SUPPLIER', 'ADMIN'), deleteProduct);

export default router; 