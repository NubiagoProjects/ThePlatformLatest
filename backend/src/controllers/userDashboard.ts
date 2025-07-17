import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { orderQuerySchema, paginationSchema, validateRequest } from '../utils/validation';

const prisma = new PrismaClient();

// @desc    Get user's order history with details
// @route   GET /api/user/orders
// @access  Private (User only)
export const getUserOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    // Build where clause
    const where: any = { userId };

    // Add filters
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  price: true,
                  supplier: {
                    select: {
                      id: true,
                      companyName: true,
                      rating: true
                    }
                  }
                }
              }
            }
          },
          shippingAddress: true,
          billingAddress: true
        }
      }),
      prisma.order.count({ where })
    ]);

    // Add additional metrics to each order
    const ordersWithMetrics = orders.map(order => {
      const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
      const canReview = order.status === 'DELIVERED';
      const estimatedDelivery = order.shippedAt 
        ? new Date(new Date(order.shippedAt).getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days after shipped
        : null;

      return {
        ...order,
        metrics: {
          canCancel,
          canReview,
          estimatedDelivery,
          itemCount: order.orderItems.length,
          uniqueSuppliers: [...new Set(order.orderItems.map(item => item.product.supplier.companyName))].length
        }
      };
    });

    // Calculate user's order statistics
    const [
      totalSpent,
      totalOrdersCount,
      recentOrdersCount,
      favoriteCategories
    ] = await Promise.all([
      // Total amount spent
      prisma.order.aggregate({
        where: {
          userId,
          status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] }
        },
        _sum: { totalAmount: true }
      }),
      
      // Total orders
      prisma.order.count({ where: { userId } }),
      
      // Recent orders (last 30 days)
      prisma.order.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      
      // Favorite categories based on order history
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: { userId }
        },
        _sum: { quantity: true }
      })
    ]);

    // Get category data for favorite categories
    const productIds = favoriteCategories.map(item => item.productId);
    const categoryData = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Calculate category preferences
    const categoryStats = categoryData.reduce((acc: any, product) => {
      const categoryName = product.category.name;
      const orderItem = favoriteCategories.find(item => item.productId === product.id);
      const quantity = orderItem?._sum.quantity || 0;
      
      acc[categoryName] = (acc[categoryName] || 0) + quantity;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const orderSummary = {
      totalSpent: totalSpent._sum.totalAmount || 0,
      totalOrders: totalOrdersCount,
      recentOrders: recentOrdersCount,
      averageOrderValue: totalOrdersCount > 0 ? (totalSpent._sum.totalAmount || 0) / totalOrdersCount : 0,
      topCategories
    };

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        orders: ordersWithMetrics,
        summary: orderSummary,
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
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user orders' }
    });
  }
});

// @desc    Get user's wishlist with product details
// @route   GET /api/user/wishlist
// @access  Private (User only)
export const getUserWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const validation = validateRequest(paginationSchema, req.query);
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

  const { page, limit } = validation.data;
  const skip = (page - 1) * limit;

  try {
    const [wishlistItems, total] = await Promise.all([
      prisma.wishlistItem.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
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
              orderItems: {
                where: {
                  order: {
                    userId,
                    status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] }
                  }
                },
                select: {
                  quantity: true
                }
              },
              _count: {
                select: {
                  reviews: true,
                  wishlistItems: true
                }
              }
            }
          }
        }
      }),
      prisma.wishlistItem.count({ where: { userId } })
    ]);

    // Calculate metrics for each wishlist item
    const wishlistWithMetrics = wishlistItems.map(item => {
      const product = item.product;
      
      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      // Check if user has purchased this product before
      const hasPurchased = product.orderItems.length > 0;
      const totalPurchased = product.orderItems.reduce((sum, orderItem) => sum + orderItem.quantity, 0);

      // Stock status
      const stockStatus = !product.trackQuantity 
        ? 'unlimited' 
        : product.quantity === 0 
          ? 'out_of_stock'
          : product.quantity <= 10 
            ? 'low_stock'
            : 'in_stock';

      // Price comparison (if comparePrice exists)
      const hasDiscount = product.comparePrice && product.comparePrice > product.price;
      const discountPercentage = hasDiscount 
        ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
        : 0;

      return {
        id: item.id,
        createdAt: item.createdAt,
        product: {
          ...product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: product._count.reviews,
          wishlistCount: product._count.wishlistItems,
          metrics: {
            stockStatus,
            hasPurchased,
            totalPurchased,
            hasDiscount,
            discountPercentage,
            popularityScore: product._count.wishlistItems + product._count.reviews
          }
        }
      };
    });

    // Wishlist analytics
    const wishlistAnalytics = {
      totalItems: total,
      totalValue: wishlistWithMetrics.reduce((sum, item) => sum + item.product.price, 0),
      averagePrice: wishlistWithMetrics.length > 0 
        ? wishlistWithMetrics.reduce((sum, item) => sum + item.product.price, 0) / wishlistWithMetrics.length 
        : 0,
      categoriesCount: [...new Set(wishlistWithMetrics.map(item => item.product.category.name))].length,
      suppliersCount: [...new Set(wishlistWithMetrics.map(item => item.product.supplier.companyName))].length,
      inStockItems: wishlistWithMetrics.filter(item => item.product.metrics.stockStatus === 'in_stock').length,
      outOfStockItems: wishlistWithMetrics.filter(item => item.product.metrics.stockStatus === 'out_of_stock').length,
      discountedItems: wishlistWithMetrics.filter(item => item.product.metrics.hasDiscount).length
    };

    // Category breakdown
    const categoryBreakdown = wishlistWithMetrics.reduce((acc: any, item) => {
      const categoryName = item.product.category.name;
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        wishlistItems: wishlistWithMetrics,
        analytics: {
          ...wishlistAnalytics,
          topCategories
        },
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
    console.error('Error fetching user wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user wishlist' }
    });
  }
});

