import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  updateUserProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  paginationSchema,
  validateRequest,
  validateId
} from '../utils/validation';

const prisma = new PrismaClient();

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        supplierProfile: {
          select: {
            id: true,
            companyName: true,
            description: true,
            website: true,
            logo: true,
            isVerified: true,
            rating: true
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlistItems: true,
            addresses: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user profile' }
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const validation = validateRequest(updateUserProfileSchema, req.body);
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update profile' }
    });
  }
});

// @desc    Get user addresses
// @route   GET /api/users/me/addresses
// @access  Private
export const getAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: { addresses }
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch addresses' }
    });
  }
});

// @desc    Create new address
// @route   POST /api/users/me/addresses
// @access  Private
export const createAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const validation = validateRequest(createAddressSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Validation failed', 
        details: validation.errors.issues 
      }
    });
  }

  const addressData = validation.data;

  try {
    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId
      }
    });

    res.status(201).json({
      success: true,
      data: { address },
      message: 'Address created successfully'
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create address' }
    });
  }
});

// @desc    Update address
// @route   PUT /api/users/me/addresses/:id
// @access  Private
export const updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const addressId = req.params.id;

  const idValidation = validateRequest(validateId, addressId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid address ID' }
    });
  }

  const validation = validateRequest(updateAddressSchema, req.body);
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
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: { message: 'Address not found' }
      });
    }

    // If this is set as default, unset other default addresses
    if (updateData.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId,
          isDefault: true,
          id: { not: addressId }
        },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData
    });

    res.json({
      success: true,
      data: { address: updatedAddress },
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update address' }
    });
  }
});

// @desc    Delete address
// @route   DELETE /api/users/me/addresses/:id
// @access  Private
export const deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const addressId = req.params.id;

  const idValidation = validateRequest(validateId, addressId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid address ID' }
    });
  }

  try {
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: { message: 'Address not found' }
      });
    }

    await prisma.address.delete({
      where: { id: addressId }
    });

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete address' }
    });
  }
});

// @desc    Get user's wishlist
// @route   GET /api/users/me/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const validation = validateRequest(paginationSchema, req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Invalid query parameters', 
        details: validation.errors.issues 
      }
    });
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
                  rating: true
                }
              },
              reviews: {
                select: {
                  rating: true
                }
              }
            }
          }
        }
      }),
      prisma.wishlistItem.count({ where: { userId } })
    ]);

    // Calculate average rating for each product
    const wishlistWithRating = wishlistItems.map(item => {
      const avgRating = item.product.reviews.length > 0
        ? item.product.reviews.reduce((sum, review) => sum + review.rating, 0) / item.product.reviews.length
        : 0;

      return {
        ...item,
        product: {
          ...item.product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: item.product.reviews.length,
          reviews: undefined
        }
      };
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        wishlistItems: wishlistWithRating,
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
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch wishlist' }
    });
  }
});

// @desc    Add product to wishlist
// @route   POST /api/users/me/wishlist
// @access  Private
export const addToWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.body;

  const idValidation = validateRequest(validateId, productId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid product ID' }
    });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    // Check if already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product already in wishlist' }
      });
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId
      },
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
                rating: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { wishlistItem },
      message: 'Product added to wishlist'
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add to wishlist' }
    });
  }
});

// @desc    Remove product from wishlist
// @route   DELETE /api/users/me/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const productId = req.params.productId;

  const idValidation = validateRequest(validateId, productId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid product ID' }
    });
  }

  try {
    const deletedItem = await prisma.wishlistItem.deleteMany({
      where: {
        userId,
        productId
      }
    });

    if (deletedItem.count === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found in wishlist' }
      });
    }

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove from wishlist' }
    });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = validateRequest(paginationSchema, req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Invalid query parameters', 
        details: validation.errors.issues 
      }
    });
  }

  const { page, limit } = validation.data;
  const skip = (page - 1) * limit;

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
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
              reviews: true
            }
          }
        }
      }),
      prisma.user.count()
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

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
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch users' }
    });
  }
});

// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin)
export const getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;

  const idValidation = validateRequest(validateId, userId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid user ID' }
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        supplierProfile: {
          select: {
            id: true,
            companyName: true,
            description: true,
            website: true,
            logo: true,
            isVerified: true,
            rating: true
          }
        },
        addresses: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlistItems: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user' }
    });
  }
});

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const { isActive } = req.body;

  const idValidation = validateRequest(validateId, userId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid user ID' }
    });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: { message: 'isActive must be a boolean value' }
    });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user status' }
    });
  }
}); 