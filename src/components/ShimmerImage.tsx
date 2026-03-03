import { useState, useMemo } from "react";
import { ImageOff } from "lucide-react";

interface ShimmerImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Extra classes on the shimmer overlay */
  shimmerClassName?: string;
  /** Explicit width to prevent CLS */
  width?: number | string;
  /** Explicit height to prevent CLS */
  height?: number | string;
  /** Generate srcset for responsive sizes (Supabase storage only) */
  responsive?: boolean;
  /** Sizes attribute for responsive images */
  sizes?: string;
}

/**
 * Builds a srcset string for Supabase storage images using the render API.
 * Falls back gracefully if transforms aren't available.
 */
const buildSrcSet = (src: string): string | undefined => {
  // Only works for Supabase public storage URLs
  if (!src.includes("supabase.co/storage/v1/object/public/")) return undefined;
  const widths = [160, 320, 640, 960];
  return widths
    .map((w) => {
      const renderUrl = src.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      const separator = renderUrl.includes("?") ? "&" : "?";
      return `${renderUrl}${separator}width=${w}&resize=cover ${w}w`;
    })
    .join(", ");
};

/**
 * Image with gaussian-glow shimmer + blur placeholder.
 * Shows a luminous gradient animation until the image loads, then fades in.
 * Error state shows a subtle broken-image icon.
 */
const ShimmerImage = ({
  src,
  alt,
  className = "",
  style,
  shimmerClassName = "",
  width,
  height,
  responsive = false,
  sizes,
}: ShimmerImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const srcSet = useMemo(
    () => (responsive ? buildSrcSet(src) : undefined),
    [src, responsive]
  );

  if (error) {
    return (
      <div
        className={`absolute inset-0 bg-muted flex flex-col items-center justify-center gap-1 ${shimmerClassName}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-5 h-5 text-muted-foreground/30" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <>
      {/* Shimmer + blur placeholder */}
      {!loaded && (
        <div
          className={`absolute inset-0 img-shimmer ${shimmerClassName}`}
          aria-hidden="true"
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        />
      )}
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? (sizes || "(max-width: 640px) 50vw, 320px") : undefined}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        style={style}
        loading="lazy"
        decoding="async"
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );
};

export default ShimmerImage;
