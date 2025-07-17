// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'supplier' | 'admin'
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Product types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  subcategory?: string
  brand: string
  sellerId: string
  sellerName: string
  rating: number
  reviewCount: number
  stock: number
  sku: string
  tags: string[]
  specifications: Record<string, string>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Cart types
export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  category: string
  sellerId: string
  sellerName: string
}

// Order types
export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  status: OrderStatus
  total: number
  subtotal: number
  tax: number
  shipping: number
  discount: number
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'bank_transfer'
  | 'cash_on_delivery'

// Address types
export interface Address {
  id: string
  userId: string
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

// Category types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  children?: Category[]
  productCount: number
  isActive: boolean
}

// Review types
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  images?: string[]
  isVerified: boolean
  helpfulCount: number
  createdAt: string
}

// Supplier types
export interface Supplier {
  id: string
  userId: string
  companyName: string
  description: string
  logo?: string
  banner?: string
  website?: string
  phone: string
  email: string
  address: Address
  categories: string[]
  rating: number
  reviewCount: number
  productCount: number
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: Pagination
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Form types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'user' | 'supplier'
  acceptTerms: boolean
}

export interface ProductForm {
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  subcategory?: string
  brand: string
  stock: number
  sku: string
  tags: string[]
  specifications: Record<string, string>
  images: File[]
}

// Filter types
export interface ProductFilters {
  category?: string
  subcategory?: string
  brand?: string[]
  priceRange?: [number, number]
  rating?: number
  inStock?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular'
}

// Search types
export interface SearchParams {
  q: string
  category?: string
  filters?: ProductFilters
  page?: number
  limit?: number
} 