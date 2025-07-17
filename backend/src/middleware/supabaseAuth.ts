import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    isActive: boolean;
  };
}

/**
 * Middleware to authenticate users using Supabase Auth
 */
export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          code: 'NO_ACCESS_TOKEN'
        }
      });
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired access token',
          code: 'INVALID_ACCESS_TOKEN'
        }
      });
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        }
      });
    }

    // Check if user account is active
    if (!userProfile.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Account is not active. Please verify your email.',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }

    // Attach user info to request
    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      name: userProfile.name,
      isActive: userProfile.is_active
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        }
      });
    }

    next();
  };
};

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware for supplier and admin routes
 */
export const requireSupplierOrAdmin = requireRole(['SUPPLIER', 'ADMIN']);

/**
 * Middleware for user, supplier, and admin routes (authenticated users)
 */
export const requireAuthenticated = requireRole(['USER', 'SUPPLIER', 'ADMIN']);

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user info
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return next(); // Continue without user info
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || !userProfile.is_active) {
      return next(); // Continue without user info
    }

    // Attach user info to request
    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      name: userProfile.name,
      isActive: userProfile.is_active
    };

    next();

  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without user info
  }
};

/**
 * Middleware to check if user owns the resource
 */
export const requireOwnership = (resourceIdParam: string = 'id', userIdField: string = 'user_id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      // Admin can access any resource
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Resource ID required',
            code: 'RESOURCE_ID_REQUIRED'
          }
        });
      }

      // Check ownership based on the route
      let tableName = '';
      let ownershipField = userIdField;

      // Determine table name from route
      if (req.route.path.includes('/orders')) {
        tableName = 'orders';
      } else if (req.route.path.includes('/addresses')) {
        tableName = 'addresses';
      } else if (req.route.path.includes('/products')) {
        tableName = 'products';
        ownershipField = 'supplier_id';
        
        // For products, check if user is the supplier
        const { data: product, error } = await supabaseAdmin
          .from('products')
          .select(`
            supplier_id,
            supplier_profiles!inner(user_id)
          `)
          .eq('id', resourceId)
          .single();

        if (error || !product) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Resource not found',
              code: 'RESOURCE_NOT_FOUND'
            }
          });
        }

        if (product.supplier_profiles.user_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: {
              message: 'You can only access your own resources',
              code: 'OWNERSHIP_REQUIRED'
            }
          });
        }

        return next();
      }

      if (!tableName) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Unable to determine resource type',
            code: 'INVALID_RESOURCE'
          }
        });
      }

      // Check ownership for other resources
      const { data: resource, error } = await supabaseAdmin
        .from(tableName)
        .select(ownershipField)
        .eq('id', resourceId)
        .single();

      if (error || !resource) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resource not found',
            code: 'RESOURCE_NOT_FOUND'
          }
        });
      }

      if (resource[ownershipField] !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own resources',
            code: 'OWNERSHIP_REQUIRED'
          }
        });
      }

      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Ownership verification failed',
          code: 'OWNERSHIP_CHECK_ERROR'
        }
      });
    }
  };
};

/**
 * Rate limiting by user ID
 */
export const userRateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const userLimit = userRequestCounts.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        }
      });
    }

    userLimit.count++;
    next();
  };
};

/**
 * Middleware to check if supplier is verified
 */
export const requireVerifiedSupplier = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'SUPPLIER') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Supplier access required',
          code: 'SUPPLIER_ACCESS_REQUIRED'
        }
      });
    }

    // Check if supplier is verified
    const { data: supplierProfile, error } = await supabaseAdmin
      .from('supplier_profiles')
      .select('is_verified')
      .eq('user_id', req.user.id)
      .single();

    if (error || !supplierProfile) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Supplier profile not found',
          code: 'SUPPLIER_PROFILE_NOT_FOUND'
        }
      });
    }

    if (!supplierProfile.is_verified) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Supplier verification required',
          code: 'SUPPLIER_NOT_VERIFIED'
        }
      });
    }

    next();

  } catch (error) {
    console.error('Supplier verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Supplier verification failed',
        code: 'VERIFICATION_ERROR'
      }
    });
  }
}; 