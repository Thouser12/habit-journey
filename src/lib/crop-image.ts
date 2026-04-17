interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crops the provided image file to the given pixel area (in source pixels),
 * resizes to `size` px and returns a compressed JPEG Blob.
 * If `pixelCrop` is omitted, center-crops the image to square.
 */
export async function cropImageToSquare(
  file: File | string,
  pixelCrop?: PixelCrop,
  size = 400
): Promise<Blob> {
  const src = typeof file === 'string' ? file : URL.createObjectURL(file);
  try {
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    const crop = pixelCrop ?? {
      x: (img.width - Math.min(img.width, img.height)) / 2,
      y: (img.height - Math.min(img.width, img.height)) / 2,
      width: Math.min(img.width, img.height),
      height: Math.min(img.width, img.height),
    };

    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image blob'));
        },
        'image/jpeg',
        0.9
      );
    });
  } finally {
    if (typeof file !== 'string') URL.revokeObjectURL(src);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
