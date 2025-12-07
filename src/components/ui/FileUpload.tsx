import React, { useRef, useState } from 'react';
import { Upload, X, Image, Video } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: string; // URL of current file
  label?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = "image/*,video/*",
  maxSize = 10,
  currentFile,
  label = "Upload File",
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (file: File) => {
    setError('');
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }
    
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {currentFile ? (
        <div className="relative">
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            {isImage(currentFile) && (
              <div className="flex items-center space-x-3">
                <Image size={20} className="text-blue-600" />
                <span className="text-sm text-gray-700">Image uploaded</span>
              </div>
            )}
            {isVideo(currentFile) && (
              <div className="flex items-center space-x-3">
                <Video size={20} className="text-purple-600" />
                <span className="text-sm text-gray-700">Video uploaded</span>
              </div>
            )}
            {!isImage(currentFile) && !isVideo(currentFile) && (
              <div className="flex items-center space-x-3">
                <Upload size={20} className="text-gray-600" />
                <span className="text-sm text-gray-700">File uploaded</span>
              </div>
            )}
          </div>
          {onFileRemove && (
            <button
              onClick={onFileRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-gray-500">
            Max file size: {maxSize}MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};