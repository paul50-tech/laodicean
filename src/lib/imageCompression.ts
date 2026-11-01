/**
 * Image compression and Supabase Storage upload utilities for Laodicean.
 * Specially designed for weak mobile data / campus Wi-Fi bundles (Juja / JKUAT).
 */

import { supabase } from './supabase';

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.78 for optimal balance of sharp text & tiny bytes)
}

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Calculates resized dimensions preserving aspect ratio within bounding limits.
 * Pure function for testing and predictability.
 */
export function calculateDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth = 1200,
  maxHeight = 1200
): { width: number; height: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: Math.max(1, maxWidth), height: Math.max(1, maxHeight) };
  }

  let { width, height } = { width: origWidth, height: origHeight };

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
}

/**
 * Formats byte counts into human-readable strings (e.g. "124 KB", "2.1 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculates percentage of bandwidth/data saved.
 */
export function calculateSavingsPercent(originalBytes: number, compressedBytes: number): number {
  if (originalBytes <= 0 || compressedBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
}

/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Automatically downscales large phone camera shots (often 4MB-12MB)
 * down to lightweight WebP/JPEG images (~80KB-200KB) with minimal visual degradation.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressedImageResult> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.78 } = options;

  // If in a non-browser environment (e.g., node tests), fallback safely
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      file,
      blob: file,
      previewUrl: '',
      originalSizeBytes: file.size,
      compressedSizeBytes: file.size,
      savingsPercent: 0,
      width: 0,
      height: 0,
      mimeType: file.type || 'image/jpeg',
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image into memory.'));

      img.onload = () => {
        try {
          const { width, height } = calculateDimensions(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            maxWidth,
            maxHeight
          );

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable.');
          }

          // Smooth resampling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP for high compression, fallback to JPEG
          const targetMime = 'image/webp';

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback to JPEG if browser doesn't support WebP canvas encoding
                canvas.toBlob(
                  (jpegBlob) => {
                    if (!jpegBlob) {
                      reject(new Error('Image encoding failed.'));
                      return;
                    }
                    finishCompression(jpegBlob, 'image/jpeg', '.jpg');
                  },
                  'image/jpeg',
                  quality
                );
                return;
              }
              finishCompression(blob, 'image/webp', '.webp');
            },
            targetMime,
            quality
          );

          function finishCompression(blob: Blob, mimeType: string, extension: string) {
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}${extension}`, {
              type: mimeType,
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);
            const savings = calculateSavingsPercent(file.size, blob.size);

            resolve({
              file: compressedFile,
              blob,
              previewUrl,
              originalSizeBytes: file.size,
              compressedSizeBytes: blob.size,
              savingsPercent: savings,
              width,
              height,
              mimeType,
            });
          }
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a compressed image to Supabase Storage in the 'posts' bucket.
 * Returns the public URL for the post.
 */
export async function uploadPostImage(
  fileOrBlob: File | Blob,
  userId: string,
  preferredName?: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  if (!supabase) {
    return {
      publicUrl: null,
      error: 'Supabase client is not connected. Check your environment settings.',
    };
  }

  try {
    const bucketName = 'posts';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileName = preferredName
      ? `${timestamp}_${preferredName}`
      : `${timestamp}_${randomSuffix}.webp`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileOrBlob, {
        cacheControl: '31536000', // 1 year cache for fast loading
        upsert: false,
        contentType: fileOrBlob.type || 'image/webp',
      });

    if (uploadError) {
      // Check if it's a bucket missing error
      if (
        uploadError.message.includes('bucket not found') ||
        uploadError.message.includes('The resource was not found')
      ) {
        return {
          publicUrl: null,
          error: `Storage bucket "${bucketName}" not found in Supabase. Please create a public bucket named "posts" in your Supabase Dashboard under Storage.`,
        };
      }
      return { publicUrl: null, error: uploadError.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      publicUrl: publicUrlData.publicUrl,
      error: null,
    };
  } catch (err: any) {
    return {
      publicUrl: null,
      error: err?.message || 'Failed to upload image.',
    };
  }
}
