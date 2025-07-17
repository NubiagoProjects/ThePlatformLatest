import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { productQuerySchema, orderQuerySchema, validateRequest } from '../utils/validation';

const prisma = new PrismaClient();

// @desc    Get supplier's product performance metrics
// @route   GET /api/supplier/products
// @access  Private (Supplier only)
export const getSupplierProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  // Parse query parameters with validation
  const validation = validateRequest(productQuerySchema, req.query);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: { 
        message: 'Invalid query parameters', 
        details: validation.errors.issues 
      }
    });
    return;
  }

  const { page, limit, sortBy, sortOrder } = validation.data;
  const skip = (page - 1) * limit;

  try {
    // Get supplier profile
    const supplierProfile = await prisma.supplierProfile.findUnique({
      where: { userId },
      select: { id: true, companyName: true, rating: true }
    });

    if (!supplierProfile) {
      res.status(404).json({
        success: false,
        error: { message: 'Supplier profile not found' }
      });
      return;
    }

    const supplierId = supplierProfile.id;

    // Date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get products with performance metrics
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { supplierId },
        skip,
        take: limit,
        orderBy: sortBy === 'rating' 
          ? { reviews: { _count: sortOrder } }
          : { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          orderItems: {
            select: {
              quantity: true,
              totalPrice: true,
              createdAt: true,
              order: {
                select: {
                  status: true,
                  createdAt: true
                }
              }
            }
          },
          reviews: {
            select: {
              rating: true,
              createdAt: true
            }
          },
          wishlistItems: {
            select: {
              createdAt: true
            }
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true,
              wishlistItems: true
            }
          }
        }
      }),
      prisma.product.count({ where: { supplierId } })
    ]);

    // Calculate performance metrics for each product
    const productsWithMetrics = products.map(product => {
      // Sales metrics
      const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = product.orderItems
        .filter(item => ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(item.order.status))
        .reduce((sum, item) => sum + item.totalPrice, 0);

      // Recent sales (last 30 days)
      const recentSales = product.orderItems
        .filter(item => new Date(item.createdAt) >= thirtyDaysAgo)
        .reduce((sum, item) => sum + item.quantity, 0);

      // Recent sales (last 7 days)
      const weekSales = product.orderItems
        .filter(item => new Date(item.createdAt) >= sevenDaysAgo)
        .reduce((sum, item) => sum + item.quantity, 0);

      // Average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      // Views/Interest metric (using wishlist adds as proxy)
      const wishlistAdds = product._count.wishlistItems;

      // Performance score (combination of sales, rating, and interest)
      const performanceScore = (
        (totalSold * 0.4) + 
        (avgRating * 20 * 0.3) + 
        (wishlistAdds * 0.2) + 
        (recentSales * 0.1)
      );

      // Stock status
      const stockStatus = !product.trackQuantity 
        ? 'unlimited' 
        : product.quantity === 0 
          ? 'out_of_stock'
          : product.quantity <= 10 
            ? 'low_stock'
            : 'in_stock';

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        quantity: product.quantity,
        trackQuantity: product.trackQuantity,
        images: product.images,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category,
        metrics: {
          totalSold,
          totalRevenue,
          recentSales30Days: recentSales,
          recentSales7Days: weekSales,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: product._count.reviews,
          wishlistCount: wishlistAdds,
          performanceScore: Math.round(performanceScore * 10) / 10,
          stockStatus,
          conversionRate: wishlistAdds > 0 ? (totalSold / wishlistAdds * 100) : 0
        }
      };
    });

    // Overall supplier metrics
    const overallMetrics = {
      totalProducts: total,
      activeProducts: products.filter(p => p.isActive).length,
      totalSold: productsWithMetrics.reduce((sum, p) => sum + p.metrics.totalSold, 0),
      totalRevenue: productsWithMetrics.reduce((sum, p) => sum + p.metrics.totalRevenue, 0),
      averageRating: productsWithMetrics.length > 0 
        ? productsWithMetrics.reduce((sum, p) => sum + p.metrics.averageRating, 0) / productsWithMetrics.length 
        : 0,
      outOfStockProducts: productsWithMetrics.filter(p => p.metrics.stockStatus === 'out_of_stock').length,
      lowStockProducts: productsWithMetrics.filter(p => p.metrics.stockStatus === 'low_stock').length
    };

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        products: productsWithMetrics,
        metrics: overallMetrics,
        supplier: supplierProfile,
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
    console.error('Error fetching supplier products:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch supplier products' }
    });
  }
});

