/**
 * File upload service for handling image and document uploads
 */
import { api } from '../lib/api';

export interface UploadResponse {
  success: boolean;
  file_url: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface MultipleUploadResponse {
  uploaded: UploadResponse[];
  errors: Array<{ filename: string; error: string }>;
  total_uploaded: number;
  total_errors: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

class FileService {
  /**
   * Upload a single image file
   */
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Upload a single document file
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Upload multiple files at once
   */
  async uploadMultiple(files: File[]): Promise<MultipleUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/files/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Delete a file by its URL
   */
  async deleteFile(fileUrl: string): Promise<DeleteResponse> {
    const response = await api.delete('/files/file', {
      params: { file_url: fileUrl },
    });

    return response.data;
  }

  /**
   * Check if a file is an image based on its type
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Check if a file is a document based on its type
   */
  isDocumentFile(file: File): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return documentTypes.includes(file.type);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB`,
      };
    }

    if (!this.isImageFile(file) && !this.isDocumentFile(file)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload images (JPG, PNG, GIF, WebP) or documents (PDF, DOC, DOCX)',
      };
    }

    return { valid: true };
  }
}

export const fileService = new FileService();
