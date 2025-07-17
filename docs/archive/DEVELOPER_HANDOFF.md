# Nubiago Ecommerce - Developer Handoff Package

## 📋 Project Overview

**Project:** Nubiago Ecommerce Platform  
**Version:** 1.0.0  
**Handoff Date:** July 16, 2024  
**Design Status:** ✅ Production Ready  
**Frontend Framework:** React + TypeScript + Vite  
**Styling:** Tailwind CSS  
**UI Library:** Custom Component Library  

---

## 🎯 Design System Implementation

### Color Tokens (CSS Variables)
```css
:root {
  /* Primary Colors */
  --color-primary-50: #fef2f2;
  --color-primary-100: #fee2e2;
  --color-primary-200: #fecaca;
  --color-primary-300: #fca5a5;
  --color-primary-400: #f87171;
  --color-primary-500: #ef4444;
  --color-primary-600: #dc2626;
  --color-primary-700: #b91c1c;
  --color-primary-800: #991b1b;
  --color-primary-900: #7f1d1d;

  /* Semantic Colors */
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  --color-secondary-600: #0284c7;

  /* Neutral Colors */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;

  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Typography Scale
```css
/* Font Sizes */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }

/* Font Weights */
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
```

---

## 🧩 Component Library

### Core Components

#### Button Component
```tsx
import { Button } from '@/components/ui/Button';

// Usage Examples
<Button variant="primary" size="md" loading={false}>
  Primary Action
</Button>

<Button variant="secondary" size="lg">
  Secondary Action
</Button>

<Button variant="ghost" disabled>
  Disabled Action
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean

#### Input Component
```tsx
import { Input } from '@/components/ui/Input';

// Usage Examples
<Input 
  label="Email Address"
  type="email"
  placeholder="your@email.com"
  error="Please enter a valid email"
/>

<Input 
  variant="search"
  placeholder="Search products..."
  leftIcon={<SearchIcon />}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `variant`: 'default' | 'search'

#### Card Component
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

// Usage Examples
<Card variant="elevated" padding="md">
  <CardHeader title="Product Name" subtitle="Category" />
  <CardContent>
    <p>Product description...</p>
  </CardContent>
  <CardFooter>
    <Button>Add to Cart</Button>
  </CardFooter>
</Card>
```

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined'
- `padding`: 'sm' | 'md' | 'lg' | 'none'
- `loading`: boolean
- `empty`: boolean

---

## 📱 Responsive Breakpoints

```css
/* Tailwind Breakpoints */
.xs: 320px+   /* Small mobile */
.sm: 640px+   /* Large mobile */
.md: 768px+   /* Tablet */
.lg: 1024px+  /* Desktop */
.xl: 1280px+  /* Large desktop */
.2xl: 1536px+ /* Extra large */
```

### Mobile-First Approach
- Start with mobile styles
- Use `md:` prefix for tablet and up
- Use `lg:` prefix for desktop and up

---

## 🎭 Animation System

