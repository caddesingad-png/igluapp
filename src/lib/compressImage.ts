/**
 * Compresses an image File using the Canvas API before upload.
 * - Max dimension: 1200px (mantém proporção)
 * - Prefers WebP (smaller), falls back to JPEG
 * - Quality: 0.82 (boa qualidade, ~70-80% menor que o original)
 */

const supportsWebP = (() => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
})();

export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const outputType = supportsWebP ? "image/webp" : "image/jpeg";
  const outputExt = supportsWebP ? ".webp" : ".jpg";

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      // White background for transparent PNGs
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, outputExt),
            { type: outputType, lastModified: Date.now() }
          );
          resolve(compressed);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