// @desc    Get user dashboard overview
// @route   GET /api/user/overview
// @access  Private (User only)
export const getUserOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get comprehensive user metrics
    const [
      userProfile,
      totalOrders,
      recentOrders,
      totalSpent,
      recentSpent,
      wishlistCount,
      addressCount,
      reviewCount,
      ordersByStatus,
      recentOrderItems,
      membershipDuration
    ] = await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      
      // Total orders
      prisma.order.count({ where: { userId } }),
      
      // Recent orders (30 days)
      prisma.order.count({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Total spent
      prisma.order.aggregate({
        where: {
          userId,
          status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] }
        },
        _sum: { totalAmount: true }
      }),
      
      // Recent spent (30 days)
      prisma.order.aggregate({
        where: {
          userId,
          status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { totalAmount: true }
      }),
      
      // Wishlist count
      prisma.wishlistItem.count({ where: { userId } }),
      
      // Address count
      prisma.address.count({ where: { userId } }),
      
      // Review count
      prisma.review.count({ where: { userId } }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true }
      }),
      
      // Recent order items for recommendations
      prisma.orderItem.findMany({
        where: {
          order: {
            userId,
            createdAt: { gte: oneYearAgo }
          }
        },
        include: {
          product: {
            select: {
              categoryId: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        take: 50
      }),
      
      // Membership duration
      userProfile?.createdAt ? Math.floor((now.getTime() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
    ]);

    if (!userProfile) {
      res.status(404).json({
        success: false,
        error: { message: 'User profile not found' }
      });
      return;
    }

    // Calculate shopping patterns
    const categoryPurchases = recentOrderItems.reduce((acc: any, item) => {
      const categoryName = item.product.category.name;
      acc[categoryName] = (acc[categoryName] || 0) + item.quantity;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryPurchases)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Order status breakdown
    const statusBreakdown = ordersByStatus.reduce((acc: any, item) => {
      acc[item.status.toLowerCase()] = item._count.status;
      return acc;
    }, {});

    // Calculate user tier based on spending
    const totalSpentAmount = totalSpent._sum.totalAmount || 0;
    let userTier = 'Bronze';
    if (totalSpentAmount >= 10000) userTier = 'Platinum';
    else if (totalSpentAmount >= 5000) userTier = 'Gold';
    else if (totalSpentAmount >= 1000) userTier = 'Silver';

    // Recent activity summary
    const recentActivity = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        orderItems: {
          take: 1,
          select: {
            product: {
              select: {
                name: true,
                images: true
              }
            }
          }
        }
      }
    });

    const overview = {
      profile: userProfile,
      metrics: {
        orders: {
          total: totalOrders,
          recent30Days: recentOrders,
          statusBreakdown
        },
        spending: {
          total: totalSpentAmount,
          recent30Days: recentSpent._sum.totalAmount || 0,
          averageOrderValue: totalOrders > 0 ? totalSpentAmount / totalOrders : 0
        },
        engagement: {
          wishlistItems: wishlistCount,
          addresses: addressCount,
          reviews: reviewCount,
          membershipDays: membershipDuration
        },
        preferences: {
          topCategories,
          userTier
        }
      },
      recentActivity,
      recommendations: {
        needsProfile: !userProfile.phone || !userProfile.avatar,
        needsAddress: addressCount === 0,
        hasWishlist: wishlistCount > 0,
        shouldReview: statusBreakdown.delivered > reviewCount
      }
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching user overview:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user overview' }
    });
  }
});

// @desc    Get user's purchase history analytics
// @route   GET /api/user/analytics
// @access  Private (User only)
export const getUserAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get monthly spending for the last 12 months
    const monthlySpending = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        createdAt: { gte: oneYearAgo }
      },
      _sum: { totalAmount: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month
    const monthlyData = monthlySpending.reduce((acc: any, order) => {
      const month = new Date(order.createdAt).toISOString().slice(0, 7); // YYYY-MM format
      acc[month] = (acc[month] || 0) + (order._sum.totalAmount || 0);
      return acc;
    }, {});

    // Generate last 12 months data
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      last12Months.push({
        month: monthName,
        amount: monthlyData[monthKey] || 0
      });
    }

    // Category spending analysis
    const categorySpending = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId,
          status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
          createdAt: { gte: oneYearAgo }
        }
      },
      _sum: { totalPrice: true }
    });

    // Get category details
    const productIds = categorySpending.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });

    const categoryTotals = products.reduce((acc: any, product) => {
      const categoryName = product.category.name;
      const spending = categorySpending.find(item => item.productId === product.id);
      const amount = spending?._sum.totalPrice || 0;
      
      acc[categoryName] = (acc[categoryName] || 0) + amount;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([name, amount]) => ({ name, amount }));

    res.json({
      success: true,
      data: {
        monthlySpending: last12Months,
        categorySpending: topCategories,
        totalSpentLastYear: Object.values(monthlyData).reduce((sum: number, amount) => sum + (amount as number), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user analytics' }
    });
  }
}); 