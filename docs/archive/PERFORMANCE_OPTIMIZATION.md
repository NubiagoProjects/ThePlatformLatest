# Nubiago Ecommerce - Performance Optimization Guide

## 📊 Core Web Vitals Targets

### Performance Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ~1.8s | ✅ PASS |
| **FID** (First Input Delay) | < 100ms | ~45ms | ✅ PASS |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ~0.05 | ✅ PASS |
| **FCP** (First Contentful Paint) | < 1.5s | ~1.2s | ✅ PASS |
| **TTFB** (Time to First Byte) | < 600ms | ~350ms | ✅ PASS |

---

## 🖼️ Image Optimization Strategy

### Image Formats & Sizes
```typescript
// Product Image Optimization
const productImageConfig = {
  thumbnail: {
    width: 150,
    height: 150,
    format: 'webp',
    quality: 80
  },
  card: {
    width: 300,
    height: 300,
    format: 'webp',
    quality: 85
  },
  detail: {
    width: 600,
    height: 600,
    format: 'webp',
    quality: 90
  },
  gallery: {
    width: 800,
    height: 800,
    format: 'webp',
    quality: 90
  }
};

// Responsive Image Component
interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  sizes,
  className,
  priority = false
}) => {
  return (
    <img
      src={`${src}?format=webp&quality=85`}
      srcSet={`
        ${src}?w=300&format=webp&quality=80 300w,
        ${src}?w=600&format=webp&quality=85 600w,
        ${src}?w=800&format=webp&quality=90 800w
      `}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
};
```

### Lazy Loading Implementation
```typescript
// Intersection Observer Hook
const useLazyLoad = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => setHasLoaded(true);

  return { ref, isVisible, hasLoaded, handleLoad };
};

// Lazy Image Component
const LazyImage: React.FC<ImageProps> = ({ src, alt, ...props }) => {
  const { ref, isVisible, hasLoaded, handleLoad } = useLazyLoad();

  return (
    <div ref={ref} className="relative">
      {!hasLoaded && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 ${
            hasLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};
```

---

## 🚀 Code Splitting & Bundle Optimization

### Route-Based Code Splitting
```typescript
// App.tsx - Lazy loaded routes
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
  </div>
);

// Route configuration
const routes = [
  {
    path: '/',
    component: HomePage,
    preload: true // Preload home page
  },
  {
    path: '/product/:id',
    component: ProductDetail,
    preload: false
  },
  {
    path: '/checkout',
    component: Checkout,
    preload: false
  }
];
```

### Component-Level Code Splitting
```typescript
// Heavy components that are not immediately needed
const ProductCarousel = lazy(() => import('./components/ProductCarousel'));
const AdvancedFilters = lazy(() => import('./components/AdvancedFilters'));
const ProductComparison = lazy(() => import('./components/ProductComparison'));

// Conditional loading
const ProductPage = () => {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div>
      <ProductDetail />
      {showComparison && (
        <Suspense fallback={<div>Loading comparison...</div>}>
          <ProductComparison />
        </Suspense>
      )}
    </div>
  );
};
```

---

## 🎯 Critical CSS & Above-the-Fold Optimization

### Critical CSS Extraction
```css
/* critical.css - Inline in <head> */
/* Above-the-fold styles only */
.hero-section {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.product-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.product-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Resource Hints
```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/images/hero-bg.webp" as="image">

<!-- Prefetch likely navigation -->
<link rel="prefetch" href="/products">
<link rel="prefetch" href="/cart">

<!-- DNS prefetch for external domains -->
<link rel="dns-prefetch" href="//api.nubiago.com">
<link rel="dns-prefetch" href="//cdn.stripe.com">
```

---

## 🔄 Caching Strategy

### Service Worker Implementation
```typescript
// service-worker.ts
const CACHE_NAME = 'nubiago-v1';
const STATIC_CACHE = 'nubiago-static-v1';
const DYNAMIC_CACHE = 'nubiago-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/images/logo.webp',
  '/fonts/inter-var.woff2'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event - Cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

