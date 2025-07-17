/**
 * Comprehensive Security Middleware
 * Webhook signature verification, anti-fraud measures, rate limiting, and security enforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SecurityContext {
  ip: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  endpoint: string;
  method: string;
}

interface WebhookValidationResult {
  valid: boolean;
  source?: string;
  timestamp?: number;
  error?: string;
}

interface FraudCheckResult {
  riskScore: number;
  flags: string[];
  action: 'allow' | 'review' | 'block';
  reason?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export class SecurityMiddleware {
  private static readonly WEBHOOK_SECRETS = {
    yellowcard: process.env.YELLOWCARD_WEBHOOK_SECRET!,
    stripe: process.env.STRIPE_WEBHOOK_SECRET!,
    internal: process.env.INTERNAL_WEBHOOK_SECRET!
  };

  private static readonly RATE_LIMITS = {
    'api_general': { requests: 100, window: 3600 }, // 100 requests per hour
    'api_auth': { requests: 5, window: 300 }, // 5 auth attempts per 5 minutes
    'api_payments': { requests: 10, window: 600 }, // 10 payments per 10 minutes
    'api_webhooks': { requests: 1000, window: 3600 }, // 1000 webhooks per hour
    'api_withdrawals': { requests: 3, window: 3600 } // 3 withdrawals per hour
  };

  /**
   * Comprehensive webhook signature verification
   */
  static async verifyWebhookSignature(
    request: NextRequest,
    body: string,
    source: 'yellowcard' | 'stripe' | 'internal' = 'yellowcard'
  ): Promise<WebhookValidationResult> {
    try {
      const signature = request.headers.get('x-signature') || 
                       request.headers.get('x-yellowcard-signature') ||
                       request.headers.get('stripe-signature');
      
      const timestamp = request.headers.get('x-timestamp') || 
                       request.headers.get('x-yellowcard-timestamp');

      if (!signature) {
        await this.logSecurityEvent({
          eventType: 'invalid_signature',
          severity: 'medium',
          details: { error: 'Missing signature header', source },
          context: this.getSecurityContext(request)
        });
        return { valid: false, error: 'Missing signature' };
      }

      if (!timestamp) {
        await this.logSecurityEvent({
          eventType: 'invalid_signature',
          severity: 'medium',
          details: { error: 'Missing timestamp header', source },
          context: this.getSecurityContext(request)
        });
        return { valid: false, error: 'Missing timestamp' };
      }

      // Verify timestamp (prevent replay attacks)
      const webhookTimestamp = parseInt(timestamp);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeDifference = Math.abs(currentTimestamp - webhookTimestamp);
      
      if (timeDifference > 300) { // 5 minutes tolerance
        await this.logSecurityEvent({
          eventType: 'webhook_replay',
          severity: 'high',
          details: { 
            timeDifference, 
            webhookTimestamp, 
            currentTimestamp,
            source 
          },
          context: this.getSecurityContext(request)
        });
        return { valid: false, error: 'Timestamp too old' };
      }

      // Verify signature based on source
      const secret = this.WEBHOOK_SECRETS[source];
      if (!secret) {
        return { valid: false, error: 'Invalid webhook source' };
      }

      const isValid = this.verifyHMACSignature(body, signature, timestamp, secret);
      
      if (!isValid) {
        await this.logSecurityEvent({
          eventType: 'invalid_signature',
          severity: 'high',
          details: { source, signatureProvided: signature },
          context: this.getSecurityContext(request)
        });
      }

      return {
        valid: isValid,
        source,
        timestamp: webhookTimestamp
      };

    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }

  /**
   * HMAC signature verification
   */
  private static verifyHMACSignature(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      const providedSignature = signature.replace(/^sha256=/, '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('HMAC verification error:', error);
      return false;
    }
  }

  /**
   * Comprehensive fraud detection
   */
  static async performFraudCheck(
    userId: string,
    paymentData: {
      amount: number;
      currency: string;
      provider: string;
      phoneNumber: string;
      country: string;
    },
    context: SecurityContext
  ): Promise<FraudCheckResult> {
    try {
      let riskScore = 0;
      const flags: string[] = [];

      // Check for duplicate payments
      const isDuplicate = await this.checkDuplicatePayment(
        userId,
        paymentData.amount,
        paymentData.currency,
        paymentData.provider,
        paymentData.phoneNumber
      );

      if (isDuplicate) {
        riskScore += 50;
        flags.push('duplicate_payment');
      }

      // Check velocity (rapid transactions)
      const velocityScore = await this.checkTransactionVelocity(userId);
      riskScore += velocityScore;
      if (velocityScore > 20) {
        flags.push('high_velocity');
      }

      // Check unusual amount patterns
      const amountScore = await this.checkUnusualAmount(userId, paymentData.amount);
      riskScore += amountScore;
      if (amountScore > 15) {
        flags.push('unusual_amount');
      }

      // Check unusual location
      const locationScore = await this.checkUnusualLocation(userId, context.ip);
      riskScore += locationScore;
      if (locationScore > 25) {
        flags.push('unusual_location');
      }

      // Check device fingerprinting
      const deviceScore = await this.checkDeviceFingerprint(userId, context.userAgent);
      riskScore += deviceScore;
      if (deviceScore > 20) {
        flags.push('suspicious_device');
      }

      // Determine action based on risk score
      let action: 'allow' | 'review' | 'block' = 'allow';
      if (riskScore >= 80) {
        action = 'block';
      } else if (riskScore >= 50) {
        action = 'review';
      }

      // Log fraud check result
      await this.logSecurityEvent({
        eventType: 'suspicious_payment',
        severity: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
        details: {
          riskScore,
          flags,
          action,
          paymentAmount: paymentData.amount,
          paymentCurrency: paymentData.currency,
          provider: paymentData.provider
        },
        context,
        userId
      });

      return {
        riskScore: Math.min(riskScore, 100),
        flags,
        action,
        reason: flags.length > 0 ? `Triggered: ${flags.join(', ')}` : undefined
      };

    } catch (error) {
      console.error('Fraud check error:', error);
      return {
        riskScore: 50, // Default moderate risk on error
        flags: ['fraud_check_error'],
        action: 'review',
        reason: 'Fraud check system error'
      };
    }
  }

  /**
   * Rate limiting middleware
   */
  static async checkRateLimit(
    identifier: string,
    endpoint: string,
    customLimits?: { requests: number; window: number }
  ): Promise<RateLimitResult> {
    try {
      // Determine rate limit rules
      const limits = customLimits || this.getRateLimitForEndpoint(endpoint);
      
      // Check current usage
      const { data, error } = await supabase
        .rpc('check_rate_limit', {
          p_identifier: identifier,
          p_endpoint: endpoint,
          p_limit: limits.requests,
          p_window_minutes: Math.floor(limits.window / 60)
        });

      if (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true, remaining: limits.requests, resetTime: Date.now() + limits.window * 1000 };
      }

      const allowed = data[0]?.allowed ?? true;
      const remaining = Math.max(0, limits.requests - (data[0]?.current_count ?? 0));
      const resetTime = Date.now() + limits.window * 1000;

      if (!allowed) {
        await this.logSecurityEvent({
          eventType: 'rate_limit_exceeded',
          severity: 'medium',
          details: {
            identifier,
            endpoint,
            limit: limits.requests,
            window: limits.window
          },
          context: { ip: identifier, userAgent: '', endpoint, method: 'ANY' }
        });
      }

      return {
        allowed,
        remaining,
        resetTime,
        error: allowed ? undefined : 'Rate limit exceeded'
      };

    } catch (error) {
      console.error('Rate limiting error:', error);
      return { allowed: true, remaining: 0, resetTime: Date.now() };
    }
  }

  /**
   * Enforce Row Level Security (RLS) validation
   */
  static async validateRLSAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Define RLS rules for different resources
      const rlsRules = {
        'payment_intents': {
          read: 'user_id = auth.uid() OR auth.role = admin',
          write: 'user_id = auth.uid()',
          delete: 'auth.role = admin'
        },
        'withdrawal_requests': {
          read: 'user_id = auth.uid() OR auth.role = admin',
          write: 'user_id = auth.uid()',
          delete: 'auth.role = admin'
        },
        'user_wallets': {
          read: 'user_id = auth.uid() OR auth.role = admin',
          write: 'user_id = auth.uid() OR auth.role = admin',
          delete: 'auth.role = admin'
        }
      };

      // In a real implementation, this would check against actual Supabase RLS policies
      // For now, we'll do basic validation
      const resourceRules = rlsRules[resource as keyof typeof rlsRules];
      if (!resourceRules) {
        return false; // Unknown resource, deny access
      }

      // Basic ownership check for user resources
      if (resource.includes('user_') || ['payment_intents', 'withdrawal_requests'].includes(resource)) {
        const { data, error } = await supabase
          .from(resource)
          .select('user_id')
          .eq('id', resourceId)
          .single();

        if (error || !data) {
          return false;
        }

        return data.user_id === userId || await this.isAdmin(userId);
      }

      return true;

    } catch (error) {
      console.error('RLS validation error:', error);
      return false;
    }
  }

  /**
   * UUID validation middleware
   */
  static validateUUIDs(request: NextRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    try {
      // Check URL parameters for UUIDs
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      // Check common UUID parameters in path
      pathSegments.forEach((segment, index) => {
        // Skip non-UUID-like segments (too short or contains letters that aren't hex)
        if (segment.length !== 36 && segment.length !== 32) return;
        
        if (segment.includes('-') && !uuidRegex.test(segment)) {
          errors.push(`Invalid UUID in path segment ${index + 1}: ${segment}`);
        }
      });

      // Check query parameters
      url.searchParams.forEach((value, key) => {
        if (key.toLowerCase().includes('id') && value.length >= 32) {
          if (!uuidRegex.test(value)) {
            errors.push(`Invalid UUID in query parameter ${key}: ${value}`);
          }
        }
      });

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      return {
        valid: false,
        errors: ['UUID validation error']
      };
    }
  }

  /**
   * Helper methods
   */
  private static async checkDuplicatePayment(
    userId: string,
    amount: number,
    currency: string,
    provider: string,
    phoneNumber: string
  ): Promise<boolean> {
    const { data } = await supabase
      .rpc('detect_duplicate_payment', {
        p_user_id: userId,
        p_amount: amount,
        p_currency: currency,
        p_provider: provider,
        p_phone_number: phoneNumber,
        p_time_window_minutes: 5
      });

    return data?.[0] ?? false;
  }

  private static async checkTransactionVelocity(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false });

    if (error || !data) return 0;

    const transactionCount = data.length;
    if (transactionCount > 10) return 40;
    if (transactionCount > 5) return 25;
    if (transactionCount > 3) return 15;
    return 0;
  }

  private static async checkUnusualAmount(userId: string, amount: number): Promise<number> {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .limit(10);

    if (error || !data || data.length === 0) return 0;

    const amounts = data.map(p => p.amount);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // Check if current amount is significantly higher than usual
    if (amount > avgAmount * 5) return 30;
    if (amount > avgAmount * 3) return 20;
    if (amount > maxAmount * 2) return 15;
    return 0;
  }

  private static async checkUnusualLocation(userId: string, ip: string): Promise<number> {
    // In a real implementation, this would use GeoIP to check location patterns
    // For now, return a basic score
    return 0;
  }

  private static async checkDeviceFingerprint(userId: string, userAgent: string): Promise<number> {
    // In a real implementation, this would check against known device fingerprints
    // For now, return a basic score based on user agent patterns
    if (!userAgent || userAgent.length < 10) return 25;
    if (userAgent.includes('bot') || userAgent.includes('crawler')) return 50;
    return 0;
  }

  private static getRateLimitForEndpoint(endpoint: string): { requests: number; window: number } {
    for (const [key, limits] of Object.entries(this.RATE_LIMITS)) {
      if (endpoint.includes(key.replace('api_', ''))) {
        return limits;
      }
    }
    return this.RATE_LIMITS.api_general;
  }

  private static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    return !error && data?.role === 'admin';
  }

  private static getSecurityContext(request: NextRequest): SecurityContext {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    return {
      ip,
      userAgent: request.headers.get('user-agent') || '',
      endpoint: new URL(request.url).pathname,
      method: request.method,
      sessionId: request.headers.get('x-session-id') || undefined,
      userId: request.headers.get('x-user-id') || undefined
    };
  }

  private static async logSecurityEvent(event: {
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
    context: SecurityContext;
    userId?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('security_event_logs')
        .insert({
          event_type: event.eventType,
          severity: event.severity,
          user_id: event.userId,
          ip_address: event.context.ip,
          user_agent: event.context.userAgent,
          session_id: event.context.sessionId,
          details: event.details,
          risk_score: this.calculateRiskScore(event.eventType, event.severity)
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private static calculateRiskScore(eventType: string, severity: string): number {
    const baseScores = {
      low: 10,
      medium: 30,
      high: 70,
      critical: 90
    };

    const eventMultipliers = {
      'invalid_signature': 1.5,
      'webhook_replay': 1.3,
      'duplicate_payment': 1.2,
      'rate_limit_exceeded': 1.1,
      'suspicious_payment': 1.4,
      'unauthorized_access': 1.6
    };

    const baseScore = baseScores[severity as keyof typeof baseScores] || 10;
    const multiplier = eventMultipliers[eventType as keyof typeof eventMultipliers] || 1.0;

    return Math.min(Math.round(baseScore * multiplier), 100);
  }
}

/**
 * Express/Next.js middleware wrapper
 */
export function createSecurityMiddleware() {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const context = SecurityMiddleware['getSecurityContext'](request);

    try {
      // UUID validation
      const uuidValidation = SecurityMiddleware.validateUUIDs(request);
      if (!uuidValidation.valid) {
        await SecurityMiddleware['logSecurityEvent']({
          eventType: 'invalid_uuid',
          severity: 'medium',
          details: { errors: uuidValidation.errors },
          context
        });
        
        return NextResponse.json(
          { error: 'Invalid UUID format', details: uuidValidation.errors },
          { status: 400 }
        );
      }

      // Rate limiting
      const rateLimitResult = await SecurityMiddleware.checkRateLimit(
        context.ip,
        context.endpoint
      );

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            resetTime: rateLimitResult.resetTime
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        );
      }

      // Log API event
      await SecurityMiddleware['logApiEvent'](request, context, startTime);

      // Continue to next middleware/handler
      return NextResponse.next();

    } catch (error) {
      console.error('Security middleware error:', error);
      
      await SecurityMiddleware['logSecurityEvent']({
        eventType: 'middleware_error',
        severity: 'high',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        context
      });

      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      );
    }
  };
}

// Export specific functions for use in API routes
export const verifyWebhookSignature = SecurityMiddleware.verifyWebhookSignature.bind(SecurityMiddleware);
export const performFraudCheck = SecurityMiddleware.performFraudCheck.bind(SecurityMiddleware);
export const checkRateLimit = SecurityMiddleware.checkRateLimit.bind(SecurityMiddleware);
export const validateRLSAccess = SecurityMiddleware.validateRLSAccess.bind(SecurityMiddleware);
export const validateUUIDs = SecurityMiddleware.validateUUIDs.bind(SecurityMiddleware); 