interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, only applies to jpeg output
}

/** فشرده‌سازی سمت مرورگر: کوچک کردن ابعاد بزرگ + خروجی JPEG با کیفیت بالا. PNG (به‌خاطر شفافیت) فقط ریسایز می‌شود. */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.82 } = options;

  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const ratio = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, outputType, outputType === 'image/jpeg' ? quality : undefined),
  );

  if (!blob || blob.size >= file.size) return file;

  const newName =
    outputType === 'image/jpeg' && !/\.jpe?g$/i.test(file.name)
      ? file.name.replace(/\.[^.]+$/, '') + '.jpg'
      : file.name;

  return new File([blob], newName, { type: outputType, lastModified: Date.now() });
}