// @desc    Get supplier's order fulfillment metrics
// @route   GET /api/supplier/orders
// @access  Private (Supplier only)
export const getSupplierOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const validation = validateRequest(orderQuerySchema, req.query);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      error: { 
        message: 'Invalid query parameters', 
        details: validation.errors.issues 
      }
    });
    return;
  }

  const { page, limit, status, startDate, endDate } = validation.data;
  const skip = (page - 1) * limit;

  try {
    // Get supplier profile
    const supplierProfile = await prisma.supplierProfile.findUnique({
      where: { userId },
      select: { id: true, companyName: true }
    });

    if (!supplierProfile) {
      res.status(404).json({
        success: false,
        error: { message: 'Supplier profile not found' }
      });
      return;
    }

    // Build where clause for orders containing supplier's products
    const where: any = {
      orderItems: {
        some: {
          product: {
            supplierId: supplierProfile.id
          }
        }
      }
    };

    // Add filters
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get orders with supplier's products
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          orderItems: {
            where: {
              product: {
                supplierId: supplierProfile.id
              }
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  price: true
                }
              }
            }
          },
          shippingAddress: true
        }
      }),
      prisma.order.count({ where })
    ]);

    // Calculate fulfillment metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      recentOrdersCount,
      weeklyOrdersCount,
      averageProcessingTime,
      totalSupplierRevenue
    ] = await Promise.all([
      // Orders by status for this supplier
      prisma.order.count({
        where: {
          ...where,
          status: 'PENDING'
        }
      }),
      
      prisma.order.count({
        where: {
          ...where,
          status: 'PROCESSING'
        }
      }),
      
      prisma.order.count({
        where: {
          ...where,
          status: 'SHIPPED'
        }
      }),
      
      prisma.order.count({
        where: {
          ...where,
          status: 'DELIVERED'
        }
      }),
      
      // Recent orders (30 days)
      prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Weekly orders (7 days)
      prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      
      // Average processing time (from order to shipped)
      prisma.order.findMany({
        where: {
          ...where,
          status: { in: ['SHIPPED', 'DELIVERED'] },
          shippedAt: { not: null }
        },
        select: {
          createdAt: true,
          shippedAt: true
        }
      }),
      
      // Total revenue from supplier's products
      prisma.orderItem.aggregate({
        where: {
          product: { supplierId: supplierProfile.id },
          order: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
          }
        },
        _sum: { totalPrice: true }
      })
    ]);

    // Calculate average processing time in hours
    const avgProcessingHours = averageProcessingTime.length > 0
      ? averageProcessingTime.reduce((sum, order) => {
          if (order.shippedAt) {
            const diffMs = new Date(order.shippedAt).getTime() - new Date(order.createdAt).getTime();
            return sum + (diffMs / (1000 * 60 * 60)); // Convert to hours
          }
          return sum;
        }, 0) / averageProcessingTime.length
      : 0;

    // Orders with calculated metrics
    const ordersWithMetrics = orders.map(order => {
      const supplierItems = order.orderItems;
      const supplierTotal = supplierItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const supplierQuantity = supplierItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...order,
        supplierItems,
        supplierMetrics: {
          itemCount: supplierItems.length,
          totalQuantity: supplierQuantity,
          totalAmount: supplierTotal,
          percentage: order.totalAmount > 0 ? (supplierTotal / order.totalAmount * 100) : 0
        }
      };
    });

    // Overall fulfillment metrics
    const fulfillmentMetrics = {
      totalOrders: total,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      recentOrders30Days: recentOrdersCount,
      recentOrders7Days: weeklyOrdersCount,
      averageProcessingTimeHours: Math.round(avgProcessingHours * 10) / 10,
      totalRevenue: totalSupplierRevenue._sum.totalPrice || 0,
      fulfillmentRate: total > 0 ? ((shippedOrders + deliveredOrders) / total * 100) : 0,
      orderStatusBreakdown: {
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders
      }
    };

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        orders: ordersWithMetrics,
        metrics: fulfillmentMetrics,
        supplier: supplierProfile,
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
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch supplier orders' }
    });
  }
});

