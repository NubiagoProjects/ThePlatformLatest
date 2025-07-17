import { z } from 'zod';

// Authentication validation schemas
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  role: z.enum(['USER', 'SUPPLIER', 'ADMIN']).optional()
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number')
});

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  price: z.number()
    .positive('Price must be positive')
    .max(999999, 'Price must be less than 999,999'),
  comparePrice: z.number()
    .positive('Compare price must be positive')
    .max(999999, 'Compare price must be less than 999,999')
    .optional(),
  cost: z.number()
    .positive('Cost must be positive')
    .max(999999, 'Cost must be less than 999,999')
    .optional(),
  categoryId: z.string()
    .min(1, 'Category is required'),
  images: z.array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative')
    .default(0),
  trackQuantity: z.boolean().default(true),
  sku: z.string()
    .max(50, 'SKU must be less than 50 characters')
    .optional(),
  barcode: z.string()
    .max(50, 'Barcode must be less than 50 characters')
    .optional(),
  weight: z.number()
    .positive('Weight must be positive')
    .optional(),
  tags: z.array(z.string().max(30, 'Tag must be less than 30 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const updateProductSchema = createProductSchema.partial().extend({
  slug: z.string().optional()
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  tags: z.string().optional(), // comma-separated tags
  sortBy: z.enum(['name', 'price', 'createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  supplierId: z.string().optional()
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  image: z.string().url('Invalid image URL').optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  slug: z.string().optional()
});

// Order validation schemas
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100')
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(50, 'Order cannot contain more than 50 items'),
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  billingAddressId: z.string().optional(),
  paymentMethod: z.enum(['credit_card', 'paypal', 'apple_pay', 'google_pay'])
    .default('credit_card'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  trackingNumber: z.string()
    .max(100, 'Tracking number must be less than 100 characters')
    .optional(),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: z.string().optional(), // For admin/supplier queries
  supplierId: z.string().optional() // For filtering by supplier
});

// User validation schemas
export const updateUserProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]{10,20}$/, 'Invalid phone number format')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
});

// Address validation schemas
export const createAddressSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  company: z.string()
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  address1: z.string()
    .min(1, 'Address line 1 is required')
    .max(200, 'Address line 1 must be less than 200 characters'),
  address2: z.string()
    .max(200, 'Address line 2 must be less than 200 characters')
    .optional(),
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  province: z.string()
    .min(1, 'Province/State is required')
    .max(100, 'Province/State must be less than 100 characters'),
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters'),
  zip: z.string()
    .min(1, 'ZIP/Postal code is required')
    .max(20, 'ZIP/Postal code must be less than 20 characters'),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]{10,20}$/, 'Invalid phone number format')
    .optional(),
  isDefault: z.boolean().default(false)
});

export const updateAddressSchema = createAddressSchema.partial();

// Supplier Profile validation schemas
export const createSupplierProfileSchema = z.object({
  companyName: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  website: z.string().url('Invalid website URL').optional(),
  logo: z.string().url('Invalid logo URL').optional()
});

export const updateSupplierProfileSchema = createSupplierProfileSchema.partial();

// Review validation schemas
export const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  title: z.string()
    .max(100, 'Review title must be less than 100 characters')
    .optional(),
  comment: z.string()
    .max(1000, 'Review comment must be less than 1000 characters')
    .optional()
});

export const updateReviewSchema = createReviewSchema.partial();

// Generic validation helpers
export const validateId = z.string().min(1, 'Invalid ID');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Helper function to validate request data
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}; 