import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
  validateRequest,
  validateId
} from '../utils/validation';

const prisma = new PrismaClient();

// Helper function to generate order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}${random}`;
};

// Helper function to calculate order totals
const calculateOrderTotals = (items: Array<{ price: number; quantity: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const shippingAmount = subtotal >= 50 ? 0 : 9.99; // Free shipping over $50
  const totalAmount = subtotal + taxAmount + shippingAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};

// @desc    Get user orders with pagination and filtering
// @route   GET /api/orders
// @access  Private
export const getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const validation = validateRequest(orderQuerySchema, req.query);
  
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
    status,
    startDate,
    endDate,
    userId: filterUserId,
    supplierId
  } = validation.data;

  const skip = (page - 1) * limit;

  // Build where clause based on user role
  const where: any = {};

  if (userRole === 'USER') {
    // Users can only see their own orders
    where.userId = userId;
  } else if (userRole === 'SUPPLIER') {
    // Suppliers can see orders containing their products
    where.orderItems = {
      some: {
        product: {
          supplier: {
            userId: userId
          }
        }
      }
    };
  } else if (userRole === 'ADMIN') {
    // Admins can see all orders, with optional filters
    if (filterUserId) {
      where.userId = filterUserId;
    }
    if (supplierId) {
      where.orderItems = {
        some: {
          product: {
            supplierId: supplierId
          }
        }
      };
    }
  }

  // Status filter
  if (status) {
    where.status = status;
  }

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  try {
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
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  supplier: {
                    select: {
                      id: true,
                      companyName: true
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

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        orders,
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
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch orders' }
    });
  }
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orderId = req.params.id;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const idValidation = validateRequest(validateId, orderId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid order ID' }
    });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            product: {
              include: {
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
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    // Access control
    if (userRole === 'USER' && order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only view your own orders' }
      });
    }

    if (userRole === 'SUPPLIER') {
      // Check if supplier has products in this order
      const hasSupplierProducts = order.orderItems.some(item => 
        item.product.supplier.id === userId
      );
      
      if (!hasSupplierProducts) {
        return res.status(403).json({
          success: false,
          error: { message: 'You can only view orders containing your products' }
        });
      }
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch order' }
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Users)
export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const validation = validateRequest(createOrderSchema, req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Validation failed', 
        details: validation.errors.issues 
      }
    });
  }

  const { items, shippingAddressId, billingAddressId, paymentMethod, notes } = validation.data;

  try {
    // Verify shipping address belongs to user
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId: userId
      }
    });

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid shipping address' }
      });
    }

    // Verify billing address if provided
    let billingAddress = null;
    if (billingAddressId) {
      billingAddress = await prisma.address.findFirst({
        where: {
          id: billingAddressId,
          userId: userId
        }
      });

      if (!billingAddress) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid billing address' }
        });
      }
    }

    // Fetch products and validate availability
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'One or more products not found or inactive' }
      });
    }

    // Check stock availability and build order items
    const orderItems = [];
    const itemsWithPrices = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          error: { message: `Product not found: ${item.productId}` }
        });
      }

      if (product.trackQuantity && product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: { 
            message: `Insufficient stock for product: ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` 
          }
        });
      }

      const totalPrice = product.price * item.quantity;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        totalPrice
      });

      itemsWithPrices.push({
        price: product.price,
        quantity: item.quantity
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(itemsWithPrices);

    // Generate unique order number
    let orderNumber: string;
    let orderNumberExists = true;
    
    while (orderNumberExists) {
      orderNumber = generateOrderNumber();
      const existing = await prisma.order.findUnique({
        where: { orderNumber }
      });
      orderNumberExists = !!existing;
    }

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: orderNumber!,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          shippingAmount: totals.shippingAmount,
          totalAmount: totals.totalAmount,
          paymentMethod,
          shippingAddressId,
          billingAddressId,
          notes,
          orderItems: {
            createMany: {
              data: orderItems
            }
          }
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true
                }
              }
            }
          },
          shippingAddress: true,
          billingAddress: true
        }
      });

      // Update product quantities
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.trackQuantity) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      // Clear user's cart items for purchased products
      await tx.cartItem.deleteMany({
        where: {
          userId,
          productId: { in: productIds }
        }
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      data: { order },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create order' }
    });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Supplier/Admin)
export const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orderId = req.params.id;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const idValidation = validateRequest(validateId, orderId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid order ID' }
    });
  }

  const validation = validateRequest(updateOrderStatusSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Validation failed', 
        details: validation.errors.issues 
      }
    });
  }

  const { status, trackingNumber, notes } = validation.data;

  try {
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                supplier: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    // Access control for suppliers
    if (userRole === 'SUPPLIER') {
      const hasSupplierProducts = existingOrder.orderItems.some(item => 
        item.product.supplier.user.id === userId
      );
      
      if (!hasSupplierProducts) {
        return res.status(403).json({
          success: false,
          error: { message: 'You can only update orders containing your products' }
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Set timestamps based on status
    if (status === 'SHIPPED' && !existingOrder.shippedAt) {
      updateData.shippedAt = new Date();
    }

    if (status === 'DELIVERED' && !existingOrder.deliveredAt) {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = 'COMPLETED';
    }

    if (status === 'CONFIRMED') {
      updateData.paymentStatus = 'COMPLETED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true
      }
    });

    res.json({
      success: true,
      data: { order: updatedOrder },
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update order status' }
    });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (User owns order or Admin)
export const cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orderId = req.params.id;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const idValidation = validateRequest(validateId, orderId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid order ID' }
    });
  }

  try {
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    // Access control: Users can only cancel their own orders
    if (userRole === 'USER' && existingOrder.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only cancel your own orders' }
      });
    }

    // Check if order can be cancelled
    if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order cannot be cancelled in current status' }
      });
    }

    // Cancel order and restore inventory in a transaction
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
          updatedAt: new Date()
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true
                }
              }
            }
          },
          shippingAddress: true,
          billingAddress: true
        }
      });

      // Restore product quantities
      for (const item of existingOrder.orderItems) {
        if (item.product.trackQuantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }
      }

      return updatedOrder;
    });

    res.json({
      success: true,
      data: { order: cancelledOrder },
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel order' }
    });
  }
}); 