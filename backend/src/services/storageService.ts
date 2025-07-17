import { supabase, supabaseAdmin, supabaseConfig } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

interface UploadOptions {
  bucket: string;
  folder?: string;
  filename?: string;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

interface FileValidation {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
}

export class StorageService {
  private static instance: StorageService;
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // File validation configurations
  private validationRules: Record<string, FileValidation> = {
    'product-images': {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    },
    'user-avatars': {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
    },
    'order-documents': {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
    }
  };

  /**
   * Validate file before upload
   */
  private validateFile(file: Buffer | Uint8Array, originalName: string, contentType: string, bucket: string): { valid: boolean; error?: string } {
    const rules = this.validationRules[bucket];
    
    if (!rules) {
      return { valid: false, error: 'Invalid storage bucket' };
    }

    // Check file size
    if (file.byteLength > rules.maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds ${rules.maxSize / (1024 * 1024)}MB limit` 
      };
    }

    // Check content type
    if (!rules.allowedTypes.includes(contentType)) {
      return { 
        valid: false, 
        error: `File type ${contentType} is not allowed. Allowed types: ${rules.allowedTypes.join(', ')}` 
      };
    }

    // Check file extension
    const extension = path.extname(originalName).toLowerCase();
    if (!rules.allowedExtensions.includes(extension)) {
      return { 
        valid: false, 
        error: `File extension ${extension} is not allowed. Allowed extensions: ${rules.allowedExtensions.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string, folder?: string): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0]; // First part of UUID for brevity
    const baseName = path.basename(originalName, extension).toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const fileName = `${timestamp}-${uuid}-${baseName}${extension}`;
    
    return folder ? `${folder}/${fileName}` : fileName;
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    file: Buffer | Uint8Array,
    originalName: string,
    contentType: string,
    options: UploadOptions,
    userId?: string
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, originalName, contentType, options.bucket);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file path
      const fileName = options.filename || this.generateFileName(originalName, options.folder);
      const filePath = userId && options.folder ? `${options.folder}/${userId}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(options.bucket)
        .upload(filePath, file, {
          contentType,
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert || false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path
      };

    } catch (error) {
      console.error('File upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Array<{
      buffer: Buffer | Uint8Array;
      originalName: string;
      contentType: string;
    }>,
    options: UploadOptions,
    userId?: string
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file.buffer, file.originalName, file.contentType, options, userId)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Storage delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('File delete error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(bucket: string, filePaths: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove(filePaths);

      if (error) {
        console.error('Storage bulk delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Bulk file delete error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bulk delete failed' 
      };
    }
  }

  /**
   * Get file URL
   */
  getPublicUrl(bucket: string, filePath: string): string {
    const { data } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Create signed URL for private files
   */
  async createSignedUrl(
    bucket: string, 
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, url: data.signedUrl };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create signed URL' 
      };
    }
  }

  /**
   * List files in bucket
   */
  async listFiles(
    bucket: string, 
    folder?: string, 
    limit: number = 100,
    offset: number = 0
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, files: data };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list files' 
      };
    }
  }

  /**
   * Move file to different location
   */
  async moveFile(
    bucket: string, 
    fromPath: string, 
    toPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to move file' 
      };
    }
  }

  /**
   * Copy file to different location
   */
  async copyFile(
    bucket: string, 
    fromPath: string, 
    toPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to copy file' 
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(
    bucket: string, 
    filePath: string
  ): Promise<{ success: boolean; info?: any; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const fileInfo = data.find(file => file.name === path.basename(filePath));
      
      if (!fileInfo) {
        return { success: false, error: 'File not found' };
      }

      return { success: true, info: fileInfo };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get file info' 
      };
    }
  }

  /**
   * Cleanup old files (utility function)
   */
  async cleanupOldFiles(
    bucket: string, 
    folder: string, 
    olderThanDays: number = 30
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data: files, error: listError } = await supabaseAdmin.storage
        .from(bucket)
        .list(folder);

      if (listError) {
        return { success: false, error: listError.message };
      }

      const filesToDelete = files
        .filter(file => new Date(file.created_at) < cutoffDate)
        .map(file => `${folder}/${file.name}`);

      if (filesToDelete.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      const { error: deleteError } = await supabaseAdmin.storage
        .from(bucket)
        .remove(filesToDelete);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true, deletedCount: filesToDelete.length };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cleanup failed' 
      };
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Helper functions for common upload scenarios
export const uploadProductImage = async (
  file: Buffer | Uint8Array,
  originalName: string,
  contentType: string,
  productId: string
): Promise<UploadResult> => {
  return storageService.uploadFile(file, originalName, contentType, {
    bucket: 'product-images',
    folder: `products/${productId}`,
    cacheControl: '86400' // 24 hours
  });
};

export const uploadUserAvatar = async (
  file: Buffer | Uint8Array,
  originalName: string,
  contentType: string,
  userId: string
): Promise<UploadResult> => {
  return storageService.uploadFile(file, originalName, contentType, {
    bucket: 'user-avatars',
    folder: 'avatars',
    cacheControl: '86400' // 24 hours
  }, userId);
};

export const uploadOrderDocument = async (
  file: Buffer | Uint8Array,
  originalName: string,
  contentType: string,
  orderId: string,
  userId: string
): Promise<UploadResult> => {
  return storageService.uploadFile(file, originalName, contentType, {
    bucket: 'order-documents',
    folder: `orders/${orderId}`,
    cacheControl: '3600' // 1 hour
  }, userId);
}; 