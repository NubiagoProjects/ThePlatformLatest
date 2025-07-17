import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { securityLogger } from './logger';
import crypto from 'crypto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

interface SecurityAlert {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  data: any;
}

interface TransactionRisk {
  score: number; // 0-100
  factors: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
}

export class PaymentSecurityService {
  // Fraud detection patterns
  private static suspiciousPatterns = {
    rapidTransactions: 5, // 5 transactions in 5 minutes
    largeAmount: 1000000, // Large transaction threshold
    multipleFailures: 3, // Multiple failed attempts
    velocityCheck: 10, // 10 transactions per hour
    unusualAmount: 0.9 // 90% variance from user's average
  };

  /**
   * Verify payment webhook signature
   */
  static verifyWebhookSignature = (secret: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const signature = req.headers['x-signature'] || req.headers['x-yellowcard-signature'];
        const payload = JSON.stringify(req.body);
        
        if (!signature) {
          securityLogger.logSuspiciousActivity(req, 'missing_webhook_signature', {
            headers: req.headers,
            body: req.body
          });
          
          return res.status(401).json({
            success: false,
            error: { message: 'Missing signature', code: 'MISSING_SIGNATURE' }
          });
        }
        
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');
        
        const providedSignature = Array.isArray(signature) ? signature[0] : signature;
        const isValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(providedSignature.replace('sha256=', ''), 'hex')
        );
        
        if (!isValid) {
          securityLogger.logSuspiciousActivity(req, 'invalid_webhook_signature', {
            provided: providedSignature,
            expected: expectedSignature.substring(0, 8) + '...'
          });
          
          return res.status(401).json({
            success: false,
            error: { message: 'Invalid signature', code: 'INVALID_SIGNATURE' }
          });
        }
        
