import { useState } from "react";

interface ShimmerImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Extra classes on the shimmer overlay */
  shimmerClassName?: string;
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
}: ShimmerImageProps) => {
  const [loaded, setLoaded] = useState(false);

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
        onLoad={() => setLoaded(true)}
      />
    </>
  );
};

export default ShimmerImage;