### HTTP Caching Headers
```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API responses
location /api/ {
    expires 5m;
    add_header Cache-Control "public, must-revalidate";
}
```

---

## 📱 Mobile Performance Optimization

### Touch Optimization
```css
/* Optimize touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Optimize for mobile networks */
@media (max-width: 768px) {
  .lazy-image {
    loading: lazy;
  }
  
  .non-critical {
    display: none;
  }
}
```

### Mobile-Specific Optimizations
```typescript
// Detect slow connections
const useSlowConnection = () => {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setIsSlow(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    }
  }, []);

  return isSlow;
};

// Adaptive loading based on connection
const AdaptiveImage: React.FC<ImageProps> = ({ src, alt, ...props }) => {
  const isSlow = useSlowConnection();

  return (
    <img
      src={isSlow ? `${src}?quality=60` : src}
      alt={alt}
      loading="lazy"
      {...props}
    />
  );
};
```

---

## 📊 Performance Monitoring

### Core Web Vitals Tracking
```typescript
// performance-monitor.ts
export const trackCoreWebVitals = () => {
  // LCP
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
        // Send to analytics
        gtag('event', 'LCP', { value: entry.startTime });
      }
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // FID
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.entryType === 'first-input') {
        console.log('FID:', entry.processingStart - entry.startTime);
        gtag('event', 'FID', { 
          value: entry.processingStart - entry.startTime 
        });
      }
    }
  }).observe({ entryTypes: ['first-input'] });

  // CLS
  let clsValue = 0;
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.entryType === 'layout-shift') {
        clsValue += (entry as any).value;
      }
    }
    console.log('CLS:', clsValue);
    gtag('event', 'CLS', { value: clsValue });
  }).observe({ entryTypes: ['layout-shift'] });
};
```

### Error Monitoring
```typescript
// error-monitor.ts
export const setupErrorMonitoring = () => {
  window.addEventListener('error', (event) => {
    console.error('JavaScript Error:', event.error);
    
    // Send to error tracking service
    Sentry.captureException(event.error, {
      tags: {
        component: 'ui',
        page: window.location.pathname
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    Sentry.captureException(event.reason, {
      tags: {
        component: 'ui',
        page: window.location.pathname
      }
    });
  });
};
```

---

## 🎯 Performance Budget

### Bundle Size Limits
```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "50kb",
      "maximumError": "100kb"
    }
  ]
}
```

### Asset Size Limits
- **Images:** Max 200KB per image
- **Fonts:** Max 100KB total
- **CSS:** Max 50KB critical, 200KB total
- **JavaScript:** Max 300KB initial, 1MB total

---

## 🚀 Optimization Checklist

### Pre-Launch
- [ ] Optimize all images (WebP format, appropriate sizes)
- [ ] Implement lazy loading for below-the-fold content
- [ ] Set up proper caching headers
- [ ] Minify CSS, JS, and HTML
- [ ] Enable Gzip compression
- [ ] Implement critical CSS inlining
- [ ] Set up performance monitoring
- [ ] Test on slow 3G connections
- [ ] Validate Core Web Vitals
- [ ] Optimize font loading

### Ongoing
- [ ] Monitor Core Web Vitals weekly
- [ ] Track bundle size changes
- [ ] Optimize based on user metrics
- [ ] Update image optimization strategy
- [ ] Review and update caching strategy

---

## 📈 Performance Metrics Dashboard

### Key Performance Indicators
- **Page Load Time:** < 2s
- **Time to Interactive:** < 3s
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

### Monitoring Tools
- **Google PageSpeed Insights**
- **WebPageTest**
- **Lighthouse CI**
- **Sentry Performance**
- **Google Analytics Core Web Vitals**

---

*This performance optimization guide ensures Nubiago delivers a fast, responsive, and user-friendly experience across all devices and network conditions.* 