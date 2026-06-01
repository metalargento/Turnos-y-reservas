import React, { useState, useRef } from 'react';
import { Alert, Button } from './index';

interface ImageUploaderProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  isLoading?: boolean;
  error?: string;
  maxSizeMB?: number;
}

export function ImageUploader({
  label = 'Imagen',
  value,
  onChange,
  onUpload,
  isLoading = false,
  error,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [localError, setLocalError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Solo se permiten imágenes (JPEG, PNG, WebP)';
    }
    if (file.size > MAX_SIZE) {
      return `El archivo no puede superar ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFileSelect = async (file: File) => {
    setLocalError('');

    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    try {
      setUploadProgress(0);
      const url = await onUpload(file);
      onChange(url);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err: any) {
      setLocalError(err.message || 'Error al subir imagen');
      setPreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const displayError = error || localError;

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!preview && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
        >
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            <p className="text-sm font-medium text-gray-900">Arrastra tu imagen aquí</p>
            <p className="text-xs text-gray-500">o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400">Máximo {maxSizeMB}MB • JPEG, PNG, WebP</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleInputChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {displayError && <Alert variant="error">{displayError}</Alert>}

      {/* Success */}
      {value && preview && (
        <Alert variant="success">Imagen cargada correctamente</Alert>
      )}
    </div>
  );
}
