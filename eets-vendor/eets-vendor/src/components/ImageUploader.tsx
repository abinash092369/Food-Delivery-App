import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { cloudinaryApi } from '../api/cloudinary.api';
import { getLocalImage, saveLocalImage } from '../utils/imageFallback';
import axios from 'axios';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder: 'restaurant_logos' | 'restaurant_banners' | 'menu_items';
  label?: string;
  aspectRatio?: 'square' | 'video' | 'any';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  folder,
  label = 'Upload Image',
  aspectRatio = 'square',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // File validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Invalid file format. Allowed formats: jpg, jpeg, png, webp, gif');
      setSuccess(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum allowed is 10MB.');
      setSuccess(null);
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    console.log('[VENDOR_IMAGE_UPLOAD_START]', file.name);

    const uploadPreset = folder === 'restaurant_logos' 
      ? 'eets_logo' 
      : folder === 'restaurant_banners' 
        ? 'eets_banner' 
        : 'eets_thumb';

    // Fallback to local base64 storage
    const runFallback = () => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const localUrl = saveLocalImage(base64);
        console.log('[VENDOR_IMAGE_FALLBACK_BASE64_USED]', localUrl);
        onChange(localUrl);
        console.log('[VENDOR_IMAGE_FORM_STATE_UPDATED]', localUrl);
        setError('Local image preview only. Configure Cloudinary to show this image in customer app.');
        setSuccess(null);
        setIsUploading(false);
      };
      reader.onerror = (err) => {
        console.error('[VENDOR_IMAGE_FALLBACK_FAILED]', err);
        setError('Failed to read local file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    };

    // Try Cloudinary
    try {
      let secureUrl: string | null = null;
      const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const envUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      console.log('[VENDOR_IMAGE_CLOUDINARY_CONFIG]', { envCloudName, envUploadPreset });

      // 1. Try unsigned upload if env credentials are set
      if (envCloudName && envUploadPreset) {
        try {
          console.log('[VENDOR_IMAGE_CLOUDINARY_UNSIGNED_START]');
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', envUploadPreset);
          formData.append('folder', folder);

          const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${envCloudName}/image/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );

          if (res.data?.secure_url) {
            secureUrl = res.data.secure_url;
            console.log('[VENDOR_IMAGE_CLOUDINARY_SUCCESS] secure_url=' + secureUrl);
          }
        } catch (err: any) {
          console.warn('[VENDOR_IMAGE_CLOUDINARY_UNSIGNED_FAILED]', err.message || err);
        }
      }

      // 2. Try signed upload if unsigned didn't work/wasn't configured
      if (!secureUrl) {
        try {
          console.log('[VENDOR_IMAGE_CLOUDINARY_SIGNED_START]');
          const signRes = await cloudinaryApi.signUpload({
            folder,
          });

          if (signRes.success && signRes.data) {
            const { signature, timestamp, apiKey, cloudName, params } = signRes.data;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('signature', signature);
            if (params) {
              Object.entries(params).forEach(([k, v]) => {
                formData.append(k, v);
              });
            }

            const res = await axios.post(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (res.data?.secure_url) {
              secureUrl = res.data.secure_url;
              console.log('[VENDOR_IMAGE_CLOUDINARY_SUCCESS] secure_url=' + secureUrl);
            }
          }
        } catch (err: any) {
          console.warn('[VENDOR_IMAGE_CLOUDINARY_SIGNED_FAILED]', err.message || err);
        }
      }

      if (secureUrl) {
        onChange(secureUrl);
        console.log('[VENDOR_IMAGE_FORM_STATE_UPDATED]', secureUrl);
        setSuccess('Image uploaded successfully.');
        setError(null);
      } else {
        throw new Error('All Cloudinary upload attempts failed.');
      }
    } catch (err: any) {
      console.error('[VENDOR_IMAGE_CLOUDINARY_FAILED]', err.message || err);
      // Fallback to local storage
      runFallback();
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectClass = aspectRatio === 'square' 
    ? 'aspect-square max-w-[180px]' 
    : aspectRatio === 'video' 
      ? 'aspect-video w-full' 
      : 'aspect-[3/2] w-full';

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-semibold text-textMain">{label}</label>}
      
      <div 
        onClick={!isUploading ? handleUploadClick : undefined}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
          value 
            ? 'border-gray-200 hover:border-primary bg-gray-50' 
            : 'border-gray-300 hover:border-primary hover:bg-primary-light bg-surface'
        } ${aspectClass}`}
      >
        {value ? (
          <>
            <img 
              src={getLocalImage(value)} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform hover:scale-110"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 text-center space-y-2">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 mx-auto group-hover:text-primary transition-colors" />
            )}
            <div className="text-sm font-medium text-textMain">
              {isUploading ? 'Uploading...' : 'Click to Upload'}
            </div>
            <div className="text-xs text-mutedColor">
              JPEG, PNG, WEBP, GIF up to 10MB
            </div>
          </div>
        )}
      </div>

      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {error && (
        <div className="text-xs text-red-500 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-600 font-semibold">
          {success}
        </div>
      )}
    </div>
  );
};