        next();
      } catch (error) {
        console.error('Webhook signature verification error:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Signature verification failed', code: 'VERIFICATION_ERROR' }
        });
      }
    };
  };

  /**
   * Payment fraud detection middleware
   */
  static detectFraud = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { amount, currency, paymentMethodId } = req.body;
      
      if (!userId || !amount) {
        return next();
      }
      
      const riskAssessment = await PaymentSecurityService.assessTransactionRisk(
        userId,
        amount,
        currency,
        paymentMethodId,
        req
      );
      
      // Log risk assessment
      await supabaseAdmin
        .from('payment_security_logs')
        .insert({
          user_id: userId,
          risk_score: riskAssessment.score,
          risk_factors: riskAssessment.factors,
          recommendation: riskAssessment.recommendation,
          transaction_data: {
            amount,
            currency,
            paymentMethodId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      
      // Handle high risk transactions
      if (riskAssessment.score >= 80) {
        securityLogger.logSuspiciousActivity(req, 'high_risk_transaction', {
          userId,
          riskScore: riskAssessment.score,
          factors: riskAssessment.factors,
          amount,
          currency
        });
        
        if (riskAssessment.recommendation === 'REJECT') {
          return res.status(403).json({
            success: false,
            error: {
              message: 'Transaction blocked for security reasons',
              code: 'SECURITY_BLOCK',
              riskScore: riskAssessment.score
            }
          });
        }
        
        if (riskAssessment.recommendation === 'REVIEW') {
          // Queue for manual review
          await PaymentSecurityService.queueForReview(userId, req.body, riskAssessment);
          
          return res.status(202).json({
            success: false,
            error: {
              message: 'Transaction requires additional verification',
              code: 'MANUAL_REVIEW_REQUIRED',
              estimatedReviewTime: '1-24 hours'
            }
          });
        }
      }
      
      // Add risk assessment to request for further processing
      (req as any).riskAssessment = riskAssessment;
      next();
      
    } catch (error) {
      console.error('Fraud detection error:', error);
      next(); // Continue with transaction on error
    }
  };

  /**
   * Assess transaction risk score
   */
  private static async assessTransactionRisk(
    userId: string,
    amount: number,
    currency: string,
    paymentMethodId: string,
    req: Request
  ): Promise<TransactionRisk> {
    let riskScore = 0;
    const riskFactors: string[] = [];
    
    try {
      // Get user transaction history
      const { data: recentTransactions } = await supabaseAdmin
        .from('payment_intents')
        .select('amount, created_at, status')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      // Get user profile
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('created_at, role')
        .eq('id', userId)
        .single();
      
      // Factor 1: Rapid transactions
      const last5MinTransactions = recentTransactions?.filter(tx => 
        new Date(tx.created_at) > new Date(Date.now() - 5 * 60 * 1000)
      ) || [];
      
      if (last5MinTransactions.length >= PaymentSecurityService.suspiciousPatterns.rapidTransactions) {
        riskScore += 25;
        riskFactors.push('rapid_transactions');
      }
      
      // Factor 2: Large amount
      if (amount >= PaymentSecurityService.suspiciousPatterns.largeAmount) {
        riskScore += 20;
        riskFactors.push('large_amount');
      }
      
      // Factor 3: New user
      if (userProfile && new Date(userProfile.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        riskScore += 15;
        riskFactors.push('new_user');
      }
      
      // Factor 4: Transaction velocity
      const hourlyTransactions = recentTransactions?.filter(tx => 
        new Date(tx.created_at) > new Date(Date.now() - 60 * 60 * 1000)
      ) || [];
      
      if (hourlyTransactions.length >= PaymentSecurityService.suspiciousPatterns.velocityCheck) {
        riskScore += 30;
        riskFactors.push('high_velocity');
      }
      
      // Factor 5: Failed attempts
      const failedAttempts = recentTransactions?.filter(tx => 
        tx.status === 'FAILED' && 
        new Date(tx.created_at) > new Date(Date.now() - 60 * 60 * 1000)
      ) || [];
      
      if (failedAttempts.length >= PaymentSecurityService.suspiciousPatterns.multipleFailures) {
        riskScore += 20;
        riskFactors.push('multiple_failures');
      }
      
      // Factor 6: Unusual amount pattern
      if (recentTransactions && recentTransactions.length > 0) {
        const avgAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) / recentTransactions.length;
        const variance = Math.abs(amount - avgAmount) / avgAmount;
        
        if (variance >= PaymentSecurityService.suspiciousPatterns.unusualAmount) {
          riskScore += 15;
          riskFactors.push('unusual_amount');
        }
      }
      
      // Factor 7: Geolocation risk (basic IP check)
      const suspiciousIPs = await PaymentSecurityService.checkSuspiciousIP(req.ip);
      if (suspiciousIPs) {
        riskScore += 25;
        riskFactors.push('suspicious_ip');
      }
      
      // Factor 8: Device fingerprinting
      const deviceRisk = await PaymentSecurityService.assessDeviceRisk(req);
      riskScore += deviceRisk.score;
      riskFactors.push(...deviceRisk.factors);
      
      // Determine recommendation
      let recommendation: 'APPROVE' | 'REVIEW' | 'REJECT' = 'APPROVE';
      
      if (riskScore >= 90) {
        recommendation = 'REJECT';
      } else if (riskScore >= 60) {
        recommendation = 'REVIEW';
      }
      
      return {
        score: Math.min(riskScore, 100),
        factors: riskFactors,
        recommendation
      };
      
    } catch (error) {
      console.error('Risk assessment error:', error);
      return {
        score: 50, // Medium risk on error
        factors: ['assessment_error'],
        recommendation: 'REVIEW'
      };
    }
  }

  /**
   * Check if IP is suspicious
   */
  private static async checkSuspiciousIP(ip: string): Promise<boolean> {
    try {
      // Check against known suspicious IPs
      const { data: suspiciousIP } = await supabaseAdmin
        .from('suspicious_ips')
        .select('id')
        .eq('ip_address', ip)
        .single();
      
      return !!suspiciousIP;
    } catch (error) {
      return false;
    }
  }

  /**
   * Assess device risk based on headers
   */
  private static async assessDeviceRisk(req: Request): Promise<{ score: number; factors: string[] }> {
    let score = 0;
    const factors: string[] = [];
    
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    // Check for automation indicators
    if (userAgent.toLowerCase().includes('bot') || 
        userAgent.toLowerCase().includes('crawler') ||
        userAgent.toLowerCase().includes('spider')) {
      score += 40;
      factors.push('automated_user_agent');
    }
    
    // Check for missing common headers
    if (!req.get('Accept') || !req.get('Accept-Encoding')) {
      score += 20;
      factors.push('missing_headers');
    }
    
    // Check for suspicious user agents
    if (userAgent.length < 20 || userAgent.length > 500) {
      score += 15;
      factors.push('unusual_user_agent');
    }
    
    return { score, factors };
  }

  /**
   * Queue transaction for manual review
   */
  private static async queueForReview(userId: string, transactionData: any, riskAssessment: TransactionRisk): Promise<void> {
    try {
      await supabaseAdmin
        .from('manual_review_queue')
        .insert({
          user_id: userId,
          transaction_data: transactionData,
          risk_score: riskAssessment.score,
          risk_factors: riskAssessment.factors,
          status: 'PENDING',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error queuing for review:', error);
    }
  }

  /**
   * Monitor transaction patterns
   */
  static monitorTransactionPatterns = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return next();
      }
      
      // Monitor for patterns in the background (don't block request)
      setImmediate(async () => {
        try {
          await PaymentSecurityService.analyzeUserBehavior(userId, req);
        } catch (error) {
          console.error('Pattern monitoring error:', error);
        }
      });
      
      next();
    } catch (error) {
      console.error('Transaction monitoring error:', error);
      next();
    }
  };

  /**
   * Analyze user behavior patterns
   */
  private static async analyzeUserBehavior(userId: string, req: Request): Promise<void> {
    try {
      const { data: transactions } = await supabaseAdmin
        .from('payment_intents')
        .select('amount, created_at, status, metadata')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (!transactions || transactions.length === 0) {
        return;
      }
      
      const alerts: SecurityAlert[] = [];
      
      // Check for unusual timing patterns
      const timePattern = PaymentSecurityService.analyzeTimingPattern(transactions);
      if (timePattern.suspicious) {
        alerts.push({
          level: 'MEDIUM',
          type: 'unusual_timing_pattern',
          message: 'User showing unusual transaction timing patterns',
          data: timePattern
        });
      }
      
      // Check for amount patterns
      const amountPattern = PaymentSecurityService.analyzeAmountPattern(transactions);
      if (amountPattern.suspicious) {
        alerts.push({
          level: 'MEDIUM',
          type: 'unusual_amount_pattern',
          message: 'User showing unusual transaction amount patterns',
          data: amountPattern
        });
      }
      
      // Store alerts
      for (const alert of alerts) {
        await supabaseAdmin
          .from('security_alerts')
          .insert({
            user_id: userId,
            level: alert.level,
            type: alert.type,
            message: alert.message,
            data: alert.data,
            created_at: new Date().toISOString()
          });
      }
      
    } catch (error) {
      console.error('Behavior analysis error:', error);
    }
  }

  /**
   * Analyze transaction timing patterns
   */
  private static analyzeTimingPattern(transactions: any[]): { suspicious: boolean; pattern: string } {
    if (transactions.length < 5) {
      return { suspicious: false, pattern: 'insufficient_data' };
    }
    
    const intervals = [];
    for (let i = 1; i < transactions.length; i++) {
      const interval = new Date(transactions[i-1].created_at).getTime() - new Date(transactions[i].created_at).getTime();
      intervals.push(interval);
    }
    
    // Check for very regular intervals (possible automation)
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // If standard deviation is very low compared to average, it might be automated
    const coefficientOfVariation = stdDev / avgInterval;
    
    if (coefficientOfVariation < 0.1 && avgInterval < 5 * 60 * 1000) { // Very regular, under 5 minutes
      return { suspicious: true, pattern: 'automated_regular_intervals' };
    }
    
    return { suspicious: false, pattern: 'normal' };
  }

  /**
   * Analyze transaction amount patterns
   */
  private static analyzeAmountPattern(transactions: any[]): { suspicious: boolean; pattern: string } {
    if (transactions.length < 3) {
      return { suspicious: false, pattern: 'insufficient_data' };
    }
    
    const amounts = transactions.map(tx => tx.amount);
    
    // Check for identical amounts (possible testing/automation)
    const uniqueAmounts = new Set(amounts);
    if (uniqueAmounts.size === 1 && amounts.length >= 5) {
      return { suspicious: true, pattern: 'identical_amounts' };
    }
    
    // Check for round numbers only
    const roundNumbers = amounts.filter(amount => amount % 1000 === 0);
    if (roundNumbers.length === amounts.length && amounts.length >= 5) {
      return { suspicious: true, pattern: 'only_round_numbers' };
    }
    
    return { suspicious: false, pattern: 'normal' };
  }

  /**
   * Rate limiting for payment endpoints
   */
  static paymentRateLimit = (maxRequests: number = 10, windowMs: number = 60000) => {
    const requests = new Map<string, { count: number; resetTime: number }>();
    
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = req.user?.id || req.ip;
      const now = Date.now();
      const userRequests = requests.get(userId);
      
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(userId, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (userRequests.count >= maxRequests) {
        securityLogger.logRateLimit(req);
        
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many payment requests',
            code: 'PAYMENT_RATE_LIMIT',
            retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
          }
        });
      }
      
      userRequests.count++;
      next();
    };
  };

  /**
   * Validate payment amount limits
   */
  static validateAmountLimits = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, currency } = req.body;
      const userId = req.user?.id;
      
      if (!amount || !currency || !userId) {
        return next();
      }
      
      // Get user's daily limit
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role, created_at')
        .eq('id', userId)
        .single();
      
      // Calculate daily limit based on user role and account age
      let dailyLimit = 100000; // Default limit
      
      if (user) {
        const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
        
        if (user.role === 'ADMIN') {
          dailyLimit = 10000000; // 10M for admin
        } else if (user.role === 'SUPPLIER') {
          dailyLimit = 1000000; // 1M for suppliers
        } else if (accountAge >= 30) {
          dailyLimit = 500000; // 500K for users over 30 days
        } else if (accountAge >= 7) {
          dailyLimit = 200000; // 200K for users over 7 days
        } else {
          dailyLimit = 50000; // 50K for new users
        }
      }
      
      // Check today's total
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayTransactions } = await supabaseAdmin
        .from('payment_intents')
        .select('amount')
        .eq('user_id', userId)
        .eq('currency', currency)
        .gte('created_at', today.toISOString())
        .eq('status', 'COMPLETED');
      
      const todayTotal = todayTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
      
      if (todayTotal + amount > dailyLimit) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Daily limit exceeded. Limit: ${dailyLimit}, Used: ${todayTotal}`,
            code: 'DAILY_LIMIT_EXCEEDED',
            dailyLimit,
            usedToday: todayTotal,
            remaining: dailyLimit - todayTotal
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Amount validation error:', error);
      next(); // Continue on error
    }
  };
}

export default PaymentSecurityService; 