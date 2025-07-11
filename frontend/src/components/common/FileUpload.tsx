import React, { useState, useRef } from 'react';
import { fileService, UploadResponse } from '../../services/files';
import { useToastContext } from './ToastProvider';

interface FileUploadProps {
  onUpload?: (response: UploadResponse) => void;
  acceptedTypes?: 'images' | 'documents' | 'all';
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  acceptedTypes = 'all',
  maxSizeMB = 5,
  multiple = false,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: showSuccess, error: showError } = useToastContext();

  const getAcceptAttribute = () => {
    switch (acceptedTypes) {
      case 'images':
        return 'image/*';
      case 'documents':
        return '.pdf,.doc,.docx';
      default:
        return 'image/*,.pdf,.doc,.docx';
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      const validation = fileService.validateFile(file, maxSizeMB);
      if (!validation.valid) {
        showError(validation.error || 'Invalid file');
        return;
      }
    }

    setUploading(true);

    try {
      if (multiple && fileArray.length > 1) {
        // Upload multiple files
        const response = await fileService.uploadMultiple(fileArray);
        
        if (response.total_errors > 0) {
          response.errors.forEach(error => {
            showError(`${error.filename}: ${error.error}`);
          });
        }
        
        if (response.total_uploaded > 0) {
          showSuccess(`Successfully uploaded ${response.total_uploaded} file(s)`);
          // Call onUpload for each successfully uploaded file
          response.uploaded.forEach(upload => {
            onUpload?.(upload);
          });
        }
      } else {
        // Upload single file
        const file = fileArray[0];
        let response: UploadResponse;
        
        if (fileService.isImageFile(file)) {
          response = await fileService.uploadImage(file);
        } else {
          response = await fileService.uploadDocument(file);
        }
        
        showSuccess('File uploaded successfully');
        onUpload?.(response);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showError(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'pointer-events-none opacity-50' : 'hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptAttribute()}
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-600">
                  Drop files here or <span className="text-blue-500 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {acceptedTypes === 'images' && 'Images only (JPG, PNG, GIF, WebP)'}
                  {acceptedTypes === 'documents' && 'Documents only (PDF, DOC, DOCX)'}
                  {acceptedTypes === 'all' && 'Images and documents supported'}
                  {maxSizeMB && ` • Max ${maxSizeMB}MB`}
                  {multiple && ' • Multiple files allowed'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
