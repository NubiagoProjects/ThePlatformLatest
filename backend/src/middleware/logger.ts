import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

// Custom token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.id || 'anonymous';
});

// Custom token for request duration
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '0ms';
});

// Custom token for request body size
morgan.token('req-size', (req) => {
  const contentLength = req.get('content-length');
  return contentLength || '0';
});

// Custom token for response body size
morgan.token('res-size', (req, res) => {
  const contentLength = res.get('content-length');
  return contentLength || '0';
});

// Custom token for IP address
morgan.token('real-ip', (req) => {
  return req.ip || req.connection.remoteAddress || 'unknown';
});

// Production logging format
const productionFormat = ':real-ip - :user-id [:date[iso]] ":method :url HTTP/:http-version" :status :res-size ":referrer" ":user-agent" :response-time-ms';

// Development logging format
const developmentFormat = ':method :url :status :response-time ms - :res[content-length] - :user-id';

// Enhanced logging format for debugging
const debugFormat = '[:date[iso]] :real-ip :method :url :status :response-time ms - req: :req-size bytes, res: :res-size bytes - user: :user-id - ":user-agent"';

// Create logger based on environment
export const createLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return morgan(productionFormat, {
        stream: {
          write: (message) => {
            // In production, you might want to send logs to external service
            // like CloudWatch, Datadog, or ELK stack
            console.log(message.trim());
          }
        },
        skip: (req, res) => {
          // Skip logging for health checks and successful requests under 400ms
          return req.url === '/health' || (res.statusCode < 400 && res.getHeader('X-Response-Time') < 400);
        }
      });
    
    case 'test':
      return morgan('tiny', {
        stream: {
          write: () => {} // Silent during tests
        }
      });
    
    case 'debug':
      return morgan(debugFormat);
    
    default:
      return morgan(developmentFormat);
  }
};

// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', duration);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// Request ID middleware for tracing
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   Math.random().toString(36).substr(2, 9);
  
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Enhanced error logging
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'];
  const userId = (req as any).user?.id;
  
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    },
    body: process.env.NODE_ENV === 'production' ? undefined : req.body,
    params: req.params,
    query: req.query
  };
  
  // Log error (in production, send to external logging service)
  console.error('API Error:', JSON.stringify(errorLog, null, 2));
  
  next(error);
};

// API access logger for analytics
export const apiAccessLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for certain endpoints
  if (req.url === '/health' || req.url === '/favicon.ico') {
    return next();
  }
  
  const accessLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    userId: (req as any).user?.id,
    requestId: req.headers['x-request-id']
  };
  
  // In production, you might want to store this in a database or analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('API Access:', JSON.stringify(accessLog));
  }
  
  next();
};

// Security event logger
export const securityLogger = {
  logAuthAttempt: (req: Request, email: string, success: boolean, reason?: string) => {
    const securityLog = {
      event: 'auth_attempt',
      timestamp: new Date().toISOString(),
      email,
      success,
      reason,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id']
    };
    
    console.log('Security Event:', JSON.stringify(securityLog));
  },
  
  logSuspiciousActivity: (req: Request, event: string, details: any) => {
    const securityLog = {
      event: 'suspicious_activity',
      type: event,
      timestamp: new Date().toISOString(),
      details,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      requestId: req.headers['x-request-id']
    };
    
    console.warn('Security Alert:', JSON.stringify(securityLog));
  },
  
  logRateLimit: (req: Request) => {
    const securityLog = {
      event: 'rate_limit_exceeded',
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      requestId: req.headers['x-request-id']
    };
    
    console.warn('Rate Limit:', JSON.stringify(securityLog));
  }
}; 