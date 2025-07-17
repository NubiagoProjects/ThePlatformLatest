import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  validateRequest,
  validateId
} from '../utils/validation';

const prisma = new PrismaClient();

// @desc    Get all products with search, filtering, and pagination
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const validation = validateRequest(productQuerySchema, req.query);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Invalid query parameters', 
        details: validation.errors.issues 
      }
    });
  }

  const {
    page,
    limit,
    search,
    category,
    minPrice,
    maxPrice,
    tags,
    sortBy,
    sortOrder,
    inStock,
    featured,
    supplierId
  } = validation.data;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    isActive: true
  };

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } }
    ];
  }

  // Category filter
  if (category) {
    where.OR = [
      { category: { slug: category } },
      { category: { id: category } }
    ];
  }

  // Price filters
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    where.tags = { hasSome: tagArray };
  }

  // Stock filter
  if (inStock !== undefined) {
    if (inStock) {
      where.quantity = { gt: 0 };
    } else {
      where.quantity = { equals: 0 };
    }
  }

  // Featured filter
  if (featured !== undefined) {
    where.isFeatured = featured;
  }

  // Supplier filter
  if (supplierId) {
    where.supplierId = supplierId;
  }

  // Build orderBy clause
  const orderBy: any = {};
  if (sortBy === 'rating') {
    // Calculate average rating in the query
    orderBy.reviews = { _count: sortOrder };
  } else {
    orderBy[sortBy] = sortOrder;
  }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          supplier: {
            select: {
              id: true,
              companyName: true,
              rating: true,
              isVerified: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true,
              wishlistItems: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product._count.reviews,
        wishlistCount: product._count.wishlistItems,
        reviews: undefined, // Remove reviews array from response
        _count: undefined
      };
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        products: productsWithRating,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNext,
          hasPrev
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch products' }
    });
  }
});

// @desc    Get single product by slug or ID
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({
      success: false,
      error: { message: 'Product slug or ID is required' }
    });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: slug },
          { id: slug }
        ],
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            description: true,
            rating: true,
            isVerified: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          where: {
            isApproved: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
            wishlistItems: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Get related products (same category, different product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true
      },
      take: 4,
      include: {
        supplier: {
          select: {
            companyName: true,
            rating: true
          }
        }
      }
    });

    const productWithDetails = {
      ...product,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: product._count.reviews,
      wishlistCount: product._count.wishlistItems,
      relatedProducts,
      _count: undefined
    };

    res.json({
      success: true,
      data: { product: productWithDetails }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch product' }
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Supplier/Admin)
export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = validateRequest(createProductSchema, req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Validation failed', 
        details: validation.errors.issues 
      }
    });
  }

  const userId = req.user!.id;
  const userRole = req.user!.role;
  const productData = validation.data;

  try {
    // For suppliers, ensure they have a supplier profile
    let supplierId: string;
    
    if (userRole === 'SUPPLIER') {
      const supplierProfile = await prisma.supplierProfile.findUnique({
        where: { userId }
      });

      if (!supplierProfile) {
        return res.status(400).json({
          success: false,
          error: { message: 'Supplier profile required to create products' }
        });
      }
      supplierId = supplierProfile.id;
    } else if (userRole === 'ADMIN') {
      // Admin can specify supplierId or create for the first supplier
      supplierId = req.body.supplierId;
      if (!supplierId) {
        const firstSupplier = await prisma.supplierProfile.findFirst();
        if (!firstSupplier) {
          return res.status(400).json({
            success: false,
            error: { message: 'No supplier profiles found' }
          });
        }
        supplierId = firstSupplier.id;
      }
    } else {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.categoryId }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    // Generate unique slug
    let slug = slugify(productData.name, { lower: true, strict: true });
    let slugExists = await prisma.product.findUnique({ where: { slug } });
    let counter = 1;
    
    while (slugExists) {
      slug = `${slugify(productData.name, { lower: true, strict: true })}-${counter}`;
      slugExists = await prisma.product.findUnique({ where: { slug } });
      counter++;
    }

    // Check for duplicate SKU if provided
    if (productData.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: productData.sku }
      });
      
      if (existingSku) {
        return res.status(400).json({
          success: false,
          error: { message: 'SKU already exists' }
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        supplierId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            rating: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { product },
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create product' }
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Supplier owns product or Admin)
export const updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const productId = req.params.id;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const idValidation = validateRequest(validateId, productId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid product ID' }
    });
  }

  const validation = validateRequest(updateProductSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Validation failed', 
        details: validation.errors.issues 
      }
    });
  }

  const updateData = validation.data;

  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: {
          include: {
            user: true
          }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    // Access control: Suppliers can only update their own products
    if (userRole === 'SUPPLIER' && existingProduct.supplier.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only update your own products' }
      });
    }

    // Update slug if name is changed
    let updatedData = { ...updateData };
    if (updateData.name && updateData.name !== existingProduct.name) {
      let newSlug = slugify(updateData.name, { lower: true, strict: true });
      let slugExists = await prisma.product.findFirst({
        where: { 
          slug: newSlug,
          id: { not: productId }
        }
      });
      let counter = 1;
      
      while (slugExists) {
        newSlug = `${slugify(updateData.name, { lower: true, strict: true })}-${counter}`;
        slugExists = await prisma.product.findFirst({
          where: { 
            slug: newSlug,
            id: { not: productId }
          }
        });
        counter++;
      }
      
      updatedData.slug = newSlug;
    }

    // Check for duplicate SKU if provided
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findFirst({
        where: { 
          sku: updateData.sku,
          id: { not: productId }
        }
      });
      
      if (existingSku) {
        return res.status(400).json({
          success: false,
          error: { message: 'SKU already exists' }
        });
      }
    }

    // Verify category exists if categoryId is being updated
    if (updateData.categoryId && updateData.categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId }
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          error: { message: 'Category not found' }
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updatedData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            rating: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { product: updatedProduct },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update product' }
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Supplier owns product or Admin)
export const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const productId = req.params.id;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const idValidation = validateRequest(validateId, productId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid product ID' }
    });
  }

  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: {
          include: {
            user: true
          }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    // Access control: Suppliers can only delete their own products
    if (userRole === 'SUPPLIER' && existingProduct.supplier.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only delete your own products' }
      });
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete product' }
    });
  }
}); 