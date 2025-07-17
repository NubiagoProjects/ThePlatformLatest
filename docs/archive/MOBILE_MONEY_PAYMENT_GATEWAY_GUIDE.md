# 🚀 NubiaGo Mobile Money Payment Gateway

## Enterprise-Level Mobile Money & Crypto Payment System

A comprehensive payment gateway integrating Yellow Card for seamless Mobile Money to cryptocurrency conversion across African markets.

### 🌍 **Supported Markets & Providers**

#### **Nigeria (NGN)**
- **MTN Mobile Money** - *165# • 5min processing • 0.5% fee
- **Airtel Money** - *432# • 5min processing • 0.4% fee
- **Yellow Card Integration** - Crypto conversion • USDT/USDC support

#### **Kenya (KES)**
- **M-Pesa** - *334# • 3min processing • 0.3% fee • Market leader
- **Airtel Money** - *432# • 5min processing • 0.4% fee
- **Yellow Card Integration** - Instant crypto conversion

#### **Uganda (UGX)**
- **MTN Mobile Money** - *165# • 5min processing • 0.5% fee
- **Airtel Money** - *432# • 5min processing • 0.4% fee
- **Yellow Card Integration** - Cross-border support

#### **Tanzania (TZS)**
- **Vodacom M-Pesa** - *150*00# • 5min processing • 0.5% fee
- **Tigo Cash** - *150*01# • 7min processing • 0.6% fee
- **Airtel Money** - *150*60# • 5min processing • 0.4% fee

#### **Ghana (GHS)**
- **MTN Mobile Money** - *170# • 5min processing • 0.5% fee
- **Vodafone Cash** - *110# • 5min processing • 0.5% fee
- **AirtelTigo Money** - *100# • 5min processing • 0.4% fee

---

## 🏗️ **System Architecture**

### **Backend API Structure**
```
backend/
├── src/
│   ├── controllers/
│   │   ├── paymentController.ts      # Payment processing logic
│   │   ├── supabaseAuthController.ts # Supabase authentication
│   │   └── uploadController.ts       # File upload handling
│   ├── services/
│   │   ├── walletService.ts          # Stablecoin wallet management
│   │   └── storageService.ts         # File storage with Supabase
│   ├── middleware/
│   │   ├── paymentSecurity.ts        # Fraud detection & compliance
│   │   ├── supabaseAuth.ts           # Authentication middleware
│   │   └── validation.ts             # Enhanced request validation
│   ├── routes/
│   │   └── payments.ts               # Payment API endpoints
│   └── config/
│       └── supabase.ts               # Supabase configuration
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Core e-commerce schema
│   │   └── 002_payment_system.sql    # Payment & wallet schema
│   └── functions/
│       ├── place-order/              # Order processing Edge Function
│       └── send-order-confirmation/  # Email notification function
└── scripts/
    └── deploy.sh                     # Production deployment script
```

### **Frontend Payment Module**
```
src/modules/payments/
├── components/
│   ├── PaymentGateway.tsx            # Main payment component
│   ├── PaymentMethodSelector.tsx     # Provider selection UI
│   ├── MobileMoneyFlow.tsx           # Mobile Money payment flow
│   ├── CryptoConversion.tsx          # Conversion rate display
│   ├── PaymentStatus.tsx             # Transaction status tracking
│   ├── WalletBalance.tsx             # Multi-currency wallet display
│   └── TransactionHistory.tsx        # Payment history
├── hooks/
│   ├── usePaymentMethods.ts          # Payment providers management
│   ├── usePaymentIntent.ts           # Transaction state management
│   ├── useWalletBalance.ts           # Wallet balance hooks
│   └── useExchangeRates.ts           # Real-time rate fetching
├── services/
│   ├── paymentAPI.ts                 # API communication layer
│   └── yellowCardService.ts          # Yellow Card integration
├── constants/
│   ├── countries.ts                  # Country-specific configurations
│   ├── currencies.ts                 # Currency definitions
│   └── providers.ts                  # Mobile Money provider data
└── types.ts                          # TypeScript definitions
```

---

## 🔧 **Setup & Installation**

### **1. Environment Configuration**

Create `.env` file in the backend directory:

