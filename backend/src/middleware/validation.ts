import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import rateLimit from 'express-rate-limit';
import { securityLogger } from './logger';

// Enhanced validation middleware
export const validateRequest = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validatedData = schema.parse(data);
      
      // Store validated data in request
      (req as any)[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log validation errors for security monitoring
        securityLogger.logSuspiciousActivity(req, 'validation_failure', {
          source,
          errors: error.issues,
          data: source === 'body' ? req.body : source === 'query' ? req.query : req.params
        });
        
        const formattedErrors = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          received: issue.received
        }));
        
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: formattedErrors
          }
        });
      }
      
      next(error);
    }
  };
};

// File upload validation
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [], maxFiles = 1 } = options;
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No files uploaded',
          code: 'NO_FILES'
        }
      });
    }
    
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Maximum ${maxFiles} files allowed`,
          code: 'TOO_MANY_FILES'
        }
      });
    }
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: {
            message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
            code: 'FILE_TOO_LARGE',
            fileName: file.name
          }
        });
      }
      
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `File type ${file.mimetype} not allowed`,
            code: 'INVALID_FILE_TYPE',
            fileName: file.name,
            allowedTypes
          }
        });
      }
    }
    
    next();
  };
};

// Enhanced rate limiting
export const createRateLimit = (options: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests from this IP',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;
  
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: {
        message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    onLimitReached: (req) => {
      securityLogger.logRateLimit(req);
    }
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many API requests'
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // 20 uploads per hour
  message: 'Too many file uploads'
});

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// SQL injection detection
export const detectSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)/i,
    /(or\s+1\s*=\s*1)/i,
    /(union\s+select)/i,
    /(['";]|--|\/\*|\*\/)/
  ];
  
  const checkForSQL = (value: string): boolean => {
    return sqlPatterns.some(pattern => pattern.test(value));
  };
  
  const scanObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkForSQL(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(scanObject);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(scanObject);
    }
    
    return false;
  };
  
  if (scanObject(req.body) || scanObject(req.query) || scanObject(req.params)) {
    securityLogger.logSuspiciousActivity(req, 'sql_injection_attempt', {
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid request format',
        code: 'INVALID_REQUEST'
      }
    });
  }
  
  next();
};

// Content type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type');
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid content type',
            code: 'INVALID_CONTENT_TYPE',
            allowed: allowedTypes
          }
        });
      }
    }
    
    next();
  };
};

// Request size validation
export const validateRequestSize = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: {
          message: 'Request too large',
          code: 'REQUEST_TOO_LARGE',
          maxSize: `${maxSize / (1024 * 1024)}MB`
        }
      });
    }
    
    next();
  };
}; 