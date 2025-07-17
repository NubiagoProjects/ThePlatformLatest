import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getMe,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getUsers,
  getUser,
  updateUserStatus
} from '../controllers/users';

const router = express.Router();

// User profile routes
// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getMe);

// @route   PUT /api/users/me
// @desc    Update user profile
// @access  Private
router.put('/me', authenticate, updateProfile);

// Address management routes
// @route   GET /api/users/me/addresses
// @desc    Get user addresses
// @access  Private
router.get('/me/addresses', authenticate, getAddresses);

// @route   POST /api/users/me/addresses
// @desc    Create new address
// @access  Private
router.post('/me/addresses', authenticate, createAddress);

// @route   PUT /api/users/me/addresses/:id
// @desc    Update address
// @access  Private
router.put('/me/addresses/:id', authenticate, updateAddress);

// @route   DELETE /api/users/me/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/me/addresses/:id', authenticate, deleteAddress);

// Wishlist management routes
// @route   GET /api/users/me/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/me/wishlist', authenticate, getWishlist);

// @route   POST /api/users/me/wishlist
// @desc    Add product to wishlist
// @access  Private
router.post('/me/wishlist', authenticate, addToWishlist);

// @route   DELETE /api/users/me/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/me/wishlist/:productId', authenticate, removeFromWishlist);

// Admin routes
// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize('ADMIN'), getUsers);

// @route   GET /api/users/:id
// @desc    Get single user by ID (Admin only)
// @access  Private (Admin)
router.get('/:id', authenticate, authorize('ADMIN'), getUser);

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', authenticate, authorize('ADMIN'), updateUserStatus);

export default router; 