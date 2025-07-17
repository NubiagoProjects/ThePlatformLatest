import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadResult,
  StorageReference,
} from 'firebase/storage';
import { storage } from './firebase';

// File upload interface
export interface UploadFileOptions {
  path: string;
  file: File;
  metadata?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
  };
}

// Image resize options
export interface ImageResizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class FirebaseStorageService {
  // Upload file
  async uploadFile(options: UploadFileOptions): Promise<string> {
    try {
      const { path, file, metadata } = options;
      const storageRef = ref(storage, path);
      
      const uploadResult: UploadResult = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files: UploadFileOptions[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new Error('Failed to upload files');
    }
  }

  // Delete file
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Delete multiple files
  async deleteMultipleFiles(paths: string[]): Promise<void> {
    try {
      const deletePromises = paths.map(path => this.deleteFile(path));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw new Error('Failed to delete files');
    }
  }

  // Get file URL
  async getFileURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }

  // List files in directory
  async listFiles(directoryPath: string): Promise<string[]> {
    try {
      const directoryRef = ref(storage, directoryPath);
      const result = await listAll(directoryRef);
      return result.items.map(item => item.fullPath);
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  // Upload product image
  async uploadProductImage(
    file: File,
    productId: string,
    imageIndex: number = 0
  ): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `products/${productId}/image_${imageIndex}.${fileExtension}`;
    
    return this.uploadFile({
      path: fileName,
      file,
      metadata: {
        contentType: file.type,
        customMetadata: {
          productId,
          imageIndex: imageIndex.toString(),
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  }

  // Upload user avatar
  async uploadUserAvatar(file: File, userId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatars/${userId}/avatar.${fileExtension}`;
    
    return this.uploadFile({
      path: fileName,
      file,
      metadata: {
        contentType: file.type,
        customMetadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  }

  // Upload category image
  async uploadCategoryImage(file: File, categoryId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `categories/${categoryId}/image.${fileExtension}`;
    
    return this.uploadFile({
      path: fileName,
      file,
      metadata: {
        contentType: file.type,
        customMetadata: {
          categoryId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  }

  // Upload supplier logo
  async uploadSupplierLogo(file: File, supplierId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `suppliers/${supplierId}/logo.${fileExtension}`;
    
    return this.uploadFile({
      path: fileName,
      file,
      metadata: {
        contentType: file.type,
        customMetadata: {
          supplierId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  }

  // Delete product images
  async deleteProductImages(productId: string): Promise<void> {
    try {
      const directoryPath = `products/${productId}`;
      const files = await this.listFiles(directoryPath);
      await this.deleteMultipleFiles(files);
    } catch (error) {
      console.error('Error deleting product images:', error);
      throw new Error('Failed to delete product images');
    }
  }

  // Delete user avatar
  async deleteUserAvatar(userId: string): Promise<void> {
    try {
      const directoryPath = `avatars/${userId}`;
      const files = await this.listFiles(directoryPath);
      await this.deleteMultipleFiles(files);
    } catch (error) {
      console.error('Error deleting user avatar:', error);
      throw new Error('Failed to delete user avatar');
    }
  }

  // Validate file type
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Validate file size
  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Generate optimized image URL (using Firebase Storage transformations)
  generateOptimizedImageURL(
    originalURL: string,
    options: ImageResizeOptions
  ): string {
    const url = new URL(originalURL);
    
    // Add transformation parameters
    if (options.width) {
      url.searchParams.set('w', options.width.toString());
    }
    if (options.height) {
      url.searchParams.set('h', options.height.toString());
    }
    if (options.quality) {
      url.searchParams.set('q', options.quality.toString());
    }
    if (options.format) {
      url.searchParams.set('f', options.format);
    }
    
    return url.toString();
  }

  // Get image variants for different sizes
  getImageVariants(originalURL: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  } {
    return {
      thumbnail: this.generateOptimizedImageURL(originalURL, { width: 150, height: 150, quality: 80 }),
      small: this.generateOptimizedImageURL(originalURL, { width: 300, height: 300, quality: 85 }),
      medium: this.generateOptimizedImageURL(originalURL, { width: 600, height: 600, quality: 90 }),
      large: this.generateOptimizedImageURL(originalURL, { width: 1200, height: 1200, quality: 95 }),
    };
  }
}

// Export singleton instance
export const storageService = new FirebaseStorageService();

// File validation constants
export const FILE_VALIDATION = {
  IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGE_SIZE_MB: 5,
  MAX_AVATAR_SIZE_MB: 2,
  MAX_PRODUCT_IMAGES: 10,
} as const; 