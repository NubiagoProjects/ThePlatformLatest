import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Test users data (same as in create-users.js)
const testUsers = [
  {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@nubiago.com',
    password: '$2a$12$qZWmWxmlmcv.7iB9MOyVuubIkaeboXeo7tZFDm0BUGCRwcLlSCSCe', // Admin@123456
    role: 'ADMIN',
    phone: '+2348012345678',
    isActive: true
  },
  {
    id: 'supplier-001',
    name: 'Supplier User',
    email: 'supplier@nubiago.com',
    password: '$2a$12$qZWmWxmlmcv.7iB9MOyVuubIkaeboXeo7tZFDm0BUGCRwcLlSCSCe', // Supplier@123456
    role: 'SUPPLIER',
    phone: '+2348023456789',
    isActive: true,
    supplierProfile: {
      companyName: 'TechMart Electronics',
      description: 'Leading electronics supplier with premium products',
      website: 'https://techmart.com',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200',
      isVerified: true,
      rating: 4.8
    }
  },
  {
    id: 'user-001',
    name: 'Customer User',
    email: 'customer@nubiago.com',
    password: '$2a$12$iPY2fn1NsoTuAhpLCbFsKu/5vAiPJn/MsBnPMJBRWS4c20cTGw/FK', // Customer@123456
    role: 'USER',
    phone: '+2348034567890',
    isActive: true
  }
];

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

// Generate JWT token
const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '24h'
  });
};

// Test login endpoint
export const testLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      });
    }

    // Find user
    const user = testUsers.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Account is deactivated' }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken: token
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Test authentication middleware
export const testAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Access token required' }
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key') as any;
    
    // Find user
    const user = testUsers.find(u => u.id === decoded.id);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: { message: 'Token expired' }
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid token' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Authentication error' }
      });
    }
  }
};

// Role-based authorization middleware
export const testAuthorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { 
          message: 'Access forbidden: insufficient permissions',
          requiredRoles: roles,
          userRole: req.user.role
        }
      });
      return;
    }

    next();
  };
};

// Convenience middleware
export const requireTestAuth = testAuthenticate;
export const requireTestAdmin = [testAuthenticate, testAuthorize('ADMIN')];
export const requireTestSupplier = [testAuthenticate, testAuthorize('SUPPLIER', 'ADMIN')];
export const requireTestUser = [testAuthenticate, testAuthorize('USER', 'SUPPLIER', 'ADMIN')];

// Get test users (for admin purposes)
export const getTestUsers = (req: Request, res: Response) => {
  const users = testUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }));

  res.json({
    success: true,
    data: users
  });
}; 