```bash
# Application
NODE_ENV=production
PORT=5000
API_BASE_URL=https://api.nubiago.com
FRONTEND_URL=https://nubiago.com

# Supabase Configuration
SUPABASE_URL=https://gwcngnbugrfavejmvcnq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Y25nbmJ1Z3JmYXZlam12Y25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjUzMTQsImV4cCI6MjA2ODI0MTMxNH0.OHozj3ERsXyih5QYM1rc7hfqFZWvfhofx8uR344WcXU
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres.gwcngnbugrfavejmvcnq:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Yellow Card API
YELLOWCARD_API_KEY=your_yellowcard_api_key
YELLOWCARD_SECRET_KEY=your_yellowcard_secret_key
YELLOWCARD_BASE_URL=https://api.yellowcard.io
YELLOWCARD_WEBHOOK_SECRET=your_webhook_secret

# Security
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-secret-key-32-chars-minimum
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **2. Database Setup**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref gwcngnbugrfavejmvcnq

# Run migrations
supabase db push
```

### **3. Backend Installation**

```bash
cd backend
npm install

# Install additional dependencies
npm install @supabase/supabase-js zod slugify express-fileupload

# Build the application
npm run build

# Start development server
npm run dev

# Or start production server
npm start
```

### **4. Frontend Integration**

```bash
cd ../
npm install @supabase/supabase-js framer-motion lucide-react

# Add to your Next.js environment variables
echo "NEXT_PUBLIC_SUPABASE_URL=https://gwcngnbugrfavejmvcnq.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." >> .env.local
```

---

## 💳 **Payment Flow Implementation**

### **1. Basic Payment Integration**

```tsx
import { PaymentGateway } from '@/modules/payments';

function CheckoutPage() {
  return (
    <PaymentGateway
      amount={10000}
      currency="NGN"
      onSuccess={(paymentIntent) => {
        console.log('Payment successful:', paymentIntent);
        // Redirect to success page
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
        // Show error message
      }}
    />
  );
}
```

### **2. Advanced Payment with Order**

```tsx
import { PaymentGateway } from '@/modules/payments';

function OrderCheckout({ orderId, totalAmount }) {
  const handlePaymentSuccess = async (paymentIntent) => {
    // Update order status
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: paymentIntent.id,
        status: 'PAID'
      })
    });
    
    // Redirect to order confirmation
    router.push(`/orders/${orderId}/confirmation`);
  };

  return (
    <PaymentGateway
      orderId={orderId}
      amount={totalAmount}
      currency="NGN"
      onSuccess={handlePaymentSuccess}
      onError={(error) => {
        toast.error(`Payment failed: ${error}`);
      }}
    />
  );
}
```

### **3. Wallet Top-up Integration**

```tsx
import { PaymentGateway } from '@/modules/payments';

function WalletTopUp() {
  const [amount, setAmount] = useState(0);
  const [targetCurrency, setTargetCurrency] = useState('USDT');

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Enter amount in NGN"
      />
      
      <select
        value={targetCurrency}
        onChange={(e) => setTargetCurrency(e.target.value)}
      >
        <option value="USDT">USDT</option>
        <option value="USDC">USDC</option>
        <option value="BUSD">BUSD</option>
      </select>

      <PaymentGateway
        amount={amount}
        currency="NGN"
        targetCurrency={targetCurrency}
        onSuccess={(paymentIntent) => {
          toast.success('Wallet topped up successfully!');
          // Refresh wallet balance
        }}
      />
    </div>
  );
}
```

---

## 🔐 **Security Features**

### **Fraud Detection**
- **Real-time Risk Scoring** - AI-powered transaction analysis
- **Velocity Checks** - Rapid transaction pattern detection
- **Amount Anomaly Detection** - Unusual spending pattern alerts
- **Device Fingerprinting** - Browser/device behavior analysis
- **IP Geolocation** - Suspicious location detection
- **Manual Review Queue** - High-risk transaction review

### **Compliance & Monitoring**
- **AML Compliance** - Anti-Money Laundering checks
- **Transaction Limits** - Daily/monthly spending limits
- **Audit Trails** - Complete transaction logging
- **Real-time Alerts** - Suspicious activity notifications
- **Regulatory Reporting** - Compliance report generation

