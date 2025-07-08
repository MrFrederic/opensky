import React, { useState } from 'react';
import { FileUpload } from '../common/FileUpload';
import { UploadResponse } from '../../services/files';

export const FileUploadExample: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>([]);

  const handleFileUpload = (response: UploadResponse) => {
    setUploadedFiles(prev => [...prev, response]);
  };

  const handleDeleteFile = async (fileUrl: string) => {
    try {
      const { fileService } = await import('../../services/files');
      await fileService.deleteFile(fileUrl);
      setUploadedFiles(prev => prev.filter(file => file.file_url !== fileUrl));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">File Upload Demo</h2>
        
        {/* Single File Upload */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Upload Single File</h3>
          <FileUpload
            onUpload={handleFileUpload}
            acceptedTypes="all"
            maxSizeMB={10}
            multiple={false}
            className="mb-4"
          />
        </div>

        {/* Multiple File Upload */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Upload Multiple Files</h3>
          <FileUpload
            onUpload={handleFileUpload}
            acceptedTypes="all"
            maxSizeMB={5}
            multiple={true}
            className="mb-4"
          />
        </div>

        {/* Images Only Upload */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Upload Images Only</h3>
          <FileUpload
            onUpload={handleFileUpload}
            acceptedTypes="images"
            maxSizeMB={5}
            multiple={false}
            className="mb-4"
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {file.content_type.startsWith('image/') ? (
                      <img
                        src={file.file_url}
                        alt={file.filename}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{file.filename}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.content_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.file_url)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
