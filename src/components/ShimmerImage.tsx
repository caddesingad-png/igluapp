import { useState } from "react";

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
}

/**
 * Image with gaussian-glow shimmer placeholder.
 * Shows a luminous gradient animation until the image loads, then fades in.
 */
const ShimmerImage = ({
  src,
  alt,
  className = "",
  style,
  shimmerClassName = "",
  width,
  height,
}: ShimmerImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`absolute inset-0 bg-muted flex items-center justify-center ${shimmerClassName}`}
        aria-label={alt}
      >
        <span className="text-muted-foreground/40 text-xs">!</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div
          className={`absolute inset-0 img-shimmer ${shimmerClassName}`}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
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