### **Data Protection**
- **Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure token-based auth
- **Webhook Signature Verification** - Provider callback security
- **Input Validation** - Comprehensive request sanitization
- **Rate Limiting** - API abuse prevention

---

## 📊 **API Endpoints**

### **Payment Methods**
```http
GET /api/payments/methods?country=NG
```

### **Exchange Rates**
```http
GET /api/payments/rates?from=NGN&to=USDT
```

### **Create Payment Intent**
```http
POST /api/payments/intents
Content-Type: application/json
Authorization: Bearer {token}

{
  "amount": 10000,
  "currency": "NGN",
  "targetCurrency": "USDT",
  "paymentMethodId": "uuid",
  "customerInfo": {
    "phone": "+2348012345678",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### **Check Payment Status**
```http
GET /api/payments/intents/{id}
Authorization: Bearer {token}
```

### **Wallet Balances**
```http
GET /api/payments/wallets
Authorization: Bearer {token}
```

### **Transaction History**
```http
GET /api/payments/transactions?limit=20&currency=USDT
Authorization: Bearer {token}
```

### **Create Withdrawal**
```http
POST /api/payments/withdrawals
Authorization: Bearer {token}

{
  "amount": 100,
  "currency": "USDT",
  "destinationAddress": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  "network": "TRC20"
}
```

---

## 🚀 **Production Deployment**

### **Docker Deployment**
```bash
# Build and deploy with Docker
cd backend
docker-compose up -d --build

# Check services
docker-compose ps

# View logs
docker-compose logs -f api
```

### **Supabase Setup**
```bash
# Deploy Edge Functions
supabase functions deploy place-order
supabase functions deploy send-order-confirmation

# Setup storage buckets
supabase storage create-bucket product-images --public
supabase storage create-bucket user-avatars --public
supabase storage create-bucket order-documents
```

### **Environment Variables**
Ensure all production environment variables are set:
- Supabase credentials
- Yellow Card API keys
- JWT secrets
- CORS origins
- Rate limiting configs
- Webhook URLs

---

## 📈 **Monitoring & Analytics**

### **Payment Metrics**
- **Transaction Volume** - Daily/monthly payment volumes
- **Success Rates** - Provider-specific success rates
- **Processing Times** - Average payment completion times
- **Currency Distribution** - Popular currency pairs
- **Country Analytics** - Geographic payment patterns

### **Security Monitoring**
- **Fraud Detection Rate** - Blocked fraudulent transactions
- **Risk Score Distribution** - Transaction risk analysis
- **Failed Attempts** - Payment failure patterns
- **Suspicious Activity** - Security incident tracking

### **Business Intelligence**
- **Revenue Analytics** - Payment fee revenue
- **User Behavior** - Payment method preferences
- **Market Analysis** - Country-specific insights
- **Provider Performance** - Mobile Money provider comparison

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Payment Failures**
```bash
# Check payment logs
docker-compose logs api | grep "payment"

# Verify Yellow Card connection
curl -X GET "https://api.yellowcard.io/v1/health" \
  -H "X-API-Key: your-api-key"

# Check database connection
supabase db ping
```

#### **Webhook Issues**
```bash
# Verify webhook signature
# Check webhook logs in Supabase dashboard
# Ensure webhook URL is accessible from Yellow Card
```

#### **Rate Limiting**
```bash
# Check rate limit logs
docker-compose logs api | grep "rate_limit"

# Adjust rate limits in environment variables
# Monitor Redis cache if used
```

### **Support Contacts**

- **Technical Support**: dev@nubiago.com
- **Yellow Card Support**: support@yellowcard.io
- **Supabase Support**: https://supabase.com/support
- **Emergency Hotline**: +234-XXX-XXXX-XXX

---

## 📚 **Additional Resources**

- [Yellow Card API Documentation](https://docs.yellowcard.io)
- [Supabase Documentation](https://supabase.com/docs)
- [Mobile Money Provider Guides](./docs/providers/)
- [Security Best Practices](./docs/security.md)
- [Compliance Guidelines](./docs/compliance.md)

---

**Built with ❤️ for African Financial Inclusion**

*Powered by Yellow Card • Secured by Supabase • Built for Scale* 