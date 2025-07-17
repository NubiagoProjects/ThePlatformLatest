import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserOrders,
  getUserWishlist,
  getUserOverview,
  getUserAnalytics
} from '../controllers/userDashboard';

const router = express.Router();

// All routes require user authentication
router.use(authenticate);

// @route   GET /api/user/orders
// @desc    Get user's order history with details and analytics
// @access  Private (User)
router.get('/orders', getUserOrders);

// @route   GET /api/user/wishlist
// @desc    Get user's wishlist with product details and analytics
// @access  Private (User)
router.get('/wishlist', getUserWishlist);

// @route   GET /api/user/overview
// @desc    Get user dashboard overview with metrics
// @access  Private (User)
router.get('/overview', getUserOverview);

// @route   GET /api/user/analytics
// @desc    Get user's purchase analytics and spending patterns
// @access  Private (User)
router.get('/analytics', getUserAnalytics);

export default router; 