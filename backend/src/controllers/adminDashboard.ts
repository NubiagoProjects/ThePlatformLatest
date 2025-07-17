import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { paginationSchema, validateRequest, validateId } from '../utils/validation';

const prisma = new PrismaClient();

// @desc    Get admin dashboard metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin only)
export const getAdminMetrics = asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Date ranges for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue metrics
    const [
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      last30DaysRevenue,
      previous30DaysRevenue
    ] = await Promise.all([
      // Total revenue from completed orders
      prisma.order.aggregate({
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED'] },
          paymentStatus: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      
      // This month revenue
      prisma.order.aggregate({
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED'] },
          paymentStatus: 'COMPLETED',
          createdAt: { gte: startOfThisMonth }
        },
        _sum: { totalAmount: true }
      }),
      
      // Last month revenue
      prisma.order.aggregate({
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED'] },
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        },
        _sum: { totalAmount: true }
      }),
      
      // Last 30 days revenue
      prisma.order.aggregate({
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED'] },
          paymentStatus: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { totalAmount: true }
      }),
      
      // Previous 30 days revenue (for comparison)
      prisma.order.aggregate({
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED'] },
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // User metrics
    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      newUsersLast30Days,
      activeUsers,
      supplierCount,
      adminCount
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // New users this month
      prisma.user.count({
        where: { createdAt: { gte: startOfThisMonth } }
      }),
      
      // New users last month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // New users last 30 days
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // Active users (users who placed orders in last 30 days)
      prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: { gte: thirtyDaysAgo }
            }
          }
        }
      }),
      
      // Supplier count
      prisma.user.count({
        where: { role: 'SUPPLIER' }
      }),
      
      // Admin count
      prisma.user.count({
        where: { role: 'ADMIN' }
      })
    ]);

    // Order metrics
    const [
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      ordersLast30Days,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      averageOrderValue
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      
      // Orders this month
      prisma.order.count({
        where: { createdAt: { gte: startOfThisMonth } }
      }),
      
      // Orders last month
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Orders last 30 days
      prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // Orders by status
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      
      // Average order value
      prisma.order.aggregate({
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] }
        },
        _avg: { totalAmount: true }
      })
    ]);

    // Product metrics
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      productsByCategory,
      topSellingProducts
    ] = await Promise.all([
      // Total products
      prisma.product.count(),
      
      // Active products
      prisma.product.count({ where: { isActive: true } }),
      
      // Out of stock products
      prisma.product.count({
        where: {
          isActive: true,
          trackQuantity: true,
          quantity: 0
        }
      }),
      
      // Products by category
      prisma.category.findMany({
        select: {
          name: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: {
          products: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // Top selling products (by order item quantity)
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Get product details for top selling
    const topSellingProductIds = topSellingProducts.map(item => item.productId);
    const topSellingProductDetails = await prisma.product.findMany({
      where: { id: { in: topSellingProductIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true
      }
    });

    // Combine top selling data
    const topSellingWithDetails = topSellingProducts.map(item => {
      const product = topSellingProductDetails.find(p => p.id === item.productId);
      return {
        ...product,
        totalSold: item._sum.quantity || 0
      };
    });

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue._sum.totalAmount 
      ? ((thisMonthRevenue._sum.totalAmount || 0) - (lastMonthRevenue._sum.totalAmount || 0)) / (lastMonthRevenue._sum.totalAmount || 1) * 100
      : 0;

    const revenue30DayGrowth = previous30DaysRevenue._sum.totalAmount
      ? ((last30DaysRevenue._sum.totalAmount || 0) - (previous30DaysRevenue._sum.totalAmount || 0)) / (previous30DaysRevenue._sum.totalAmount || 1) * 100
      : 0;

    const userGrowth = newUsersLastMonth
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : 0;

    const orderGrowth = ordersLastMonth
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
      : 0;

    // Response data
    const metrics = {
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        thisMonth: thisMonthRevenue._sum.totalAmount || 0,
        lastMonth: lastMonthRevenue._sum.totalAmount || 0,
        last30Days: last30DaysRevenue._sum.totalAmount || 0,
        growth: revenueGrowth,
        growth30Day: revenue30DayGrowth
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        newLast30Days: newUsersLast30Days,
        active: activeUsers,
        suppliers: supplierCount,
        admins: adminCount,
        growth: userGrowth,
        breakdown: {
          users: totalUsers - supplierCount - adminCount,
          suppliers: supplierCount,
          admins: adminCount
        }
      },
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        lastMonth: ordersLastMonth,
        last30Days: ordersLast30Days,
        growth: orderGrowth,
        averageValue: averageOrderValue._avg.totalAmount || 0,
        statusBreakdown: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        }
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
        categoryBreakdown: productsByCategory,
        topSelling: topSellingWithDetails
      },
      summary: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalUsers,
        totalOrders,
        totalProducts,
        averageOrderValue: averageOrderValue._avg.totalAmount || 0,
        conversionRate: totalUsers > 0 ? (activeUsers / totalUsers * 100) : 0
      }
    };

    res.json({
      success: true,
      data: { metrics }
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch admin metrics' }
    });
  }
});

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAdminUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validation = validateRequest(paginationSchema, _req.query);
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
  const { search, role, status } = _req.query;
  const skip = ((page ?? 1) -1 * (limit ?? 10));

  try {
    // Build where clause
    const where: any = {};

    // Search filter
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (role && typeof role === 'string') {
      where.role = role.toUpperCase();
    }

    // Status filter
    if (status && typeof status === 'string') {
      where.isActive = status === 'active';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit ?? 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          supplierProfile: {
            select: {
              id: true,
              companyName: true,
              isVerified: true,
              rating: true
            }
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              addresses: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / (limit ?? 10));
    const hasNext = (page ?? 1) < totalPages;
    const hasPrev = (page ?? 1) > 1;

    res.json({
      success: true,
      data: {
        users,
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
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch users' }
    });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = _req.params.id;
  const { role } = _req.body;

  const idValidation = validateRequest(validateId, userId);
  if (!idValidation.success) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid user ID' }
    });
    return;
  }

  // Validate role
  if (!role || !['USER', 'SUPPLIER', 'ADMIN'].includes(role)) {
    res.status(400).json({
      success: false,
      error: { message: 'Valid role is required (USER, SUPPLIER, ADMIN)' }
    });
    return;
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
      return;
    }

    // Prevent admin from changing their own role
    if (existingUser.id === _req.user!.id) {
      res.status(400).json({
        success: false,
        error: { message: 'Cannot change your own role' }
      });
      return;
    }

    // If changing to SUPPLIER, create supplier profile
    let supplierProfile = null;
    if (role === 'SUPPLIER' && existingUser.role !== 'SUPPLIER') {
      supplierProfile = await prisma.supplierProfile.create({
        data: {
          userId: userId,
          companyName: existingUser.name + ' Company', // Default company name
          description: 'Supplier profile created by admin'
        }
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
        supplierProfile: {
          select: {
            id: true,
            companyName: true,
            isVerified: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { 
        user: updatedUser,
        supplierProfile 
      },
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user role' }
    });
  }
});

// @desc    Get recent admin activities/logs
// @route   GET /api/admin/activities
// @access  Private (Admin only)
export const getAdminActivities = asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get recent orders, users, and products for activity feed
    const [recentOrders, recentUsers, recentProducts] = await Promise.all([
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      
      prisma.product.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          createdAt: true,
          supplier: {
            select: {
              companyName: true
            }
          }
        }
      })
    ]);

    // Format activities
    const activities = [
      ...recentOrders.map(order => ({
        type: 'order',
        title: `New Order #${order.orderNumber}`,
        description: `${order.user.name} placed an order worth $${order.totalAmount}`,
        timestamp: order.createdAt,
        status: order.status,
        amount: order.totalAmount
      })),
      
      ...recentUsers.map(user => ({
        type: 'user',
        title: `New User Registration`,
        description: `${user.name} (${user.email}) joined as ${user.role}`,
        timestamp: user.createdAt,
        role: user.role
      })),
      
      ...recentProducts.map(product => ({
        type: 'product',
        title: `New Product Added`,
        description: `${product.name} by ${product.supplier.companyName} - $${product.price}`,
        timestamp: product.createdAt,
        price: product.price
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 20);

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch admin activities' }
    });
  }
}); 