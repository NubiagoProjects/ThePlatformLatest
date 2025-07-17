# Nubiago Design System

## 🎨 Color Palette

### Primary Colors
- **Primary-600** `#dc2626` - Main brand color (buttons, links, CTAs)
- **Primary-500** `#ef4444` - Hover states
- **Primary-700** `#b91c1c` - Active/pressed states
- **Primary-50** `#fef2f2` - Background tints

### Semantic Colors
- **Success-500** `#22c55e` - Success states, confirmations
- **Warning-500** `#f59e0b` - Warning states, alerts
- **Error-500** `#ef4444` - Error states, validation errors
- **Secondary-600** `#0284c7` - Secondary actions, info

### Neutral Colors
- **Neutral-900** `#171717` - Primary text
- **Neutral-700** `#404040` - Secondary text
- **Neutral-500** `#737373` - Placeholder text
- **Neutral-200** `#e5e5e5` - Borders, dividers
- **Neutral-50** `#fafafa` - Backgrounds

## 📝 Typography

### Font Sizes
- **xs**: 0.75rem (12px) - Captions, labels
- **sm**: 0.875rem (14px) - Small text, metadata
- **base**: 1rem (16px) - Body text
- **lg**: 1.125rem (18px) - Large body text
- **xl**: 1.25rem (20px) - Subheadings
- **2xl**: 1.5rem (24px) - Section headings
- **3xl**: 1.875rem (30px) - Page headings
- **4xl**: 2.25rem (36px) - Hero headings

### Font Weights
- **light**: 300 - Light text
- **normal**: 400 - Body text
- **medium**: 500 - Emphasis
- **semibold**: 600 - Subheadings
- **bold**: 700 - Headings
- **extrabold**: 800 - Hero text

## 📏 Spacing Scale

### Base Units
- **4px** (1rem) - Base unit
- **8px** (2rem) - Small spacing
- **16px** (4rem) - Medium spacing
- **24px** (6rem) - Large spacing
- **32px** (8rem) - Section spacing
- **48px** (12rem) - Page spacing

### Usage
- **p-4** (16px) - Component padding
- **m-6** (24px) - Component margins
- **gap-4** (16px) - Grid gaps
- **space-y-6** (24px) - Vertical spacing

## 🔲 Border Radius

- **none**: 0 - No radius
- **sm**: 0.125rem (2px) - Small elements
- **DEFAULT**: 0.25rem (4px) - Default radius
- **md**: 0.375rem (6px) - Medium elements
- **lg**: 0.5rem (8px) - Large elements
- **xl**: 0.75rem (12px) - Cards, modals
- **2xl**: 1rem (16px) - Large cards
- **full**: 9999px - Pills, buttons

## 🌟 Shadows

- **sm**: Subtle elevation
- **DEFAULT**: Default shadow
- **md**: Medium elevation (cards)
- **lg**: Large elevation (modals)
- **xl**: Extra large elevation
- **2xl**: Maximum elevation

## 📱 Breakpoints

- **xs**: 320px+ - Small mobile
- **sm**: 640px+ - Large mobile
- **md**: 768px+ - Tablet
- **lg**: 1024px+ - Desktop
- **xl**: 1280px+ - Large desktop
- **2xl**: 1536px+ - Extra large

## 🎭 Animations

- **fade-in**: 0.5s ease-in-out
- **slide-up**: 0.3s ease-out
- **slide-down**: 0.3s ease-out
- **scale-in**: 0.2s ease-out
- **bounce-gentle**: 0.6s ease-in-out

## 🧩 Component Library

### Buttons

#### Primary Button
```jsx
<button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
  Primary Action
</button>
```

#### Secondary Button
```jsx
<button className="bg-white text-primary-600 px-6 py-3 rounded-lg border border-primary-600 hover:bg-primary-50 transition-colors font-medium">
  Secondary Action
</button>
```

#### Ghost Button
```jsx
<button className="text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg transition-colors font-medium">
  Ghost Action
</button>
```

#### Disabled Button
```jsx
<button className="bg-neutral-200 text-neutral-500 px-6 py-3 rounded-lg cursor-not-allowed font-medium" disabled>
  Disabled Action
</button>
```

### Form Elements

#### Input Field
```jsx
<input 
  type="text" 
  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
  placeholder="Enter text..."
/>
```

#### Select Dropdown
```jsx
<select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent">
  <option>Select option</option>
</select>
```

#### Checkbox
```jsx
<input 
  type="checkbox" 
  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
/>
```

#### Radio Button
```jsx
<input 
  type="radio" 
  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
/>
```

### Cards

#### Product Card
```jsx
<div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
  <div className="h-48 overflow-hidden">
    <img src="product.jpg" alt="Product" className="w-full h-full object-cover" />
  </div>
  <div className="p-4">
    <h3 className="font-medium text-neutral-900 mb-2">Product Name</h3>
    <div className="flex justify-between items-center">
      <span className="text-lg font-bold text-neutral-900">$99.99</span>
      <button className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700">
        <ShoppingCartIcon size={18} />
      </button>
    </div>
  </div>
</div>
```

#### Info Card
```jsx
<div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
  <h3 className="text-xl font-semibold text-neutral-900 mb-4">Card Title</h3>
  <p className="text-neutral-600">Card content goes here...</p>
</div>
```

### Navigation

#### Header Navigation
```jsx
<nav className="flex items-center space-x-8">
  <Link to="/products" className="text-neutral-700 hover:text-primary-600 transition-colors font-medium">
    Shop
  </Link>
</nav>
```

#### Breadcrumbs
```jsx
<div className="flex items-center text-sm text-neutral-500">
  <Link to="/" className="hover:text-primary-600">Home</Link>
  <ChevronRightIcon size={16} className="mx-2" />
  <Link to="/products" className="hover:text-primary-600">Products</Link>
  <ChevronRightIcon size={16} className="mx-2" />
  <span className="text-neutral-700">Current Page</span>
</div>
```

## 🎯 Usage Guidelines

### Color Usage
- Use primary colors for CTAs and important actions
- Use semantic colors for feedback states
- Use neutral colors for text and backgrounds
- Maintain sufficient contrast ratios (4.5:1 minimum)

### Typography Usage
- Use consistent heading hierarchy (h1 → h2 → h3)
- Limit line length to 65-75 characters
- Use appropriate font weights for emphasis
- Maintain readable font sizes (minimum 14px)

### Spacing Usage
- Use consistent spacing throughout
- Group related elements with smaller spacing
- Separate sections with larger spacing
- Maintain visual rhythm

### Component Usage
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

## 🔧 CSS Variables

```css
:root {
  /* Colors */
  --color-primary-600: #dc2626;
  --color-primary-500: #ef4444;
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  
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

## 📋 Accessibility Checklist

- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements are keyboard accessible
- [ ] Proper heading hierarchy (h1, h2, h3...)
- [ ] Alt text for all images
- [ ] ARIA labels for complex components
- [ ] Focus indicators are visible
- [ ] Screen reader compatible
- [ ] Touch targets are at least 44px

## 🚀 Performance Guidelines

- Use CSS custom properties for theming
- Optimize images (WebP format, appropriate sizes)
- Implement lazy loading for images
- Use CSS animations instead of JavaScript
- Minimize CSS bundle size
- Use semantic HTML for better performance

---

*This design system ensures consistency, accessibility, and maintainability across the Nubiago ecommerce platform.* 