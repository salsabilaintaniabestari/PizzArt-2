import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onUploadSuccess: (imageUrl: string, fileId: string) => void;
  onUploadError?: (error: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!acceptedFormats.includes(file.type)) {
      const errorMsg = 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      const errorMsg = `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => {
          const result = fr.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-drive`;
      const token = localStorage.getItem('sb-auth-token');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          file: fileBase64,
          fileName: file.name,
          mimeType: file.type,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onUploadSuccess(result.publicUrl, result.fileId);
      } else {
        const errorMsg = result.error || 'Gagal mengupload gambar';
        setError(errorMsg);
        onUploadError?.(errorMsg);
        setPreview(null);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Terjadi kesalahan saat upload';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Mengupload gambar...</p>
              <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <Upload className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-gray-700 font-semibold mb-1">Klik untuk upload gambar</p>
              <p className="text-sm text-gray-500">
                JPG, PNG, atau WebP (Maks. {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Gagal Upload</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;