### CSS Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { 
    transform: translateY(10px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

/* Scale In */
@keyframes scaleIn {
  from { 
    transform: scale(0.95);
    opacity: 0;
  }
  to { 
    transform: scale(1);
    opacity: 1;
  }
}
```

### Usage Classes
```css
.animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-scale-in { animation: scaleIn 0.2s ease-out; }
```

---

## 🔌 API Integration Plan

### Data Structures

#### Product Interface
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  brand: string;
  specifications: Record<string, string>;
  features: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### User Interface
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  addresses: Address[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}
```

#### Cart Interface
```typescript
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  updatedAt: string;
}
```

### API Endpoints

#### Products
```typescript
// Get all products
GET /api/products?page=1&limit=20&category=electronics&search=phone

// Get single product
GET /api/products/:id

// Get product categories
GET /api/categories

// Search products
GET /api/products/search?q=wireless+headphones
```

#### Authentication
```typescript
// Login
POST /api/auth/login
{
  email: string;
  password: string;
}

// Register
POST /api/auth/register
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Refresh token
POST /api/auth/refresh
```

#### Cart
```typescript
// Get user cart
GET /api/cart

// Add item to cart
POST /api/cart/items
{
  productId: string;
  quantity: number;
}

// Update cart item
PUT /api/cart/items/:id
{
  quantity: number;
}

// Remove cart item
DELETE /api/cart/items/:id
```

#### Orders
```typescript
// Create order
POST /api/orders
{
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
}

// Get user orders
GET /api/orders

// Get order details
GET /api/orders/:id
```

---

## 🚀 Performance Optimization

### Image Optimization
```typescript
// Image sizes for different contexts
const imageSizes = {
  thumbnail: '150x150',
  productCard: '300x300',
  productDetail: '600x600',
  hero: '1200x600',
  banner: '1920x400'
};

// WebP format with fallback
<img 
  src="product.webp" 
  srcSet="product-300.webp 300w, product-600.webp 600w"
  sizes="(max-width: 768px) 300px, 600px"
  alt="Product name"
/>
```

### Lazy Loading
```typescript
// Intersection Observer for lazy loading
const useLazyLoad = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};
```

### Code Splitting
```typescript
// Route-based code splitting
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));

// Component-based code splitting
const ProductCarousel = lazy(() => import('./components/ProductCarousel'));
```

---

## 🔒 Security Considerations

### Input Validation
```typescript
// Form validation with Zod
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});
```

### XSS Prevention
```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html);
};

// Use in components
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

### CSRF Protection
```typescript
// Include CSRF token in requests
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});
```

---

## 🧪 Testing Strategy

### Unit Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing
```typescript
// API integration testing
describe('Product API', () => {
  it('fetches products successfully', async () => {
    const products = await fetchProducts();
    expect(products).toHaveLength(20);
    expect(products[0]).toHaveProperty('id');
    expect(products[0]).toHaveProperty('name');
  });
});
```

### E2E Testing
```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test';

test('user can add product to cart', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
});
```

---

## 📦 Build & Deployment

### Environment Variables
```env
# .env.local
VITE_API_URL=http://localhost:3000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=https://...
```

### Build Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

---

## 📋 Development Checklist

### Pre-Development
- [ ] Review design system documentation
- [ ] Set up development environment
- [ ] Install dependencies
- [ ] Configure linting and formatting
- [ ] Set up testing framework

### Development
- [ ] Follow component library patterns
- [ ] Implement responsive design
- [ ] Add proper TypeScript types
- [ ] Include accessibility features
- [ ] Write unit tests
- [ ] Optimize performance

### Pre-Launch
- [ ] Run accessibility audit
- [ ] Test across browsers
- [ ] Optimize images and assets
- [ ] Configure analytics
- [ ] Set up error monitoring
- [ ] Performance testing

---

## 🎯 Success Metrics

### Performance Targets
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

### Accessibility Targets
- **WCAG 2.1 AA Compliance:** 100%
- **Keyboard Navigation:** 100% coverage
- **Screen Reader Compatibility:** 100%

### User Experience Targets
- **Cart Abandonment Rate:** < 70%
- **Checkout Completion Rate:** > 80%
- **Mobile Conversion Rate:** > 60%

---

## 📞 Support & Resources

### Documentation
- [Design System](./DESIGN_SYSTEM.md)
- [Accessibility Audit](./ACCESSIBILITY_AUDIT.md)
- [Component Library](./src/components/ui/)

### Tools & Libraries
- **React:** 18.3.1
- **TypeScript:** 5.5.4
- **Tailwind CSS:** 3.4.17
- **Vite:** 5.2.0
- **Lucide React:** 0.441.0

### Contact
- **Design Team:** design@nubiago.com
- **Development Team:** dev@nubiago.com
- **Project Manager:** pm@nubiago.com

---

*This handoff package ensures smooth transition from design to development while maintaining quality and consistency.* 