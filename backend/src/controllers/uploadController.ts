import { Request, Response } from 'express';
import { storageService, uploadProductImage, uploadUserAvatar, uploadOrderDocument } from '../services/storageService';
import { z } from 'zod';

// Upload validation schemas
const uploadProductImageSchema = z.object({
  productId: z.string().uuid()
});

const uploadUserAvatarSchema = z.object({
  userId: z.string().uuid().optional()
});

const uploadOrderDocumentSchema = z.object({
  orderId: z.string().uuid()
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export class UploadController {
  /**
   * Upload product images
   * POST /api/upload/product-images
   */
  static async uploadProductImages(req: AuthenticatedRequest, res: Response) {
    try {
      // Validate request body
      const { productId } = uploadProductImageSchema.parse(req.body);
      
      // Check if user is supplier or admin
      if (!req.user || (req.user.role !== 'SUPPLIER' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Only suppliers and admins can upload product images',
            code: 'FORBIDDEN'
          }
        });
      }

      // Check if files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No files uploaded',
            code: 'NO_FILES'
          }
        });
      }

      const files = Array.isArray(req.files.images) 
        ? req.files.images 
        : req.files.images 
        ? [req.files.images] 
        : Object.values(req.files).flat();

      // Upload files
      const uploadPromises = files.map(async (file: any) => {
        const result = await uploadProductImage(
          file.data,
          file.name,
          file.mimetype,
          productId
        );
        
        return {
          originalName: file.name,
          ...result
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Check for failures
      const failures = uploadResults.filter(result => !result.success);
      const successes = uploadResults.filter(result => result.success);

      if (failures.length > 0 && successes.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'All uploads failed',
            code: 'UPLOAD_FAILED',
            details: failures
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          uploaded: successes.length,
          failed: failures.length,
          results: uploadResults,
          urls: successes.map(result => result.url)
        },
        message: `Uploaded ${successes.length} of ${uploadResults.length} files`
      });

    } catch (error) {
      console.error('Product image upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to upload product images',
          code: 'UPLOAD_ERROR'
        }
      });
    }
  }

  /**
   * Upload user avatar
   * POST /api/upload/avatar
   */
  static async uploadUserAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'UNAUTHORIZED'
          }
        });
      }

      // Check if file was uploaded
      if (!req.files || !req.files.avatar) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No avatar file uploaded',
            code: 'NO_FILE'
          }
        });
      }

      const file = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;

      // Upload avatar
      const result = await uploadUserAvatar(
        file.data,
        file.name,
        file.mimetype,
        userId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.error,
            code: 'UPLOAD_FAILED'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          url: result.url,
          path: result.path
        },
        message: 'Avatar uploaded successfully'
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to upload avatar',
          code: 'UPLOAD_ERROR'
        }
      });
    }
  }

  /**
   * Upload order documents
   * POST /api/upload/order-documents
   */
  static async uploadOrderDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      // Validate request body
      const { orderId } = uploadOrderDocumentSchema.parse(req.body);
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'UNAUTHORIZED'
          }
        });
      }

      // Check if files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No files uploaded',
            code: 'NO_FILES'
          }
        });
      }

      const files = Array.isArray(req.files.documents) 
        ? req.files.documents 
        : req.files.documents 
        ? [req.files.documents] 
        : Object.values(req.files).flat();

      // Upload files
      const uploadPromises = files.map(async (file: any) => {
        const result = await uploadOrderDocument(
          file.data,
          file.name,
          file.mimetype,
          orderId,
          userId
        );
        
        return {
          originalName: file.name,
          ...result
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Check for failures
      const failures = uploadResults.filter(result => !result.success);
      const successes = uploadResults.filter(result => result.success);

      if (failures.length > 0 && successes.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'All uploads failed',
            code: 'UPLOAD_FAILED',
            details: failures
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          uploaded: successes.length,
          failed: failures.length,
          results: uploadResults,
          urls: successes.map(result => result.url)
        },
        message: `Uploaded ${successes.length} of ${uploadResults.length} files`
      });

    } catch (error) {
      console.error('Order document upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to upload order documents',
          code: 'UPLOAD_ERROR'
        }
      });
    }
  }

  /**
   * Delete file
   * DELETE /api/upload/:bucket/:path
   */
  static async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket, path: filePath } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'UNAUTHORIZED'
          }
        });
      }

      // Validate bucket
      const allowedBuckets = ['product-images', 'user-avatars', 'order-documents'];
      if (!allowedBuckets.includes(bucket)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid storage bucket',
            code: 'INVALID_BUCKET'
          }
        });
      }

      // Check permissions
      if (req.user.role !== 'ADMIN') {
        // Users can only delete their own files
        if (bucket === 'user-avatars' && !filePath.includes(req.user.id)) {
          return res.status(403).json({
            success: false,
            error: {
              message: 'You can only delete your own files',
              code: 'FORBIDDEN'
            }
          });
        }
        
        if (bucket === 'product-images' && req.user.role !== 'SUPPLIER') {
          return res.status(403).json({
            success: false,
            error: {
              message: 'Only suppliers can delete product images',
              code: 'FORBIDDEN'
            }
          });
        }
      }

      const result = await storageService.deleteFile(bucket, filePath);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.error,
            code: 'DELETE_FAILED'
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('File delete error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete file',
          code: 'DELETE_ERROR'
        }
      });
    }
  }

  /**
   * List files
   * GET /api/upload/:bucket/list
   */
  static async listFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket } = req.params;
      const { folder, limit = '20', offset = '0' } = req.query;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'UNAUTHORIZED'
          }
        });
      }

      // Validate bucket
      const allowedBuckets = ['product-images', 'user-avatars', 'order-documents'];
      if (!allowedBuckets.includes(bucket)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid storage bucket',
            code: 'INVALID_BUCKET'
          }
        });
      }

      // Check permissions
      let folderPath = folder as string;
      if (req.user.role !== 'ADMIN') {
        if (bucket === 'user-avatars') {
          folderPath = `avatars/${req.user.id}`;
        } else if (bucket === 'order-documents') {
          // Users can only see their own order documents
          // This would need additional logic to verify order ownership
        }
      }

      const result = await storageService.listFiles(
        bucket,
        folderPath,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.error,
            code: 'LIST_FAILED'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          files: result.files,
          bucket,
          folder: folderPath,
          pagination: {
            limit: parseInt(limit as string, 10),
            offset: parseInt(offset as string, 10),
            total: result.files?.length || 0
          }
        }
      });

    } catch (error) {
      console.error('File list error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to list files',
          code: 'LIST_ERROR'
        }
      });
    }
  }

  /**
   * Get signed URL for private files
   * POST /api/upload/signed-url
   */
  static async getSignedUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket, path: filePath, expiresIn = 3600 } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'UNAUTHORIZED'
          }
        });
      }

      // Only allow signed URLs for order documents
      if (bucket !== 'order-documents') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Signed URLs only available for order documents',
            code: 'INVALID_BUCKET'
          }
        });
      }

      const result = await storageService.createSignedUrl(bucket, filePath, expiresIn);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.error,
            code: 'SIGNED_URL_FAILED'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          url: result.url,
          expiresIn
        }
      });

    } catch (error) {
      console.error('Signed URL error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate signed URL',
          code: 'SIGNED_URL_ERROR'
        }
      });
    }
  }

  /**
   * Get file info
   * GET /api/upload/:bucket/:path/info
   */
  static async getFileInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket, path: filePath } = req.params;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const result = await storageService.getFileInfo(bucket, filePath);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: {
            message: result.error,
            code: 'FILE_NOT_FOUND'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          file: result.info,
          publicUrl: storageService.getPublicUrl(bucket, filePath)
        }
      });

    } catch (error) {
      console.error('File info error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get file info',
          code: 'FILE_INFO_ERROR'
        }
      });
    }
  }
} 