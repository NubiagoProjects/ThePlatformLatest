import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createCategorySchema,
  updateCategorySchema,
  validateRequest,
  validateId
} from '../utils/validation';

const prisma = new PrismaClient();

// @desc    Get all categories with optional hierarchy
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { includeInactive = 'false', parentId, flat = 'false' } = req.query;

  const where: any = {};
  
  // Filter by active status
  if (includeInactive !== 'true') {
    where.isActive = true;
  }

  // Filter by parent category
  if (parentId === 'null') {
    where.parentId = null; // Root categories only
  } else if (parentId) {
    where.parentId = parentId as string;
  }

  try {
    if (flat === 'true') {
      // Flat list of categories
      const categories = await prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: { categories }
      });
    } else {
      // Hierarchical structure
      const rootCategories = await prisma.category.findMany({
        where: {
          ...where,
          parentId: null
        },
        orderBy: { name: 'asc' },
        include: {
          children: {
            where: where.isActive !== undefined ? { isActive: where.isActive } : {},
            orderBy: { name: 'asc' },
            include: {
              children: {
                where: where.isActive !== undefined ? { isActive: where.isActive } : undefined,
                orderBy: { name: 'asc' },
                include: {
                  _count: {
                    select: {
                      products: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  products: true,
                  children: true
                }
              }
            }
          },
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: { categories: rootCategories }
      });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch categories' }
    });
  }
});

// @desc    Get single category by slug or ID
// @route   GET /api/categories/:slug
// @access  Public
export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({
      success: false,
      error: { message: 'Category slug or ID is required' }
    });
  }

  try {
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: slug },
          { id: slug }
        ],
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                products: true
              }
            }
          }
        },
        products: {
          where: { isActive: true },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            supplier: {
              select: {
                companyName: true,
                rating: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch category' }
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = validateRequest(createCategorySchema, req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Validation failed', 
        details: validation.errors.issues 
      }
    });
  }

  const categoryData = validation.data;

  try {
    // Verify parent category exists if provided
    if (categoryData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
      });

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: { message: 'Parent category not found' }
        });
      }
    }

    // Generate unique slug
    let slug = slugify(categoryData.name, { lower: true, strict: true });
    let slugExists = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;
    
    while (slugExists) {
      slug = `${slugify(categoryData.name, { lower: true, strict: true })}-${counter}`;
      slugExists = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        ...categoryData,
        slug
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { category },
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create category' }
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categoryId = req.params.id;

  const idValidation = validateRequest(validateId, categoryId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid category ID' }
    });
  }

  const validation = validateRequest(updateCategorySchema, req.body);
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
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    // Verify parent category exists if provided and prevent circular reference
    if (updateData.parentId) {
      if (updateData.parentId === categoryId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Category cannot be its own parent' }
        });
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: updateData.parentId }
      });

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: { message: 'Parent category not found' }
        });
      }

      // Check for circular reference (simplified check for direct parent-child loop)
      const parentOfParent = await prisma.category.findFirst({
        where: {
          id: updateData.parentId,
          parentId: categoryId
        }
      });

      if (parentOfParent) {
        return res.status(400).json({
          success: false,
          error: { message: 'Circular reference detected' }
        });
      }
    }

    // Update slug if name is changed
    let updatedData = { ...updateData };
    if (updateData.name && updateData.name !== existingCategory.name) {
      let newSlug = slugify(updateData.name, { lower: true, strict: true });
      let slugExists = await prisma.category.findFirst({
        where: { 
          slug: newSlug,
          id: { not: categoryId }
        }
      });
      let counter = 1;
      
      while (slugExists) {
        newSlug = `${slugify(updateData.name, { lower: true, strict: true })}-${counter}`;
        slugExists = await prisma.category.findFirst({
          where: { 
            slug: newSlug,
            id: { not: categoryId }
          }
        });
        counter++;
      }
      
      updatedData.slug = newSlug;
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updatedData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { category: updatedCategory },
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update category' }
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categoryId = req.params.id;

  const idValidation = validateRequest(validateId, categoryId);
  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid category ID' }
    });
  }

  try {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: true,
        children: true
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Category not found' }
      });
    }

    // Check if category has products
    if (existingCategory.products.length > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: `Cannot delete category with ${existingCategory.products.length} products. Move or delete products first.` 
        }
      });
    }

    // Check if category has children
    if (existingCategory.children.length > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: `Cannot delete category with ${existingCategory.children.length} subcategories. Move or delete subcategories first.` 
        }
      });
    }

    // Soft delete by setting isActive to false
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete category' }
    });
  }
}); 