// @desc    Get supplier dashboard overview
// @route   GET /api/supplier/overview
// @access  Private (Supplier only)
export const getSupplierOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    // Get supplier profile
    const supplierProfile = await prisma.supplierProfile.findUnique({
      where: { userId },
      select: { 
        id: true, 
        companyName: true, 
        description: true,
        website: true,
        logo: true,
        isVerified: true,
        rating: true,
        createdAt: true
      }
    });

    if (!supplierProfile) {
      res.status(404).json({
        success: false,
        error: { message: 'Supplier profile not found' }
      });
      return;
    }

    const supplierId = supplierProfile.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousThirtyDays = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get overview metrics
    const [
      productCount,
      activeProductCount,
      totalOrders,
      recentOrders,
      previousOrders,
      totalRevenue,
      recentRevenue,
      previousRevenue,
      averageRating,
      pendingOrdersCount,
      lowStockProducts
    ] = await Promise.all([
      // Product metrics
      prisma.product.count({ where: { supplierId } }),
      prisma.product.count({ where: { supplierId, isActive: true } }),
      
      // Order metrics
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: { supplierId }
            }
          }
        }
      }),
      
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: { supplierId }
            }
          },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: { supplierId }
            }
          },
          createdAt: {
            gte: previousThirtyDays,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Revenue metrics
      prisma.orderItem.aggregate({
        where: {
          product: { supplierId },
          order: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
          }
        },
        _sum: { totalPrice: true }
      }),
      
      prisma.orderItem.aggregate({
        where: {
          product: { supplierId },
          order: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
            createdAt: { gte: thirtyDaysAgo }
          }
        },
        _sum: { totalPrice: true }
      }),
      
      prisma.orderItem.aggregate({
        where: {
          product: { supplierId },
          order: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
            createdAt: {
              gte: previousThirtyDays,
              lt: thirtyDaysAgo
            }
          }
        },
        _sum: { totalPrice: true }
      }),
      
      // Rating
      prisma.review.aggregate({
        where: {
          product: { supplierId }
        },
        _avg: { rating: true }
      }),
      
      // Pending orders
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              product: { supplierId }
            }
          },
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      }),
      
      // Low stock products
      prisma.product.count({
        where: {
          supplierId,
          isActive: true,
          trackQuantity: true,
          quantity: { lte: 10, gt: 0 }
        }
      })
    ]);

    // Calculate growth rates
    const orderGrowth = previousOrders > 0 
      ? ((recentOrders - previousOrders) / previousOrders * 100) 
      : 0;

    const revenueGrowth = (previousRevenue._sum.totalPrice || 0) > 0
      ? (((recentRevenue._sum.totalPrice || 0) - (previousRevenue._sum.totalPrice || 0)) / (previousRevenue._sum.totalPrice || 1) * 100)
      : 0;

    const overview = {
      supplier: supplierProfile,
      metrics: {
        products: {
          total: productCount,
          active: activeProductCount,
          lowStock: lowStockProducts,
          outOfStock: await prisma.product.count({
            where: {
              supplierId,
              isActive: true,
              trackQuantity: true,
              quantity: 0
            }
          })
        },
        orders: {
          total: totalOrders,
          recent30Days: recentOrders,
          previous30Days: previousOrders,
          pending: pendingOrdersCount,
          growth: orderGrowth
        },
        revenue: {
          total: totalRevenue._sum.totalPrice || 0,
          recent30Days: recentRevenue._sum.totalPrice || 0,
          previous30Days: previousRevenue._sum.totalPrice || 0,
          growth: revenueGrowth
        },
        performance: {
          averageRating: Math.round((averageRating._avg.rating || 0) * 10) / 10,
          rating: supplierProfile.rating,
          isVerified: supplierProfile.isVerified
        }
      }
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching supplier overview:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch supplier overview' }
    });
  }
}); 