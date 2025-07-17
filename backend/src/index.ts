import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Import custom middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import categoryRoutes from './routes/categories';

// Import test authentication
import { testLogin, getTestUsers } from './middleware/testAuth';

// Import dashboard routes
import adminDashboardRoutes from './routes/adminDashboard';
import supplierDashboardRoutes from './routes/supplierDashboard';
import userDashboardRoutes from './routes/userDashboard';

// Import payment and location routes
import paymentRoutes from './routes/payments';
import locationRoutes from './routes/location';
import webhookRoutes from './routes/webhooks';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware (default JSON parser)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test authentication routes (for development)
app.post('/api/test/login', testLogin);
app.get('/api/test/users', getTestUsers);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// Payment and location routes
app.use('/api/payments', paymentRoutes);
app.use('/api/location', locationRoutes);

// Webhook routes (with special body parsing)
app.use('/api/webhooks', webhookRoutes);

// Dashboard API routes
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/supplier', supplierDashboardRoutes);
app.use('/api/user', userDashboardRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Nubiago E-commerce API with Mobile Money & Crypto Payment Gateway',
    version: '2.0.0',
    documentation: '/api/docs',
    status: 'active',
    features: [
      'Mobile Money Integration (MTN, Airtel, M-Pesa, etc.)',
      'Yellow Card Crypto Gateway',
      'Stablecoin Wallet Management',
      'Multi-currency Support (NGN, KES, UGX, TZS, GHS)',
      'Real-time Exchange Rates',
      'Fraud Detection & Security',
      'Cross-border Payments',
      'GeoIP Location Detection',
      'Dynamic Provider Matching',
      'Secure Webhook Processing',
      'Admin Payment Monitoring'
    ],
    endpoints: {
      // Core endpoints
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      categories: '/api/categories',
      // Payment endpoints
      payments: '/api/payments',
      paymentMethods: '/api/payments/methods',
      exchangeRates: '/api/payments/rates',
      wallets: '/api/payments/wallets',
      // Location endpoints
      location: '/api/location',
      locationDetect: '/api/location/detect',
      providers: '/api/location/providers',
      // Webhook endpoints
      webhooks: '/api/webhooks',
      yellowcardWebhook: '/api/webhooks/yellowcard',
      webhookLogs: '/api/webhooks/logs',
      // Dashboard endpoints
      adminDashboard: '/api/admin',
      supplierDashboard: '/api/supplier',
      userDashboard: '/api/user'
    },
    supportedCountries: ['NG', 'KE', 'UG', 'GH', 'TZ', 'ZA', 'SN', 'BF', 'TG', 'CI', 'CM'],
    supportedCryptocurrencies: ['USDT', 'USDC', 'BUSD', 'DAI']
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nubiago Backend API running on port ${PORT}`);
  console.log(`📱 Mobile Money & Crypto Gateway Active`);
  console.log(`🌍 Multi-country Support: ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔒 Security middleware enabled`);
  console.log(`🔗 Webhook endpoints ready for Yellow Card integration`);
});

export default app; 