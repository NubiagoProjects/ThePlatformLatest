import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categories';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories with optional hierarchy
// @access  Public
router.get('/', getCategories);

// @route   GET /api/categories/:slug
// @desc    Get single category by slug or ID
// @access  Public
router.get('/:slug', getCategory);

// @route   POST /api/categories
// @desc    Create new category (Admin only)
// @access  Private (Admin)
router.post('/', authenticate, authorize('ADMIN'), createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router; 