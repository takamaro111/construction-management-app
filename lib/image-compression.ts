import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1, // 最大1MB
    maxWidthOrHeight: 1920, // 最大幅/高さ 1920px
    useWebWorker: true,
    initialQuality: 0.8,
    ...options
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('画像圧縮エラー:', error);
    throw error;
  }
}

export async function generateThumbnail(
  file: File,
  maxSize: number = 300
): Promise<File> {
  const thumbnailOptions = {
    maxSizeMB: 0.1, // 最大100KB
    maxWidthOrHeight: maxSize,
    useWebWorker: true,
    initialQuality: 0.7
  };

  try {
    const thumbnail = await imageCompression(file, thumbnailOptions);
    return thumbnail;
  } catch (error) {
    console.error('サムネイル生成エラー:', error);
    throw error;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}