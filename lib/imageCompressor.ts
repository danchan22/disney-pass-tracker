import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.3, // Target ~300KB max
    maxWidthOrHeight: 1600, // Keeps high-res grid details sharp
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed, falling back to original:', error);
    return file;
  }
}
