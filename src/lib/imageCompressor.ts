import { isSupabaseConfigured, supabase } from './supabase';

export interface CompressedImageResult {
  imageUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

/**
 * Compresses an uploaded image on the client before storing or uploading.
 * Keeps photos lightweight (~35–85 KB) so students on weak mobile data can load posts quickly.
 */
export async function compressAndUploadImage(file: File): Promise<CompressedImageResult> {
  const dataUrlResult = await resizeImageToDataUrl(file, 960, 0.76);

  // When Supabase Storage is configured, upload the compressed blob to the public `post-images` bucket
  if (isSupabaseConfigured && supabase) {
    try {
      const response = await fetch(dataUrlResult.dataUrl);
      const blob = await response.blob();
      const extension = blob.type.includes('webp') ? 'webp' : 'jpg';
      const filePath = `juja/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

      const { error } = await supabase.storage
        .from('post-images')
        .upload(filePath, blob, { contentType: blob.type, upsert: false });

      if (!error) {
        const { data } = supabase.storage.from('post-images').getPublicUrl(filePath);
        if (data?.publicUrl) {
          return {
            imageUrl: data.publicUrl,
            sizeKb: dataUrlResult.sizeKb,
            width: dataUrlResult.width,
            height: dataUrlResult.height,
          };
        }
      }
    } catch {
      // Fall back to compressed inline data URL if bucket isn't created yet
    }
  }

  return {
    imageUrl: dataUrlResult.dataUrl,
    sizeKb: dataUrlResult.sizeKb,
    width: dataUrlResult.width,
    height: dataUrlResult.height,
  };
}

function resizeImageToDataUrl(
  file: File,
  maxWidth: number,
  quality: number
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser canvas compression is unavailable.'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Try WebP first for smallest payload on Android Chrome; fall back to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const approximateBytes = Math.round((dataUrl.length * 3) / 4);
        const sizeKb = Math.max(8, Math.round(approximateBytes / 1024));

        resolve({
          dataUrl,
          sizeKb,
          width: targetWidth,
          height: targetHeight,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
