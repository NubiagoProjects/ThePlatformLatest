import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAdminMetrics,
  getAdminUsers,
  updateUserRole,
  getAdminActivities
} from '../controllers/adminDashboard';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

// @route   GET /api/admin/metrics
// @desc    Get comprehensive admin dashboard metrics
// @access  Private (Admin only)
router.get('/metrics', getAdminMetrics);

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin only)
router.get('/users', getAdminUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (USER, SUPPLIER, ADMIN)
// @access  Private (Admin only)
router.put('/users/:id/role', updateUserRole);

// @route   GET /api/admin/activities
// @desc    Get recent admin activities and system logs
// @access  Private (Admin only)
router.get('/activities', getAdminActivities);

export default router; 