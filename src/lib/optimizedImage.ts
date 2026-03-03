/**
 * Generates an optimized Supabase Storage image URL using the
 * Image Transformation API (render endpoint).
 *
 * Falls back to the original URL for non-Supabase images.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return "";

  // Only transform Supabase storage URLs
  const objectPath = "/storage/v1/object/public/";
  if (!url.includes(objectPath)) return url;

  const { width = 400, height, quality = 75 } = options;

  // Replace /object/public/ with /render/image/public/
  let transformed = url.replace(objectPath, "/storage/v1/render/image/public/");

  // Strip existing query params (like cache busters)
  const [base] = transformed.split("?");

  const params = new URLSearchParams();
  params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  params.set("resize", "cover");

  return `${base}?${params.toString()}`;
}

/** Preset sizes for common use cases */
export const IMAGE_SIZES = {
  /** Grid card thumbnail (half screen ~180px, 2x for retina) */
  gridThumb: { width: 360, quality: 70 },
  /** List thumbnail (56px, 2x for retina) */
  listThumb: { width: 112, quality: 70 },
  /** Small avatar or product orbit (52px, 2x) */
  smallAvatar: { width: 104, quality: 70 },
  /** Medium avatar (120px, 2x) */
  mediumAvatar: { width: 240, quality: 75 },
  /** Discover feed card image */
  discoverCard: { width: 400, quality: 72 },
  /** Discover feed product mini thumbs (36px, 2x) */
  miniThumb: { width: 72, quality: 65 },
  /** Full detail view */
  detail: { width: 800, quality: 80 },
  /** Creator avatar in feed (20px, 2x) */
  tinyAvatar: { width: 40, quality: 65 },
} as const;
